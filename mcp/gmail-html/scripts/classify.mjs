#!/usr/bin/env node
// classify.mjs — tag each URL in the run JSON as "auto-match" or "deferred".
//
// Reads:
//   - mcp/gmail-html/runs/<file>.json (output of extract-urls + follow-trackers)
//   - config/profile.yml → gmail_classifier.match_keywords / match_excludes
//
// Writes back to the SAME json file, mutating each result with:
//   r.classified = [{ url, tag: "auto-match" | "deferred", matched: [...], excluded: [...] }, ...]
//
// Match logic (per URL, case-insensitive):
//   1. Build haystack = url-slug + " " + sender
//      + email-subject ONLY for non-tracker senders (for tracker senders like XING/Stepstone/WTJ
//      the subject is the search-alert query, shared by all URLs in the thread — including
//      irrelevant roles — so it is excluded to prevent false positives)
//      (slug = path segment after host, with dashes/underscores → spaces)
//   2. If ANY match_excludes regex hits → tag = "deferred" (excludes win)
//   3. Else if ANY match_keywords regex hits → tag = "auto-match"
//   4. Else → tag = "deferred"
//
// Usage:
//   node scripts/classify.mjs --in mcp/gmail-html/runs/<file>.json
//
// Exits 0 on success.

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const PROFILE_YML = join(PROJECT_ROOT, 'config', 'profile.yml');

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  return i === -1 ? def : args[i + 1];
}
const inPath = getArg('--in', null);
if (!inPath) {
  process.stderr.write('Missing --in <runs/*.json>\n');
  process.exit(1);
}

const profile = yaml.parse(readFileSync(PROFILE_YML, 'utf8'));
const cfg = profile.gmail_classifier || {};
const matchSrc = cfg.match_keywords || [];
const excludeSrc = cfg.match_excludes || [];

if (matchSrc.length === 0) {
  process.stderr.write('classify: profile.yml gmail_classifier.match_keywords is empty — every URL will defer.\n');
}

const matchRegexes = matchSrc.map(p => new RegExp(p, 'i'));
const excludeRegexes = excludeSrc.map(p => new RegExp(p, 'i'));

function urlSlug(url) {
  try {
    const u = new URL(url);
    // path + query, normalized
    const raw = (u.pathname + ' ' + (u.search || '')).toLowerCase();
    return raw.replace(/[-_/?=&]/g, ' ').replace(/\s+/g, ' ').trim();
  } catch {
    return url.toLowerCase();
  }
}

function classifyUrl(url, subject, sender) {
  const haystack = [
    urlSlug(url),
    (subject || '').toLowerCase(),
    (sender || '').toLowerCase(),
  ].join(' \n ');

  const matched = matchSrc.filter((_, i) => matchRegexes[i].test(haystack));
  const excluded = excludeSrc.filter((_, i) => excludeRegexes[i].test(haystack));

  let tag;
  if (excluded.length > 0) tag = 'deferred';
  else if (matched.length > 0) tag = 'auto-match';
  else tag = 'deferred';

  return { url, tag, matched, excluded };
}

const data = JSON.parse(readFileSync(resolve(inPath), 'utf8'));

let totalUrls = 0;
let autoMatch = 0;
let deferred = 0;

for (const r of data.results) {
  // For tracker senders (XING, Stepstone, WTJ) the email subject is the search-alert
  // query name, not a job title — it is shared by every URL in the thread and will
  // falsely match any URL whose subject contains a keyword (e.g. "full stack engineer"
  // alert serving Account Executive roles). Use slug-only for trackers.
  const subject = r.extraction === 'tracker' ? '' : (r.metadata?.subject || '');
  const classified = (r.urls || []).map(u => classifyUrl(u, subject, r.sender));
  r.classified = classified;
  for (const c of classified) {
    totalUrls++;
    if (c.tag === 'auto-match') autoMatch++;
    else deferred++;
  }
}

data.classifier = {
  total: totalUrls,
  auto_match: autoMatch,
  deferred: deferred,
  match_keywords_count: matchSrc.length,
  match_excludes_count: excludeSrc.length,
};

writeFileSync(resolve(inPath), JSON.stringify(data, null, 2));

process.stdout.write(
  `classify: ${totalUrls} URLs → auto-match=${autoMatch} deferred=${deferred}` +
  ` (keywords=${matchSrc.length}, excludes=${excludeSrc.length})\n`
);
