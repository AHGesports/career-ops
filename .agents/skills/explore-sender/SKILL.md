---
name: explore-sender
description: Inspect a portal's apply form via chrome-devtools MCP and auto-generate (or update) its entry in config/gmail-apply-portals.yml. Use when the user invokes /explore-sender <URL> or /career-ops explore-sender <URL>, or asks to "add a portal", "explore this apply form", "build a recipe for this site". The skill navigates to the URL, opens the apply modal/form, enumerates fields + required flags + submit button, captures a stable selector for each, then appends or updates the portal yaml entry. After form mapping, it pauses for the user to submit manually so it can capture the success_selector from the post-submit DOM.
user_invocable: true
args: url
argument-hint: "<job URL>"
---

# explore-sender — auto-generate portal recipe

Goal: from one URL, produce a working `config/gmail-apply-portals.yml` entry — selectors, steps, success_selector — without the user hand-writing yaml.

## Trigger

- `/explore-sender <URL>`
- `/career-ops explore-sender <URL>`
- "add a recipe for X", "explore this portal", "build apply recipe for this URL"

## Prerequisites

- `launch-chrome.bat` running (Chrome on port 9222)
- User signed in to the portal in that Chrome (so apply modal renders)
- `chrome-devtools` MCP available

## Tools

- `mcp__chrome-devtools__list_pages`
- `mcp__chrome-devtools__select_page`
- `mcp__chrome-devtools__navigate_page`
- `mcp__chrome-devtools__evaluate_script`
- `Read`, `Edit`/`Write` (for yaml)

DO NOT call `read_page`, `take_snapshot`, `take_screenshot`, `get_page_text` — token bloat. All inspection via `evaluate_script`.

## Tab safety (mandatory before EVERY evaluate_script)

1. `list_pages`
2. Find page matching the target URL (host + path) — if none, `navigate_page` opens it
3. `select_page` to lock that tab
4. Each `evaluate_script` MUST return `location.href` so you can verify it's still the right tab. If `location.href` doesn't match → discard, re-select, retry.

Same rule as worker prompt: when in doubt, fail loudly. Never write a recipe for the wrong page.

## Workflow

### Phase 0 — Existing entry check

Read `config/gmail-apply-portals.yml`. Extract host from target URL (e.g. `nofluffjobs.com`). If a portal already matches this host → ask user: "Update existing entry, or skip?"

### Phase 1 — Apply trigger discovery

Lock onto target tab. Run JS that returns ALL plausible apply buttons:

```js
function() {
  const candidates = [];
  const text_re = /^(apply|aplikuj|bewerben|postuler)/i;
  for (const b of document.querySelectorAll('button, a, [role=button]')) {
    const t = (b.innerText || '').trim();
    if (!text_re.test(t)) continue;
    if (!b.offsetParent) continue;
    const r = b.getBoundingClientRect();
    candidates.push({
      tag: b.tagName,
      id: b.id || null,
      cls: (b.className?.toString?.() || '').slice(0, 100),
      text: t.slice(0, 40),
      formcontrol: b.getAttribute('formcontrolname'),
      data_cy: b.getAttribute('data-cy'),
      data_test: b.getAttribute('data-test') || b.getAttribute('data-testid'),
      x: r.x, y: r.y
    });
  }
  return { href: location.href, candidates };
}
```

Pick the most stable selector (priority: `data-cy` > `data-test*` > `id` > `formcontrolname` > unique-class fallback). Click it via JS.

### Phase 2 — Modal root + settle

After click, wait 1s, then find the apply modal container:

```js
function() {
  const sels = ['#apply-modal', '[role=dialog]', 'cmn-apply-fields', '.apply-modal', '.modal.show'];
  for (const s of sels) { const e = document.querySelector(s); if (e && e.offsetParent) return { sel: s, html_head: e.outerHTML.slice(0,200) }; }
  return null;
}
```

Use the matched selector as the recipe's `wait_selector` step.

### Phase 3 — Field enumeration

```js
function() {
  const modal = document.querySelector(MODAL_SEL);
  if (!modal) return { err: 'no modal' };
  const fields = [];
  for (const el of modal.querySelectorAll('input, textarea, select, nfj-multiselect-dropdown, [formcontrolname]')) {
    const labelEl = el.closest('label, nfj-form-field, [class*=form-field]')?.querySelector('label, [nfjlabelstd]');
    const required = el.required || el.getAttribute('aria-required') === 'true' ||
                     el.closest('[class*=required], .invalid-field') !== null ||
                     (labelEl?.innerText || '').includes('*');
    fields.push({
      tag: el.tagName,
      type: el.type || null,
      formcontrol: el.getAttribute('formcontrolname'),
      name: el.name || el.id,
      data_cy: el.getAttribute('data-cy'),
      placeholder: el.placeholder,
      label: labelEl?.innerText?.trim()?.slice(0, 80),
      required,
      value: el.value,
      checked: el.checked,
    });
  }
  // also collect checkbox containers (language, consent, etc.)
  const checkboxRoots = [...modal.querySelectorAll('nfj-apply-known-languages, [class*=consent], [class*=checkbox-group]')]
    .map(c => ({ tag: c.tagName, cls: c.className?.toString?.().slice(0,100), text: c.innerText.slice(0, 200) }));
  return { href: location.href, fields, checkboxRoots };
}
```

Map each field to a step:
- text/email/tel input → `fill` step. Selector pref: `MODAL_SEL input[formcontrolname=X]` then `[name=X]`. Value: `"{{phone}}"`, `"{{email}}"`, etc. Add to `data:` block.
- multi-select dropdown → `select_dropdown` step (NOTE: not yet implemented in script — log `script_extension_needed` instead, leave field as TODO comment)
- checkbox group (languages, consent) → `check` step with `container` + `label` + `label_aliases` (gather aliases from English, Polish, German, Spanish, Italian, French versions of common labels)
- file upload → `upload` step (also not implemented yet — TODO)

Skip non-required + non-essential fields (LinkedIn, GitHub, message — usually optional). Include only fields you must fill to get past validation.

### Phase 4 — Submit button

```js
function() {
  const modal = document.querySelector(MODAL_SEL);
  const btns = [...modal.querySelectorAll('button[type=submit], button[id*=send], button[id*=submit], button[id*=apply]')]
    .filter(b => b.offsetParent)
    .map(b => ({ id: b.id, cls: b.className?.toString?.().slice(0, 100), text: b.innerText.trim().slice(0, 40), data_cy: b.getAttribute('data-cy') }));
  return { href: location.href, btns };
}
```

Pick the most-stable selector for `submit_selector`. Stop here for now — DO NOT click submit during exploration (avoids accidental application).

### Phase 5 — Generate yaml entry

Build the entry as a JS object first, then serialize. Stable-selector priority everywhere: `data-cy` > `data-test*` > `id` > `formcontrolname=X` > `name=X`. Avoid `:nth-child` unless nothing else works. Quote everything.

Template:

```yaml
  - name: <portal-name>
    match:
      - "<host>/"
    submit_selector: "<submit_sel>"
    success_selector:
      - "<TODO: capture from post-submit DOM in Phase 6>"
    success_timeout_ms: 10000
    data:
      phone: "{{phone}}"
      # add only the keys this portal's fields require
    steps:
      - { action: click, selector: "<apply_button_sel>" }
      - { action: wait_selector, selector: "<modal_sel>" }
      - { action: wait_ms, ms: 800 }
      # one step per required field — fill / check / select_dropdown
      # ...
      # STOP. Script does NOT click submit_selector — waits for user "send it".
```

If any required field needs a NEW action type (`select_dropdown`, `upload`, etc.) that's not in the current script: include it in the yaml AND log a `phase:"script_extension_needed"` entry to `data/gmail-apply-errors.ndjson` with the missing capability + suggested implementation. Tell user the recipe is incomplete until script extended.

### Phase 6 — Success selector capture (interactive)

Tell user: "Form mapped. To capture the success_selector, please:
1. Manually fill any TODO fields + click Submit yourself in the open browser tab.
2. When the success indicator appears (thank-you message / redirect / success modal), tell me 'submitted'."

When user says submitted, run JS on locked tab:

```js
function() {
  return {
    href: location.href,
    // common success indicators in order of preference
    candidates: {
      data_cy: [...document.querySelectorAll('[data-cy]')].filter(e => /success|thank|sent|sukces|wyslan|gesendet/i.test(e.getAttribute('data-cy') + e.innerText)).map(e => ({ sel: `[data-cy='${e.getAttribute('data-cy')}']`, text: e.innerText.slice(0, 80) })),
      data_test: [...document.querySelectorAll('[data-test], [data-testid]')].filter(e => /success|thank/i.test((e.getAttribute('data-test') || e.getAttribute('data-testid')) + e.innerText)).map(e => ({ sel: `[data-test='${e.getAttribute('data-test') || e.getAttribute('data-testid')}']`, text: e.innerText.slice(0, 80) })),
      icons: [...document.querySelectorAll('[commonicon*=success], [class*=success-icon], svg[class*=check]')].slice(0, 3).map(e => ({ tag: e.tagName, attrs: { commonicon: e.getAttribute('commonicon'), cls: e.className?.toString?.()?.slice(0,80) } })),
      text_markers: ['Aplikacja została wysłana', 'Application has been sent', 'Bewerbung gesendet', 'Thank you', 'Dziękujemy'].filter(m => document.body.innerText.includes(m)),
    }
  };
}
```

Pick top candidate(s) for `success_selector` array. Prefer `data-cy` selectors first, then text-based `aside:has-text(...)` fallback. Update yaml.

### Phase 7 — Write yaml

Read `config/gmail-apply-portals.yml`. Append the new entry (or replace existing one with same `name`). Validate with `node -e "require('js-yaml').load(require('fs').readFileSync('config/gmail-apply-portals.yml','utf8'))"`. If parse fails → revert + error.

Show user the diff and the resulting block. Ask: "Recipe added. Test with `/gmail-apply <URL>` (no --force) first. OK?"

## Selector quality cheat sheet

Stable (prefer):
- `data-cy='...'`, `data-test='...'`, `data-testid='...'`
- `id='...'` (if not auto-generated like `checkbox_84`)
- `[formcontrolname=fieldName]`
- `[name=fieldName]`

Fragile (avoid):
- generated class names (`_ngcontent-...`, `tw-bg-gray-ddd-${hash}`)
- `:nth-child(N)` — breaks on layout change
- attribute hashes (`_nghost-serverapp-c...`)

Mid-tier (use only if nothing better):
- `:has-text('...')` — locale-fragile
- `aria-label='...'`
- semantic tags (`button[type=submit]`)

## Hard rules

- DO NOT click submit during exploration. Skill must NEVER cause an unintended application.
- DO NOT modify recipe without showing diff to user first.
- DO NOT guess success_selector — capture from real post-submit DOM in Phase 6.
- Tab-safety check (`location.href`) on EVERY JS call.
- When `script_extension_needed` (new action type required), log to errors.ndjson AND tell user clearly the recipe is incomplete.

## Output

End with:
1. Generated yaml block
2. List of any `script_extension_needed` flags
3. Suggested test command: `node scripts/gmail-apply.mjs <URL>` (without `--force` first)
