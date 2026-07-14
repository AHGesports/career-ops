#!/usr/bin/env node
import {
  closeSync,
  cpSync,
  existsSync,
  openSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');
const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export const MANAGED_PROFILE_PATHS = [
  '.env',
  'cv.md',
  'voice-dna.md',
  'article-digest.md',
  'portals.yml',
  'plugins.lock',
  'config/profile.yml',
  'config/cv-facts.json',
  'config/benchmarks.yml',
  'config/plugins.yml',
  'modes/_profile.md',
  'modes/_custom.md',
  'data',
  'reports',
  'output',
  'jds',
  'interview-prep',
  'writing-samples',
  'plugins.local',
  'assets/cv',
  'batch/logs',
  'batch/pipeline-updates',
  'batch/tracker-additions',
  'mcp/gmail-html/runs',
];

function slash(value) {
  return value.split(sep).join('/');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const separator = args.indexOf('--');
  const ownArgs = separator >= 0 ? args.slice(0, separator) : args;
  const value = flag => {
    const inline = ownArgs.find(arg => arg.startsWith(`${flag}=`));
    if (inline) return inline.slice(flag.length + 1);
    const index = ownArgs.indexOf(flag);
    return index >= 0 ? ownArgs[index + 1] : null;
  };
  const command = ownArgs[0] || 'help';
  const rawId = ownArgs[1] && !ownArgs[1].startsWith('--') ? ownArgs[1] : null;
  return {
    command,
    id: rawId || null,
    root: resolve(value('--cwd') || DEFAULT_ROOT),
    source: value('--from') ? resolve(value('--from')) : null,
    displayName: value('--name'),
    browserPort: value('--browser-port'),
    batch: ownArgs.includes('--batch'),
    commandArgs: separator >= 0 ? args.slice(separator + 1) : [],
  };
}

function pathsFor(root) {
  const stateRoot = resolve(root, '.career-ops');
  return {
    stateRoot,
    profilesRoot: resolve(stateRoot, 'profiles'),
    activePath: resolve(stateRoot, 'active-profile'),
    browserPath: resolve(stateRoot, 'active-browser.json'),
    profileStatePath: resolve(stateRoot, 'profile-state.json'),
    operationLockPath: resolve(stateRoot, 'operation.lock'),
  };
}

function assertId(id) {
  if (!id || !ID_PATTERN.test(id)) {
    throw new Error('Profile id must use lowercase letters, numbers, and internal hyphens only.');
  }
  return id;
}

function profilePaths(root, id) {
  const { profilesRoot } = pathsFor(root);
  const profileRoot = resolve(profilesRoot, assertId(id));
  if (relative(profilesRoot, profileRoot).startsWith('..')) throw new Error('Profile path escaped its store.');
  return {
    profileRoot,
    metadataPath: resolve(profileRoot, 'profile.json'),
    workspaceRoot: resolve(profileRoot, 'workspace'),
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readActiveId(root) {
  const { activePath } = pathsFor(root);
  if (!existsSync(activePath)) return null;
  const id = readFileSync(activePath, 'utf8').trim();
  return id ? assertId(id) : null;
}

function readProfileState(root) {
  const { profileStatePath } = pathsFor(root);
  if (!existsSync(profileStatePath)) return null;
  try {
    return readJson(profileStatePath);
  } catch {
    return null;
  }
}

function nextGeneration(root) {
  const previous = Number(readProfileState(root)?.generation) || 0;
  return Math.max(Date.now(), previous + 1);
}

function writeProfileState(root, value) {
  writeJson(pathsFor(root).profileStatePath, {
    schema_version: 1,
    ...value,
    updated_at: new Date().toISOString(),
  });
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

function acquireOperationLock(root, purpose, waitMs = 0) {
  const { operationLockPath } = pathsFor(root);
  mkdirSync(dirname(operationLockPath), { recursive: true });
  const deadline = Date.now() + Math.max(0, waitMs);
  const sleeper = new Int32Array(new SharedArrayBuffer(4));
  while (true) {
    try {
      const fd = openSync(operationLockPath, 'wx');
      const token = `${process.pid}-${Date.now()}`;
      writeFileSync(fd, `${JSON.stringify({ pid: process.pid, purpose, token, created_at: new Date().toISOString() }, null, 2)}\n`);
      return () => {
        closeSync(fd);
        try {
          const current = readJson(operationLockPath);
          if (current.token === token) rmSync(operationLockPath, { force: true });
        } catch {
          // The lock may already have been removed after an interrupted process.
        }
      };
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      let existing = null;
      try {
        existing = readJson(operationLockPath);
      } catch {
        // A malformed lock is stale and safe to replace.
      }
      if (!processIsAlive(Number(existing?.pid))) {
        rmSync(operationLockPath, { force: true });
        continue;
      }
      if (Date.now() < deadline) {
        Atomics.wait(sleeper, 0, 0, Math.min(100, deadline - Date.now()));
        continue;
      }
      const owner = existing?.purpose ? ` (${existing.purpose})` : '';
      throw new Error(`Another Career-Ops profile operation is running${owner}. Wait for it to finish before switching profiles.`);
    }
  }
}

function withOperationLock(root, purpose, callback, waitMs = 0) {
  const release = acquireOperationLock(root, purpose, waitMs);
  try {
    return callback();
  } finally {
    release();
  }
}

function trackedPaths(root) {
  const result = spawnSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'buffer' });
  if (result.status !== 0 || !result.stdout) return new Set();
  return new Set(result.stdout.toString('utf8').split('\0').filter(Boolean).map(slash));
}

function copyNode(sourceRoot, destinationRoot, relativePath, tracked, stats) {
  const normalized = slash(relativePath);
  if (tracked.has(normalized)) return;
  const source = resolve(sourceRoot, ...normalized.split('/'));
  if (!existsSync(source)) return;
  const stat = lstatSync(source);
  if (stat.isSymbolicLink()) return;
  const destination = resolve(destinationRoot, ...normalized.split('/'));
  if (stat.isDirectory()) {
    mkdirSync(destination, { recursive: true });
    for (const entry of readdirSync(source)) {
      copyNode(sourceRoot, destinationRoot, `${normalized}/${entry}`, tracked, stats);
    }
    return;
  }
  if (!stat.isFile()) return;
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { force: true, preserveTimestamps: true });
  stats.files += 1;
  stats.bytes += stat.size;
}

function copyManaged(sourceRoot, destinationRoot, tracked = new Set()) {
  const stats = { files: 0, bytes: 0 };
  for (const relativePath of MANAGED_PROFILE_PATHS) {
    copyNode(sourceRoot, destinationRoot, relativePath, tracked, stats);
  }
  return stats;
}

function clearStoredWorkspace(workspaceRoot) {
  for (const relativePath of MANAGED_PROFILE_PATHS) {
    rmSync(resolve(workspaceRoot, ...relativePath.split('/')), { recursive: true, force: true });
  }
}

function clearActiveNode(root, relativePath, tracked) {
  const normalized = slash(relativePath);
  if (tracked.has(normalized)) return;
  const path = resolve(root, ...normalized.split('/'));
  if (!existsSync(path)) return;
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || stat.isFile()) {
    rmSync(path, { force: true });
    return;
  }
  if (!stat.isDirectory()) return;
  for (const entry of readdirSync(path)) clearActiveNode(root, `${normalized}/${entry}`, tracked);
  if (readdirSync(path).length === 0) rmSync(path, { recursive: true, force: true });
}

function clearActiveWorkspace(root, tracked) {
  for (const relativePath of MANAGED_PROFILE_PATHS) clearActiveNode(root, relativePath, tracked);
}

function activeOverlayStats(root, tracked) {
  const temporary = resolve(pathsFor(root).stateRoot, '.overlay-audit');
  rmSync(temporary, { recursive: true, force: true });
  try {
    return copyManaged(root, temporary, tracked);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

function listProfiles(root) {
  const { profilesRoot } = pathsFor(root);
  if (!existsSync(profilesRoot)) return [];
  return readdirSync(profilesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && ID_PATTERN.test(entry.name))
    .map(entry => {
      const { metadataPath } = profilePaths(root, entry.name);
      return existsSync(metadataPath) ? readJson(metadataPath) : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function nextPort(root) {
  const ports = new Set(listProfiles(root).map(profile => Number(profile.browser_port)).filter(Number.isInteger));
  let port = 9222;
  while (ports.has(port)) port += 1;
  return port;
}

function parsePort(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error('Browser port must be an integer from 1024 through 65535.');
  }
  return port;
}

function chromeHome() {
  if (process.env.CAREER_OPS_CHROME_HOME) return resolve(process.env.CAREER_OPS_CHROME_HOME);
  const local = process.env.LOCALAPPDATA || resolve(homedir(), '.local', 'share');
  return resolve(local, 'career-ops', 'chrome-profiles');
}

function browserDirectory(id) {
  if (process.env.CAREER_OPS_CHROME_PROFILE) return resolve(process.env.CAREER_OPS_CHROME_PROFILE);
  return resolve(chromeHome(), assertId(id));
}

function createMetadata(root, id, displayName, browserPort) {
  const now = new Date().toISOString();
  return {
    schema_version: 1,
    id,
    display_name: displayName || id,
    browser_port: parsePort(browserPort, nextPort(root)),
    created_at: now,
    updated_at: now,
  };
}

function saveActive(root) {
  const id = readActiveId(root);
  if (!id) throw new Error('No active profile to save.');
  const { metadataPath, workspaceRoot } = profilePaths(root, id);
  if (!existsSync(metadataPath)) throw new Error(`Active profile ${id} is missing metadata.`);
  const tracked = trackedPaths(root);
  clearStoredWorkspace(workspaceRoot);
  const stats = copyManaged(root, workspaceRoot, tracked);
  const metadata = readJson(metadataPath);
  metadata.updated_at = new Date().toISOString();
  writeJson(metadataPath, metadata);
  return { profile: metadata, saved: stats };
}

function activateProfile(root, requestedId, browserPort) {
  const currentId = readActiveId(root);
  const id = assertId(requestedId || currentId);
  const { metadataPath, workspaceRoot } = profilePaths(root, id);
  if (!existsSync(metadataPath)) throw new Error(`Profile ${id} does not exist.`);
  const metadata = readJson(metadataPath);
  const generation = nextGeneration(root);
  const tracked = trackedPaths(root);

  writeProfileState(root, {
    status: 'switching',
    profile_id: id,
    display_name: metadata.display_name || id,
    previous_profile_id: currentId,
    generation,
  });

  try {
    if (currentId !== id) {
      if (currentId) {
        saveActive(root);
      } else {
        const orphaned = activeOverlayStats(root, tracked);
        if (orphaned.files) {
          throw new Error('Unmanaged user data exists in the workspace. Import or adopt it before activating a profile.');
        }
      }
      clearActiveWorkspace(root, tracked);
      copyManaged(workspaceRoot, root, tracked);
      const { activePath } = pathsFor(root);
      mkdirSync(dirname(activePath), { recursive: true });
      writeFileSync(activePath, `${id}\n`, 'utf8');
    }

    metadata.browser_port = parsePort(browserPort, metadata.browser_port || 9222);
    metadata.last_activated_at = new Date().toISOString();
    metadata.updated_at = metadata.last_activated_at;
    writeJson(metadataPath, metadata);
    const browser = {
      profile_id: id,
      port: metadata.browser_port,
      user_data_dir: browserDirectory(id),
      updated_at: metadata.updated_at,
    };
    writeJson(pathsFor(root).browserPath, browser);
    writeProfileState(root, {
      status: 'ready',
      profile_id: id,
      display_name: metadata.display_name || id,
      generation,
    });
    return { profile: metadata, browser };
  } catch (error) {
    writeProfileState(root, {
      status: 'error',
      profile_id: id,
      display_name: metadata.display_name || id,
      previous_profile_id: currentId,
      generation,
      error: error.message,
    });
    throw error;
  }
}

function createProfile(root, id, displayName, browserPort) {
  assertId(id);
  const { metadataPath, workspaceRoot } = profilePaths(root, id);
  if (existsSync(metadataPath)) throw new Error(`Profile ${id} already exists.`);
  mkdirSync(workspaceRoot, { recursive: true });
  const metadata = createMetadata(root, id, displayName, browserPort);
  writeJson(metadataPath, metadata);
  return { profile: metadata, imported: { files: 0, bytes: 0 } };
}

function importProfile(root, id, source, displayName, browserPort) {
  if (!source || !existsSync(source)) throw new Error('Import requires an existing --from workspace path.');
  const created = createProfile(root, id, displayName, browserPort);
  const { workspaceRoot, metadataPath } = profilePaths(root, id);
  const imported = copyManaged(source, workspaceRoot, trackedPaths(root));
  const metadata = readJson(metadataPath);
  metadata.imported_from = source;
  metadata.updated_at = new Date().toISOString();
  writeJson(metadataPath, metadata);
  return { profile: metadata, imported };
}

function print(value, batch = false) {
  if (batch) {
    console.log(`CAREER_OPS_PROFILE_ID=${value.profile.id}`);
    console.log(`CAREER_OPS_CHROME_PORT=${value.browser.port}`);
    console.log(`CAREER_OPS_CHROME_PROFILE=${value.browser.user_data_dir}`);
    return;
  }
  console.log(JSON.stringify(value, null, 2));
}

function runForProfile(root, id, browserPort, commandArgs) {
  if (commandArgs.length === 0) throw new Error('Run requires a command after --.');
  return withOperationLock(root, `run ${id}`, () => {
    const activated = activateProfile(root, id, browserPort);
    let command = commandArgs[0];
    if (process.platform === 'win32' && ['npm', 'npx', 'pnpm', 'yarn'].includes(command.toLowerCase())) {
      command = `${command}.cmd`;
    }
    const result = spawnSync(command, commandArgs.slice(1), {
      cwd: root,
      env: {
        ...process.env,
        CAREER_OPS_PROFILE_ID: activated.profile.id,
        CAREER_OPS_CHROME_PORT: String(activated.browser.port),
        CAREER_OPS_CHROME_PROFILE: activated.browser.user_data_dir,
      },
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.signal) throw new Error(`Profile command stopped by signal ${result.signal}.`);
    return result.status ?? 1;
  }, 15 * 60 * 1000);
}

function usage() {
  console.log(`Usage:
  node scripts/profile.mjs list
  node scripts/profile.mjs current
  node scripts/profile.mjs create <id> --name "Display Name" [--browser-port 9222]
  node scripts/profile.mjs import <id> --name "Display Name" --from <workspace> [--browser-port 9222]
  node scripts/profile.mjs activate [id] [--browser-port 9222] [--batch]
  node scripts/profile.mjs save
  node scripts/profile.mjs run <id> -- <command> [args...]`);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.command === 'help' || args.command === '--help' || args.command === '-h') return usage();
  if (args.command === 'list') {
    return print({ active: readActiveId(args.root), profiles: listProfiles(args.root) });
  }
  if (args.command === 'current') {
    const id = readActiveId(args.root);
    if (!id) return print({ active: null });
    const { metadataPath } = profilePaths(args.root, id);
    return print({ active: id, profile: readJson(metadataPath) });
  }
  if (args.command === 'create') return print(withOperationLock(args.root, `create ${args.id}`, () => createProfile(args.root, assertId(args.id), args.displayName, args.browserPort)));
  if (args.command === 'import') return print(withOperationLock(args.root, `import ${args.id}`, () => importProfile(args.root, assertId(args.id), args.source, args.displayName, args.browserPort)));
  if (args.command === 'activate') return print(withOperationLock(args.root, `activate ${args.id || 'current'}`, () => activateProfile(args.root, args.id, args.browserPort)), args.batch);
  if (args.command === 'save') return print(withOperationLock(args.root, 'save active profile', () => saveActive(args.root)));
  if (args.command === 'run') {
    const status = runForProfile(args.root, assertId(args.id), args.browserPort, args.commandArgs);
    if (status !== 0) process.exitCode = status;
    return;
  }
  throw new Error(`Unknown profile command: ${args.command}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
