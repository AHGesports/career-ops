#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import yaml from 'js-yaml';
import { parseTrackerRow, resolveColumns } from '../tracker-parse.mjs';
import { loadProfile, minimumApplicationScore } from './profile-config.mjs';

function argsOf(argv) {
  const args = argv.slice(2);
  const value = flag => {
    const inline = args.find(arg => arg.startsWith(`${flag}=`));
    if (inline) return inline.slice(flag.length + 1);
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : null;
  };
  const positional = args.find(arg => /^\d+$/.test(arg));
  const limit = Number(value('--limit') || positional || 10);
  return {
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    root: resolve(value('--cwd') || process.cwd()),
    help: args.includes('--help') || args.includes('-h'),
  };
}

function normalizedCompany(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function blacklist(root) {
  const path = resolve(root, 'data/blacklist.md');
  const blocked = new Set();
  if (!existsSync(path)) return blocked;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const company = line.split('|')[1]?.trim() || '';
    if (!company || company.toLowerCase() === 'company' || /^[-: ]+$/.test(company)) continue;
    blocked.add(normalizedCompany(company));
  }
  return blocked;
}

function rowUrl(row, applicationsPath) {
  const noteUrl = row.notes?.match(/(?:URL|url):\s*(https?:\/\/\S+)/)?.[1];
  if (noteUrl) return noteUrl.replace(/[)>\],.;]+$/, '');
  const reportPath = row.report?.match(/\(([^)]+)\)/)?.[1];
  if (!reportPath) return null;
  const absolute = resolve(dirname(applicationsPath), reportPath);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute, 'utf8').match(/\*\*URL:\*\*\s*(\S+)/)?.[1]?.replace(/[)>\],.;]+$/, '') || null;
}

const { limit, root, help } = argsOf(process.argv);
if (help) {
  console.log('Usage: node scripts/pick-apply-urls.mjs [amount] [--cwd PATH]');
  process.exit(0);
}
const applicationsPath = resolve(root, 'data/applications.md');
const portalsPath = resolve(root, 'config/gmail-apply-portals.yml');
if (!existsSync(applicationsPath) || !existsSync(portalsPath)) {
  console.error(JSON.stringify({ ok: false, error: 'Missing data/applications.md or config/gmail-apply-portals.yml' }));
  process.exit(2);
}

const profile = loadProfile(root);
const minimumScore = minimumApplicationScore(profile);
const portalConfig = yaml.load(readFileSync(portalsPath, 'utf8')) || {};
const lines = readFileSync(applicationsPath, 'utf8').split(/\r?\n/);
const columns = resolveColumns(lines);
const blocked = blacklist(root);
const eligibleStatuses = new Set(profile.application?.eligible_statuses || ['Evaluated']);
const candidates = [];

for (const line of lines) {
  const row = parseTrackerRow(line, columns);
  if (!row || !eligibleStatuses.has(row.status)) continue;
  const score = Number.parseFloat(String(row.score).replace('/5', ''));
  if (!Number.isFinite(score) || score < minimumScore) continue;
  if (blocked.has(normalizedCompany(row.company))) continue;
  const url = rowUrl(row, applicationsPath);
  if (!url) continue;
  const portal = (portalConfig.portals || []).find(item => (item.match || []).some(match => url.includes(match)));
  candidates.push({
    num: row.num,
    company: row.company,
    role: row.role,
    score,
    status: row.status,
    portal: portal?.name || null,
    takeover_required: !portal,
    url,
  });
}

candidates.sort((a, b) => b.num - a.num);
const seen = new Set();
const selected = candidates.filter(item => !seen.has(item.url) && seen.add(item.url)).slice(0, limit);
console.log(JSON.stringify({ minimum_score: minimumScore, selected }, null, 2));
