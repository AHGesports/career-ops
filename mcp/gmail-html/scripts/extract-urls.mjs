#!/usr/bin/env node
// extract-urls.mjs — fetch Gmail threads via gmail-html auth, decode per-sender,
// output structured JSON. The agent never sees raw HTML.
//
// Usage:
//   node scripts/extract-urls.mjs --window 7d
//   node scripts/extract-urls.mjs --window 7d --include-success
//   node scripts/extract-urls.mjs --rescan-giveup-only --window 14d
//   node scripts/extract-urls.mjs --thread <id>           # single-thread debug
//   node scripts/extract-urls.mjs --window 7d --json      # emit full JSON to stdout (token-heavy, avoid)
//
// Default behavior: write full JSON to `mcp/gmail-html/runs/<timestamp>.json`
// and print a tight summary block to stdout. Agents read the file only when
// they need specific entries.
//
// Output (stdout, summary text):
//   gmail-extract: window=7d  seen=59 hist_skip=17 giveup_rescan=31 processed=12
//   urls (resolved): 8        trackers (need follow): 24
//   skips: parse_errors=0 unknown=0 untested=0 history_dedup=17
//   wrote: mcp/gmail-html/runs/2026-04-27T13-01-01.json
//
// Full JSON shape (in the file):
// {
//   "window": "7d",
//   "now": "2026-04-27T...",
//   "stats": { "seen": 59, "history_skip": 17, "giveup_rescan": 31, "processed": 12 },
//   "results": [
//     { "thread_id": "...", "sender": "...", "extraction": "direct", "urls": [...], "trackers_to_follow": [...], "skip_reason": null, "metadata": {...} },
//     ...
//   ],
//   "skips": {
//     "history_dedup": [...thread_ids],
//     "parse_errors": [...],
//     "unknown_senders": [...],
//     "untested_warnings": [...]
//   }
// }

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import yaml from 'yaml';

// ---------- paths + config ----------
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const SENDERS_YML = join(PROJECT_ROOT, 'config', 'gmail-senders.yml');
const HISTORY_TSV = join(PROJECT_ROOT, 'data', 'gmail-scan-history.tsv');
const PIPELINE_MD = join(PROJECT_ROOT, 'data', 'pipeline.md');
const APPS_MD = join(PROJECT_ROOT, 'data', 'applications.md');
const AUTH_DIR = process.env.GMAIL_HTML_MCP_DIR || join(homedir(), '.gmail-html-mcp');

// ---------- args ----------
const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  return i === -1 ? def : args[i + 1];
}
const window = getArg('--window', '1d');
const oneThread = getArg('--thread', null);
const includeSuccess = args.includes('--include-success');
const rescanGiveupOnly = args.includes('--rescan-giveup-only');
const emitJsonStdout = args.includes('--json');
const outPath = getArg('--out', null);

// ---------- gmail auth ----------
const creds = JSON.parse(readFileSync(join(AUTH_DIR, 'credentials.json'), 'utf8'));
const token = JSON.parse(readFileSync(join(AUTH_DIR, 'token.json'), 'utf8'));
const c = creds.installed || creds.web;
const oauth2 = new google.auth.OAuth2(c.client_id, c.client_secret, c.redirect_uris[0]);
oauth2.setCredentials(token);
const gmail = google.gmail({ version: 'v1', auth: oauth2 });

// ---------- yaml ----------
const sendersYml = yaml.parse(readFileSync(SENDERS_YML, 'utf8'));
const senderMap = new Map(sendersYml.senders.map(s => [s.email.toLowerCase(), s]));
const noiseSlugs = sendersYml.noise_filter_slugs || [];
const stripParams = sendersYml.strip_params || [];

// ---------- history dedup ----------
const SUCCESS_NOTE_PATTERNS = [
  /URLs? extracted/i,
  /account confirmation/i,
  /registration confirmation/i,
  /welcome\/account/i,
  /all sponsored/i,
  /Junior filter/i,
  /non-dev/i,
  /^.*\bdup\b/i,
  /duplicate/i,
  /FALLBACK scrape .* — \d+ URLs/i,
  /noise-filtered/i,
  /lead filter/i,
];
const GIVEUP_NOTE_PATTERNS = [
  /MCP body empty(?!.* URLs extracted)/i,
  /tracking-wrapped, jk unreliable/i,
  /WTJ tracking-wrapped(?!.* URLs extracted)/i,
  /parse error/i,
  /gmail render failed/i,
  /redirect failed/i,
  /browser unavailable/i,
  /site unreachable/i,
  /^FALLBACK scrape \(MCP body empty\)\s*$/i,
];

function classifyNote(note) {
  if (!note) return 'unknown';
  if (SUCCESS_NOTE_PATTERNS.some(p => p.test(note))) return 'success';
  if (GIVEUP_NOTE_PATTERNS.some(p => p.test(note))) return 'giveup';
  return 'unknown';
}

function loadHistory() {
  // Returns { latestByThread: Map<threadId, {date, sender, note, classification}> }
  if (!existsSync(HISTORY_TSV)) return { latestByThread: new Map() };
  const lines = readFileSync(HISTORY_TSV, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
  const latest = new Map();
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    const [date, threadId, sender, ...rest] = parts;
    const note = rest.join('\t');
    const prev = latest.get(threadId);
    if (!prev || prev.date <= date) {
      latest.set(threadId, { date, sender, note, classification: classifyNote(note) });
    }
  }
  return { latestByThread: latest };
}

// ---------- pipeline + tracker dedup ----------
function loadKnownUrls() {
  // Build a set of already-known canonical URLs from pipeline.md + applications.md
  // so the agent doesn't re-append duplicates.
  const set = new Set();
  function addFromFile(path) {
    if (!existsSync(path)) return;
    const text = readFileSync(path, 'utf8');
    // Match http(s)://... URLs (loose)
    for (const m of text.matchAll(/https?:\/\/[^\s|<>")\]]+/g)) {
      set.add(canonicalize(m[0]));
    }
  }
  addFromFile(PIPELINE_MD);
  addFromFile(APPS_MD);
  return set;
}

function canonicalize(rawUrl) {
  try {
    const u = new URL(rawUrl);
    // Strip configured params
    const keep = new URLSearchParams();
    for (const [k, v] of u.searchParams) {
      const drop = stripParams.some(p => {
        if (p.endsWith('*')) return k.toLowerCase().startsWith(p.slice(0, -1).toLowerCase());
        return k.toLowerCase() === p.toLowerCase();
      });
      if (!drop) keep.append(k, v);
    }
    u.search = keep.toString();
    u.host = u.host.toLowerCase();
    if (u.pathname.endsWith('/') && u.pathname.length > 1) u.pathname = u.pathname.slice(0, -1);
    // Indeed normalization
    if (/indeed\.com$/.test(u.host) && /^\/(rc\/clk|pagead\/clk)/.test(u.pathname)) {
      const jk = u.searchParams.get('jk');
      if (jk) return `https://${u.host}/viewjob?jk=${jk}`;
    }
    // LinkedIn /comm/ rewrite
    if (u.host.includes('linkedin.com') && u.pathname.startsWith('/comm/jobs/view/')) {
      u.pathname = u.pathname.replace('/comm/', '/');
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
}

function slugOf(url) {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '').toLowerCase();
  } catch {
    return '';
  }
}

function isNoiseSlug(slug) {
  return noiseSlugs.some(n => slug.includes(n.toLowerCase()));
}

// ---------- gmail helpers ----------
function walkBody(payload, out) {
  if (!payload) return;
  const data = payload.body?.data;
  if (data) {
    const text = Buffer.from(data, 'base64url').toString('utf8');
    if (payload.mimeType === 'text/html' && !out.html) out.html = text;
    else if (payload.mimeType === 'text/plain' && !out.plain) out.plain = text;
  }
  if (payload.parts) payload.parts.forEach(p => walkBody(p, out));
}

async function fetchThread(threadId) {
  // Returns a "merged" view of all messages in a thread:
  //   { threadId, messages: [{id, subject, from, date, html, plain, snippet}] }
  // For URL extraction we concatenate all message bodies into one html/plain blob,
  // because some senders deliver follow-ups in the same thread, and we still want to capture
  // every URL the user actually received.
  const res = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' });
  const messages = (res.data.messages || []).map(m => {
    const out = { html: null, plain: null };
    walkBody(m.payload, out);
    const headers = Object.fromEntries(
      (m.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value])
    );
    return {
      id: m.id,
      subject: headers.subject || '',
      from: headers.from || '',
      date: headers.date || '',
      snippet: m.snippet || '',
      html: out.html,
      plain: out.plain,
    };
  });
  // Pick the latest message's headers for the "thread-level" view (subject etc.)
  const last = messages[messages.length - 1] || {};
  return {
    threadId,
    n_messages: messages.length,
    subject: last.subject || '',
    from: last.from || '',
    date: last.date || '',
    snippet: last.snippet || '',
    // Concatenate bodies so a single regex pass covers the whole conversation:
    html: messages.map(m => m.html || '').join('\n<!-- next-message -->\n') || null,
    plain: messages.map(m => m.plain || '').join('\n--- next-message ---\n') || null,
    messages,
  };
}

async function listThreads(query, pageToken) {
  // Use threads.list (not messages.list) so dedup works correctly even for
  // multi-message threads and we don't double-count messages from the same thread.
  const res = await gmail.users.threads.list({
    userId: 'me',
    q: query,
    maxResults: 100,
    pageToken,
  });
  return res.data;
}

// ---------- extraction strategies ----------
function extractDirect(msg, senderCfg) {
  const haystack = msg.html || msg.plain || '';
  const re = new RegExp(senderCfg.pattern, 'gi');
  const found = [...new Set([...haystack.matchAll(re)].map(m => m[0]))];
  return found.map(u => normalizeUrl('https://' + u.replace(/^https?:\/\//, '')));
}

function decodedFilter(senderCfg, fallback) {
  // If sender entry has `decoded_must_match` (regex string), use it.
  // Otherwise fall back to a generic "looks like a job URL" filter.
  if (senderCfg.decoded_must_match) {
    const re = new RegExp(senderCfg.decoded_must_match);
    return (u) => re.test(u);
  }
  return fallback;
}

function extractBase64(msg, senderCfg) {
  const haystack = msg.html || msg.plain || '';
  const re = new RegExp(senderCfg.pattern, 'gi');
  const decoded = new Set();
  for (const m of haystack.matchAll(re)) {
    const seg = m[1];
    if (!seg) continue;
    try {
      const target = Buffer.from(seg, 'base64url').toString('utf8');
      if (target.startsWith('http')) decoded.add(target);
    } catch {}
  }
  const filter = decodedFilter(senderCfg,
    (u) => /\/(job|job-offer|offers|stellenangebote)/.test(u));
  return [...decoded].filter(filter).map(stripQueryAndNormalize);
}

function extractZlib(msg, senderCfg) {
  const haystack = msg.html || msg.plain || '';
  const re = new RegExp(senderCfg.pattern, 'gi');
  const decoded = new Set();
  for (const m of haystack.matchAll(re)) {
    const seg = m[1];
    if (!seg) continue;
    try {
      const buf = Buffer.from(seg, 'base64url');
      const inflated = zlib.inflateSync(buf).toString('utf8');
      const params = new URLSearchParams(inflated);
      const l = params.get('l');
      if (l && l.startsWith('http')) decoded.add(l);
    } catch {}
  }
  const filter = decodedFilter(senderCfg,
    (u) => /\/jobs?\/\d+|\/jobs?\/[a-z0-9-]+\//.test(u));
  return [...decoded].filter(filter).map(stripQueryAndNormalize);
}

function stripQueryAndNormalize(u) {
  try {
    const url = new URL(u);
    url.search = '';
    url.hash = '';
    return canonicalize(url.toString());
  } catch {
    return canonicalize(u);
  }
}

function extractTracker(msg, senderCfg) {
  // For tracker senders we DON'T resolve here. We collect tracker URLs to follow later.
  const haystack = msg.html || msg.plain || '';
  const re = new RegExp(senderCfg.pattern, 'gi');
  return [...new Set([...haystack.matchAll(re)].map(m => m[0]))];
}

function extractPlaintext(msg, senderCfg) {
  const haystack = msg.plain || msg.html || '';
  const re = new RegExp(senderCfg.pattern, 'gi');
  return [...new Set([...haystack.matchAll(re)].map(m => m[0]))].map(normalizeUrl);
}

function normalizeUrl(u) {
  return canonicalize(u);
}

// ---------- main ----------
async function main() {
  const result = {
    window,
    now: new Date().toISOString(),
    stats: { seen: 0, history_skip: 0, giveup_rescan: 0, processed: 0 },
    results: [],
    skips: { history_dedup: [], parse_errors: [], unknown_senders: [], untested_warnings: [] },
  };

  const { latestByThread } = loadHistory();
  const knownUrls = loadKnownUrls();

  // Build query — use threads.list so each thread comes back exactly once.
  let threadIds = [];
  if (oneThread) {
    threadIds = [oneThread];
  } else {
    const query =
      `newer_than:${window} ` +
      '(' + sendersYml.senders.map(s => `from:${s.email}`).join(' OR ') + ')';

    let pageToken = null;
    do {
      const data = await listThreads(query, pageToken);
      threadIds.push(...(data.threads || []).map(t => t.id));
      pageToken = data.nextPageToken || null;
    } while (pageToken);
  }
  result.stats.seen = threadIds.length;

  // Filter by history (keyed by threadId — matches the tsv schema)
  const toProcess = [];
  for (const tid of threadIds) {
    const hist = latestByThread.get(tid);
    if (hist) {
      if (hist.classification === 'success' && !rescanGiveupOnly && !includeSuccess) {
        result.stats.history_skip++;
        result.skips.history_dedup.push(tid);
        continue;
      }
      if (hist.classification === 'giveup') {
        result.stats.giveup_rescan++;
      }
    }
    toProcess.push(tid);
  }

  // Fetch + extract (one fetch per thread, all messages merged for regex)
  for (const id of toProcess) {
    let msg;
    try {
      msg = await fetchThread(id);
    } catch (e) {
      result.skips.parse_errors.push({ thread_id: id, reason: 'fetch failed: ' + e.message });
      continue;
    }

    const senderEmail = (msg.from.match(/<([^>]+)>/) || [, msg.from])[1].trim().toLowerCase();
    const cfg = senderMap.get(senderEmail);

    if (!cfg) {
      result.skips.unknown_senders.push({ thread_id: id, sender: senderEmail });
      result.results.push({
        thread_id: id, sender: senderEmail, extraction: 'unknown',
        urls: [], trackers_to_follow: [], skip_reason: 'unknown sender',
        metadata: { subject: msg.subject, date: msg.date },
      });
      continue;
    }

    if (cfg.extraction === 'untested') {
      result.skips.untested_warnings.push({
        thread_id: id, sender: senderEmail, subject: msg.subject,
        html_length: msg.html?.length || 0, plain_length: msg.plain?.length || 0,
        guess_pattern: cfg.pattern_guess,
      });
      result.results.push({
        thread_id: id, sender: senderEmail, extraction: 'untested',
        urls: [], trackers_to_follow: [],
        skip_reason: `untested sender — inspect body and update yaml before bulk processing`,
        metadata: { subject: msg.subject, date: msg.date, html_length: msg.html?.length || 0 },
      });
      continue;
    }

    let urls = [], trackers = [];
    try {
      switch (cfg.extraction) {
        case 'direct':    urls = extractDirect(msg, cfg); break;
        case 'base64':    urls = extractBase64(msg, cfg); break;
        case 'zlib':      urls = extractZlib(msg, cfg); break;
        case 'plaintext': urls = extractPlaintext(msg, cfg); break;
        case 'tracker':   trackers = extractTracker(msg, cfg); break;
        default:
          result.skips.parse_errors.push({ thread_id: id, reason: `unknown extraction: ${cfg.extraction}` });
          continue;
      }
    } catch (e) {
      result.skips.parse_errors.push({ thread_id: id, sender: senderEmail, reason: e.message });
      continue;
    }

    // Noise + dedup filter on resolved URLs
    const filtered = [];
    let noise = 0, pipeDup = 0;
    const noiseExamples = [];
    for (const u of urls) {
      const slug = slugOf(u);
      if (isNoiseSlug(slug)) { noise++; if (noiseExamples.length < 3) noiseExamples.push(slug); continue; }
      if (knownUrls.has(canonicalize(u))) { pipeDup++; continue; }
      filtered.push(u);
    }

    // Sponsored-URL count (only senders that intentionally filter some URLs out at extract time)
    let sponsoredCount = 0;
    if (cfg.sponsored_pattern) {
      const re = new RegExp(cfg.sponsored_pattern, 'gi');
      const haystack = msg.html || msg.plain || '';
      sponsoredCount = (haystack.match(re) || []).length;
    }

    // Subject-count sanity check (per yaml). Only warn on GENUINE undercount —
    // i.e. when totalSeen + sponsored is still less than the subject claim.
    let subjectCount = null, subjectCountWarning = null;
    if (cfg.subject_count_pattern) {
      const m = msg.subject.match(new RegExp(cfg.subject_count_pattern));
      if (m && m[1]) {
        subjectCount = parseInt(m[1], 10);
        const totalSeen = filtered.length + pipeDup + noise + trackers.length + sponsoredCount;
        if (subjectCount > 0 && totalSeen < subjectCount) {
          subjectCountWarning =
            `subject says ${subjectCount} jobs, accounted for ${totalSeen} ` +
            `(${filtered.length} new + ${pipeDup} dup + ${noise} noise + ${trackers.length} tracker + ${sponsoredCount} sponsored). ` +
            `Missing ${subjectCount - totalSeen} — investigate.`;
        }
      }
    }

    result.stats.processed++;
    result.results.push({
      thread_id: id,
      sender: senderEmail,
      extraction: cfg.extraction,
      urls: filtered,
      trackers_to_follow: trackers,
      skip_reason: null,
      metadata: {
        subject: msg.subject,
        date: msg.date,
        n_messages: msg.n_messages,
        html_length: msg.html?.length || 0,
        raw_extracted: urls.length,
        noise_filtered: noise,
        noise_examples: noiseExamples,
        pipeline_dup: pipeDup,
        sponsored_count: sponsoredCount,
        subject_expected_count: subjectCount,
        subject_count_warning: subjectCountWarning,
      },
    });
  }

  // Aggregate counters for summary
  let urlsResolved = 0, trackersToFollow = 0;
  for (const r of result.results) {
    urlsResolved += r.urls.length;
    trackersToFollow += r.trackers_to_follow.length;
  }

  // Write full JSON to disk (default) so the agent doesn't load it into context
  let writtenPath = null;
  if (emitJsonStdout) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }
  const runsDir = join(SCRIPT_DIR, '..', 'runs');
  mkdirSync(runsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  writtenPath = outPath || join(runsDir, `${stamp}.json`);
  writeFileSync(writtenPath, JSON.stringify(result, null, 2));

  const rel = relative(PROJECT_ROOT, writtenPath).replace(/\\/g, '/');
  const lines = [
    `gmail-extract: window=${window}  seen=${result.stats.seen} hist_skip=${result.stats.history_skip} giveup_rescan=${result.stats.giveup_rescan} processed=${result.stats.processed}`,
    `urls (resolved): ${urlsResolved}        trackers (need follow): ${trackersToFollow}`,
    `skips: parse_errors=${result.skips.parse_errors.length} unknown=${result.skips.unknown_senders.length} untested=${result.skips.untested_warnings.length} history_dedup=${result.skips.history_dedup.length}`,
    `wrote: ${rel}`,
  ];
  // Per-sender quick breakdown (small)
  const bySender = {};
  for (const r of result.results) {
    if (!bySender[r.sender]) bySender[r.sender] = { threads: 0, urls: 0, trackers: 0 };
    bySender[r.sender].threads++;
    bySender[r.sender].urls += r.urls.length;
    bySender[r.sender].trackers += r.trackers_to_follow.length;
  }
  if (Object.keys(bySender).length) {
    lines.push('by sender:');
    for (const [s, v] of Object.entries(bySender)) {
      lines.push(`  ${s}: ${v.threads} threads / ${v.urls} urls / ${v.trackers} trackers`);
    }
  }
  if (result.skips.untested_warnings.length) {
    lines.push('UNTESTED senders found (need user confirmation):');
    for (const w of result.skips.untested_warnings) {
      lines.push(`  ${w.sender} thread=${w.thread_id} html_len=${w.html_length}`);
    }
  }

  // Subject-count undercount warnings (the user's main correctness concern)
  const undercount = result.results.filter(r => r.metadata?.subject_count_warning);
  if (undercount.length) {
    lines.push('UNDERCOUNT WARNINGS (subject claims more jobs than we extracted):');
    for (const r of undercount) {
      lines.push(`  ${r.thread_id} <${r.sender}>: ${r.metadata.subject_count_warning}`);
    }
  }
  // Unknown senders worth surfacing too — they were ignored
  if (result.skips.unknown_senders.length) {
    lines.push('UNKNOWN senders (not in gmail-senders.yml — add them or they stay unprocessed):');
    for (const u of result.skips.unknown_senders) {
      lines.push(`  ${u.sender} thread=${u.thread_id}`);
    }
  }
  process.stdout.write(lines.join('\n') + '\n');
}

main().catch(e => {
  process.stderr.write('FATAL: ' + e.stack + '\n');
  process.exit(1);
});
