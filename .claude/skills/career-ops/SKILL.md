---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
user_invocable: true
args: mode
argument-hint: "[scan | gmail | deep | pdf | oferta | ofertas | apply | batch | tracker | pipeline | contacto | training | project | interview-prep | update]"
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
| `scan` | `scan` |
| `gmail` / `gmail-scan` / `scan-gmail` / `scan gmail` | `gmail-remote-scan` (ALWAYS delegated to subagent — see Dispatch below) |
| `batch` | `batch` |
| `patterns` | `patterns` |
| `followup` | `followup` |

**Auto-pipeline detection:** If `{{mode}}` is not a known sub-command AND contains JD text (keywords: "responsibilities", "requirements", "qualifications", "about the role", "we're looking for", company name + role) or a URL to a JD, execute `auto-pipeline`.

**Gmail-scan detection:** If `{{mode}}` matches natural-language patterns like "scan gmail", "scan gmail for latest remote work", "check gmail for new jobs", "read gmail alerts", or the literal word `gmail` alone → execute `gmail-remote-scan` mode **via subagent delegation** (see Dispatch section).

If `{{mode}}` is not a sub-command AND doesn't look like a JD, show discovery.

---

## Discovery Mode (no arguments)

Show this menu:

```
career-ops -- Command Center

Available commands:
  /career-ops {JD}      → AUTO-PIPELINE: evaluate + report + PDF + tracker (paste text or URL)
  /career-ops pipeline  → Process pending URLs from inbox (data/pipeline.md)
  /career-ops oferta    → Evaluation only A-F (no auto PDF)
  /career-ops ofertas   → Compare and rank multiple offers
  /career-ops contacto  → LinkedIn power move: find contacts + draft message
  /career-ops deep      → Deep research prompt about company
  /career-ops pdf       → PDF only, ATS-optimized CV
  /career-ops training  → Evaluate course/cert against North Star
  /career-ops project   → Evaluate portfolio project idea
  /career-ops tracker   → Application status overview
  /career-ops apply     → Live application assistant (reads form + generates answers)
  /career-ops scan      → Scan portals and discover new offers
  /career-ops gmail     → Scan hemati.arshia82@gmail.com job-alerts → append to pipeline.md (subagent)
  /career-ops batch     → Batch processing with parallel workers
  /career-ops patterns  → Analyze rejection patterns and improve targeting
  /career-ops followup  → Follow-up cadence tracker: flag overdue, generate drafts

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

### `gmail-remote-scan` dispatch (ALWAYS subagent)

When `{{mode}}` resolves to `gmail-remote-scan` (triggered by `/career-ops gmail`, `/career-ops gmail-scan`, or natural language "scan gmail"):

1. **Do not execute in main session.** Launch a subagent that holds the full scan context + does the work in isolation.
2. Subagent prompt MUST contain:
   - Full `modes/gmail-remote-scan.md` content (workflow + fallback tables + dedup rules + error handling)
   - Reference to `data/gmail-scan-history.tsv` (for dedup by message_id)
   - Reference to `data/pipeline.md` (for dedup by URL + write target)
   - Reference to `data/applications.md` (for dedup against already-tracked)
   - Gmail account: `hemati.arshia82@gmail.com`
   - Default time window: `newer_than:1d` (user may override — pass argument verbatim if given)
3. Subagent is **general-purpose** type — has access to Gmail MCP tools, WebFetch, Bash, Edit.
4. Run in **foreground** (not background) — user waits for results + summary. Typical duration: 2-5 min.

Template:

```
Agent(
  subagent_type="general-purpose",
  description="career-ops gmail scan",
  prompt="""
You are running the career-ops `gmail-remote-scan` mode.

**Target account**: hemati.arshia82@gmail.com (verify via Gmail MCP; abort if wrong).

**Working dir**: C:\\Users\\a.hemati\\source\\repos\\me\\jj\\career-ops

**Time window (user arg)**: {window | default "newer_than:1d"}

**Required reading (in order)**:
1. `modes/gmail-remote-scan.md` — your complete workflow spec (fallback URL table, dedup rules, error handling, per-sender parse patterns, empty-body fallback for JJIT/NFJ)
2. `data/gmail-scan-history.tsv` — list of thread_ids already scanned (skip these)
3. `data/pipeline.md` — for URL dedup against existing Pendientes + Procesadas
4. `data/applications.md` — for dedup against tracker

**Required MCP tools**: Load Gmail MCP schemas via ToolSearch:
  `ToolSearch("select:mcp__9c2f012f-b756-4053-8783-0579309d8ee8__search_threads,mcp__9c2f012f-b756-4053-8783-0579309d8ee8__get_thread,mcp__9c2f012f-b756-4053-8783-0579309d8ee8__list_labels")`

**Critical reminders (common bugs to avoid)**:
- EVERY JJIT/NFJ unread email MUST trigger the fallback scrape — the complete fallback URL table in gmail-remote-scan.md has `.NET`, `C#`, `JavaScript`, `Angular`, `TypeScript`, `Python`, `Java`, `Node` mappings. Never skip an email because its filter is "unmapped" — use the closest match.
- For NFJ emails: subject is in Polish (`Nowe oferty pracy, N dopasowane do Twoich kryteriów: X, Y, Z`). Parse after `kryteriów:` for filter chips.
- Indeed sponsored URLs (`/pagead/clk`) — ALWAYS skip. Only keep `/rc/clk?jk=X` direct or normalized `/viewjob?jk=X`.
- Filter slugs containing `lead-`, `principal-`, `staff-`, `junior-`, `intern-`, `trainee-` before appending.
- Append new URLs to `## Pendientes` section of `data/pipeline.md`; update `data/gmail-scan-history.tsv` with every processed thread_id (one row per).

**Output**:
  1. Append new URLs to `data/pipeline.md` under `## Pendientes`
  2. Append rows to `data/gmail-scan-history.tsv`
  3. Return to main session a summary table:
     - Total threads seen / skipped as already-scanned / newly processed
     - URLs extracted / deduped / added
     - Breakdown by sender
     - Any errors / empty-body fallbacks triggered

**Do NOT**:
  - Evaluate jobs (that is `/career-ops pipeline` — separate step)
  - Mark Gmail messages read (MCP doesn't expose the API; user manages read state)
  - Modify `applications.md` directly
  - Delete any Gmail data
"""
)
```

Return the subagent's summary to the user verbatim. Do not add extra commentary beyond a one-line lead-in.
