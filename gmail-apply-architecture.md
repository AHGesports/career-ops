# gmail-apply — Architecture

This document is the single page to read if you want to understand how the
gmail-apply system works end-to-end. Components, data flow, two operating
modes, every flag, error handling, design trade-offs (KISS/YAGNI/SOLID/DRY).

For the canonical operating manual, read
`.claude/skills/gmail-apply/SKILL.md`. This doc is a higher-level map.

---

## What it does

Applies to job postings on supported portals (currently `nofluffjobs`,
`theprotocol`, `xing`, `justjoinit`) using three collaborating layers:

1. **Playwright form fill** — `scripts/gmail-apply.mjs` connects to a user-
   launched Chrome over CDP (port 9222) and runs a yaml-defined recipe per
   portal. Detects redirects to external ATS at startup and bails out
   cleanly so the agent can take over via MCP.
2. **LLM escalation when the recipe breaks OR external ATS** — the worker
   (batch) or parent agent (single) uses `chrome-devtools` MCP to probe the
   live DOM, fix selectors on the fly, OR fill a generic external ATS form
   using the user's profile + CV upload.
3. **Optional self-healing** — `--autofix` patches
   `config/gmail-apply-portals.yml` with a Tier-1 selector after a real
   Applied via escalation. In batch mode, this happens **mid-batch** so
   later chunks benefit. URLs that failed before the patch get a retry
   pass at the end.

Two modes:

- **Single** — user passes a URL.
- **Batch** — no URL → parent agent (the skill) drives a per-chunk loop
  over every applications.md row with status `Evaluated` or `Auto-Match`.
  Sequential, default 2 URLs per chunk.

---

## Component map

```
                          USER
                            │ /gmail-apply [URL] [flags]
                            ▼
                ┌──────────────────────┐
                │ .claude/skills/      │  Parent agent / orchestrator.
                │   gmail-apply/       │  Decides single vs batch,
                │   SKILL.md           │  drives chunk loop in batch.
                └─────────┬────────────┘
                          │
              ┌───────────┴───────────┐
        SINGLE│                       │BATCH (parent loops chunks)
              ▼                       ▼
    ┌──────────────────┐   ┌──────────────────────────────┐
    │ scripts/         │   │ scripts/gmail-apply-batch.mjs│
    │ gmail-apply.mjs  │   │   --plan        (build queue)│
    │ (Playwright)     │   │   --run-chunk   (one chunk)  │
    │                  │   │   --retry-chunk (retry pass) │
    │ Detects redirect │   │ Loads profile.yml subset +   │
    │ at startup,      │   │ CV path. Spawns 1 haiku      │
    │ exits early.     │   │ worker per chunk via         │
    └────────┬─────────┘   │ `claude -p`. Updates apps.md │
             │             │ incrementally.               │
             │             └──────────┬───────────────────┘
             │                        │ per chunk:
             │                        ▼
             │              ┌─────────────────────┐
             │              │ claude -p           │  Each spawn:
             │              │  --model haiku      │  - static cached prompt
             │              │  --system-prompt-   │  - stream-json output
             │              │    file=…           │  - profile + CV path
             │              │  --output-format    │    in task message
             │              │    stream-json      │  - tool calls run the
             │              │  …                  │    Playwright script
             │              └──────────┬──────────┘
             │                         │ runs `node scripts/gmail-apply.mjs`
             │                         │ once per URL it was assigned
             │                         ▼
             └────────────────► Same Playwright applier ◄───────────────
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │ Chrome (user-launched, │
                            │ port 9222 CDP)         │
                            └────────────────────────┘

   Shared rule docs (single source of truth):
   - scripts/escalation-ladder.md      (tab safety, 4-step ladder, JS templates,
                                        external-ATS handover, success markers)
   - scripts/selector-quality-rules.md (Tier 1/2/3 selector hygiene)

   Per-run artifacts:
   - data/batch-runs/<run_id>/
       plan.json, profile.json, ledger.ndjson, steps.ndjson,
       evidence/<slug>-*.json
```

---

## File responsibilities

### Code (Node)

| File | Responsibility |
|------|----------------|
| `scripts/gmail-apply.mjs` | Single-URL Playwright applier. Connects via CDP, detects redirect after navigation, matches URL to a portal recipe, runs yaml-defined steps, optionally submits, races `success_selector` to confirm. With `--experimental` writes per-step ndjson + DOM evidence. Emits one JSON line on stdout. |
| `scripts/gmail-apply-batch.mjs` | Batch orchestrator helper with three modes: `--plan` (compute queue + chunks, write run_dir + profile.json), `--run-chunk` (spawn one haiku worker for given URLs, update apps.md), `--retry-chunk` (same but logged as retry). Reads `data/applications.md`, picks `Evaluated`/`Auto-Match` rows, dedups URLs. Pure Node — no LLM in the parent process. |

### Prompts (Markdown, read by agents)

| File | Audience | Purpose |
|------|----------|---------|
| `.claude/skills/gmail-apply/SKILL.md` | Parent agent | Mode pick, single-URL flow, batch chunk-loop logic, two-flag semantics, autofix, output formats. |
| `scripts/gmail-apply-worker-prompt.md` | Haiku worker (`claude -p`) | Static system prompt loaded via `--system-prompt-file`. Task contract, External ATS handover steps, output JSON schema, `autofix_eligible` rules, hard rules. References ladder + selector docs instead of duplicating. |
| `scripts/escalation-ladder.md` | Both | **Single source of truth** — tab safety, 4-step ladder, JS templates, success determination, External ATS generic success markers. |
| `scripts/selector-quality-rules.md` | Both + `/explore-sender` | **Single source of truth** for selector hygiene. |

### Config + data

| Path | Purpose |
|------|---------|
| `config/gmail-apply-portals.yml` | Portal recipes — `match`, `steps`, `data`, `submit_selector`, `success_selector`, `success_timeout_ms`, `label_aliases`. Only thing autofix is allowed to mutate. |
| `config/profile.yml` | User profile. Orchestrator reads `candidate.*` once during `--plan`, writes a small subset (full_name/first/last, email, phone, location, linkedin, portfolio, github + CV path) to `data/batch-runs/<run_id>/profile.json`. Worker receives the subset inline in the task prompt. |
| `assets/cv/CV_www.ArshiaHemati.com_EN.pdf` | The CV uploaded on external ATS. Absolute path injected into worker task prompt; worker uses `mcp__chrome-devtools__upload_file`. |
| `data/applications.md` | Tracker. Batch reads it for queue + writes status updates back **incrementally per chunk** (so mid-batch failures are visible). |
| `data/gmail-apply-errors.ndjson` | Append-only forensic log across all runs. Phases: `step`, `verify`, `submit`, `submit_unconfirmed`, `escalation`, `selector_fix`, `script_extension_needed`, `worker_chunk_failure`, `yaml_autofix`, `autofix_skipped`, `autofix_failed`, `redirect_to_external`, `applied_invalidated`. |
| `data/batch-runs/<run_id>/` | Per-run dir: `plan.json`, `profile.json`, `ledger.ndjson` (orchestrator events), `steps.ndjson` (per-step records from the Playwright script), `evidence/<slug>-<ts>.json` (DOM snapshot at final state, `-redirect-` for redirects, `-external-` for external-ATS submits). |
| `.mcp.json` | MCP server config. Workers spawn with `--strict-mcp-config --mcp-config .mcp.json` so only `chrome-devtools` + `gmail-html` load. |
| `launch-chrome.bat` | User runs this once before any apply. Starts Chrome with `--remote-debugging-port=9222`, persistent profile, no `--enable-automation` (Google login still works). |

---

## Mode pick

| User input | Mode | Driver |
|---|---|---|
| First positional arg starts with `http://` / `https://` | Single | Direct script call |
| No URL OR `--batch` flag | Batch | Parent agent drives chunk loop |

---

## Flags reference

| Flag | Single | Batch | Effect |
|---|:---:|:---:|---|
| `<URL>` (positional) | required | n/a | Target URL for single mode. |
| `[N]` (positional) | n/a | optional | Cap on URLs to process this batch run. |
| `--chunk SIZE` |   | ✓ | URLs per worker spawn. Default 2. |
| `--force` | ✓ | ✓ | Auto-submit + escalate failures. |
| `--submit` | ✓ |   | Single-mode only. Submit only if every step succeeded. |
| `--experimental` | ✓ | ✓ | Per-step ndjson + DOM evidence to disk. Parent validates **failures** only (autofix candidates). |
| `--experimental-succ` | ✓ | ✓ | Implies `--experimental`. Parent ALSO validates every Applied via evidence — catches false positives. Invalid Applied → flipped to `AutoApplyFailed` with `phase:"applied_invalidated"`. |
| `--autofix` | ✓ | ✓ | Patch yaml after a real Applied via escalation. Implies `--experimental`. **Mid-batch in batch mode** (parent autofixes after each chunk). |
| `--run-id=<id>` | ✓ |   | Set by orchestrator when spawning workers. End users don't pass it. |
| `--verbose` |   | ✓ | Tail worker `tool_use` events to stderr (zero LLM cost — Node parses stream-json). |
| `--dry-run` |   | ✓ | --plan only, no work, no run_dir created. |
| `--batch` |   | ✓ | Force batch mode even with stray positional arg. |

No worker timeout. No `--max-turns` cap. No fail-rate skip. (Removed for
now; reintroduce after observed runs converge.)

---

## Single-URL flow

```
1. Skill reads user input → URL detected → single mode.
2. Skill runs:
     node scripts/gmail-apply.mjs <URL> [--force] [--autofix]
       [--experimental | --experimental-succ]

3. gmail-apply.mjs:
   a. Connect to Chrome via CDP, get/open tab on URL.
   b. settlePage (close stale modals).
   c. REDIRECT CHECK: if page.url() no longer matches any of the original
      portal's `match` strings → emit { redirect: { detected, original_url,
      final_url, target_portal_match } } + exit. Capture redirect-evidence
      under data/batch-runs/<run_id>/evidence/ when --experimental.
   d. Otherwise execute recipe.steps. With --force keep going on failures.
   e. verify(): re-read filled values, surface mismatches.
   f. If autoSubmit: click submit_selector, race success_selector.
   g. Capture final-state evidence when --experimental.
   h. Emit JSON: { ok, portal, url, run_id, experimental, redirect?,
                   steps, verification, submitted, submitted_unconfirmed,
                   submit_confirmation, evidence_path? }

4. Skill reads JSON. Decision tree:
   - redirect.detected:true → External ATS handover via
     scripts/escalation-ladder.md § "External ATS handover":
       - Tab-safety on redirect.final_url
       - Probe generic form fields, fill from profile (read once)
       - Upload CV (assets/cv/CV_www.ArshiaHemati.com_EN.pdf)
       - Submit, verify generic success markers
       - Mark Applied with external_apply:true, or AutoApplyFailed
   - submitted_unconfirmed:true OR ok:false → escalation ladder.
   - success_selector_matched on right tab AND --experimental-succ → read
     evidence, validate dom.href + dom.success_match + dom.modal_open.
     Invalid → AutoApplyFailed. Valid → mark Applied.

5. With --autofix AND a real Applied via escalation (NOT external_apply):
   - Probe alternative selectors (Tier-1 per selector-quality-rules.md).
   - Read yaml, compute minimal diff, show user, write, validate parse.
   - Append phase:"yaml_autofix" to error log.
```

---

## Batch flow — parent drives chunk loop

```
1. Skill (no URL) → batch mode.
2. Skill runs --plan to get the queue + run_id:
     node scripts/gmail-apply-batch.mjs --plan [N] [--chunk SIZE] [--force]
       [--experimental | --experimental-succ] [--autofix]
   → JSON: { run_id, run_dir, total_urls, chunks: [[u1,u2],...],
             cv_path, flags, preview }
   With --dry-run: same output, no run_dir created. Stop here.

3. Skill loops chunks (held in conversation):
   retry_queue = []
   FOR each chunk in chunks:
     a. node scripts/gmail-apply-batch.mjs --run-chunk \
          --urls=<csv> --run-id=<id> [flags]
        → spawns 1 haiku worker.
        → worker processes 2 URLs sequentially via gmail-apply.mjs +
          External ATS handover when redirect.detected.
        → emits { results, errors_logged, applied_candidates,
                  autofix_candidates }
        → orchestrator updates apps.md for THIS chunk's URLs.

     b. IF --experimental-succ:
        FOR each entry in applied_candidates:
          - Read evidence_path
          - Verify dom.href + dom.success_match + dom.modal_open
            (or external_apply markers when external_apply:true)
          - Invalid → flip apps.md row → AutoApplyFailed,
            log phase:"applied_invalidated",
            push to retry_queue if yaml-fixable.

     c. IF --autofix:
        FOR each entry in autofix_candidates:
          - Read evidence_path. Re-classify (trust evidence).
          - Skip if external_apply / cross-domain / login / captcha /
            transient. Log phase:"autofix_skipped".
          - Otherwise: tab safety + probe alts + minimal yaml patch +
            validate parse + log phase:"yaml_autofix".
          - Push candidate URL to retry_queue.

     d. (Next chunk runs WITH patched yaml — true mid-batch benefit.)

4. Retry pass (if --autofix and retry_queue non-empty):
     node scripts/gmail-apply-batch.mjs --retry-chunk \
       --urls=<csv-of-retry_queue> --run-id=<same id> [flags]
   Same flow as Step 3, EXCEPT no further autofix (would loop).
   Validate Applieds under --experimental-succ. Final failures stay
   AutoApplyFailed.

5. Skill emits final summary:
     "batch <run_id>: 47/50 Applied (3 escalated, 5 external_apply via MCP),
      3 AutoApplyFailed. yaml autofixes: 2. retry pass: 5/5 Applied.
      log: data/batch-runs/<run_id>/ledger.ndjson"
```

---

## External ATS handover

When `gmail-apply.mjs` detects redirect (URL leaves the matched portal's
domain), it bails out without running the recipe. The worker (batch) or
parent (single) then:

1. Tab-safety on `redirect.final_url`.
2. Wait for form to render.
3. Probe generic fields (email/phone/name/linkedin/file upload).
4. Fill via `evaluate_script` using `EXTERNAL_PROFILE` block from task
   message (or `config/profile.yml` in single mode).
5. Upload CV via `mcp__chrome-devtools__upload_file` —
   `assets/cv/CV_www.ArshiaHemati.com_EN.pdf` (absolute).
6. Submit, verify generic success markers (multi-language: thank-you /
   submitted / wysłane / gesendet / merci / gracias).
7. Mark Applied with `external_apply: true`. Orchestrator skips yaml
   autofix and does NOT create a new recipe — external ATS pages are
   one-time applications, DOM is not stable across runs, MCP fill is the
   right tool every time.

If file upload fails OR an unknown required field exists →
`AutoApplyFailed` with `failure_kind: "external_unconfirmed"` or
`"external_unknown_required_field"`, `autofix_eligible: false`.

---

## Two-flag validation semantics

| Flag combo | Disk artifacts | Failures validated by parent? | Successes validated by parent? |
|---|:---:|:---:|:---:|
| (none) | ✗ | ✗ | ✗ |
| `--experimental` | ✓ | ✓ (autofix candidates only) | ✗ |
| `--experimental-succ` | ✓ | ✓ | ✓ (every Applied) |
| `--autofix` | ✓ (implied) | ✓ | ✗ (unless `--experimental-succ` also set) |
| `--autofix --experimental-succ` | ✓ | ✓ | ✓ |

`--experimental-succ` cost: parent reads ~1.5 KB evidence per Applied. 50
Applieds = ~75 KB. Negligible.

---

## Output schemas

### `gmail-apply.mjs` JSON

```json
{
  "ok": true | false,
  "portal": "nofluffjobs",
  "url": "https://...",
  "run_id": "...",
  "experimental": true,
  "redirect": {                              // present only on cross-domain
    "detected": true,
    "original_url": "https://theprotocol.it/...",
    "final_url": "https://greenhouse.io/...",
    "target_portal_match": null              // or known portal name
  },
  "submit_selector": "...",
  "steps": [{ "i": 0, "action": "fill", "ok": true }, ...],
  "verification": { ... },
  "submitted": true,
  "submitted_unconfirmed": false,
  "submit_confirmation": { "kind": "success_selector_matched", "selector": "..." },
  "force": true, "autofix": false,
  "evidence_path": "data/batch-runs/.../evidence/...json",
  "error_log": "data/gmail-apply-errors.ndjson"
}
```

### Worker JSON (per chunk)

```json
{
  "results": [
    { "url": "...", "status": "Applied",
      "external_apply": false, "evidence_path": "...", "portal": "nofluffjobs" },
    { "url": "...", "status": "Applied",
      "external_apply": true, "evidence_path": "..." },
    { "url": "...", "status": "AutoApplyFailed",
      "reason": "...", "failure_kind": "...", "failed_step": "...",
      "failed_selector": "...", "evidence_path": "...",
      "autofix_eligible": true, "external_apply": false }
  ],
  "errors_logged": 3
}
```

### Orchestrator `--plan` JSON

```json
{
  "ok": true, "mode": "plan",
  "run_id": "...", "run_dir": "...",
  "total_urls": 50, "chunk_count": 25, "chunk_size": 2,
  "chunks": [["u1","u2"], ...],
  "preview": [...],
  "portal_counts": {...}, "status_counts": {...},
  "cv_path": "C:\\...\\assets\\cv\\CV_www.ArshiaHemati.com_EN.pdf",
  "flags": { "force":true, "experimental":true, "experimental_succ":true, "autofix":true }
}
```

### Orchestrator `--run-chunk` / `--retry-chunk` JSON

```json
{
  "ok": true, "mode": "run-chunk", "run_id": "...",
  "is_retry": false,
  "chunk_urls": ["u1","u2"],
  "applied": 1, "failed": 1, "apps_md_rows_updated": 2,
  "usage": { "input_tokens": ..., "output_tokens": ... },
  "results": [ /* worker results, enriched with num/company/role */ ],
  "applied_candidates": [ /* present when --experimental-succ */
    { "url", "num", "portal", "company", "role", "evidence_path", "external_apply" }
  ],
  "autofix_candidates": [ /* present when --autofix */
    { "url", "num", "portal", "company", "role",
      "failure": { "kind", "failed_step", "failed_selector", "reason" },
      "evidence_path" }
  ],
  "ms": 12345
}
```

---

## Strict success rules

**Recipe-applied (non-external)**:
1. `location.href` is target URL (or same-origin same-job redirect).
2. Portal `success_selector` matched on that page.
3. Apply modal closed OR success aside/icon/locale-text marker visible.

**External-applied**:
1. `location.href` matches `redirect.final_url`.
2. URL changed to thanks/success/submitted/confirmation OR generic
   marker text present (multi-language list).
3. Form not still present OR no validation errors visible.

Any ambiguity → `AutoApplyFailed`. URL on different domain than expected →
fail. "Modal closed but no success indicator" → fail. "Looked successful
but didn't list_pages first" → fail.

When in doubt → `phase:"escalation"` log + `AutoApplyFailed`. Better to
flag a real success as failed than mark a fail as success.

Full ladder + JS templates: `scripts/escalation-ladder.md`.

---

## Token economics

| Layer | Cost |
|---|---|
| Parent agent (this session) | Plan call (~1 k tokens). Per chunk: read run-chunk JSON + (optional) read evidence files for applied/autofix candidates. ~1–3 k per chunk. 25 chunks ≈ 30–80 k. Modest. |
| Worker (haiku, per chunk) | Static cached system prompt (~5 k). Task prompt (URLs + profile + CV path) ~500 tokens. Tool calls + final JSON ~1–3 k output. ~50-URL run ≈ 100 k cached input + 25 k output across all spawns. |
| Stream-json events | Parsed inside Node orchestrator. NOT in parent's context. |
| DOM evidence | On disk only. Parent loads only what it adjudicates. |

No screenshots — text DOM signals only.

---

## Architectural decisions

### KISS

- Two scripts (single + batch helper) sharing the same Playwright applier.
  No build step, no codegen.
- Parent agent drives the batch loop (no bidirectional IPC). Each script
  invocation is one mode, one shot.
- One config for portal recipes (yaml). One CLI per use case.

### YAGNI

- No worker turn cap, no worker timeout, no fail-rate skip — removed
  because they were guesses without real-run data.
- No screenshot capture — DOM text is sufficient.
- No parallel worker spawning — sequential is simpler and meets the
  requirement.
- No automatic retry of `AutoApplyFailed` URLs beyond the post-autofix
  retry pass.

### SOLID

- **Single Responsibility**: `gmail-apply.mjs` = form fill + redirect
  detection; `gmail-apply-batch.mjs` = orchestrator helper modes; worker
  prompt = worker behavior; SKILL.md = parent manual + chunk loop logic;
  portal yaml = recipe data; `escalation-ladder.md` = canonical
  ladder; `selector-quality-rules.md` = canonical hygiene.
- **Open/Closed**: new portal = new yaml entry, no script change. New
  step type = one new branch in `runStep()`.
- **Dependency Inversion**: scripts depend on yaml abstraction + profile
  abstraction. Recipe-agnostic Playwright applier interprets recipes.

### DRY

- Tab safety, 4-step ladder, JS templates, success determination,
  external-ATS markers → canonical at `scripts/escalation-ladder.md`. Used
  by both single SKILL.md and worker prompt (worker reads on demand).
- Selector quality rules → canonical at `scripts/selector-quality-rules.md`.
- URL extraction (notes + report file) → only in `gmail-apply-batch.mjs`.
- Profile data path → orchestrator reads `config/profile.yml` once,
  workers receive subset inline. No worker reads profile.yml directly.

### Known minor non-DRY

- Status whitelist `['Evaluated', 'Auto-Match']` hardcoded in
  `gmail-apply-batch.mjs` while `templates/states.yml` is the documented
  source of truth. Not worth promoting (2 strings, low drift risk).

---

## Caveats / known issues

- **Caveman SessionStart hook** prepends ~40 k tokens to every worker
  spawn (user's plugin). Cache stays warm. Workers see contradictory voice
  ("be terse caveman" + "output JSON only"); JSON-only wins for haiku.
- **MCP warm-up**: first `mcp__chrome-devtools__list_pages` may take ~2 s.
- **No worker turn/timeout cap**. Parent process waits indefinitely if a
  worker hangs. Acceptable for first iteration; reintroduce caps once
  observed.
- **Redirects detected in 3 places** (v2 hardening):
  - **Startup** — page URL after navigation no longer matches portal `match`.
  - **Mid-flow same-tab** — after any step, `page.url()` left the portal.
  - **Mid-flow new-tab** — `context.on('page')` listener catches a popup
    opened by a recipe step (e.g. nofluffjobs Experis apply button →
    Pretius traffit popup). Tagged with `redirect.new_tab:true`.

  All three emit the same `redirect` JSON shape; worker handover is
  identical. The script's `browser.close()` only DISCONNECTS Playwright
  from CDP — Chrome and the redirected tab stay open, ready for the
  worker's MCP handover.

- **Known-ATS framework hints.** When the redirect's `final_url` matches
  a known framework-protected ATS host (Workday, Greenhouse, Lever,
  Recruitify, Traffit, SmartRecruiters, Workable, Jobvite, iCIMS, Taleo,
  SuccessFactors), the script populates `redirect.framework_hint` with
  `{ host_pattern, framework_detected, source: 'known_ats_registry' }`.
  Worker uses this verbatim, skipping its own framework probe. No yaml
  recipe is ever auto-created for these hosts — they remain one-time MCP
  applications.

- **External-ATS write rule (v2).** WRITES on external ATS forms MUST
  use chrome-devtools MCP write tools (`fill`, `fill_form`, `type_text`,
  `click`, `upload_file`). `evaluate_script` for writes is FORBIDDEN —
  framework-bound inputs (Angular `FormControl`, React controlled inputs,
  Vue `v-model`) silently reject DOM `.value=` + synthetic events because
  Zone.js and React's synthetic event chain only respond to real CDP
  keystrokes. `evaluate_script` is correct for READS only. Canonical
  rule lives in `scripts/escalation-ladder.md`; worker prompt enforces.

- **3-strike per field.** External-ATS fills cap at 3 strategies per
  field, 12 MCP write attempts per URL total. Prevents the 60+ turn
  loops we saw before this rule (Experis Angular form, batch
  `2026-05-04-11-44-53-795743c8`). Failures are structured:
  `failed_field_name`, `framework_detected`, `last_mcp_tool_used`,
  `validator_error_text_observed`, `external_ats_host`.

- **Evidence capture is now portal-yaml-safe.** `captureEvidence` no
  longer pipes `success_selector` candidates through native
  `document.querySelector` — they probe via Playwright's
  `page.locator(sel).count()` (handles `:has-text(...)` etc). Each probe
  is independently try/catch'd. A single bad pseudo-selector can no
  longer kill the entire evidence file.

- **Chunk-size rule of thumb.** Default 2 is the safe baseline. After
  2-3 successful full runs, you can bump to `--chunk 3` for ~30% fewer
  worker spawns (each spawn pays ~45 k tokens of fixed system-prompt +
  caveman-hook overhead — same regardless of URL count in chunk). Above
  3 the marginal saving per URL drops, and a single external-ATS URL
  with many MCP turns can grow the worker's per-chunk tool history
  toward Haiku's context budget. Chunk = 1 is correct only for
  single-URL debug — wastes most of the spawn cost on the system prompt.
- **External-ATS file uploads** require `mcp__chrome-devtools__upload_file`.
  If unavailable for a given form (e.g. drag-and-drop only), worker logs
  `script_extension_needed` and the URL fails.

---

## How to extend

| Goal | Where to change |
|---|---|
| New portal | `config/gmail-apply-portals.yml`. Use `/explore-sender <URL>`. No code change. |
| New action type (file upload via Playwright, dropdown, iframe switch) | `scripts/gmail-apply.mjs` → `runStep()` switch + yaml schema + worker prompt's hard rules. |
| New eligibility status | Whitelist in `gmail-apply-batch.mjs` `modePlan()`. |
| Tighten escalation rules | `scripts/escalation-ladder.md` only. Both single + batch pick it up. |
| Add external-ATS field types | `scripts/gmail-apply-worker-prompt.md` § "External ATS handover" probe list. |
| Stricter selector hygiene | `scripts/selector-quality-rules.md` only. |
| Reintroduce worker timeout / turn cap | Add constants in `gmail-apply-batch.mjs` `spawnWorker()`. |
| Live monitor format | `gmail-apply-batch.mjs` → `child.stdout.on('data', …)` block. |
| Extra profile fields for external apply | Extend `loadProfileForWorker()` projection + worker prompt's profile block + handover probe list. |

---

## Quick command reference

### Single URL

```bash
# Fill, verify, stop before submit
node scripts/gmail-apply.mjs https://nofluffjobs.com/job/...

# Fill + submit + escalate failures
node scripts/gmail-apply.mjs https://... --force

# Full power: submit, escalate, autofix yaml on success, validate Applied
node scripts/gmail-apply.mjs https://... --force --autofix --experimental-succ
```

### Batch — parent drives the loop

```bash
# Plan (preview queue, write run_dir)
node scripts/gmail-apply-batch.mjs --plan --dry-run

# Plan with all flags (no work yet — parent reads chunks list)
node scripts/gmail-apply-batch.mjs --plan 50 --force --autofix --experimental-succ --verbose

# Run one chunk (parent invokes per chunk)
node scripts/gmail-apply-batch.mjs --run-chunk \
  --urls=https://a.com/job1,https://b.com/job2 \
  --run-id=<from-plan> \
  --force --autofix --experimental-succ --verbose

# Retry chunk after parent's mid-batch autofix landed
node scripts/gmail-apply-batch.mjs --retry-chunk \
  --urls=<csv-of-failed-with-patched-yaml> \
  --run-id=<same-id> \
  --force --experimental-succ
```

### Through the skill (recommended)

```
/gmail-apply https://...                                  # single
/gmail-apply                                               # batch
/gmail-apply --force --autofix --experimental-succ --verbose  # batch full
/gmail-apply --batch --dry-run                             # batch preview
```

Prereq: Chrome already running via `launch-chrome.bat`.
