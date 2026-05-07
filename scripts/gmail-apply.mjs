#!/usr/bin/env node
// gmail-apply — execute a per-portal application recipe via Playwright over CDP.
//
// Usage: node scripts/gmail-apply.mjs <URL> [--submit]
//
// Connects to the Chrome instance launched by launch-chrome.bat (port 9222),
// finds an open tab on the URL (or opens one), executes the matched portal's
// steps, verifies the final form state, prints a JSON summary, and exits
// WITHOUT closing the browser. User clicks the Submit button manually unless
// --submit is passed.
//
// Output: single JSON line on stdout. Errors to stderr.

import { chromium } from 'playwright';
import yaml from 'js-yaml';
import { runSimplifyAutofillOnPage } from './simplify-autofill.mjs';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CONFIG_PATH = resolve(REPO_ROOT, 'config/gmail-apply-portals.yml');
const ERROR_LOG = resolve(REPO_ROOT, 'data/gmail-apply-errors.ndjson');
const CDP_ENDPOINT = process.env.CHROME_CDP || 'http://localhost:9222';

// --run-id support: when supplied, all per-run artifacts live under
// data/batch-runs/<run_id>/{steps.ndjson, evidence/}. Without it we only write
// the legacy ERROR_LOG.
function runDirFor(runId) {
  return runId ? resolve(REPO_ROOT, 'data/batch-runs', runId) : null;
}

function logError(entry) {
  try {
    mkdirSync(dirname(ERROR_LOG), { recursive: true });
    appendFileSync(ERROR_LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* logging is best-effort */ }
}

function logStep(runDir, entry) {
  if (!runDir) return;
  try {
    mkdirSync(runDir, { recursive: true });
    appendFileSync(resolve(runDir, 'steps.ndjson'), JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* best-effort */ }
}

// Deterministic per-URL heartbeat. Cheap (2 lines/URL) and immune to worker
// dropouts -- referee uses presence/absence of these to know whether the
// script even ran. Written by node; no LLM involvement.
const PROGRESS_STATE = { runId: null, runDir: null, url: null, started: false, done: false };
function appendScriptProgress(evt) {
  if (!PROGRESS_STATE.runDir) return;
  try {
    mkdirSync(PROGRESS_STATE.runDir, { recursive: true });
    appendFileSync(
      resolve(PROGRESS_STATE.runDir, 'script-progress.ndjson'),
      JSON.stringify({ ts: new Date().toISOString(), ...evt }) + '\n'
    );
  } catch { /* best-effort */ }
}
process.on('exit', (code) => {
  if (PROGRESS_STATE.runDir && PROGRESS_STATE.started && !PROGRESS_STATE.done) {
    PROGRESS_STATE.done = true;
    appendScriptProgress({
      event: 'script_done',
      url: PROGRESS_STATE.url,
      run_id: PROGRESS_STATE.runId,
      pid: process.pid,
      exit_code: code,
      reached_normal_exit: false,
    });
  }
});

function urlSlug(url) {
  return url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 80).replace(/-+$/, '');
}

// Known framework-protected ATS hosts. When the script detects a redirect
// to one of these, it tags the redirect block with framework_hint so the
// worker can skip its own framework-detection probe and go straight to MCP
// fill (the only strategy that works on these). DO NOT auto-create a yaml
// recipe for these hosts — they remain one-time MCP applications per
// design (DOM not stable across runs).
const KNOWN_ATS_HINTS = [
  { match: 'myworkdayjobs.com',         framework: { workday: true,  any: true } },
  { match: 'boards.greenhouse.io',      framework: { react: true,    any: true } },
  { match: 'jobs.lever.co',             framework: { react: true,    any: true } },
  { match: 'recruitify.ai',             framework: { angular: true,  any: true } },
  { match: 'recruitify.pl',             framework: { angular: true,  any: true } },
  { match: 'traffit.com',               framework: { angular: true,  any: true } },
  { match: 'smartrecruiters.com',       framework: { react: true,    any: true } },
  { match: 'workable.com',              framework: { react: true,    any: true } },
  { match: 'jobvite.com',               framework: { angular: true,  any: true } },
  { match: 'icims.com',                 framework: { angular: true,  any: true } },
  { match: 'taleo.net',                 framework: { angular: true,  any: true } },
  { match: 'successfactors.com',        framework: { angular: true,  any: true } },
];

// Best-effort Simplify Copilot autofill on the redirected tab. Always runs
// on every detected redirect; gracefully no-ops when the extension panel
// isn't injected (= unsupported framework, e.g. Workday, iCIMS). Result is
// attached to the redirect block as `simplify`. Errors do NOT fail the
// caller — agent handover continues regardless.
async function trySimplifyOnPage(targetPage, runId, originalUrl, portalName) {
  try {
    const r = await runSimplifyAutofillOnPage(targetPage);
    logError({
      phase: 'simplify_autofill',
      url: originalUrl,
      portal: portalName,
      run_id: runId,
      supported: r.supported,
      clicked: r.clicked,
      already_filled: r.alreadyFilled,
      filled_field_count: r.filledFieldCount,
      cv_uploaded: r.cvUploaded,
      duration_ms: r.durationMs,
      err: r.error || null,
    });
    return r;
  } catch (err) {
    logError({
      phase: 'simplify_autofill',
      url: originalUrl,
      portal: portalName,
      run_id: runId,
      err: err?.message || String(err),
    });
    return { supported: false, clicked: false, alreadyFilled: false, error: err?.message || String(err) };
  }
}

function frameworkHintFor(url) {
  if (!url) return null;
  for (const h of KNOWN_ATS_HINTS) {
    if (url.includes(h.match)) {
      return {
        host_pattern: h.match,
        framework_detected: { angular: false, react: false, vue: false, workday: false, ...h.framework },
        source: 'known_ats_registry',
      };
    }
  }
  return null;
}

// Compact DOM evidence — small enough that an orchestrator can read many
// without context bloat (~1.5 KB target). Captures href + title + invalid
// fields + visible buttons + truncated body text + modal state.
//
// Two-phase capture so portal yaml's Playwright-pseudo selectors (e.g.
// `aside:has-text('Aplikacja została wysłana')`) can't kill the entire
// evidence file:
//
//   Phase A — probe portal-supplied selectors (success_selector candidates,
//   modal_selector) via page.locator().count() which is Playwright-native
//   and handles :has-text(...) etc.
//
//   Phase B — collect static DOM signals (href, title, body, buttons,
//   invalid_fields) via a single page.evaluate that does NOT touch any
//   user-supplied selector. So a bad yaml selector can never throw inside
//   the evaluate.
//
// Each per-selector probe is independently try/catch'd. capture_error is
// reserved for catastrophic CDP failures (page closed, etc).
async function captureEvidence(page, portal) {
  const successCandidates = Array.isArray(portal.success_selector)
    ? portal.success_selector
    : (portal.success_selector ? [portal.success_selector] : []);
  const modalSel = portal.modal_selector || '#apply-modal, [role="dialog"]';

  // Phase A — Playwright-locator probes (handles pseudo selectors).
  let success_match = null;
  const success_probes = [];
  for (const sel of successCandidates) {
    let n = -1, err = null;
    try { n = await page.locator(sel).count(); }
    catch (e) { err = e.message?.slice(0, 120) || 'unknown'; }
    success_probes.push({ sel, count: n, err });
    if (n > 0 && success_match === null) success_match = sel;
  }
  let modal_open = null;
  try { modal_open = (await page.locator(modalSel).count()) > 0; }
  catch { modal_open = null; }

  // Phase B — static DOM signals via plain page.evaluate (no user selectors).
  let domSignals;
  try {
    domSignals = await page.evaluate(() => {
      const visibleButtons = [...document.querySelectorAll('button:not([disabled])')]
        .slice(0, 30)
        .map(b => (b.innerText || '').trim().slice(0, 80))
        .filter(Boolean);
      const invalidFields = [...document.querySelectorAll('.invalid-field, .ng-invalid, [aria-invalid="true"]')]
        .slice(0, 20)
        .map(e => {
          const label = e.querySelector('label')?.innerText
            || e.getAttribute('aria-label')
            || e.getAttribute('placeholder')
            || e.getAttribute('formcontrolname')
            || e.getAttribute('name')
            || '';
          return (e.tagName + ':' + label).slice(0, 100);
        });
      return {
        href: location.href,
        pathname: location.pathname,
        title: (document.title || '').slice(0, 120),
        invalid_fields: invalidFields,
        visible_buttons: visibleButtons,
        body_text_head: (document.body?.innerText || '').replace(/\s+/g, ' ').slice(0, 1500),
      };
    });
  } catch (e) {
    return { capture_error: e.message, success_match, success_probes, modal_open };
  }

  return {
    ...domSignals,
    success_match,
    modal_open,
    success_probes,
  };
}

function out(obj) {
  // Mark progress as completed normally before stdout emit. process.on('exit')
  // will skip the fallback once `done` is true.
  if (PROGRESS_STATE.runDir && PROGRESS_STATE.started && !PROGRESS_STATE.done) {
    PROGRESS_STATE.done = true;
    appendScriptProgress({
      event: 'script_done',
      url: PROGRESS_STATE.url,
      run_id: PROGRESS_STATE.runId,
      pid: process.pid,
      reached_normal_exit: true,
      submitted: obj?.submitted === true,
      submitted_unconfirmed: obj?.submitted_unconfirmed === true,
      redirect_detected: obj?.redirect?.detected === true,
      ok: obj?.ok === true,
    });
  }
  console.log(JSON.stringify(obj));
}

function fail(err, extra = {}) {
  console.error(JSON.stringify({ ok: false, err, ...extra }));
  process.exit(1);
}

function resolveTemplate(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in data)) throw new Error(`unresolved template key: ${k}`);
    return data[k];
  });
}

function matchPortal(url, config) {
  for (const portal of config.portals) {
    const matches = portal.match || [];
    if (matches.some(m => url.includes(m))) return portal;
  }
  return null;
}

// Stale external-ATS tabs accumulate from prior failed redirect runs and
// confuse downstream MCP work (wrong tab focused, double-submits). Source of
// truth: past `redirect_to_external` entries in data/gmail-apply-errors.ndjson.
// Any host we've redirected to before is fair game to close at startup if it
// isn't the current target. No hardcoded list — self-learning from our own logs.
function loadKnownExternalHosts() {
  const hosts = new Set();
  try {
    const path = resolve(REPO_ROOT, 'data/gmail-apply-errors.ndjson');
    const text = readFileSync(path, 'utf8');
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      let rec;
      try { rec = JSON.parse(line); } catch { continue; }
      if (rec.phase !== 'redirect_to_external' || !rec.final_url) continue;
      try { hosts.add(new URL(rec.final_url).host); } catch { /* skip bad url */ }
    }
  } catch { /* file may not exist yet */ }
  return hosts;
}

async function closeStaleExternalTabs(browser, currentUrl) {
  const closed = [];
  const knownHosts = loadKnownExternalHosts();
  if (knownHosts.size === 0) return closed;
  const currentHost = (() => { try { return new URL(currentUrl).host; } catch { return ''; } })();
  try {
    for (const ctx of browser.contexts()) {
      for (const page of ctx.pages()) {
        try {
          const u = page.url();
          if (!u || u === 'about:blank') continue;
          let host = '';
          try { host = new URL(u).host; } catch { continue; }
          if (host === currentHost) continue;
          if (knownHosts.has(host)) {
            closed.push(u);
            await page.close().catch(() => {});
          }
        } catch { /* dead page */ }
      }
    }
  } catch { /* best-effort */ }
  return closed;
}

async function getOrOpenPage(browser, url) {
  const contexts = browser.contexts();
  for (const ctx of contexts) {
    for (const page of ctx.pages()) {
      try {
        const u = page.url();
        if (u === url || u.startsWith(url.split('?')[0])) return page;
      } catch { /* dead page */ }
    }
  }
  // No matching tab — open in first context (or new one).
  const ctx = contexts[0] || await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return page;
}

// Inter-URL settle: previous run may have left an Angular CDK overlay (success
// modal, confirmation dialog) on top of the page, blocking pointer events.
// Dismiss any open overlays + escape any modal, then wait briefly for the body
// to become click-ready. Best-effort; never throws.
async function settlePage(page) {
  try {
    // Press Escape twice — closes most modal-style overlays in Angular Material / Bootstrap / nfj.
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(150);
    await page.keyboard.press('Escape').catch(() => {});
    // Also try clicking any visible backdrop or "close" button that's commonly used.
    await page.evaluate(() => {
      const sels = [
        '.cdk-overlay-backdrop.cdk-overlay-backdrop-showing',
        'button[aria-label="Close"]',
        'button[aria-label="close"]',
        'button.close',
        '[data-dismiss="modal"]',
      ];
      for (const s of sels) {
        const el = document.querySelector(s);
        if (el && el instanceof HTMLElement) el.click();
      }
    }).catch(() => {});
    await page.waitForTimeout(300);
  } catch { /* best-effort */ }
}

// Optional-aware existence probe. For steps marked `optional: true`, returns
// false fast (no wait) when the selector is missing so the step can be skipped
// without bubbling a timeout error.
async function selectorExists(page, sel, ms = 200) {
  if (!sel) return false;
  try {
    const count = await page.locator(sel).count();
    if (count > 0) return true;
    // brief grace for late-rendered fields
    await page.waitForTimeout(ms);
    return (await page.locator(sel).count()) > 0;
  } catch {
    return false;
  }
}

async function runStep(page, step, portal) {
  const data = portal.data || {};
  // Optional steps: skip silently when the targeted element doesn't exist on
  // THIS form. Some jobs have extra required fields (location dropdown, etc.)
  // that other jobs on the same portal don't. Yaml authors mark such steps
  // `optional: true`. Missing selector → skip + return ok with `skipped:true`.
  if (step.optional) {
    const probeSels = Array.isArray(step.selectors) && step.selectors.length
      ? step.selectors
      : [step.selector || step.container];
    const grace = Number(step.timeout_ms) > 0 ? Number(step.timeout_ms) : 1500;
    let any = false;
    for (const ps of probeSels) {
      if (!ps) continue;
      if (await selectorExists(page, ps, grace)) { any = true; break; }
    }
    if (probeSels.some(Boolean) && !any) {
      return { ok: true, skipped: true, reason: 'optional selector not present' };
    }
  }
  switch (step.action) {
    case 'click': {
      // Resilient click: scrollIntoView first (sticky headers / sidebar buttons
      // can be off-screen), bumped default timeout (Chrome under stress can
      // take >5s to settle), one retry on timeout. Honors step.timeout_ms.
      // Multi-selector fallback: step.selectors[] tried in order; first match
      // with count > 0 wins. step.selector still works as primary single value.
      // Pre-click enabled-poll: Angular portals (NFJ) re-disable buttons during
      // hydration; brief wait for :not([disabled]) avoids spurious failures
      // without slowing portals where button is enabled from the start.
      const tmo = Number(step.timeout_ms) > 0 ? Number(step.timeout_ms) : 8000;
      const candidates = Array.isArray(step.selectors) && step.selectors.length
        ? step.selectors
        : [step.selector];
      let chosenSel = null;
      let loc = null;
      for (const cand of candidates) {
        if (!cand) continue;
        const c = page.locator(cand).first();
        try {
          await c.waitFor({ state: 'attached', timeout: candidates.length > 1 ? 2500 : tmo });
          chosenSel = cand;
          loc = c;
          break;
        } catch { /* try next */ }
      }
      if (!loc) {
        // Fall through to first candidate to preserve original error path.
        chosenSel = candidates[0];
        loc = page.locator(chosenSel).first();
      }
      // Wait for enabled (non-disabled, non-aria-disabled) up to enabled_timeout_ms
      // (default 4s, capped by tmo). Best-effort — if it never settles, click
      // attempt below still runs and may succeed via force.
      const enabledTmo = Math.min(Number(step.enabled_timeout_ms) > 0 ? Number(step.enabled_timeout_ms) : 4000, tmo);
      try {
        await page.waitForFunction((sel) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          if (el.disabled === true) return false;
          if (el.getAttribute && el.getAttribute('aria-disabled') === 'true') return false;
          return true;
        }, chosenSel, { timeout: enabledTmo, polling: 200 });
      } catch { /* button may never expose disabled state — proceed */ }
      try {
        await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await loc.click({ timeout: tmo });
        return { ok: true, selector_used: chosenSel };
      } catch (e) {
        // Single retry — covers transient hydration/animation/CPU-pressure
        // misses without masking a genuinely missing selector.
        await page.waitForTimeout(750);
        await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await loc.click({ timeout: tmo, force: !!step.force });
        return { ok: true, retried: true, selector_used: chosenSel };
      }
    }
    case 'fill': {
      const value = resolveTemplate(step.value, data);
      const loc = page.locator(step.selector).first();
      await loc.waitFor({ state: 'visible', timeout: 5000 });
      await loc.fill(value);
      return { ok: true };
    }
    case 'select': {
      // Sets value of a <select> element. Playwright matches by value, label,
      // or index. We pass the resolved string as `value` (most stable for
      // server-rendered selects with stable option values).
      // label_aliases: try each in order, first match wins. Useful when the
      // option value varies per locale/job (e.g. nationality dropdowns).
      // Optional steps get a short timeout (3s) so wrong-value misses are cheap.
      const aliases = step.label_aliases
        ? step.label_aliases.map(a => resolveTemplate(a, data))
        : [resolveTemplate(step.value, data)];
      const loc = page.locator(step.selector).first();
      await loc.waitFor({ state: 'visible', timeout: 5000 });
      const tmo = step.optional ? 3000 : 30000;
      let lastErr;
      for (const alias of aliases) {
        try {
          await loc.selectOption(alias, { timeout: tmo });
          return { ok: true, value: alias };
        } catch (e) { lastErr = e; }
      }
      throw lastErr;
    }
    case 'check': {
      const aliases = step.label_aliases || [step.label];
      const container = page.locator(step.container).first();
      await container.waitFor({ state: 'visible', timeout: 5000 });
      for (const alias of aliases) {
        // Find an element inside the container whose text contains the alias,
        // case-insensitive. Prefer label-like elements; fall back to the
        // closest checkbox.
        const el = container.locator(
          `label:has-text("${alias}"), nfj-checkbox:has-text("${alias}"), mat-checkbox:has-text("${alias}"), [role=checkbox]:has-text("${alias}")`
        ).first();
        if (await el.count()) {
          const cb = el.locator('input[type=checkbox]').first();
          if (await cb.count()) {
            await cb.check({ force: true, timeout: 3000 });
          } else {
            await el.click({ timeout: 3000 });
          }
          return { ok: true, matched: alias };
        }
      }
      if (step.optional) return { ok: true, skipped: true, reason: `no alias matched (optional): ${aliases.join('|')}` };
      return { ok: false, err: `no alias matched: ${aliases.join('|')}` };
    }
    case 'wait_selector': {
      const tmo = Number(step.timeout_ms) > 0 ? Number(step.timeout_ms) : 5000;
      await page.locator(step.selector).first().waitFor({ state: 'visible', timeout: tmo });
      return { ok: true };
    }
    case 'select_multiselect': {
      // Open a custom multiselect dropdown (e.g. Angular nfj-multiselect-dropdown)
      // and pick the first option whose visible text matches one of step.match
      // patterns (case-insensitive). Falls back to first visible item unless
      // step.require_match is true. Many Angular multiselect impls render the
      // option list OUTSIDE the originating form-field (CDK overlay / portal),
      // so when in-scope item search yields nothing we widen to document scope.
      const root = page.locator(step.selector).first();
      await root.waitFor({ state: 'visible', timeout: 5000 });
      const trigger = root.locator(step.trigger_selector || '.multiselect-dropdown, [class*="dropdown-btn"]').first();
      // Real CDP click: synthetic .dispatchEvent('click') is ignored by some
      // Angular handlers. Playwright's .click() uses a trusted event sequence.
      await trigger.click({ timeout: 5000 });
      await page.waitForTimeout(400); // small settle for dropdown render
      // Item selectors restricted to dropdown internals only — avoid leaking
      // into page-level <li> (job listings, nav menus, etc.) which would let
      // a stray "Warsaw" / "Senior" element be picked when patterns don't
      // match the actual options. Default scope: known dropdown containers.
      const itemSel = step.item_selector || '.multiselect-item, [class*="dropdown-list"] li, [class*="dropdown-list"] [class*="item"], [role="option"]';
      // Try local scope first (item rendered inside the form-field).
      let items = root.locator(itemSel);
      let count = await items.count();
      if (count === 0) {
        // Fall back to dropdown-only document scope. Strictly the multiselect
        // and CDK overlay panes — never plain `li` at document scope.
        items = page.locator(
          `nfj-multiselect-dropdown ${itemSel}, [class*="multiselect-dropdown"] ${itemSel}, .cdk-overlay-pane ${itemSel}`
        );
        count = await items.count();
      }
      if (count === 0) {
        await page.keyboard.press('Escape').catch(() => {});
        return { ok: false, err: 'multiselect did not open (0 options visible)' };
      }
      const patterns = (step.match || []).map(p => new RegExp(p, 'i'));
      let chosen = null;
      for (let i = 0; i < count && i < 200; i++) {
        const it = items.nth(i);
        if (!(await it.isVisible().catch(() => false))) continue;
        const txt = ((await it.innerText().catch(() => '')) || '').trim();
        if (!txt) continue;
        if (patterns.length === 0 || patterns.some(re => re.test(txt))) {
          chosen = { idx: i, text: txt };
          await it.click({ timeout: 3000 });
          break;
        }
      }
      if (!chosen && !step.require_match) {
        // Fallback: first visible non-empty item
        for (let i = 0; i < count && i < 50; i++) {
          const it = items.nth(i);
          if (!(await it.isVisible().catch(() => false))) continue;
          const txt = ((await it.innerText().catch(() => '')) || '').trim();
          if (!txt) continue;
          await it.click({ timeout: 3000 });
          chosen = { idx: i, text: txt, fallback: true };
          break;
        }
      }
      // Close dropdown best-effort.
      await page.keyboard.press('Escape').catch(() => {});
      if (!chosen) return { ok: false, err: `no multiselect option matched: ${(step.match || []).join('|')}` };
      return { ok: true, chosen };
    }
    case 'wait_ms': {
      await page.waitForTimeout(step.ms);
      return { ok: true };
    }
    case 'radio_group': {
      // Pick a radio option by its visible label, scoped under a question label
      // (XING step-2 employer questions use radio Yes/No groups, not selects).
      // Yaml fields:
      //   container: optional outer scope (default: page)
      //   question_label: text/regex of the question heading (required)
      //   answer: visible label of the option to select (required)
      //   answer_aliases: alt strings (DE/EN), tried in order
      //   timeout_ms: per-attempt grace (default 5000)
      const tmo = Number(step.timeout_ms) > 0 ? Number(step.timeout_ms) : 5000;
      const root = step.container ? page.locator(step.container).first() : page.locator('body').first();
      const qText = step.question_label;
      if (!qText) return { ok: false, err: 'radio_group: question_label required' };
      // Find any element containing the question text. Fieldset/legend pattern,
      // div with aria-labelledby, or plain label all work — we walk up to the
      // nearest fieldset/section/group ancestor and search inside it.
      const qLoc = root.locator(`:scope :text-matches("${qText.replace(/"/g, '\\"')}", "i")`).first();
      try {
        await qLoc.waitFor({ state: 'attached', timeout: tmo });
      } catch {
        return { ok: false, err: `radio_group: question not found: ${qText}` };
      }
      // Climb to the nearest grouping container holding the radios for THIS question.
      const groupHandle = await qLoc.evaluateHandle((el) => {
        let cur = el;
        for (let i = 0; i < 8 && cur; i++) {
          const inputs = cur.querySelectorAll && cur.querySelectorAll('input[type=radio], [role=radio]');
          if (inputs && inputs.length >= 2) return cur;
          cur = cur.parentElement;
        }
        return el.closest('fieldset, [role=radiogroup], .form-field, .question, section, div') || el.parentElement;
      });
      const aliases = Array.isArray(step.answer_aliases) && step.answer_aliases.length
        ? step.answer_aliases
        : [step.answer];
      let chosen = null;
      for (const a of aliases) {
        if (!a) continue;
        const clicked = await page.evaluate(({ groupEl, label }) => {
          if (!groupEl) return false;
          const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
          const target = norm(label);
          const labels = [...groupEl.querySelectorAll('label')];
          for (const l of labels) {
            if (norm(l.innerText).includes(target)) {
              const id = l.getAttribute('for');
              const input = id ? document.getElementById(id) : l.querySelector('input[type=radio], [role=radio]');
              if (input) {
                input.click();
                if (!input.checked && input.dispatchEvent) {
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                }
                return true;
              }
              l.click();
              return true;
            }
          }
          // No <label> match — try aria-label on radio inputs directly.
          const radios = [...groupEl.querySelectorAll('input[type=radio], [role=radio]')];
          for (const r of radios) {
            const al = norm(r.getAttribute('aria-label') || r.value || '');
            if (al && al.includes(target)) { r.click(); return true; }
          }
          return false;
        }, { groupEl: groupHandle, label: a });
        if (clicked) { chosen = a; break; }
      }
      if (!chosen) return { ok: false, err: `radio_group: no answer matched: ${aliases.join('|')}` };
      return { ok: true, chosen };
    }
    default:
      return { ok: false, err: `unknown action: ${step.action}` };
  }
}

async function verify(page, portal) {
  // Re-read form state for fields we just filled. Returns object describing what's set.
  // Optional steps that didn't appear on this form are skipped — verifier won't
  // mark them as failures.
  const checks = {};
  for (const step of portal.steps) {
    if (step.action === 'fill') {
      const exists = step.optional ? await selectorExists(page, step.selector) : true;
      if (!exists) {
        checks[`fill:${step.selector.slice(0, 50)}`] = { ok: true, skipped: true };
        continue;
      }
      const expected = resolveTemplate(step.value, portal.data || {});
      const actual = await page.locator(step.selector).first().inputValue().catch(() => null);
      checks[`fill:${step.selector.slice(0, 50)}`] = {
        expected,
        actual,
        ok: actual === expected,
      };
    }
    if (step.action === 'select') {
      const exists = step.optional ? await selectorExists(page, step.selector) : true;
      if (!exists) {
        checks[`select:${step.selector.slice(0, 50)}`] = { ok: true, skipped: true };
        continue;
      }
      const expected = resolveTemplate(step.value, portal.data || {});
      const actual = await page.locator(step.selector).first().inputValue().catch(() => null);
      checks[`select:${step.selector.slice(0, 50)}`] = {
        expected,
        actual,
        ok: actual === expected,
      };
    }
    if (step.action === 'check') {
      const exists = step.optional ? await selectorExists(page, step.container) : true;
      if (!exists) {
        checks[`check:${step.label}`] = { ok: true, skipped: true };
        continue;
      }
      const aliases = step.label_aliases || [step.label];
      let any_checked = false;
      for (const alias of aliases) {
        const cb = page.locator(step.container).locator(
          `label:has-text("${alias}") input[type=checkbox], nfj-checkbox:has-text("${alias}") input[type=checkbox]`
        ).first();
        if (await cb.count()) {
          any_checked = await cb.isChecked().catch(() => false);
          if (any_checked) break;
        }
      }
      checks[`check:${step.label}`] = { ok: any_checked };
    }
  }
  return checks;
}

async function main() {
  const args = process.argv.slice(2);
  const url = args.find(a => a.startsWith('http'));
  const force = args.includes('--force');
  // --autofix is consumed by the orchestrator (parent agent of the batch
  // skill), not the script. Script just accepts the flag so callers can pass
  // it uniformly.
  const autofix = args.includes('--autofix');
  const experimental = args.includes('--experimental');
  const runIdArg = args.find(a => a.startsWith('--run-id='));
  const runId = runIdArg ? runIdArg.slice('--run-id='.length) : null;
  const autoSubmit = args.includes('--submit') || force;
  if (!url) fail('usage: gmail-apply.mjs <URL> [--submit|--force] [--autofix] [--experimental] [--run-id=ID]');
  const runDir = runDirFor(runId);
  if (runDir) {
    PROGRESS_STATE.runId = runId;
    PROGRESS_STATE.runDir = runDir;
    PROGRESS_STATE.url = url;
    PROGRESS_STATE.started = true;
    appendScriptProgress({ event: 'script_started', url, run_id: runId, pid: process.pid });
  }

  let config;
  try {
    config = yaml.load(readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    fail(`config read failed: ${e.message}`);
  }

  const portal = matchPortal(url, config);
  if (!portal) fail(`no portal matched: ${url}`, { hint: 'add entry to config/gmail-apply-portals.yml' });

  let browser;
  try {
    browser = await chromium.connectOverCDP(CDP_ENDPOINT);
  } catch (e) {
    fail(`cdp connect failed: ${e.message}`, { hint: 'run launch-chrome.bat first' });
  }

  const closedStale = await closeStaleExternalTabs(browser, url);
  if (closedStale.length) {
    logError({ phase: 'stale_tabs_closed', url, portal: portal.name, run_id: runId, count: closedStale.length, urls: closedStale });
  }

  const page = await getOrOpenPage(browser, url);
  await page.bringToFront().catch(() => {});

  // Dismiss leftover overlays from a previous run (e.g. apply-confirmation modal
  // from the prior URL) so the apply button is click-ready. No-op if clean.
  await settlePage(page);

  // Job unavailability check — portal yaml may define `unavailable_selectors`
  // (array of CSS selectors that appear when a listing is closed/expired).
  // Checked BEFORE recipe steps so no worker is launched for dead listings.
  if (Array.isArray(portal.unavailable_selectors) && portal.unavailable_selectors.length) {
    try {
      for (const sel of portal.unavailable_selectors) {
        if (await selectorExists(page, sel, 800)) {
          const txt = await page.locator(sel).first().innerText({ timeout: 1000 }).catch(() => '');
          logError({ phase: 'job_unavailable', url, portal: portal.name, run_id: runId, selector: sel, banner_text: txt.trim() });
          out({
            ok: false,
            portal: portal.name,
            url,
            run_id: runId,
            job_unavailable: true,
            submitted: false,
            script_claim: 'Discarded',
            banner_text: txt.trim(),
          });
          await browser.close().catch(() => {});
          process.exit(0);
        }
      }
    } catch { /* best-effort — proceed to normal flow if check fails */ }
  }

  // Redirect detection: portals like theprotocol.it / xing sometimes redirect
  // to an external ATS (greenhouse, lever, recruitify, ...) where our recipe's
  // selectors don't apply. Emit a `redirect` block + bail BEFORE running the
  // recipe so the caller (worker / single-mode parent) can take over via the
  // chrome-devtools MCP handover (selectors differ per run on those ATS).
  const currentUrl = page.url();
  const stillMatches = (portal.match || []).some(m => currentUrl.includes(m));
  if (!stillMatches) {
    const redirectedPortal = matchPortal(currentUrl, config);
    const hint = frameworkHintFor(currentUrl);
    const redirectInfo = {
      detected: true,
      original_url: url,
      final_url: currentUrl,
      target_portal_match: redirectedPortal ? redirectedPortal.name : null,
      framework_hint: hint, // null OR { host_pattern, framework_detected, source }
    };
    logError({
      phase: 'redirect_to_external',
      url,
      portal: portal.name,
      run_id: runId,
      original_url: url,
      final_url: currentUrl,
      target_portal_match: redirectInfo.target_portal_match,
    });

    // Best-effort Simplify Copilot autofill on the redirected tab. Pre-fills
    // identity + (often) uploads CV before the agent takes over via MCP. On
    // unsupported frameworks (Workday/iCIMS/...) panel doesn't inject and
    // this no-ops in <1s.
    redirectInfo.simplify = await trySimplifyOnPage(page, runId, url, portal.name);

    let evidencePath = null;
    if (experimental && runDir) {
      try {
        const ev = await captureEvidence(page, portal);
        const slug = urlSlug(url);
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const evDir = resolve(runDir, 'evidence');
        mkdirSync(evDir, { recursive: true });
        evidencePath = resolve(evDir, `${slug}-redirect-${ts}.json`);
        writeFileSync(evidencePath, JSON.stringify({
          ts: new Date().toISOString(),
          run_id: runId,
          url,
          portal: portal.name,
          redirect: redirectInfo,
          dom: ev,
        }, null, 2));
      } catch { /* best-effort */ }
    }

    out({
      ok: false,
      portal: portal.name,
      url,
      run_id: runId,
      experimental,
      redirect: redirectInfo,
      submitted: false,
      force,
      autofix,
      script_claim: 'Unknown',
      evidence_path: evidencePath,
      error_log: ERROR_LOG,
    });
    await browser.close().catch(() => {});
    process.exit(2);
  }

  // External widget detection (pre-click, attribute-based). Some portals
  // expose external mode via an attribute on the apply trigger
  // (theprotocol: [data-isexternal='true']) without an outright URL redirect
  // OR a new tab (when the embedded ATS is e.g. an Adzuna iframe). Detect
  // BEFORE running steps so the worker handles the embedded ATS via MCP
  // rather than the script attempting an inline submit on a non-existent form.
  if (portal.external_widget_probe?.attribute_check) {
    const ac = portal.external_widget_probe.attribute_check;
    let attrVal = null;
    try {
      const loc = page.locator(ac.selector).first();
      if (await loc.count()) {
        attrVal = await loc.getAttribute(ac.attribute, { timeout: 1500 });
      }
    } catch { attrVal = null; }
    if (attrVal != null && String(attrVal) === String(ac.truthy_value)) {
      const widgetInfo = {
        detected: true,
        external_widget: true,
        kind: 'attribute',
        original_url: url,
        final_url: page.url(),
        target_portal_match: null,
        framework_hint: null,
        probe: { selector: ac.selector, attribute: ac.attribute, value: attrVal },
      };
      logError({
        phase: 'redirect_to_external',
        url, portal: portal.name, run_id: runId,
        external_widget: true, kind: 'attribute',
        probe: widgetInfo.probe,
      });
      widgetInfo.simplify = await trySimplifyOnPage(page, runId, url, portal.name);
      let evidencePath = null;
      if (experimental && runDir) {
        try {
          const ev = await captureEvidence(page, portal);
          const slug = urlSlug(url);
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const evDir = resolve(runDir, 'evidence');
          mkdirSync(evDir, { recursive: true });
          evidencePath = resolve(evDir, `${slug}-redirect-widget-${ts}.json`);
          writeFileSync(evidencePath, JSON.stringify({
            ts: new Date().toISOString(),
            run_id: runId, url, portal: portal.name,
            redirect: widgetInfo, dom: ev,
          }, null, 2));
        } catch { /* best-effort */ }
      }
      out({
        ok: false, portal: portal.name, url, run_id: runId, experimental,
        redirect: widgetInfo, submitted: false, force, autofix,
        script_claim: 'Unknown',
        evidence_path: evidencePath,
        error_log: ERROR_LOG,
      });
      await browser.close().catch(() => {});
      process.exit(2);
    }
  }

  // In --force mode: keep going on step failures (log + try next).
  // In normal mode: stop at first failure (caller can fix and retry).
  const stepResults = [];
  let firstFailure = null;
  let midFlowRedirect = null;

  // New-tab redirect detection. Some portals (Experis on nofluffjobs, etc.)
  // open the apply form in a NEW TAB rather than navigating in place.
  // page.url() on the original tab won't change → our post-step URL check
  // would never see the redirect. Hook every context's page-creation event
  // and remember the most recent off-portal new tab so we can bail with the
  // same redirect block as the in-place case.
  let newTabRedirect = null;
  // Track pending popups so we can await their URL settle at end-of-loop —
  // catches the case where the apply button is the LAST step (or only step)
  // and the popup hasn't finished navigating by the time the loop ends.
  const pendingPopups = [];
  const handleNewPage = (newPage) => {
    // Record immediately so end-of-loop wait knows there's something pending.
    const settle = Promise.resolve()
      .then(() => newPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {}))
      .then(() => {
        try {
          const u = newPage.url();
          if (!u || u === 'about:blank') return;
          // ANY new tab whose URL doesn't match this portal's `match` strings
          // is treated as an external apply form — works portal-agnostically.
          // External ATS often lives on a totally different domain
          // (jobriver.de, traffit, erecruiter.pl, etc.), and that's exactly
          // the signal we use here.
          const matchesOrig = (portal.match || []).some(m => u.includes(m));
          if (!matchesOrig && !newTabRedirect) {
            newTabRedirect = { final_url: u, page: newPage };
          }
        } catch { /* best-effort */ }
      });
    pendingPopups.push(settle);
  };
  for (const ctx of browser.contexts()) {
    ctx.on('page', handleNewPage);
  }
  // Also hook page.popup which fires synchronously when window.open is called
  // from the active tab — earlier signal than context 'page' for some sites.
  page.on('popup', handleNewPage);

  for (let i = 0; i < portal.steps.length; i++) {
    const step = portal.steps[i];
    let res;
    try {
      res = await runStep(page, step, portal);
    } catch (e) {
      res = { ok: false, err: e.message };
    }
    stepResults.push({ i, action: step.action, ...res });
    logStep(runDir, {
      run_id: runId,
      url,
      portal: portal.name,
      step_idx: i,
      action: step.action,
      selector: step.selector || step.container || null,
      ok: res.ok === true,
      skipped: res.skipped === true,
      err: res.err || null,
    });
    if (!res.ok) {
      // Optional steps coerce internal failures (selector missing, dropdown
      // wouldn't open, alias didn't match, etc.) into skipped. Per-listing
      // form variants can have fields that don't exist on most jobs — failing
      // the whole recipe over them would block applies that don't need them.
      if (step.optional) {
        const last = stepResults[stepResults.length - 1];
        if (last) { last.ok = true; last.skipped = true; last.optional_swallowed_err = res.err || null; }
        continue;
      }
      if (firstFailure === null) firstFailure = i;
      logError({ phase: 'step', url, portal: portal.name, force, step_index: i, action: step.action, err: res.err, run_id: runId });
      if (!force) break;
    }

    // Mid-flow redirect detection: a step (typically a click) may have
    // navigated us to an external ATS (theprotocol → traffit, etc).
    // If page.url() no longer matches any of the original portal's
    // `match` strings, bail out the same way startup-redirect detection
    // does — caller's External ATS handover takes over. Skip the rest of
    // the recipe; selectors won't apply on the new domain.
    // (a) Same-tab navigation away from portal domain.
    let postUrl;
    try { postUrl = page.url(); } catch { postUrl = null; }
    let detectedFinalUrl = null;
    let detectedKind = null; // 'same_tab' | 'new_tab'
    if (postUrl && !(portal.match || []).some(m => postUrl.includes(m))) {
      detectedFinalUrl = postUrl;
      detectedKind = 'same_tab';
    }
    // (b) New-tab navigation — captured by the context page-listener above.
    //     Wins over same_tab detection when both are present (newTab is the
    //     more-actionable target for the worker's MCP handover).
    if (newTabRedirect && newTabRedirect.final_url) {
      detectedFinalUrl = newTabRedirect.final_url;
      detectedKind = 'new_tab';
    }
    // (c) Embedded external-ATS iframe (no URL change, no new tab). Detected
    //     by scanning iframe[src] for known external-ATS host substrings
    //     declared in portal.external_widget_probe.iframe_match. theprotocol
    //     uses this for Adzuna; URL stays on theprotocol.it but submission
    //     happens inside an embedded iframe whose form selectors aren't in
    //     our recipe.
    let iframeMatch = null;
    if (!detectedFinalUrl && portal.external_widget_probe?.iframe_match?.length) {
      try {
        const iframeSrcs = await page.evaluate(() =>
          [...document.querySelectorAll('iframe')].map(f => f.src || '').filter(Boolean)
        );
        const needles = portal.external_widget_probe.iframe_match;
        for (const src of iframeSrcs) {
          const hit = needles.find(n => src.includes(n));
          if (hit) { iframeMatch = { src, needle: hit }; break; }
        }
      } catch { /* best-effort */ }
    }
    if (iframeMatch) {
      midFlowRedirect = {
        detected: true,
        mid_flow: true,
        external_widget: true,
        kind: 'iframe',
        new_tab: false,
        last_step_index: i,
        original_url: url,
        final_url: page.url(),
        iframe: iframeMatch,
        target_portal_match: null,
        framework_hint: null,
      };
      logError({
        phase: 'redirect_to_external',
        url, portal: portal.name, run_id: runId,
        external_widget: true, kind: 'iframe', mid_flow: true,
        last_step_index: i, iframe: iframeMatch,
      });
      break;
    }
    if (detectedFinalUrl) {
      const redirectedPortal = matchPortal(detectedFinalUrl, config);
      const hint = frameworkHintFor(detectedFinalUrl);
      midFlowRedirect = {
        detected: true,
        mid_flow: true,
        new_tab: detectedKind === 'new_tab',
        last_step_index: i,
        original_url: url,
        final_url: detectedFinalUrl,
        target_portal_match: redirectedPortal ? redirectedPortal.name : null,
        framework_hint: hint,
      };
      logError({
        phase: 'redirect_to_external',
        url, portal: portal.name, run_id: runId,
        mid_flow: true, new_tab: midFlowRedirect.new_tab, last_step_index: i,
        original_url: url, final_url: detectedFinalUrl,
        target_portal_match: midFlowRedirect.target_portal_match,
      });
      break;
    }
  }

  // After the step loop, give any pending popup-page settle promises a chance
  // to resolve. Apply button as the LAST step + slow ATS handoff = popup
  // hasn't navigated by loop exit; without this wait we'd miss the redirect.
  // Cap at 4s so we don't stall when there are no popups.
  if (!midFlowRedirect && pendingPopups.length > 0 && !newTabRedirect?.final_url) {
    try {
      await Promise.race([
        Promise.all(pendingPopups),
        page.waitForTimeout(4000),
      ]);
    } catch { /* best-effort */ }
    if (newTabRedirect && newTabRedirect.final_url) {
      const hint = frameworkHintFor(newTabRedirect.final_url);
      const redirectedPortal = matchPortal(newTabRedirect.final_url, config);
      midFlowRedirect = {
        detected: true,
        mid_flow: true,
        new_tab: true,
        last_step_index: portal.steps.length - 1,
        original_url: url,
        final_url: newTabRedirect.final_url,
        target_portal_match: redirectedPortal ? redirectedPortal.name : null,
        framework_hint: hint,
        post_loop_detection: true,
      };
      logError({
        phase: 'redirect_to_external',
        url, portal: portal.name, run_id: runId,
        mid_flow: true, new_tab: true, post_loop: true,
        original_url: url, final_url: newTabRedirect.final_url,
        target_portal_match: midFlowRedirect.target_portal_match,
      });
    }
  }

  // Mid-flow redirect: emit the redirect block and exit BEFORE verify/submit
  // (those would chase selectors on the wrong domain). Same JSON shape as
  // startup-redirect — caller already handles it.
  if (midFlowRedirect) {
    // Pick the right page for Simplify: same_tab → main page, new_tab → the
    // popup page captured by the page-listener.
    const simplifyPage = midFlowRedirect.new_tab && newTabRedirect && newTabRedirect.page
      ? newTabRedirect.page
      : page;
    midFlowRedirect.simplify = await trySimplifyOnPage(simplifyPage, runId, url, portal.name);

    let evidencePath = null;
    if (experimental && runDir) {
      try {
        const ev = await captureEvidence(page, portal);
        const slug = urlSlug(url);
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const evDir = resolve(runDir, 'evidence');
        mkdirSync(evDir, { recursive: true });
        evidencePath = resolve(evDir, `${slug}-redirect-midflow-${ts}.json`);
        writeFileSync(evidencePath, JSON.stringify({
          ts: new Date().toISOString(),
          run_id: runId,
          url,
          portal: portal.name,
          redirect: midFlowRedirect,
          steps_attempted: stepResults,
          dom: ev,
        }, null, 2));
      } catch { /* best-effort */ }
    }
    out({
      ok: false,
      portal: portal.name,
      url,
      run_id: runId,
      experimental,
      redirect: midFlowRedirect,
      steps: stepResults,
      submitted: false,
      force,
      autofix,
      script_claim: 'Unknown',
      evidence_path: evidencePath,
      error_log: ERROR_LOG,
    });
    await browser.close().catch(() => {});
    process.exit(2);
  }

  const verification = await verify(page, portal).catch(e => ({ verify_error: e.message }));

  // Verification mismatches go to the error log too — useful for later scans.
  for (const [k, v] of Object.entries(verification)) {
    if (v && v.ok === false) {
      logError({ phase: 'verify', url, portal: portal.name, force, check: k, expected: v.expected, actual: v.actual });
    }
  }

  const allStepsOk = firstFailure === null;
  const result = {
    ok: allStepsOk,
    portal: portal.name,
    url,
    run_id: runId,
    experimental,
    submit_selector: portal.submit_selector,
    steps: stepResults,
    verification,
    submitted: false,
    force,
    autofix,
    error_log: ERROR_LOG,
  };

  // Submit policy:
  //   --submit → only if all steps OK (safety: don't submit a half-filled form unless --force)
  //   --force  → always attempt submit, even after step failures (contract: must complete)
  const shouldSubmit = (autoSubmit && allStepsOk) || force;
  if (shouldSubmit) {
    const urlBefore = page.url();
    try {
      await page.locator(portal.submit_selector).first().click({ timeout: 5000 });
      result.submitted = true;
    } catch (e) {
      result.submit_error = e.message;
      logError({ phase: 'submit', url, portal: portal.name, force, err: e.message });
    }

    // STRICT confirmation: wait for an explicit success_selector defined per
    // portal in yaml. No selector reached in time = real failure (not just a
    // weak "unconfirmed" hint). Caller / agent must escalate.
    //
    // success_selector can be:
    //   - string (single CSS selector)
    //   - array of strings (any one becoming visible counts as success)
    //
    // If success_selector is absent in yaml, we DO NOT guess — we mark the
    // submit as unconfirmed so the worker knows it must verify via MCP.
    if (result.submitted) {
      const successSel = portal.success_selector;
      const candidates = Array.isArray(successSel) ? successSel : (successSel ? [successSel] : []);
      const timeout = portal.success_timeout_ms || 10000;

      if (candidates.length === 0) {
        result.submitted_unconfirmed = true;
        result.submit_confirmation = { kind: 'no_success_selector_configured' };
        logError({
          phase: 'submit_unconfirmed',
          url,
          portal: portal.name,
          force,
          note: 'no success_selector configured for this portal — cannot confirm acceptance. Add `success_selector` to config/gmail-apply-portals.yml.',
        });
      } else {
        // Race the candidates — first one visible wins. Use Promise.any so any
        // single selector becoming visible resolves before the timeout.
        const waits = candidates.map(sel =>
          page.locator(sel).first().waitFor({ state: 'visible', timeout }).then(() => sel)
        );
        let matched = null;
        try {
          matched = await Promise.any(waits);
        } catch { /* AggregateError → none matched */ }

        if (matched) {
          result.submit_confirmation = { kind: 'success_selector_matched', selector: matched };
        } else {
          // Real failure. Submit click happened but confirmation never appeared.
          result.submitted_unconfirmed = true;
          result.submit_confirmation = { kind: 'success_selector_timeout', candidates, timeout_ms: timeout };
          logError({
            phase: 'submit_unconfirmed',
            url,
            portal: portal.name,
            force,
            note: `submit click landed but no success_selector matched within ${timeout}ms — application likely NOT accepted. Agent must verify via MCP and escalate.`,
            candidates,
          });
        }
      }
    }
  }

  // In force mode, even a "failed" run that ended up submitting should report ok=true
  // for the caller's decision tree. The detailed errors are in the log.
  // Caveat: if submit was unconfirmed (no confirmation indicator), keep ok=false
  // so the caller can choose to escalate via MCP or treat as AutoApplyFailed.
  if (force && result.submitted && !result.submitted_unconfirmed) result.ok = true;

  // V3 — emit explicit script_claim ∈ {Applied, Failed, Unknown}. Orchestrator
  // compares this against the worker's claim. Script's `ok`/`submitted` booleans
  // remain for forensics but are NOT decision authority.
  //   Applied  : submitted + success_selector_matched + not unconfirmed.
  //   Failed   : everything else (validation, missing selector, unsubmitted).
  //   Unknown  : redirect detected (handled in earlier exit branches above).
  if (result.submitted && result.submit_confirmation?.kind === 'success_selector_matched' && !result.submitted_unconfirmed) {
    result.script_claim = 'Applied';
  } else {
    result.script_claim = 'Failed';
  }

  // --experimental: capture compact DOM evidence at the FINAL state (post-submit
  // or post-failure). Saved to disk; only the path is in the JSON output to
  // keep orchestrator context lean. Orchestrator reads the file ONLY when
  // adjudicating ambiguous results or running --autofix.
  if (experimental && runDir) {
    try {
      const ev = await captureEvidence(page, portal);
      const slug = urlSlug(url);
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const evDir = resolve(runDir, 'evidence');
      mkdirSync(evDir, { recursive: true });
      const evPath = resolve(evDir, `${slug}-${ts}.json`);
      writeFileSync(evPath, JSON.stringify({
        ts: new Date().toISOString(),
        run_id: runId,
        url,
        portal: portal.name,
        submitted: result.submitted,
        submitted_unconfirmed: result.submitted_unconfirmed === true,
        submit_confirmation: result.submit_confirmation || null,
        first_failure_step: firstFailure,
        dom: ev,
      }, null, 2));
      result.evidence_path = evPath;
    } catch (e) {
      result.evidence_capture_error = e.message;
    }
  }

  out(result);
  // Do NOT call browser.close() — that kills the user's Chrome. Just disconnect.
  await browser.close().catch(() => {}); // close = disconnect for CDP, browser stays.
  process.exit(result.ok ? 0 : 2);
}

main().catch(e => fail(e.message));
