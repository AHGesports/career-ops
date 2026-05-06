# Apply escalation ladder — canonical

Single source of truth: tab-safety, 4-step escalation, JS templates, success
determination, external-ATS handover rules. Referenced by SKILL.md (parent
agent in single mode) + worker prompt (haiku in batch).

---

## CRITICAL: tab safety before any MCP eval

Chrome usually has multiple tabs. `chrome-devtools` MCP evaluates against the
CURRENTLY SELECTED page — may be a leftover `/thanks` from prior URL.
**Wrong-tab eval = false positive = catastrophic** (Applied marked when nothing sent).

Before EVERY `evaluate_script` during escalation OR autofix:

1. `mcp__chrome-devtools__list_pages`.
2. Find page whose URL matches target URL (or same origin + same job slug).
3. If not selected, `mcp__chrome-devtools__select_page` with its `pageId`.
4. THEN run `evaluate_script`.

After running JS, FIRST check `location.href` in return value. Doesn't match target → DISCARD result, re-select correct page. Never interpret data from wrong page.

No tab matches target → log `phase:"escalation"` (`reason: target_tab_missing`), stop. Do NOT pick another tab.

---

## 4-step escalation ladder

Triggered on `submitted:false` OR `submitted_unconfirmed:true` after `--force`. **Steps 0–3 in order. Skipping = contract violation.**

### Step 0 — Tab safety

See above. Lock onto right tab.

### Step 1 — Probe + fix selectors via MCP

Inspect failed step's selector. Find real one (`formcontrolname`, `name`, `id`, `aria-label`, `placeholder`, `type`, sibling structure). Re-fill via JS on locked tab. JS returns `location.href` AND visible validation errors:

```js
[...modal.querySelectorAll('.invalid-field, nfj-error, .ng-invalid')]
```

Validation errors → log + AutoApplyFailed. Don't claim success, don't click submit. Log `phase:"selector_fix"` with working selector.

### Step 2 — Verify confirmation via MCP

After any submit click:

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

| Signal | Action |
|---|---|
| `href` mismatch target | Wrong tab. Re-do Step 0. |
| `invalid_fields` non-empty | Validation failed. Log + AutoApplyFailed. |
| `success:true` AND `modal_open:false` AND `href` correct | Real success. Applied with `escalated:true`. |
| Anything else | Step 3. |

### Step 3 — Direct submit via MCP

Only if validation passed AND modal still open. Click `submit_selector` via JS on locked tab. Re-verify per Step 2. Still no success → log `phase:"escalation"` with full Step-2 JSON, AutoApplyFailed.

### Last resort

Steps 0–3 all failed: tell user "could not auto-submit. Last observed: [Step-2 JSON]. Browser open at [target URL] — please complete manually." Counts as task-done.

---

## Success determination — strict

URL counts Applied ONLY when ALL hold:

1. `location.href` is target URL (or post-submit redirect from SAME origin / same job slug).
2. `success_selector` from yaml matched on that page.
3. Apply modal closed OR success aside/icon/locale-text marker visible.

Ambiguity = FAIL. URL on different domain/slug → FAIL even if /thanks. "Modal closed but no success indicator" → FAIL. "Looked successful but didn't list_pages first" → FAIL.

Doubt → `phase:"escalation"` + AutoApplyFailed. Better flag real success as failed than mark fail as success.

---

## JS templates

`evaluate_script` invokes function for you. Pass `function() { ... }` — NOT IIFE, NOT bare expressions.

```js
// click
function() {
  const e = document.querySelector("SEL");
  if (!e) return { ok: false, err: 'not found' };
  e.click();
  return { ok: true, href: location.href };
}

// fill (Angular reactive form — internal portal recipes only, NOT external ATS)
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

// inspect
function() {
  const e = document.querySelector("SEL");
  if (!e) return { found: false, href: location.href };
  return { found: true, href: location.href,
           html: e.outerHTML.slice(0, 400),
           parent: e.parentElement?.outerHTML.slice(0, 200) };
}

// async wait
async function() {
  for (let i = 0; i < 50; i++) {
    if (document.querySelector("SEL")) return { ok: true, href: location.href };
    await new Promise(r => setTimeout(r, 100));
  }
  return { ok: false, err: 'timeout', href: location.href };
}
```

Every JS function MUST return `location.href` so caller verifies it ran on expected tab.

---

## Error log

All steps append JSON line to `data/gmail-apply-errors.ndjson`: `ts`, `phase`, `url`, `portal`, `step`, `err`, plus context. Phases during escalation: `escalation`, `selector_fix`, `script_extension_needed`, `submit_unconfirmed`, `redirect_to_external`, `applied_invalidated`. `mkdir -p` parent dir if needed.

---

## External ATS handover (when `redirect.detected:true`)

Original portal's recipe cannot apply on external ATS (greenhouse/lever/recruitify/smartrecruiters/etc — selectors differ). Switch to chrome-devtools MCP, fill using `EXTERNAL_PROFILE` block from task message (single mode: parent reads `config/profile.yml`).

Detailed step-by-step: `scripts/gmail-apply-worker-prompt.md` § "External ATS handover". This section = success determination + hard rules.

### Simplify Copilot pre-fill (always present in `redirect.simplify`)

`gmail-apply.mjs` ALWAYS runs Simplify autofill on redirected tab before bailing. Result:

```json
{ "supported": bool, "clicked": bool, "alreadyFilled": bool,
  "filledFieldCount": N, "cvUploaded": bool, "filledFields": [...],
  "durationMs": ms, "error": null|string }
```

| Branch | Condition | Flow |
|---|---|---|
| **A — Simplify filled it** | `supported && (clicked OR alreadyFilled)` | Skip blanket fill. ONE `evaluate_script` READ → `errors_visible` + empty `[required]` fields + submit selector. Skip `upload_file` if `cvUploaded:true`. MCP-fill gaps only. Submit. Verify. On validation errors, MCP-fill flagged fields, resubmit ONCE, re-verify. |
| **B — not supported** | `!supported` OR `error` non-null | Full probe + fill flow per worker prompt. |

Branch A common case for Greenhouse/Lever/Ashby — saves ~6 identity fills + CV upload per URL. Branch B for Workday/iCIMS/SuccessFactors/Taleo/custom.

`simplify.error` non-null → treat as `supported:false`. Simplify never blocks agent.

### Generic success markers

After submit on external ATS:

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
- `errors_visible` non-empty AND `form_still_present` → submit failed validation. AutoApplyFailed (`failure_kind:"validation_failed"`).
- `marker_match` set OR `url_changed` true → real success. Applied with `external_apply:true` + `evidence_path`.
- Otherwise ambiguous → AutoApplyFailed (`failure_kind:"external_unconfirmed"`, `autofix_eligible:false`).

### Hard rules — external handover

- **WRITES via MCP, READS via `evaluate_script`.** Most external ATS forms are JS-framework-bound (Angular `FormControl`, React controlled inputs, Vue `v-model`). Synthetic events from `evaluate_script` do NOT trigger Zone.js / React synthetic event chain / Vue reactivity — validators see empty fields, reject. CDP keystrokes from MCP DO trigger them. Use `mcp__chrome-devtools__fill` / `fill_form` / `type_text` / `click` / `upload_file` for every value setting. NEVER use `evaluate_script` for `.value=`, `.checked=`, synthetic `input/change`. `evaluate_script` reads only — selectors, success markers, validator errors, framework detection.
- Framework-detection probe in same `evaluate_script` as field probe. `framework_detected.any === true` → MCP fill mandatory; no evaluate_script-fill fallback.
- **3-strike per field**: field still empty after 3 distinct write strategies (e.g. `fill` → `type_text` → `click`+`fill`) → STOP. AutoApplyFailed with `failed_field_name`, `last_mcp_tool_used`, `validator_error_text_observed`.
- DO NOT autofix yaml for `external_apply` results. DO NOT create new yaml entries for external ATS — one-time apps, DOM not stable.
- Tab safety: every JS returns `location.href`; verify matches `redirect.final_url`.
- File upload: `mcp__chrome-devtools__upload_file` with `cv_path_absolute` from EXTERNAL_PROFILE. MCP requires `take_snapshot` immediately before `upload_file` (throws `"No snapshot found for page X"` otherwise) — ONLY permitted use of `take_snapshot`. Upload fails → log `phase:"script_extension_needed"` (`missing_capability:"file_upload"`) + AutoApplyFailed.
- DO NOT invent values for unknown required fields → AutoApplyFailed (`failure_kind:"external_unknown_required_field"`).
