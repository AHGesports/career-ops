#!/usr/bin/env node
// append-pipeline.mjs — atomically append extracted URLs + tsv rows.
//
// Routes URLs by classifier tag:
//   - auto-match → data/pipeline.md (score 5.0, [x] auto-match)
//                + batch/tracker-additions/<date>-gmail-automatch.tsv (one row per URL)
//                  so merge-tracker.mjs picks them up into applications.md
//                  (dashboard reads applications.md only)
//   - deferred   → data/pipeline-deferred.md (URL | title | sender | date)
//                  awaits /deeper-eval skill
//
// Dedup: re-checks pipeline.md + applications.md + pipeline-deferred.md
//        RIGHT BEFORE appending (in case files changed since extract step).
//
// Dry-run by default. Pass --commit to actually write.
//
// Usage:
//   node scripts/append-pipeline.mjs --in mcp/gmail-html/runs/<file>.json
//   node scripts/append-pipeline.mjs --in <file> --commit

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const PIPELINE_MD = join(PROJECT_ROOT, 'data', 'pipeline.md');
const DEFERRED_MD = join(PROJECT_ROOT, 'data', 'pipeline-deferred.md');
const LISTS_MD = join(PROJECT_ROOT, 'data', 'pipeline-lists.md');
const HISTORY_TSV = join(PROJECT_ROOT, 'data', 'gmail-scan-history.tsv');
const APPS_MD = join(PROJECT_ROOT, 'data', 'applications.md');
const TRACKER_ADD_DIR = join(PROJECT_ROOT, 'batch', 'tracker-additions');

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
const nowIso = new Date().toISOString().slice(0, 16) + 'Z'; // YYYY-MM-DDTHH:MMZ for pipeline comments

// ---------- helpers ----------
function senderShort(email) {
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
    ['app.instaffo.com', 'instaffo'],
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
  add(DEFERRED_MD);
  add(LISTS_MD);
  return set;
}

// Try to derive a company + role from the URL slug for the applications.md entry.
// Best-effort — if it looks weird, merge-tracker still dedups by URL/role tokens.
//
// Per-host handlers cover the URL shapes that the generic slug parser can't decode:
//   - Indeed:    /viewjob?jk=<hex>           → no title in URL → use sender + jk
//   - LinkedIn:  /jobs/view/<numeric-id>     → no title in URL → use sender + id
//   - Theprotocol: /szczegoly/praca/<slug>,oferta,<uuid> → strip the comma tail
//   - NoFluffJobs: /pl/job/<role>-<company>-remote → company is at the END, before -remote
// Other senders (JJIT, GTJ, XING resolved, Stepstone resolved) get the generic parser.
function deriveCompanyRole(url, subject) {
  const tc = s => (s || '').replace(/\b([a-z])/g, m => m.toUpperCase()).trim();
  let host = '', pathname = '', searchParams;
  try {
    const u = new URL(url);
    host = u.host;
    pathname = u.pathname;
    searchParams = u.searchParams;
  } catch {
    pathname = url;
  }

  // ---- Indeed: /viewjob?jk=<hex> ----
  if (host.endsWith('indeed.com')) {
    const jk = (searchParams && searchParams.get('jk')) || '';
    // Indeed subjects come in EN/DE/NL: "1 new <role> job at X", "1 <role> Job in Y",
    // "2 nieuwe <role> vacatures in Z". Strip leading "<digit> [new|nieuwe]" and the
    // language-specific noun ("Job", "Jobs", "vacature", "vacatures") + connector.
    let role = subject || '';
    role = role
      .replace(/^\d+\s+(?:new\s+|nieuwe\s+)?/i, '')
      .replace(/\s+(?:jobs?|vacatures?)\s+(?:at|for|in)\s+/i, ' @ ')
      .slice(0, 80);
    return {
      company: 'Indeed',
      role: tc(role) || `Job ${jk.slice(0, 8)}`,
    };
  }

  // ---- LinkedIn: /jobs/view/<id> ----
  if (host.endsWith('linkedin.com')) {
    const id = (pathname.match(/\/jobs\/view\/(\d+)/) || [])[1] || '';
    let role = subject || '';
    role = role.replace(/^\d+\s+new\s+jobs?\s+(?:matching|for)\s+/i, '').slice(0, 80);
    return {
      company: 'LinkedIn',
      role: tc(role) || `Job ${id}`,
    };
  }

  // ---- Theprotocol: <role-slug>,oferta,<uuid> ----
  if (host.endsWith('theprotocol.it')) {
    const last = pathname.split('/').filter(Boolean).pop() || '';
    const slug = last.split(',')[0]; // chop the ",oferta,<uuid>" tail
    const words = slug.split(/[-_]+/).filter(Boolean);
    if (words.length >= 3) {
      // Last 1–2 words tend to be city; preceding = role title. No company in URL.
      // Use a placeholder company so dedup remains stable.
      return {
        company: 'theprotocol.it',
        role: tc(words.join(' ')),
      };
    }
    return { company: 'theprotocol.it', role: tc(slug.replace(/[-_]+/g, ' ')) };
  }

  // ---- NoFluffJobs: /pl/job/<slug>; slug shape <role>-<company>-(remote|onsite)[-N]
  // No reliable role/company boundary inside slug → use sender as company, slug as role.
  if (host.endsWith('nofluffjobs.com')) {
    const last = pathname.split('/').filter(Boolean).pop() || '';
    const core = last.replace(/-(remote|onsite)(?:-\d+)?$/, '').replace(/--+/g, '-');
    return { company: 'NoFluffJobs', role: tc(core.replace(/[-_]+/g, ' ')) };
  }

  // ---- Stepstone resolved: /stellenangebote----<id>-inline.html — no title in URL
  if (host.endsWith('stepstone.de') || host.endsWith('stepstone.at')) {
    const m = pathname.match(/stellenangebote----(\d+)/);
    const id = m ? m[1] : '';
    return { company: 'Stepstone', role: id ? `Job ${id}` : 'Job' };
  }

  // ---- XING resolved: /jobs/<location-slug>-<title-slug>-<id>
  // Generic parser splits "Wien Senior" as company which is wrong. Use sender as company.
  if (host.endsWith('xing.com')) {
    const last = pathname.split('/').filter(Boolean).pop() || '';
    // strip trailing numeric id
    const core = last.replace(/-\d{5,}$/, '');
    return { company: 'XING', role: tc(core.replace(/[-_]+/g, ' ')) };
  }

  // ---- Instaffo direct recommendations: /candidate/job/<uuid>
  if (host.endsWith('instaffo.com') && pathname.includes('/candidate/job/')) {
    let role = subject || '';
    role = role
      .replace(/^Arshia,\s*/i, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80);
    return { company: 'Instaffo', role: tc(role) || 'Job Recommendation' };
  }

  // ---- JustJoinIT: /job-offer/<company-slug>-<title>-<location>-<stack>[-<id>]
  // Company is at the START. First 1-2 hyphen tokens. Use sender as company for safety.
  if (host.endsWith('justjoin.it')) {
    const last = pathname.split('/').filter(Boolean).pop() || '';
    // strip trailing -<hex-id> or -<digits>
    const core = last.replace(/-[a-f0-9]{6,}$/i, '').replace(/-\d{5,}$/, '');
    return { company: 'JustJoinIT', role: tc(core.replace(/[-_]+/g, ' ')) };
  }

  // ---- GermanTechJobs: tracker-redirect URL has jobId
  if (host.endsWith('germantechjobs.de')) {
    const id = (searchParams && searchParams.get('jobId')) || '';
    return { company: 'GermanTechJobs', role: id ? `Job ${id.slice(0, 12)}` : 'Job' };
  }

  // ---- Generic fallback (unmapped senders) ----
  let slug = (pathname.split('/').filter(Boolean).pop() || host);
  slug = slug.replace(/-[a-f0-9]{6,}$/i, '').replace(/-\d{5,}$/, '');
  const words = slug.split(/[-_]+/).filter(Boolean);
  let company, role;
  if (words.length <= 2) {
    company = words.join(' ') || 'Unknown';
    role = slug.replace(/[-_]+/g, ' ');
  } else {
    company = words.slice(0, 2).join(' ');
    role = words.slice(2).join(' ');
  }
  return { company: tc(company), role: tc(role) || tc(company) };
}

function senderToHostHint(sender) {
  // Senders are domains; return the host part for display in deferred file
  return (sender || '').split('@')[1] || sender;
}

const knownUrls = loadKnownUrls();
const newPipelineLines = [];        // auto-match → pipeline.md
const newDeferredLines = [];        // deferred → pipeline-deferred.md
const newListLines = [];            // tracker_dropped_lists → pipeline-lists.md
const newTrackerRows = [];          // auto-match → batch/tracker-additions/<file>.tsv
const newTsvRows = [];              // gmail-scan-history.tsv (one per thread, existing behavior)
let appendedFinalDup = 0;

const extractionToNote = (r) => {
  if (r.skip_reason) return r.skip_reason;
  if ((r.urls?.length || 0) === 0 && (r.trackers_to_follow?.length || 0) === 0) return '0 URLs (none extracted)';
  if ((r.urls?.length || 0) === 0 && (r.trackers_to_follow?.length || 0)) return `0 URLs (all ${r.trackers_to_follow.length} trackers unresolved)`;
  const c = r.classified || [];
  const am = c.filter(x => x.tag === 'auto-match').length;
  const df = c.filter(x => x.tag === 'deferred').length;
  return `${r.urls.length} URLs (${r.extraction}, auto-match=${am}, deferred=${df})`;
};

// Read current max entry # from applications.md so auto-match rows continue the
// natural sequence rather than colliding (or jumping to 9000+).
function loadAppsMaxNum() {
  if (!existsSync(APPS_MD)) return 0;
  const text = readFileSync(APPS_MD, 'utf8');
  let max = 0;
  for (const line of text.split('\n')) {
    if (!line.startsWith('|')) continue;
    const m = line.match(/^\|\s*(\d+)\s*\|/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return max;
}
let tsvSeq = loadAppsMaxNum() + 1;

for (const r of data.results) {
  const tag = senderShort(r.sender);
  const subject = r.metadata?.subject || '';
  const classified = r.classified || (r.urls || []).map(u => ({ url: u, tag: 'deferred', matched: [], excluded: [] }));

  for (const c of classified) {
    if (knownUrls.has(c.url)) {
      appendedFinalDup++;
      continue;
    }
    knownUrls.add(c.url);

    if (c.tag === 'auto-match') {
      const { company, role } = deriveCompanyRole(c.url, subject);
      // pipeline.md row — pre-checked, no further processing needed, score 5.0
      newPipelineLines.push(
        `- [x] AUTO-MATCH | 5.0/5 | ${c.url}     <!-- via Gmail:${tag} ${nowIso} auto-match: ${c.matched.join(',')} -->`
      );
      // tracker-additions TSV row (9 cols: num\tdate\tcompany\trole\tstatus\tscore\tpdf\treport\tnotes)
      const noteUrl = c.url.replace(/\t/g, ' ');
      const matchedKw = c.matched.join(',');
      const noteText = `Auto-match (gmail:${tag}). matched=[${matchedKw}]. URL: ${noteUrl}`.replace(/\t/g, ' ');
      newTrackerRows.push(
        [tsvSeq++, today, company, role, 'Auto-Match', '5.0/5', '❌', '—', noteText].join('\t')
      );
    } else {
      // deferred — title from email subject + sender; URL kept verbatim
      const safeSubject = subject.replace(/\|/g, '/').replace(/\s+/g, ' ').slice(0, 140);
      newDeferredLines.push(
        `- [ ] ${c.url} | ${safeSubject || '(no subject)'} | ${senderToHostHint(r.sender)} | ${nowIso}`
      );
    }
  }

  // List/SERP URLs that resolved on the sender's own domain but aren't single-job shape.
  // User asked: "marked as something else" → keep them but route to a separate file
  // so they don't pollute pipeline/applications. User can manually browse later.
  for (const url of (r.tracker_dropped_lists || [])) {
    if (knownUrls.has(url)) { appendedFinalDup++; continue; }
    knownUrls.add(url);
    const safeSubject = subject.replace(/\|/g, '/').replace(/\s+/g, ' ').slice(0, 140);
    newListLines.push(
      `- [ ] ${url} | ${safeSubject || '(no subject)'} | ${senderToHostHint(r.sender)} | ${nowIso}`
    );
  }

  // One scan-history row per processed thread (informational; existing behavior)
  newTsvRows.push(`${today}\t${r.thread_id}\t${r.sender}\t${extractionToNote(r)}`);
}

// Untested-warning rows (informational only)
for (const w of (data.skips?.untested_warnings || [])) {
  newTsvRows.push(`${today}\t${w.thread_id}\t${w.sender}\t0 URLs (UNTESTED — needs user inspection, html_len=${w.html_length})`);
}

// ---------- preview / commit ----------
const pipeBefore = existsSync(PIPELINE_MD) ? readFileSync(PIPELINE_MD, 'utf8').split('\n').length : 0;
const defBefore = existsSync(DEFERRED_MD) ? readFileSync(DEFERRED_MD, 'utf8').split('\n').length : 0;
const listBefore = existsSync(LISTS_MD) ? readFileSync(LISTS_MD, 'utf8').split('\n').length : 0;
const tsvBefore = existsSync(HISTORY_TSV) ? readFileSync(HISTORY_TSV, 'utf8').split('\n').length : 0;

if (!commit) {
  process.stdout.write(
    `gmail-append: DRY RUN (pass --commit to write)\n` +
    `pipeline.md            ${pipeBefore} → ${pipeBefore + newPipelineLines.length}  (+${newPipelineLines.length})  [auto-match]\n` +
    `pipeline-deferred.md   ${defBefore} → ${defBefore + newDeferredLines.length}  (+${newDeferredLines.length})  [deferred]\n` +
    `pipeline-lists.md      ${listBefore} → ${listBefore + newListLines.length}  (+${newListLines.length})  [lists/SERP]\n` +
    `gmail-scan-history.tsv ${tsvBefore} → ${tsvBefore + newTsvRows.length}  (+${newTsvRows.length})\n` +
    `tracker-additions:     +${newTrackerRows.length} TSV rows (one file, will be picked up by merge-tracker.mjs)\n` +
    `final-dup skipped:     ${appendedFinalDup}\n` +
    `\nfirst 5 auto-match pipeline lines:\n${newPipelineLines.slice(0, 5).join('\n') || '(none)'}\n` +
    `\nfirst 5 deferred lines:\n${newDeferredLines.slice(0, 5).join('\n') || '(none)'}\n` +
    `\nfirst 5 list/SERP lines:\n${newListLines.slice(0, 5).join('\n') || '(none)'}\n` +
    `\nfirst 3 tracker-additions rows:\n${newTrackerRows.slice(0, 3).join('\n') || '(none)'}\n`
  );
  process.exit(0);
}

// ---------- COMMIT ----------

// 1) pipeline.md — insert auto-match lines before "## Procesadas" or at end of "## Pendientes"
if (newPipelineLines.length > 0) {
  let pipelineText = readFileSync(PIPELINE_MD, 'utf8');
  const procesadasIdx = pipelineText.indexOf('## Procesadas');
  const insertion = newPipelineLines.join('\n') + '\n';
  if (procesadasIdx !== -1) {
    pipelineText = pipelineText.slice(0, procesadasIdx) + insertion + '\n' + pipelineText.slice(procesadasIdx);
  } else {
    pipelineText = pipelineText.trimEnd() + '\n' + insertion;
  }
  writeFileSync(PIPELINE_MD, pipelineText);
}

// 2) pipeline-deferred.md — append under "## Pendientes" (create file if missing)
if (newDeferredLines.length > 0) {
  if (!existsSync(DEFERRED_MD)) {
    writeFileSync(
      DEFERRED_MD,
      `# Pipeline — Deferred (Generic Software Roles)\n\n` +
      `Generic SWE roles found by /scan-gmail that did NOT hit the auto-match keyword filter.\n` +
      `Run /deeper-eval to evaluate these via WebFetch (Chrome MCP fallback) using oferta.md A-G.\n\n` +
      `## Pendientes\n\n`
    );
  }
  let defText = readFileSync(DEFERRED_MD, 'utf8');
  const procIdx = defText.indexOf('## Procesadas');
  const insertion = newDeferredLines.join('\n') + '\n';
  if (procIdx !== -1) {
    defText = defText.slice(0, procIdx) + insertion + '\n' + defText.slice(procIdx);
  } else {
    defText = defText.trimEnd() + '\n' + insertion;
  }
  writeFileSync(DEFERRED_MD, defText);
}

// 2b) pipeline-lists.md — list/SERP URLs that resolved on the sender's own domain
//     but aren't a single-job posting (search results, recommended jobs, category pages).
//     Kept separately so user can browse for additional jobs without polluting applications.
if (newListLines.length > 0) {
  if (!existsSync(LISTS_MD)) {
    writeFileSync(
      LISTS_MD,
      `# Pipeline — Lists / SERPs / Recommendations\n\n` +
      `URLs that resolved on a known job-board domain but are NOT single job postings.\n` +
      `These are search results, "recommended jobs", category pages, etc. Open them manually\n` +
      `to discover more jobs; new findings can be pasted into pipeline.md.\n\n` +
      `## Pendientes\n\n`
    );
  }
  let listText = readFileSync(LISTS_MD, 'utf8');
  const procIdx = listText.indexOf('## Procesadas');
  const insertion = newListLines.join('\n') + '\n';
  if (procIdx !== -1) {
    listText = listText.slice(0, procIdx) + insertion + '\n' + listText.slice(procIdx);
  } else {
    listText = listText.trimEnd() + '\n' + insertion;
  }
  writeFileSync(LISTS_MD, listText);
}

// 3) batch/tracker-additions/<date>-gmail-automatch-<ts>.tsv (one file, one row per URL)
if (newTrackerRows.length > 0) {
  if (!existsSync(TRACKER_ADD_DIR)) mkdirSync(TRACKER_ADD_DIR, { recursive: true });
  // merge-tracker.mjs expects ONE addition per file. Write N files.
  let i = 0;
  for (const row of newTrackerRows) {
    i++;
    const fname = `${today}-gmail-automatch-${String(i).padStart(3, '0')}.tsv`;
    writeFileSync(join(TRACKER_ADD_DIR, fname), row + '\n');
  }
}

// 4) gmail-scan-history.tsv — append all thread rows
if (newTsvRows.length > 0) {
  const tsvText = existsSync(HISTORY_TSV) ? readFileSync(HISTORY_TSV, 'utf8') : '';
  const tsvOut = tsvText.endsWith('\n') || tsvText === '' ? tsvText : tsvText + '\n';
  writeFileSync(HISTORY_TSV, tsvOut + newTsvRows.join('\n') + '\n');
}

// Verify
const pipeAfter = existsSync(PIPELINE_MD) ? readFileSync(PIPELINE_MD, 'utf8').split('\n').length : 0;
const defAfter = existsSync(DEFERRED_MD) ? readFileSync(DEFERRED_MD, 'utf8').split('\n').length : 0;
const listAfter = existsSync(LISTS_MD) ? readFileSync(LISTS_MD, 'utf8').split('\n').length : 0;
const tsvAfter = existsSync(HISTORY_TSV) ? readFileSync(HISTORY_TSV, 'utf8').split('\n').length : 0;

process.stdout.write(
  `gmail-append: COMMITTED\n` +
  `pipeline.md            ${pipeBefore} → ${pipeAfter}  (+${pipeAfter - pipeBefore})  [target: ${newPipelineLines.length}]\n` +
  `pipeline-deferred.md   ${defBefore} → ${defAfter}  (+${defAfter - defBefore})  [target: ${newDeferredLines.length}]\n` +
  `pipeline-lists.md      ${listBefore} → ${listAfter}  (+${listAfter - listBefore})  [target: ${newListLines.length}]\n` +
  `gmail-scan-history.tsv ${tsvBefore} → ${tsvAfter}  (+${tsvAfter - tsvBefore})  [target: ${newTsvRows.length}]\n` +
  `tracker-additions:     +${newTrackerRows.length} TSV files written\n` +
  `final-dup skipped:     ${appendedFinalDup}\n`
);

const pipeDelta = pipeAfter - pipeBefore;
const defDelta = defAfter - defBefore;
const listDelta = listAfter - listBefore;
const tsvDelta = tsvAfter - tsvBefore;
let mismatch = false;
if (pipeDelta < newPipelineLines.length) {
  process.stderr.write(`MISMATCH: pipeline delta ${pipeDelta} < expected ${newPipelineLines.length}\n`);
  mismatch = true;
}
if (defDelta < newDeferredLines.length) {
  process.stderr.write(`MISMATCH: deferred delta ${defDelta} < expected ${newDeferredLines.length}\n`);
  mismatch = true;
}
if (listDelta < newListLines.length) {
  process.stderr.write(`MISMATCH: lists delta ${listDelta} < expected ${newListLines.length}\n`);
  mismatch = true;
}
if (tsvDelta < newTsvRows.length) {
  process.stderr.write(`MISMATCH: scan-history tsv delta ${tsvDelta} < expected ${newTsvRows.length}\n`);
  mismatch = true;
}
process.exit(mismatch ? 3 : 0);
