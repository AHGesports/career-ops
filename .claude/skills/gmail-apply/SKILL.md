---
name: gmail-apply
description: Per-portal application automation via Playwright + Chrome DevTools MCP. Two modes — (1) SINGLE-URL when the user passes a job URL → run scripts/gmail-apply.mjs against that URL; (2) BATCH when no URL is passed (or --batch is set) → parent agent (this skill) drives a per-chunk loop calling scripts/gmail-apply-batch.mjs in --plan + --run-chunk modes, autofixing mid-batch when --autofix, retrying patched URLs at the end. Eligible rows status Evaluated or Auto-Match. Redirects to external ATS (greenhouse/lever/recruitify/etc) handed over to chrome-devtools MCP — application still completed, CV uploaded from assets/cv/CV_www.ArshiaHemati.com_EN.pdf. Triggers — single — /gmail-apply <URL>, /apply-portal <URL>, "apply to <URL>"; batch — /gmail-apply (no URL), "batch apply", "apply to all evaluated", "apply to auto-matched". No PDF or report generation.
user_invocable: true
argument-hint: "[<job URL>] [--force] [--autofix] [--experimental] [--experimental-succ] [--verbose] [--dry-run] [--batch] [N] [--chunk SIZE] [--submit]"
---

# gmail-apply — single-URL & batch portal applies

The work is done by Node scripts. Skill's job: pick the mode, drive the
chunk loop in batch mode, validate Applieds, autofix yaml mid-batch, retry
patched URLs.

## Mode pick

| User input | Mode | Driver |
|---|---|---|
| First positional arg starts with `http://` / `https://` | **single** | Direct script call |
| No URL OR `--batch` flag | **batch** | Parent agent drives the chunk loop (see §Batch flow) |

## Flag matrix

| Flag | Single | Batch | Behavior |
|------|:---:|:---:|----------|
| `<URL>` (positional) | required | n/a | Target URL (single). |
| `[N]` (positional) | n/a | optional | Cap on URLs this batch run. |
| `--chunk SIZE` |   | ✓ | URLs per worker spawn. Default 2 (safe baseline). Bump to 3 once a portal mix is proven (≥2 successful full runs at 2). Above 4 risks haiku context creep on multi-external chunks. Chunk = 1 only for single-URL debug — wastes spawn fixed cost. |
| `--force` | ✓ | ✓ | Auto-submit + escalate failures. |
| `--submit` | ✓ |   | Submit only if all steps OK (no escalation). |
| `--experimental` | ✓ | ✓ | Per-step ndjson + DOM evidence to disk. Parent validates **failures** (autofix candidates). |
| `--experimental-succ` | ✓ | ✓ | Implies `--experimental`. Parent ALSO validates every Applied via evidence — catches false positives (worker matched success_selector on wrong tab, ambiguous selector, external redirect mistaken for success). Invalid Applied → flipped to AutoApplyFailed + `phase:"applied_invalidated"`. |
| `--autofix` | ✓ | ✓ | Patch yaml on yaml-fixable failures. Implies `--experimental`. Mid-batch in batch mode (see §Batch flow). |
| `--verbose` |   | ✓ | Tail worker tool_use events to stderr (zero LLM cost). |
| `--dry-run` |   | ✓ | --plan only, no work. |
| `--batch` |   | ✓ | Force batch even with stray positional arg. |

Prereq for both modes: Chrome on port 9222 via `launch-chrome.bat`.

---

## Hard rules (both modes)

- **DO NOT** read `cv.md`, `config/profile.yml`, `modes/_profile.md`, or
  `reports/*.md` from the parent agent. The orchestrator script reads
  profile.yml once and writes a small subset to `data/batch-runs/<run_id>/profile.json`;
  workers receive the same data inline in their task prompt.
- **DO NOT** call `read_page`, `take_snapshot`, `take_screenshot`,
  `get_page_text`. `evaluate_script` only.
- **DO NOT** edit selectors / templates inline. Update
  `config/gmail-apply-portals.yml` via the autofix flow.
- **DO NOT** spawn an `Agent` subagent. Batch mode spawns its own
  `claude -p` workers from inside the Node script.
- **CV file** for external-ATS uploads: `assets/cv/CV_www.ArshiaHemati.com_EN.pdf`
  (orchestrator computes absolute path; workers use
  `mcp__chrome-devtools__upload_file`).

---

## SINGLE-URL flow

### Run

```bash
node scripts/gmail-apply.mjs <URL> [--force] [--autofix] [--experimental] [--experimental-succ]
```

### Read the script's JSON

| Script output | Action |
|---|---|
| `redirect.detected: true` | External ATS handover via `scripts/escalation-ladder.md` § "External ATS handover". Read the ladder doc, follow the steps. CV path is `assets/cv/CV_www.ArshiaHemati.com_EN.pdf` (absolute). |
| `submitted_unconfirmed: true` OR `ok:false` (no redirect) | Run escalation ladder per `scripts/escalation-ladder.md`. |
| `ok:true, submitted:false` (no `--force`) | Form filled, awaiting user. Show verification + submit selector. Say `say "send it" to submit`. Do NOT update `data/pipeline.md`. |
| `ok:true, submitted:true` AND `success_selector_matched` | If `--experimental-succ` → read `evidence_path`, verify dom.href matches target + dom.success_match set + dom.modal_open false. Invalid → AutoApplyFailed. Valid → mark Applied; update `data/pipeline.md` row. |

### Single-mode autofix

After a real Applied via escalation AND `--autofix` is set: probe
alternative selectors via chrome-devtools MCP (Tier-1 per
`scripts/selector-quality-rules.md`), patch
`config/gmail-apply-portals.yml` minimally, validate parse, log
`phase:"yaml_autofix"`. Show diff first. NEVER autofix on cross-domain
redirects (worker handed over to external ATS — different portal).

### Output to user (single mode)

```
nofluffjobs: phone=ok, English=ok. submit selector: #sendApplicationButton button.
say "send it" to submit.
```

Mismatch → `phone=MISMATCH (expected +43..., got empty)`.

---

## BATCH flow — parent drives a per-chunk loop

The parent agent (this skill) runs an explicit loop. Each iteration
processes ONE chunk (default 2 URLs). Mid-batch autofix means later chunks
benefit from yaml patches the parent applied during earlier chunks.

### Step 1 — Plan

```bash
node scripts/gmail-apply-batch.mjs --plan [N] [--chunk SIZE] [--force] \
  [--experimental | --experimental-succ] [--autofix] [--verbose]
```

Reads `data/applications.md`, filters to status `Evaluated` ∨ `Auto-Match`
with a matching portal, **sorts by row `#` descending so newest-added URLs
apply first** (the `#` column is a monotonically-increasing add counter
maintained by merge-tracker, so desc == reverse-chronological insertion
order — newest entries from `/scan-gmail` are processed before older
backlog), dedups URLs (keeps the newer occurrence), slices to N, chunks
by SIZE. Writes
`data/batch-runs/<run_id>/{plan.json, profile.json}` and an `evidence/`
dir. Stdout JSON:

```json
{
  "ok": true, "mode": "plan",
  "run_id": "2026-05-04-...",
  "run_dir": "data/batch-runs/...",
  "total_urls": 50, "chunk_count": 25, "chunk_size": 2,
  "chunks": [["url1","url2"], ["url3","url4"], ...],
  "preview": [...],
  "cv_path": "C:\\...\\assets\\cv\\CV_www.ArshiaHemati.com_EN.pdf",
  "flags": { "force":true, "experimental":true, "experimental_succ":true, "autofix":true }
}
```

`--dry-run` returns the plan without creating run_dir. Stop here, surface
the preview.

### Step 2 — Loop chunks

Hold a **retry queue** (initially empty). For each chunk in `chunks` (in
order):

1. Run (preferred — uses `plan.json` as source of truth, immune to URL
   delimiter bugs):
   ```bash
   node scripts/gmail-apply-batch.mjs --run-chunk \
     --chunk-index=<i> --run-id=<run_id> \
     [--force] [--experimental | --experimental-succ] [--verbose]
   ```

   Fallback for retry-pass URLs not present in `plan.json` (e.g. URLs
   pulled from `autofix_candidates`): use `--urls=<csv>`. **Critical:**
   some portals (theprotocol.it, others) put commas inside their URL
   path. Default CSV split breaks them — pass `--urls-sep='|'` (or any
   other char that doesn't appear in your URLs) and join URLs with that
   separator instead.

   ```bash
   node scripts/gmail-apply-batch.mjs --run-chunk \
     --urls-sep='|' --urls='<u1>|<u2>' --run-id=<run_id> \
     [flags]
   ```
2. Read the chunk's stdout JSON:
   ```json
   {
     "ok": true, "mode": "run-chunk", "run_id": "...",
     "chunk_urls": [...], "applied": N, "failed": M,
     "results": [...],
     "applied_candidates": [...],   // only when --experimental-succ
     "autofix_candidates": [...],   // only when --autofix
     "token_telemetry_summary": {
       "turns": ..., "peak_input": ..., "peak_pct": ...,
       "near_limit": false, "compactions_observed": 0, "total_output": ...,
       "details_in_ledger": "data/batch-runs/<run_id>/ledger.ndjson (event:chunk_token_telemetry)"
     }
   }
   ```
   `data/applications.md` already updated for this chunk's URLs.

   **Telemetry triage (do NOT read full ledger by default — context-saving rule):**
   - `near_limit: false` AND `compactions_observed: 0` → ignore. No action.
   - `near_limit: true` → tell user "chunk N peaked at <pct>% of haiku window — drop --chunk size next batch" + log to your reply. Do NOT auto-restart.
   - `compactions_observed: > 0` → real warning. Read the ledger entry (`grep chunk_token_telemetry` line) to get per-URL spans. Likely the URL whose span ended at peak input is the one that pushed over the budget — flag it to user.
   - Only when investigating, read `data/batch-runs/<run_id>/ledger.ndjson` (full per-URL spans + compaction details). Do NOT load it on every chunk.

   **Per-chunk improvement suggestion (use the LLM — your reasoning):**
   The stdout includes a `chunk_signals` block — small structured facts like
   `failure_kinds_histogram`, `external_apply_count`, `escalated_applied_count`,
   `chunk_ms`, `peak_pct_of_window`, `worker_output_tokens`. Use these (plus
   any `applied_candidates` / `autofix_candidates` you already have) to write
   ONE short suggestion line to the user, ONLY when something actionable shows
   up. Skip silently if everything looks normal.

   Trigger ideas (not exhaustive — use judgment):
   - `external_apply_count` > 0 on a portal that should be native → "portal X recipe sent N URLs to external ATS; recipe's apply-button selector likely points to a redirect — review."
   - `failure_kinds_histogram.success_selector_timeout` > 0 → "portal X's success_selector probably stale — autofix candidate present."
   - `failure_kinds_histogram.selector_not_found` > 0 → "portal X's recipe selectors drifted — autofix candidate present."
   - `escalated_applied_count` > 0 → "N URLs only succeeded after escalation; if `--autofix` is on, yaml will be patched."
   - `chunk_ms` > 240000 (4 min) for chunk_size=2 → "slow chunk — likely lots of MCP probing on external ATS."
   - `worker_output_tokens` > 15000 → "worker emitted unusually high output; check whether External ATS handover macros (Tier 2.6) are being honored."
   - `near_limit` true → "raise concern about chunk size."

   Format the per-chunk suggestion as ONE LINE: `→ suggestion: <text>`. Don't
   over-explain. If multiple signals are noisy, pick the strongest one. The
   user can always ask for more.

3. **If `--experimental-succ`** → for each entry in `applied_candidates`:
   - Read `evidence_path` (small JSON).
   - Verify ALL: `dom.href` matches target URL (or same-origin same-job),
     `dom.success_match` is non-null, `dom.modal_open === false`. For
     `external_apply: true`, instead verify `dom.url_changed === true` OR
     `dom.marker_match` non-null.
   - **Invalid** → flip status: rewrite `data/applications.md` row to
     `AutoApplyFailed`. Log
     `{"phase":"applied_invalidated","run_id","url","portal","reason","evidence_path"}`.
     If the failure is yaml-fixable (e.g. wrong success_selector),
     synthesize an autofix candidate and push to step 4's queue.

4. **If `--autofix`** → for each entry in `autofix_candidates`:
   - Read `evidence_path`. Re-classify; trust evidence over worker's
     `failure_kind`.
   - Skip if cross-domain redirect / external_apply / login wall / captcha
     / per-job validation / transient network. Log `phase:"autofix_skipped"`.
   - Otherwise: tab safety + probe alternatives + patch yaml minimally per
     `scripts/escalation-ladder.md` and `scripts/selector-quality-rules.md`.
     Show diff to user, validate parse, log `phase:"yaml_autofix"`.
   - **Push the candidate's URL to retry queue** if a yaml patch landed.

5. Move to next chunk. Mid-batch yaml patches benefit all later chunks.

### Step 3 — Retry pass

If retry queue is non-empty AND `--autofix` was on:

```bash
node scripts/gmail-apply-batch.mjs --retry-chunk \
  --urls=<csv-of-retry-urls> --run-id=<run_id> \
  [--force] [--experimental | --experimental-succ]
```

Same flow as Step 2 (parse JSON, validate Applieds under
`--experimental-succ`, but **do NOT autofix again** — that would loop). If
URLs still fail → surface to user as final failures.

### Step 4 — Final summary + system-improvement suggestions

```
batch <run_id>: 47/50 Applied (3 escalated, 5 external_apply via MCP), 3 AutoApplyFailed.
yaml autofixes: 2 (replace_selector, add_alias). retry pass: 5/5 Applied.
log: data/batch-runs/<run_id>/ledger.ndjson

Improvements (suggested):
- theprotocol: 4 of 7 URLs went via external_apply — apply-button selector likely opens the wrong popup. Re-explore the recipe.
- xing: 2 success_selector_timeout failures patched by autofix — confirm the new selector survives a retry next batch.
- chunks 12 + 17 hit 72% peak input — drop --chunk to 1 for nofluffjobs URLs that need external handover.
```

After all chunks (and the retry pass, if any), aggregate the per-chunk
`chunk_signals` you already saw across the whole run. Synthesize 2-5 short
bullet points under "Improvements (suggested):". Each bullet = one concrete
system change the user could make. No filler. Focus on:
- portal recipe issues that recur across chunks (multiple URLs hitting same
  failure_kind on same portal),
- chunk-size signals from telemetry,
- `script_extension_needed` patterns (file upload, dropdown, etc — visible
  in the error log if you grep for the run_id),
- worker output bloat trends (high `worker_output_tokens` consistently → the
  External ATS macros aren't being followed, or the recipe's escalation
  ladder is too long).

Skip the "Improvements" section entirely if nothing actionable came up.

`--verbose` adds live `[worker]` lines to stderr while each chunk runs.
Costs no LLM tokens (Node tails stream-json events itself).

---

## Tab safety + escalation ladder

Canonical rules at **`scripts/escalation-ladder.md`** — tab safety,
4-step ladder, JS templates, success determination, generic external-ATS
success markers. Read it once when escalation OR external handover OR
applied-invalidation autofix is needed.

In **single mode**, the parent agent runs the ladder.
In **batch mode**, the worker runs the ladder; the parent runs the
external-ATS handover and post-batch autofix loops.

**Hard rule: when in doubt → AutoApplyFailed, never Applied.**

---

## Autofix rules (shared)

### Yaml-fixable causes (DO autofix)

- Missing required step → add a new step.
- Wrong selector that timed out + a different selector worked → replace.
- Missing `label_aliases` for a localized label → append.
- Wrong/missing `success_selector` candidate → append.
- Wrong `submit_selector` → replace (only when prior runs also failed —
  check `data/gmail-apply-errors.ndjson` history).
- Missing `data:` key → add sensible default OR `{{key}}` placeholder.

### NOT yaml-fixable (skip + log `autofix_skipped`)

- External_apply: true (worker handed over to external ATS — different portal).
- Cross-domain redirect.
- Per-job server-side validation.
- Login / auth / captcha / rate-limit / transient network.
- File-upload requirement when no upload action exists yet — log
  `script_extension_needed` instead.

### Selector quality

`scripts/selector-quality-rules.md` is the single source of truth. Read
once per session. Tier 1 preferred always.

### Verify before yaml write

```js
function() { return { href: location.href, count: document.querySelectorAll("SEL").length }; }
```

Required: exactly 1 match AND `href` matches target URL. Multiple →
refine. Zero → abort + log `autofix_skipped` (`reason: "selector verification failed"`).

### Patch flow

1. Read `config/gmail-apply-portals.yml`.
2. Compute minimal diff (single field replace OR single step add).
3. Show diff to user.
4. Validate parse: `node -e "require('js-yaml').load(require('fs').readFileSync('config/gmail-apply-portals.yml','utf8'))"`. Parse fail → revert + log `phase:"autofix_failed"`.
5. Append `phase:"yaml_autofix"` to `data/gmail-apply-errors.ndjson`:
   `{url, portal, change_type, before, after, reason}`.
6. Tell user: `yaml autofix applied: [one-line summary]. Test on a fresh URL to confirm.`

### Hard rules for autofix

- DO NOT autofix when escalation FAILED. Only on real Applied.
- DO NOT autofix on cross-domain redirects or `external_apply: true`.
- DO NOT create NEW portal entries via autofix. For first-party portals (the ones we apply to repeatedly), use `/explore-sender`. For EXTERNAL ATS reached via redirect, do NOT create a recipe at all — they are one-time applications, MCP fill is sufficient.
- DO NOT touch other portals' entries. Only the originally-matched one.
- DO NOT use external-domain selectors in the original portal's recipe.
- DO NOT modify the recipe's `match` field.
- Always show diff first.

---

## External ATS handover (single mode parity)

In single mode, when the script returns `redirect.detected: true`:

1. Read `scripts/escalation-ladder.md` § "External ATS handover" — it has
   the canonical hard rules including the **MCP-for-writes /
   evaluate_script-for-reads** rule. Do NOT use `evaluate_script` to set
   `.value` or dispatch synthetic events on external ATS forms — they
   silently fail on framework-bound inputs (Angular/React/Vue).
2. Tab-safety on `redirect.final_url`. Verify `location.href` matches.
   The redirected tab survives Playwright disconnect — it stays open in
   Chrome with the form already loaded.
3. **If `redirect.framework_hint` is non-null** → use its
   `framework_detected` directly; skip your own framework probe.
4. Probe selectors via ONE `evaluate_script`. Then fill via
   `mcp__chrome-devtools__fill` / `fill_form` / `type_text` / `click`.
   Single mode parent reads `config/profile.yml` once for values.
5. Upload CV via `mcp__chrome-devtools__upload_file` —
   path: `assets/cv/CV_www.ArshiaHemati.com_EN.pdf` (absolute). Requires
   one `take_snapshot` first (the only legal use of take_snapshot).
6. Click submit via `mcp__chrome-devtools__click`. Verify success markers
   via `evaluate_script`. Mark Applied with `external_apply: true` if
   confirmed.

**Mid-flow + new-tab redirects.** The script now detects redirects in
THREE places: at startup (URL changed during navigation), mid-flow (any
step that navigated the same tab off-portal), AND new-tab (any step that
opened a NEW tab whose URL doesn't match portal — common pattern on
Experis/Pretius via nofluffjobs). All three emit the same `redirect`
JSON shape with `mid_flow:true` / `new_tab:true` flags. Worker handover
is identical in all three cases.

**No autofix on external_apply** — and do NOT add a yaml recipe for
external ATS either. External pages are one-time applications, DOM not
stable across runs, MCP fill is the right tool every time.

---

## Logging & artifacts

### Error log: `data/gmail-apply-errors.ndjson`

NDJSON, append-only, one line per error. Phases:
`step`, `verify`, `submit`, `submit_unconfirmed`, `escalation`,
`selector_fix`, `script_extension_needed`, `worker_chunk_failure`,
`yaml_autofix`, `autofix_skipped`, `autofix_failed`,
`redirect_to_external`, `applied_invalidated`.

### Per-run artifacts: `data/batch-runs/<run_id>/`

- `plan.json` — what the run was meant to do.
- `profile.json` — small subset of `config/profile.yml` for worker task prompts.
- `ledger.ndjson` — orchestrator events (plan, chunk_done, chunk_fail).
- `steps.ndjson` — per-step records from the Playwright script.
- `evidence/<slug>-<ts>.json` — DOM signal at final state per URL.
- `evidence/<slug>-redirect-<ts>.json` — DOM at redirect detection.
- `evidence/<slug>-external-<ts>.json` — DOM after external-ATS submit.

---

## Errors

| Situation | Action |
|---|---|
| `cdp connect failed` | Tell user to run `launch-chrome.bat`. |
| `no portal matched` (single) | Fall back to `modes/apply.md`. |
| `no eligible URLs` (batch --plan) | Confirm queue is empty, suggest user check status filter / portal coverage. |
| Worker spawn failure (chunk) | Logged to ledger + error log. URLs marked `AutoApplyFailed`. Surface count. |
| Worker output not JSON | Diagnostic in ledger; URLs treated as `AutoApplyFailed`. Re-run with `--verbose`. |
| Redirect detected | External ATS handover (worker in batch / parent in single). |
| Script `redirect.target_portal_match` set (matched a known different portal) | Likely the URL belongs to a different portal in our yaml. Re-invoke single-URL `gmail-apply.mjs` with the redirected URL, or surface to user to add a portal. |
| `step failed` with selector | Likely DOM changed. Tell user step + selector, ask whether to update yaml. |

---

## Caveats

- **Caveman SessionStart hook** prepends ~40 k tokens to every worker
  spawn. Cache stays warm (byte-identical content). Workers see contradictory
  voice instructions; "JSON only" rule wins for haiku in practice.
- **No worker timeout / `--max-turns` cap**. Removed for now; reintroduce
  once we observe real runs.
- **MCP server warm-up**: first `mcp__chrome-devtools__list_pages` may take
  ~2 s.
- **Mid-flow redirects** (after the apply button click) are NOT detected —
  only at startup. Most external-ATS redirects happen at page load
  (theprotocol.it → greenhouse, xing → recruitify), so this covers the
  common case. Mid-flow redirects after click would currently fail step
  verification → escalation ladder kicks in.

---

## Cross-references

- `scripts/gmail-apply.mjs` — Playwright applier. Detects redirect at
  startup, exits early with `redirect` block when the URL leaves the
  matched portal's domain. Accepts `--force --submit --autofix
  --experimental --run-id=<id>`.
- `scripts/gmail-apply-batch.mjs` — orchestrator script. Modes `--plan`,
  `--run-chunk`, `--retry-chunk`. Loads profile.yml + CV path, injects
  into worker task prompt.
- `scripts/gmail-apply-worker-prompt.md` — static worker system prompt
  (cached). Includes External ATS handover.
- `scripts/escalation-ladder.md` — canonical tab safety + 4-step ladder +
  generic external-ATS success markers.
- `scripts/selector-quality-rules.md` — selector hygiene.
- `gmail-apply-architecture.md` — high-level architecture map.
