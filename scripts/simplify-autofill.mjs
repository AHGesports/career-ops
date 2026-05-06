// Simplify Copilot autofill driver via CDP.
//
// Connects to an already-running Chrome (launch-chrome.bat → port 9222) where the
// Simplify Copilot extension is installed and the user is signed in. Drives the
// extension's in-page panel (shadow DOM injected by content script), no toolbar
// click, no popup needed.
//
// Public API:
//   runSimplifyAutofill(jobUrl, opts) -> {
//     supported, clicked, startedAt, endedAt, durationMs,
//     filledFieldCount, filledFields, finalUrl, alreadyFilled, error?
//   }
//
// Signals reverse-engineered from extension v2.4.6:
//   - Supported page: a `.simplify-jobs-shadow-root` div is injected; its shadow
//     root contains the Simplify side panel.
//   - Autofill available: that shadow root contains `#fill-button` (aria-label
//     "Autofill", text "Autofill this page").
//   - Click side-effect: extension appends `?utm_source=Simplify&gh_src=Simplify`
//     to the URL and the page navigates. Form fields populate after the new
//     page load.
//   - Done: `#fill-button` no longer present in the panel; form input values
//     stable for `STABLE_MS`.

import { createRequire } from 'module';
import { chromium } from 'playwright';

// Patch Playwright to tolerate orphan CDP targets (shared_workers from blob:
// URLs — e.g. recruiteecdn captcha workers — have no browserContextId and
// trip an assertion in CRBrowser._onAttachedToTarget).
{
  const _req = createRequire(import.meta.url);
  const path = _req('path');
  const pwCorePath = _req.resolve('playwright-core');
  // Walk up from playwright-core's main entry to its package root.
  const pwCoreRoot = path.dirname(pwCorePath).replace(/[\\/]lib(?:[\\/].*)?$/, '');
  const { CRBrowser } = _req(path.join(pwCoreRoot, 'lib', 'server', 'chromium', 'crBrowser.js'));
  const orig = CRBrowser.prototype._onAttachedToTarget;
  CRBrowser.prototype._onAttachedToTarget = function (args) {
    const ti = args?.targetInfo;
    if (ti && !ti.browserContextId && ti.type !== 'page' && ti.type !== 'browser') {
      // Detach and ignore — workers/iframes that aren't bound to a context.
      try { this._session.createChildSession(args.sessionId).detach().catch(() => {}); } catch {}
      return;
    }
    return orig.call(this, args);
  };
}

const DEFAULT_CDP = 'http://localhost:9222';
const PANEL_WAIT_MS = 8000;
const NAV_WAIT_MS = 15000;
const FILL_TIMEOUT_MS = 20000;
const STABLE_MS = 1500;
const POLL_MS = 250;

export async function runSimplifyAutofill(jobUrl, opts = {}) {
  const cdpUrl = opts.cdpUrl || DEFAULT_CDP;

  const browser = await chromium.connectOverCDP(cdpUrl);
  const ctx = browser.contexts()[0];
  if (!ctx) {
    await browser.close();
    return { supported: false, clicked: false, error: 'no browser context' };
  }

  const page = await ctx.newPage();
  try {
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    return await runSimplifyAutofillOnPage(page, opts);
  } catch (err) {
    return {
      supported: false, clicked: false, alreadyFilled: false,
      startedAt: Date.now(), endedAt: Date.now(), durationMs: 0,
      filledFieldCount: 0, filledFields: [], cvUploaded: false,
      finalUrl: jobUrl, error: err?.message || String(err),
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

// Same as runSimplifyAutofill but operates on an already-open Playwright Page
// at the target URL. Does NOT navigate, does NOT close the browser. Used by
// gmail-apply.mjs after redirect detection so the existing tab on the
// external ATS is fed straight to the Simplify panel.
export async function runSimplifyAutofillOnPage(page, opts = {}) {
  const startedAt = Date.now();
  const result = {
    supported: false, clicked: false, alreadyFilled: false,
    startedAt, endedAt: null, durationMs: 0,
    filledFieldCount: 0, filledFields: [], cvUploaded: false,
    finalUrl: '',
  };
  try {
    try { result.finalUrl = page.url(); } catch { /* page may have been closed */ }

    const panelState = await waitForPanel(page, opts.panelWaitMs ?? PANEL_WAIT_MS);
    result.supported = panelState.supported;

    if (!panelState.supported) {
      result.endedAt = Date.now();
      result.durationMs = result.endedAt - result.startedAt;
      return result;
    }

    if (!panelState.hasFillButton) {
      result.alreadyFilled = true;
      result.filledFields = await readFilledFields(page);
      result.filledFieldCount = result.filledFields.length;
      result.cvUploaded = await detectCvUploaded(page);
      result.finalUrl = page.url();
      result.endedAt = Date.now();
      result.durationMs = result.endedAt - result.startedAt;
      return result;
    }

    const clickedInPage = await page.evaluate(() => {
      for (const r of document.querySelectorAll('.simplify-jobs-shadow-root')) {
        const b = r.shadowRoot?.querySelector('#fill-button');
        if (b) { b.click(); return true; }
      }
      return false;
    });
    if (!clickedInPage) {
      result.error = 'fill button vanished before click';
      result.endedAt = Date.now();
      result.durationMs = result.endedAt - result.startedAt;
      return result;
    }
    result.clicked = true;

    try {
      await page.waitForURL(u => /utm_source=Simplify/i.test(String(u)), {
        timeout: opts.navWaitMs ?? NAV_WAIT_MS, waitUntil: 'domcontentloaded',
      });
    } catch { /* no nav — fine, continue and poll fields */ }

    await waitForPanel(page, opts.panelWaitMs ?? PANEL_WAIT_MS);

    const fillEnd = await pollUntilStable(page, opts.fillTimeoutMs ?? FILL_TIMEOUT_MS, opts.stableMs ?? STABLE_MS);
    result.filledFields = fillEnd.fields;
    result.filledFieldCount = fillEnd.fields.length;
    result.cvUploaded = await detectCvUploaded(page);
    result.finalUrl = page.url();
    result.endedAt = Date.now();
    result.durationMs = result.endedAt - result.startedAt;
    return result;
  } catch (err) {
    result.error = err?.message || String(err);
    result.endedAt = Date.now();
    result.durationMs = result.endedAt - result.startedAt;
    return result;
  }
}

async function detectCvUploaded(page) {
  return page.evaluate(() => {
    for (const f of document.querySelectorAll('input[type=file]')) {
      if ((f.files && f.files.length > 0) || (f.value && f.value.length > 0)) return true;
    }
    return false;
  }).catch(() => false);
}

async function waitForPanel(page, timeoutMs) {
  // Returns the first observed state where #fill-button is present, OR if the
  // timeout elapses, returns the last observed state (which may indicate
  // alreadyFilled when supported=true but hasFillButton=false).
  const deadline = Date.now() + timeoutMs;
  let last = { supported: false, hasFillButton: false };
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const roots = document.querySelectorAll('.simplify-jobs-shadow-root');
      let supported = false, hasFillButton = false;
      for (const r of roots) {
        if (!r.shadowRoot) continue;
        if (r.shadowRoot.childElementCount > 0) supported = true;
        if (r.shadowRoot.querySelector('#fill-button')) {
          hasFillButton = true; supported = true; break;
        }
      }
      return { supported, hasFillButton };
    }).catch(() => ({ supported: false, hasFillButton: false }));
    last = state;
    if (state.hasFillButton) return state;
    await page.waitForTimeout(POLL_MS);
  }
  return last;
}

async function readFilledFields(page) {
  return page.evaluate(() => {
    const out = [];
    for (const f of document.querySelectorAll('input, textarea, select')) {
      const v = f.value || '';
      if (!v) continue;
      if (f.type === 'hidden' || f.type === 'submit' || f.type === 'button') continue;
      out.push({ name: f.name || f.id || f.getAttribute('aria-label') || '', type: f.type, value: v.slice(0, 120) });
    }
    return out;
  }).catch(() => []);
}

async function pollUntilStable(page, timeoutMs, stableMs) {
  const deadline = Date.now() + timeoutMs;
  let lastSig = '';
  let stableSince = null;
  let lastFields = [];
  while (Date.now() < deadline) {
    const fields = await readFilledFields(page);
    const sig = fields.map(f => f.name + '=' + f.value).join('|');
    if (sig === lastSig && fields.length > 0) {
      if (!stableSince) stableSince = Date.now();
      if (Date.now() - stableSince >= stableMs) {
        return { fields };
      }
    } else {
      lastSig = sig;
      stableSince = null;
      lastFields = fields;
    }
    await page.waitForTimeout(POLL_MS);
  }
  return { fields: lastFields };
}

// CLI entry: `node scripts/simplify-autofill.mjs <jobUrl>`
const isMain = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('simplify-autofill.mjs');
if (isMain) {
  const jobUrl = process.argv[2];
  if (!jobUrl) {
    console.error('usage: node scripts/simplify-autofill.mjs <jobUrl>');
    process.exit(2);
  }
  runSimplifyAutofill(jobUrl).then(r => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.error ? 1 : 0);
  });
}
