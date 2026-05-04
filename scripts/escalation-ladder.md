# Apply escalation ladder — canonical

Single source of truth for tab-safety + 4-step escalation + JS templates +
success determination. Referenced by:

- `.claude/skills/gmail-apply/SKILL.md` (parent agent uses this in single mode)
- `scripts/gmail-apply-worker-prompt.md` (haiku worker uses this in batch mode)

If you change anything here, no other file needs updating.

---

## CRITICAL: tab safety before any MCP eval

Chrome usually has multiple tabs. `chrome-devtools` MCP evaluates against the
CURRENTLY SELECTED page, which may be a leftover `/thanks` from a previous
URL. **Evaluating success on the wrong tab = false positive = catastrophic**
(Applied marked when nothing was sent).

Before EVERY `evaluate_script` during escalation OR autofix:

1. `mcp__chrome-devtools__list_pages` — see all tabs.
2. Find the page whose URL matches the URL you are processing (or same
   origin + same job slug).
3. If that tab is not selected, call `mcp__chrome-devtools__select_page` with
   its `pageId`.
4. ONLY THEN run `evaluate_script`.

After running JS, the FIRST thing you check in the return value is
`location.href`. If it doesn't match the URL you are applying to → DISCARD
the result and re-select the correct page. Do not interpret data from the
wrong page as success on the right page.

If no tab matches the target URL → log `phase:"escalation"`
(`reason: target_tab_missing`) and stop. Do NOT pick another tab.

---

## 4-step escalation ladder

Triggered on `submitted:false` OR `submitted_unconfirmed:true` after a
`--force` run. **Steps 0–3 in order. Skipping = contract violation.**

### Step 0 — Tab safety

See section above. Lock onto the right tab before any further evaluation.

### Step 1 — Probe + fix selectors via MCP

Inspect the failed step's selector. Find the real one (`formcontrolname`,
`name`, `id`, `aria-label`, `placeholder`, `type`, sibling structure).
Re-fill via JS on the LOCKED tab. Have JS return `location.href` AND any
visible validation errors:

```js
[...modal.querySelectorAll('.invalid-field, nfj-error, .ng-invalid')]
```

Validation errors → log + AutoApplyFailed (don't claim success, don't click
submit). Log `phase:"selector_fix"` with the working selector.

### Step 2 — Verify confirmation via MCP

After any submit click (script's or yours), run:

```js
function() {
  return {
    href: location.href,
    success: !!document.querySelector(SUCCESS_SEL),
    modal_open: !!document.querySelector('#apply-modal'),
    invalid_fields: [...document.querySelectorAll('#apply-modal .invalid-field')]
      .map(e => e.querySelector('label')?.innerText)
  };
}
```

Decision table:

| Signal | Action |
|---|---|
| `href` doesn't match target URL | Wrong tab. Re-do Step 0. |
| `invalid_fields` non-empty | Submit failed validation. Log + AutoApplyFailed. |
| `success: true` AND `modal_open: false` AND `href` correct | Real success. Mark Applied with `escalated: true`. |
| Anything else | Continue to Step 3. |

### Step 3 — Direct submit via MCP

Only if validation passed AND modal still open. Click `submit_selector` via
JS on the LOCKED tab. Re-verify per Step 2. Still no success → log
`phase:"escalation"` with the full Step-2 JSON, mark AutoApplyFailed.

### Last resort

After Steps 0–3 all failed: tell user "could not auto-submit. Last observed:
[Step-2 JSON]. Browser open at [target URL] — please complete manually."
Counts as task-done. User unblocked.

---

## Success determination — strict

A URL counts as Applied ONLY when ALL of these hold:

1. `location.href` is the target URL (or its post-submit redirect from the
   SAME origin / same job slug).
2. The `success_selector` defined in `config/gmail-apply-portals.yml` for
   this portal was matched on that exact page.
3. The apply modal is closed OR the success aside / icon / locale-text
   marker is visible.

Any ambiguity = FAIL. URL on different domain / different job slug → FAIL
even if it shows /thanks. "Modal closed but no success indicator" → FAIL.
"Looked successful but I didn't list_pages first" → FAIL.

When in doubt → `phase:"escalation"` log + AutoApplyFailed. Better to flag a
real success as failed than mark a fail as success.

---

## JS templates for escalation

`evaluate_script` invokes the function for you. Pass `function() { ... }` —
NOT IIFE, NOT bare expressions.

```js
// click
function() {
  const e = document.querySelector("SEL");
  if (!e) return { ok: false, err: 'not found' };
  e.click();
  return { ok: true, href: location.href };
}

// fill (Angular reactive form)
function() {
  const e = document.querySelector("SEL");
  if (!e) return { ok: false, err: 'not found' };
  e.focus();
  e.value = "VAL";
  e.dispatchEvent(new Event('input', { bubbles: true }));
  e.dispatchEvent(new Event('change', { bubbles: true }));
  e.blur();
  return { ok: true, href: location.href };
}

// inspect surroundings
function() {
  const e = document.querySelector("SEL");
  if (!e) return { found: false, href: location.href };
  return {
    found: true,
    href: location.href,
    html: e.outerHTML.slice(0, 400),
    parent: e.parentElement?.outerHTML.slice(0, 200),
  };
}

// async wait for selector to appear
async function() {
  for (let i = 0; i < 50; i++) {
    if (document.querySelector("SEL")) return { ok: true, href: location.href };
    await new Promise(r => setTimeout(r, 100));
  }
  return { ok: false, err: 'timeout', href: location.href };
}
```

Every JS function MUST return `location.href` so the caller can verify it
ran on the expected tab.

---

## Error log

All escalation steps append a JSON line to `data/gmail-apply-errors.ndjson`
with fields: `ts`, `phase`, `url`, `portal`, `step`, `err`, plus any
context. Phases used during escalation: `escalation`, `selector_fix`,
`script_extension_needed`, `submit_unconfirmed`,
`redirect_to_external`, `applied_invalidated`.

`mkdir -p` the parent dir if needed.

---

## External ATS handover (when `redirect.detected: true`)

When `gmail-apply.mjs` returns `redirect.detected: true`, the original
portal's recipe cannot apply (selectors differ on external ATS like
greenhouse, lever, recruitify, smartrecruiters). Switch to chrome-devtools
MCP and fill the form manually using profile data the orchestrator
provided in the task message (`EXTERNAL_PROFILE` block). Detailed steps
live in `scripts/gmail-apply-worker-prompt.md` § "External ATS handover";
this section captures the **success determination** so it's shared with
single-mode parent agent.

### Generic success markers (apply on the redirected tab)

After clicking submit on an external ATS form, run `evaluate_script`:

```js
function() {
  const t = (document.body?.innerText || '').toLowerCase();
  const markers = [
    'thank you for applying', 'application received', 'application submitted',
    'your application has been', "we've received", 'we have received',
    'application sent', 'wysłane', 'wysłaliśmy', 'aplikacja została',
    'gesendet', 'erhalten', 'merci pour votre candidature', 'gracias por',
  ];
  return {
    href: location.href,
    url_changed: /thanks|success|submitted|confirmation/i.test(location.href),
    marker_match: markers.find(m => t.includes(m)) || null,
    form_still_present: !!document.querySelector('button[type=submit], input[type=submit]'),
    errors_visible: [...document.querySelectorAll('[role=alert], .error, .invalid-field, .ng-invalid, [aria-invalid=true]')]
      .slice(0, 5).map(e => (e.innerText || '').slice(0, 120)),
  };
}
```

Decision:
- `errors_visible` non-empty AND `form_still_present` → submit failed
  validation. AutoApplyFailed (`failure_kind: "validation_failed"`).
- `marker_match` set OR `url_changed` true → real success. Mark Applied
  with `external_apply: true` AND `evidence_path: <saved JSON>`.
- Otherwise ambiguous → AutoApplyFailed
  (`failure_kind: "external_unconfirmed"`, `autofix_eligible: false`).

### Hard rules for external handover

- **WRITES via MCP, READS via `evaluate_script`.** This is the most-violated
  rule and the canonical statement of it. On external ATS forms, you MUST
  use chrome-devtools MCP write tools — `mcp__chrome-devtools__fill`,
  `fill_form`, `type_text`, `click`, `upload_file` — for every value
  setting. NEVER use `evaluate_script` to set `.value`, `.checked`,
  dispatch synthetic `input/change` events, or otherwise mutate DOM to
  fill fields.
  - **Why** (so you don't "optimize" back to evaluate_script under turn
    pressure): most external ATS forms are JS-framework-bound (Angular
    `FormControl`, React controlled inputs, Vue `v-model`). Synthetic
    events from `evaluate_script` do NOT trigger Zone.js / React synthetic
    event chains / Vue reactivity — the framework's validators see empty
    fields and reject. CDP keystroke events from MCP write tools DO
    trigger them.
  - `evaluate_script` is correct for READS ONLY: probing selectors,
    success markers, validator error text, framework detection.
  - The previous Experis batch run wasted 68 worker turns trying
    `.value=` + `dispatchEvent('input')` on an Angular form before
    giving up. Don't repeat.
- Always run a framework-detection probe in the same `evaluate_script`
  call as the field probe (see worker prompt for the canonical probe).
  If `framework_detected.any === true`, MCP fill is mandatory; no
  evaluate_script-fill fallback is allowed.
- 3-strike per field: if a field still verifies as empty after 3 distinct
  write strategies (e.g. `fill` → `type_text` → `click` then `fill`),
  STOP and AutoApplyFailed with structured reason
  (`failed_field_name`, `last_mcp_tool_used`,
  `validator_error_text_observed`).
- DO NOT autofix `config/gmail-apply-portals.yml` for external_apply
  results. DO NOT create new yaml entries for external ATS either —
  external pages are one-time applications, DOM not stable across runs,
  not worth a recipe. Complete via chrome-devtools MCP and move on.
- Tab safety: every JS function returns `location.href`; verify it
  matches `redirect.final_url` before trusting the result.
- File upload (CV) → `mcp__chrome-devtools__upload_file` with the
  `cv_path_absolute` from the EXTERNAL_PROFILE block. The chrome-devtools
  MCP requires a `take_snapshot` immediately before `upload_file` (it
  throws `"No snapshot found for page X"` otherwise). This is the only
  permitted use of `take_snapshot` in batch flow. If upload fails, log
  `phase:"script_extension_needed"`
  (`missing_capability: "file_upload"`) + AutoApplyFailed.
- DO NOT invent values for unknown required fields. Skip → AutoApplyFailed
  (`failure_kind: "external_unknown_required_field"`).
