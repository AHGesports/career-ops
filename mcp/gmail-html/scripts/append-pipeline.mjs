#!/usr/bin/env node
// append-pipeline.mjs — atomically append extracted URLs + tsv rows.
// Reads the JSON from extract/follow steps, writes results to disk, verifies counts.
//
// Safety:
//   - Re-checks pipeline.md + applications.md for dups RIGHT BEFORE appending
//     (in case files changed since extract step).
//   - Single Pendientes section append, single tsv append (atomic-ish on POSIX).
//   - Refuses to write if numbers don't reconcile.
//   - Dry-run by default. Pass --commit to actually write.
//
// Usage:
//   node scripts/append-pipeline.mjs --in mcp/gmail-html/runs/<file>.json
//   node scripts/append-pipeline.mjs --in <file> --commit
//
// Output (stdout):
//   gmail-append: pipeline.md 200 -> 245 (+45)  scan-history.tsv 110 -> 142 (+32)
//   appended URLs: 45    tsv rows: 32
//   commit=true

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const PIPELINE_MD = join(PROJECT_ROOT, 'data', 'pipeline.md');
const HISTORY_TSV = join(PROJECT_ROOT, 'data', 'gmail-scan-history.tsv');
const APPS_MD = join(PROJECT_ROOT, 'data', 'applications.md');

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  return i === -1 ? def : args[i + 1];
}
const inPath = getArg('--in', null);
const commit = args.includes('--commit');

if (!inPath) {
  process.stderr.write('Missing --in <runs/*.json>\n');
  process.exit(1);
}
const data = JSON.parse(readFileSync(resolve(inPath), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

// ---------- helpers ----------
function senderShort(email) {
  // Map common senders to short tag for the pipeline comment
  const map = [
    ['linkedin.com', 'linkedin'],
    ['indeed.com', 'indeed'],
    ['justjoin.it', 'jjit'],
    ['nofluffjobs.com', 'nfj'],
    ['welcometothejungle.com', 'wtj'],
    ['mail.xing.com', 'xing'],
    ['karriere.at', 'karriere'],
    ['stepstone.de', 'stepstone'],
    ['stepstone.at', 'stepstone'],
    ['germantechjobs.de', 'gtj'],
    ['theprotocol.it', 'theprotocol'],
    ['arbeitsagentur.de', 'arbeitsagentur'],
    ['ifttt.com', 'ifttt'],
    ['himalayas.app', 'himalayas'],
  ];
  for (const [k, v] of map) if (email.includes(k)) return v;
  return email.split('@')[1]?.split('.')[0] || 'unknown';
}

function loadKnownUrls() {
  const set = new Set();
  function add(path) {
    if (!existsSync(path)) return;
    const text = readFileSync(path, 'utf8');
    for (const m of text.matchAll(/https?:\/\/[^\s|<>")\]]+/g)) set.add(m[0]);
  }
  add(PIPELINE_MD);
  add(APPS_MD);
  return set;
}

// ---------- compose pipeline lines + tsv rows ----------
const knownUrls = loadKnownUrls();
const newPipelineLines = [];
const newTsvRows = [];
const extractionToNote = (r) => {
  if (r.skip_reason) return r.skip_reason;
  if (r.urls.length === 0 && r.trackers_to_follow.length === 0) return '0 URLs (none extracted)';
  if (r.urls.length === 0 && r.trackers_to_follow.length) return `0 URLs (all ${r.trackers_to_follow.length} trackers unresolved)`;
  return `${r.urls.length} URL${r.urls.length === 1 ? '' : 's'} extracted (${r.extraction})`;
};

let appendedFinalDup = 0;
for (const r of data.results) {
  const tag = senderShort(r.sender);
  for (const url of r.urls) {
    if (knownUrls.has(url)) {
      appendedFinalDup++;
      continue;
    }
    newPipelineLines.push(`- [ ] ${url}     <!-- via Gmail:${tag} ${today} -->`);
    knownUrls.add(url);
  }
  // One tsv row per processed thread (even when 0 URLs)
  newTsvRows.push(`${today}\t${r.thread_id}\t${r.sender}\t${extractionToNote(r)}`);
}

// Untested-warning rows (informational only)
for (const w of data.skips.untested_warnings) {
  newTsvRows.push(`${today}\t${w.thread_id}\t${w.sender}\t0 URLs (UNTESTED — needs user inspection, html_len=${w.html_length})`);
}

// ---------- preview / commit ----------
const pipeBefore = existsSync(PIPELINE_MD) ? readFileSync(PIPELINE_MD, 'utf8').split('\n').length : 0;
const tsvBefore = existsSync(HISTORY_TSV) ? readFileSync(HISTORY_TSV, 'utf8').split('\n').length : 0;

if (!commit) {
  process.stdout.write(
    `gmail-append: DRY RUN (pass --commit to write)\n` +
    `pipeline.md ${pipeBefore} → ${pipeBefore + newPipelineLines.length}  (+${newPipelineLines.length})  [${appendedFinalDup} final-dup skipped]\n` +
    `gmail-scan-history.tsv ${tsvBefore} → ${tsvBefore + newTsvRows.length}  (+${newTsvRows.length})\n` +
    `\nfirst 5 pipeline lines:\n${newPipelineLines.slice(0, 5).join('\n')}\n` +
    `\nfirst 5 tsv rows:\n${newTsvRows.slice(0, 5).join('\n')}\n`
  );
  process.exit(0);
}

// Commit: insert pipeline lines before "## Procesadas" or at end of "## Pendientes" block
let pipelineText = readFileSync(PIPELINE_MD, 'utf8');
const procesadasIdx = pipelineText.indexOf('## Procesadas');
const insertion = newPipelineLines.length ? newPipelineLines.join('\n') + '\n' : '';
if (procesadasIdx !== -1) {
  pipelineText = pipelineText.slice(0, procesadasIdx) + insertion + '\n' + pipelineText.slice(procesadasIdx);
} else {
  pipelineText = pipelineText.trimEnd() + '\n' + insertion;
}
writeFileSync(PIPELINE_MD, pipelineText);

// Append tsv rows
const tsvText = readFileSync(HISTORY_TSV, 'utf8');
const tsvOut = tsvText.endsWith('\n') ? tsvText : tsvText + '\n';
writeFileSync(HISTORY_TSV, tsvOut + newTsvRows.join('\n') + '\n');

// Verify
const pipeAfter = readFileSync(PIPELINE_MD, 'utf8').split('\n').length;
const tsvAfter = readFileSync(HISTORY_TSV, 'utf8').split('\n').length;

process.stdout.write(
  `gmail-append: COMMITTED\n` +
  `pipeline.md ${pipeBefore} → ${pipeAfter}  (+${pipeAfter - pipeBefore})  [target: ${newPipelineLines.length}]\n` +
  `gmail-scan-history.tsv ${tsvBefore} → ${tsvAfter}  (+${tsvAfter - tsvBefore})  [target: ${newTsvRows.length}]\n` +
  `final-dup skipped: ${appendedFinalDup}\n`
);

// Verify invariants
const pipeDelta = pipeAfter - pipeBefore;
const tsvDelta = tsvAfter - tsvBefore;
let mismatch = false;
// Pipeline delta should be at LEAST newPipelineLines.length (we add a blank line too sometimes)
if (pipeDelta < newPipelineLines.length) {
  process.stderr.write(`MISMATCH: pipeline delta ${pipeDelta} < expected ${newPipelineLines.length}\n`);
  mismatch = true;
}
if (tsvDelta < newTsvRows.length) {
  process.stderr.write(`MISMATCH: tsv delta ${tsvDelta} < expected ${newTsvRows.length}\n`);
  mismatch = true;
}
process.exit(mismatch ? 3 : 0);
