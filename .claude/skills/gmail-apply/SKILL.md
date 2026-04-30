---
name: gmail-apply
description: Per-portal application automation via Playwright. When user invokes /gmail-apply [URL], /apply-portal [URL], or /career-ops gmail-apply [URL] — run scripts/gmail-apply.mjs which connects to the user's Chrome (port 9222), matches URL to config/gmail-apply-portals.yml, fills the form, verifies state, and exits before submit. User clicks Submit. Falls back to modes/apply.md for unknown portals. Token-lean: zero LLM during fill, just one verification read at the end.
user_invocable: true
args: url
argument-hint: "<job URL> [--force] [--autofix]"
---

# gmail-apply — Playwright-driven form fill

The work is done by `scripts/gmail-apply.mjs` (Node + Playwright). The skill's only job is invoke + relay JSON + verify.

## Hard rules

- **DO NOT** read `cv.md`, `config/profile.yml`, `modes/_profile.md`, or any `reports/*.md`.
- **DO NOT** call `read_page`, `take_snapshot`, `take_screenshot`, `get_page_text`. They dump huge tokens + permission prompts.
- `evaluate_script` is ALLOWED — but ONLY during the `--force` escalation ladder (see below). Never on the happy path.
- **DO NOT** edit selectors or templates inline. Update `config/gmail-apply-portals.yml`.

## Reading the script's JSON output — strict success rules

- `submitted: true` ALONE is NOT success. It only means click landed.
- `submitted_unconfirmed: true` → **submit was NOT confirmed by portal** (success_selector never appeared within `success_timeout_ms`). Treat as FAILURE. Escalate per ladder. NEVER mark Applied based on `submitted: true` if `submitted_unconfirmed: true` is also present.
- `submit_confirmation.kind === "success_selector_matched"` → real success. Mark Applied.
- `submit_confirmation.kind === "success_selector_timeout"` → real failure. Escalate.
- `submit_confirmation.kind === "no_success_selector_configured"` → portal yaml is incomplete. Escalate (probe DOM yourself) AND log `phase:"script_extension_needed"`.

When in doubt → FAIL, not Applied. Better to flag a real success as failed than mark a fail as success.

## Flow

1. Resolve URL — from arg or active tab.
2. Run:
   ```bash
   node scripts/gmail-apply.mjs <URL>
   ```
   Prerequisite: Chrome must be running via `launch-chrome.bat` (port 9222 CDP).

   **If user passed `--force`** in their invocation → run instead:
   ```bash
   node scripts/gmail-apply.mjs <URL> --force
   ```
   This fills AND clicks Submit in one go. Skip the "say send it" handoff. Update `data/pipeline.md` status → `Applied` after the script returns `submitted:true`.
3. Parse the single-line JSON output. Apply the strict success rules above:
   - `{ok:true, submitted:false}` (no `--force` mode) → form filled, awaiting user. Show verification + submit selector. Say `say "send it" to submit`. Do NOT update pipeline.md.
   - `{ok:true, submitted:true}` AND NOT `submitted_unconfirmed` AND `submit_confirmation.kind === "success_selector_matched"` → real success. Tell user the application was confirmed by the portal (cite the matched selector). Update pipeline.md → `Applied`.
   - `{submitted:true, submitted_unconfirmed:true}` → SUBMIT WAS NOT CONFIRMED. Click landed but no success indicator appeared. Run the escalation ladder. Do NOT mark Applied yet. Do NOT update pipeline.md.
   - `{ok:false, ...}` → run escalation ladder if `--force`, otherwise report which step failed. If `no portal matched` → fall back to `modes/apply.md`.
4. **On user "send it"** (only if not already auto-submitted) → re-run with `--submit`:
   ```bash
   node scripts/gmail-apply.mjs <URL> --submit
   ```
   Then update `data/pipeline.md` row → status `Applied`.

## Flags

| Flag | Behavior |
|------|----------|
| (none) | Fill form, verify, stop before submit. User clicks. |
| `--submit` | Fill form, then click Submit ONLY if every step succeeded. |
| `--force` | **Contract: the application MUST be submitted.** Script keeps going on step failures, attempts submit anyway, logs all errors. Agent must escalate if script returns `submitted:false`. |
| `--autofix` | After a SUCCESSFUL escalation, agent MUST update `config/gmail-apply-portals.yml` so the next run handles this case without escalation. Only applies to yaml-fixable causes (see below). Combine with `--force`. |

## `--autofix` contract

When user passes `--autofix` AND escalation produced a real Applied (success_selector matched on the right tab), agent MUST update the yaml so this issue never resurfaces.

### Yaml-fixable causes (DO autofix)

- **Missing required step** → add a new step (`fill`, `check`, `select_dropdown`, etc.) to the portal's `steps` array
- **Wrong selector** that timed out but a different selector worked → replace selector value in the relevant step
- **Missing `label_aliases`** for a localized label → append the encountered locale variant
- **Wrong/missing `success_selector` candidate** → append the actually-observed selector to the array
- **Wrong `submit_selector`** → replace with the working one
- **Missing `data:` key** (e.g. portal asks for a field never seen before) → add a sensible default OR a `{{key}}` placeholder + add to `data` block

### NOT yaml-fixable (DO NOT autofix, log only)

- Redirect to a different domain (portal forwarded to greenhouse/lever/recruitify) — that's the portal's choice for THIS listing, not a recipe defect
- Server-side validation specific to one job (e.g. cover letter required on this listing only) — fixing yaml would hurt other jobs on same portal
- Login/auth issues, account-incomplete errors
- Captcha / rate limiting
- Network errors / timeouts (transient)
- File upload requirement when no upload action exists yet — log `script_extension_needed` instead

When unsure → DO NOT autofix. Log `phase:"autofix_skipped"` with reason. Better to under-fix than corrupt the recipe for other jobs.

### Autofix workflow (post-successful-escalation)

1. Identify the yaml-fixable root cause from your escalation steps. If none → skip autofix, log reason, done.
2. Read `config/gmail-apply-portals.yml`.
3. Compute the minimal diff. Show it to the user before writing.
4. Validate the resulting yaml: `node -e "require('js-yaml').load(require('fs').readFileSync('config/gmail-apply-portals.yml','utf8'))"`. If parse fails → revert.
5. Append a single line to `data/gmail-apply-errors.ndjson` with `phase:"yaml_autofix"`, fields: `url`, `portal`, `change_type` (`add_step`/`replace_selector`/`add_alias`/`add_success_candidate`/`add_data_key`), `before`, `after`, `reason`.
6. Tell user: "yaml autofix applied: [one-line summary]. Test on a fresh URL to confirm."

### Selector quality (autofix MUST pick the most durable selector available)

When patching yaml, you MUST pick the most stable selector you can verify in the live DOM. Cheap text-based selectors break on locale changes, copy edits, or A/B variants. Walk this priority list and pick the highest tier that uniquely identifies the element on this portal:

**Tier 1 — durable, prefer always:**
- `[data-cy='value']`, `[data-test='value']`, `[data-testid='value']` (test IDs survive redesigns)
- `[formcontrolname=fieldName]` (Angular reactive form binding — stable as long as form schema unchanged)
- `[name=fieldName]` (HTML form field name)
- `id` if the id is hand-authored (`#applyButton`, `#sendApplicationButton`) — NOT auto-generated like `#checkbox_84` / `#mat-input-3`

**Tier 2 — acceptable when no Tier 1 exists:**
- semantic + attribute (`button[type=submit]`, `input[type=tel]`, `aria-label='...'`)
- custom-element tag (`nfj-apply-success`, `nfj-multiselect-dropdown`)
- combination of Tier 1 ancestor + Tier 2 child (`#apply-modal nfj-apply-known-languages input[type=checkbox]`)

**Tier 3 — last resort, always provide a fallback alongside:**
- `:has-text("...")` — locale-fragile, MUST include localized aliases via `label_aliases`
- generic class selectors that look stable (avoid Tailwind-generated, avoid `_ngcontent-*`)

**Forbidden:**
- Auto-generated Angular hashes (`_ngcontent-serverapp-c123`, `_nghost-...`)
- `:nth-child(N)` / `:nth-of-type(N)` unless absolutely no alternative — and even then add a TODO comment for `/explore-sender` revisit
- Selectors based on UI-displayed text in a single language (`button:has-text("Aplikuj")` alone). Either wrap with locale-agnostic anchor (`#applyButton, button:has-text("Aplikuj"), button:has-text("Apply")`) OR put text variants under `label_aliases`.
- Visible-text class names from Tailwind (`tw-bg-teal-veryLight`) — they change with theme tokens.

**Verify before committing:**
Before writing the new selector to yaml, run one MCP `evaluate_script` on the locked tab to confirm the selector resolves to exactly the element you want — `document.querySelectorAll(SEL).length` should be 1, and the element's tag/role/text should match. If multiple elements match, refine the selector. If zero match, abort autofix + log `phase:"autofix_skipped"` (`reason: "selector verification failed"`).

For success_selector in particular, prefer `[data-cy='post apply survey button']` over `aside:has-text('Aplikacja została wysłana')` — same DOM, but the data-cy survives translation.

### Hard rules

- DO NOT autofix when escalation FAILED (still AutoApplyFailed). Only on real success.
- DO NOT autofix on cross-domain redirects.
- **DO NOT create NEW portal entries via autofix.** Autofix only modifies the entry whose `match` triggered for the URL the user invoked. If the form lives on a different domain (recruitify.ai, greenhouse.io, lever.co, ATS partners), that's a separate portal — needs `/explore-sender` to map it deliberately, not silent autofix.
- **DO NOT touch other portals' entries.** Only the originally-matched portal.
- **DO NOT use the external domain's selectors to patch the original portal's recipe.** If success_selector was matched on `*.recruitify.ai` while the original URL was `nofluffjobs.com/...`, that selector belongs to recruitify (an external ATS), not to nofluffjobs. Logging the cross-domain success is fine; writing it into the nofluffjobs yaml entry is wrong — it would corrupt future nofluffjobs single-page submits.
- DO NOT modify the recipe's `match` field via autofix.
- DO NOT autofix the `submit_selector` based on a one-off observation if the existing selector worked on prior runs — only when prior runs also failed.
- Always show diff first.

## `--force` contract — agent obligation

When the user invokes with `--force` (or says "force apply", "just submit it", "do it anyway"), the **task is not done until something was actually submitted**. The agent CANNOT stop after the script returns `ok:false` and leave the application unsent. Script failures are signals to escalate, not abort.

Escalation ladder when `submitted:false` OR `submitted_unconfirmed:true` after `--force` run. **Steps 0, 1, 2, 3 in order. Skipping = contract violation.**

### Step 0 — TAB SAFETY (do this FIRST every time)

Chrome usually has multiple tabs. `chrome-devtools` MCP evaluates against the SELECTED page, which may be a stale `/thanks` from a previous URL. Evaluating success on the wrong tab = false positive = catastrophic.

Before EVERY `evaluate_script` during escalation:

1. `mcp__chrome-devtools__list_pages` — see all tabs.
2. Find the page whose URL matches the URL you are processing (same job slug).
3. `mcp__chrome-devtools__select_page` with its `pageId`.
4. ONLY THEN run `evaluate_script`.

Every JS function MUST return `location.href`. If it doesn't match the URL you are applying to → DISCARD the result, re-select correct page, retry. Do NOT interpret data from the wrong page as success on the right page.

If no tab matches the target URL → log `phase:"escalation"` (`reason: target_tab_missing`) and stop. Don't pick another tab.

### Step 1 — Probe + fix selectors via MCP

Inspect the failed step's selector. Find the real one (`formcontrolname`, `name`, `id`, `aria-label`, `placeholder`, `type`, sibling structure). Re-fill via JS on the LOCKED tab. Have JS return both `location.href` AND any visible validation errors (`[...modal.querySelectorAll('.invalid-field, nfj-error, .ng-invalid')]`). If form has validation errors → log + AutoApplyFailed (don't claim success, don't click submit). Log `phase:"selector_fix"` with working selector.

### Step 2 — Verify confirmation via MCP

After any submit click (script's or yours), run JS that returns:
```js
{
  href: location.href,
  success: !!document.querySelector(SUCCESS_SEL),
  modal_open: !!document.querySelector('#apply-modal'),
  invalid_fields: [...document.querySelectorAll('#apply-modal .invalid-field')].map(e => e.querySelector('label')?.innerText)
}
```

Decision:
- `href` doesn't match target URL → wrong tab. Re-do step 0.
- `invalid_fields` non-empty → submit failed validation. Log + AutoApplyFailed. NEVER mark Applied.
- `success: true` AND `modal_open: false` AND `href` correct → real success. Mark Applied with `escalated: true`.
- Anything else → continue to step 3.

### Step 3 — Direct submit via MCP

Only if validation passed (no `invalid_fields`) AND modal still open. Click `submit_selector` via JS on the LOCKED tab. Re-verify per step 2. Still no success → log `phase:"escalation"` with the full step-2 JSON, mark AutoApplyFailed.

### Last resort

After steps 0-3 all failed: tell user "could not auto-submit. Last observed: [step-2 JSON]. Browser open at [target URL] — please complete manually." Counts as task-done. User unblocked.

**Hard rule: when in doubt → AutoApplyFailed, never Applied.**

At every escalation step, errors are appended to `data/gmail-apply-errors.ndjson` (script does this automatically; agent appends one entry per escalation it performed). NDJSON, one JSON object per line. Format:
```json
{"ts":"2026-04-28T...","phase":"escalation","url":"...","step":"manual_click","err":"..."}
```

### When the script itself needs to be extended

If the escalation reveals that the script/yaml as-is **cannot** handle this portal even with a selector fix — e.g. the form needs a new action type (file upload, dropdown, iframe switch, captcha, multi-step wizard, dynamic field add/remove) — log it explicitly so future runs can be improved:

```json
{"ts":"...","phase":"script_extension_needed","url":"...","portal":"...","missing_capability":"file_upload","details":"resume upload field requires multipart/form-data, current script has no upload action","suggested_change":"add `upload {selector, path}` action in scripts/gmail-apply.mjs and yaml schema"}
```

Also log this when:
- A selector fix worked but is fragile (e.g. relies on `:nth-child` or generated class names) — flag for yaml hardening
- The portal's match string was too broad and matched the wrong recipe — flag for `match` refinement
- A new portal was encountered with no entry — flag for adding to yaml

This way `data/gmail-apply-errors.ndjson` doubles as a backlog for script/yaml improvements.

## After a successful submit (any path)

- Update `data/pipeline.md` row → status `Applied`.
- Tell user: `submitted via [path: recipe/manual_click/modes-apply/user]. errors: N (see data/gmail-apply-errors.ndjson)`.

## Error log

Path: `data/gmail-apply-errors.ndjson` (NDJSON, append-only). One line per error. Phases: `step`, `verify`, `submit`, `escalation`. Use `data/gmail-apply-errors.ndjson` for later forensic review — no need to surface it during the run beyond a one-line count.

## Output you give the user

Two lines, like:

```
nofluffjobs: phone=ok, English=ok. submit selector: #sendApplicationButton button.
say "send it" to submit.
```

If verification reports a mismatch, surface it: `phone=MISMATCH (expected +43..., got empty)`.

## Adding a portal

User says "add {portal} to apply recipes". Inspect the form in Chrome, capture stable selectors, append entry to `config/gmail-apply-portals.yml`. Skill + script unchanged.

## Errors

- `cdp connect failed` → tell user to run `launch-chrome.bat`.
- `no portal matched` → load `modes/apply.md`.
- `step failed` with selector → likely DOM changed. Tell user the step + selector, ask whether to update yaml.

---

## Batch mode (`/career-ops gmail-apply-batch [N] [--force]`)

For applying to many URLs at once, use the batch orchestrator instead of single-URL flow:

```bash
node scripts/gmail-apply-batch.mjs [N] [--force] [--dry-run]
```

What it does:
- Reads `data/applications.md`, picks rows with status=`Evaluated` and a matching portal recipe in `config/gmail-apply-portals.yml`.
- Skips URLs failed ≥3 times in last 7 days (per `data/gmail-apply-errors.ndjson`).
- Slices to `N` (default: all).
- Spawns Haiku workers via `claude -p --bare --model haiku` — one worker per 2 URLs, sequential (not parallel). Each worker uses the static system prompt at `scripts/gmail-apply-worker-prompt.md` (same prompt across spawns → 5-min prompt cache hits).
- Workers run `scripts/gmail-apply.mjs <URL> --force` per URL, escalate failures via chrome-devtools MCP, return JSON.
- Orchestrator aggregates, single-pass rewrites `applications.md` statuses (`Applied` or `AutoApplyFailed`).
- Logs: `data/gmail-apply-batch-<date>.ndjson` (per-chunk results), `data/gmail-apply-errors.ndjson` (per-failure forensics).

**Token budget**: ~3-5k Haiku tokens per chunk × ~25 chunks for 50 URLs = ~100k input cost (cached) + ~25k output. Orchestrator itself costs ~0 LLM tokens.

**The agent's job in batch mode**: just run the bash command and relay the final JSON summary. Do NOT narrate per-URL details. Do NOT spawn an Agent — the script spawns workers itself.

Final summary message format:
```
batch: 47/50 Applied, 3 AutoApplyFailed. log: data/gmail-apply-batch-2026-04-28.ndjson
```
