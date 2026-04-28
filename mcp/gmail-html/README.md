# gmail-html-mcp

Local MCP server exposing Gmail messages with **full HTML body**.

## Why this exists

The default Gmail MCP in this project (`9c2f012f-...`) only returns `plaintextBody`. For senders that send HTML-only emails (NoFluffJobs, JustJoinIt, Stepstone digests rendered in HTML), the body comes back as `null`.

This server wraps Google's official `googleapis` SDK and returns the parsed multipart message — both `html` and `plain` parts when present.

## Trust surface

- **No third-party MCP code** beyond this repo. ~140 lines you can audit.
- **Read-only OAuth scope** (`https://www.googleapis.com/auth/gmail.readonly`). Cannot send, modify, label, or delete mail.
- **Local token storage** at `~/.gmail-html-mcp/token.json`. Never leaves your machine.
- Network calls only to `googleapis.com`.

## Setup

### 1. Google Cloud OAuth client (one-time)

1. Open https://console.cloud.google.com/apis/credentials
2. Create a project (or reuse existing).
3. Enable the **Gmail API** under APIs & Services → Library.
4. APIs & Services → OAuth consent screen → set up as "External", add your Gmail as test user.
5. Credentials → Create Credentials → OAuth client ID → Application type **Desktop app**.
6. Download the JSON.
7. Save it as `credentials.json` in `%USERPROFILE%\.gmail-html-mcp\` (Windows) or `~/.gmail-html-mcp/` (mac/linux).

### 2. Install + auth

```bash
cd mcp/gmail-html
npm install
npm run auth
```

The auth script prints a URL. Open it, sign in with `hemati.arshia82@gmail.com`, approve. Paste the code back into the terminal. Token saves to `~/.gmail-html-mcp/token.json`.

### 3. Wire up MCP server

Add to your project `.mcp.json` (already done by the skill author — see project root). Or, for Claude Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gmail-html": {
      "command": "node",
      "args": ["C:\\Users\\a.hemati\\source\\repos\\me\\jj\\career-ops\\mcp\\gmail-html\\index.mjs"]
    }
  }
}
```

Restart Claude Code / Desktop. The server's tools (`get_message_full`, `get_thread_full`, `list_messages`) appear under MCP server `gmail-html`.

### 4. Allowlist the tools

Edit `.claude/settings.local.json` to add the new tool names:

```json
"mcp__gmail-html__get_message_full",
"mcp__gmail-html__get_thread_full",
"mcp__gmail-html__list_messages"
```

## Tools exposed

| Tool | Input | Returns |
|---|---|---|
| `get_message_full` | `messageId` | `{id, threadId, subject, from, to, date, snippet, html, plain}` |
| `get_thread_full` | `threadId` | `{id, messages: [{...}]}` |
| `list_messages` | `query`, optional `pageSize`, `pageToken` | `{messages, nextPageToken}` — same query syntax as Gmail search bar |

## Scripts (the real interface for the scan-gmail skill)

The MCP server exists for ad-hoc HTML reads, but the `scan-gmail` skill no longer calls the MCP from agent context. All extraction is done by Node scripts under `scripts/`:

| Script | Purpose |
|---|---|
| `scripts/scan.mjs` | Orchestrator. One command, prints summary block. |
| `scripts/extract-urls.mjs` | Fetches Gmail, decodes per-sender, writes `runs/<ts>.json` |
| `scripts/follow-trackers.mjs` | Follows Case B tracker URLs via Playwright |
| `scripts/append-pipeline.mjs` | Atomically writes new URLs to `data/pipeline.md` + tsv |

Run via npm: `npm run scan -- --window 7d --commit`.

### Why scripts and not agent-side extraction

A real run hit "Prompt is too long" after the agent burned its context on raw HTML responses (each `get_message_full` returned 50-110k characters of HTML, forcing 8+ tool-result files saved to disk and complex Python parsing). All decoding logic now lives in plain Node — the agent runs one command and reads ~15 lines of summary. Token cost per scan is roughly constant regardless of window size.

To debug a new sender pattern: edit the script (plain Node, easy to add `console.error`), don't change the prompt.

## Revoking access

If you ever want to kill this:

1. https://myaccount.google.com/permissions → revoke the OAuth client
2. Delete `~/.gmail-html-mcp/token.json`
3. Remove the server entry from `.mcp.json`
