#!/usr/bin/env node
import 'dotenv/config';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { chromium } from 'playwright';
import {
  activeBrowser,
  activeProfile,
  applicationSubmissionPolicy,
  captchaWaitMilliseconds,
  loadProfile,
  resolveProfileTemplate,
  resumeForLanguage,
} from './profile-config.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const CONFIG_PATH = resolve(ROOT, 'config/gmail-apply-portals.yml');
const ERROR_LOG = resolve(ROOT, 'data/gmail-apply-errors.ndjson');
const CAPTCHA_MARKERS = [
  "iframe[src*='recaptcha']",
  "iframe[src*='hcaptcha']",
  "iframe[src*='challenges.cloudflare.com']",
  '.g-recaptcha',
  '.h-captcha',
  '.cf-turnstile',
];
const CAPTCHA_RESPONSES = [
  "textarea[name='g-recaptcha-response']",
  "textarea[name='h-captcha-response']",
  "input[name='cf-turnstile-response']",
];

function output(value) {
  console.log(JSON.stringify(value, null, 2));
}

function fail(message, extra = {}, code = 1) {
  output({ ...extra, ok: false, error: message });
  process.exit(code);
}

function logError(entry) {
  try {
    mkdirSync(dirname(ERROR_LOG), { recursive: true });
    appendFileSync(ERROR_LOG, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n');
  } catch {
    // Diagnostic logging is best-effort.
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    url: args.find(arg => /^https?:\/\//i.test(arg)),
    submit: args.includes('--submit'),
    reviewed: args.includes('--reviewed'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

function matchPortal(url, config) {
  return (config.portals || []).find(portal => (portal.match || []).some(match => url.includes(match))) || null;
}

async function firstLocator(page, step, timeout = 8000) {
  const selectors = step.selectors?.length ? step.selectors : [step.selector];
  let lastError;
  for (const selector of selectors.filter(Boolean)) {
    const locator = page.locator(selector).first();
    try {
      await locator.waitFor({ state: 'attached', timeout: selectors.length > 1 ? Math.min(timeout, 2500) : timeout });
      return { locator, selector };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No selector configured for step.');
}

async function hasAnySelector(page, step, timeout = 500) {
  const selectors = step.selectors?.length ? step.selectors : [step.selector || step.container];
  for (const selector of selectors.filter(Boolean)) {
    try {
      await page.locator(selector).first().waitFor({ state: 'attached', timeout });
      return true;
    } catch {
      // Try the next selector.
    }
  }
  return false;
}

async function visibleCaptcha(page) {
  for (const selector of CAPTCHA_MARKERS) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) return true;
  }
  return false;
}

async function captchaHasResponse(page) {
  for (const selector of CAPTCHA_RESPONSES) {
    const value = await page.locator(selector).first().inputValue().catch(() => '');
    if (value.trim()) return true;
  }
  for (const frame of page.frames()) {
    const checked = await frame.locator('#recaptcha-anchor').first().getAttribute('aria-checked').catch(() => null);
    if (checked === 'true') return true;
  }
  return false;
}

async function waitForCaptchaExtension(page, timeoutMs) {
  if (!await visibleCaptcha(page)) return { detected: false, solved: true, waited_ms: 0 };
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await captchaHasResponse(page) || !await visibleCaptcha(page)) {
      return { detected: true, solved: true, waited_ms: Date.now() - started };
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`CAPTCHA extension did not finish within ${Math.round(timeoutMs / 1000)} seconds.`);
}

async function getOrOpenPage(browser, url) {
  const contexts = browser.contexts();
  const context = contexts[0] || await browser.newContext();
  for (const page of context.pages()) {
    const current = page.url();
    if (current === url || current.startsWith(url.split('?')[0])) return { context, page };
  }
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return { context, page };
}

async function executeStep(context, page, step, profile, portalData, resume) {
  const timeout = Number(step.timeout_ms) > 0 ? Number(step.timeout_ms) : 8000;
  if (step.optional && !await hasAnySelector(page, step, Math.min(timeout, 1500))) {
    return { page, result: { ok: true, skipped: true, action: step.action } };
  }

  if (step.action === 'wait_ms') {
    await page.waitForTimeout(Number(step.ms) || 0);
    return { page, result: { ok: true, action: step.action } };
  }
  if (step.action === 'wait_selector') {
    await page.locator(step.selector).first().waitFor({ state: 'visible', timeout });
    return { page, result: { ok: true, action: step.action, selector: step.selector } };
  }
  if (step.action === 'click') {
    const { locator, selector } = await firstLocator(page, step, timeout);
    const popupPromise = context.waitForEvent('page', { timeout: 2500 }).catch(() => null);
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.click({ timeout });
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      return { page: popup, external: true, result: { ok: true, action: step.action, selector, popup: popup.url() } };
    }
    await page.waitForTimeout(300);
    return { page, result: { ok: true, action: step.action, selector } };
  }
  if (step.action === 'fill') {
    const value = resolveProfileTemplate(step.value, profile, portalData);
    const { locator, selector } = await firstLocator(page, step, timeout);
    await locator.fill(value);
    return { page, result: { ok: true, action: step.action, selector, expected: value } };
  }
  if (step.action === 'select') {
    const value = resolveProfileTemplate(step.value, profile, portalData);
    const { locator, selector } = await firstLocator(page, step, timeout);
    await locator.selectOption({ value }).catch(() => locator.selectOption({ label: value }));
    return { page, result: { ok: true, action: step.action, selector, expected: value } };
  }
  if (step.action === 'check') {
    const { locator, selector } = await firstLocator(page, step, timeout);
    await locator.check({ timeout });
    return { page, result: { ok: true, action: step.action, selector } };
  }
  if (step.action === 'upload_resume') {
    const { locator, selector } = await firstLocator(page, step, timeout);
    await locator.setInputFiles(resume.path);
    return { page, result: { ok: true, action: step.action, selector, resume: resume.configured } };
  }
  throw new Error(`Unsupported portal action: ${step.action}`);
}

async function verify(page, stepResults) {
  const checks = [];
  for (const step of stepResults) {
    if (!step.ok || step.skipped || !step.selector || step.expected === undefined) continue;
    const locator = page.locator(step.selector).first();
    const actual = await locator.inputValue().catch(() => null);
    checks.push({ selector: step.selector, expected: step.expected, actual, ok: actual === step.expected });
  }
  return checks;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node scripts/gmail-apply.mjs <URL> [--submit --reviewed]');
    return;
  }
  if (!args.url) fail('A job URL is required.');
  if (process.argv.includes('--force')) fail('--force is not supported; application steps must validate before submission.');
  if (!existsSync(CONFIG_PATH)) fail('config/gmail-apply-portals.yml is missing.');

  const profile = loadProfile(ROOT);
  const profileId = activeProfile(ROOT);
  const { autoSubmit, shouldSubmit } = applicationSubmissionPolicy(profile, args);
  const captchaTimeoutMs = captchaWaitMilliseconds(profile);
  const browserState = activeBrowser(ROOT);
  if (profileId && browserState?.profile_id && profileId !== browserState.profile_id) {
    fail(`Active data profile ${profileId} does not match browser profile ${browserState.profile_id}.`, {
      hint: `Run launch-chrome.bat ${profileId} before applying.`,
    });
  }
  const cdpEndpoint = process.env.CHROME_CDP
    || `http://localhost:${process.env.CAREER_OPS_CHROME_PORT || browserState?.port || 9222}`;
  const resume = resumeForLanguage(profile, profile.language?.output, ROOT);
  if (!resume) {
    fail('No resume is configured under application.resumes in config/profile.yml.');
  }
  if (!resume.exists) {
    fail(`Configured resume does not exist: ${resume.configured}`);
  }
  const config = yaml.load(readFileSync(CONFIG_PATH, 'utf8')) || {};
  const portal = matchPortal(args.url, config);
  let browser;
  try {
    browser = await chromium.connectOverCDP(cdpEndpoint);
  } catch (error) {
    fail(`Cannot connect to Chrome at ${cdpEndpoint}: ${error.message}`, {
      active_profile: browserState?.profile_id || null,
      hint: 'Run launch-chrome.bat <profile-id> first.',
    });
  }
  const opened = await getOrOpenPage(browser, args.url);
  let page = opened.page;
  await page.bringToFront().catch(() => {});

  if (!portal) {
    output({
      ok: false,
      profile_id: profileId,
      prepared: false,
      takeover_required: true,
      reason: 'no portal recipe',
      url: page.url(),
      auto_submit: autoSubmit,
      submit_when_complete: shouldSubmit,
      captcha_wait_seconds: captchaTimeoutMs / 1000,
      resume: { path: resume.path, language: resume.language },
    });
    process.exit(2);
  }

  for (const selector of portal.unavailable_selectors || []) {
    if (await hasAnySelector(page, { selector }, 500)) {
      output({ ok: false, profile_id: profileId, job_unavailable: true, portal: portal.name, url: page.url() });
      return;
    }
  }

  const results = [];
  let failure = null;
  let takeover = null;
  for (let index = 0; index < (portal.steps || []).length; index++) {
    const step = portal.steps[index];
    try {
      const execution = await executeStep(opened.context, page, step, profile, portal.data || {}, resume);
      page = execution.page;
      results.push({ index, ...execution.result });
      const captcha = await waitForCaptchaExtension(page, captchaTimeoutMs);
      if (captcha.detected) results.push({ index, action: 'wait_captcha_extension', ok: true, ...captcha });
      const stillOnPortal = (portal.match || []).some(match => page.url().includes(match));
      if (execution.external || !stillOnPortal) {
        takeover = { reason: 'external ATS or portal redirect', url: page.url() };
        break;
      }
    } catch (error) {
      const result = { index, action: step.action, ok: false, error: error.message };
      results.push(result);
      logError({ portal: portal.name, url: args.url, ...result });
      if (!step.optional) {
        failure = result;
        break;
      }
    }
  }

  if (takeover) {
    output({
      ok: false,
      profile_id: profileId,
      portal: portal.name,
      original_url: args.url,
      prepared: false,
      takeover_required: true,
      takeover,
      auto_submit: autoSubmit,
      submit_when_complete: shouldSubmit,
      captcha_wait_seconds: captchaTimeoutMs / 1000,
      resume: { path: resume.path, language: resume.language },
      steps: results,
    });
    process.exit(2);
  }

  if (failure) {
    output({
      ok: false,
      profile_id: profileId,
      portal: portal.name,
      prepared: false,
      takeover_required: true,
      takeover: { reason: 'stable recipe could not finish the form', url: page.url() },
      auto_submit: autoSubmit,
      submit_when_complete: shouldSubmit,
      captcha_wait_seconds: captchaTimeoutMs / 1000,
      resume: { path: resume.path, language: resume.language },
      steps: results,
    });
    process.exit(2);
  }

  const checks = await verify(page, results);
  const valid = !failure && checks.every(check => check.ok);
  const result = {
    ok: valid,
    profile_id: profileId,
    portal: portal.name,
    url: page.url(),
    prepared: valid,
    auto_submit: autoSubmit,
    submit_when_complete: shouldSubmit,
    requires_review: !shouldSubmit,
    captcha_wait_seconds: captchaTimeoutMs / 1000,
    submitted: false,
    resume: { path: resume.path, language: resume.language },
    steps: results,
    verification: checks,
  };

  if (shouldSubmit) {
    const successSelectors = Array.isArray(portal.success_selector)
      ? portal.success_selector
      : (portal.success_selector ? [portal.success_selector] : []);
    if (!valid) fail('Form validation failed; refusing to submit.', result);
    if (!portal.submit_selector || !successSelectors.length) {
      output({
        ...result,
        ok: false,
        takeover_required: true,
        takeover: {
          reason: 'portal requires browser submission and strict confirmation',
          url: page.url(),
        },
      });
      process.exit(2);
    }
    try {
      const beforeSubmitCaptcha = await waitForCaptchaExtension(page, captchaTimeoutMs);
      if (beforeSubmitCaptcha.detected) {
        result.steps.push({ action: 'wait_captcha_extension', ok: true, ...beforeSubmitCaptcha });
      }
      await page.locator(portal.submit_selector).first().click({ timeout: 8000 });
      const afterSubmitCaptcha = await waitForCaptchaExtension(page, captchaTimeoutMs);
      if (afterSubmitCaptcha.detected) {
        result.steps.push({ action: 'wait_captcha_extension', ok: true, ...afterSubmitCaptcha });
      }
      const timeout = Number(portal.success_timeout_ms) || 10000;
      let matched = null;
      for (const selector of successSelectors) {
        try {
          await page.locator(selector).first().waitFor({ state: 'visible', timeout });
          matched = selector;
          break;
        } catch {
          // Try the next strict success selector.
        }
      }
      result.submitted = true;
      result.submitted_confirmed = Boolean(matched);
      result.success_selector = matched;
      result.ok = Boolean(matched);
      if (!matched) {
        result.takeover_required = true;
        result.takeover = { reason: 'submission is not yet strictly confirmed', url: page.url() };
        logError({ portal: portal.name, url: args.url, phase: 'submit-unconfirmed' });
      }
    } catch (error) {
      result.ok = false;
      result.takeover_required = true;
      result.takeover = { reason: 'scripted submission needs browser continuation', url: page.url() };
      result.submit_error = error.message;
      logError({ portal: portal.name, url: args.url, phase: 'submit', error: error.message });
    }
  }
  output(result);
  if (!result.ok) process.exitCode = 1;
}

main().catch(error => fail(error.message));
