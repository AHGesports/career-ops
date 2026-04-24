# Final plan — v3 (Gmail-first strategy evaluation)

See [README](README.md) for folder index. Updated after user scope corrections:
1. **No salary filter** for remote jobs
2. **Prefer portal/aggregator-level over per-company ATS** (more volume per call)
3. **DevTools captures un-deferred** — they're per-aggregator wins, not per-company
4. **Gmail-based email-digest ingestion** proposed as primary strategy — evaluated below

---

## The Gmail-first hypothesis

**Hypothesis**: user subscribes to saved-search email alerts on all the major job platforms. Claude + Gmail MCP reads daily digests, extracts URLs, feeds career-ops pipeline. **This may replace ~80% of the scraper.**

### Why this is elegant

- **Zero scraping of source sites** — they send the data willingly
- **Pre-filtered by user's own saved-search criteria** on each site (user tunes once, forever)
- **Covers auth-gated sources we ruled out**: LinkedIn Saved Searches work because LinkedIn itself does the auth on its end and emails user
- **One auth only**: user's Gmail via MCP (already available in this Claude Code environment: `mcp__9c2f012f-b756-4053-8783-0579309d8ee8__*`)
- **Legally trivial** — reading user's own inbox
- **Self-healing against anti-bot** — if LinkedIn or Xing tighten scraper defenses, emails still arrive
- **Bypasses Cloudflare/DataDome entirely** — Indeed/Glassdoor/Monster become accessible via email alerts
- **Tracks user's attention profile** — sites learn user's preferences over time; emails become sharper

### Email alert content verification (agent research 2026-04-20)

**Critical distinction:** not all job-alert emails are equal.

- **Category A** = rich job cards embedded with title + company + location + direct URL. **Zero-click scraping works.**
- **Category B** = marketing nudge ("6+ jobs match you — click to see!"). Useless — click still hits source site with potential auth issues.

Sources classified from agent research + community evidence:

**✅ Category A — CONFIRMED rich (use these):**

| Source | Evidence |
|--------|----------|
| **LinkedIn Saved Search** | Multipart MIME, plaintext + HTML. Job cards with title/company/location/URL `/comm/jobs/view/{id}` (resolves to public `/jobs/view/{id}`). Parseable. Cap: 20 active alerts. Still rich 2026. |
| **Indeed Email Alerts** (DE/AT/NL) | Title/company/location/salary/URL/posted date. URL format `indeed.com/rc/clk?jk={id}`. Rich 2026. |
| **We Work Remotely** | 600k+ subscribers; rich per-region/category alerts. MailChimp-style template. |
| **Remotive daily** | Curated 2000 jobs, rich text-email format. |
| **RemoteOK daily** | Matches public site format (no login gate on source). RSS cleaner than email. |
| **HN Who-is-hiring** | Via HNHiring.com / IFTTT weekly digest. Structured. Better than raw HN email. |
| **Welcome to the Jungle** | Help docs say "daily summary each morning when new offers match" — rich format implied. |
| **NoFluffJobs + JustJoin.IT** | MailChimp templates = structured HTML. Public sites (no auth gate on click). |

**❌ Category B / DEAD — do NOT subscribe:**

| Source | Reason |
|--------|--------|
| **Pragmatic Engineer Jobs Digest** | **DEAD April 27, 2024** — Pallet vendor exited job-board space. |
| **Jobgether** | Marketing nudge language, login-gated destination |
| **Wellfound (AngelList)** | Likely nudge, login past page 2 for full JD |
| **Hiring.cafe alerts** | "Noticeable delay", no rich cards per user reports |

**❓ Unverified — subscription test required (subscribe + wait 48h + inspect):**

| Source | Expected verdict |
|--------|-----------------|
| **Xing Jobagent** | Likely A (DACH LinkedIn-clone). Cap: **only 5 alerts per user** — pick wisely. |
| **karriere.at alerts** | Likely A — small AT portal, no nudge incentive |
| **devjobs.at alerts** | Likely A — niche AT dev |
| **jobs.at alerts** | Likely A |
| **StepStone.at + .de** | Likely A + heavy URL tracking |
| **Arbeitsagentur Jobagent** | Likely A — government run, no ad monetization |
| **Himalayas alert** | Unclear — RSS or site scrape may be cleaner |
| **GermanTechJobs.de** | Weekly (not daily), likely A |
| **theprotocol.it alerts** | Unverified |

**Estimated total subscriptions after filter**: ~10-12 confirmed Category A + selective from unverified list. **Not 15-20.**

**Estimated daily email volume**: ~10-12 emails carrying ~100-300 job URLs after dedup.

### URL destination gotcha (important)

Email gives URL + optional snippet. For career-ops **evaluation** we need full JD text.

**Public JD pages** (no login needed to read — just to apply):
- LinkedIn `/jobs/view/{id}` — confirmed Session 1 probe (291KB HTML)
- Indeed `/viewjob?jk=...` — public
- Xing job detail — public (confirmed Session 1)
- karriere.at job detail — public
- Polish boards (JJIT, NFJ, theprotocol) — public
- Arbeitsagentur job detail — public via API
- Most sites — JD public, only Apply requires auth

**Gated JD pages** (click from email hits login wall):
- Wellfound past page 2
- Hiring.cafe detail
- Some Jobgether pages

**Pipeline flow:**
1. Email parse → URL + snippet (regex/LLM, low tokens)
2. Dedup against history
3. **WebFetch URL unauthenticated → full JD** (works for Category A destinations)
4. LLM eval on full JD

Sources with gated destinations → drop entirely OR rely on email snippet alone (lower eval quality).

### Architecture sketch

```
┌─────────────────────────────────────────────┐
│ User subscribes to ~15 saved-search alerts  │
│ (one-time setup per source)                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Daily emails    │
          │ land in Gmail   │
          └────────┬────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ scan.mjs --gmail                            │
│ 1. Gmail MCP: search label:job-alerts       │
│    newer_than:1d                            │
│ 2. Per thread: parse HTML email body        │
│ 3. Extract URLs matching job-posting        │
│    patterns per source                      │
│ 4. De-duplicate by normalized URL           │
│ 5. Apply title_filter (if needed)           │
│ 6. Emit to data/pipeline.md                 │
└─────────────────────────────────────────────┘
                   │
                   ▼
          career-ops evaluate loop
          (existing: modes/oferta.md)
```

### Dedup strategy

Emails cross-post heavily. Same LinkedIn job hits user's inbox via LinkedIn Saved Search + maybe Hiring.cafe + maybe WTTJ.

- **Primary key**: normalized `apply_url` (strip query tracking params: `utm_*`, `ref`, `src`, `trk`)
- **Secondary key**: `SHA1(lower(title) + lower(company))` for when apply_url varies per source (aggregator redirect URLs)
- **Gmail message tracking**: store Gmail `message_id` in `data/scan-history.tsv` so same email isn't reparsed

### Token cost estimate

Gmail-based scan:
- 20 emails × ~2k tokens avg per email = 40k tokens per scan (reading + parsing)
- 4 scans/day = 160k tokens/day for ingest

vs. current MVP plan (aggregator APIs):
- 5 API calls × minimal parsing tokens (scan.mjs is zero-token for structured JSON)
- But EVAL pass per new job = ~3k tokens × 30 jobs = 90k/scan × 4 = 360k tokens/day

**Gmail strategy might actually be CHEAPER** because:
1. Each email already contains the job description — no need for separate detail-page fetch for EU-fit gate
2. Source-side filtering is already applied (user's saved-search criteria)
3. Fewer false positives = fewer wasted eval tokens

Rough estimate: **Gmail-only ≈ 200-300k tokens/day. Aggregator-only ≈ 300-500k tokens/day.** Gmail wins if saved searches are tuned right.

### Failure modes

| Risk | Mitigation |
|------|-----------|
| Email marked as spam → user misses jobs | User adds "important" filter to job-alert domains; or give `label:job-alerts` auto-label |
| Source changes email template → parser breaks | Generic LLM-based URL extractor (one-time ~1k tokens per source) rather than regex per source |
| User unsubscribes / inbox clutter | Dedicated Gmail filter / label `job-alerts` so noise stays separate |
| Some sources have crap alerts (only 1 job per week) | Combine with 1-2 aggregator API backstops (Arbeitsagentur + Himalayas) |
| Gmail MCP rate limits | Gmail API free tier: 1B quota units/day. Search + read = ~10 units each. 20 emails × 4 scans = 800 units/day. Sustainable. |
| Saved-search setup takes hours one-time | OK tradeoff — once done, never again |

### What Gmail doesn't cover well

- **Direct ATS companies** (Greenhouse/Ashby/Lever of specific EU scaleups) — these don't send alerts unless user sets up each company's career page alert (painful)
- **HN Who-is-hiring** — monthly thread, email-subscribable but handles differently
- **Companies without public alerts** — small AT/DACH employers in portals.yml

**→ Gmail strategy needs 1-2 supplementary sources to fill the "direct scaleup fresh alert" gap.**

### Verdict on Gmail strategy

**Recommend: YES — as PRIMARY strategy.** Run Gmail ingestion + 2 supplementary aggregators.

- Advantages dominate: covers auth-gated sources, minimal scraper maintenance, user-tuned quality, legal triviality
- Disadvantage: ~2 hours of user setup (subscribing + saved searches across 15 sites)
- Right move: **Phase 1 ships Gmail ingest + supplementary aggregators**. Deprecate per-company ATS chasing.

---

## Revised v3 plan — Gmail-first

### Primary — Gmail daily digest ingestion

User subscribes to ~15 sources. `scan.mjs --gmail` reads Gmail, parses, feeds pipeline.

### Supplementary — 2-3 aggregator APIs for gaps

Only what Gmail alerts don't cover well:

1. **Arbeitsagentur REST** — covers DE small/mid employers that don't send alerts; federal data. One query returns 100+ jobs.
2. **Himalayas API** — covers remote-first scaleups that may not have email alerts yet; EU-TZ filtered.
3. **Existing `portals.yml`** (unchanged) — AT-specific employers + DACH scaleups already in tracker.

**No more per-company ATS adds for remote-portals.yml**. User's insight correct: portal/aggregator = more volume per call than per-company.

### Tertiary — DevTools captures (un-deferred)

Previously deferred but re-evaluated. These give **portal-level** volume via one-time capture, not per-company. Reconsider per source:

| Capture | Unique value vs Gmail + aggregators | Priority |
|---------|--------------------------------------|----------|
| **Indeed GraphQL** (de/at/nl/ie/fr/es/pl) | Gmail covers via "Indeed job alerts" subscription → Gmail dominates. DevTools only if Gmail alerts sparse. | Low |
| **Welcome to the Jungle Algolia** | Gmail covers WTTJ saved searches → Gmail dominates. | Low |
| **Xing public GraphQL** | Gmail covers Xing saved searches → Gmail dominates. | Low |
| **JustJoin.IT Next.js hydration** | Gmail covers JJIT alerts → Gmail dominates. | Low |
| **NoFluffJobs POST** | Gmail covers NFJ alerts → Gmail dominates. | Low |
| **LinkedIn guest endpoint** | Gmail covers LinkedIn Saved Searches → Gmail dominates. | Low |
| **Hiring.cafe** | Gmail covers hiring.cafe alerts → Gmail dominates. | Low |

**→ Gmail strategy makes DevTools captures largely redundant**. Only valuable if user reports specific source's email alert is weak.

### NO per-company ATS in remote-portals.yml MVP

The 10 companies I previously listed (N26, Klarna, Linear, etc.) → **drop from remote-portals.yml MVP**. Cover them via:
- LinkedIn Saved Search (user filters by company in LinkedIn)
- Jobgether / WTTJ / Himalayas alerts
- Arbeitsagentur for DE ones
- Himalayas for remote-first ones

If a specific target company reliably *isn't* surfacing in Gmail + aggregators after 2 weeks, THEN add it manually. Reactive, not preemptive.

---

## Revised `remote-portals.yml` schema

Much smaller than v2:

```yaml
# Remote EU Portal Scanner — Gmail-first
# Goal: every-6h LLM-powered scan + apply loop
# Primary: Gmail email-digest ingestion
# Secondary: 2 aggregator APIs for gaps

title_filter:
  positive:
    # Inherit stack from portals.yml + remote tokens
    - Remote
    - Fully Remote
    - EU Remote
    - Home Office
    - Homeoffice
    - Telearbeit
    - Distributed
  negative:
    # Inherit seniority from portals.yml + US-exclusion
    - US only
    - USA only
    - United States only
    - PST
    - EST required
    - Eastern Time
    - Pacific Time
    - Americas only
    - must reside in US

# Gmail-based ingestion (NEW type)
gmail_sources:
  label: "job-alerts"     # User sets up Gmail filter to tag these
  newer_than: "1d"        # Per scan
  # Per-sender URL extraction hints (optional — LLM can handle generic)
  senders:
    - from: "jobalerts-noreply@linkedin.com"
      url_pattern: "linkedin.com/comm/jobs/view/[0-9]+"
    - from: "jobagent@arbeitsagentur.de"
      url_pattern: "jobboerse.arbeitsagentur.de/.*refnr=[A-Z0-9-]+"
    - from: "alerts@himalayas.app"
    - from: "alerts@remotive.com"
    - from: "jobs@xing.com"
    - from: "noreply@welcometothejungle.com"
    - from: "no-reply@justjoin.it"
    - from: "newsletter@pragmaticengineer.com"
    - # ... user fills rest after subscription setup

# Aggregator API fallbacks (NEW type, fills gaps)
feeds:
  - name: "Arbeitsagentur — DACH remote"
    type: "arbeitsagentur"
    url: "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs"
    headers: { X-API-Key: "jobboerse-jobsuche" }
    params:
      was: "Softwareentwickler"
      arbeitszeit: "ho"
      veroeffentlichtseit: 1
      size: 100
    enabled: true

  - name: "Himalayas — EU-TZ Engineering"
    type: "himalayas"
    url: "https://himalayas.app/jobs/api/search"
    params: { timezoneRestrictions: "0,1,2,3", categories: "Engineering", limit: 20 }
    paginate: true
    enabled: true

# No companies: section for remote — use portals.yml for that
# No salary filter — noted in header
```

**Total size**: ~60 lines vs previous v2's ~150.

---

## Revised Phase 1 build plan — Gmail-first

### Phase 1A — Gmail setup (user-driven, ~2 hours total)

**User does this, not Claude code.**

#### Phase 1A.1 — Subscribe to CONFIRMED Category A (1 hour)

These are evidence-backed rich-content sources. Subscribe all:

- [ ] **LinkedIn Saved Searches** — set up 3-5 searches: (a) EU-remote + .NET, (b) EU-remote + Angular, (c) DACH + fullstack, (d) optional: remote + AI Engineer. Cap: 20 alerts. Set "daily" cadence.
- [ ] **Indeed Email Alerts** — subscribe via de.indeed.com + at.indeed.com + nl.indeed.com: "Softwareentwickler remote", ".NET remote", "Angular remote". Daily.
- [ ] **We Work Remotely** — category alert: remote-full-stack-programming + remote-back-end-programming.
- [ ] **Remotive** — daily digest, filter software-dev.
- [ ] **RemoteOK** — daily digest. Note: anti-LLM honeypots in JD text, watch for them.
- [ ] **HNHiring.com** via IFTTT weekly applet (not HN directly).
- [ ] **Welcome to the Jungle** — set up EU + remote filter, daily alert.
- [ ] **NoFluffJobs** — daily alert for remote + backend/fullstack.
- [ ] **JustJoin.IT** — daily alert for remote/net + remote/javascript.

#### Phase 1A.2 — Subscribe to UNVERIFIED, test (30 min subscribe + 48h wait)

- [ ] **Xing Jobagent** — **only 5 allowed**, pick: (1) remote .NET DACH, (2) remote Angular DACH, (3) Salzburg dev, (4) Wien fullstack, (5) remote TypeScript DACH.
- [ ] **karriere.at** Jobalarm — remote + dev stack
- [ ] **devjobs.at** alert — all categories
- [ ] **Arbeitsagentur Jobagent** — create at `arbeitsagentur.de`, filter `Homeoffice` + dev keywords
- [ ] **StepStone.at + StepStone.de** alerts — remote + dev
- [ ] **Himalayas** daily alert — EU TZ + engineering (may be redundant with API, but test email quality)
- [ ] **GermanTechJobs.de** weekly — no filter needed (small set)

Wait 48 hours. Inspect each first email. Classify A or B.

- [ ] After 48h: drop any that arrived as marketing nudge or never arrived.

#### Phase 1A.3 — Gmail label + filter (15 min)

- [ ] Create Gmail label `job-alerts`
- [ ] Create filter: sender matches any of the subscription domains → auto-label `job-alerts` + skip inbox (keeps main inbox clean)

**Domains to whitelist** (initial):
```
from:(jobalerts-noreply@linkedin.com OR
      alert@indeed.com OR alerts@indeed.com OR
      jobs@weworkremotely.com OR
      hi@remotive.com OR
      notifications@remoteok.com OR
      newsletter@ifttt.com OR
      noreply@welcometothejungle.com OR
      noreply@nofluffjobs.com OR
      no-reply@justjoin.it OR
      jobs@xing.com OR
      alert@karriere.at OR
      alert@devjobs.at OR
      jobagent@arbeitsagentur.de OR
      alert@stepstone.at OR
      alert@stepstone.de OR
      alerts@himalayas.app OR
      alert@germantechjobs.de)
```

(User fills in exact sender domains after first alerts arrive.)

#### Phase 1A.4 — Drop Category B / dead (don't subscribe)

- ~~Pragmatic Engineer Jobs Digest~~ — DEAD April 2024
- ~~Jobgether~~ — nudge
- ~~Wellfound~~ — nudge + gated
- ~~Hiring.cafe alerts~~ — delayed + weak

### Phase 1B — scan.mjs Gmail ingestion (~4 hours)

- [ ] Add `--gmail` mode to scan.mjs
- [ ] Use `mcp__gmail__search_threads` with query `label:job-alerts newer_than:6h`
- [ ] Use `mcp__gmail__get_thread` per result
- [ ] Parse email HTML body: extract `<a href=...>` matching per-sender URL patterns
- [ ] Normalize URLs (strip utm_*, ref, trk tracking params)
- [ ] Dedup against `data/scan-history.tsv` + new Gmail-message-id tracker
- [ ] Emit new URLs to `data/pipeline.md`

### Phase 1C — Supplementary aggregator APIs (~4 hours)

- [ ] `remote-portals.yml` with Arbeitsagentur + Himalayas feed entries (no companies section, no Adzuna)
- [ ] scan.mjs parsers: `arbeitsagentur` + `himalayas`
- [ ] `--portals <path>` CLI flag + dual-load merge with portals.yml

### Phase 1D — Integration + dry-run (~1 hour)

- [ ] `node scan.mjs --gmail --portals remote-portals.yml --dry-run`
- [ ] Spot-check 30 jobs: EU-fit, stack match, dedup working

**Total**: ~11 hours (2 user + 9 code). MVP usable at end.

**Acceptance**: 4 × daily scan runs produce 20-50 unique EU-remote .NET/Angular jobs with <5% duplicates after dedup.

---

## Phase 2 — reactive add-ons (only if MVP gaps)

Trigger: after 1 week of MVP, if `<20 jobs/6h` consistently OR user reports specific missing coverage.

- [ ] Add Adzuna AT+DE+CH (4 hours)
- [ ] Add 1 DevTools capture (most likely Indeed GraphQL, 2 hours)
- [ ] Add 1-2 Tier C SSR HTML (theprotocol.it for Polish B2B, 2 hours)

---

## Phase 3 — every-6h automation (~4 hours, after MVP stable)

- [ ] Cron / `/schedule` skill: `node scan.mjs --gmail --portals remote-portals.yml` every 6h
- [ ] Wire scan → `modes/oferta.md` evaluation → tracker (existing flow)
- [ ] Auto-queue scores ≥4.5 for user review (never auto-submit per ethics rule)
- [ ] Daily token budget report

---

## Decisions — resolved (updated)

1. **Salary filter for remote jobs?** NO — removed from spec
2. **Per-company ATS focus?** NO — portal/aggregator level wins for volume
3. **DevTools captures?** Un-deferred in principle, but made **redundant by Gmail strategy** — only add reactively
4. **Gmail-based ingestion viable?** YES — primary strategy
5. **Gmail + auth persistence (earlier concern)?** RESOLVED — user's own Gmail OAuth via MCP is not the same problem as scraping authenticated LinkedIn. Totally different auth model.
6. **Which aggregator APIs backstop Gmail?** Arbeitsagentur (DACH enterprise not in alerts) + Himalayas (remote scaleups not yet on LinkedIn). Skip Adzuna MVP.
7. **Which email alerts matter most?** LinkedIn Saved Search + Arbeitsagentur Jobagent + Himalayas + Pragmatic Engineer are the top-4 by quality/volume.

## Decisions — still open

1. **Email parser: LLM-based or regex?** LLM more robust (~500 tokens per email) vs regex per-sender (fast but breaks on template drift). Start LLM, optimize regex for high-volume senders.
2. **Gmail MCP specific API** — confirm which gmail MCP tool exists in this env. Deferred tools list shows `search_threads`, `get_thread`, `list_drafts`, `create_draft`, `create_label`. Should suffice.
3. **What if user's Gmail doesn't have MCP installed yet?** Setup doc needed as part of Phase 1A.

---

## Token budget (revised)

| Strategy | Ingest tokens/6h | Eval tokens/6h | Total tokens/day |
|----------|------------------|----------------|------------------|
| v2 (aggregators only) | ~0 (structured JSON) | ~100k (30 jobs × 3k) | ~400k |
| v3 (Gmail + 2 aggregators) | ~40k (15 emails × 2k LLM parse) | ~60k (20 unique jobs × 3k) | ~400k |
| v3 after regex optimization | ~5k (only LLM for unknown senders) | ~60k | ~260k |

Gmail strategy is token-neutral initially, **token-cheaper after optimization**.

---

## How to execute

Option A: **Go Phase 1A** — I write user setup doc (`data/gmail-ingestion-setup.md`) listing which alerts to subscribe + Gmail filter rules. User sets up over a couple days. Then Phase 1B-D.

Option B: **Go Phase 1B** — I build the Gmail scan.mjs code assuming user will subscribe in parallel. Risk: user not done when code ships = no test data.

Option C: **Skip Gmail for now** — user explicitly decides Gmail adds too much setup overhead. Fall back to v2 plan (Arbeitsagentur + Himalayas + 10 ATS companies).

Recommend **Option A**. Gmail setup is the big value unlock — don't shortcut it.

Say **go A** / **go B** / **go C** → execution begins.
