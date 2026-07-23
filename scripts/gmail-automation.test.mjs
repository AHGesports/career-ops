import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import {
  appendPending,
  canonicalizeUrl,
  extractSenderUrls,
  parseWindow,
  trackerDestination,
} from './gmail-scan.mjs';
import {
  applicationSubmissionPolicy,
  autoSubmitEnabled,
  captchaWaitMilliseconds,
  classifierSources,
  classifyText,
  requireActiveProfile,
  resolveProfileTemplate,
  resumeForLanguage,
} from './profile-config.mjs';
import { ADDITIONAL_SKILL_GROUPS, materializeSkillEntrypoints } from '../scaffolder/bin/skill-entrypoints.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('parseWindow accepts field-friendly aliases and units', () => {
  assert.equal(parseWindow('weekend').milliseconds, 3 * 86400e3);
  assert.equal(parseWindow('6h').milliseconds, 6 * 3600e3);
  assert.throws(() => parseWindow('soon'), /Invalid window/);
});

test('classifier derives phrases from a biotech profile without software defaults', () => {
  const profile = {
    target_roles: {
      primary: ['Research Scientist'],
      archetypes: [{ name: 'Bioprocess Engineer (Upstream)' }],
    },
  };
  const sources = classifierSources(profile);
  assert.ok(sources.matches.some(pattern => pattern.includes('Research')));
  assert.equal(classifyText(profile, '/jobs/senior-research-scientist-cell-therapy').tag, 'match');
  assert.equal(classifyText(profile, '/jobs/frontend-software-engineer').tag, 'deferred');
});

test('configured excludes win over profile matches', () => {
  const profile = {
    target_roles: { primary: ['Clinical Data Manager'], archetypes: [] },
    gmail_classifier: {
      match_keywords: ['\\bclinical\\s+data\\s+manager\\b'],
      match_excludes: ['\\bintern\\b'],
    },
  };
  const result = classifyText(profile, 'clinical data manager intern');
  assert.equal(result.tag, 'deferred');
  assert.equal(result.excluded.length, 1);
});

test('profile templates resolve nested user-owned values', () => {
  const profile = { candidate: { phone: '+1-555-0100' } };
  assert.equal(resolveProfileTemplate('Call {{candidate.phone}}', profile), 'Call +1-555-0100');
  assert.throws(() => resolveProfileTemplate('{{candidate.missing}}', profile), /Unresolved/);
});

test('Gmail operations reject a profile while its workspace is switching', () => {
  const root = mkdtempSync(join(tmpdir(), 'career-ops-profile-state-'));
  try {
    mkdirSync(join(root, '.career-ops'), { recursive: true });
    writeFileSync(join(root, '.career-ops', 'active-profile'), 'arshia-hemati\n');
    writeFileSync(join(root, '.career-ops', 'profile-state.json'), JSON.stringify({
      status: 'switching',
      profile_id: 'hannah-aghaei',
      generation: 2,
    }));
    assert.throws(() => requireActiveProfile(root), /is switching/);
    writeFileSync(join(root, '.career-ops', 'active-profile'), 'hannah-aghaei\n');
    writeFileSync(join(root, '.career-ops', 'profile-state.json'), JSON.stringify({
      status: 'ready',
      profile_id: 'hannah-aghaei',
      generation: 2,
    }));
    assert.equal(requireActiveProfile(root), 'hannah-aghaei');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('resume selection uses the user language mapping and verifies the file', () => {
  const root = mkdtempSync(join(tmpdir(), 'career-ops-resume-'));
  try {
    mkdirSync(join(root, 'output'), { recursive: true });
    writeFileSync(join(root, 'output', 'resume-de.pdf'), 'fixture');
    const profile = {
      language: { output: 'de-DE' },
      application: {
        resumes: {
          default: 'output/resume.pdf',
          by_language: { de: 'output/resume-de.pdf' },
        },
      },
    };
    const resume = resumeForLanguage(profile, undefined, root);
    assert.equal(resume.configured, 'output/resume-de.pdf');
    assert.equal(resume.exists, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('application policy separates form completion from final submission', () => {
  assert.equal(autoSubmitEnabled({}), false);
  assert.equal(autoSubmitEnabled({ application: { auto_submit: false } }), false);
  assert.equal(autoSubmitEnabled({ application: { auto_submit: true } }), true);
  assert.deepEqual(applicationSubmissionPolicy({ application: { auto_submit: false } }), {
    autoSubmit: false,
    shouldSubmit: false,
  });
  assert.deepEqual(applicationSubmissionPolicy({ application: { auto_submit: true } }), {
    autoSubmit: true,
    shouldSubmit: true,
  });
  assert.throws(
    () => applicationSubmissionPolicy({ application: { auto_submit: false } }, { submit: true }),
    /requires --reviewed/,
  );
  assert.equal(
    applicationSubmissionPolicy(
      { application: { auto_submit: false } },
      { submit: true, reviewed: true },
    ).shouldSubmit,
    true,
  );
  assert.equal(captchaWaitMilliseconds({}), 300_000);
  assert.equal(captchaWaitMilliseconds({ application: { captcha_wait_seconds: 10 } }), 30_000);
  assert.equal(captchaWaitMilliseconds({ application: { captcha_wait_seconds: 1200 } }), 900_000);
});

test('sender extraction supports direct, base64, and zlib formats', () => {
  const direct = extractSenderUrls(
    { extraction: 'direct', pattern: 'https?://jobs\\.example/jobs/[a-z-]+' },
    { html: '<a href="https://jobs.example/jobs/research-scientist?utm_source=mail">x</a>', plain: '' },
    ['utm_*'],
  );
  assert.deepEqual(direct.urls, ['https://jobs.example/jobs/research-scientist']);

  const target = 'https://jobs.example/jobs/clinical-data-manager';
  const encoded = Buffer.from(target).toString('base64url');
  const base64 = extractSenderUrls(
    { extraction: 'base64', pattern: 'https?://tracker\\.example/click/([A-Za-z0-9_-]+)' },
    { html: `https://tracker.example/click/${encoded}`, plain: '' },
  );
  assert.deepEqual(base64.urls, [target]);

  const compressed = deflateSync(Buffer.from(`l=${encodeURIComponent(target)}`)).toString('base64url');
  const zlib = extractSenderUrls(
    { extraction: 'zlib', pattern: 'https?://tracker\\.example/c/([A-Za-z0-9_-]+)', target_param: 'l' },
    { html: `https://tracker.example/c/${compressed}`, plain: '' },
  );
  assert.deepEqual(zlib.urls, [target]);
});

test('tracker extraction can exclude navigation and empty anchors by visible text', () => {
  const extracted = extractSenderUrls(
    {
      extraction: 'tracker',
      pattern: 'https?://click\\.example/[^"\\s]+',
      anchor_text_exclude: '^(?:\\s*$|Manage settings\\b|Show more jobs\\b)',
    },
    {
      html: [
        '<a href="https://click.example/job-1">Laboratory Technician</a>',
        '<a href="https://click.example/image"><img src="logo.png"></a>',
        '<a href="https://click.example/settings">Manage settings</a>',
        '<a href="https://click.example/list">Show more jobs</a>',
      ].join(''),
      plain: '',
    },
  );
  assert.deepEqual(extracted.trackers, ['https://click.example/job-1']);
});

test('canonicalization preserves job identity while removing tracking', () => {
  assert.equal(
    canonicalizeUrl('http://www.linkedin.com/comm/jobs/view/123?utm_source=mail', ['utm_*']),
    'https://www.linkedin.com/jobs/view/123',
  );
});

test('Stepstone tracker destinations normalize German and Austrian job routes', () => {
  assert.equal(
    trackerDestination('https://www.stepstone.at/job/123456/application/redirection?source=email'),
    'https://www.stepstone.at/job/123456',
  );
  assert.equal(
    trackerDestination('https://www.stepstone.at/v2/magiclink/exchange?returnUrl=%2Fjob%2F654321%2Fapplication%2Fredirection%3Fsource%3Demail'),
    'https://www.stepstone.at/job/654321',
  );
});

test('pending writer uses the latest Career-Ops pipeline sections', () => {
  const dir = mkdtempSync(join(tmpdir(), 'career-ops-gmail-'));
  const path = join(dir, 'pipeline.md');
  try {
    appendPending(path, ['- [ ] https://jobs.example/1 | LabCo | Scientist']);
    const text = readFileSync(path, 'utf8');
    assert.match(text, /## Pending[\s\S]*LabCo[\s\S]*## Processed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('scaffolder knows both portable skills', () => {
  assert.deepEqual(
    ADDITIONAL_SKILL_GROUPS.map(group => group.canonicalPath),
    [
      '.agents/skills/scan-gmail/SKILL.md',
      '.agents/skills/gmail-apply-smilified/SKILL.md',
    ],
  );
  assert.ok(ADDITIONAL_SKILL_GROUPS.every(group => group.entrypoints.length === 5));
});

test('scaffolder materializes portable skill pointers on Windows-style checkouts', () => {
  const root = mkdtempSync(join(tmpdir(), 'career-ops-skills-'));
  try {
    const canonical = join(root, '.agents', 'skills', 'scan-gmail', 'SKILL.md');
    const pointer = join(root, '.claude', 'skills', 'scan-gmail', 'SKILL.md');
    mkdirSync(dirname(canonical), { recursive: true });
    mkdirSync(dirname(pointer), { recursive: true });
    writeFileSync(canonical, 'portable scan skill\n');
    writeFileSync(pointer, '../../../.agents/skills/scan-gmail/SKILL.md\n');
    const changed = materializeSkillEntrypoints(root);
    assert.deepEqual(changed, ['.claude/skills/scan-gmail/SKILL.md']);
    assert.equal(readFileSync(pointer, 'utf8'), 'portable scan skill\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('named profiles isolate and restore complete user workspaces', () => {
  const base = mkdtempSync(join(tmpdir(), 'career-ops-profiles-'));
  const root = join(base, 'repo');
  const source = join(base, 'source');
  const script = join(REPO_ROOT, 'scripts', 'profile.mjs');
  const run = args => {
    const result = spawnSync(process.execPath, [script, ...args, '--cwd', root], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  try {
    mkdirSync(join(source, 'config'), { recursive: true });
    mkdirSync(join(source, 'data'), { recursive: true });
    mkdirSync(join(source, 'assets', 'cv'), { recursive: true });
    writeFileSync(join(source, 'cv.md'), 'Arshia CV');
    writeFileSync(join(source, '.env'), 'GMAIL_REFRESH_TOKEN=private');
    writeFileSync(join(source, 'config', 'profile.yml'), 'candidate: { full_name: Arshia }');
    writeFileSync(join(source, 'data', 'applications.md'), '# applications');
    writeFileSync(join(source, 'assets', 'cv', 'resume.pdf'), 'pdf');

    const imported = run(['import', 'arshia-hemati', '--name', 'Arshia Hemati', '--from', source, '--browser-port', '9222']);
    assert.equal(imported.imported.files, 5);
    run(['create', 'hannah-aghaei', '--name', 'Hannah Aghaei', '--browser-port', '9223']);
    run(['activate', 'arshia-hemati']);
    assert.equal(readFileSync(join(root, 'cv.md'), 'utf8'), 'Arshia CV');
    assert.equal(readFileSync(join(root, '.env'), 'utf8'), 'GMAIL_REFRESH_TOKEN=private');

    writeFileSync(join(root, 'cv.md'), 'Arshia CV updated');
    run(['activate', 'hannah-aghaei']);
    assert.equal(existsSync(join(root, 'cv.md')), false);
    assert.equal(existsSync(join(root, '.env')), false);

    run(['activate', 'arshia-hemati']);
    assert.equal(readFileSync(join(root, 'cv.md'), 'utf8'), 'Arshia CV updated');
    const browser = JSON.parse(readFileSync(join(root, '.career-ops', 'active-browser.json'), 'utf8'));
    assert.equal(browser.profile_id, 'arshia-hemati');
    assert.equal(browser.port, 9222);
    const state = JSON.parse(readFileSync(join(root, '.career-ops', 'profile-state.json'), 'utf8'));
    assert.equal(state.status, 'ready');
    assert.equal(state.profile_id, 'arshia-hemati');

    writeFileSync(join(root, '.career-ops', 'operation.lock'), JSON.stringify({ pid: process.pid, purpose: 'test automation' }));
    const blocked = spawnSync(process.execPath, [script, 'activate', 'hannah-aghaei', '--cwd', root], { encoding: 'utf8' });
    assert.equal(blocked.status, 1);
    assert.match(blocked.stderr, /Another Career-Ops profile operation is running/);
    rmSync(join(root, '.career-ops', 'operation.lock'), { force: true });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('profile runner activates one owner and binds the child command to it', () => {
  const base = mkdtempSync(join(tmpdir(), 'career-ops-profile-run-'));
  const root = join(base, 'repo');
  const script = join(REPO_ROOT, 'scripts', 'profile.mjs');
  const captureScript = join(base, 'capture-profile.mjs');
  const capturePath = join(base, 'captured.json');
  try {
    mkdirSync(root, { recursive: true });
    writeFileSync(captureScript, `
import { writeFileSync } from 'node:fs';
writeFileSync(process.argv[2], JSON.stringify({
  id: process.env.CAREER_OPS_PROFILE_ID,
  port: process.env.CAREER_OPS_CHROME_PORT,
  cwd: process.cwd(),
  childCwdFlag: process.argv[4],
}));
`);
    let result = spawnSync(process.execPath, [script, 'create', 'hannah-aghaei', '--name', 'Hannah Aghaei', '--browser-port', '9223', '--cwd', root], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    result = spawnSync(process.execPath, [
      script,
      'run', 'hannah-aghaei', '--cwd', root,
      '--', process.execPath, captureScript, capturePath, '--cwd', 'belongs-to-child',
    ], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const captured = JSON.parse(readFileSync(capturePath, 'utf8'));
    assert.equal(captured.id, 'hannah-aghaei');
    assert.equal(captured.port, '9223');
    assert.equal(captured.cwd, root);
    assert.equal(captured.childCwdFlag, 'belongs-to-child');
    assert.equal(existsSync(join(root, '.career-ops', 'operation.lock')), false);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('profile runners queue different owners instead of overlapping workspaces', { timeout: 5000 }, async () => {
  const base = mkdtempSync(join(tmpdir(), 'career-ops-profile-queue-'));
  const root = join(base, 'repo');
  const script = join(REPO_ROOT, 'scripts', 'profile.mjs');
  const holdScript = join(base, 'hold.mjs');
  const captureScript = join(base, 'capture.mjs');
  const capturePath = join(base, 'captured.txt');
  try {
    mkdirSync(root, { recursive: true });
    writeFileSync(holdScript, 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);\n');
    writeFileSync(captureScript, `import { writeFileSync } from 'node:fs'; writeFileSync(process.argv[2], process.env.CAREER_OPS_PROFILE_ID);\n`);
    for (const [id, name, port] of [['alpha-user', 'Alpha User', '9222'], ['beta-user', 'Beta User', '9223']]) {
      const created = spawnSync(process.execPath, [script, 'create', id, '--name', name, '--browser-port', port, '--cwd', root], { encoding: 'utf8' });
      assert.equal(created.status, 0, created.stderr);
    }

    let firstError = '';
    const first = spawn(process.execPath, [script, 'run', 'alpha-user', '--cwd', root, '--', process.execPath, holdScript], { stdio: ['ignore', 'ignore', 'pipe'] });
    first.stderr.on('data', chunk => { firstError += chunk; });
    const firstDone = new Promise(resolveDone => first.once('close', code => resolveDone(code)));
    for (let attempt = 0; attempt < 100 && !existsSync(join(root, '.career-ops', 'operation.lock')); attempt += 1) {
      await new Promise(resolveWait => setTimeout(resolveWait, 10));
    }
    assert.equal(existsSync(join(root, '.career-ops', 'operation.lock')), true, 'first runner never acquired the lock');

    const second = spawnSync(process.execPath, [
      script, 'run', 'beta-user', '--cwd', root,
      '--', process.execPath, captureScript, capturePath,
    ], { encoding: 'utf8' });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(await firstDone, 0, firstError);
    assert.equal(readFileSync(capturePath, 'utf8'), 'beta-user');
    assert.equal(readFileSync(join(root, '.career-ops', 'active-profile'), 'utf8').trim(), 'beta-user');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('apply picker honors a biotech profile, score floor, and company blacklist', () => {
  const root = mkdtempSync(join(tmpdir(), 'career-ops-picker-'));
  try {
    mkdirSync(join(root, 'config'), { recursive: true });
    mkdirSync(join(root, 'data'), { recursive: true });
    mkdirSync(join(root, 'reports'), { recursive: true });
    writeFileSync(join(root, 'config', 'profile.yml'), `
candidate: { full_name: "Bio User", email: "bio@example.com", phone: "+1-555-0100" }
target_roles: { primary: ["Research Scientist"], archetypes: [] }
application: { minimum_score: 4.2 }
`);
    writeFileSync(join(root, 'config', 'gmail-apply-portals.yml'), `
portals:
  - name: lab-ats
    match: ["jobs.example/"]
`);
    writeFileSync(join(root, 'reports', '001.md'), '**URL:** https://jobs.example/labco/research-scientist\n');
    writeFileSync(join(root, 'reports', '002.md'), '**URL:** https://jobs.example/blocked/clinical-scientist\n');
    writeFileSync(join(root, 'data', 'applications.md'), `
| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-01-01 | LabCo | Research Scientist | 4.5/5 | Evaluated | — | [1](../reports/001.md) | — |
| 2 | 2026-01-01 | Blocked Bio | Clinical Scientist | 5.0/5 | Evaluated | — | [2](../reports/002.md) | — |
`);
    writeFileSync(join(root, 'data', 'blacklist.md'), `
| Company | Since | Scope | Reason |
|---|---|---|---|
| Blocked Bio | 2026-01-01 | all | user choice |
`);
    const result = spawnSync(process.execPath, [join(REPO_ROOT, 'scripts', 'pick-apply-urls.mjs'), '10', '--cwd', root], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.minimum_score, 4.2);
    assert.deepEqual(payload.selected.map(item => item.company), ['LabCo']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
