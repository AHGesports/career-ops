#!/usr/bin/env node
// dedup-indeed-final.mjs -- resolve Indeed alert URLs to final employer targets
// and drop duplicate Indeed jk URLs that collapse to the same target.
//
// Scope is intentionally narrow: only donotreply@jobalert.indeed.com results
// and only *.indeed.com/viewjob?jk=... URLs are touched.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

let playwright;
try {
  playwright = await import('playwright');
} catch {
  process.stderr.write(
    'dedup-indeed-final: Playwright not installed.\n' +
    'Run: cd mcp/gmail-html && npm install playwright && npx playwright install chromium\n'
  );
  process.exit(2);
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..', '..');
const PIPELINE_MD = join(PROJECT_ROOT, 'data', 'pipeline.md');
const DEFERRED_MD = join(PROJECT_ROOT, 'data', 'pipeline-deferred.md');
const LISTS_MD = join(PROJECT_ROOT, 'data', 'pipeline-lists.md');
const APPS_MD = join(PROJECT_ROOT, 'data', 'applications.md');

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  return i === -1 ? def : args[i + 1];
}

const inPath = getArg('--in', null);
const timeoutMs = parseInt(getArg('--timeout', '30000'), 10);
const concurrency = parseInt(getArg('--concurrency', '2'), 10);

if (!inPath) {
  process.stderr.write('Missing --in <runs/*.json>\n');
  process.exit(1);
}

const absIn = resolve(inPath);
const data = JSON.parse(readFileSync(absIn, 'utf8'));

function isIndeedSender(sender) {
  return (sender || '').toLowerCase() === 'donotreply@jobalert.indeed.com';
}

function isIndeedViewJob(url) {
  try {
    const u = new URL(url);
    return u.host.endsWith('indeed.com') && u.pathname === '/viewjob' && u.searchParams.has('jk');
  } catch {
    return false;
  }
}

function canonicalFinalKey(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    u.host = u.host.toLowerCase();
    const dropPrefixes = ['utm_', 'src', 'source', 'ref', 'referrer', 'electronic_referral'];
    for (const key of [...u.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (dropPrefixes.some(p => lower === p || lower.startsWith(p))) {
        u.searchParams.delete(key);
      }
    }
    if (u.pathname.endsWith('/') && u.pathname.length > 1) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
}

function loadKnownFinalKeys() {
  const keys = new Set();
  for (const path of [PIPELINE_MD, DEFERRED_MD, LISTS_MD, APPS_MD]) {
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    for (const m of text.matchAll(/indeed-final:\s*(https?:\/\/[^\s|<>")\]]+)/g)) {
      keys.add(canonicalFinalKey(m[1]));
    }
    for (const m of text.matchAll(/Final target:\s*(https?:\/\/[^\s|<>")\]]+)/g)) {
      keys.add(canonicalFinalKey(m[1]));
    }
  }
  return keys;
}

function minimalIndeedApplyStart(url) {
  try {
    const u = new URL(url);
    const jk = u.searchParams.get('jk');
    if (!jk) return null;
    return `${u.origin}/applystart?jk=${encodeURIComponent(jk)}&from=vj&pos=bottom&mvj=0&spon=0`;
  } catch {
    return null;
  }
}

async function clickApplyAndGetFinal(page, originalUrl) {
  const applyHref = minimalIndeedApplyStart(originalUrl) || await page.evaluate(() => {
    const direct = document.querySelector('a[href*="/applystart?jk="], button[href*="/applystart?jk="]');
    if (direct) return direct.href || direct.getAttribute('href') || null;
    for (const el of [...document.querySelectorAll('a,button')]) {
      const href = el.href || el.getAttribute('href') || el.getAttribute('data-href') || '';
      if (href.includes('/applystart?jk=')) return href;
    }
    const html = document.documentElement.innerHTML;
    const m = html.match(/https?:\/\/[^"'<>]+\/applystart\?[^"'<>]+jk=[a-f0-9]+[^"'<>]*/i)
      || html.match(/\/applystart\?[^"'<>]+jk=[a-f0-9]+[^"'<>]*/i);
    if (m) return new URL(m[0], location.origin).toString().replace(/&amp;/g, '&');
    return null;
  });
  if (applyHref) {
    await page.goto(applyHref, { waitUntil: 'load', timeout: 30000 });
    await page.waitForURL(
      u => !(u.host.endsWith('indeed.com') && u.pathname.startsWith('/applystart')),
      { timeout: 15000 },
    ).catch(() => null);
    await page.waitForTimeout(2000);
    return page.url();
  }

  const popupPromise = page.waitForEvent('popup', { timeout: 12000 }).catch(() => null);
  const navPromise = page.waitForNavigation({ waitUntil: 'load', timeout: 12000 }).catch(() => null);

  const clicked = await page.evaluate(() => {
    const selectors = [
      '#indeedApplyButton',
      '[data-testid="indeedApplyButton-test"]',
      'a[href*="/applystart?jk="]',
      'button[href*="/applystart?jk="]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;
      if (el instanceof HTMLElement) {
        el.click();
        return true;
      }
    }

    const applyText = /apply|bewerben|jetzt bewerben|bewerben auf website|apply on company site/i;
    for (const el of [...document.querySelectorAll('a,button')]) {
      const text = (el.textContent || el.getAttribute('aria-label') || '').trim();
      const href = el.getAttribute('href') || '';
      if (href.includes('/applystart?jk=') || applyText.test(text)) {
        if (el instanceof HTMLElement) {
          el.click();
          return true;
        }
      }
    }
    return false;
  });

  if (!clicked) return null;

  const first = await Promise.race([
    popupPromise.then(popup => ({ popup })),
    navPromise.then(() => ({ popup: null })),
    new Promise(resolve => setTimeout(() => resolve({ popup: null }), 12000)),
  ]);
  const popup = first.popup;
  await navPromise.catch(() => null);
  const target = popup || page;
  try {
    await target.waitForLoadState('load', { timeout: 15000 });
  } catch {}
  await target.waitForTimeout(1500);
  return target.url();
}

async function resolveIndeed(browser, url) {
  const page = await browser.newPage();
  try {
    const applyStart = minimalIndeedApplyStart(url);
    if (applyStart) {
      await page.goto(applyStart, { waitUntil: 'load', timeout: timeoutMs });
      await page.waitForURL(
        u => !(u.host.endsWith('indeed.com') && u.pathname.startsWith('/applystart')),
        { timeout: 15000 },
      ).catch(() => null);
      await page.waitForTimeout(2000);
    } else {
      await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
      await page.waitForTimeout(800);
    }

    const finalUrl = applyStart ? page.url() : await clickApplyAndGetFinal(page, url);
    if (!finalUrl) {
      return { ok: false, error: 'apply target not found' };
    }
    if (canonicalFinalKey(finalUrl) === canonicalFinalKey(url)) {
      return { ok: false, error: 'apply target stayed on original Indeed job' };
    }
    try {
      const final = new URL(finalUrl);
      if (final.host.endsWith('indeed.com') && final.pathname.startsWith('/applystart')) {
        return { ok: false, error: 'apply target stayed on Indeed applystart' };
      }
    } catch {}

    return {
      ok: true,
      final_url: finalUrl,
      final_key: canonicalFinalKey(finalUrl),
    };
  } catch (e) {
    return { ok: false, error: e.message.split('\n')[0] };
  } finally {
    await page.close().catch(() => {});
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }));
  return out;
}

const tasks = [];
for (const [ri, r] of data.results.entries()) {
  if (!isIndeedSender(r.sender)) continue;
  for (const url of (r.urls || [])) {
    if (isIndeedViewJob(url)) tasks.push({ ri, url });
  }
}

if (tasks.length === 0) {
  process.stdout.write('indeed-final-dedup: 0 Indeed URLs to resolve.\n');
  process.exit(0);
}

const browser = await playwright.chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
});

const resolved = await pool(tasks, concurrency, async (t) => ({
  ...t,
  ...(await resolveIndeed(ctx, t.url)),
}));

await browser.close();

const knownFinalKeys = loadKnownFinalKeys();
const seenFinalKeys = new Set(knownFinalKeys);
const byResult = new Map();
for (const item of resolved) {
  if (!byResult.has(item.ri)) byResult.set(item.ri, []);
  byResult.get(item.ri).push(item);
}

let kept = 0;
let duplicate = 0;
let knownDuplicate = 0;
let failed = 0;

for (const [ri, items] of byResult.entries()) {
  const r = data.results[ri];
  const drop = new Set();
  r.indeed_final_targets = r.indeed_final_targets || [];
  r.indeed_final_duplicates = r.indeed_final_duplicates || [];
  r.indeed_final_failures = r.indeed_final_failures || [];

  for (const item of items) {
    if (!item.ok) {
      failed++;
      r.indeed_final_failures.push({ url: item.url, error: item.error });
      continue;
    }

    if (seenFinalKeys.has(item.final_key)) {
      drop.add(item.url);
      const existing = knownFinalKeys.has(item.final_key);
      if (existing) knownDuplicate++;
      else duplicate++;
      r.indeed_final_duplicates.push({
        url: item.url,
        final_url: item.final_url,
        final_key: item.final_key,
        reason: existing ? 'known-final-target' : 'same-run-final-target',
      });
      continue;
    }

    seenFinalKeys.add(item.final_key);
    kept++;
    r.indeed_final_targets.push({
      url: item.url,
      final_url: item.final_url,
      final_key: item.final_key,
    });
  }

  if (drop.size) {
    r.urls = (r.urls || []).filter(url => !drop.has(url));
  }
  r.metadata = r.metadata || {};
  r.metadata.indeed_final_dedup = {
    checked: items.length,
    kept: r.indeed_final_targets.length,
    duplicates: r.indeed_final_duplicates.length,
    failures: r.indeed_final_failures.length,
  };
}

data.indeed_final_dedup = {
  input: tasks.length,
  kept,
  duplicate,
  known_duplicate: knownDuplicate,
  failed,
};

writeFileSync(absIn, JSON.stringify(data, null, 2));

process.stdout.write(
  `indeed-final-dedup: ${tasks.length} Indeed URLs -> ` +
  `${kept} kept / ${duplicate} same-run dup / ${knownDuplicate} known-final dup / ${failed} failed\n` +
  `updated: ${inPath}\n`
);
