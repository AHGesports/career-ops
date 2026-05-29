---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
user_invocable: true
args: mode
argument-hint: "[scan [gmail [6h|24h|72h|7d|...] | portals] | deep | pdf | oferta | ofertas | apply | batch | tracker | pipeline | contacto | training | project | interview-prep | update]"
---

# career-ops -- Router

## Mode Routing

Determine the mode from `{{mode}}`:

| Input | Mode |
|-------|------|
| (empty / no args) | `discovery` -- Show command menu |
| JD text or URL (no sub-command) | **`auto-pipeline`** |
| `oferta` | `oferta` |
| `ofertas` | `ofertas` |
| `contacto` | `contacto` |
| `deep` | `deep` |
| `pdf` | `pdf` |
| `training` | `training` |
| `project` | `project` |
| `tracker` | `tracker` |
| `pipeline` | `pipeline` |
| `apply` | `apply` |
| `gmail-apply [URL]` | invoke `gmail-apply` skill (delegate, see below) |
| `gmail-apply-batch [N] [--force]` | run batch orchestrator (delegate, see below) |
| `explore-sender [URL]` | invoke `explore-sender` skill (delegate, see below) |
| `scan` (no sub-arg) / `scan portals` | `scan` (portal scanner) |
| `scan gmail [WINDOW]` | `scan-gmail` (ALWAYS subagent — see Dispatch) |
| `batch` | `batch` |
| `patterns` | `patterns` |
| `followup` | `followup` |

**Auto-pipeline detection:** If `{{mode}}` is not a known sub-command AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL to a JD, execute `auto-pipeline`.

If `{{mode}}` is not a sub-command AND doesn't look like a JD, show discovery.

---

## Discovery Mode (no arguments)

Show this menu:

```
career-ops -- Command Center

Available commands:
  /career-ops {JD}             → AUTO-PIPELINE: evaluate + report + PDF + tracker
  /career-ops pipeline         → Process pending URLs from inbox (data/pipeline.md)
  /career-ops oferta           → Evaluation only A-F (no auto PDF)
  /career-ops ofertas          → Compare and rank multiple offers
  /career-ops contacto         → LinkedIn power move: find contacts + draft message
  /career-ops deep             → Deep research prompt about company
  /career-ops pdf              → PDF only, ATS-optimized CV
  /career-ops training         → Evaluate course/cert against North Star
  /career-ops project          → Evaluate portfolio project idea
  /career-ops tracker          → Application status overview
  /career-ops apply            → Live application assistant (reads form + generates answers)
  /career-ops scan             → Scan portals and discover new offers (default)
  /career-ops scan portals     → Same as above (explicit)
  /career-ops scan gmail [W]   → Scan Gmail job-alerts → append to pipeline.md (subagent)
  /career-ops batch            → Batch processing with parallel workers
  /career-ops patterns         → Analyze rejection patterns and improve targeting
  /career-ops followup         → Follow-up cadence tracker: flag overdue, generate drafts
  /career-ops gmail-apply <URL> [--force] [--autofix]   → Auto-fill apply form via Playwright
  /career-ops gmail-apply-batch [N] [--force] [--autofix] → Batch apply via cheap per-URL workers
  /career-ops explore-sender <URL>  → Inspect portal form, generate yaml recipe

Inbox: add URLs to data/pipeline.md → /career-ops pipeline
Or paste a JD directly to run the full pipeline.
```

---

## Context Loading by Mode

After determining the mode, load the necessary files before executing:

### Modes that require `_shared.md` + their mode file:
Read `modes/_shared.md` + `modes/{mode}.md`

Applies to: `auto-pipeline`, `oferta`, `ofertas`, `pdf`, `contacto`, `apply`, `pipeline`, `scan`, `batch`

### Standalone modes (only their mode file):
Read `modes/{mode}.md`

Applies to: `tracker`, `deep`, `training`, `project`, `patterns`, `followup`

### Modes delegated to subagent:
For `scan`, `apply` (with Playwright), and `pipeline` (3+ URLs): launch as Agent with the content of `_shared.md` + `modes/{mode}.md` injected into the subagent prompt.

```
Agent(
  subagent_type="general-purpose",
  prompt="[content of modes/_shared.md]\n\n[content of modes/{mode}.md]\n\n[invocation-specific data]",
  description="career-ops {mode}"
)
```

Execute the instructions from the loaded mode file.

---

## `gmail-apply [URL]` — delegate to `gmail-apply` skill

When `{{mode}}` starts with `gmail-apply` AND has a URL arg, invoke `Skill("gmail-apply", args="<URL>")`. Do NOT navigate, snapshot, or read the page first — the skill handles everything. Pass the URL through verbatim.

## `explore-sender [URL]` — delegate to `explore-sender` skill

When `{{mode}}` starts with `explore-sender`, invoke `Skill("explore-sender", args="<URL>")`. The skill handles MCP navigation, form mapping, yaml generation, and success_selector capture. Pass the URL verbatim.

## `gmail-apply-batch [N] [--force]` — batch orchestrator

When `{{mode}}` starts with `gmail-apply-batch`, do NOT spawn an Agent. Run the orchestrator script directly:

```bash
node scripts/gmail-apply-batch.mjs [N] [--force]
```

For Codex, add `--worker-provider=codex` or set `CAREER_OPS_WORKER_PROVIDER=codex`.

The script:
- Reads `data/applications.md`, picks rows with status=`Evaluated` and a matching portal recipe
- Skips URLs that have failed ≥3 times in the last 7 days
- Spawns cheap per-URL workers from `scripts/gmail-apply-batch.mjs`.
- Claude runs use `claude -p --model haiku`; Codex runs should pass `--worker-provider=codex` and use `gpt-5.4-mini` by default.
- Workers handle each URL via `scripts/gmail-apply.mjs` + chrome-devtools MCP escalation
- Aggregates results, single-pass rewrites `applications.md` statuses (`Applied` or `AutoApplyFailed`)
- Logs to `data/gmail-apply-batch-<date>.ndjson` and `data/gmail-apply-errors.ndjson`

Args:
- `N` (optional integer) — max URLs to process. Default: all eligible.
- `--force` — auto-submit on every URL. Required for unattended runs.
- `--dry-run` — preview queue, don't spawn workers.

You only relay the JSON output — do not re-narrate per-URL details. Final summary message: counts + log paths.

---

## `scan gmail` — delegate to `scan-gmail` skill

When `{{mode}}` resolves to `scan gmail [WINDOW]`, invoke `Skill("scan-gmail", args="<WINDOW>")`. The skill handles window parsing, sender config, workflow, summary, verification.

**The scan runs in the current session — never delegate to a subagent.** The skill explicitly forbids subagent spawning.

It auto-triggers on natural-language phrases ("scan my gmail", "ingest job alerts", etc.) — `/career-ops` prefix is just one entry point.
