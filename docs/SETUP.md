# Setup Guide

## Prerequisites

- An AI coding CLI — [Claude Code](https://claude.ai/code), Gemini CLI, Codex, Qwen Code, OpenCode, GitHub Copilot CLI, Antigravity CLI, or Grok Build CLI (see [Supported CLIs](SUPPORTED_CLIS.md))
- [Node.js](https://nodejs.org) 18+ and `git` (`npx` ships with Node — the installer refuses to run without them) — note: the Gemini CLI integration requires Node.js 20+
- (Optional) Go 1.21+ (for the dashboard TUI)

## Quick Start

### Recommended — one command

```bash
npx @santifer/career-ops init
```

`npx` ships with Node.js — it runs the installer once without installing anything globally. This clones the latest release into `./career-ops` and installs dependencies. Then move into the workspace and open your AI CLI:

```bash
cd career-ops
claude   # or codex / qwen / opencode / agy / grok
```

**On first launch, career-ops walks you through setup by chatting** — it asks for your CV, your details (name, target roles, salary), and sets up the job scanner with pre-configured companies. Nothing to edit by hand: just answer its questions. Then paste a job offer URL or description and it evaluates it, writes a report, generates a tailored PDF, and tracks it.

If you are using Codex, start the interactive session with `codex`. Slash commands are not guaranteed in Codex, so use the same mode names in a prompt if `/career-ops` is unavailable:

```text
Evaluate this JD with career-ops auto-pipeline: https://company.com/jobs/123
Run the career-ops scan mode.
Run the career-ops pipeline mode.
Run the career-ops pdf mode.
Run the career-ops email mode for the latest evaluated role. Draft only; never sends, submits, or clicks.
Run the career-ops tracker mode.
```

For one-shot workers or batch tasks in Codex, use `codex exec`. See [docs/CODEX.md](CODEX.md) for the full guide.

```bash
codex exec "Evaluate this JD with career-ops auto-pipeline: https://company.com/jobs/123"
codex exec "Run career-ops scan mode in this repo."
codex exec "Run career-ops pipeline mode for data/pipeline.md."
codex exec "Run career-ops pdf mode for the latest evaluated role."
codex exec "Run career-ops email mode for the latest evaluated role. Draft only; do not send, submit, or click anything."
codex exec "Run career-ops tracker mode and summarize the current statuses."
```

### Advanced — clone manually

<details>
<summary>Prefer to clone the repo yourself?</summary>

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
npm install
```

Then open your AI CLI in the folder — the same first-run onboarding applies. Use this path if you want to track a specific branch, contribute, or audit the code before installing dependencies.

</details>

### PDF rendering (one-time)

PDFs are rendered with a headless Chromium. Install it once per machine:

```bash
npx playwright install chromium
```

## Available Commands

| Action | How |
|--------|-----|
| Evaluate an offer | Paste a URL or JD text |
| Search for offers | `/career-ops scan` or ask the agent to run `scan` |
| Process pending URLs | `/career-ops pipeline` or ask the agent to run `pipeline` |
| Generate a PDF | `/career-ops pdf` or ask the agent to run `pdf` |
| Draft application email | `/career-ops email` or ask the agent to run `email`; draft-only, never sends, submits, or clicks |
| Batch evaluate | `/career-ops batch` or use `codex exec "Run career-ops batch mode ..."` |
| Check tracker status | `/career-ops tracker` or ask the agent to run `tracker` |
| Fill application form | `/career-ops apply` or ask the agent to run `apply` |
| Scan Gmail job alerts | `/scan-gmail 1d` or ask the agent to run the `scan-gmail` skill |
| Prepare evaluated applications | `/gmail-apply-smilified` or ask the agent to run that skill |

## Optional Gmail alert and form automation

The two optional skills reuse the same first-run profile as the rest of Career-Ops. They do not ship a candidate identity, profession, CV, cookies, or portal login.

1. Create a named profile with `node scripts/profile.mjs create <profile-id> --name "Display Name"`, or import an existing Career-Ops user layer with `node scripts/profile.mjs import <profile-id> --name "Display Name" --from <old-workspace>`.
2. Activate it with `node scripts/profile.mjs activate <profile-id>`. Switching profiles saves the current user layer before materializing the selected one. List or inspect them with `node scripts/profile.mjs list` and `node scripts/profile.mjs current`.
3. Set that profile's Gmail OAuth Desktop client id and secret in `.env`, then run `node scripts/gmail-auth.mjs`. The token is read-only and `.env` is stored separately with the active profile.
4. Add title aliases or exclusions to `gmail_classifier` in the active `config/profile.yml`. If omitted, Gmail classification derives phrases from `target_roles`.
5. Configure PDF resume paths under `application.resumes` in the active `config/profile.yml`.
6. Set `application.auto_submit: true` to grant standing submission permission, or leave it `false` to stop at a fully completed form. Configure the solver-extension wait with `application.captcha_wait_seconds`.
7. On Windows, run `launch-chrome.bat <profile-id> [debug-port]`, install the CAPTCHA extension in that named Chrome profile, and sign into its job portals. Browser data defaults to `%LOCALAPPDATA%\career-ops\chrome-profiles\<profile-id>`.

One workspace data profile is active at a time. Multiple named Chrome profiles can remain open concurrently when they use different debug ports; launching or activating a profile selects which data, CV, tracker, Gmail credentials, and browser endpoint the skills use. The dashboard follows that selection, hides data while a switch is in progress, and rebuilds without carrying report previews from the previous profile.

For scheduled operations, bind the whole command to its owner:

```bash
node scripts/profile.mjs run arshia-hemati -- node scripts/gmail-scan.mjs --window 1d --commit
node scripts/profile.mjs run hannah-aghaei -- node scripts/gmail-scan.mjs --window 1d --commit
```

The runner serializes these commands with profile creation, saving, activation, and other profile-scoped runs. A command that bypasses the runner is suitable only for sequential interactive work after an explicit `activate`; do not run direct commands for different profiles concurrently in one checkout.

The apply skill always finishes eligible applications. It submits without another prompt only when the user's profile explicitly enables `application.auto_submit`.

## Verify Setup

```bash
node cv-sync-check.mjs      # Check configuration
node verify-pipeline.mjs     # Check pipeline integrity
```

## Build Dashboard (Optional)

```bash
npm run serve:dashboard     # Opens TUI pipeline viewer
npm run build:dashboard     # Optional: build the standalone binary
```
