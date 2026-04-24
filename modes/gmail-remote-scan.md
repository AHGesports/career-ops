# Mode: gmail-remote-scan — Gmail inbox → pipeline.md

**Trigger**: `/career-ops gmail` (also: `gmail-scan`, `scan-gmail`, "scan gmail").

**Execution**: ALWAYS delegated to a general-purpose subagent — not executed in main session. SKILL.md dispatch section holds the subagent-launch template; this file holds the workflow the subagent must follow.

**Scope**: read user's Gmail inbox for job-alert emails, extract job URLs, dedup against existing tracker + pipeline + scan-history, append new URLs to `data/pipeline.md`. **Do NOT evaluate jobs** (that is `/career-ops pipeline` — separate command).

**Companion docs**:
- [`data/gmail-ingestion-setup.md`](../data/gmail-ingestion-setup.md) — user-side subscription setup
- `data/scan-history.tsv` / `data/gmail-scan-history.tsv` — dedup tracker
- `data/pipeline.md` — write target

## Required context for subagent (pre-loaded at dispatch)

The SKILL.md dispatch template pre-loads these into the subagent prompt. If you're running this mode and these files weren't shown to you, read them before starting:

| File | Purpose |
|------|---------|
| `data/gmail-scan-history.tsv` | thread_id dedup — skip already-scanned threads (4-col format: date, thread_id, sender, note) |
| `data/pipeline.md` | URL dedup against existing Pendientes + Procesadas |
| `data/applications.md` | Dedup against already-tracked applications |
| Gmail MCP (`9c2f012f-b756-4053-8783-0579309d8ee8`) | `search_threads`, `get_thread`, `list_labels` — load via ToolSearch if not already loaded |

## Target account

**`hemati.arshia82@gmail.com`** — user's dedicated job-alerts Gmail. All job-subscription emails land here.

If the Gmail MCP server is connected to a different account, STOP and tell user to reconnect:
> "Gmail MCP is connected to `{account}`, not `hemati.arshia82@gmail.com`. Reconnect the Gmail MCP with the correct account before running scan."

## Required MCP tools

Gmail MCP server ID `9c2f012f-b756-4053-8783-0579309d8ee8`. Load schemas first via ToolSearch:
```
ToolSearch("select:mcp__9c2f012f-b756-4053-8783-0579309d8ee8__search_threads,mcp__9c2f012f-b756-4053-8783-0579309d8ee8__get_thread,mcp__9c2f012f-b756-4053-8783-0579309d8ee8__list_labels")
```

If tools unavailable → tell user to install/configure Gmail MCP + point to setup doc.

## Workflow

### Step 1 — verify label exists

Use `list_labels` — confirm `job-alerts` label is present. If missing or if `list_labels` returns `{}` (empty — known MCP quirk) → **do NOT stop**. Proceed with sender-based search in Step 2 (the query works regardless of label). Only hard-stop if the Gmail MCP itself is disconnected.

### Step 2 — search recent alerts (tracker-based dedup, NOT read-state)

**Decision**: do NOT filter by `is:unread`. Gmail MCP has no mark-as-read tool (schema only offers `search_threads`, `get_thread`, `list_labels`, `create_draft`, `create_label`, `list_drafts`). Relying on read state would force user to manually mark every scanned email read — annoying.

**Instead**: time-window query + `data/gmail-scan-history.tsv` for dedup by `thread_id`. Read/unread stays human-UX only.

Primary query:
```
newer_than:1d (from:jobalerts-noreply@linkedin.com OR from:donotreply@jobalert.indeed.com OR from:no-reply@justjoin.it OR from:notifications@nofluffjobs.com OR from:alerts@welcometothejungle.com OR from:no-reply@welcometothejungle.com OR from:news@profil.karriere.at OR from:no-reply@karriere.at OR from:jobs@xing.com OR from:news@e-mail.xing.com OR from:jobagent@arbeitsagentur.de OR from:info@email.stepstone.at OR from:info@email.stepstone.de OR from:notifications@ifttt.com OR from:alerts@himalayas.app)
```

Default window: `newer_than:1d` (daily scan). User overrides: "scan gmail last 6h" → `newer_than:6h`; "scan gmail this week" → `newer_than:7d`.

Optional: prepend `label:job-alerts` if user has set up the filter + label. Reduces query scope when inbox is large.

Call `search_threads` with `pageSize: 50`. Paginate with `pageToken` until all pages drained.

**Why tracker-based**:
- No MCP mark-read needed (not available)
- User never touches Gmail between scans
- Tracker (`message_id` set) is authoritative scan-control
- Idempotent — re-run scan in same window = zero new URLs
- Read/unread belongs to user for their own triage later

### Step 3 — read known-seen tracker

Read `data/gmail-scan-history.tsv`. **Actual column format (4 columns):**
```
date<TAB>thread_id<TAB>sender<TAB>note
```
Example row: `2026-04-23\t19dba6b2aabdcc77\tdonotreply@jobalert.indeed.com\t2 URLs extracted`

Build a set of already-seen **`thread_id`s** (column 2). Skip any thread whose `thread_id` is in this set.

### Step 4 — fetch + parse per thread

For each thread not in history tracker:

1. Call `get_thread(thread_id)` → full message + content
2. Identify sender — match against known senders (table below) to pick parser strategy
3. Extract URLs using sender-specific regex. For unknown senders fall back to generic URL regex + LLM-assisted classification
4. Normalize each URL:
   - Strip tracking params: `utm_*`, `ref`, `src`, `trk`, `mc_eid`, `mc_cid`, `lipi`, `midToken`, `midSig`, `trackingId`
   - Follow redirect wrappers: if host is `linkedin.com/comm/...`, rewrite to `linkedin.com/...`; if `indeed.com/rc/clk?jk=X`, rewrite to `indeed.com/viewjob?jk=X`
   - Canonicalize: lowercase host, strip trailing slash
5. For each URL, also extract from email body if available: title, company, location, short snippet (these become optional metadata for pipeline.md)

### Step 5 — dedup against existing pipeline + scan-history

Read `data/pipeline.md` + `data/scan-history.tsv`. Build set of already-known URLs (+ normalized variants).

For each extracted URL: skip if already present in either file.

### Step 6 — append new URLs to pipeline.md

Append under "## Pendientes" section of `data/pipeline.md`:
```
- [ ] {url} | {company} | {title}     <!-- via Gmail:{sender-short} {date} -->
```

Keep comment tag `<!-- via Gmail:... -->` so pipeline.md shows source provenance.

### Step 7 — update gmail-scan-history.tsv

For each processed thread, append one row. **Match the actual 4-column format:**
```
{YYYY-MM-DD}\t{thread_id}\t{sender}\t{note}
```
`note` = short human-readable description, e.g. `3 URLs extracted`, `FALLBACK scrape NFJ-angular-remote via Chrome DevTools — 10 URLs`, `0 URLs (registration email)`, `0 URLs (all sponsored)`.

**Do NOT write 5 columns.** The `message_id` is the same as `thread_id` for single-message threads — use `thread_id` only.

### Step 8 — summary report

Output to user:
```
Gmail remote scan — {window}
─────────────────────────────
Account:  hemati.arshia82@gmail.com
Window:   newer_than:{1d|6h|7d}
Emails:   {N} threads seen ({M} already in scan-history → skipped)
URLs:     {N} total extracted
          {N} deduped against pipeline/history
          {N} NEW appended to pipeline.md

By source:
  LinkedIn       : {N} new
  Indeed (DE)    : {N} new
  JustJoin.IT    : {N} new (via fallback scrape)
  NoFluffJobs    : {N} new (via fallback scrape)
  ...

Next: /career-ops pipeline  # process these for evaluation
```

**Note on read-state**: not touched by scanner. User marks threads read in Gmail on their own schedule. Scan dedup = `data/gmail-scan-history.tsv` message_id set, independent of read state.

---

## Per-sender parser table

Parse strategy per known sender. Regex patterns extract job URLs from email HTML/plaintext body.

| Sender | URL pattern | Title/company extractable? |
|--------|-------------|-----------------------------|
| `jobalerts-noreply@linkedin.com` | `linkedin\.com/comm/jobs/view/(\d+)` → rewrite to `linkedin.com/jobs/view/$1` | Yes — cards in HTML `<a>` tags; title follows `<h2>` or `<strong>`, company next line |
| `alert@indeed.com` / `noreply@indeed.com` | `indeed\.com/rc/clk\?[^"]*jk=([a-z0-9]+)` → rewrite to `indeed.com/viewjob?jk=$1`. Also country: look for subdomain `de\|at\|nl\|ie\.indeed\.com` | Yes — `<tr>` rows with title, company, location |
| `jobs@weworkremotely.com` | `weworkremotely\.com/remote-jobs/[a-z0-9-]+` | Yes — title inline |
| `hi@remotive.com` / `noreply@remotive.com` | `remotive\.com/remote-jobs/[a-z0-9/-]+` | Yes |
| `email@remoteok.com` / `notifications@remoteok.com` | `remoteok\.com/remote-jobs/\d+` | Yes but **beware honeypot phrases** in JD body |
| `notifications@ifttt.com` | `news\.ycombinator\.com/item\?id=(\d+)` (HN comment link) | Split on comments inside — each HN hiring comment is a separate "job" |
| `noreply@welcometothejungle.com` | `welcometothejungle\.com/(?:en/companies/[^/]+/jobs/[^/?#]+\|[a-z-]+/jobs/[a-z0-9-]+)` | Yes |
| `noreply@nofluffjobs.com` | `nofluffjobs\.com/(?:pl/)?job/[a-z0-9-]+` | Yes — includes salary in subject sometimes |
| `no-reply@justjoin.it` | `justjoin\.it/job-offer/[a-z0-9-]+` | Yes |
| `jobs@xing.com` / `noreply@xing.com` | `xing\.com/jobs/(?:[a-z0-9-]+-)?(\d+)` | Yes |
| `alert@karriere.at` / `no-reply@karriere.at` | `karriere\.at/jobs/\d+` | Yes |
| `alerts@devjobs.at` | `devjobs\.at/jobs/\d+` or slug | Yes |
| `jobagent@arbeitsagentur.de` | `jobboerse\.arbeitsagentur\.de/.*refnr=([A-Z0-9-]+)` | Yes — German fields (arbeitgeber, titel) |
| `alert@stepstone.at` / `alert@stepstone.de` | `stepstone\.(?:at\|de)/(?:stellenangebote\|jobs)/[a-z0-9-]+` | Yes |
| `alerts@himalayas.app` | `himalayas\.app/jobs/[a-z0-9-]+` | Yes |
| Unknown sender | Generic URL regex `https?://[^\s<>"]+` then LLM-classify if job URL | Yes, via LLM |

### Unknown-sender fallback

If sender not in table (new subscription, template drift, etc.):
1. Extract all `https://` URLs from the email body
2. Filter by common job-URL keywords: `/jobs?/`, `/careers/`, `/offer`, `/stellenangebote`, `/job-offer`, `/viewjob`, `/job/`, `/position`, `/opening`
3. For each candidate URL, LLM-classify: "is this a single-job-posting URL?" (yes/no) — batch in one LLM call, ~200 tokens for 10 candidates
4. Yes → include. No → skip.

### Empty-body fallback (HTML-only senders)

**Confirmed affected**: `no-reply@justjoin.it`, `notifications@nofluffjobs.com`. Gmail MCP returns `snippet` + `subject` but no `plaintextBody` (email is HTML-only, server-side body exists per `from:X "keyword"` search test but MCP doesn't expose it).

**Fallback pattern**: when body empty for these senders, scrape the source site's listing URL directly using the filter implied by email subject.

### Complete fallback URL table (MANDATORY — every email subject category must map)

**Every `no-reply@justjoin.it` or `notifications@nofluffjobs.com` unread email MUST be processed.** Parse the subject → identify filter category → hit the matching URL. If subject matches multiple categories, fire multiple scrapes + dedup by URL.

**Rule**: if you see a JJIT/NFJ email and can't body-parse it, **you MUST scrape the corresponding filter URL below. No exceptions.** Missing this = bug, not acceptable shortcut.

| Sender | Subject contains | Fallback URL | Parse pattern |
|--------|------------------|--------------|---------------|
| `no-reply@justjoin.it` | `Net` / `.NET` / `C#` | `https://justjoin.it/job-offers/remote/net?orderBy=DESC&sortBy=published` | `href="/job-offer/[^"]+"` |
| `no-reply@justjoin.it` | `JavaScript` / `Angular` / `TypeScript` / `React` / `Vue` / `Node` | `https://justjoin.it/job-offers/remote/javascript?orderBy=DESC&sortBy=published` | Same |
| `no-reply@justjoin.it` | `Python` | `https://justjoin.it/job-offers/remote/python?orderBy=DESC&sortBy=published` | Same |
| `no-reply@justjoin.it` | `Java` (without Script) | `https://justjoin.it/job-offers/remote/java?orderBy=DESC&sortBy=published` | Same |
| **`notifications@nofluffjobs.com`** | `remote, fullstack, .NET` | `https://nofluffjobs.com/pl/backend?criteria=requirement%3D.net%2Ccategory%3Dfullstack%2Cremote%3Dyes` | `href="/pl/job/[^"]+"` |
| **`notifications@nofluffjobs.com`** | `remote, fullstack, C#` | `https://nofluffjobs.com/pl/backend?criteria=requirement%3Dc%23%2Ccategory%3Dfullstack%2Cremote%3Dyes` | Same |
| **`notifications@nofluffjobs.com`** | `remote, Angular` | `https://nofluffjobs.com/pl/frontend?criteria=requirement%3Dangular%2Cremote%3Dyes` | Same |
| **`notifications@nofluffjobs.com`** | `remote, TypeScript` | `https://nofluffjobs.com/pl/frontend?criteria=requirement%3Dtypescript%2Cremote%3Dyes` | Same |
| **`notifications@nofluffjobs.com`** | `remote, Node` / `remote, Node.js` | `https://nofluffjobs.com/pl/backend?criteria=requirement%3Dnode.js%2Cremote%3Dyes` | Same |
| **`notifications@nofluffjobs.com`** | `remote, Python` | `https://nofluffjobs.com/pl/backend?criteria=requirement%3Dpython%2Cremote%3Dyes` | Same |

**Subject format reminder** — NFJ subjects use Polish pattern: `Nowe oferty pracy, {N} dopasowane do Twoich kryteriów: {filter1}, {filter2}, ...`. Parse after `kryteriów:` to get filter chips.

**Deduplication**:
- Dedup within session by `(sender, filter-slug)` — scrape each filter URL ONCE per scan.
- Dedup against `data/pipeline.md` existing URLs + `data/scan-history.tsv` by normalized URL.
- Dedup against `data/applications.md` — if URL already in tracker, skip.

**Noise filter** (apply after scrape, before pipeline append):
- Drop slugs containing: `lead-`, `principal-`, `staff-`, `junior-`, `intern-`, `trainee-`, `werkstudent-`, `praktikant-`
- Drop slugs with non-dev keywords: `business-process`, `configurator`, `bpm-consultant`, `ferryt-developer`
- Drop yesterday's SKIP entries (check applications.md status column)

**Volume expectation**: each NFJ/JJIT filter returns 15-20 listings. After noise+dedup filter: ~10-12 per filter. Email often says "N matches" — your scrape should return ≥N to match user expectation.

**Approach per fallback-triggered thread**:
1. Parse subject to identify which filter (Net / JavaScript / Angular / fullstack / etc.)
2. **Scrape the listing URL using Chrome DevTools MCP** (load via ToolSearch: `mcp__plugin_chrome-devtools-mcp_chrome-devtools__new_page`, `take_snapshot`). WebFetch is blocked by NFJ and JJIT — do not attempt it for these sites.
3. Extract job slugs from the snapshot — links have pattern `href="/pl/job/[slug]"` (NFJ) or `href="/job-offer/[slug]"` (JJIT)
4. **NFJ only**: the page has two sections — main results and `"MOGĄ CIĘ TEŻ ZAINTERESOWAĆ"` ("You might also be interested in"). **Only extract URLs from the MAIN section** (before that heading). The "might interest you" section contains non-remote jobs from different cities — they will NOT have "Zdalnie" tag. Verify each listing shows "Zdalnie" before including.
5. Apply noise filter (slugs containing `lead-`, `principal-`, `staff-`, `junior-`, `intern-`, `trainee-`, `ferryt-developer`, `business-process`, `bpm-consultant`)
6. Append surviving slugs as `https://{site}/{slug}` to pipeline.md

**⚠️ CRITICAL — NO HALLUCINATION RULE**: If the page is unreachable, Chrome DevTools fails, or you cannot load the snapshot — write `0 URLs (site unreachable)` in scan-history and STOP for that thread. **NEVER invent, guess, or fabricate job URLs.** A hallucinated URL will pass dedup, enter pipeline, waste evaluation time, and fail verification. Zero real URLs is better than fake URLs.

**Dedup consequence**: multiple JJIT emails for the same filter category will trigger multiple identical fallback scrapes. After first scrape in a session, mark the filter as "already scraped this window" so subsequent threads for same filter don't re-hit the site. Use in-memory set during the scan.

**Empty-body check**: `if (thread.messages[0].plaintextBody == null && sender in empty_body_senders) → trigger fallback`.

---

## Error handling

- **Gmail MCP disconnected**: STOP + instruct user to reconnect
- **Account mismatch**: STOP + show current account, require reconnect to `hemati.arshia82@gmail.com`
- **`list_labels` returns `{}`**: do NOT stop — known MCP quirk. Proceed with sender-based search.
- **Label missing**: warn user but continue — sender query works without the label filter.
- **Email parse error (new sender, mangled HTML)**: log to `data/gmail-scan-history.tsv` with note `0 URLs (parse error)`. Don't fail whole run.
- **WebFetch blocked by target site (NFJ, JJIT, others)**: switch to Chrome DevTools MCP (`new_page` + `take_snapshot`). Load ToolSearch: `mcp__plugin_chrome-devtools-mcp_chrome-devtools__new_page,take_snapshot,click`. If cookie dialog appears, click accept. Do NOT fall back to guessing URLs.
- **Chrome DevTools also fails / unavailable**: log `0 URLs (site unreachable — no browser tool)` + report the miss to user. Do NOT invent URLs.
- **Rate-limit from Gmail API**: pause, retry once. If still failing, partial-complete + report remaining count.

---

## Idempotency

Running twice in same 6h window must produce zero new URLs (all deduped). Verified via `data/gmail-scan-history.tsv` thread_id set + `data/pipeline.md` URL set.

---

## Invocation

Triggered by user saying:
- "scan gmail" / "scan gmail for latest remote work"
- "scan gmail last 24h"
- `/career-ops gmail-scan`
- `/career-ops scan-gmail`

Mode takes optional argument for time window (default 6h): `last 6h`, `last 24h`, `last week`, `today`.

---

## Do NOT

- Never DELETE Gmail messages or modify labels beyond reading
- Never forward / send email on user's behalf
- Never auto-apply to any job — just append to pipeline, user reviews via `/career-ops pipeline`
- Never touch emails outside `label:job-alerts` — respect label boundary
- Never send Gmail data to external services — parse locally only
