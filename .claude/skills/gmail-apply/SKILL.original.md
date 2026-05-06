---
name: gmail-apply
description: Per-portal application automation via Playwright + Chrome DevTools MCP. Two modes — (1) SINGLE-URL when the user passes a job URL → run scripts/gmail-apply.mjs against that URL; (2) BATCH when no URL is passed (or --batch is set) → parent agent (this skill) drives a per-chunk loop calling scripts/gmail-apply-batch.mjs in --plan + --run-chunk modes, autofixing mid-batch when --autofix, retrying patched URLs at the end. Eligible rows status Evaluated or Auto-Match. Redirects to external ATS (greenhouse/lever/recruitify/etc) handed over to chrome-devtools MCP — application still completed, CV uploaded from assets/cv/CV_www.ArshiaHemati.com_EN.pdf. Triggers — single — /gmail-apply <URL>, /apply-portal <URL>, "apply to <URL>"; batch — /gmail-apply (no URL), "batch apply", "apply to all evaluated", "apply to auto-matched". No PDF or report generation.
user_invocable: true
argument-hint: "[<job URL>] [--force] [--autofix] [--experimental] [--experimental-succ] [--verbose] [--dry-run] [--batch] [N] [--chunk SIZE] [--submit]"
---

# gmail-apply — single-URL & batch portal applies

Node scripts do work. Skill: pick mode, drive chunk loop, validate Applieds,
autofix yaml mid-batch, retry patched URLs.

## Mode pick

| Input | Mode | Driver |
|---|---|---|
| First positional starts with `http(s)://` | **single** | Direct script call |
| No URL OR `--batch` | **batch** | Parent agent drives chunk loop |

## Flag matrix

| Flag | Single | Batch | Behavior |
|------|:---:|:---:|----------|
| `<URL>` | required | n/a | Target URL. |
| `[N]` | n/a | optional | Cap on URLs this batch run. |
| `--chunk SIZE` |   | ✓ | URLs per worker spawn. Default 2. Bump to 3 once portal mix proven. >4 risks haiku context creep. |
| `--force` | ✓ | ✓ | Auto-submit + escalate failures. |
| `--submit` | ✓ |   | Submit only if all steps OK. No escalation. |
| `--experimental` | ✓ | ✓ | Per-step ndjson + DOM evidence. Parent validates failures (autofix candidates). |
| `--experimental-succ` | ✓ | ✓ | Implies `--experimental`. Parent ALSO validates every Applied via evidence. Invalid → flipped to AutoApplyFailed + `phase:"applied_invalidated"`. |
| `--autofix` | ✓ | ✓ | Patch yaml on yaml-fixable failures. Implies `--experimental`. Mid-batch in batch. |
| `--verbose` |   | ✓ | Tail worker tool_use to stderr. Zero LLM cost. |
| `--dry-run` |   | ✓ | --plan only, no work. |
| `--batch` |   | ✓ | Force batch even with stray positional. |

Prereq: Chrome on port 9222 via `launch-chrome.bat`.

---

## Hard rules (both modes)

- DO NOT read `cv.md`, `config/profile.yml`, `modes/_profile.md`, `reports/*.md`. Orchestrator script reads profile.yml once → `data/batch-runs/<run_id>/profile.json`; workers receive subset inline.
- DO NOT call `read_page`, `take_snapshot`, `take_screenshot`, `get_page_text`. `evaluate_script` only. `take_snapshot` exception: immediately before `upload_file`.
- DO NOT edit selectors inline. Update `config/gmail-apply-portals.yml` via autofix flow.
- DO NOT spawn `Agent` subagent. Batch spawns its own `claude -p` workers from inside Node.
- CV path for external uploads: `assets/cv/CV_www.ArshiaHemati.com_EN.pdf` (orchestrator computes absolute).

---

## SINGLE-URL flow

```bash
node scripts/gmail-apply.mjs <URL> [--force] [--autofix] [--experimental] [--experimental-succ]
```

Read script JSON. Decision:

| Output | Action |
|---|---|
| `redirect.detected: true` | External ATS handover via `scripts/escalation-ladder.md` § "External ATS handover". CV path absolute. |
| `submitted_unconfirmed: true` OR `ok:false` (no redirect) | Run escalation ladder per `scripts/escalation-ladder.md`. |
| `ok:true, submitted:false` (no `--force`) | Form filled, awaiting user. Show verification + submit selector. Say `say "send it" to submit`. Do NOT update `data/pipeline.md`. |
| `ok:true, submitted:true` AND `success_selector_matched` | If `--experimental-succ` → read `evidence_path`, verify dom.href + dom.success_match + dom.modal_open false. Invalid → AutoApplyFailed. Valid → mark Applied; update `data/pipeline.md`. |

Single-mode autofix: after real Applied via escalation AND `--autofix` set: probe alternative selectors via MCP (Tier-1 per `scripts/selector-quality-rules.md`), patch yaml minimally, validate parse, log `phase:"yaml_autofix"`. Show diff. NEVER autofix on cross-domain or `external_apply:true`.

Output to user (single):
```
nofluffjobs: phone=ok, English=ok. submit selector: #sendApplicationButton button.
say "send it" to submit.
```
Mismatch → `phone=MISMATCH (expected +43..., got empty)`.

---

## BATCH flow — parent drives per-chunk loop

Each iteration = ONE chunk (default 2 URLs). Mid-batch autofix means later chunks benefit.

### Step 1 — Plan

```bash
node scripts/gmail-apply-batch.mjs --plan [N] [--chunk SIZE] [--force] \
  [--experimental | --experimental-succ] [--autofix] [--verbose]
```

Reads `data/applications.md`, filters status `Evaluated` ∨ `Auto-Match` with matching portal, sorts row `#` desc (newest-first), dedups URLs (keeps newer), slices N, chunks SIZE. Writes `data/batch-runs/<run_id>/{plan.json, profile.json}` + `evidence/`. Stdout JSON includes `run_id`, `chunks`, `cv_path`, `flags`. `--dry-run` returns plan without run_dir — stop, surface preview.

### Step 2 — Loop chunks

Hold retry queue (empty start). For each chunk in order:

1. Run (preferred — uses plan.json):
   ```bash
   node scripts/gmail-apply-batch.mjs --run-chunk \
     --chunk-index=<i> --run-id=<run_id> [flags]
   ```
   Fallback for retry-pass URLs not in plan.json: `--urls=<csv>`. Some portals (theprotocol.it) have commas in URL path → use `--urls-sep='|'`.

2. Read chunk stdout JSON: `chunk_urls`, `applied`, `failed`, `results`, `applied_candidates` (if `--experimental-succ`), `autofix_candidates` (if `--autofix`), `token_telemetry_summary`, `chunk_signals`. `applications.md` already updated.

   **Telemetry triage** (don't read full ledger by default):
   - `near_limit:false` AND `compactions_observed:0` → ignore.
   - `near_limit:true` → tell user "chunk N peaked at <pct>% — drop --chunk size next batch". No auto-restart.
   - `compactions_observed:>0` → real warning. `grep chunk_token_telemetry` ledger entry, flag URL whose span ended at peak.

   **Per-chunk suggestion**: use `chunk_signals` + candidates. Emit ONE line `→ suggestion: <text>` only when actionable. Skip silently if normal. Trust judgment.

3. **`--experimental-succ`** → for each `applied_candidates` entry:
   - Read `evidence_path`.
   - Verify ALL: `dom.href` matches target, `dom.success_match` non-null, `dom.modal_open === false`. For `external_apply:true`, instead verify `dom.url_changed === true` OR `dom.marker_match` non-null.
   - Invalid → flip row to `AutoApplyFailed`, log `phase:"applied_invalidated"` `{run_id,url,portal,reason,evidence_path}`. If yaml-fixable, push autofix candidate to step 4 queue.

4. **`--autofix`** → for each `autofix_candidates` entry:
   - Read `evidence_path`. Re-classify; trust evidence over worker `failure_kind`.
   - Skip if cross-domain / external_apply / login / captcha / per-job validation / transient. Log `phase:"autofix_skipped"`.
   - Else: tab safety + probe alts + minimal yaml patch per ladder + selector rules. Show diff, validate parse, log `phase:"yaml_autofix"`.
   - Push URL to retry queue if patch landed.

5. Next chunk. Mid-batch patches benefit later chunks.

### Step 3 — Retry pass

Retry queue non-empty AND `--autofix` was on:
```bash
node scripts/gmail-apply-batch.mjs --retry-chunk \
  --urls=<csv> --run-id=<run_id> [--force] [--experimental-succ]
```
Same as Step 2 but **no further autofix** (would loop). Still failing → final failures.

### Step 4 — Final summary

Format:
```
batch <run_id>: 47/50 Applied (3 escalated, 5 external_apply via MCP), 3 AutoApplyFailed.
yaml autofixes: 2. retry pass: 5/5 Applied.
log: data/batch-runs/<run_id>/ledger.ndjson
```

Aggregate `chunk_signals` across run. 2-5 bullets under "Improvements (suggested):" — concrete system changes. Focus: recipe issues recurring across chunks (same `failure_kind` × portal), chunk-size signals, `script_extension_needed` patterns, worker output bloat (External ATS macros not followed). Skip section if nothing actionable.

`--verbose` adds live `[worker]` lines to stderr. Zero LLM cost.

---

## Tab safety + escalation ladder

Canonical at **`scripts/escalation-ladder.md`** — tab safety, 4-step ladder, JS templates, success determination, external-ATS markers + handover. Read once when escalation OR external handover OR applied-invalidation autofix needed.

Single mode: parent runs ladder. Batch mode: worker runs ladder; parent runs external-ATS handover validation + post-batch autofix loops.

**Hard rule: when in doubt → AutoApplyFailed, never Applied.**

---

## Autofix rules

**Yaml-fixable (DO autofix):** missing required step, wrong selector that timed out + alt worked, missing `label_aliases`, missing/wrong `success_selector` candidate, wrong `submit_selector` (only if prior runs also failed — check `data/gmail-apply-errors.ndjson`), missing `data:` key.

**NOT yaml-fixable (skip + log `autofix_skipped`):** external_apply:true, cross-domain redirect, per-job server validation, login/auth/captcha/rate-limit/transient, file-upload requirement when no upload action exists (log `script_extension_needed` instead).

Selector quality: `scripts/selector-quality-rules.md`. Tier 1 always preferred.

Verify before yaml write:
```js
function() { return { href: location.href, count: document.querySelectorAll("SEL").length }; }
```
Required: exactly 1 match AND `href` matches target. Multiple → refine. Zero → abort + log `autofix_skipped` (`reason: "selector verification failed"`).

Patch flow: read yaml → minimal diff → show user → validate parse (`node -e "require('js-yaml').load(require('fs').readFileSync('config/gmail-apply-portals.yml','utf8'))"`) → on parse fail revert + log `phase:"autofix_failed"` → append `phase:"yaml_autofix"` to error log `{url, portal, change_type, before, after, reason}` → tell user `yaml autofix applied: [summary]. Test on fresh URL.`

**Hard rules:**
- DO NOT autofix when escalation FAILED. Only on real Applied.
- DO NOT autofix on cross-domain or `external_apply:true`.
- DO NOT create new portal entries via autofix. First-party → `/explore-sender`. External ATS reached via redirect → no recipe at all (one-time apps).
- DO NOT touch other portals' entries.
- DO NOT use external-domain selectors in original portal's recipe.
- DO NOT modify `match` field.
- Always show diff first.

---

## External ATS handover (single mode)

Script returns `redirect.detected:true` → follow `scripts/escalation-ladder.md` § "External ATS handover". Single-mode parent reads `config/profile.yml` once for fill values; rest identical to batch worker flow.

---

## Logging & artifacts

**Error log** `data/gmail-apply-errors.ndjson` — NDJSON append-only. Phases: `step`, `verify`, `submit`, `submit_unconfirmed`, `escalation`, `selector_fix`, `script_extension_needed`, `worker_chunk_failure`, `yaml_autofix`, `autofix_skipped`, `autofix_failed`, `redirect_to_external`, `applied_invalidated`.

**Per-run** `data/batch-runs/<run_id>/`:
- `plan.json`, `profile.json`
- `ledger.ndjson` — orchestrator events
- `steps.ndjson` — per-step from script
- `evidence/<slug>-<ts>.json` — final state DOM
- `evidence/<slug>-redirect-<ts>.json` — at redirect
- `evidence/<slug>-external-<ts>.json` — after external submit

---

## Errors

| Situation | Action |
|---|---|
| `cdp connect failed` | Tell user run `launch-chrome.bat`. |
| `no eligible URLs` (batch --plan) | Confirm queue empty, suggest user check status filter / portal coverage. |
| Worker spawn failure | Logged. URLs marked `AutoApplyFailed`. Surface count. |
| Worker output not JSON | Diagnostic in ledger; URLs `AutoApplyFailed`. Re-run `--verbose`. |
| Redirect detected | External ATS handover. |
| `redirect.target_portal_match` set | URL belongs to different yaml portal. Re-invoke with redirected URL or surface to user. |
| `step failed` with selector | DOM changed. Tell user step + selector, ask whether to update yaml. |

---

## Cross-references

- `scripts/gmail-apply.mjs` — Playwright applier. Detects redirect at startup/mid-flow/new-tab, exits with `redirect` block.
- `scripts/gmail-apply-batch.mjs` — orchestrator. Modes `--plan`, `--run-chunk`, `--retry-chunk`.
- `scripts/gmail-apply-worker-prompt.md` — static worker system prompt (cached).
- `scripts/escalation-ladder.md` — canonical ladder + external-ATS handover.
- `scripts/selector-quality-rules.md` — selector hygiene.
- `gmail-apply-architecture.md` — high-level map.
