#!/usr/bin/env node
// gmail-apply-batch — orchestrator helpers for batch applies.
//
// Three modes (parent agent drives the chunk loop for true mid-batch autofix):
//
// 1) --plan [N] [--chunk SIZE] [--force] [--experimental|--experimental-succ] [--autofix] [--dry-run]
//    Compute eligible queue, write run_dir + profile.json, return chunks list.
//    No worker spawned. Stdout JSON: { ok, run_id, run_dir, total_urls, chunks: [[u,...],...], profile: {...}, opts }.
//    With --dry-run: same output, no run_dir created.
//
// 2) --run-chunk --urls=u1,u2 --run-id=<id> [--force] [--experimental|--experimental-succ] [--verbose]
//    Spawn ONE haiku worker for the given URLs. Worker uses the static system prompt.
//    Worker task message includes profile data + CV path so external-ATS handover works.
//    Stdout JSON: { ok, chunk_results, applied_candidates, autofix_candidates, usage }.
//    Updates data/applications.md statuses for the URLs processed in this chunk.
//
// 3) --retry-chunk same as --run-chunk but logically marked as a retry pass.
//
// Eligibility rules (--plan):
//   - status in {Evaluated, Auto-Match}
//   - URL host matches a recipe in config/gmail-apply-portals.yml
//
// Outputs:
//   data/batch-runs/<run_id>/{ledger.ndjson, steps.ndjson, evidence/, profile.json}
//   data/applications.md updated incrementally per --run-chunk
//   data/gmail-apply-errors.ndjson appended (cross-run forensic)

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { connect as netConnect } from 'node:net';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const APPS_PATH = resolve(REPO_ROOT, 'data/applications.md');
const PORTALS_PATH = resolve(REPO_ROOT, 'config/gmail-apply-portals.yml');
const PROFILE_PATH = resolve(REPO_ROOT, 'config/profile.yml');
const WORKER_PROMPT_PATH = resolve(REPO_ROOT, 'scripts/gmail-apply-worker-prompt.md');
const ERROR_LOG = resolve(REPO_ROOT, 'data/gmail-apply-errors.ndjson');
const MCP_CONFIG = resolve(REPO_ROOT, '.mcp.json');
const CV_REL = 'assets/cv/CV_www.ArshiaHemati.com_EN.pdf';
const CV_PATH = resolve(REPO_ROOT, CV_REL);

const DEFAULT_CHUNK = 2;

function log(msg) { process.stderr.write(`[batch] ${msg}\n`); }

// -- arg parsing -------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const has = f => args.includes(f);
  const valOf = f => {
    const eq = args.find(a => a.startsWith(`${f}=`));
    if (eq) return eq.slice(f.length + 1);
    const idx = args.indexOf(f);
    return idx >= 0 ? args[idx + 1] : null;
  };
  const mode =
    has('--plan')        ? 'plan' :
    has('--run-chunk')   ? 'run-chunk' :
    has('--retry-chunk') ? 'retry-chunk' :
    'plan'; // default: be helpful, show queue

  const force = has('--force');
  const dryRun = has('--dry-run');
  const verbose = has('--verbose');
  const experimentalSucc = has('--experimental-succ');
  const experimental = experimentalSucc || has('--experimental');
  const autofix = has('--autofix');
  if (autofix && !experimental) {
    // autofix needs evidence files
    log('--autofix without --experimental: enabling --experimental implicitly');
  }
  const experimentalEffective = experimental || autofix;

  const chunkSize = (() => {
    const v = valOf('--chunk');
    return v && /^\d+$/.test(v) ? parseInt(v, 10) : DEFAULT_CHUNK;
  })();
  const limitArg = args.find((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--chunk');
  const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
  const runId = valOf('--run-id');
  const urlsCsv = valOf('--urls');
  const urlsSep = valOf('--urls-sep') || ',';
  const chunkIndexRaw = valOf('--chunk-index');
  const chunkIndex = chunkIndexRaw && /^\d+$/.test(chunkIndexRaw) ? parseInt(chunkIndexRaw, 10) : null;
  let urls = urlsCsv ? urlsCsv.split(urlsSep).map(s => s.trim()).filter(Boolean) : [];
  if (urls.length === 0 && runId && chunkIndex !== null) {
    const planPath = resolve(REPO_ROOT, 'data/batch-runs', runId, 'plan.json');
    if (existsSync(planPath)) {
      const plan = JSON.parse(readFileSync(planPath, 'utf8'));
      urls = (plan.chunks || [])[chunkIndex] || [];
    }
  }

  return {
    mode, force, dryRun, verbose,
    experimental: experimentalEffective,
    experimentalSucc, autofix,
    chunkSize, limit, runId, urls, chunkIndex,
  };
}

// -- portals + apps ----------------------------------------------------------

function loadPortals() {
  return (yaml.load(readFileSync(PORTALS_PATH, 'utf8')).portals || []);
}

function matchPortal(url, portals) {
  for (const p of portals) {
    if ((p.match || []).some(m => url.includes(m))) return p;
  }
  return null;
}

function parseAppsTable(md) {
  const rows = [];
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    if (line.includes('---')) continue;
    if (line.includes('# |')) continue;
    const cells = line.split('|').map(c => c.trim());
    if (cells.length < 10) continue;
    const num = cells[1];
    if (!/^\d+$/.test(num)) continue;
    const reportMatch = cells[8].match(/\(([^)]+)\)/);
    rows.push({
      num,
      date: cells[2],
      company: cells[3],
      role: cells[4],
      score: cells[5],
      status: cells[6],
      pdf: cells[7],
      reportPath: reportMatch ? reportMatch[1] : null,
      notes: cells[9],
      raw: line,
    });
  }
  return rows;
}

function extractUrlForRow(row) {
  if (row.notes) {
    const m = row.notes.match(/URL:\s*(https?:\/\/\S+)/);
    if (m) return m[1].replace(/[)>\],.;]+$/, '');
  }
  if (row.reportPath) {
    const full = resolve(REPO_ROOT, row.reportPath);
    if (existsSync(full)) {
      const content = readFileSync(full, 'utf8');
      const m = content.match(/\*\*URL:\*\*\s*(\S+)/);
      if (m) return m[1];
    }
  }
  return null;
}

// Map url → applications.md row num. Same lookup logic as eligibility.
function buildUrlRowIndex() {
  const apps = parseAppsTable(readFileSync(APPS_PATH, 'utf8'));
  const idx = new Map(); // url → { num, status, company, role }
  for (const row of apps) {
    const url = extractUrlForRow(row);
    if (!url) continue;
    if (!idx.has(url)) idx.set(url, { num: row.num, status: row.status, company: row.company, role: row.role });
  }
  return idx;
}

// -- ledger ------------------------------------------------------------------

function appendLedger(runDir, entry) {
  const p = resolve(runDir, 'ledger.ndjson');
  appendFileSync(p, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
}

function appendErrorLog(entry) {
  try {
    mkdirSync(dirname(ERROR_LOG), { recursive: true });
    appendFileSync(ERROR_LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch {}
}

// -- profile load + projection ----------------------------------------------

// Project a small subset of profile.yml into the worker task prompt. The
// worker uses these for external-ATS handover via chrome-devtools MCP. Keep
// it short — these get repeated in every spawn's task message.
function loadProfileForWorker() {
  const cfg = yaml.load(readFileSync(PROFILE_PATH, 'utf8'));
  const c = cfg.candidate || {};
  const fullName = c.full_name || '';
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');
  return {
    full_name: fullName,
    first_name: firstName || '',
    last_name: lastName || '',
    email: c.email || '',
    phone: c.phone || '',
    location: c.location || '',
    plz: c.plz || '',
    linkedin: c.linkedin || '',
    portfolio_url: c.portfolio_url || '',
    github: c.github || '',
    cv_path_relative: CV_REL,
    cv_path_absolute: CV_PATH,
  };
}

// -- worker spawn ------------------------------------------------------------

async function spawnWorker({ urls, force, experimental, experimentalSucc, runId, verbose, profile, isRetry }) {
  const flagsForScript = [
    force && '--force',
    experimental && '--experimental',
    `--run-id=${runId}`,
  ].filter(Boolean).join(' ');
  const taskList = urls.map((u, i) => `${i + 1}. ${u}`).join('\n');

  const profileBlock = `EXTERNAL_PROFILE (use these values when redirected to an external ATS):
- full_name: ${profile.full_name}
- first_name: ${profile.first_name}
- last_name: ${profile.last_name}
- email: ${profile.email}
- phone: ${profile.phone}
- location: ${profile.location}
- linkedin: ${profile.linkedin}
- portfolio_url: ${profile.portfolio_url}
- github: ${profile.github}
- CV file (absolute path, use with mcp__chrome-devtools__upload_file): ${profile.cv_path_absolute}`;

  const experimentalNote = experimental
    ? `EXPERIMENTAL: per-step ndjson + DOM evidence are written by the script automatically under data/batch-runs/${runId}/. Echo evidence_path in each result. ${experimentalSucc ? 'experimental-succ is on — orchestrator will validate every Applied via evidence; do not lie about success, log doubts via phase:"escalation" and downgrade to AutoApplyFailed when in doubt.' : ''}`
    : '';

  const taskPrompt = [
    `Process these ${urls.length} URL${urls.length > 1 ? 's' : ''}${isRetry ? ' (RETRY pass — yaml may have been patched since last attempt)' : ''} sequentially.`,
    `For each, run \`node scripts/gmail-apply.mjs <URL> ${flagsForScript}\`.`,
    `If the script's JSON has redirect.detected=true → switch to External ATS handover (see system prompt section).`,
    `Otherwise, on submitted_unconfirmed/failure, follow scripts/escalation-ladder.md.`,
    `URLs:\n${taskList}`,
    profileBlock,
    experimentalNote,
    `Return JSON only — schema in system prompt. No prose.`,
  ].filter(Boolean).join('\n\n');

  // No --max-turns / no worker timeout; let the worker take as long as it
  // needs. Caps reintroduced after we observe real-run behavior.
  const args = [
    '-p',
    '--model', 'haiku',
    '--allowedTools', 'Bash,Read,Write,Edit,Grep,Glob,mcp__chrome-devtools__*',
    '--disallowedTools', 'Agent,WebSearch,WebFetch',
    '--system-prompt-file', WORKER_PROMPT_PATH,
    '--strict-mcp-config',
    '--mcp-config', MCP_CONFIG,
    '--output-format', 'stream-json',
    '--verbose',
  ];

  // Haiku context window (constant; surfaced by the CLI's `init` event under
  // `model: claude-haiku-4-5-*`).
  const CONTEXT_WINDOW = 200_000;
  const NEAR_LIMIT = 140_000; // 70% — warn early so we can cut chunk size BEFORE compact.

  return await new Promise(resolveP => {
    const child = spawn('claude', args, {
      cwd: REPO_ROOT,
      shell: process.platform === 'win32',
    });
    child.stdin.write(taskPrompt);
    child.stdin.end();

    let stdoutBuf = '';
    let stderrBuf = '';
    let finalAssistantText = null;
    let usage = null;
    let sessionId = null;

    // -- token telemetry state ---------------------------------------------
    // Per-turn input = cache_read + cache_creation + input_tokens. This is a
    // proxy for "context size at this turn" — when the model auto-compacts,
    // the next turn's input drops sharply (history gets summarized).
    let turnCount = 0;
    let peakInput = 0;            // max single-turn input across the session
    let prevTurnInput = 0;        // for compact heuristic
    let totalOutput = 0;
    const turnSeries = [];        // [{turn, input, output, ts}] for ledger
    const compactions = [];       // [{turn, ts, kind, prev_input, this_input, evidence}]

    // -- per-URL boundaries ------------------------------------------------
    // We don't get explicit "URL N starts" markers. Detect by watching for a
    // Bash tool_use whose command runs `node scripts/gmail-apply.mjs <URL>`.
    // Each detected URL boundary captures the input watermark BEFORE its
    // turn so we can compute delta later.
    const urlSpans = urls.map(u => ({
      url: u,
      first_turn: null, last_turn: null,
      input_at_start: null, input_at_end: null,
      peak_input_during: 0,
      output_at_start: null, output_at_end: null,
    }));
    const urlIndexMap = new Map(urls.map((u, i) => [u, i]));
    let currentUrlIdx = -1;

    function logTelemetry() {
      const headroomFromPeak = CONTEXT_WINDOW - peakInput;
      appendLedger(resolve(REPO_ROOT, 'data/batch-runs', runId), {
        event: 'chunk_token_telemetry',
        turns: turnCount,
        peak_input: peakInput,
        peak_pct_of_window: Math.round((peakInput / CONTEXT_WINDOW) * 100),
        headroom_from_peak: headroomFromPeak,
        near_limit: peakInput >= NEAR_LIMIT,
        total_output: totalOutput,
        compactions_observed: compactions.length,
        url_spans: urlSpans.map(s => ({
          url: s.url,
          first_turn: s.first_turn, last_turn: s.last_turn,
          input_at_start: s.input_at_start, input_at_end: s.input_at_end,
          peak_input_during: s.peak_input_during,
          output_during: (s.output_at_end ?? totalOutput) - (s.output_at_start ?? 0),
        })),
      });
      if (peakInput >= NEAR_LIMIT) {
        appendErrorLog({
          phase: 'context_near_limit',
          run_id: runId,
          peak_input: peakInput,
          peak_pct_of_window: Math.round((peakInput / CONTEXT_WINDOW) * 100),
          threshold_pct: Math.round((NEAR_LIMIT / CONTEXT_WINDOW) * 100),
          urls,
          warning: 'haiku worker peaked at >=70% of 200k context window — cut --chunk size on the next batch run; compact risk rising',
        });
      }
      for (const c of compactions) {
        appendErrorLog({
          phase: 'worker_compaction',
          run_id: runId,
          turn: c.turn,
          kind: c.kind,
          prev_input: c.prev_input,
          this_input: c.this_input,
          evidence: c.evidence,
          urls,
          warning: 'auto-compact observed inside worker — context summarization happened, possible loss of escalation context',
        });
      }
    }

    child.stdout.on('data', d => {
      stdoutBuf += d.toString();
      let nl;
      while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
        const line = stdoutBuf.slice(0, nl);
        stdoutBuf = stdoutBuf.slice(nl + 1);
        if (!line.trim()) continue;
        let evt;
        try { evt = JSON.parse(line); } catch { continue; }

        // --- Compact detection via explicit system events --------------
        // The Claude Code CLI emits `system` events around auto-compact.
        // Subtype names are "compact_started" / "compact_boundary" /
        // similar in current versions; match defensively on any
        // "compact"-bearing subtype OR the same word inside the event
        // payload.
        if (evt.type === 'system') {
          const sub = (evt.subtype || '').toLowerCase();
          if (/compact/.test(sub)) {
            compactions.push({
              turn: turnCount,
              ts: new Date().toISOString(),
              kind: `system_event:${evt.subtype}`,
              prev_input: prevTurnInput,
              this_input: null,
              evidence: { event_subtype: evt.subtype },
            });
            if (verbose) process.stderr.write(`[worker] !! compact event: ${evt.subtype}\n`);
          }
        }

        if (verbose) {
          if (evt.type === 'assistant' && evt.message?.content) {
            for (const block of evt.message.content) {
              if (block.type === 'tool_use') {
                const inp = block.input || {};
                const summary = inp.command
                  ? inp.command.slice(0, 100)
                  : (inp.url || inp.pageId || inp.function?.slice?.(0, 80) || '');
                process.stderr.write(`[worker] ${block.name} ${summary}\n`);
              }
            }
          }
          if (evt.type === 'user' && evt.message?.content) {
            for (const block of evt.message.content) {
              if (block.type === 'tool_result' && block.is_error) {
                const txt = (Array.isArray(block.content) ? block.content[0]?.text : block.content) || '';
                process.stderr.write(`[worker]   ↳ error: ${String(txt).slice(0, 200)}\n`);
              }
            }
          }
        }

        if (evt.type === 'assistant' && evt.message?.content) {
          // Detect URL boundary from Bash tool_use → `node scripts/gmail-apply.mjs <URL> ...`
          for (const block of evt.message.content) {
            if (block.type === 'text' && block.text) finalAssistantText = block.text;
            if (block.type === 'tool_use' && block.name === 'Bash') {
              const cmd = block.input?.command || '';
              // Match URL in either quoted or bare form.
              const m = cmd.match(/gmail-apply\.mjs\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
              const url = m ? (m[1] || m[2] || m[3]) : null;
              if (url) {
                const cleaned = url.replace(/[)>\],.;]+$/, '');
                const idx = urlIndexMap.get(cleaned) ?? urlIndexMap.get(url);
                if (idx !== undefined) {
                  currentUrlIdx = idx;
                  const span = urlSpans[idx];
                  if (span.first_turn === null) {
                    span.first_turn = turnCount + 1;
                    span.input_at_start = prevTurnInput;
                    span.output_at_start = totalOutput;
                  }
                }
              }
            }
          }

          // Capture per-turn usage (this is the model's view of context size)
          const u = evt.message.usage;
          if (u) {
            turnCount++;
            const combinedInput = (u.cache_read_input_tokens || 0)
                                + (u.cache_creation_input_tokens || 0)
                                + (u.input_tokens || 0);
            const out = u.output_tokens || 0;
            totalOutput += out;
            turnSeries.push({ turn: turnCount, input: combinedInput, output: out });

            // Compact heuristic: if this turn's input dropped >40% from
            // peak so far AND we already had >50k context, the model
            // likely auto-compacted. The explicit system-event detector
            // above is more reliable when present; this is a fallback.
            if (peakInput > 50_000 && combinedInput < peakInput * 0.6) {
              compactions.push({
                turn: turnCount,
                ts: new Date().toISOString(),
                kind: 'input_drop_heuristic',
                prev_input: peakInput,
                this_input: combinedInput,
                evidence: { ratio: +(combinedInput / peakInput).toFixed(2) },
              });
              if (verbose) process.stderr.write(`[worker] !! input drop ${peakInput} → ${combinedInput} (likely compact)\n`);
            }

            peakInput = Math.max(peakInput, combinedInput);
            prevTurnInput = combinedInput;

            if (currentUrlIdx >= 0) {
              const span = urlSpans[currentUrlIdx];
              span.last_turn = turnCount;
              span.input_at_end = combinedInput;
              span.output_at_end = totalOutput;
              span.peak_input_during = Math.max(span.peak_input_during, combinedInput);
            }
          }
        }
        if (evt.type === 'result') {
          usage = evt.usage || usage;
          sessionId = evt.session_id || sessionId;
          if (typeof evt.result === 'string') finalAssistantText = evt.result;
        }
      }
    });

    child.stderr.on('data', d => { stderrBuf += d.toString(); });

    child.on('close', (code, signal) => {
      const diag = {
        exit_code: code,
        signal,
        stdout_tail: stdoutBuf.slice(-800),
        stderr_tail: stderrBuf.slice(-800),
      };

      const telemetry = {
        turns: turnCount,
        peak_input: peakInput,
        peak_pct_of_window: Math.round((peakInput / CONTEXT_WINDOW) * 100),
        near_limit: peakInput >= NEAR_LIMIT,
        total_output: totalOutput,
        compactions,
        url_spans: urlSpans.map(s => ({
          url: s.url,
          first_turn: s.first_turn, last_turn: s.last_turn,
          input_at_start: s.input_at_start, input_at_end: s.input_at_end,
          peak_input_during: s.peak_input_during,
          output_during: (s.output_at_end ?? totalOutput) - (s.output_at_start ?? 0),
        })),
      };

      // Always write telemetry — even on parse failure — so we can diagnose.
      try { logTelemetry(); } catch {}

      if (!finalAssistantText) {
        return resolveP({ ok: false, err: 'no final assistant text', diag, usage, telemetry });
      }
      let result;
      try { result = JSON.parse(finalAssistantText); }
      catch {
        const m = finalAssistantText.match(/\{[\s\S]*\}/);
        if (m) {
          try { result = JSON.parse(m[0]); }
          catch { return resolveP({ ok: false, err: 'worker output not JSON', text: finalAssistantText.slice(0, 400), diag, usage, telemetry }); }
        } else {
          return resolveP({ ok: false, err: 'worker output not JSON', text: finalAssistantText.slice(0, 400), diag, usage, telemetry });
        }
      }
      resolveP({ ok: true, result, usage, session_id: sessionId, diag, telemetry });
    });

    child.on('error', e => resolveP({ ok: false, err: `spawn error: ${e.message}` }));
  });
}

// -- statuses rewrite (per-chunk, idempotent) -------------------------------

function rewriteAppsForUrls(urlToStatus) {
  const md = readFileSync(APPS_PATH, 'utf8');
  const lines = md.split('\n');
  const apps = parseAppsTable(md);
  const numToStatus = new Map();
  for (const row of apps) {
    const u = extractUrlForRow(row);
    if (u && urlToStatus.has(u)) numToStatus.set(row.num, urlToStatus.get(u));
  }
  const updated = [];
  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('# |')) {
      updated.push(line);
      continue;
    }
    const cells = line.split('|').map(c => c.trim());
    if (cells.length < 10) { updated.push(line); continue; }
    const num = cells[1];
    if (!/^\d+$/.test(num)) { updated.push(line); continue; }
    const newStatus = numToStatus.get(num);
    if (!newStatus) { updated.push(line); continue; }
    cells[6] = newStatus;
    updated.push('| ' + cells.slice(1, -1).join(' | ') + ' |');
  }
  writeFileSync(APPS_PATH, updated.join('\n'));
  return numToStatus.size;
}

// Find an existing recent run_dir whose plan was created with the same opts
// AND whose ledger has only the `plan` event (no chunks executed). Reuse it
// instead of writing a new orphan dir.
//
// "Same opts" compares the boolean / numeric / limit flags that affect the
// chunk plan; flags that only affect downstream behavior aren't compared.
function findReusableRunDir(opts, maxAgeMs = 30 * 60 * 1000) {
  const root = resolve(REPO_ROOT, 'data/batch-runs');
  if (!existsSync(root)) return null;
  const cutoff = Date.now() - maxAgeMs;
  let best = null;
  let bestMtime = 0;
  for (const name of readdirSync(root)) {
    const dir = resolve(root, name);
    let st;
    try { st = statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    if (st.mtimeMs < cutoff) continue;
    const planPath = resolve(dir, 'plan.json');
    const ledgerPath = resolve(dir, 'ledger.ndjson');
    if (!existsSync(planPath) || !existsSync(ledgerPath)) continue;
    let prevPlan;
    try { prevPlan = JSON.parse(readFileSync(planPath, 'utf8')); } catch { continue; }
    const o = prevPlan.opts || {};
    const sameOpts =
      o.mode === opts.mode &&
      !!o.force === !!opts.force &&
      !!o.experimental === !!opts.experimental &&
      !!o.experimentalSucc === !!opts.experimentalSucc &&
      !!o.autofix === !!opts.autofix &&
      (o.chunkSize ?? 2) === opts.chunkSize &&
      ((o.limit === null || o.limit === undefined || o.limit === Infinity) ===
        (opts.limit === Infinity));
    if (!sameOpts) continue;
    let onlyPlanEvent = true;
    for (const line of readFileSync(ledgerPath, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        if (e.event && e.event !== 'plan') { onlyPlanEvent = false; break; }
      } catch {}
    }
    if (!onlyPlanEvent) continue;
    if (st.mtimeMs > bestMtime) { best = { runId: name, runDir: dir, plan: prevPlan }; bestMtime = st.mtimeMs; }
  }
  return best;
}

// =========================================================================
// MODE 1 — --plan: build queue, return chunks, no work done.
// =========================================================================

function modePlan(opts) {
  const portals = loadPortals();
  const apps = parseAppsTable(readFileSync(APPS_PATH, 'utf8'));
  const eligible = new Set(['Evaluated', 'Auto-Match']);
  const candidates = [];
  for (const row of apps) {
    if (!eligible.has(row.status)) continue;
    const url = extractUrlForRow(row);
    if (!url) continue;
    const portal = matchPortal(url, portals);
    if (!portal) continue;
    candidates.push({
      num: row.num, company: row.company, role: row.role,
      status: row.status, url, portal: portal.name,
    });
  }
  // Dedup
  const seen = new Set();
  const dedup = [];
  for (const c of candidates) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    dedup.push(c);
  }
  const queue = dedup.slice(0, opts.limit);
  const chunks = [];
  for (let i = 0; i < queue.length; i += opts.chunkSize) {
    chunks.push(queue.slice(i, i + opts.chunkSize).map(c => c.url));
  }

  const portalCounts = queue.reduce((acc, c) => ({ ...acc, [c.portal]: (acc[c.portal] || 0) + 1 }), {});
  const statusCounts = queue.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {});

  let runId = null, runDir = null;
  let reused = false;
  if (!opts.dryRun && queue.length > 0) {
    // Try to reuse a recent unstarted plan with same opts to avoid orphan
    // run_dirs from accidental re-plans.
    const reuse = findReusableRunDir(opts);
    if (reuse && Array.isArray(reuse.plan.chunks)
        && reuse.plan.total_urls === queue.length
        && JSON.stringify(reuse.plan.chunks) === JSON.stringify(chunks)) {
      runId = reuse.runId;
      runDir = reuse.runDir;
      reused = true;
      log(`reusing prior plan run_id=${runId} (no chunks executed yet, opts + queue match)`);
    } else {
      runId = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '-' + randomUUID().slice(0, 8);
      runDir = resolve(REPO_ROOT, 'data/batch-runs', runId);
      mkdirSync(resolve(runDir, 'evidence'), { recursive: true });
      const profile = loadProfileForWorker();
      writeFileSync(resolve(runDir, 'profile.json'), JSON.stringify(profile, null, 2));
      writeFileSync(resolve(runDir, 'plan.json'), JSON.stringify({
        ts: new Date().toISOString(), opts, total_urls: queue.length, chunks, queue,
      }, null, 2));
      appendLedger(runDir, { event: 'plan', total_urls: queue.length, chunks: chunks.length, opts });
    }
  }

  console.log(JSON.stringify({
    ok: true,
    mode: 'plan',
    run_id: runId,
    run_dir: runDir,
    reused,
    dry_run: opts.dryRun,
    total_urls: queue.length,
    chunk_count: chunks.length,
    chunk_size: opts.chunkSize,
    portal_counts: portalCounts,
    status_counts: statusCounts,
    chunks,
    preview: queue.slice(0, 10).map(c => `${c.num} [${c.status}] ${c.company} (${c.portal})`),
    cv_path: CV_PATH,
    flags: {
      force: opts.force,
      experimental: opts.experimental,
      experimental_succ: opts.experimentalSucc,
      autofix: opts.autofix,
    },
  }, null, 2));
}

// Fast pre-flight: is the user-launched Chrome reachable on its CDP port?
// If not, the worker will spawn (~$0.5, ~30s) just to discover the same
// connection failure on every URL. Bail BEFORE spawning.
function probeCdpReachable({ host = 'localhost', port = 9222, timeoutMs = 1000 } = {}) {
  return new Promise(resolveP => {
    const sock = netConnect({ host, port });
    let done = false;
    const finish = ok => { if (done) return; done = true; try { sock.destroy(); } catch {} resolveP(ok); };
    sock.once('connect', () => finish(true));
    sock.once('error', () => finish(false));
    setTimeout(() => finish(false), timeoutMs);
  });
}

// =========================================================================
// MODE 2 / 3 — --run-chunk / --retry-chunk: process given URLs.
// =========================================================================

async function modeRunChunk(opts) {
  if (!opts.runId) {
    console.error('--run-id is required for --run-chunk / --retry-chunk');
    process.exit(2);
  }
  if (opts.urls.length === 0) {
    console.error('--urls=u1,u2 is required for --run-chunk / --retry-chunk');
    process.exit(2);
  }

  // Pre-flight: Chrome CDP must be up on 9222. Without it, every URL fails
  // identically — burn no worker spawn diagnosing this.
  const cdpUp = await probeCdpReachable();
  if (!cdpUp) {
    const msg = 'chrome not running on 9222 — run launch-chrome.bat first';
    log(msg);
    console.log(JSON.stringify({
      ok: false,
      mode: opts.mode,
      run_id: opts.runId,
      err: msg,
      hint: 'run launch-chrome.bat in the project root, then re-run --run-chunk',
      results: [],
      applied_candidates: [],
      autofix_candidates: [],
    }));
    process.exit(2);
  }

  const runDir = resolve(REPO_ROOT, 'data/batch-runs', opts.runId);
  if (!existsSync(runDir)) mkdirSync(resolve(runDir, 'evidence'), { recursive: true });
  const profilePath = resolve(runDir, 'profile.json');
  const profile = existsSync(profilePath)
    ? JSON.parse(readFileSync(profilePath, 'utf8'))
    : loadProfileForWorker();

  log(`run-chunk ${opts.urls.length} URL(s) run_id=${opts.runId}${opts.mode === 'retry-chunk' ? ' (retry)' : ''}`);

  const t0 = Date.now();
  const r = await spawnWorker({
    urls: opts.urls,
    force: opts.force,
    experimental: opts.experimental,
    experimentalSucc: opts.experimentalSucc,
    runId: opts.runId,
    verbose: opts.verbose,
    profile,
    isRetry: opts.mode === 'retry-chunk',
  });
  const ms = Date.now() - t0;

  // Build the SLIM stdout telemetry summary. Full per-URL spans + compaction
  // details land in ledger.ndjson (parent reads on demand). Stdout stays tiny
  // so the orchestrator agent's context doesn't grow per chunk read.
  function slimTelemetry(t) {
    if (!t) return null;
    return {
      turns: t.turns,
      peak_input: t.peak_input,
      peak_pct: t.peak_pct_of_window,
      near_limit: t.near_limit,
      compactions_observed: t.compactions?.length ?? 0,
      total_output: t.total_output,
      // pointer for on-demand investigation, no payload
      details_in_ledger: 'data/batch-runs/' + opts.runId + '/ledger.ndjson (event:chunk_token_telemetry)',
    };
  }

  if (!r.ok) {
    appendLedger(runDir, { event: 'chunk_fail', is_retry: opts.mode === 'retry-chunk', err: r.err, diag: r.diag, telemetry: r.telemetry || null, urls: opts.urls });
    for (const u of opts.urls) {
      appendErrorLog({
        phase: 'worker_chunk_failure', url: u, run_id: opts.runId,
        is_retry: opts.mode === 'retry-chunk',
        err: r.err, exit_code: r.diag?.exit_code, signal: r.diag?.signal,
        stdout_tail: r.diag?.stdout_tail, stderr_tail: r.diag?.stderr_tail,
        peak_input: r.telemetry?.peak_input ?? null,
        compactions_observed: r.telemetry?.compactions?.length ?? 0,
      });
    }
    const urlToStatus = new Map(opts.urls.map(u => [u, 'AutoApplyFailed']));
    rewriteAppsForUrls(urlToStatus);
    console.log(JSON.stringify({
      ok: false,
      mode: opts.mode,
      run_id: opts.runId,
      err: r.err,
      results: opts.urls.map(u => ({ url: u, status: 'AutoApplyFailed', reason: r.err })),
      applied_candidates: [],
      autofix_candidates: [],
      token_telemetry_summary: slimTelemetry(r.telemetry),
      chunk_signals: {
        chunk_ms: ms,
        portals: [],
        applied_count: 0,
        failed_count: opts.urls.length,
        escalated_applied_count: 0,
        external_apply_count: 0,
        failure_kinds_histogram: { worker_spawn_failure: opts.urls.length },
        peak_pct_of_window: r.telemetry?.peak_pct_of_window ?? null,
        compactions_observed: r.telemetry?.compactions?.length ?? 0,
        near_limit: r.telemetry?.near_limit === true,
        worker_output_tokens: r.usage?.output_tokens ?? null,
        is_retry: opts.mode === 'retry-chunk',
        spawn_failure_diag: r.diag?.stderr_tail?.slice(0, 200) || null,
      },
    }));
    return;
  }

  appendLedger(runDir, { event: 'chunk_done', is_retry: opts.mode === 'retry-chunk', ms, usage: r.usage, telemetry: r.telemetry || null, results: r.result.results });

  const urlIndex = buildUrlRowIndex();
  const applied = [];
  const failed = [];
  const appliedCandidates = [];
  const autofixCandidates = [];

  for (const res of (r.result.results || [])) {
    const meta = urlIndex.get(res.url) || {};
    const enriched = { ...res, num: meta.num, company: meta.company, role: meta.role };
    if (res.status === 'Applied') applied.push(enriched);
    else if (res.status === 'AutoApplyFailed') failed.push(enriched);

    if (opts.experimentalSucc && res.status === 'Applied') {
      appliedCandidates.push({
        url: res.url, num: meta.num, portal: res.portal || null,
        company: meta.company, role: meta.role,
        evidence_path: res.evidence_path || null,
        external_apply: res.external_apply === true,
      });
    }
    if (opts.autofix && res.status === 'AutoApplyFailed' && res.autofix_eligible === true) {
      autofixCandidates.push({
        url: res.url, num: meta.num, portal: res.portal || null,
        company: meta.company, role: meta.role,
        failure: {
          kind: res.failure_kind || 'unknown',
          failed_step: res.failed_step || null,
          failed_selector: res.failed_selector || null,
          reason: res.reason || null,
        },
        evidence_path: res.evidence_path || null,
      });
    }
  }

  // Status rewrite for processed URLs (idempotent if status unchanged).
  const urlToStatus = new Map();
  for (const res of (r.result.results || [])) {
    if (res.status === 'Applied' || res.status === 'AutoApplyFailed') {
      urlToStatus.set(res.url, res.status);
    }
  }
  const updated = rewriteAppsForUrls(urlToStatus);

  // chunk_signals — small, deterministic facts the parent LLM uses to
  // synthesize a 1-3 line system-improvement suggestion. Stays under ~400
  // bytes so it doesn't grow parent context per chunk.
  const failureKinds = {};
  let externalApplyCount = 0;
  let escalatedAppliedCount = 0;
  const portalsTouched = new Set();
  for (const res of (r.result.results || [])) {
    if (res.portal) portalsTouched.add(res.portal);
    if (res.external_apply === true) externalApplyCount++;
    if (res.escalated === true && res.status === 'Applied') escalatedAppliedCount++;
    if (res.status === 'AutoApplyFailed') {
      const k = res.failure_kind || 'unknown';
      failureKinds[k] = (failureKinds[k] || 0) + 1;
    }
  }
  const chunkSignals = {
    chunk_ms: ms,
    portals: [...portalsTouched],
    applied_count: applied.length,
    failed_count: failed.length,
    escalated_applied_count: escalatedAppliedCount,
    external_apply_count: externalApplyCount,
    failure_kinds_histogram: failureKinds,
    peak_pct_of_window: r.telemetry?.peak_pct_of_window ?? null,
    compactions_observed: r.telemetry?.compactions?.length ?? 0,
    near_limit: r.telemetry?.near_limit === true,
    worker_output_tokens: r.usage?.output_tokens ?? null,
    is_retry: opts.mode === 'retry-chunk',
  };

  console.log(JSON.stringify({
    ok: true,
    mode: opts.mode,
    run_id: opts.runId,
    is_retry: opts.mode === 'retry-chunk',
    chunk_urls: opts.urls,
    applied: applied.length,
    failed: failed.length,
    apps_md_rows_updated: updated,
    usage: r.usage,
    token_telemetry_summary: slimTelemetry(r.telemetry),
    chunk_signals: chunkSignals,
    results: r.result.results || [],
    applied_candidates: appliedCandidates,
    autofix_candidates: autofixCandidates,
    ms,
  }));
}

// =========================================================================

async function main() {
  const opts = parseArgs(process.argv);
  log(`mode=${opts.mode} force=${opts.force} experimental=${opts.experimental} experimentalSucc=${opts.experimentalSucc} autofix=${opts.autofix} dryRun=${opts.dryRun} verbose=${opts.verbose} chunk=${opts.chunkSize} limit=${opts.limit === Infinity ? 'all' : opts.limit}`);

  switch (opts.mode) {
    case 'plan':
      modePlan(opts);
      break;
    case 'run-chunk':
    case 'retry-chunk':
      await modeRunChunk(opts);
      break;
    default:
      console.error(`unknown mode: ${opts.mode}`);
      process.exit(2);
  }
}

main().catch(e => {
  console.error(JSON.stringify({ ok: false, err: e.message, stack: e.stack }));
  process.exit(1);
});
