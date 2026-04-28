#!/usr/bin/env node
// scan.mjs — orchestrator: extract → (follow trackers) → append.
// One command for agents. Prints the canonical Section 9 summary block.
//
// Usage:
//   node scripts/scan.mjs --window 7d                       # dry run, no writes
//   node scripts/scan.mjs --window 7d --commit              # write to pipeline + tsv
//   node scripts/scan.mjs --window 7d --no-follow           # skip Case B (faster, leaves trackers unresolved)
//   node scripts/scan.mjs --window 7d --commit --rescan-giveup-only
//
// Exits 0 on success, non-zero on failure. Stdout is the only thing the agent
// needs to read. The detailed run JSON stays on disk at mcp/gmail-html/runs/.

import { spawnSync } from 'child_process';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, statSync, readdirSync } from 'fs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const PIPELINE_MD = join(PROJECT_ROOT, 'data', 'pipeline.md');
const HISTORY_TSV = join(PROJECT_ROOT, 'data', 'gmail-scan-history.tsv');

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  return i === -1 ? def : args[i + 1];
}
function hasFlag(name) { return args.includes(name); }

const window = getArg('--window', '1d');
const commit = hasFlag('--commit');
const noFollow = hasFlag('--no-follow');
const rescanGiveupOnly = hasFlag('--rescan-giveup-only');
const includeSuccess = hasFlag('--include-success');

function run(label, scriptArgs) {
  process.stdout.write(`\n--- ${label} ---\n`);
  const r = spawnSync(process.execPath, scriptArgs, { cwd: PROJECT_ROOT, stdio: 'inherit' });
  if (r.status !== 0) {
    process.stderr.write(`\nscan: ${label} failed (exit ${r.status}).\n`);
    process.exit(r.status || 1);
  }
}

function findLatestRun() {
  const runsDir = join(SCRIPT_DIR, '..', 'runs');
  if (!existsSync(runsDir)) return null;
  const files = readdirSync(runsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ f, mtime: statSync(join(runsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length ? join(runsDir, files[0].f) : null;
}

const pipeBefore = existsSync(PIPELINE_MD) ? readFileSync(PIPELINE_MD, 'utf8').split('\n').length : 0;
const tsvBefore = existsSync(HISTORY_TSV) ? readFileSync(HISTORY_TSV, 'utf8').split('\n').length : 0;

// ---------- Step 1: extract ----------
const extractArgs = [join(SCRIPT_DIR, 'extract-urls.mjs'), '--window', window];
if (rescanGiveupOnly) extractArgs.push('--rescan-giveup-only');
if (includeSuccess) extractArgs.push('--include-success');
run('extract-urls', extractArgs);

// Find the JSON it just wrote
const latestRun = findLatestRun();
if (!latestRun) {
  process.stderr.write('scan: extract step produced no runs/*.json\n');
  process.exit(1);
}

// ---------- Step 2: follow trackers (optional) ----------
let runData = JSON.parse(readFileSync(latestRun, 'utf8'));
const trackerCount = runData.results.reduce((n, r) => n + (r.trackers_to_follow?.length || 0), 0);

if (trackerCount > 0 && !noFollow) {
  // Try follow-trackers; if Playwright not installed, exit code is 2 — emit warning.
  process.stdout.write(`\n--- follow-trackers (${trackerCount} URLs) ---\n`);
  const r = spawnSync(process.execPath, [join(SCRIPT_DIR, 'follow-trackers.mjs'), '--in', latestRun],
    { cwd: PROJECT_ROOT, stdio: 'inherit' });
  if (r.status === 2) {
    process.stdout.write(
      `\nNOTE: Playwright not installed — ${trackerCount} trackers left unresolved.\n` +
      `Install with: cd mcp/gmail-html && npm install playwright && npx playwright install chromium\n` +
      `Or pass --no-follow to skip the prompt.\n`
    );
  } else if (r.status !== 0) {
    process.stderr.write(`scan: follow-trackers failed (exit ${r.status}). Continuing to append step.\n`);
  }
  runData = JSON.parse(readFileSync(latestRun, 'utf8'));
}

// ---------- Step 3: append (dry or commit) ----------
const appendArgs = [join(SCRIPT_DIR, 'append-pipeline.mjs'), '--in', latestRun];
if (commit) appendArgs.push('--commit');
run('append-pipeline' + (commit ? ' --commit' : ' (dry-run)'), appendArgs);

// ---------- Step 4: emit Section 9 summary ----------
const pipeAfter = existsSync(PIPELINE_MD) ? readFileSync(PIPELINE_MD, 'utf8').split('\n').length : 0;
const tsvAfter = existsSync(HISTORY_TSV) ? readFileSync(HISTORY_TSV, 'utf8').split('\n').length : 0;

const stats = runData.stats;
let urlsResolved = 0, trackersInput = 0, trackersResolved = 0, trackersFailed = 0;
const bySender = {};
for (const r of runData.results) {
  urlsResolved += r.urls.length;
  if (r.extraction === 'tracker') {
    trackersInput += r.trackers_to_follow?.length || 0;
    trackersFailed += r.tracker_failures?.length || 0;
    trackersResolved += r.urls.length;
  }
  if (!bySender[r.sender]) bySender[r.sender] = { threads: 0, urls: 0 };
  bySender[r.sender].threads++;
  bySender[r.sender].urls += r.urls.length;
}
const trackersUnresolved = trackersInput - trackersResolved - trackersFailed;

process.stdout.write('\n=========================================================\n');
process.stdout.write(`Gmail scan — ${window}\n`);
process.stdout.write(`  Threads:  ${stats.seen} seen / ${stats.history_skip} skipped (history) / ${stats.giveup_rescan} rescan (prior giveup) / ${stats.processed} processed\n`);
process.stdout.write(`  URLs:     ${urlsResolved} resolved (after dedup + noise + final-dup)\n`);
process.stdout.write(`  Trackers: ${trackersInput} total / ${trackersResolved} resolved / ${trackersFailed} failed / ${trackersUnresolved} unresolved (no-follow)\n`);
process.stdout.write(`  Files:    pipeline.md ${pipeBefore} → ${pipeAfter} (+${pipeAfter - pipeBefore})\n`);
process.stdout.write(`            gmail-scan-history.tsv ${tsvBefore} → ${tsvAfter} (+${tsvAfter - tsvBefore})\n`);
process.stdout.write(`            run JSON: ${relative(PROJECT_ROOT, latestRun).replace(/\\/g, '/')}\n`);
process.stdout.write(`\n  By sender (sender: threads / urls):\n`);
for (const [s, v] of Object.entries(bySender)) {
  process.stdout.write(`    ${s}: ${v.threads} / ${v.urls}\n`);
}
process.stdout.write(`\n  SKIPS:\n`);
process.stdout.write(`    History dedup:     ${runData.skips.history_dedup.length} threads\n`);
process.stdout.write(`    Parse errors:      ${runData.skips.parse_errors.length}\n`);
process.stdout.write(`    Unknown senders:   ${runData.skips.unknown_senders.length}\n`);
process.stdout.write(`    Untested senders:  ${runData.skips.untested_warnings.length}` +
  (runData.skips.untested_warnings.length
    ? ` — ${runData.skips.untested_warnings.map(w => w.sender).join(', ')}`
    : '') + '\n');
if (!commit) process.stdout.write(`\n  (DRY RUN — pass --commit to write to disk)\n`);
process.stdout.write('=========================================================\n');
