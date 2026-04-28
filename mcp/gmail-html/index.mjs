#!/usr/bin/env node
// gmail-html-mcp — minimal local MCP server for Gmail with full HTML body.
// Read-only scope. Trust surface = Google's official googleapis package + this file.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DIR = process.env.GMAIL_HTML_MCP_DIR || join(homedir(), '.gmail-html-mcp');
const CREDS_PATH = join(DIR, 'credentials.json');
const TOKEN_PATH = join(DIR, 'token.json');

const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf8'));
const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
const c = creds.installed || creds.web;

const oauth2 = new google.auth.OAuth2(c.client_id, c.client_secret, c.redirect_uris[0]);
oauth2.setCredentials(token);
const gmail = google.gmail({ version: 'v1', auth: oauth2 });

function extractBodies(payload) {
  const out = { html: null, plain: null };
  function walk(part) {
    if (!part) return;
    const data = part.body?.data;
    if (data) {
      const decoded = Buffer.from(data, 'base64url').toString('utf8');
      if (part.mimeType === 'text/html' && !out.html) out.html = decoded;
      else if (part.mimeType === 'text/plain' && !out.plain) out.plain = decoded;
    }
    if (part.parts) part.parts.forEach(walk);
  }
  walk(payload);
  return out;
}

function shapeMessage(msg) {
  const headers = Object.fromEntries(
    (msg.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value])
  );
  const { html, plain } = extractBodies(msg.payload);
  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: headers.subject || null,
    from: headers.from || null,
    to: headers.to || null,
    date: headers.date || null,
    snippet: msg.snippet || null,
    html,
    plain,
  };
}

const server = new Server(
  { name: 'gmail-html', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_message_full',
      description:
        'Fetch a Gmail message by ID with the full HTML body (and plaintext if present). Returns {id, threadId, subject, from, to, date, snippet, html, plain}. Use this for HTML-only senders (NFJ, JJIT) where the standard Gmail MCP returns null body.',
      inputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string', description: 'Gmail message ID (same as thread ID for single-message threads).' },
        },
        required: ['messageId'],
      },
    },
    {
      name: 'get_thread_full',
      description:
        'Fetch a Gmail thread by ID with full HTML bodies for every message. Returns {id, messages: [{id, subject, from, date, html, plain, snippet}, ...]}.',
      inputSchema: {
        type: 'object',
        properties: {
          threadId: { type: 'string' },
        },
        required: ['threadId'],
      },
    },
    {
      name: 'list_messages',
      description:
        'List Gmail message IDs matching a query. Same query syntax as Gmail search bar (newer_than:Xd, from:..., etc.). Returns {messages: [{id, threadId}, ...], nextPageToken}.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          pageSize: { type: 'integer', default: 50, maximum: 500 },
          pageToken: { type: 'string' },
        },
        required: ['query'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === 'get_message_full') {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: args.messageId,
      format: 'full',
    });
    return { content: [{ type: 'text', text: JSON.stringify(shapeMessage(res.data)) }] };
  }

  if (name === 'get_thread_full') {
    const res = await gmail.users.threads.get({
      userId: 'me',
      id: args.threadId,
      format: 'full',
    });
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          id: res.data.id,
          messages: (res.data.messages || []).map(shapeMessage),
        }),
      }],
    };
  }

  if (name === 'list_messages') {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: args.query,
      maxResults: args.pageSize ?? 50,
      pageToken: args.pageToken,
    });
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          messages: res.data.messages || [],
          nextPageToken: res.data.nextPageToken || null,
          resultSizeEstimate: res.data.resultSizeEstimate ?? null,
        }),
      }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
