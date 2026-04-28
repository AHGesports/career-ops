#!/usr/bin/env node
// One-shot OAuth helper. Run: `node auth.mjs` or `npm run auth`.
// Reads credentials.json from ~/.gmail-html-mcp/, opens the consent URL,
// you paste the code from the redirect, token.json is saved.

import { google } from 'googleapis';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import readline from 'readline';

const DIR = process.env.GMAIL_HTML_MCP_DIR || join(homedir(), '.gmail-html-mcp');
const CREDS_PATH = join(DIR, 'credentials.json');
const TOKEN_PATH = join(DIR, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

if (!existsSync(CREDS_PATH)) {
  console.error(`Missing ${CREDS_PATH}.`);
  console.error('1. Go to https://console.cloud.google.com/apis/credentials');
  console.error('2. Create OAuth client ID, type "Desktop app".');
  console.error('3. Download JSON, save it as credentials.json in the dir above.');
  process.exit(1);
}

const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf8'));
const c = creds.installed || creds.web;
if (!c) {
  console.error('credentials.json missing `installed` or `web` block.');
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(c.client_id, c.client_secret, c.redirect_uris[0]);
const url = oauth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });

console.log('\n1. Open this URL in your browser:\n');
console.log(url);
console.log('\n2. Sign in to hemati.arshia82@gmail.com (or whichever account this skill targets).');
console.log('3. After approval, the page redirects to a localhost URL or shows a code.');
console.log('   Copy the code (everything after `code=` and before `&scope`).\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste code: ', async (codeRaw) => {
  const code = codeRaw.trim();
  try {
    const { tokens } = await oauth2.getToken(code);
    mkdirSync(dirname(TOKEN_PATH), { recursive: true });
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log(`\n✓ Token saved to ${TOKEN_PATH}`);
    console.log('  Scope: gmail.readonly (cannot send, modify, or delete mail).');
    console.log('  Refresh token included → no re-auth needed unless revoked.\n');
  } catch (e) {
    console.error('Token exchange failed:', e.message);
    process.exit(1);
  }
  rl.close();
});
