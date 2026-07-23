#!/usr/bin/env node
import 'dotenv/config';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inflateSync } from 'node:zlib';
import yaml from 'js-yaml';
import { chromium } from 'playwright';
import { companyFromUrl, isAuthenticEmail, parseRoleAtCompany } from '../plugins/gmail/_helpers.mjs';
import { getAccessToken } from '../plugins/gmail/index.mjs';
import { classifyText, loadProfile, requireActiveProfile } from './profile-config.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export function parseWindow(value = '1d') {
  const aliases = { today: '1d', weekend: '3d', week: '7d', month: '30d' };
  const normalized = aliases[String(value).toLowerCase()] || String(value).toLowerCase();
  const match = normalized.match(/^(\d+)(h|d|w|m)$/);
  if (!match) throw new Error(`Invalid window ${JSON.stringify(value)}. Use 6h, 1d, 2w, or 1m.`);
  const amount = Number(match[1]);
  const unit = { h: 3600e3, d: 86400e3, w: 7 * 86400e3, m: 30 * 86400e3 }[match[2]];
  if (!amount) throw new Error('Window must be greater than zero.');
  return { label: normalized, milliseconds: amount * unit };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const value = flag => {
    const inline = args.find(arg => arg.startsWith(`${flag}=`));
    if (inline) return inline.slice(flag.length + 1);
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : null;
  };
  return {
    root: resolve(value('--cwd') || DEFAULT_ROOT),
    window: value('--window') || '1d',
    commit: args.includes('--commit'),
    noFollow: args.includes('--no-follow'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

function headerMap(message) {
  return Object.fromEntries((message.payload?.headers || []).map(item => [String(item.name).toLowerCase(), item.value || '']));
}

function senderAddress(value) {
  return (String(value).match(/<([^>]+)>/)?.[1] || String(value)).trim().toLowerCase();
}

function decodeBodies(payload) {
  const bodies = { html: '', plain: '' };
  function walk(part) {
    if (!part) return;
    if (part.body?.data) {
      const text = Buffer.from(part.body.data, 'base64url').toString('utf8');
      if (part.mimeType === 'text/html') bodies.html += text;
      else if (part.mimeType === 'text/plain') bodies.plain += text;
    }
    for (const child of part.parts || []) walk(child);
  }
  walk(payload);
  return bodies;
}

function allMatches(pattern, text) {
  const regex = new RegExp(pattern, 'giu');
  return [...String(text).matchAll(regex)];
}

function capturedTemplate(template, match) {
  return String(template).replace(/\{(\d+)\}/g, (_, index) => match[Number(index)] || '');
}

function ensureUrl(value) {
  const decoded = String(value || '').replace(/&amp;/g, '&').replace(/\\u0026/g, '&').trim();
  if (!decoded) return null;
  return /^https?:\/\//i.test(decoded) ? decoded : `https://${decoded.replace(/^\/+/, '')}`;
}

export function canonicalizeUrl(raw, stripPatterns = []) {
  try {
    const url = new URL(ensureUrl(raw));
    url.hash = '';
    url.protocol = 'https:';
    url.hostname = url.hostname.toLowerCase();
    if (url.hostname === 'www.linkedin.com' && url.pathname.startsWith('/comm/jobs/view/')) {
      url.pathname = url.pathname.replace('/comm/jobs/view/', '/jobs/view/');
    }
    if (url.hostname.endsWith('indeed.com') && url.pathname.includes('/rc/clk') && url.searchParams.get('jk')) {
      url.pathname = '/viewjob';
      const jk = url.searchParams.get('jk');
      url.search = '';
      url.searchParams.set('jk', jk);
    }
    for (const key of [...url.searchParams.keys()]) {
      if (stripPatterns.some(pattern => pattern.endsWith('*') ? key.startsWith(pattern.slice(0, -1)) : key === pattern)) {
        url.searchParams.delete(key);
      }
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function extractSenderUrls(sender, bodies, stripPatterns = []) {
  const source = sender.extraction === 'plaintext' ? bodies.plain : bodies.html;
  const sources = sender.anchor_text_exclude
    ? [...source.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/giu)]
      .filter(match => {
        const text = match[0].replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ').trim();
        return !new RegExp(sender.anchor_text_exclude, 'iu').test(text);
      })
      .map(match => match[0])
    : [source];
  const matches = sources.flatMap(value => allMatches(sender.pattern || sender.pattern_guess || '(?!)', value));
  const urls = [];
  const trackers = [];
  for (const match of matches) {
    try {
      let candidate;
      if (sender.extraction === 'base64') {
        candidate = Buffer.from(match[Number(sender.decode_group || 1)], 'base64url').toString('utf8');
      } else if (sender.extraction === 'zlib') {
        const decoded = inflateSync(Buffer.from(match[Number(sender.decode_group || 1)], 'base64url')).toString('utf8');
        candidate = new URLSearchParams(decoded).get(sender.target_param || 'l');
      } else {
        candidate = sender.url_template ? capturedTemplate(sender.url_template, match) : match[0];
      }
      const canonical = canonicalizeUrl(candidate, stripPatterns);
      if (!canonical) continue;
      if (sender.decoded_must_match && sender.extraction !== 'tracker' && !new RegExp(sender.decoded_must_match, 'iu').test(canonical)) continue;
      if (sender.extraction === 'tracker') trackers.push(canonical);
      else urls.push(canonical);
    } catch {
      // One malformed link must not discard the rest of the email.
    }
  }
  return { urls: [...new Set(urls)], trackers: [...new Set(trackers)] };
}

export function trackerDestination(raw) {
  try {
    const url = new URL(raw);
    const stepstoneCountry = url.hostname.match(/(?:^|\.)stepstone\.(de|at)$/iu)?.[1]?.toLowerCase();
    if (stepstoneCountry && /^\/job\/\d+\/application\/redirection$/u.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/application\/redirection$/u, '');
      url.search = '';
      return url.toString();
    }
    if (stepstoneCountry && url.pathname.startsWith('/v2/magiclink/exchange')) {
      const target = url.searchParams.get('returnUrl');
      if (target) return trackerDestination(`https://www.stepstone.${stepstoneCountry}${decodeURIComponent(target)}`);
    }
    if (url.hostname.endsWith('metajob.at') && url.pathname === '/' && url.searchParams.has('q')) return url.toString();
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw;
  }
}

async function followTrackers(items, senderMap, stripPatterns) {
  if (!items.length) return { resolved: [], failed: [] };
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({
    locale: 'de-DE',
    userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`,
  });
  const resolved = [];
  const failed = [];
  try {
    for (const item of items) {
      const config = senderMap.get(item.sender);
      let page = await context.newPage();
      try {
        let response;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            response = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            break;
          } catch (error) {
            const connectionReset = String(error.message || error).includes('net::ERR_CONNECTION_RESET');
            if (!connectionReset) throw error;
            if (attempt === 3) {
              await page.waitForTimeout(1000);
              const current = page.url();
              if (current !== item.url && !current.startsWith('chrome-error:')) break;
              throw error;
            }
            await page.close();
            page = await context.newPage();
          }
        }
        await page.waitForTimeout(1000);
        const final = canonicalizeUrl(trackerDestination(page.url()), stripPatterns);
        if (!final || final === item.url) {
          const title = (await page.title()).replace(/\s+/g, ' ').trim().slice(0, 80);
          throw new Error(`tracker did not redirect (status ${response?.status() ?? 'unknown'}, title ${JSON.stringify(title)})`);
        }
        if (config?.decoded_must_match && !new RegExp(config.decoded_must_match, 'iu').test(final)) {
          if (config.decoded_list_match && new RegExp(config.decoded_list_match, 'iu').test(final)) {
            resolved.push({ ...item, url: final, kind: 'list' });
            continue;
          }
          const destination = new URL(final);
          if (config?.external_destination_kind && !destination.hostname.endsWith('stepstone.de') && !destination.hostname.endsWith('stepstone.at')) {
            resolved.push({ ...item, url: final, kind: config.external_destination_kind });
            continue;
          }
          throw new Error(`resolved URL did not match expected job shape (${destination.hostname}${destination.pathname})`);
        }
        resolved.push({ ...item, url: final, kind: config?.result_kind || 'job' });
      } catch (error) {
        const message = String(error.message || error);
        const category = message.includes('net::ERR_CONNECTION_RESET')
          ? 'connection reset'
          : message.includes('is interrupted by another navigation')
            ? 'navigation interrupted'
            : message.split('\n')[0].replace(/https?:\/\/\S+/giu, '[tracker-url]').slice(0, 300);
        failed.push({ ...item, error: category });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  return { resolved, failed };
}

async function gmailJson(url, token) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Gmail API ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

async function listMessages(token, query) {
  const messages = [];
  let pageToken = null;
  do {
    const url = new URL(`${GMAIL_API}/messages`);
    url.searchParams.set('q', query);
    url.searchParams.set('maxResults', '500');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const page = await gmailJson(url, token);
    messages.push(...(page.messages || []));
    pageToken = page.nextPageToken || null;
  } while (pageToken);
  return messages;
}

function knownMessageIds(path) {
  if (!existsSync(path)) return new Set();
  return new Set(readFileSync(path, 'utf8').split(/\r?\n/).slice(1).map(line => line.split('\t')[0]).filter(Boolean));
}

function knownUrls(paths) {
  const urls = new Set();
  for (const path of paths) {
    if (!existsSync(path)) continue;
    for (const match of readFileSync(path, 'utf8').matchAll(/https?:\/\/[^\s|<>"')\]]+/g)) {
      const canonical = canonicalizeUrl(match[0]);
      if (canonical) urls.add(canonical);
    }
  }
  return urls;
}

function pipelineSkeleton(title) {
  return `# ${title}\n\n## Pending\n\n## Processed\n`;
}

export function appendPending(path, rows, title = 'Pipeline — Pending URLs') {
  if (!rows.length) return;
  if (!existsSync(path)) writeFileSync(path, pipelineSkeleton(title), 'utf8');
  let text = readFileSync(path, 'utf8');
  const pending = text.indexOf('## Pending');
  const processed = text.indexOf('\n## Processed', Math.max(0, pending + 1));
  if (pending < 0) {
    const insertAt = processed >= 0 ? processed : text.length;
    const block = `\n## Pending\n\n${rows.join('\n')}\n`;
    text = `${text.slice(0, insertAt).trimEnd()}${block}\n${text.slice(insertAt).trimStart()}`;
    writeFileSync(path, text, 'utf8');
    return;
  }
  const insertAt = processed >= 0 ? processed : text.length;
  text = `${text.slice(0, insertAt).trimEnd()}\n${rows.join('\n')}\n\n${text.slice(insertAt).trimStart()}`;
  writeFileSync(path, text, 'utf8');
}

function sanitizeField(value) {
  return String(value || '').replace(/[|\r\n]+/g, ' ').trim();
}

function leadFor(url, message, kind, profile) {
  const seed = parseRoleAtCompany(message.subject);
  const parsed = new URL(url);
  const company = seed?.company || companyFromUrl(url) || parsed.hostname.replace(/^www\./, '');
  const title = seed?.role || 'Job lead from Gmail';
  const haystack = `${parsed.pathname} ${parsed.search} ${message.subject} ${message.snippet} ${message.sender}`
    .replace(/[-_/?=&]+/g, ' ').toLowerCase();
  const classification = kind === 'list' ? { tag: 'list', matched: [], excluded: [] } : classifyText(profile, haystack);
  return { url, company, title, sender: message.sender, classification };
}

export async function runScan(options) {
  const root = options.root;
  const profileId = requireActiveProfile(root);
  const profile = loadProfile(root);
  const sendersPath = resolve(root, 'config/gmail-senders.yml');
  if (!existsSync(sendersPath)) throw new Error('config/gmail-senders.yml is missing.');
  const senderConfig = yaml.load(readFileSync(sendersPath, 'utf8')) || {};
  const senders = senderConfig.senders || [];
  const senderMap = new Map(senders.map(sender => [String(sender.email).toLowerCase(), sender]));
  const stripPatterns = senderConfig.strip_params || [];
  const historyPath = resolve(root, 'data/gmail-scan-history.tsv');
  const seenMessages = knownMessageIds(historyPath);
  const seenUrls = knownUrls([
    resolve(root, 'data/pipeline.md'),
    resolve(root, 'data/pipeline-deferred.md'),
    resolve(root, 'data/pipeline-lists.md'),
    resolve(root, 'data/applications.md'),
  ]);

  const credentials = {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  };
  if (Object.values(credentials).some(value => !value)) {
    throw new Error('Missing Gmail OAuth values in .env. Run node scripts/gmail-auth.mjs after setting the client id and secret.');
  }
  const token = await getAccessToken(credentials);
  const window = parseWindow(options.window);
  const after = Math.floor((Date.now() - window.milliseconds) / 1000);
  const senderQuery = senders.map(sender => `from:${sender.email}`).join(' ');
  const query = `after:${after} {${senderQuery}}`;
  const ids = await listMessages(token, query);
  const messages = [];
  const trackers = [];
  const warnings = [];
  const history = [];

  for (const item of ids) {
    if (seenMessages.has(item.id)) continue;
    const raw = await gmailJson(`${GMAIL_API}/messages/${item.id}?format=full`, token);
    const headers = headerMap(raw);
    const sender = senderAddress(headers.from);
    const config = senderMap.get(sender);
    if (!config) {
      warnings.push(`Unknown sender ${sender} for message ${item.id}`);
      continue;
    }
    if (!isAuthenticEmail(raw.payload?.headers || [])) {
      history.push({ id: item.id, sender, subject: headers.subject, outcome: 'dmarc-failed', count: 0 });
      continue;
    }
    if (config.extraction === 'untested') {
      warnings.push(`Sender ${sender} is marked untested; inspect one message before enabling it.`);
      continue;
    }
    const bodies = decodeBodies(raw.payload);
    const extracted = extractSenderUrls(config, bodies, stripPatterns);
    const message = { id: item.id, sender, subject: headers.subject || '', snippet: raw.snippet || '' };
    messages.push({ message, config, urls: extracted.urls });
    trackers.push(...extracted.trackers.map(url => ({ url, sender, message })));
    const expected = config.subject_count_pattern
      ? Number(headers.subject?.match(new RegExp(config.subject_count_pattern, 'iu'))?.[1] || 0)
      : 0;
    const captured = extracted.urls.length + extracted.trackers.length;
    if (expected && captured < expected && !config.subject_count_is_summary) {
      warnings.push(`${sender}: subject expected ${expected} jobs but captured ${captured}.`);
    }
    history.push({ id: item.id, sender, subject: headers.subject, outcome: 'processed', count: captured });
  }

  let followed = { resolved: [], failed: [] };
  if (trackers.length && !options.noFollow) followed = await followTrackers(trackers, senderMap, stripPatterns);
  if (trackers.length && options.noFollow) warnings.push(`${trackers.length} tracker URLs were skipped by --no-follow.`);
  const recoveredTrackerFailures = followed.failed.filter(item => {
    const config = senderMap.get(item.sender);
    return (item.error === 'connection reset' || item.error.includes('status 429'))
      && config?.single_job_subject_pattern
      && new RegExp(config.single_job_subject_pattern, 'iu').test(item.message.subject)
      && followed.resolved.some(resolved => resolved.message.id === item.message.id && resolved.kind === 'job');
  });
  if (recoveredTrackerFailures.length) {
    const recovered = new Set(recoveredTrackerFailures);
    followed = { ...followed, failed: followed.failed.filter(item => !recovered.has(item)) };
  }
  if (followed.failed.length) warnings.push(`${followed.failed.length} tracker URLs failed to resolve.`);

  const leads = [];
  for (const entry of messages) {
    for (const url of entry.urls) leads.push(leadFor(url, entry.message, entry.config.result_kind || 'job', profile));
  }
  for (const entry of followed.resolved) leads.push(leadFor(entry.url, entry.message, entry.kind, profile));

  const unique = [];
  for (const lead of leads) {
    const canonical = canonicalizeUrl(lead.url, stripPatterns);
    if (!canonical || seenUrls.has(canonical)) continue;
    seenUrls.add(canonical);
    unique.push({ ...lead, url: canonical });
  }
  const matched = unique.filter(lead => lead.classification.tag === 'match');
  const deferred = unique.filter(lead => lead.classification.tag === 'deferred');
  const lists = unique.filter(lead => lead.classification.tag === 'list');
  const countBy = (items, keyFor) => items.reduce((counts, item) => {
    const key = keyFor(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  if (options.commit && warnings.length) {
    throw new Error(`Refusing to commit because capture warnings require review:\n- ${warnings.join('\n- ')}`);
  }
  if (options.commit) {
    const format = (lead, note) => `- [ ] ${lead.url} | ${sanitizeField(lead.company)} | ${sanitizeField(lead.title)} | note: ${note}`;
    appendPending(resolve(root, 'data/pipeline.md'), matched.map(lead => format(lead, 'gmail profile match')));
    appendPending(resolve(root, 'data/pipeline-deferred.md'), deferred.map(lead => format(lead, 'gmail deferred')), 'Deferred Gmail leads');
    appendPending(resolve(root, 'data/pipeline-lists.md'), lists.map(lead => format(lead, 'gmail list page')), 'Gmail list pages');
    mkdirSync(resolve(root, 'data'), { recursive: true });
    if (!existsSync(historyPath)) writeFileSync(historyPath, 'message_id\tscanned_at\tsender\tsubject\toutcome\turl_count\n', 'utf8');
    const now = new Date().toISOString();
    for (const row of history) {
      appendFileSync(historyPath, [row.id, now, row.sender, sanitizeField(row.subject), row.outcome, row.count].join('\t') + '\n');
    }
  }

  return {
    profile_id: profileId,
    window: window.label,
    messages_seen: ids.length,
    messages_processed: history.length,
    urls_new: unique.length,
    matched: matched.length,
    deferred: deferred.length,
    lists: lists.length,
    trackers_found_by_sender: countBy(trackers, item => item.sender),
    trackers_resolved: followed.resolved.length,
    trackers_recovered: recoveredTrackerFailures.length,
    trackers_failed: followed.failed.length,
    tracker_failures_by_sender: countBy(followed.failed, item => item.sender),
    tracker_failure_reasons: countBy(followed.failed, item => item.error),
    tracker_failures: followed.failed.slice(0, 20).map(item => ({
      sender: item.sender,
      message_id: item.message.id,
      subject: item.message.subject,
      snippet: item.message.snippet.replace(/\s+/gu, ' ').trim().slice(0, 200),
      error: item.error,
    })),
    committed: options.commit,
    warnings,
  };
}

async function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    console.log('Usage: node scripts/gmail-scan.mjs --window 1d [--commit] [--no-follow] [--cwd PATH]');
    return;
  }
  console.log(JSON.stringify(await runScan(options), null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exit(1);
  });
}
