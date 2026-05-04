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
function out(o) { process.stdout.write(JSON.stringify(o)); }

const tabUrl = arg('--tab-url');
const slug = arg('--slug');
const runDir = arg('--run-dir');
const originalUrl = arg('--original-url') || null;

if (!tabUrl || !slug || !runDir) {
  out({ ok: false, reason: 'missing required args (--tab-url, --slug, --run-dir)' });
  process.exit(0);
}

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

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const evDir = resolve(runDir, 'evidence');
mkdirSync(evDir, { recursive: true });
const evidencePath = resolve(evDir, `${slug}-external-verify-${ts}.json`);
writeFileSync(evidencePath, JSON.stringify({
  ts: new Date().toISOString(),
  source: 'orchestrator_post_hoc_verify',
  tab_url: tabUrl,
  original_url: originalUrl,
  verified, reason, dom,
}, null, 2));

out({ ok: true, verified, reason, evidence_path: evidencePath, dom: { href: dom.href, marker_match: dom.marker_match, url_changed: dom.url_changed, errors_visible: dom.errors_visible } });
