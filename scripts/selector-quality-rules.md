# Selector quality rules — shared

Single source of truth for any code (script, worker, orchestrator agent) that
writes a CSS selector into `config/gmail-apply-portals.yml`. Pick the highest
tier that uniquely identifies the element on the target portal.

## Tier 1 — durable, prefer always

- `[data-cy='value']`, `[data-test='value']`, `[data-testid='value']` — test IDs survive redesigns.
- `[formcontrolname=fieldName]` — Angular reactive form binding. Stable while the form schema is.
- `[name=fieldName]` — HTML form field name.
- Hand-authored `#id` (e.g. `#applyButton`, `#sendApplicationButton`).
  - **Reject auto-generated ids**: `#checkbox_84`, `#mat-input-3`, `#radix-:r1:`, etc.

## Tier 2 — acceptable when no Tier 1 exists

- Semantic + attribute: `button[type=submit]`, `input[type=tel]`, `[aria-label='Submit']`.
- Custom-element tag: `nfj-apply-success`, `nfj-multiselect-dropdown`.
- Combination of Tier-1 ancestor + Tier-2 child: `#apply-modal nfj-apply-known-languages input[type=checkbox]`.

## Tier 3 — last resort, always provide a locale-agnostic anchor alongside

- `:has-text("...")` — locale-fragile. MUST include localized aliases via `label_aliases`.
- Generic class names that look stable. Avoid Tailwind-generated, avoid `_ngcontent-*`.

## Forbidden

- Auto-generated Angular hashes: `_ngcontent-serverapp-c123`, `_nghost-...`.
- `:nth-child(N)` / `:nth-of-type(N)` unless absolutely no alternative — and even then add a TODO comment for `/explore-sender` revisit.
- Single-locale text selectors: `button:has-text("Aplikuj")` alone. Either wrap with locale-agnostic anchor (`#applyButton, button:has-text("Aplikuj"), button:has-text("Apply")`) OR put text variants under `label_aliases`.
- Visible-text Tailwind class names (`tw-bg-teal-veryLight`) — they change with theme tokens.

## Verify before committing

Before writing the new selector to yaml, run one MCP `evaluate_script` on the
locked tab to confirm:

- `document.querySelectorAll(SEL).length === 1`
- The element's tag/role/text matches what you intend.

Multiple matches → refine. Zero matches → abort autofix, log
`phase:"autofix_skipped"` (`reason: "selector verification failed"`).

## Special case — `success_selector`

Prefer `[data-cy='post apply survey button']` over
`aside:has-text('Aplikacja została wysłana')`. Same DOM, but the data-cy
survives translation.
