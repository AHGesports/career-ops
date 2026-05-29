#!/usr/bin/env node
// gmail-apply-batch — V3 orchestrator. Pure Node. Drives the URL loop
// deterministically. Spawns ONE cheap worker per URL when MCP work is needed.
// Claude provider: Haiku. Codex provider: GPT-5.4 Mini by default.
//
// Modes:
//
// 1) --plan [N] [--force] [--autofix] [--dry-run]
//    Build eligible queue. Write run_dir + plan.json + profile.json.
//    Stdout JSON: { ok, run_id, run_dir, total_urls, urls[], cv_path, flags }.
//
// 2) --run --run-id=<id> [--force] [--autofix] [--verbose]
//    Iterate URL queue. For each:
//      a. Run scripts/gmail-apply.mjs.
//      b. Branch on script outcome:
//           redirect.detected → External worker
//           script_claim:Applied → Validate worker
//           else → Recover worker
//      c. Read worker stdout + worker-evidence file.
//      d. Compare claims.
//           agree Applied → write apps.md "Applied"
//           agree Failed  → write apps.md "AutoApplyFailed"
//           script=Unknown, worker=X → take X
//           missing worker evidence → respawn worker once; still missing → no_evidence
//           any other mismatch → flag disputed; leave apps.md untouched
//      e. With --autofix and Applied via Recover branch: patch yaml.
//    Stdout JSON: { ok, run_id, applied, failed, disputed[], no_evidence[], mailto_detected[], autofixes, ms }.
//    apps.md updated incrementally per URL (immediate visibility).

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
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

function log(msg) { process.stderr.write(`[batch] ${msg}\n`); }

function parseJsonText(text) {
  return JSON.parse(String(text || '').replace(/^\uFEFF/, ''));
}

function readJsonFile(path) {
  return parseJsonText(readFileSync(path, 'utf8'));
}

function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  try { process.kill(pid, 'SIGKILL'); } catch {}
}

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
    has('--plan') ? 'plan' :
    has('--run')  ? 'run'  :
    'plan';

  let planFlags = null;
  const earlyRunId = valOf('--run-id');
  if (earlyRunId) {
    const planPath = resolve(REPO_ROOT, 'data/batch-runs', earlyRunId, 'plan.json');
    if (existsSync(planPath)) {
      try { planFlags = (readJsonFile(planPath).flags) || null; } catch { /* */ }
    }
  }
  const planF = planFlags || {};

  const force = has('--force') || planF.force === true;
  const dryRun = has('--dry-run');
  const verbose = has('--verbose');
  const autofix = has('--autofix') || planF.autofix === true;
  const workerProvider = (
    valOf('--worker-provider') ||
    planF.workerProvider ||
    process.env.CAREER_OPS_WORKER_PROVIDER ||
    'claude'
  ).toLowerCase();
  const workerModel =
    valOf('--worker-model') ||
    planF.workerModel ||
    process.env.CAREER_OPS_WORKER_MODEL ||
    (workerProvider === 'codex' ? 'gpt-5.4-mini' : 'haiku');

  const limitArg = args.find(a => /^\d+$/.test(a));
  const limit = limitArg ? parseInt(limitArg, 10) : Infinity;
  const runId = valOf('--run-id');

  return { mode, force, dryRun, verbose, autofix, workerProvider, workerModel, limit, runId };
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

function externalApplyKeyFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, '') === 'vesterling.com') {
      const m = u.href.match(/onlineapplication\/(\d+)|jobRef(\d+)/i);
      if (m) return `vesterling:${m[1] || m[2]}`;
    }
  } catch { /* */ }
  return null;
}

function externalApplyKeyFromNotes(notes) {
  const m = String(notes || '').match(/external_apply_key:([a-z0-9:_-]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function buildUrlRowIndex() {
  const apps = parseAppsTable(readFileSync(APPS_PATH, 'utf8'));
  const idx = new Map();
  for (const row of apps) {
    const url = extractUrlForRow(row);
    if (!url) continue;
    if (!idx.has(url)) idx.set(url, { num: row.num, status: row.status, company: row.company, role: row.role });
  }
  return idx;
}

function buildExternalApplyIndex() {
  const apps = parseAppsTable(readFileSync(APPS_PATH, 'utf8'));
  const idx = new Map();
  for (const row of apps) {
    const key = externalApplyKeyFromNotes(row.notes);
    if (!key) continue;
    const existing = idx.get(key);
    if (!existing || (row.status === 'Applied' && existing.status !== 'Applied')) {
      idx.set(key, { num: row.num, status: row.status, company: row.company, role: row.role });
    }
  }
  return idx;
}

// -- ledger / logs -----------------------------------------------------------

function appendLedger(runDir, entry) {
  const p = resolve(runDir, 'ledger.ndjson');
  appendFileSync(p, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
}

function appendErrorLog(entry) {
  try {
    mkdirSync(dirname(ERROR_LOG), { recursive: true });
    appendFileSync(ERROR_LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* */ }
}

function appendUrlVerdict(runDir, entry) {
  try {
    appendFileSync(
      resolve(runDir, 'url-verdicts.ndjson'),
      JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'
    );
  } catch { /* */ }
}

// -- profile -----------------------------------------------------------------

function loadProfileForWorker() {
  const cfg = yaml.load(readFileSync(PROFILE_PATH, 'utf8'));
  const c = cfg.candidate || {};
  const fullName = c.full_name || '';
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');
  const av = cfg.availability || {};
  const sx = cfg.salary_expectations || {};
  return {
    full_name: fullName,
    first_name: firstName || '',
    last_name: lastName || '',
    email: c.email || '',
    phone: c.phone || '',
    location: c.location || '',
    plz: c.plz || '',
    city: c.city || '',
    street: c.street || '',
    country: c.country || '',
    linkedin: c.linkedin || '',
    portfolio_url: c.portfolio_url || '',
    github: c.github || '',
    cv_path_relative: CV_REL,
    cv_path_absolute: CV_PATH,
    availability: av,
    salary_expectations: sx,
  };
}

function buildProfileBlock(profile) {
  const av = profile.availability || {};
  const sx = profile.salary_expectations || {};
  const eur = sx.eur || {};
  const pln = sx.pln || {};
  return `EXTERNAL_PROFILE (use these values when redirected to an external ATS):
- full_name: ${profile.full_name}
- first_name: ${profile.first_name}
- last_name: ${profile.last_name}
- email: ${profile.email}
- phone: ${profile.phone}
- location: ${profile.location}
- street: ${profile.street}
- plz / postal_code: ${profile.plz}
- city: ${profile.city}
- country: ${profile.country}
- linkedin: ${profile.linkedin}
- portfolio_url: ${profile.portfolio_url}
- github: ${profile.github}
- CV file (absolute path, use with mcp__chrome-devtools__upload_file): ${profile.cv_path_absolute}

AVAILABILITY (when form asks notice period / earliest start):
- notice_period: ${av.notice_period || '6 weeks'}
- earliest_start_text: ${av.earliest_start_text || '6 weeks notice from offer'}
- short_form: ${av.short || '6 weeks'}

SALARY_EXPECTATIONS (pick by form's currency/unit):
- default_text: ${sx.default_text || 'EUR 55,000-80,000 / year gross (target range)'}
- EUR annual gross: min=${eur.annual_gross_min || 55000}, target=${eur.annual_gross_target || 70000}, max=${eur.annual_gross_max || 80000}
- EUR monthly gross: 12-pay=${eur.monthly_gross_12pay || 4583}, 14-pay=${eur.monthly_gross_14pay || 3929}
- EUR hourly gross: ${eur.hourly_gross || 32}
- PLN monthly gross UoP (12-pay): ${pln.monthly_gross_uop_12pay || 19479}
- PLN monthly B2B revenue: ${pln.b2b_monthly_revenue || 19125}
- PLN B2B hourly rate: ${pln.b2b_hourly_rate || 135}
- Single-number form → target. Range form → min-max. Polish PLN form → 19479 PLN/month gross UoP unless B2B/hourly.

Use these directly. Do NOT bail on availability/salary fields — they ARE mapped.`;
}

// -- worker prompt versioning ------------------------------------------------

function buildVersionedPromptFile(runId) {
  const yamlBytes = readFileSync(PORTALS_PATH);
  const yamlHash = createHash('sha1').update(yamlBytes).digest('hex').slice(0, 12);
  const original = readFileSync(WORKER_PROMPT_PATH, 'utf8');
  const runDir = resolve(REPO_ROOT, 'data/batch-runs', runId);
  if (!existsSync(runDir)) mkdirSync(runDir, { recursive: true });
  const dest = resolve(runDir, 'worker-prompt.md');
  const header = `<!-- portals_yaml_version: ${yamlHash} | run_id: ${runId} -->\n# portals_yaml_version: ${yamlHash}\n\n`;
  writeFileSync(dest, header + original);
  return { path: dest, hash: yamlHash };
}

// -- script run --------------------------------------------------------------

function urlSlug(url) {
  return url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 80).replace(/-+$/, '');
}

function runScript({ url, runId, force }) {
  const args = [
    resolve(__dirname, 'gmail-apply.mjs'),
    url,
    '--experimental',
    `--run-id=${runId}`,
  ];
  if (force) args.push('--force');
  const proc = spawnSync(process.execPath, args, {
    cwd: REPO_ROOT, encoding: 'utf8', timeout: 240_000, // 4 min hard cap per script run
  });
  let json = null;
  try { json = JSON.parse((proc.stdout || '').trim().split('\n').pop()); } catch { /* */ }
  return {
    ok: proc.status === 0 || proc.status === 2, // 0=applied, 2=needs-handover
    json,
    stderr: proc.stderr || '',
    timed_out: proc.status === null,
  };
}

// -- worker spawn ------------------------------------------------------------

async function spawnPerUrlWorker({ url, taskType, runId, force, profile, scriptResult, hint, verbose, workerProvider, workerModel }) {
  const profileBlock = buildProfileBlock(profile);

  const taskTemplate = (() => {
    const slug = urlSlug(url);
    const evidenceTarget = `data/batch-runs/${runId}/evidence/${slug}-worker-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const baseHeader = [
      `TASK_TYPE: ${taskType}`,
      `URL: ${url}`,
      `RUN_ID: ${runId}`,
      `Portal: ${scriptResult?.json?.portal || 'unknown'}`,
      `Evidence file you MUST write before exiting: ${evidenceTarget}`,
      ``,
    ].join('\n');

    if (taskType === 'External') {
      return baseHeader + [
        `Script detected redirect to external ATS.`,
        `Original URL: ${url}`,
        `Final URL: ${scriptResult?.json?.redirect?.final_url || 'see redirect block'}`,
        `Framework hint: ${JSON.stringify(scriptResult?.json?.redirect?.framework_hint || null)}`,
        `Simplify status: ${JSON.stringify(scriptResult?.json?.redirect?.simplify || null)}`,
        ``,
        `Take over the redirected tab via chrome-devtools MCP. Follow TASK_TYPE=External flow in system prompt.`,
        `Branch on simplify.supported + simplify.clicked to choose Branch A (gap-fill) or Branch B (full probe).`,
        `Complete external form, submit, verify success markers. Mark external_apply:true.`,
      ].join('\n');
    }

    if (taskType === 'Validate') {
      return baseHeader + [
        `Script claims Applied (recipe submit + success_selector match).`,
        `Confirm via live DOM read. Don't redo work.`,
        ``,
        `1. list_pages → select tab matching URL.`,
        `2. ONE evaluate_script READ — page_state probe (system prompt has the JS).`,
        `3. Decide: success_marker + no modal + no errors → claim:Applied. Else claim:Failed.`,
        `4. Write evidence file. Close tab via close_page.`,
        `5. Emit stdout JSON. Stop.`,
        ``,
        `Should complete in 3-5 turns.`,
      ].join('\n');
    }

    // Recover
    const failedStep = scriptResult?.json?.steps?.find(s => s.ok === false);
    const failedSelectorHint = failedStep ? `Script failed at step ${failedStep.i} (action=${failedStep.action}, selector=${failedStep.selector || 'n/a'}, err=${(failedStep.err || '').slice(0,120)})` : 'Script failed (no specific step recorded)';
    return baseHeader + [
      `Script ran recipe and Failed (no redirect). Tab open at portal URL with form in some state.`,
      failedSelectorHint,
      hint ? `Hint from orchestrator: ${hint}` : '',
      ``,
      `Take over via MCP. Follow TASK_TYPE=Recover flow in system prompt:`,
      `1. list_pages → select tab.`,
      `2. evaluate_script READ — page_state + required_unfilled probe.`,
      `3. Fix what's missing per hint. Cap 3 strategies per field.`,
      `4. Submit. Wait 1-2s. Verify.`,
      `5. Write evidence file. Emit stdout JSON.`,
    ].filter(Boolean).join('\n');
  })();

  const taskPrompt = [
    taskTemplate,
    profileBlock,
    `Output: single JSON line on stdout, schema in system prompt. NO prose.`,
  ].join('\n\n');

  const versionedPrompt = buildVersionedPromptFile(runId);
  const provider = (
    process.env.CAREER_OPS_WORKER_PROVIDER ||
    workerProvider ||
    'claude'
  ).toLowerCase();
  const model =
    process.env.CAREER_OPS_WORKER_MODEL ||
    workerModel ||
    (provider === 'codex' ? 'gpt-5.4-mini' : 'haiku');

  if (provider === 'codex') {
    return await spawnCodexWorker({ url, taskType, runId, taskPrompt, versionedPrompt, model, verbose });
  }
  return await spawnClaudeWorker({ taskType, taskPrompt, versionedPrompt, model, verbose });
}

async function spawnClaudeWorker({ taskType, taskPrompt, versionedPrompt, model, verbose }) {
  const args = [
    '-p',
    '--model', model,
    '--allowedTools', 'Bash,Read,Write,Edit,Grep,Glob,mcp__chrome-devtools__*',
    '--disallowedTools', 'Agent,WebSearch,WebFetch',
    '--system-prompt-file', versionedPrompt.path,
    '--strict-mcp-config',
    '--mcp-config', MCP_CONFIG,
    '--output-format', 'stream-json',
    '--verbose',
  ];

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

    child.stdout.on('data', d => {
      stdoutBuf += d.toString();
      let nl;
      while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
        const line = stdoutBuf.slice(0, nl);
        stdoutBuf = stdoutBuf.slice(nl + 1);
        if (!line.trim()) continue;
        let evt;
        try { evt = JSON.parse(line); } catch { continue; }

        if (verbose && evt.type === 'assistant' && evt.message?.content) {
          for (const block of evt.message.content) {
            if (block.type === 'tool_use') {
              const inp = block.input || {};
              const summary = inp.command ? inp.command.slice(0, 100) : (inp.url || inp.pageId || '');
              process.stderr.write(`[worker:${taskType}] ${block.name} ${summary}\n`);
            }
          }
        }

        if (evt.type === 'assistant' && evt.message?.content) {
          for (const block of evt.message.content) {
            if (block.type === 'text' && block.text) finalAssistantText = block.text;
          }
        }
        if (evt.type === 'result') {
          usage = evt.usage || usage;
          if (typeof evt.result === 'string') finalAssistantText = evt.result;
        }
      }
    });

    child.stderr.on('data', d => { stderrBuf += d.toString(); });

    // Hard cap: 6 min per worker. Most tasks complete in under 2 min.
    const killTimer = setTimeout(() => killProcessTree(child.pid), 360_000);

    child.on('close', (code, signal) => {
      clearTimeout(killTimer);
      const diag = {
        exit_code: code,
        signal,
        stdout_tail: stdoutBuf.slice(-400),
        stderr_tail: stderrBuf.slice(-400),
      };
      if (!finalAssistantText) {
        return resolveP({ ok: false, err: 'no final assistant text', diag, usage });
      }
      let result;
      try { result = JSON.parse(finalAssistantText); }
      catch {
        const m = finalAssistantText.match(/\{[\s\S]*\}/);
        if (m) {
          try { result = JSON.parse(m[0]); }
          catch { return resolveP({ ok: false, err: 'worker output not JSON', text: finalAssistantText.slice(0, 400), diag, usage }); }
        } else {
          return resolveP({ ok: false, err: 'worker output not JSON', text: finalAssistantText.slice(0, 400), diag, usage });
        }
      }
      resolveP({ ok: true, result, usage, diag });
    });

    child.on('error', e => {
      clearTimeout(killTimer);
      resolveP({ ok: false, err: `spawn error: ${e.message}` });
    });
  });
}

async function spawnCodexWorker({ url, taskType, runId, taskPrompt, versionedPrompt, model, verbose }) {
  const runDir = resolve(REPO_ROOT, 'data/batch-runs', runId);
  const outPath = resolve(runDir, `${urlSlug(url)}-${taskType.toLowerCase()}-codex-output.json`);
  const systemPrompt = readFileSync(versionedPrompt.path, 'utf8');
  const prompt = [
    systemPrompt,
    '',
    '---',
    '',
    '# Orchestrator task',
    taskPrompt,
    '',
    'Final response must be exactly the requested single JSON object. No prose, no markdown.',
  ].join('\n');
  const args = [
    'exec',
    '--model', model,
    '--dangerously-bypass-approvals-and-sandbox',
    '--cd', REPO_ROOT,
    '--json',
    '--output-last-message', outPath,
    '-',
  ];
  const reasoningEffort = process.env.CAREER_OPS_WORKER_REASONING_EFFORT;
  if (reasoningEffort) {
    args.splice(3, 0, '-c', `model_reasoning_effort='${reasoningEffort}'`);
  }

  return await new Promise(resolveP => {
    const child = spawn('codex', args, {
      cwd: REPO_ROOT,
      shell: process.platform === 'win32',
    });
    child.stdin.write(prompt);
    child.stdin.end();

    let stdoutBuf = '';
    let stderrBuf = '';
    let usage = null;

    child.stdout.on('data', d => {
      stdoutBuf += d.toString();
      if (!verbose) return;
      let nl;
      while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
        const line = stdoutBuf.slice(0, nl);
        stdoutBuf = stdoutBuf.slice(nl + 1);
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.type || evt.msg) process.stderr.write(`[worker:${taskType}:codex] ${evt.type || evt.msg}\n`);
          usage = evt.usage || usage;
        } catch { /* ignore non-json progress */ }
      }
    });

    child.stderr.on('data', d => { stderrBuf += d.toString(); });

    const killTimer = setTimeout(() => killProcessTree(child.pid), 360_000);

    child.on('close', (code, signal) => {
      clearTimeout(killTimer);
      const diag = {
        provider: 'codex',
        model,
        exit_code: code,
        signal,
        stdout_tail: stdoutBuf.slice(-400),
        stderr_tail: stderrBuf.slice(-400),
        output_path: outPath,
      };
      let finalAssistantText = '';
      if (existsSync(outPath)) {
        try { finalAssistantText = readFileSync(outPath, 'utf8').trim(); } catch { /* */ }
      }
      if (!finalAssistantText) {
        return resolveP({ ok: false, err: 'no final codex output', diag, usage });
      }
      let result;
      try { result = JSON.parse(finalAssistantText); }
      catch {
        const m = finalAssistantText.match(/\{[\s\S]*\}/);
        if (m) {
          try { result = JSON.parse(m[0]); }
          catch { return resolveP({ ok: false, err: 'worker output not JSON', text: finalAssistantText.slice(0, 400), diag, usage }); }
        } else {
          return resolveP({ ok: false, err: 'worker output not JSON', text: finalAssistantText.slice(0, 400), diag, usage });
        }
      }
      resolveP({ ok: true, result, usage, diag });
    });

    child.on('error', e => {
      clearTimeout(killTimer);
      resolveP({ ok: false, err: `spawn error: ${e.message}` });
    });
  });
}

// -- agreement --------------------------------------------------------------

// Normalize claim to {Applied, Failed, Unknown, MailtoDetected}.
function normClaim(c) {
  if (c === 'MailtoDetected') return 'MailtoDetected';
  if (c === 'Applied' || c === 'AutoApplyFailed' || c === 'Failed' || c === 'Unknown') {
    return c === 'AutoApplyFailed' ? 'Failed' : c;
  }
  return 'Unknown';
}

// Decide given (script_claim, worker_claim, worker_evidence_present).
// Returns { decision, reason }.
//   decision ∈ { Applied, AutoApplyFailed, disputed, no_evidence }
function decideFromClaims({ scriptClaim, workerClaim, workerEvidenceFile, workerOk }) {
  if (!workerOk) {
    return { decision: 'no_evidence', reason: 'worker spawn failed or output unparseable' };
  }
  if (!workerEvidenceFile || !existsSync(workerEvidenceFile)) {
    return { decision: 'no_evidence', reason: 'worker evidence file missing' };
  }
  const s = normClaim(scriptClaim);
  const w = normClaim(workerClaim);
  if (w === 'MailtoDetected') return { decision: 'MailtoDetected', reason: 'worker detected mailto-only apply' };
  if (s === w && s === 'Applied') return { decision: 'Applied', reason: 'script + worker agree Applied' };
  if (s === w && s === 'Failed')  return { decision: 'AutoApplyFailed', reason: 'script + worker agree Failed' };
  if (s === 'Unknown') return { decision: w === 'Applied' ? 'Applied' : 'AutoApplyFailed', reason: `script Unknown (e.g. redirect), worker=${w}` };
  if (w === 'Unknown') return { decision: 'disputed', reason: 'worker emitted Unknown — should always commit to a claim' };
  // Definite mismatch (Applied vs Failed)
  return { decision: 'disputed', reason: `mismatch: script=${s}, worker=${w}` };
}

// -- apps.md write -----------------------------------------------------------

function rewriteAppsRow(url, newStatus, noteSuffix = null) {
  const md = readFileSync(APPS_PATH, 'utf8');
  const lines = md.split('\n');
  const apps = parseAppsTable(md);
  let targetNum = null;
  for (const row of apps) {
    const u = extractUrlForRow(row);
    if (u === url) { targetNum = row.num; break; }
  }
  if (!targetNum) return false;
  const updated = [];
  let changed = false;
  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('# |')) {
      updated.push(line);
      continue;
    }
    const cells = line.split('|').map(c => c.trim());
    if (cells.length < 10 || cells[1] !== targetNum) {
      updated.push(line);
      continue;
    }
    const note = cells[9] || '';
    const shouldAppendNote = noteSuffix && !note.includes(noteSuffix);
    if (cells[6] !== newStatus || shouldAppendNote) {
      cells[6] = newStatus;
      if (shouldAppendNote) cells[9] = `${note} ${noteSuffix}`.trim();
      changed = true;
      updated.push('| ' + cells.slice(1, -1).join(' | ') + ' |');
    } else {
      updated.push(line);
    }
  }
  if (changed) writeFileSync(APPS_PATH, updated.join('\n'));
  return changed;
}

// -- find run-dir reuse -----------------------------------------------------

function findReusableRunDir(opts, urls, maxAgeMs = 30 * 60 * 1000) {
  const root = resolve(REPO_ROOT, 'data/batch-runs');
  if (!existsSync(root)) return null;
  const cutoff = Date.now() - maxAgeMs;
  let best = null;
  let bestMtime = 0;
  for (const name of readdirSync(root)) {
    const dir = resolve(root, name);
    let st;
    try { st = statSync(dir); } catch { continue; }
    if (!st.isDirectory() || st.mtimeMs < cutoff) continue;
    const planPath = resolve(dir, 'plan.json');
    const ledgerPath = resolve(dir, 'ledger.ndjson');
    if (!existsSync(planPath) || !existsSync(ledgerPath)) continue;
    let prevPlan;
    try { prevPlan = readJsonFile(planPath); } catch { continue; }
    if (JSON.stringify(prevPlan.urls || []) !== JSON.stringify(urls)) continue;
    const prevFlags = prevPlan.flags || {};
    if (prevFlags.force !== opts.force || prevFlags.autofix !== opts.autofix) continue;
    if ((prevFlags.workerProvider || 'claude') !== opts.workerProvider) continue;
    if ((prevFlags.workerModel || (opts.workerProvider === 'codex' ? 'gpt-5.4-mini' : 'haiku')) !== opts.workerModel) continue;
    let onlyPlanEvent = true;
    for (const line of readFileSync(ledgerPath, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        if (e.event && e.event !== 'plan') { onlyPlanEvent = false; break; }
      } catch { /* */ }
    }
    if (!onlyPlanEvent) continue;
    if (st.mtimeMs > bestMtime) { best = { runId: name, runDir: dir, plan: prevPlan }; bestMtime = st.mtimeMs; }
  }
  return best;
}

// -- CDP probe --------------------------------------------------------------

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
// MODE: --plan
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
  candidates.sort((a, b) => parseInt(b.num, 10) - parseInt(a.num, 10));
  const seen = new Set();
  const dedup = [];
  for (const c of candidates) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    dedup.push(c);
  }
  const queue = dedup.slice(0, opts.limit);
  const urls = queue.map(c => c.url);

  const portalCounts = queue.reduce((acc, c) => ({ ...acc, [c.portal]: (acc[c.portal] || 0) + 1 }), {});
  const statusCounts = queue.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {});

  let runId = null, runDir = null, reused = false;
  if (!opts.dryRun && queue.length > 0) {
    const reuse = findReusableRunDir(opts, urls);
    if (reuse) {
      runId = reuse.runId;
      runDir = reuse.runDir;
      reused = true;
      log(`reusing prior plan run_id=${runId}`);
    } else {
      runId = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '-' + randomUUID().slice(0, 8);
      runDir = resolve(REPO_ROOT, 'data/batch-runs', runId);
      mkdirSync(resolve(runDir, 'evidence'), { recursive: true });
      const profile = loadProfileForWorker();
      writeFileSync(resolve(runDir, 'profile.json'), JSON.stringify(profile, null, 2));
      writeFileSync(resolve(runDir, 'plan.json'), JSON.stringify({
        ts: new Date().toISOString(),
        opts: {
          mode: opts.mode,
          force: opts.force,
          autofix: opts.autofix,
          workerProvider: opts.workerProvider,
          workerModel: opts.workerModel,
          limit: opts.limit === Infinity ? null : opts.limit,
        },
        flags: {
          force: opts.force,
          autofix: opts.autofix,
          workerProvider: opts.workerProvider,
          workerModel: opts.workerModel,
        },
        total_urls: queue.length,
        urls,
        queue,
      }, null, 2));
      appendLedger(runDir, { event: 'plan', total_urls: queue.length, opts });
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
    urls,
    portal_counts: portalCounts,
    status_counts: statusCounts,
    preview: queue.slice(0, 10).map(c => `${c.num} [${c.status}] ${c.company} (${c.portal})`),
    cv_path: CV_PATH,
    flags: {
      force: opts.force,
      autofix: opts.autofix,
      workerProvider: opts.workerProvider,
      workerModel: opts.workerModel,
    },
  }, null, 2));
}

// =========================================================================
// MODE: --run — per-URL loop
// =========================================================================

async function modeRun(opts) {
  if (!opts.runId) {
    console.error('--run-id required for --run');
    process.exit(2);
  }
  const runDir = resolve(REPO_ROOT, 'data/batch-runs', opts.runId);
  const planPath = resolve(runDir, 'plan.json');
  if (!existsSync(planPath)) {
    console.error(`plan.json not found in ${runDir}`);
    process.exit(2);
  }
  const plan = readJsonFile(planPath);
  const urls = plan.urls || [];
  if (urls.length === 0) {
    console.log(JSON.stringify({ ok: true, mode: 'run', run_id: opts.runId, applied: 0, failed: 0, disputed: [], no_evidence: [], autofixes: 0, ms: 0 }));
    return;
  }

  const cdpUp = await probeCdpReachable();
  if (!cdpUp) {
    console.log(JSON.stringify({
      ok: false, mode: 'run', run_id: opts.runId,
      err: 'chrome not on 9222 — run launch-chrome.bat first',
    }));
    process.exit(2);
  }

  const profile = existsSync(resolve(runDir, 'profile.json'))
    ? readJsonFile(resolve(runDir, 'profile.json'))
    : loadProfileForWorker();

  const t0 = Date.now();
  let applied = 0, failed = 0, autofixes = 0;
  const disputed = [];
  const noEvidence = [];
  const mailtoDetected = [];
  const urlIndex = buildUrlRowIndex();
  const externalApplyIndex = buildExternalApplyIndex();

  log(`run starting: ${urls.length} URL(s) run_id=${opts.runId}`);
  appendLedger(runDir, { event: 'run_start', total_urls: urls.length });

  // Track last apply timestamp per registrable domain (eTLD+1 approximation).
  // Same-domain consecutive applies trigger anti-bot on some portals (NFJ
  // observed). Insert a randomized delay only when the same domain was hit
  // recently. Different domains: no delay. Configurable via env or default.
  const minDomainGapMs = Number(process.env.MIN_DOMAIN_GAP_MS) > 0
    ? Number(process.env.MIN_DOMAIN_GAP_MS)
    : 2500;
  const lastDomainHitMs = new Map();
  const registrableDomain = (u) => {
    try {
      const h = new URL(u).hostname.toLowerCase().replace(/^www\./, '');
      const parts = h.split('.');
      if (parts.length <= 2) return h;
      // Naive eTLD+1 — handles common cases (foo.com, foo.co.uk we treat as
      // 3-label). Good enough for spacing decisions; not used for security.
      const tail2 = parts.slice(-2).join('.');
      const tail3 = parts.slice(-3).join('.');
      return /\.(co|com|org|net|gov|ac)\.[a-z]{2}$/.test(tail3) ? tail3 : tail2;
    } catch {
      return u;
    }
  };

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const meta = urlIndex.get(url) || {};
    // Inter-URL spacing — only when SAME domain hit within minDomainGapMs.
    const dom = registrableDomain(url);
    const lastHit = lastDomainHitMs.get(dom);
    if (lastHit) {
      const elapsed = Date.now() - lastHit;
      if (elapsed < minDomainGapMs) {
        const jitter = Math.floor(Math.random() * 1500);
        const wait = (minDomainGapMs - elapsed) + jitter;
        log(`  same-domain gap: sleeping ${wait}ms before ${dom}`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
    log(`[${i + 1}/${urls.length}] ${url}`);
    appendLedger(runDir, { event: 'url_start', url, idx: i, domain: dom });

    // -- 1. Run script ---------------------------------------------------
    const scriptT0 = Date.now();
    const scriptOut = runScript({ url, runId: opts.runId, force: opts.force });
    const scriptMs = Date.now() - scriptT0;
    if (!scriptOut.json) {
      log(`  script failed (no JSON) — flagging no_evidence`);
      noEvidence.push({ url, num: meta.num, reason: 'script produced no JSON', stderr_tail: scriptOut.stderr.slice(-200) });
      appendUrlVerdict(runDir, { url, num: meta.num, decision: 'no_evidence', reason: 'script produced no JSON', script_ms: scriptMs });
      continue;
    }

    const scriptJson = scriptOut.json;
    const scriptClaim = scriptJson.script_claim || (scriptJson.redirect?.detected ? 'Unknown' : 'Failed');
    const portal = scriptJson.portal || null;
    log(`  script_claim=${scriptClaim} portal=${portal} (${scriptMs}ms)`);

    // -- 1b. Early exit: job listing closed/unavailable ------------------
    if (scriptJson.job_unavailable) {
      log(`  job_unavailable — marking Discarded, skipping worker`);
      rewriteAppsRow(url, 'Discarded');
      const v = { url, num: meta.num, portal, task_type: null, script_claim: 'Discarded', worker_claim: null, worker_evidence_path: null, worker_ok: false, worker_diag: null, decision: 'Discarded', reason: 'job listing unavailable', script_ms: scriptMs };
      appendUrlVerdict(runDir, v);
      appendLedger(runDir, { event: 'url_verdict', ...v });
      failed++;
      continue;
    }

    // -- 2. Decide task type --------------------------------------------
    let taskType;
    if (scriptJson.redirect?.detected) taskType = 'External';
    else if (scriptClaim === 'Applied') taskType = 'Validate';
    else taskType = 'Recover';

    const externalApplyKey = externalApplyKeyFromUrl(scriptJson.redirect?.final_url);
    if (externalApplyKey) {
      const prior = externalApplyIndex.get(externalApplyKey);
      if (prior) {
        const note = `Duplicate external application (${externalApplyKey}); canonical row #${prior.num}.`;
        log(`  duplicate external target ${externalApplyKey} already seen at row #${prior.num} - marking Discarded`);
        rewriteAppsRow(url, 'Discarded', note);
        const v = {
          url, num: meta.num, portal, task_type: taskType,
          script_claim: scriptClaim, worker_claim: null, worker_evidence_path: null,
          worker_ok: false, worker_diag: null, decision: 'Discarded',
          reason: note, external_apply_key: externalApplyKey, script_ms: scriptMs,
        };
        appendUrlVerdict(runDir, v);
        appendLedger(runDir, { event: 'url_verdict', ...v });
        failed++;
        continue;
      }
      externalApplyIndex.set(externalApplyKey, { num: meta.num, status: 'Seen', company: meta.company, role: meta.role });
    }

    // -- 3. Spawn worker (with one retry on missing evidence) -----------
    let workerResult = null;
    let workerEvidence = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      log(`  spawning ${taskType} worker (attempt ${attempt})`);
      const r = await spawnPerUrlWorker({
        url, taskType, runId: opts.runId, force: opts.force, profile,
        scriptResult: scriptOut, hint: null, verbose: opts.verbose,
        workerProvider: opts.workerProvider, workerModel: opts.workerModel,
      });
      workerResult = r;
      const evPath = r.result?.evidence_path;
      if (evPath) {
        const abs = evPath.startsWith('/') || /^[A-Za-z]:/.test(evPath)
          ? evPath
          : resolve(REPO_ROOT, evPath);
        if (existsSync(abs)) { workerEvidence = abs; break; }
      }
      log(`  attempt ${attempt}: no evidence file at claimed path (${evPath || 'none'})`);
      if (attempt === 2) break;
    }
    // Fallback: worker may have written evidence file but emitted empty stdout
    // (e.g. worker used Bash to write file but final assistant text was null).
    // Scan evidence dir for any file matching the URL slug written after this
    // URL's work started.
    if (!workerEvidence) {
      const evDir = resolve(runDir, 'evidence');
      const slug = urlSlug(url);
      try {
        const candidates = readdirSync(evDir)
          .filter(f => f.startsWith(slug + '-worker-') && f.endsWith('.json'))
          .sort().reverse(); // newest first
        if (candidates.length > 0) {
          const candidate = resolve(evDir, candidates[0]);
          let evClaim = null;
          try { evClaim = readJsonFile(candidate).claim; } catch { /* */ }
          workerEvidence = candidate;
          if (evClaim && (!workerResult?.ok || !workerResult?.result?.claim)) {
            if (!workerResult) workerResult = { ok: true, result: { claim: evClaim }, diag: {} };
            else { workerResult.ok = true; workerResult.result = { ...(workerResult.result || {}), claim: evClaim }; }
          }
          log(`  fallback: found evidence file on disk → claim=${evClaim || 'unknown'}`);
        }
      } catch { /* evDir missing or unreadable — leave no_evidence */ }
    }

    // -- 4. Decide ------------------------------------------------------
    const verdict = decideFromClaims({
      scriptClaim,
      workerClaim: workerResult?.result?.claim,
      workerEvidenceFile: workerEvidence,
      workerOk: workerResult?.ok === true,
    });
    log(`  decision=${verdict.decision} (${verdict.reason})`);

    const verdictEntry = {
      url, num: meta.num, portal, task_type: taskType,
      script_claim: scriptClaim,
      worker_claim: workerResult?.result?.claim || null,
      worker_evidence_path: workerEvidence,
      worker_ok: workerResult?.ok === true,
      worker_diag: workerResult?.diag || null,
      decision: verdict.decision,
      reason: verdict.reason,
      external_apply_key: externalApplyKey,
      script_ms: scriptMs,
    };
    appendUrlVerdict(runDir, verdictEntry);
    appendLedger(runDir, { event: 'url_verdict', ...verdictEntry });

    if (verdict.decision === 'Applied') {
      applied++;
      rewriteAppsRow(url, 'Applied', externalApplyKey ? `external_apply_key:${externalApplyKey}` : null);
      if (externalApplyKey) externalApplyIndex.set(externalApplyKey, { num: meta.num, status: 'Applied', company: meta.company, role: meta.role });
      // -- 5. autofix on Recover-applied --------------------------------
      if (opts.autofix && taskType === 'Recover') {
        appendErrorLog({
          phase: 'applied_via_mcp_recovery', run_id: opts.runId, url, portal,
          script_failed_step: scriptJson.steps?.find(s => s.ok === false)?.action || null,
          script_failed_selector: scriptJson.steps?.find(s => s.ok === false)?.selector || null,
          worker_evidence_path: workerEvidence,
        });
        // Detailed yaml-patch logic deferred — surface for parent-side review.
        autofixes++;
      }
    } else if (verdict.decision === 'AutoApplyFailed') {
      failed++;
      rewriteAppsRow(url, 'AutoApplyFailed', externalApplyKey ? `external_apply_key:${externalApplyKey}` : null);
    } else if (verdict.decision === 'MailtoDetected') {
      const evJson = workerEvidence ? readJsonFile(workerEvidence) : {};
      mailtoDetected.push({
        url, num: meta.num, portal, task_type: taskType,
        mailto_recipient: workerResult?.result?.mailto_recipient || evJson.mailto_recipient || null,
        role_title: workerResult?.result?.role_title || evJson.role_title || null,
        company_name: workerResult?.result?.company_name || evJson.company_name || null,
        worker_evidence_path: workerEvidence,
      });
      rewriteAppsRow(url, 'AutoApplyFailed', externalApplyKey ? `external_apply_key:${externalApplyKey}` : null);
    } else if (verdict.decision === 'disputed') {
      disputed.push({
        url, num: meta.num, portal, task_type: taskType,
        script_claim: scriptClaim,
        worker_claim: workerResult?.result?.claim || null,
        worker_evidence_path: workerEvidence,
        script_evidence_path: scriptJson.evidence_path || null,
        reason: verdict.reason,
      });
    } else { // no_evidence
      noEvidence.push({
        url, num: meta.num, portal, task_type: taskType,
        script_claim: scriptClaim,
        worker_err: workerResult?.err || null,
        worker_diag: workerResult?.diag || null,
        reason: verdict.reason,
      });
    }
    // Mark domain hit AFTER work completes so spacing measures real gap
    // between requests (not start-to-start of fast-failing URLs).
    lastDomainHitMs.set(dom, Date.now());
  }

  const ms = Date.now() - t0;
  appendLedger(runDir, { event: 'run_done', applied, failed, disputed: disputed.length, no_evidence: noEvidence.length, mailto_detected: mailtoDetected.length, autofixes, ms });

  console.log(JSON.stringify({
    ok: true,
    mode: 'run',
    run_id: opts.runId,
    total: urls.length,
    applied,
    failed,
    disputed,
    no_evidence: noEvidence,
    mailto_detected: mailtoDetected,
    autofixes,
    ms,
  }, null, 2));
}

// =========================================================================

async function main() {
  const opts = parseArgs(process.argv);
  log(`mode=${opts.mode} force=${opts.force} autofix=${opts.autofix} dryRun=${opts.dryRun} verbose=${opts.verbose} limit=${opts.limit === Infinity ? 'all' : opts.limit}`);

  switch (opts.mode) {
    case 'plan':
      modePlan(opts);
      break;
    case 'run':
      await modeRun(opts);
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
