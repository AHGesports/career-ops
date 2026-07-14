import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

export function loadProfile(repoRoot = process.cwd()) {
  const path = resolve(repoRoot, 'config/profile.yml');
  if (!existsSync(path)) {
    throw new Error('config/profile.yml is missing. Complete career-ops onboarding first.');
  }
  const profile = yaml.load(readFileSync(path, 'utf8')) || {};
  if (!profile.candidate || !profile.target_roles) {
    throw new Error('config/profile.yml must define candidate and target_roles.');
  }
  return profile;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rolePattern(value) {
  const words = String(value || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}+#.]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return null;
  return `\\b${words.map(escapeRegex).join('\\s+')}\\b`;
}

export function classifierSources(profile) {
  const configured = profile.gmail_classifier || {};
  let matches = Array.isArray(configured.match_keywords)
    ? configured.match_keywords.filter(Boolean).map(String)
    : [];
  const excludes = Array.isArray(configured.match_excludes)
    ? configured.match_excludes.filter(Boolean).map(String)
    : [];

  if (!matches.length) {
    const roles = [
      ...(profile.target_roles?.primary || []),
      ...(profile.target_roles?.archetypes || []).map(item => item?.name),
    ];
    matches = [...new Set(roles.map(rolePattern).filter(Boolean))];
  }

  for (const [kind, patterns] of [['match', matches], ['exclude', excludes]]) {
    for (const pattern of patterns) {
      try {
        new RegExp(pattern, 'iu');
      } catch (error) {
        throw new Error(`Invalid gmail_classifier ${kind} regex ${JSON.stringify(pattern)}: ${error.message}`);
      }
    }
  }
  return { matches, excludes };
}

export function classifyText(profile, text) {
  const { matches, excludes } = classifierSources(profile);
  const normalized = String(text || '').replace(/[-_/?=&]+/g, ' ').replace(/\s+/g, ' ').trim();
  const excluded = excludes.filter(pattern => new RegExp(pattern, 'iu').test(normalized));
  const matched = matches.filter(pattern => new RegExp(pattern, 'iu').test(normalized));
  return {
    tag: excluded.length ? 'deferred' : (matched.length ? 'match' : 'deferred'),
    matched,
    excluded,
  };
}

function getPath(object, dottedKey) {
  return dottedKey.split('.').reduce((value, key) => value?.[key], object);
}

export function resolveProfileTemplate(value, profile, portalData = {}) {
  if (typeof value !== 'string') return value;
  const context = { ...profile, portal: portalData };
  return value.replace(/\{\{([\w.-]+)\}\}/g, (_, key) => {
    const resolved = getPath(context, key);
    if (resolved === undefined || resolved === null || resolved === '') {
      throw new Error(`Unresolved profile template key: ${key}`);
    }
    return String(resolved);
  });
}

export function minimumApplicationScore(profile) {
  const configured = Number(profile.application?.minimum_score);
  return Number.isFinite(configured) ? configured : 4;
}

export function autoSubmitEnabled(profile) {
  return profile.application?.auto_submit === true;
}

export function applicationSubmissionPolicy(profile, { submit = false, reviewed = false } = {}) {
  const autoSubmit = autoSubmitEnabled(profile);
  if (submit && !autoSubmit && !reviewed) {
    throw new Error('--submit requires --reviewed when application.auto_submit is off.');
  }
  return { autoSubmit, shouldSubmit: autoSubmit || submit };
}

export function captchaWaitMilliseconds(profile) {
  const configured = Number(profile.application?.captcha_wait_seconds);
  const seconds = Number.isFinite(configured) && configured > 0 ? configured : 300;
  return Math.min(Math.max(seconds, 30), 900) * 1000;
}

export function resumeForLanguage(profile, language, repoRoot = process.cwd()) {
  const resumes = profile.application?.resumes || {};
  const code = String(language || profile.language?.output || 'en').toLowerCase().split(/[-_]/)[0];
  const configured = resumes.by_language?.[code] || resumes.default || '';
  if (!configured) return null;
  const path = resolve(repoRoot, configured);
  return { configured, path, exists: existsSync(path), language: code };
}
