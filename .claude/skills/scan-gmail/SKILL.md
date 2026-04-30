---
name: scan-gmail
description: Scan a personal Gmail inbox for job-alert emails and append discovered job URLs to data/pipeline.md. Use this skill whenever the user asks to scan, sweep, ingest, or pull from Gmail for new job postings — including phrases like "scan gmail", "scan my gmail for new remote jobs", "check gmail alerts", "ingest job alerts from email", "pull jobs from inbox", "/scan-gmail [WINDOW]", or "/career-ops scan gmail [WINDOW]". The skill reads only — never modifies Gmail. It extracts URLs that appear inside the user's personalized alert emails; it never browses source job sites freely (that is a separate `/career-ops scan` task). Runs in the current session — never spawns a subagent. Default time window 24h, override via arg (`6h`, `72h`, `weekend`, `1w`, `month`, etc.).
---

# scan-gmail — Gmail inbox → pipeline.md

**Trigger**: `/career-ops scan gmail [WINDOW]` or `/scan-gmail [WINDOW]`.

**Execution model**: a Node CLI script does the heavy lifting. The agent's job is one Bash command and one summary read. Raw HTML never enters context.

---

## How it works (you do not implement the workflow — the script does)

The skill is implemented as scripts under `mcp/gmail-html/scripts/`:

1. `extract-urls.mjs` — fetches Gmail threads (via the `gmail-html` MCP's auth), reads `config/gmail-senders.yml`, decodes per-sender (direct / base64 / zlib / tracker / plaintext), dedups against scan-history + pipeline + tracker, writes a JSON run file to `mcp/gmail-html/runs/<timestamp>.json`. Stdout is a tight summary.
2. `follow-trackers.mjs` — for `extraction: tracker` senders (WTJ, XING, Stepstone), follows redirects via headless Playwright, writes resolved URLs back into the same JSON. Skipped if Playwright not installed.
3. `classify.mjs` — tags each URL as `auto-match` or `deferred` using regex from `config/profile.yml` → `gmail_classifier.match_keywords` / `match_excludes` against URL slug + email subject + sender. Excludes win.
4. `append-pipeline.mjs` — reads the JSON and routes:
   - `auto-match` URLs → `data/pipeline.md` (`[x] AUTO-MATCH | 5.0/5 | URL`) + one TSV per URL into `batch/tracker-additions/<date>-gmail-automatch-NNN.tsv` (status `Auto-Match`, score `5.0/5`).
   - `deferred` URLs → `data/pipeline-deferred.md` (`- [ ] URL | subject | sender | date`) — these await `/deeper-eval`.
   - All threads → `data/gmail-scan-history.tsv` for dedup.
   Dry-run by default; pass `--commit` to write.
5. `scan.mjs` — orchestrator that chains 1 → 2 → 3 → 4 and, on `--commit`, runs `merge-tracker.mjs` so auto-match TSVs land in `data/applications.md` (which the dashboard reads). Prints the canonical summary block.

---

## What the agent actually does

### Default flow

```bash
cd mcp/gmail-html && node scripts/scan.mjs --window {WINDOW}            # dry run, agent reviews
cd mcp/gmail-html && node scripts/scan.mjs --window {WINDOW} --commit   # writes to disk + merges into applications.md
```

That's it. The script prints a summary block including a `Classify: auto-match=X / deferred=Y` line. Relay it to the user.

### What the user gets after a `--commit` scan

Outputs split by URL shape so list/SERP/recommendation pages don't pollute applications.md:

- **`data/pipeline.md`** — auto-match URLs (single-job postings). Marked `[x] AUTO-MATCH | 5.0/5`. No further action needed; user opens URL and applies.
- **`data/applications.md`** — auto-match URLs as rows with status `Auto-Match`, score `5.0/5`. Dashboard reads this file.
- **`data/pipeline-deferred.md`** — generic single-job postings awaiting `/deeper-eval`. User runs `/deeper-eval` to evaluate these via WebFetch (Chrome MCP fallback) using `modes/oferta.md`.
- **`data/pipeline-lists.md`** — list / SERP / recommendation pages that resolved on a known job-board domain but are NOT single jobs (e.g. `stepstone.de/jobs/<query>`, `xing.com/jobs/find`). Open manually to discover more jobs; paste new findings into pipeline.md.

### Capture-loss warnings

The summary block raises `⚠️ CAPTURE-LOSS WARNINGS` when:
- A thread's `subject_expected_count` is greater than what was captured (subject claims N jobs, only got M).
- A tracker sender's drop-rate exceeds 50% (Playwright redirect chain failing or regex misfit).

If warnings appear, **do not commit**. Inspect the run JSON, decide whether to re-run with longer timeout or fix the sender pattern.

### Tuning the classifier

Keyword lists live in `config/profile.yml` under `gmail_classifier.match_keywords` and `gmail_classifier.match_excludes`. Patterns are JS regex applied AFTER URL slug normalization (`-_/?=&` → space, lowercased), so use `\b` word boundaries. If the scan misclassifies a URL, edit those lists and re-run.

### Window arg parsing (pass through to `--window`)

| User input | `--window` |
|---|---|
| (no arg) | `1d` |
| `6h`, `12h` | `6h`, `12h` |
| `24h` / `1d` / `today` | `1d` |
| `48h` / `2d` | `2d` |
| `72h` / `3d` / `weekend` | `3d` |
| `7d` / `week` / `1w` | `7d` |
| `14d` / `2w` | `14d` |
| `30d` / `month` / `1m` | `30d` |

Hours `>24` → days via `ceil(N/24)`.

### When the script flags `untested` senders

The summary will list them. Stop and ask the user before processing — pull one sample thread (`node scripts/extract-urls.mjs --thread <id> --json`), inspect, propose an `extraction` strategy, update `config/gmail-senders.yml`, then re-run the scan.

### When trackers fail or Playwright is missing

The summary shows `Trackers: N total / N resolved / N failed / N unresolved (no-follow)`. If unresolved > 0:
- Tell the user: *"N tracker URLs (WTJ/XING/Stepstone) need following. Run `cd mcp/gmail-html && npm run playwright:install` once, then re-run."* — or pass `--no-follow` to skip and accept the loss.

### Useful flags

- `--no-follow` — skip Case B (faster; trackers stay unresolved)
- `--rescan-giveup-only` — only re-process threads whose tsv note signals a prior giveup
- `--include-success` — re-process even success-skip threads (rare; e.g. after fixing a regex bug)

### Single-thread debug

```bash
node scripts/extract-urls.mjs --thread <thread_id> --json    # full JSON to stdout
```

---

## CORE RULES (still authoritative — script enforces them)

- **Email-bound**: only URLs that appear in the email itself. Source sites are off-limits to this skill (they're the `/career-ops scan` job).
- **Read-only Gmail**: no read-state changes, no labels, no sends. The MCP scope is `gmail.readonly`.
- **Chrome only for tracker resolution**: never on `mail.google.com`. The follow-trackers script uses headless Playwright; Chrome DevTools MCP is not used by the skill.
- **No subagents**: the user invoked the skill; do the work in the current session.
- **Untested senders**: the script halts auto-processing and surfaces them. Don't override.

---

## Adding a new sender

1. Inspect one real email body: `node scripts/extract-urls.mjs --thread <id> --json` and look at the result entry's `urls`/`trackers_to_follow`. If the sender isn't in yaml yet, the result will be `unknown sender` — fall back to direct googleapis fetch via the script with `--thread` to get the body length and HTML preview.
2. Decide the `extraction` (`direct` / `base64` / `zlib` / `tracker` / `plaintext`).
3. Append a sender entry to `config/gmail-senders.yml` with `email`, `extraction`, `pattern`, `final_shape`, `notes`.
4. Re-run `scan.mjs`. Done.

---

## Errors

| Situation | What happens |
|---|---|
| `gmail-html` MCP auth expired | extract-urls fails fast with `googleapis` error. Run `cd mcp/gmail-html && npm run auth`. |
| Playwright not installed | follow-trackers exits 2; orchestrator continues with unresolved trackers and prints install instructions. |
| Pipeline.md not writable | append-pipeline fails. Fix file permissions, re-run. |
| Verification mismatch (file delta != target) | append-pipeline exits 3; the disk state is preserved but flagged. Inspect manually. |

---

## Why scripts (lessons learned)

- Earlier versions of this skill had agents fetching HTML directly via the gmail-html MCP, then writing extraction logic inline in their reasoning. A real run hit "Prompt is too long" because each `get_message_full` returned 50-110k characters of HTML and the agent had to slice/decode them in-band.
- All decoding (regex, base64url, zlib, normalization, dedup) now lives in plain Node code under `scripts/`. The agent runs one bash command and reads ~15 lines of summary. Token cost per run is roughly constant regardless of window size.
- To debug a new pattern: instrument the script (it's plain Node, easy to add a `console.error` line), not the prompt.
