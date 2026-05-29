---
name: gmail-apply
description: Per-portal application automation with a V3 Node orchestrator that drives the URL loop deterministically and spawns one cheap worker per URL with task-specific contracts for External, Validate, and Recover. Claude uses Haiku workers. Codex uses GPT-5.4 Mini workers by default. Use for /gmail-apply <URL>, /apply-portal <URL>, apply to URL, /gmail-apply, batch apply, apply to all evaluated, or apply to auto-matched. No PDF or report generation.
user_invocable: true
argument-hint: "[<job URL>] [--force] [--autofix] [--verbose] [--dry-run] [--batch] [N] [--submit]"
---

# gmail-apply — V3 single-URL & batch portal applies

Node orchestrator does the URL iteration. A cheap worker handles MCP for ONE URL at a time: Claude provider uses `haiku`; Codex provider uses `gpt-5.4-mini` by default. The parent orchestrator only steps in when script + worker claims disagree OR no evidence file is produced.

## Mode pick

| Input | Mode | Driver |
|---|---|---|
| First positional starts with `http(s)://` | **single** | Direct script + parent MCP if needed |
| No URL OR `--batch` | **batch** | `gmail-apply-batch.mjs --plan` then `--run` |

## Flag matrix

| Flag | Single | Batch | Behavior |
|------|:---:|:---:|----------|
| `<URL>` | required | n/a | Target URL. |
| `[N]` | n/a | optional | Cap on URLs this run. |
| `--force` | ✓ | ✓ | Auto-submit + escalate failures via worker. |
| `--submit` | ✓ |   | Submit only if all steps OK (no escalation). |
| `--autofix` | ✓ | ✓ | After Applied via Recover branch, surface yaml-patch candidates for the parent to apply. |
| `--verbose` |   | ✓ | Tail worker tool_use to stderr. |
| `--dry-run` |   | ✓ | --plan only, no work. |
| `--batch` |   | ✓ | Force batch even with stray positional. |

Prereq: Chrome on port 9222 via `launch-chrome.bat`.

---

## Hard rules (both modes)

- DO NOT read `cv.md`, `config/profile.yml`, `modes/_profile.md`, `reports/*.md`. Orchestrator script reads profile.yml once → `data/batch-runs/<run_id>/profile.json`; workers receive subset inline.
- DO NOT call `read_page`, `take_snapshot`, `take_screenshot`, `get_page_text` from your own MCP work. `evaluate_script` only. `take_snapshot` exception: immediately before `upload_file`.
- DO NOT spawn `Agent` subagent. Batch spawns its own workers from inside Node. Claude runs use `claude -p --model haiku`; Codex runs use `codex exec --model gpt-5.4-mini` by default.
- DO NOT invoke `/explore-sender` autonomously. Only the user runs that. If a URL has no portal recipe in `config/gmail-apply-portals.yml`: orchestrator marks `AutoApplyFailed` automatically. Do not auto-create recipes.
- CV path for external uploads: `assets/cv/CV_www.ArshiaHemati.com_EN.pdf`.

---

## SINGLE-URL flow

```bash
node scripts/gmail-apply.mjs <URL> [--force] [--autofix]
```

Read script JSON. Branch on `script_claim`:

| script_claim / state | Action |
|---|---|
| `redirect.detected:true` | External ATS handover. Parent agent runs External flow per `scripts/escalation-ladder.md` § "External ATS handover". CV path absolute. |
| `script_claim:Failed` (no redirect, no `--force`) | Form filled, awaiting user. Show verification + submit selector. Say `say "send it" to submit`. |
| `script_claim:Failed` (`--force`) | Run Recover flow via MCP per `scripts/escalation-ladder.md`. |
| `script_claim:Applied` | Validate via MCP — read live DOM, confirm success markers, close tab. |

Single-mode autofix: after real Applied via Recover MCP AND `--autofix`: probe alt selectors, patch yaml minimally, validate parse, log `phase:"yaml_autofix"`. Show diff. NEVER autofix on cross-domain or external_apply.

---

## BATCH flow — Node-driven URL loop

### Step 1 — Plan

```bash
node scripts/gmail-apply-batch.mjs --plan [N] [--force] [--autofix]
```

When running under Codex, add `--worker-provider=codex` unless `CAREER_OPS_WORKER_PROVIDER=codex` is already set. The default Codex worker model is `gpt-5.4-mini`; override with `--worker-model=<model>` or `CAREER_OPS_WORKER_MODEL`.

Reads `data/applications.md`, filters status `Evaluated` ∨ `Auto-Match` with matching portal, sorts row `#` desc (newest-first), dedups URLs (keeps newer), slices N. Writes `data/batch-runs/<run_id>/{plan.json, profile.json}` + `evidence/`. Stdout JSON includes `run_id`, `urls`, `cv_path`, `flags`. `--dry-run` returns plan without run_dir — stop, surface preview to user.

### Step 2 — Run

```bash
node scripts/gmail-apply-batch.mjs --run --run-id=<from-plan> [--force] [--autofix] [--verbose]
```

Single command. Orchestrator iterates the entire queue URL-by-URL (Node loop, deterministic). For each URL:
1. Run `scripts/gmail-apply.mjs`.
2. Pick task type from script outcome:
   - `redirect.detected` → External worker
   - `script_claim:Applied` → Validate worker
   - else → Recover worker
3. Spawn one cheap worker with one URL + task-specific context. Worker writes `data/batch-runs/<run_id>/evidence/<slug>-worker-<ts>.json` and emits stdout JSON with `claim`.
4. Compare claims:
   - agree Applied → write `apps.md` row Applied
   - agree Failed → write `apps.md` row AutoApplyFailed
   - script Unknown (redirect) → take worker's claim
   - missing evidence file → respawn worker once; still missing → flag `no_evidence`
   - Applied vs Failed mismatch OR worker emitted Unknown → flag `disputed`
5. With `--autofix` and Applied via Recover: log `applied_via_mcp_recovery` for the parent to patch yaml.

`apps.md` updates per URL (immediate visibility). All decisions logged to `url-verdicts.ndjson`.

### Step 3 — Read final summary, resolve disputes/missing

Stdout JSON shape:
```json
{
  "ok": true, "mode": "run", "run_id": "...",
  "total": 50, "applied": 47, "failed": 1,
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

**If `disputed.length > 0`**: parent orchestrator referees each. For each entry:
1. Read `worker_evidence_path` (JSON file, ~1 KB) — has structured `page_state`.
2. Apply decide() rules:
   - `page_state.success_marker_visible:true && !page_state.modal_open && page_state.validator_errors.length===0` → Applied. Update apps.md via Edit.
   - `page_state.validator_errors` non-empty OR `modal_open:true` → AutoApplyFailed. Update apps.md.
   - Both ambiguous → log to `data/batch-runs/<run_id>/disputed-urls.ndjson` for human review. Leave apps.md untouched.

**If `no_evidence.length > 0`**: parent orchestrator uses chrome-devtools MCP DIRECTLY to probe each URL's live tab.
1. `mcp__chrome-devtools__list_pages` → find tab matching URL.
2. `mcp__chrome-devtools__select_page` then `mcp__chrome-devtools__evaluate_script` with this probe:
```js
() => {
  const modal = document.querySelector('[role=dialog]:not([aria-hidden=true]), .modal.show, #apply-modal:not([hidden])');
  const successText = ['thank', 'success', 'submitted', 'wysłane', 'gesendet', 'merci', 'gracias', 'aplikacja została wysłana'];
  const body = (document.body?.innerText || '').toLowerCase();
  const marker = successText.find(s => body.includes(s)) || null;
  const errors = [...document.querySelectorAll('.invalid-field, .ng-invalid, [aria-invalid="true"], [role=alert], .error-message')]
    .map(e => (e.innerText || '').trim().slice(0, 100)).filter(Boolean).slice(0, 5);
  return {
    href: location.href,
    modal_open: !!modal,
    success_marker_visible: !!marker, success_marker_match: marker,
    validator_errors: errors, form_still_present: !!document.querySelector('form, [role=form]'),
  };
}
```
3. Apply same decide() rules. Update apps.md via Edit.

**Use parent MCP ONLY in the no_evidence path.** All other URLs already adjudicated by Node.

### Step 3.5 — Mailto handler (parent-side)

If `mailto_detected.length > 0` in final JSON: send application email for each entry via Gmail web UI in Chrome.

For each entry `{ url, num, mailto_recipient, role_title, company_name, worker_evidence_path }`:

1. **Detect language** — use rules in `templates/apply-email.md` § "Language detection".
2. **Write subject + body** — read `templates/apply-email.md` for style reference. Write the actual email yourself, adapting the second paragraph to the specific role + company (tech stack match, what stands out about this particular position). Keep tone plain, no superlatives. Do not copy the reference verbatim.
3. **Build Gmail compose URL** (pre-fills To + Subject — body filled separately via JS):
   ```
   https://mail.google.com/mail/u/0/?view=cm&to=<recipient>&su=<subject_urlencoded>
   ```
4. **Navigate** — `mcp__chrome-devtools__new_page` then `mcp__chrome-devtools__navigate_page` to compose URL. Wait for compose window to load (~2s via `evaluate_script`).
5. **Fill body** — `evaluate_script` to set the body field value:
   ```js
   function() {
     const body = document.querySelector('[aria-label="Message Body"], [g_editable=true], div[contenteditable=true]');
     if (!body) return { ok: false };
     body.focus();
     document.execCommand('insertText', false, BODY_TEXT);
     return { ok: true };
   }
   ```
   If `evaluate_script` insertText fails → use `mcp__chrome-devtools__click` on body area then `mcp__chrome-devtools__type_text`.
6. **Attach CV** — `take_snapshot` → find attachment button (aria-label containing "Attach" or "Anhang" or paperclip icon). For lang=de: `upload_file` DE cv first (`assets/cv/CV_www.ArshiaHemati.com_DE.pdf`) then EN cv (`assets/cv/CV_www.ArshiaHemati.com_EN.pdf`). For lang=en: EN cv only.
7. **Send** — `take_snapshot` → find Send button → `mcp__chrome-devtools__click`. Wait 2s.
8. **Verify** — `evaluate_script` checks compose window closed (no `[aria-label="Message Body"]`) OR sent-mail confirmation. If confirmed: update `applications.md` row → `Applied`, note `via mailto to <recipient>`. If not confirmed: log `phase:"mailto_send_failed"` to errors log, leave status `AutoApplyFailed`.
9. **Close tab** — `mcp__chrome-devtools__close_page`.
10. **Log** to `data/gmail-apply-errors.ndjson`:
    ```json
    {"ts":"<iso>","phase":"mailto_sent","run_id":"<id>","url":"<url>","num":"<num>","recipient":"<email>","subject":"<subject>","lang":"<de|en>"}
    ```

**Hard rules:**
- One email per URL only — never send twice.
- If `mailto_recipient` is null or empty → log `phase:"mailto_skipped"` reason `no_recipient`, leave `AutoApplyFailed`.
- DO NOT CC or BCC any address.
- DO NOT attach anything other than the CV PDF.

### Step 4 — Final summary

```
batch <run_id>: 47/50 Applied (2 via External handover, 3 via Recover), 1 AutoApplyFailed.
disputed (parent-resolved): 2 → 1 Applied, 1 Failed, 0 escalated.
no_evidence (parent MCP probe): 1 → 1 Applied.
mailto (parent sent): 1 → 1 Applied via email.
yaml autofixes (suggested): 3.
log: data/batch-runs/<run_id>/url-verdicts.ndjson
```

---

## Tab safety + escalation ladder

Canonical at **`scripts/escalation-ladder.md`** — tab safety, JS templates, success determination, external-ATS markers + handover. Read once when running External handover (single mode) or doing parent-side disputed/no_evidence resolution.

**Hard rule: when in doubt → AutoApplyFailed, never Applied.**

---

## Autofix rules

Triggered when URL ends Applied via Recover branch (script Failed → worker MCP-fixed). Orchestrator surfaces `applied_via_mcp_recovery` log entry; parent patches yaml.

**Yaml-fixable (DO autofix):** missing required step, wrong selector timed out + alt worked, missing `label_aliases`, missing/wrong `success_selector` candidate, wrong `submit_selector`, missing `data:` key.

**NOT yaml-fixable:** external_apply:true, cross-domain redirect, per-job server validation, login/auth/captcha/transient, file-upload with no upload action.

Selector quality: `scripts/selector-quality-rules.md`. Tier 1 always preferred.

Verify before yaml write:
```js
function() { return { href: location.href, count: document.querySelectorAll("SEL").length }; }
```
Required: exactly 1 match AND `href` matches target. Multiple → refine. Zero → abort + log `autofix_skipped`.

Patch flow: read yaml → minimal diff → show user → validate parse (`node -e "require('js-yaml').load(require('fs').readFileSync('config/gmail-apply-portals.yml','utf8'))"`) → on parse fail revert + log `phase:"autofix_failed"` → append `phase:"yaml_autofix"` to error log → tell user `yaml autofix applied: [summary]. Test on fresh URL.`

**Hard rules:**
- DO NOT autofix when worker also Failed (only on real Applied).
- DO NOT autofix on cross-domain or `external_apply:true`.
- DO NOT create new portal entries via autofix.
- DO NOT touch other portals' entries.
- DO NOT modify `match` field.
- Always show diff first.

---

## Logging & artifacts

**Error log** `data/gmail-apply-errors.ndjson` — append-only forensic log across all runs.

**Per-run** `data/batch-runs/<run_id>/`:
- `plan.json`, `profile.json`
- `ledger.ndjson` — orchestrator events (run_start, url_start, url_verdict, run_done)
- `url-verdicts.ndjson` — one line per URL with full witness + decision dump
- `steps.ndjson` — per-step from script
- `script-progress.ndjson` — per-URL script start/done heartbeat
- `evidence/<slug>-<ts>.json` — script final-state DOM
- `evidence/<slug>-redirect-<ts>.json` — script at redirect
- `evidence/<slug>-worker-<ts>.json` — **NEW V3 — worker page-state evidence (Validate/Recover/External)**
- `disputed-urls.ndjson` — parent-side review queue (only ambiguous-after-parent cases)

---

## Errors

| Situation | Action |
|---|---|
| `cdp connect failed` | Tell user run `launch-chrome.bat`. |
| `no eligible URLs` (batch --plan) | Confirm queue empty, suggest user check status filter / portal coverage. |
| Worker spawn failure for a URL | Logged in `url-verdicts.ndjson` as `no_evidence`. Surface in final summary. |
| Worker output not JSON | Same — logged as `no_evidence`, parent MCP probes the tab. |
| Redirect detected | External worker handles via MCP. |
| `step failed` with selector | Recover worker fixes via MCP. With `--autofix`, yaml patched after success. |

---

## Cross-references

- `scripts/gmail-apply.mjs` — Playwright applier. Detects redirect at startup/mid-flow/new-tab, exits with `redirect` block. Emits `script_claim`.
- `scripts/gmail-apply-batch.mjs` — V3 orchestrator. Modes `--plan`, `--run`. Pure Node URL loop.
- `scripts/gmail-apply-worker-prompt.md` — V3 worker system prompt (single-URL, 3 task templates).
- `scripts/escalation-ladder.md` — canonical ladder + external-ATS handover.
- `scripts/selector-quality-rules.md` — selector hygiene.
- `gmail-apply-architecture.md` — high-level map.
