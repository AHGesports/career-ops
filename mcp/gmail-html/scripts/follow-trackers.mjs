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
const timeoutMs = parseInt(getArg('--timeout', '15000'), 10);

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

async function followOne(url) {
  const page = await ctx.newPage();
  try {
    // 'domcontentloaded' lets server-side redirect chains settle (XING goes
    // tracker → login wall → final job page; 'commit' fires too early and we
    // capture the intermediate). Stepstone magiclink also resolves fine here.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForTimeout(1500);
    let finalUrl = page.url();
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

// Merge back, applying decoded_must_match per sender (drops footer/social/login URLs)
let resolved = 0, failed = 0, dropped = 0;
const failuresByThread = {};
const droppedByThread = {};
for (const r of data.results) {
  if (r.extraction === 'tracker') {
    r.tracker_failures = r.tracker_failures || [];
    r.tracker_dropped_non_job = r.tracker_dropped_non_job || [];
  }
}
for (const res of results) {
  const thread = data.results[res.ri];
  const cfg = senderMap.get(thread.sender);
  const filter = cfg?.decoded_must_match ? new RegExp(cfg.decoded_must_match) : null;
  if (res.ok) {
    if (filter && !filter.test(res.url)) {
      thread.tracker_dropped_non_job.push(res.url);
      droppedByThread[thread.thread_id] = (droppedByThread[thread.thread_id] || 0) + 1;
      dropped++;
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
  `gmail-follow: ${tasks.length} trackers in -> ${resolved} resolved (job-shape), ${dropped} dropped (non-job: footer/social/login), ${failed} failed\n` +
  `updated: ${inPath}\n`
);
if (failed) {
  process.stdout.write('failures by thread:\n');
  for (const [tid, n] of Object.entries(failuresByThread)) {
    process.stdout.write(`  ${tid}: ${n}\n`);
  }
}
