// Shared CLI skill entrypoint bootstrap — used by npx init and update-system.
// Ensures every supported CLI gets .*/skills/career-ops/SKILL.md even when the
// cloned release predates a CLI (e.g. Grok on v1.13.0). Materializes pointer
// files to canonical content on filesystems without symlink support.
import { readFileSync, writeFileSync, existsSync, mkdirSync, lstatSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const CANONICAL_SKILL_PATH = '.agents/skills/career-ops/SKILL.md';

export const SKILL_ENTRYPOINTS = [
  {
    path: '.claude/skills/career-ops/SKILL.md',
    pointer: '../../../.agents/skills/career-ops/SKILL.md',
  },
  {
    path: '.opencode/skills/career-ops/SKILL.md',
    pointer: '../../../.agents/skills/career-ops/SKILL.md',
  },
  {
    path: '.qwen/skills/career-ops/SKILL.md',
    pointer: '../../../.agents/skills/career-ops/SKILL.md',
  },
  {
    path: '.antigravitycli/skills/career-ops/SKILL.md',
    pointer: '../../../.agents/skills/career-ops/SKILL.md',
  },
  {
    path: '.grok/skills/career-ops/SKILL.md',
    pointer: '../../../.agents/skills/career-ops/SKILL.md',
  },
];

const ADDITIONAL_SKILL_NAMES = ['scan-gmail', 'gmail-apply-smilified'];
const ENTRYPOINT_ROOTS = ['.claude', '.opencode', '.qwen', '.antigravitycli', '.grok'];

export const ADDITIONAL_SKILL_GROUPS = ADDITIONAL_SKILL_NAMES.map(name => ({
  canonicalPath: `.agents/skills/${name}/SKILL.md`,
  entrypoints: ENTRYPOINT_ROOTS.map(root => ({
    path: `${root}/skills/${name}/SKILL.md`,
    pointer: `../../../.agents/skills/${name}/SKILL.md`,
  })),
}));

function repoPath(root, path) {
  return join(root, ...path.split('/'));
}

function readCanonical(root, relativePath = CANONICAL_SKILL_PATH) {
  const canonicalPath = repoPath(root, relativePath);
  if (!existsSync(canonicalPath)) return null;
  try {
    return readFileSync(canonicalPath, 'utf-8');
  } catch {
    return null;
  }
}

export function materializeSkillEntrypoints(root) {
  const materialized = [];
  const groups = [
    { canonicalPath: CANONICAL_SKILL_PATH, entrypoints: SKILL_ENTRYPOINTS },
    ...ADDITIONAL_SKILL_GROUPS,
  ];
  for (const group of groups) {
    const canonicalContent = readCanonical(root, group.canonicalPath);
    if (canonicalContent === null) continue;
    for (const entry of group.entrypoints) {
      const entryPath = repoPath(root, entry.path);
      if (!existsSync(entryPath)) continue;

      let stat = null;
      try {
        stat = lstatSync(entryPath);
      } catch {
        continue;
      }
      if (stat.isSymbolicLink()) continue;
      if (!stat.isFile()) continue;

      try {
        const content = readFileSync(entryPath, 'utf-8').trim();
        if (content !== entry.pointer) continue;
        writeFileSync(entryPath, canonicalContent);
      } catch {
        continue;
      }
      materialized.push(entry.path);
    }
  }

  return materialized;
}

export function ensureSkillEntrypoints(root) {
  const touched = [];
  const groups = [
    { canonicalPath: CANONICAL_SKILL_PATH, entrypoints: SKILL_ENTRYPOINTS },
    ...ADDITIONAL_SKILL_GROUPS,
  ];
  for (const group of groups) {
    const canonicalContent = readCanonical(root, group.canonicalPath);
    if (canonicalContent === null) continue;
    for (const entry of group.entrypoints) {
      const entryPath = repoPath(root, entry.path);

      if (!existsSync(entryPath)) {
        try {
          mkdirSync(dirname(entryPath), { recursive: true });
          writeFileSync(entryPath, entry.pointer);
          touched.push(entry.path);
        } catch {
          continue;
        }
      }

      let stat = null;
      try {
        stat = lstatSync(entryPath);
      } catch {
        continue;
      }
      if (stat.isSymbolicLink()) continue;
      if (!stat.isFile()) continue;

      try {
        const content = readFileSync(entryPath, 'utf-8').trim();
        if (content !== entry.pointer) continue;
        writeFileSync(entryPath, canonicalContent);
        if (!touched.includes(entry.path)) touched.push(entry.path);
      } catch {
        continue;
      }
    }
  }

  return touched;
}
