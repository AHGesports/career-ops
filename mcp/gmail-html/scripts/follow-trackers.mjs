#!/usr/bin/env node
// follow-trackers.mjs — resolve Case B tracker URLs to canonical job URLs.
// Reads the JSON file written by extract-urls.mjs, follows each tracker via
// Playwright (headless Chromium), updates the JSON in place with resolved URLs.
//
// Why a separate script: tracker-following is per-URL and slow. Doing it inline
// in the agent burns tokens and blocks. Doing it via a script is fully unattended
// — agent kicks it off, polls, then reads results.
//
// Usage:
//   node scripts/follow-trackers.mjs --in mcp/gmail-html/runs/<file>.json
//   node scripts/follow-trackers.mjs --in <file> --concurrency 3 --timeout 15000
//
// Output (stdout, summary):
//   gmail-follow: 40 trackers in -> 36 resolved, 4 failed
//   wrote: mcp/gmail-html/runs/<file>.json (with `resolved_urls` per tracker entry)
//
// JSON shape after run: each result with extraction=tracker now has
//   `urls` populated (canonical destinations) and `tracker_failures: [...]`.
//
// Requires: `npm install playwright` and `npx playwright install chromium`.
// If Playwright is not installed, prints install instructions and exits 1.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const SCRIPT_DIR_EARLY = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT_EARLY = join(SCRIPT_DIR_EARLY, '..', '..', '..');
const SENDERS_YML = join(PROJECT_ROOT_EARLY, 'config', 'gmail-senders.yml');
const sendersYml = yaml.parse(readFileSync(SENDERS_YML, 'utf8'));
const senderMap = new Map(sendersYml.senders.map(s => [s.email.toLowerCase(), s]));

let playwright;
try {
  playwright = await import('playwright');
} catch {
  process.stderr.write(
    'follow-trackers: Playwright not installed.\n' +
    'Run: cd mcp/gmail-html && npm install playwright && npx playwright install chromium\n'
  );
  process.exit(2);
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..', '..');

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  return i === -1 ? def : args[i + 1];
}
const inPath = getArg('--in', null);
const concurrency = parseInt(getArg('--concurrency', '3'), 10);
// Bumped 15000 → 30000: XING + Stepstone redirect chains often need 18-25s for the
// final JS/meta-refresh hop. Earlier 15s timeout caused silent capture loss because
// the page returned the still-on-tracker URL, which the regex filter then dropped.
const timeoutMs = parseInt(getArg('--timeout', '30000'), 10);

if (!inPath) {
  process.stderr.write('Missing --in <runs/*.json>\n');
  process.exit(1);
}
const absIn = resolve(inPath);
const data = JSON.parse(readFileSync(absIn, 'utf8'));

// ---------- per-host resolution strategies ----------
// Most trackers redirect to the canonical URL. We just need the final URL after
// all redirects settle. Some trackers (Stepstone) expose the destination in a
// query param of an intermediate magiclink page — we can short-circuit that.

function shortCircuitStepstone(url) {
  // click.stepstone.de tracker → magiclink page with returnUrl param has canonical path.
  // We can't decode without navigating, but once the magiclink page loads, the
  // URL bar contains `returnUrl=%2Fstellenangebote----<ID>-inline.html`. We grab
  // that immediately without waiting for the slow magiclink-exchange redirect.
  return null;
}

function postProcess(host, finalUrl) {
  try {
    const u = new URL(finalUrl);
    // Stepstone: extract from magiclink returnUrl if still on the magiclink page
    if (u.host === 'www.stepstone.de' && u.pathname.startsWith('/v2/magiclink/exchange')) {
      const returnUrl = u.searchParams.get('returnUrl');
      if (returnUrl) {
        return 'https://www.stepstone.de' + decodeURIComponent(returnUrl).split('?')[0];
      }
    }
    // Strip query for canonical
    u.search = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return finalUrl;
  }
}

// ---------- Playwright driver ----------
const browser = await playwright.chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
});

// Hosts whose tracker URL = "no redirect happened, this is just the input still".
// If we end up on one of these AFTER nav, treat as failure (not a real destination).
const TRACKER_HOSTS = ['click.stepstone.de', 'click.stepstone.at'];
function isStillOnTracker(inputUrl, finalUrl) {
  try {
    const a = new URL(inputUrl);
    const b = new URL(finalUrl);
    if (a.host === b.host && a.pathname === b.pathname) return true;
    // XING m/<id> tracker that didn't redirect → still on /m/<id>
    if (b.host.endsWith('xing.com') && b.pathname.startsWith('/m/')) return true;
    // Stepstone click host without redirect
    if (TRACKER_HOSTS.includes(b.host)) return true;
    return false;
  } catch {
    return false;
  }
}

async function followOne(url) {
  const page = await ctx.newPage();
  try {
    // 'load' waits for the full document load including scripts. 'domcontentloaded'
    // fires too early for senders that use JS/meta-refresh redirects (XING/Stepstone)
    // — page.url() returned the still-on-tracker URL and we silently dropped real jobs.
    await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
    await page.waitForTimeout(2000);
    let finalUrl = page.url();
    // If we never left the tracker host → mark as failure so the summary surfaces it.
    if (isStillOnTracker(url, finalUrl)) {
      return { ok: false, error: 'no-redirect (still on tracker after load)' };
    }
    const stepstoneShort = shortCircuitStepstone(finalUrl);
    if (stepstoneShort) finalUrl = stepstoneShort;
    return { ok: true, url: postProcess(new URL(finalUrl).host, finalUrl) };
  } catch (e) {
    return { ok: false, error: e.message.split('\n')[0] };
  } finally {
    await page.close();
  }
}

// Pool concurrency
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    })
  );
  return out;
}

// Collect tasks: array of {resultIdx, url}
const tasks = [];
data.results.forEach((r, ri) => {
  if (r.extraction === 'tracker') {
    r.trackers_to_follow.forEach((u, ti) => tasks.push({ ri, ti, url: u }));
  }
});

if (tasks.length === 0) {
  process.stdout.write(`gmail-follow: 0 trackers to follow.\n`);
  await browser.close();
  process.exit(0);
}

const results = await pool(tasks, concurrency, async (t) => {
  const res = await followOne(t.url.startsWith('http') ? t.url : 'https://' + t.url);
  return { ...t, ...res };
});
await browser.close();

// Per-sender "canonical brand domain" used to split a dropped URL into
//   - lists/SERP on the SAME site (still meaningful — user can browse)
//   - offsite navigation (social, app-store, login, surveys — pure noise)
// We use a lookup table keyed by the sender domain root since regex-pattern
// parsing is fragile (alternations like `(?:de|at)` defeat naive extraction).
const CANONICAL_BRAND = {
  'justjoin.it': 'justjoin.it',
  'mailing.theprotocol.it': 'theprotocol.it',
  'germantechjobs.de': 'germantechjobs.de',
  'nofluffjobs.com': 'nofluffjobs.com',
  'profil.karriere.at': 'karriere.at',
  'karriere.at': 'karriere.at',
  'jobalert.indeed.com': 'indeed.com',
  'linkedin.com': 'linkedin.com',
  'mail.xing.com': 'xing.com',
  'email.stepstone.at': 'stepstone.de',  // .at and .de jobs both live on stepstone.de
  'email.stepstone.de': 'stepstone.de',
  'jobagent.stepstone.de': 'stepstone.de',
  'welcometothejungle.com': 'welcometothejungle.com',
};
function canonicalBrandFor(senderEmail) {
  const domain = (senderEmail.split('@')[1] || '').toLowerCase();
  if (CANONICAL_BRAND[domain]) return CANONICAL_BRAND[domain];
  // Fallback: SLD heuristic (second-to-last + last label)
  const parts = domain.split('.');
  if (parts.length >= 2) return parts.slice(-2).join('.');
  return domain;
}

// Merge back, applying decoded_must_match per sender. Distinguish:
//   - tracker_dropped_lists:  resolved URL on the SAME canonical host, but not a single-job shape
//                             (search results / category / recommendations / homepage / profile)
//   - tracker_dropped_offsite: resolved URL on a DIFFERENT host (social/app-store/survey/login)
let resolved = 0, failed = 0, droppedLists = 0, droppedOffsite = 0;
const failuresByThread = {};
for (const r of data.results) {
  if (r.extraction === 'tracker') {
    r.tracker_failures = r.tracker_failures || [];
    r.tracker_dropped_lists = r.tracker_dropped_lists || [];
    r.tracker_dropped_offsite = r.tracker_dropped_offsite || [];
    // Legacy field — keep so older runs don't break older readers; new code reads the split fields.
    r.tracker_dropped_non_job = r.tracker_dropped_non_job || [];
  }
}
for (const res of results) {
  const thread = data.results[res.ri];
  const cfg = senderMap.get(thread.sender);
  const filter = cfg?.decoded_must_match ? new RegExp(cfg.decoded_must_match) : null;
  const canonicalHost = canonicalBrandFor(thread.sender);
  if (res.ok) {
    if (filter && !filter.test(res.url)) {
      // Classify list vs offsite
      let isOnSenderDomain = false;
      try {
        const h = new URL(res.url).host;
        if (canonicalHost && (h === canonicalHost || h.endsWith('.' + canonicalHost))) isOnSenderDomain = true;
      } catch {}
      if (isOnSenderDomain) {
        thread.tracker_dropped_lists.push(res.url);
        droppedLists++;
      } else {
        thread.tracker_dropped_offsite.push(res.url);
        droppedOffsite++;
      }
      thread.tracker_dropped_non_job.push(res.url); // legacy, keep populated
    } else if (!thread.urls.includes(res.url)) {
      thread.urls.push(res.url);
      resolved++;
    } else {
      resolved++; // duplicate within thread
    }
  } else {
    thread.tracker_failures.push({ url: res.url, error: res.error });
    failuresByThread[thread.thread_id] = (failuresByThread[thread.thread_id] || 0) + 1;
    failed++;
  }
}

writeFileSync(absIn, JSON.stringify(data, null, 2));

process.stdout.write(
  `gmail-follow: ${tasks.length} trackers in -> ${resolved} resolved (job-shape), ${droppedLists} lists/SERP, ${droppedOffsite} offsite, ${failed} failed\n` +
  `updated: ${inPath}\n`
);
if (failed) {
  process.stdout.write('failures by thread:\n');
  for (const [tid, n] of Object.entries(failuresByThread)) {
    process.stdout.write(`  ${tid}: ${n}\n`);
  }
}
