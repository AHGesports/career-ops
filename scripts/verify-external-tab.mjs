#!/usr/bin/env node
// verify-external-tab.mjs — orchestrator-side post-spawn verification of
// external_apply Applieds. Run independently of any worker; reads DOM via CDP,
// writes evidence file, returns ok|verified|reason JSON.
//
// Args:
//   --tab-url=<url>     final_url the worker was on (host-match used)
//   --slug=<slug>       evidence filename slug
//   --run-dir=<dir>     batch run dir (writes evidence/<slug>-external-verify-<ts>.json)
//   [--original-url=<url>]  for failure logging context
//
// Stdout JSON: { ok, verified, reason, evidence_path, dom }
//   verified=true  → marker_match OR url_changed signal AND no validator errors
//   verified=false → page state inconclusive or shows errors
//
// Exit 0 always (caller reads JSON). Failures of CDP itself → ok:false.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CDP_ENDPOINT = process.env.CHROME_CDP || 'http://localhost:9222';

function arg(name) {
  const a = process.argv.slice(2).find(x => x.startsWith(`${name}=`));
  return a ? a.slice(name.length + 1) : null;
}
let _emitted = false;
function out(o) {
  if (_emitted) return;
  _emitted = true;
  process.stdout.write(JSON.stringify(o));
}

// Playwright's CDP layer asserts on unknown target types attached during
// connectOverCDP — recruitee/captcha shared_worker blobs cause an uncatchable
// throw inside an internal event handler. This crashes the helper after we've
// already done useful work (or before we get to start). Swallow the assert,
// emit a graceful inconclusive result, exit 0 so caller still gets JSON.
function isPlaywrightTargetAssert(err) {
  const msg = String(err?.message || err || '');
  return /Assertion error|targetInfo|_onAttachedToTarget/i.test(msg)
      || /shared_worker|service_worker/i.test(msg);
}
process.on('uncaughtException', (err) => {
  if (isPlaywrightTargetAssert(err)) {
    out({ ok: false, reason: `playwright cdp target assert (likely captcha shared_worker): ${String(err?.message || err).slice(0, 200)}` });
    process.exit(0);
  }
  out({ ok: false, reason: `uncaught: ${String(err?.message || err).slice(0, 200)}` });
  process.exit(0);
});
process.on('unhandledRejection', (err) => {
  if (isPlaywrightTargetAssert(err)) {
    out({ ok: false, reason: `playwright cdp target assert (rejection): ${String(err?.message || err).slice(0, 200)}` });
    process.exit(0);
  }
  out({ ok: false, reason: `unhandled rejection: ${String(err?.message || err).slice(0, 200)}` });
  process.exit(0);
});

const tabUrl = arg('--tab-url');
const slug = arg('--slug');
const runDir = arg('--run-dir');
const originalUrl = arg('--original-url') || null;

if (!tabUrl || !slug || !runDir) {
  out({ ok: false, reason: 'missing required args (--tab-url, --slug, --run-dir)' });
  process.exit(0);
}

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const evDir = resolve(runDir, 'evidence');
mkdirSync(evDir, { recursive: true });

function writeEvidence(payload) {
  const evidencePath = resolve(evDir, `${slug}-external-verify-${ts}.json`);
  writeFileSync(evidencePath, JSON.stringify({
    ts: new Date().toISOString(),
    source: 'orchestrator_post_hoc_verify',
    tab_url: tabUrl,
    original_url: originalUrl,
    ...payload,
  }, null, 2));
  return evidencePath;
}

// PRE-CHECK via raw CDP HTTP `/json/list` — no Playwright needed. If a tab
// matching the host has a "success-y" URL (/thankyou, /applySuccess, /success,
// /submitted, /confirmation), confirm immediately. This skips the Playwright
// CDP attach entirely and avoids the shared_worker assert crash for the
// common case (recruitee/softgarden/traffit redirect to /thankyou paths).
async function urlOnlyPrecheck() {
  try {
    const res = await fetch(`${CDP_ENDPOINT}/json/list`, { signal: AbortSignal.timeout(3000) });
    const tabs = await res.json();
    const targetU = new URL(tabUrl);
    const successRe = /thankyou|thank-you|apply-?success|applySuccess|\/success(\b|\/|\?)|submitted|confirmation/i;
    const sameHost = tabs.filter(t => t.type === 'page' && (() => {
      try { return new URL(t.url).host === targetU.host; } catch { return false; }
    })());
    const success = sameHost.find(t => successRe.test(t.url));
    if (success) {
      const evidencePath = writeEvidence({
        verified: true,
        reason: `url-only precheck matched: ${success.url}`,
        method: 'cdp_http_precheck',
        matched_tab_url: success.url,
      });
      out({ ok: true, verified: true, reason: `url precheck: ${success.url.slice(0, 120)}`, evidence_path: evidencePath, dom: { href: success.url, marker_match: null, url_changed: true, errors_visible: [] } });
      return true;
    }
  } catch { /* fallthrough to Playwright */ }
  return false;
}

if (await urlOnlyPrecheck()) process.exit(0);

let browser;
try {
  browser = await chromium.connectOverCDP(CDP_ENDPOINT);
} catch (e) {
  out({ ok: false, reason: `cdp connect failed: ${e.message}` });
  process.exit(0);
}

// Find page by URL or host. Match priority: exact → same pathname → same host.
function findPage(browser, target) {
  const targetU = (() => { try { return new URL(target); } catch { return null; } })();
  if (!targetU) return null;
  let exact = null, samePath = null, sameHost = null;
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      let u; try { u = new URL(page.url()); } catch { continue; }
      if (u.href === targetU.href) exact = page;
      else if (u.host === targetU.host && u.pathname === targetU.pathname) samePath = samePath || page;
      else if (u.host === targetU.host) sameHost = sameHost || page;
    }
  }
  return exact || samePath || sameHost || null;
}

const page = findPage(browser, tabUrl);
if (!page) {
  out({ ok: false, reason: `no tab found matching host of ${tabUrl}` });
  process.exit(0);
}

let dom;
try {
  dom = await page.evaluate(() => {
    const t = (document.body?.innerText || '').toLowerCase();
    const markers = [
      'thank you for applying', 'application received', 'application submitted',
      'your application has been', "we've received", 'we have received',
      'application sent', 'wysłane', 'wysłaliśmy', 'aplikacja została',
      'gesendet', 'erhalten', 'merci pour votre candidature', 'gracias por',
    ];
    return {
      href: location.href,
      title: document.title,
      url_changed: /thanks|success|submitted|confirmation|complete|received/i.test(location.href),
      marker_match: markers.find(m => t.includes(m)) || null,
      form_still_present: !!document.querySelector('button[type=submit], input[type=submit]'),
      errors_visible: [...document.querySelectorAll('[role=alert], .error, .invalid-field, .ng-invalid, [aria-invalid=true]')]
        .filter(e => e.offsetParent !== null)
        .slice(0, 5).map(e => (e.innerText || '').slice(0, 120))
        .filter(Boolean),
      body_text_head: t.slice(0, 600),
    };
  });
} catch (e) {
  out({ ok: false, reason: `evaluate failed: ${e.message}` });
  process.exit(0);
}

// Decision rule (generic, not per-ATS):
// verified IFF (marker_match OR url_changed) AND no validator errors visible.
// errors_visible AND form_still_present → submission rejected.
let verified = false;
let reason;
if (dom.errors_visible.length > 0 && dom.form_still_present) {
  verified = false;
  reason = `validator errors visible: ${dom.errors_visible[0]}`;
} else if (dom.marker_match || dom.url_changed) {
  verified = true;
  reason = dom.marker_match ? `marker matched: ${dom.marker_match}` : 'url changed to success path';
} else {
  verified = false;
  reason = 'no success marker AND url unchanged';
}

const evidencePath = writeEvidence({ verified, reason, dom, method: 'playwright_dom_eval' });

out({ ok: true, verified, reason, evidence_path: evidencePath, dom: { href: dom.href, marker_match: dom.marker_match, url_changed: dom.url_changed, errors_visible: dom.errors_visible } });
