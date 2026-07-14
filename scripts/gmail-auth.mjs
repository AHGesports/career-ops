#!/usr/bin/env node
import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { resolve } from 'node:path';

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost';

if (!clientId || !clientSecret) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env first.');
  process.exit(1);
}

const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  access_type: 'offline',
  prompt: 'consent',
  scope: 'https://www.googleapis.com/auth/gmail.readonly',
});

console.log('Open this URL and approve read-only Gmail access:\n');
console.log(`https://accounts.google.com/o/oauth2/v2/auth?${params}\n`);
console.log('After Google redirects, paste either the full redirect URL or its code value.');

const rl = createInterface({ input, output });
const answer = (await rl.question('Redirect URL or code: ')).trim();
rl.close();

let code = answer;
try {
  if (/^https?:/i.test(answer)) code = new URL(answer).searchParams.get('code') || '';
} catch {
  code = '';
}
if (!code) {
  console.error('No OAuth code found.');
  process.exit(1);
}

const response = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
    grant_type: 'authorization_code',
  }),
});
const payload = await response.json();
if (!response.ok || !payload.refresh_token) {
  console.error(`OAuth token exchange failed: ${response.status} ${JSON.stringify(payload)}`);
  process.exit(1);
}

const envPath = resolve('.env');
const current = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const line = `GMAIL_REFRESH_TOKEN=${payload.refresh_token}`;
const next = /^GMAIL_REFRESH_TOKEN=.*$/m.test(current)
  ? current.replace(/^GMAIL_REFRESH_TOKEN=.*$/m, line)
  : `${current.trimEnd()}${current.trim() ? '\n' : ''}${line}\n`;
writeFileSync(envPath, next, 'utf8');
console.log('Saved GMAIL_REFRESH_TOKEN to .env. Gmail access is read-only.');
