# gmail-apply — Architecture (V3)

One-paragraph mental model:

> Node loops URLs. For each URL: run Playwright script, then spawn ONE haiku worker for that URL with a task-specific contract (External / Validate / Recover). Both write structured page-state evidence files. Node compares their claims. Agreement → write apps.md. Disagreement → opus reads both evidence files and decides. Missing worker evidence → opus uses chrome-devtools MCP itself to probe the live tab. Default path is zero-opus.

For the operating manual, read `.claude/skills/gmail-apply/SKILL.md`. This doc is the architectural map.

---

## What it does

Applies to job postings on supported portals (`nofluffjobs`, `theprotocol`, `xing`, `justjoinit`) using three layers:

1. **Playwright recipe** — `scripts/gmail-apply.mjs` connects to user-launched Chrome over CDP (port 9222), runs a yaml-defined recipe, captures evidence + emits `script_claim` ∈ {Applied, Failed, Unknown}. Detects redirects to external ATS at startup/mid-flow/new-tab.
2. **Per-URL haiku worker** — orchestrator spawns ONE worker per URL with a task-specific contract:
   - **External** — script bailed on redirect; worker fills external ATS via MCP.
   - **Validate** — script claims Applied; worker confirms via live DOM read, closes tab.
   - **Recover** — script Failed; worker reads DOM, fixes gap via MCP.
   Worker writes `evidence/<slug>-worker-<ts>.json` with raw page-state (modal_open, success_marker_visible, validator_errors) and emits stdout `claim`.
3. **Orchestrator agreement check + opus referee fallback** — Node compares script_claim vs worker_claim. Agreement → apps.md write. Disagreement → opus reads evidence files. No evidence → opus probes via MCP.

Two modes:
- **Single** — user passes URL. Skill (parent agent, opus) runs script, then handles worker role itself via MCP.
- **Batch** — no URL. `gmail-apply-batch.mjs --plan` then `--run`. Pure Node URL loop.

---

## Component map

```
                                   USER
                                     │ /gmail-apply [URL] [flags]
                                     ▼
                         ┌──────────────────────┐
                         │ .claude/skills/      │  Parent agent (opus).
                         │   gmail-apply/       │  Single vs batch decision.
                         │   SKILL.md           │  Reads --run final JSON.
                         │                      │  Resolves disputed +
                         │                      │  no_evidence cases.
                         └─────────┬────────────┘
                                   │
                       ┌───────────┴───────────┐
                 SINGLE│                       │BATCH
                       ▼                       ▼
             ┌──────────────────┐   ┌──────────────────────────────┐
             │ scripts/         │   │ scripts/gmail-apply-batch.mjs│
             │ gmail-apply.mjs  │   │   --plan       (build queue) │
             │ (Playwright)     │   │   --run        (URL loop)    │
             │                  │   │                              │
             │ Runs recipe.     │   │ Pure Node URL loop:          │
             │ Detects redirect │   │  for url in plan.urls:       │
             │ at startup,      │   │    spawn gmail-apply.mjs     │
             │ mid-flow,        │   │    pick task type            │
             │ new-tab.         │   │    spawn 1 haiku worker      │
             │ Emits            │   │    compare claims            │
             │ script_claim.    │   │    write apps.md OR flag     │
             │ Writes evidence. │   │      disputed/no_evidence    │
             └────────┬─────────┘   └──────────┬───────────────────┘
                      │                        │ per URL
                      │                        ▼
                      │              ┌─────────────────────┐
                      │              │ claude -p           │ Per-URL spawn:
                      │              │  --model haiku      │ - 1 URL + task type
                      │              │  --system-prompt-   │ - cached system prompt
                      │              │    file=…           │ - pre-digested context
                      │              │  --output-format    │ - MCP only (no script)
                      │              │    stream-json      │ - writes evidence file
                      │              │  …                  │ - emits stdout JSON
                      │              └──────────┬──────────┘ - exits
                      │                         │
                      │                         │ MCP work on persistent tab
                      │                         ▼
                      └────────────────► Chrome (port 9222 CDP) ◄──────────
                                                │
   Shared rule docs (single source of truth):
   - scripts/escalation-ladder.md      (tab safety, JS templates,
                                        external-ATS handover, success markers)
   - scripts/selector-quality-rules.md (Tier 1/2/3 selector hygiene)

   Per-run artifacts:
   - data/batch-runs/<run_id>/
       plan.json, profile.json,
       ledger.ndjson           (orchestrator events)
       url-verdicts.ndjson     (per-URL: claims + decision)
       steps.ndjson            (per-step from script)
       script-progress.ndjson  (per-URL script start/done)
       evidence/<slug>-<ts>.json           (script final-state)
       evidence/<slug>-redirect-<ts>.json  (script at redirect)
       evidence/<slug>-worker-<ts>.json    (worker page-state)  ← V3 NEW
       disputed-urls.ndjson    (opus-side review queue)
```

---

## File responsibilities

### Code (Node)

| File | Responsibility |
|------|----------------|
| `scripts/gmail-apply.mjs` | Single-URL Playwright applier. Runs recipe, captures evidence (final state + redirects), emits `script_claim` ∈ {Applied, Failed, Unknown}. |
| `scripts/gmail-apply-batch.mjs` | V3 orchestrator. Modes `--plan` (queue + run_dir) and `--run` (URL-by-URL loop, per-URL haiku spawn, agreement check, apps.md write). Pure Node — no LLM in parent. |

### Prompts

| File | Audience | Purpose |
|------|----------|---------|
| `.claude/skills/gmail-apply/SKILL.md` | Parent agent (opus) | Mode pick, single-URL flow, batch invocation, dispute/no-evidence resolution, output formats. |
| `scripts/gmail-apply-worker-prompt.md` | Haiku worker (`claude -p`) | Static system prompt. Single-URL contract. 3 task templates (External / Validate / Recover). Hard rules (file upload, dialog, captcha, framework writes-via-MCP). Output schema. |
| `scripts/escalation-ladder.md` | Both | Single source of truth — tab safety, JS templates, success markers, external-ATS handover. |
| `scripts/selector-quality-rules.md` | Both + `/explore-sender` | Selector hygiene. |

### Config + data

| Path | Purpose |
|------|---------|
| `config/gmail-apply-portals.yml` | Portal recipes. Only thing autofix mutates. |
| `config/profile.yml` | User profile. Orchestrator reads `candidate.*` once during `--plan`, writes subset to `data/batch-runs/<run_id>/profile.json`. Worker receives subset inline in task message. |
| `assets/cv/CV_www.ArshiaHemati.com_EN.pdf` | CV uploaded on external ATS via `mcp__chrome-devtools__upload_file`. |
| `data/applications.md` | Tracker. Orchestrator updates per URL (immediate visibility). |
| `data/gmail-apply-errors.ndjson` | Append-only forensic log across all runs. |
| `data/batch-runs/<run_id>/` | Per-run artifacts (see component map above). |
| `.mcp.json` | MCP config — workers spawn with `--strict-mcp-config`. |
| `launch-chrome.bat` | User runs once before any apply. |

---

## V3 URL flow (canonical)

```
For each URL in plan.urls:

  1. Run script:
       node gmail-apply.mjs <url> --force --experimental --run-id=<id>
     → script_claim ∈ {Applied, Failed, Unknown}

  2. Pick task type:
       redirect.detected   → External
       script_claim:Applied → Validate
       else                → Recover

  3. Spawn ONE haiku worker (single URL, task-specific context).
     Worker:
       - reads live DOM via mcp__chrome-devtools__evaluate_script
       - completes/validates application via MCP write tools
       - writes data/batch-runs/<id>/evidence/<slug>-worker-<ts>.json
       - emits stdout JSON with claim ∈ {Applied, Failed}
       - exits

  4. Orchestrator reads worker stdout + verifies evidence file exists.
     Missing evidence → respawn worker once.
     Still missing → flag no_evidence. Continue.

  5. Compare claims:
       agree Applied      → apps.md row Applied
       agree Failed       → apps.md row AutoApplyFailed
       script Unknown     → take worker claim
       Applied vs Failed  → disputed (no apps.md write)
       worker Unknown     → disputed
       no evidence        → no_evidence

  6. With --autofix and Applied via Recover branch:
     Log applied_via_mcp_recovery for opus to patch yaml.

  7. Append url-verdicts.ndjson row. Next URL.
```

After all URLs:
- Orchestrator emits `{applied, failed, disputed[], no_evidence[], autofixes, ms}`.
- Skill (opus) processes `disputed[]` by reading evidence files.
- Skill (opus) processes `no_evidence[]` via direct chrome-devtools MCP probe.

---

## Trust hierarchy

V3 has ONE source of truth: **page-state evidence files (script + worker)**.

`script_claim` and worker stdout `claim` are HINTS for the agreement check, never authority. When they disagree or evidence is missing, opus reads the actual page-state and decides.

| Source | Trust | When read |
|---|---|---|
| Worker page-state evidence file | high | always (orchestrator agreement check) |
| Script page-state evidence file | high | by opus on disputed cases |
| Live DOM via opus MCP probe | highest | by opus on no_evidence cases |
| Worker stdout `claim` | low | for agreement-rule input only |
| Script `script_claim` | low | for agreement-rule input only |

Lying in stdout while DOM contradicts → caught + flipped. Default path: file says success_marker present + modal closed → trust Applied.

---

## Mode pick

| User input | Mode | Driver |
|---|---|---|
| First positional starts with `http://` / `https://` | Single | Direct script + opus MCP if needed |
| No URL OR `--batch` flag | Batch | `gmail-apply-batch.mjs --plan` then `--run` |

---

## Flags

| Flag | Single | Batch | Effect |
|---|:---:|:---:|---|
| `<URL>` | required | n/a | Target URL. |
| `[N]` | n/a | optional | Cap on URLs this batch run. |
| `--force` | ✓ | ✓ | Auto-submit + escalate failures via worker. |
| `--submit` | ✓ |   | Submit only if every script step succeeded (no escalation). |
| `--autofix` | ✓ | ✓ | After Applied via Recover, surface yaml-patch candidate. |
| `--verbose` |   | ✓ | Tail worker tool_use to stderr. |
| `--dry-run` |   | ✓ | --plan only, no work. |
| `--batch` |   | ✓ | Force batch mode even with stray positional. |

V3 dropped: `--experimental`, `--experimental-succ`, `--retry-chunk`, `--run-chunk`, `--chunk SIZE`. Evidence is always on. Iteration is one URL at a time.

---

## Single-URL flow

```
1. Skill detects URL → single mode.
2. Skill runs:
     node scripts/gmail-apply.mjs <URL> [--force] [--autofix]
3. gmail-apply.mjs runs recipe, emits JSON with script_claim + evidence_path.
4. Skill branches on script_claim:
   - redirect.detected:true → External handover via MCP (opus IS the worker).
   - script_claim:Failed (no --force) → form filled, await user "send it".
   - script_claim:Failed (--force)    → Recover via MCP.
   - script_claim:Applied             → Validate via MCP.
5. Skill writes data/applications.md.
6. With --autofix and Applied via Recover: probe alts, patch yaml.
```

---

## Batch flow

```
1. Skill (no URL) → batch mode.
2. Skill runs --plan to get queue + run_id.
3. Skill runs --run --run-id=<id>.
   Orchestrator iterates queue URL-by-URL. Per URL:
     - spawns gmail-apply.mjs
     - picks task type
     - spawns 1 haiku worker (per URL spawn)
     - reads worker stdout + evidence file
     - applies agreement rule
     - writes apps.md or flags disputed/no_evidence
4. Skill reads --run final JSON.
5. For each disputed URL: skill reads worker evidence file, decides via decide() rules. Writes apps.md.
6. For each no_evidence URL: skill uses chrome-devtools MCP directly (list_pages → evaluate_script) to probe live tab. Decides. Writes apps.md.
7. Skill emits final summary.
```

---

## External ATS handover

Script detects redirect → emits `redirect` block with:
- `final_url`, `target_portal_match`, `framework_hint`, `simplify` (Simplify Copilot autofill result)

Orchestrator picks `External` task type → spawns worker. Worker:
- Branch A (Simplify pre-filled): gap-fill + submit + verify.
- Branch B (Simplify unsupported): full probe + fill + submit + verify.

Always writes `evidence/<slug>-worker-<ts>.json` with `external_ats_host` + `framework_detected` + final `page_state`.

Orchestrator marks Applied with `external_apply:true` (no yaml autofix on external — DOM not stable across runs).

---

## Output schemas

### `gmail-apply.mjs` JSON (per URL run)

```json
{
  "ok": true | false,
  "portal": "nofluffjobs",
  "url": "https://...",
  "run_id": "...",
  "experimental": true,
  "script_claim": "Applied" | "Failed" | "Unknown",
  "redirect": { /* present only on redirect detection — script_claim=Unknown */
    "detected": true, "original_url", "final_url", "target_portal_match",
    "framework_hint", "simplify": { ... }
  },
  "submit_selector": "...",
  "steps": [{ "i": 0, "action": "fill", "ok": true }, ...],
  "verification": { ... },
  "submitted": true | false,
  "submitted_unconfirmed": false,
  "submit_confirmation": { "kind": "success_selector_matched", "selector": "..." },
  "evidence_path": "data/batch-runs/.../evidence/...json",
  "error_log": "data/gmail-apply-errors.ndjson"
}
```

### Worker JSON (per URL)

```json
{
  "url": "<url>",
  "claim": "Applied" | "Failed",
  "task_type": "External" | "Validate" | "Recover",
  "external_apply": true | false,
  "evidence_path": "data/batch-runs/.../evidence/<slug>-worker-<ts>.json",
  "external_ats_host": "<host or null>",
  "framework_detected": { "angular": bool, "react": bool, "vue": bool, "workday": bool },
  "failed_field_name": null,
  "last_mcp_tool_used": null,
  "validator_error_text_observed": null,
  "reason": "<short>",
  "failure_kind": "<when claim=Failed>"
}
```

### Worker page-state evidence file

```json
{
  "ts": "<iso>",
  "run_id": "<id>",
  "url": "<url>",
  "task_type": "External" | "Validate" | "Recover",
  "claim": "Applied" | "Failed",
  "page_state": {
    "href": "<location.href>",
    "modal_open": true | false,
    "success_marker_visible": true | false,
    "success_marker_match": "<selector or text or null>",
    "validator_errors": ["...", "..."],
    "form_still_present": true | false,
    "url_changed_from_target": true | false
  },
  "framework_detected": { "angular": bool, "react": bool, "vue": bool, "workday": bool },
  "external_ats_host": "<host or null>",
  "reason": "<short>",
  "failure_kind": "<when claim=Failed>"
}
```

### `--plan` JSON

```json
{
  "ok": true, "mode": "plan",
  "run_id": "...", "run_dir": "...",
  "total_urls": 50,
  "urls": ["u1", "u2", ...],
  "preview": [...],
  "portal_counts": { ... }, "status_counts": { ... },
  "cv_path": "...",
  "flags": { "force": true, "autofix": true }
}
```

### `--run` JSON

```json
{
  "ok": true, "mode": "run", "run_id": "...",
  "total": 50,
  "applied": 47,
  "failed": 1,
  "disputed": [
    { "url", "num", "portal", "task_type",
      "script_claim", "worker_claim",
      "worker_evidence_path", "script_evidence_path",
      "reason" }
  ],
  "no_evidence": [
    { "url", "num", "portal", "task_type",
      "script_claim", "worker_err", "worker_diag", "reason" }
  ],
  "autofixes": 2,
  "ms": 1234567
}
```

---

## Strict success rules

**Recipe-applied (Validate task)**:
1. `location.href` is target URL (or same-origin same-job redirect).
2. Page-state shows `success_marker_visible:true` AND `modal_open:false` AND `validator_errors.length===0`.

**External-applied**:
1. `location.href` matches `redirect.final_url`.
2. Page-state shows URL changed to thanks/success/submitted/confirmation OR generic marker text present (multi-language list).
3. `form_still_present:false` OR no validator errors.

**Recovery-applied**:
- Same as Recipe-applied. Worker re-checks via probe after submit.

Any ambiguity → `claim:"Failed"`. URL on different domain than expected → fail. "Modal closed but no success indicator" → fail.

---

## Token economics

| Path | Cost per URL |
|---|---|
| Validate (script applies, worker confirms Applied) | 1 haiku spawn (~$0.001 cached) + 0 opus |
| Recover (script fails, worker fixes + applies) | 1 haiku spawn (~$0.003-0.008, more turns) + 0 opus |
| External | 1 haiku spawn (~$0.005-0.01) + 0 opus |
| Disputed | 1 haiku + opus reads 2 small JSON files (~500 tokens opus) |
| No evidence | 1-2 haiku (one respawn) + opus MCP probe (~2-4 MCP turns) |

Disputes expected <5%. No-evidence expected <1%. **Default path: zero opus tokens.**

---

## Architectural decisions

### KISS

- Node drives URL iteration. Haiku is leaf, never driver.
- One CDP source of truth: live tab state. Worker observes via MCP, opus probes via MCP only on missing evidence.
- One agreement function (~30 LOC) replaces V2's referee triangulator.

### YAGNI

- No `--experimental` toggles — evidence is always required for the agreement check.
- No referee post-chunk audit — every URL adjudicated live.
- No worker timeout / turn cap beyond a 6-minute safety SIGKILL — workers are tiny (1 URL of context).
- No needs-investigation queue — outcomes are {Applied, AutoApplyFailed, disputed, no_evidence}, all explicit.

### SOLID

- **SRP.** `gmail-apply.mjs` = recipe + redirect detect + script_claim. `gmail-apply-batch.mjs` = iteration + per-URL spawn + agreement + apps.md write. Worker prompt = MCP work for one URL with one of three contracts.
- **OCP.** New portal = new yaml entry, no script change. New task type = one new branch in worker prompt + orchestrator picker.
- **DIP.** Orchestrator depends on yaml abstraction + profile abstraction. No raw selectors in orchestrator.

### DRY

- Tab safety, JS templates, success determination canonical at `scripts/escalation-ladder.md`.
- Selector quality canonical at `scripts/selector-quality-rules.md`.
- Profile data path: orchestrator reads `config/profile.yml` once, workers receive subset inline. No worker reads profile.yml directly.

---

## Caveats / known issues

- **Caveman SessionStart hook** prepends ~40 k tokens to every worker spawn. Cache stays warm. Worker prompt strictly outputs JSON; voice contradiction resolved by output schema.
- **MCP warm-up**: first `mcp__chrome-devtools__list_pages` may take ~2 s.
- **Per-URL worker spawn latency**: ~5-10s setup per URL. Caching keeps marginal cost low.
- **Hard cap per worker**: 6 min SIGKILL. If hit, evidence file may be missing → no_evidence path triggers.
- **Redirects detected in 3 places**: startup, mid-flow same-tab, mid-flow new-tab. All three emit the same `redirect` JSON shape.
- **Known-ATS framework hints.** When redirect's `final_url` matches a known framework-protected ATS host (Workday, Greenhouse, Lever, Recruitify, Traffit, SmartRecruiters, Workable, Jobvite, iCIMS, Taleo, SuccessFactors), script populates `redirect.framework_hint`. Worker uses verbatim, skipping its own framework probe.
- **External-ATS write rule.** WRITES on external ATS forms MUST use chrome-devtools MCP write tools. `evaluate_script` for `.value=`/`dispatchEvent` FORBIDDEN — framework-bound inputs reject.
- **3-strike per field.** External-ATS fills cap at 3 strategies per field, 12 MCP write attempts per URL total.
- **Simplify Copilot pre-fill** runs on every redirect via `gmail-apply.mjs`. Result attached to `redirect.simplify`. Worker reads + branches.

---

## How to extend

| Goal | Where to change |
|---|---|
| New portal | `config/gmail-apply-portals.yml`. Use `/explore-sender <URL>`. No code change. |
| New action type (Playwright) | `scripts/gmail-apply.mjs` → `runStep()` switch + yaml schema + worker prompt's hard rules. |
| New eligibility status | Whitelist in `gmail-apply-batch.mjs` `modePlan()`. |
| Tighten escalation rules | `scripts/escalation-ladder.md` only. Both single + batch pick it up. |
| Add external-ATS field types | Worker prompt § "TASK_TYPE = External" probe list. |
| Stricter selector hygiene | `scripts/selector-quality-rules.md` only. |
| Live monitor format | `gmail-apply-batch.mjs` → `child.stdout.on('data', …)` block. |
| Extra profile fields | Extend `loadProfileForWorker()` projection + worker prompt's profile block + handover probe list. |

---

## Quick command reference

### Single URL

```bash
# Fill, verify, stop before submit
node scripts/gmail-apply.mjs https://nofluffjobs.com/job/...

# Fill + submit + escalate failures via worker
node scripts/gmail-apply.mjs https://... --force

# Through the skill (recommended) — opus handles MCP if needed
/gmail-apply https://...
/gmail-apply https://... --force --autofix
```

### Batch

```bash
# Plan
node scripts/gmail-apply-batch.mjs --plan 50 --force --autofix

# Run (single command — drives whole queue)
node scripts/gmail-apply-batch.mjs --run --run-id=<from-plan> --force --autofix --verbose

# Through the skill (recommended)
/gmail-apply
/gmail-apply --force --autofix --verbose
/gmail-apply --batch --dry-run
```

Prereq: `launch-chrome.bat` running.

---

## V2 → V3 deletions (no backward compat)

- ~~`scripts/gmail-apply-referee.mjs`~~ — replaced by inline 30-LOC agreement function in batch.mjs.
- ~~`needs-investigation.ndjson`~~ — replaced by `disputed-urls.ndjson` (only ambiguous-after-opus cases).
- ~~`--experimental` / `--experimental-succ` flags~~ — evidence always on.
- ~~`--retry-chunk` / `--run-chunk` modes~~ — single `--run` mode.
- ~~`--chunk SIZE` flag~~ — workers are per-URL.
- ~~Chunk-as-worker-batch concept~~ — Node drives loop instead.
- ~~Referee post-chunk triangulation~~ — agreement check is live per URL.
- ~~Worker H0/H7 (sequential + tab dedup across URLs)~~ — irrelevant under one-URL-per-spawn (H6 keeps single-URL tab dedup).
- ~~`token_telemetry_summary` per chunk~~ — per-URL workers can't approach context limits.
