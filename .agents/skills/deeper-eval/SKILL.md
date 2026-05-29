---
name: deeper-eval
description: Evaluate generic software-engineering roles parked in data/pipeline-deferred.md by /scan-gmail. WebFetch first, Chrome DevTools MCP only as fallback when the page is a JS-only shell. Runs the full A-G evaluation from modes/oferta.md, writes a report, and merges a row into data/applications.md via merge-tracker.mjs. Use this skill when the user invokes /deeper-eval, /career-ops deeper-eval, "evaluate deferred", "process deferred pipeline", or "deep eval the generic roles". Read-only outside the project; never auto-applies.
---

# deeper-eval — Generic-role deep evaluation

**Trigger**: `/deeper-eval [N]` or `/career-ops deeper-eval [N]`. Optional `N` limits how many deferred URLs to process this run (default: all).

**Why this exists**: `/scan-gmail` auto-promotes URLs whose title hits the `match_keywords` regex (e.g. .NET / C# / Angular / Node / Python). Anything else — generic "Senior Software Engineer", recruiter-style listings, ambiguous fullstack postings — gets parked in `data/pipeline-deferred.md`. This skill evaluates those properly.

---

## Inputs and outputs

**Reads:**
- `data/pipeline-deferred.md` — list of deferred URLs in the `## Pendientes` section
- `cv.md`, `config/profile.yml`, `modes/_profile.md`, `modes/oferta.md`, `modes/_shared.md`
- `reports/` — to compute next sequential report number
- `templates/states.yml`

**Writes:**
- `reports/{NNN}-{slug}-{YYYY-MM-DD}.md` — full A-G evaluation per oferta.md
- `batch/tracker-additions/{NNN}-{slug}.tsv` — TSV row picked up by `merge-tracker.mjs`
- `data/pipeline-deferred.md` — moves processed URL from `[ ]` to `[x]` with score
- `data/applications.md` — via `merge-tracker.mjs` (do not edit directly)

**Never modifies:** Gmail. The deferred file is the input; URLs are followed read-only.

---

## Workflow per URL

1. **Compute next report number.** Read `reports/`, take max numeric prefix + 1.
2. **Fetch JD — WebFetch first.**
   ```
   WebFetch(url=<URL>, prompt="Extract the full job description text: title, requirements, responsibilities, tech stack, salary if disclosed, contract type, location, posted date if visible.")
   ```
   - WebFetch is cheap and works on static HTML / well-rendered SSR.
3. **Decide if Chrome MCP fallback needed.** Trigger fallback if WebFetch returns ANY of:
   - HTTP error / refused
   - Body text < 500 chars after stripping
   - Content contains markers like `__NEXT_DATA__`, `id="root"`, `<noscript>You need to enable JavaScript`, "Loading...", or returns a generic landing page rather than the JD
   - Title is empty or generic ("Sign in", "Loading")
4. **Chrome MCP fallback (only if step 3 triggers).** Use `mcp__chrome-devtools__navigate_page` + `mcp__chrome-devtools__take_snapshot`. Extract the JD text from the snapshot.
5. **Hard discard check** (oferta.md Paso 0):
   - Contract: temp / fixed-term / B2B-only (no UoP) / freelance / intern / trainee → DISCARD
   - Salary: if disclosed AND top of range below floor (`config/profile.yml` → `compensation.minimum`) → DISCARD
   - If discarded: write a one-line discard report, status `Discarded`, score `N/A`, then move URL to `[x]` in deferred file. Skip remaining steps for this URL.
6. **Run full A-G evaluation** per `modes/oferta.md`. Save to `reports/{NNN}-{slug}-{date}.md`.
7. **Write tracker TSV** to `batch/tracker-additions/{NNN}-{slug}.tsv` — 9 columns:
   ```
   {NNN}\t{date}\t{company}\t{role}\t{status}\t{score}/5\t{pdf_emoji}\t[{NNN}](reports/{NNN}-{slug}-{date}.md)\t{notes}
   ```
   - `status`: `Evaluated` (or `SKIP` / `Discarded` per outcome).
   - `pdf_emoji`: `❌` (this skill does NOT generate PDFs; that is the user's separate `pdf` mode).
8. **Move URL** in `data/pipeline-deferred.md` from `[ ]` to `[x]` with the resolved company / role / score appended:
   ```
   - [x] #{NNN} | {URL} | {Company} | {Role} | {Score}/5
   ```
9. **After processing all URLs in this batch, run `node merge-tracker.mjs`** (from project root). This merges the new tracker TSVs into `data/applications.md` so the dashboard sees them.

---

## Decision: WebFetch vs Chrome MCP

WebFetch first, Chrome MCP as fallback. Reasoning:
- WebFetch returns plain text after server-side rendering. Most ATS portals (Greenhouse, Ashby, Lever, Workable) and direct careers pages render server-side and work fine.
- Chrome MCP is heavy (browser session, snapshot tokens). Use it only for SPAs that gate JD content behind JS (some LinkedIn pages, certain Workday / SuccessFactors instances, Xing job pages with login walls).
- If the URL is `https://www.xing.com/jobs/...` or `linkedin.com/jobs/view/...`, expect to fall back to Chrome MCP fairly often — but still try WebFetch first.

---

## Batch behaviour

- Default: process every `[ ]` URL in `data/pipeline-deferred.md`.
- `/deeper-eval N` → process the first N pending URLs, leave the rest.
- For each URL: do steps 1-8. After the loop, run `merge-tracker.mjs` once.
- If WebFetch + Chrome MCP both fail to extract a JD: mark the URL as `[!]` with note `Error: JD not accessible`, do NOT consume a report number, and continue to the next URL.

---

## CORE RULES

- **Read-only on external sites**: WebFetch and Chrome MCP only navigate / read. Never submit forms.
- **Never edit `data/applications.md` directly** — always go through TSV + `merge-tracker.mjs`.
- **Score floor for auto-promote stays at 5.0**: this skill does NOT set 5.0; it produces the real evaluated score (typically 1.0-4.5) per oferta.md.
- **Use the Auto-Match state ONLY** for `/scan-gmail`. This skill writes `Evaluated`, `SKIP`, `Discarded`, etc. — never `Auto-Match`.

---

## Errors and edge cases

| Situation | What to do |
|---|---|
| WebFetch returns 404 / dead link | Mark `[!]` in deferred file with `JD not accessible`. No report. |
| WebFetch returns SPA shell | Fall back to Chrome MCP. |
| Chrome MCP not started | Tell the user to run launch-chrome.bat (port 9222), then re-run. |
| Salary disclosed below floor | Discard at step 5. Status `Discarded`. |
| LinkedIn requires login | Mark `[!]` with note `LinkedIn login required`. Ask user to paste JD text. |
| `merge-tracker.mjs` rejects status | Validate TSV column order (status BEFORE score in TSV; merge swaps to score-before-status when writing applications.md). |

---

## What "deeper" means

The full A-G evaluation includes WebSearch for compensation data (Block D) and posting legitimacy signals (Block G). That's why this is "deeper" than `/scan-gmail`'s regex-only triage — it actually tells you whether the role is worth your time.
