#!/usr/bin/env node
// gmail-apply-batch — orchestrate token-efficient batch applies via headless Haiku workers.
//
// Usage: node scripts/gmail-apply-batch.mjs [N] [--force] [--dry-run]
//
//   N         max URLs to process (default: all matching)
//   --force   pass --force to every URL (auto-submit, escalate failures)
//   --dry-run preview which URLs would be processed, do nothing
//
// Pipeline:
//   1. Parse data/applications.md → rows where status=Evaluated
//   2. Follow each report, extract **URL:** line
//   3. Filter to URLs whose host matches a recipe in config/gmail-apply-portals.yml
//   4. Skip URLs that failed >=3 times in last 7 days (data/gmail-apply-errors.ndjson)
//   5. Slice to N, chunk into pairs of 2
//   6. For each chunk: spawn `claude -p --bare --model haiku ...` with worker prompt
//   7. Collect JSON outputs, aggregate to data/gmail-apply-batch-<date>.ndjson
//   8. Single-pass rewrite of applications.md with new statuses
//
// LLM cost is bounded: only the ~25 Haiku worker spawns. Orchestrator is pure Node.

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const APPS_PATH = resolve(REPO_ROOT, 'data/applications.md');
const PORTALS_PATH = resolve(REPO_ROOT, 'config/gmail-apply-portals.yml');
const WORKER_PROMPT_PATH = resolve(REPO_ROOT, 'scripts/gmail-apply-worker-prompt.md');
const ERROR_LOG = resolve(REPO_ROOT, 'data/gmail-apply-errors.ndjson');
const MCP_CONFIG = resolve(REPO_ROOT, '.mcp.json');
const today = new Date().toISOString().slice(0, 10);
const BATCH_LOG = resolve(REPO_ROOT, `data/gmail-apply-batch-${today}.ndjson`);

const CHUNK_SIZE = 2;
const RECENT_FAIL_DAYS = 7;
const RECENT_FAIL_THRESHOLD = 3;
const WORKER_MAX_TURNS = 12;

function log(msg) { process.stderr.write(`[batch] ${msg}\n`); }

function parseArgs(argv) {
  const args = argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const autofix = args.includes('--autofix');
  const limit = args.find(a => /^\d+$/.test(a));
  return { force, dryRun, autofix, limit: limit ? parseInt(limit, 10) : Infinity };
}

function loadPortals() {
  const cfg = yaml.load(readFileSync(PORTALS_PATH, 'utf8'));
  return cfg.portals || [];
}

function matchPortal(url, portals) {
  for (const p of portals) {
    if ((p.match || []).some(m => url.includes(m))) return p;
  }
  return null;
}

// Parse applications.md table. Return array of {num, date, company, role, score, status, reportPath, raw}.
function parseAppsTable(md) {
  const lines = md.split('\n');
  const rows = [];
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    if (line.includes('---')) continue;
    if (line.includes('# |')) continue; // header
    const cells = line.split('|').map(c => c.trim());
    // Format: | # | Date | Company | Role | Score | Status | PDF | Report | Notes |
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

function extractUrl(reportPath) {
  if (!reportPath) return null;
  const full = resolve(REPO_ROOT, reportPath);
  if (!existsSync(full)) return null;
  const content = readFileSync(full, 'utf8');
  const m = content.match(/\*\*URL:\*\*\s*(\S+)/);
  return m ? m[1] : null;
}

// Count distinct CALENDAR DAYS this URL had a real (non-bookkeeping) failure
// in the recent window. Multiple failures on the same day during testing don't
// inflate the count — only "this URL has been broken on N separate days" does.
function recentFailDays(url) {
  if (!existsSync(ERROR_LOG)) return 0;
  const cutoff = Date.now() - RECENT_FAIL_DAYS * 86400 * 1000;
  const days = new Set();
  for (const line of readFileSync(ERROR_LOG, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e.url !== url) continue;
      // Real failures only — skip selector_fix, script_extension_needed, escalation notes.
      if (!['submit', 'step', 'worker_chunk_failure', 'submit_unconfirmed'].includes(e.phase)) continue;
      const ts = new Date(e.ts).getTime();
      if (ts < cutoff) continue;
      days.add(new Date(e.ts).toISOString().slice(0, 10));
    } catch {}
  }
  return days.size;
}

function spawnWorker(urls, force, autofix) {
  const taskList = urls.map((u, i) => `${i + 1}. ${u}`).join('\n');
  const flagsForScript = [force && '--force', autofix && '--autofix'].filter(Boolean).join(' ');
  const autofixNote = autofix
    ? '\n\nAUTOFIX MODE: --autofix is in effect. After every successful escalation, you MUST patch config/gmail-apply-portals.yml per the rules in your system prompt. Skip on cross-domain redirects, server-side per-job validation, login/captcha, or transient errors.'
    : '';
  const taskPrompt = `Process these ${urls.length} URLs sequentially. For each, run \`node scripts/gmail-apply.mjs <URL>${flagsForScript ? ' ' + flagsForScript : ''}\` and follow the system prompt's escalation ladder on failure. URLs:\n\n${taskList}\n\nReturn the JSON object specified by the system prompt. No prose.${autofixNote}`;

  // NOTE: --bare strips auth credentials → "Not logged in" failure. Don't use it.
  // We rely on --system-prompt-file (replaces default), --strict-mcp-config (only
  // chrome-devtools loaded), and --disallowedTools to keep context lean.
  const args = [
    '-p', taskPrompt,
    '--model', 'haiku',
    '--allowedTools', 'Bash,Read,Write,Edit,Grep,Glob,mcp__chrome-devtools__*',
    '--disallowedTools', 'Agent,WebSearch,WebFetch',
    '--system-prompt-file', WORKER_PROMPT_PATH,
    '--strict-mcp-config',
    '--mcp-config', MCP_CONFIG,
    '--output-format', 'json',
    '--max-turns', String(WORKER_MAX_TURNS),
  ];

  const r = spawnSync('claude', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
    timeout: 10 * 60 * 1000, // 10 min hard cap per chunk
  });

  // Always capture full diagnostic context so we can understand failures later.
  const diag = {
    spawn_error: r.error?.message,
    exit_code: r.status,
    signal: r.signal,
    stdout_len: r.stdout?.length || 0,
    stderr_len: r.stderr?.length || 0,
    stdout_head: (r.stdout || '').slice(0, 800),
    stderr_head: (r.stderr || '').slice(0, 800),
  };

  if (r.error) return { ok: false, err: `spawn error: ${r.error.message}`, diag };

  // Try to parse stdout even on non-zero exit — claude -p often emits structured JSON
  // with `is_error:true` while exiting non-zero. We want the JSON body, not just exit code.
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    if (r.status !== 0) {
      return { ok: false, err: `exit ${r.status}, no parseable JSON`, diag };
    }
    return { ok: false, err: `parse fail on ok exit: ${e.message}`, diag };
  }

  if (parsed.is_error) {
    return {
      ok: false,
      err: `claude reported is_error: ${parsed.subtype || 'unknown'}`,
      claude_result: parsed.result,
      claude_session_id: parsed.session_id,
      claude_terminal_reason: parsed.terminal_reason,
      claude_stop_reason: parsed.stop_reason,
      usage: parsed.usage,
      diag,
    };
  }

  if (r.status !== 0) {
    return { ok: false, err: `exit ${r.status} but JSON parsed ok`, claude_result: parsed.result, diag };
  }

  let result;
  try {
    result = JSON.parse(parsed.result);
  } catch {
    // Worker may have wrapped JSON in prose despite instructions.
    const m = (parsed.result || '').match(/\{[\s\S]*\}/);
    if (m) {
      try { result = JSON.parse(m[0]); } catch {
        return { ok: false, err: 'worker output not JSON', claude_result: parsed.result, usage: parsed.usage, diag };
      }
    } else {
      return { ok: false, err: 'worker output not JSON', claude_result: parsed.result, usage: parsed.usage, diag };
    }
  }

  return { ok: true, result, usage: parsed.usage };
}

function appendBatchLog(entry) {
  mkdirSync(dirname(BATCH_LOG), { recursive: true });
  appendFileSync(BATCH_LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
}

function rewriteApps(rows, statusMap) {
  const md = readFileSync(APPS_PATH, 'utf8');
  const lines = md.split('\n');
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
    const newStatus = statusMap.get(num);
    if (!newStatus) { updated.push(line); continue; }
    cells[6] = newStatus;
    updated.push('| ' + cells.slice(1, -1).join(' | ') + ' |');
  }
  writeFileSync(APPS_PATH, updated.join('\n'));
}

// ===========================================================================

function main() {
  const { force, dryRun, autofix, limit } = parseArgs(process.argv);
  log(`force=${force} autofix=${autofix} dryRun=${dryRun} limit=${limit === Infinity ? 'all' : limit} chunk=${CHUNK_SIZE}`);

  const portals = loadPortals();
  const apps = parseAppsTable(readFileSync(APPS_PATH, 'utf8'));

  // Build candidate list
  const candidates = [];
  for (const row of apps) {
    if (row.status !== 'Evaluated') continue;
    const url = extractUrl(row.reportPath);
    if (!url) continue;
    const portal = matchPortal(url, portals);
    if (!portal) continue;
    const failDays = recentFailDays(url);
    if (failDays >= RECENT_FAIL_THRESHOLD) {
      log(`skip (${failDays} fail-days in last ${RECENT_FAIL_DAYS}d): ${row.num} ${row.company}`);
      continue;
    }
    candidates.push({ num: row.num, company: row.company, role: row.role, url, portal: portal.name });
  }

  const queue = candidates.slice(0, limit);
  log(`candidates: ${candidates.length} → queue: ${queue.length}`);

  if (queue.length === 0) {
    console.log(JSON.stringify({ ok: true, processed: 0, results: [], note: 'no eligible URLs' }));
    return;
  }

  const portalCounts = queue.reduce((acc, c) => ({ ...acc, [c.portal]: (acc[c.portal] || 0) + 1 }), {});
  const chunks = [];
  for (let i = 0; i < queue.length; i += CHUNK_SIZE) chunks.push(queue.slice(i, i + CHUNK_SIZE));

  if (dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dry_run: true,
      queue_size: queue.length,
      chunks: chunks.length,
      portal_counts: portalCounts,
      preview: queue.slice(0, 10).map(c => `${c.num} ${c.company} (${c.portal})`),
    }));
    return;
  }

  // Run chunks sequentially
  const allResults = [];
  const statusMap = new Map();
  let totalUsage = { input_tokens: 0, output_tokens: 0 };

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const urls = chunk.map(c => c.url);
    log(`chunk ${i + 1}/${chunks.length}: ${urls.length} URLs`);

    const t0 = Date.now();
    const r = spawnWorker(urls, force, autofix);
    const ms = Date.now() - t0;

    if (!r.ok) {
      log(`chunk ${i + 1} failed: ${r.err}`);
      // Capture the full failure context — exit code, stdout/stderr heads,
      // claude session id, terminal reason, etc. — both to batch log and
      // forensic error log so we can diagnose later.
      const failEntry = {
        chunk: i + 1,
        ok: false,
        err: r.err,
        urls,
        diag: r.diag,
        claude_result: r.claude_result,
        claude_session_id: r.claude_session_id,
        claude_terminal_reason: r.claude_terminal_reason,
        claude_stop_reason: r.claude_stop_reason,
        usage: r.usage,
      };
      appendBatchLog(failEntry);
      // Also append a human-readable forensic line for each URL in the failed chunk.
      for (const u of urls) {
        try {
          mkdirSync(dirname(ERROR_LOG), { recursive: true });
          appendFileSync(ERROR_LOG, JSON.stringify({
            ts: new Date().toISOString(),
            phase: 'worker_chunk_failure',
            url: u,
            chunk: i + 1,
            err: r.err,
            exit_code: r.diag?.exit_code,
            signal: r.diag?.signal,
            stdout_head: r.diag?.stdout_head,
            stderr_head: r.diag?.stderr_head,
            claude_result_head: (r.claude_result || '').slice(0, 400),
            claude_terminal_reason: r.claude_terminal_reason,
          }) + '\n');
        } catch {}
      }
      for (const c of chunk) {
        allResults.push({
          url: c.url,
          num: c.num,
          status: 'AutoApplyFailed',
          reason: r.err,
          terminal_reason: r.claude_terminal_reason,
        });
        statusMap.set(c.num, 'AutoApplyFailed');
      }
      continue;
    }

    appendBatchLog({ chunk: i + 1, ok: true, ms, usage: r.usage, results: r.result.results });
    if (r.usage) {
      totalUsage.input_tokens += r.usage.input_tokens || 0;
      totalUsage.output_tokens += r.usage.output_tokens || 0;
    }

    for (const res of r.result.results || []) {
      const match = chunk.find(c => c.url === res.url);
      const num = match?.num;
      allResults.push({ ...res, num });
      if (num && (res.status === 'Applied' || res.status === 'AutoApplyFailed')) {
        statusMap.set(num, res.status);
      }
    }
  }

  // Single-pass rewrite of applications.md
  if (statusMap.size > 0) {
    rewriteApps(apps, statusMap);
    log(`updated ${statusMap.size} rows in applications.md`);
  }

  const summary = {
    ok: true,
    processed: allResults.length,
    applied: allResults.filter(r => r.status === 'Applied').length,
    failed: allResults.filter(r => r.status === 'AutoApplyFailed').length,
    chunks: chunks.length,
    usage: totalUsage,
    batch_log: BATCH_LOG,
    error_log: ERROR_LOG,
    results: allResults,
  };
  console.log(JSON.stringify(summary));
}

main();
