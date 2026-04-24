# 01 — Context

See [README](README.md) for index. Read [00-goal.md](00-goal.md) first.

## Career-ops architecture at a glance

Career-ops is a Claude-Code-native job-search pipeline. Key files relevant to this research:

| File | Purpose |
|------|---------|
| `portals.yml` | Current source config — Salzburg/DACH focused |
| `scan.mjs` | Zero-token portal scanner — fetches ATS APIs directly |
| `data/pipeline.md` | Inbox of URLs found by scanner |
| `data/scan-history.tsv` | Dedup log |
| `data/applications.md` | Application tracker |
| `modes/oferta.md` | Offer evaluation prompt |
| `modes/scan.md` | Scanner mode prompt |
| `modes/pipeline.md` | Pipeline processing prompt |
| `data/portal-scraping-guide.md` | AT-specific scraping notes (karriere.at, jobs.at, etc.) |

Main orchestrator: `CLAUDE.md` at root. Skill folder: `.claude/skills/career-ops/SKILL.md`.

## `scan.mjs` capabilities (as of commit `a518b12`)

**Supported API types — hardcoded in `detectApi()`:**

1. **Greenhouse** — `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs`
2. **Greenhouse EU** — `https://job-boards.eu.greenhouse.io/{slug}` → canonical API URL
3. **Ashby** — auto-detect from `jobs.ashbyhq.com/{slug}` → `https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true`
4. **Lever** — auto-detect from `jobs.lever.co/{slug}` → `https://api.lever.co/v0/postings/{slug}`

**Not supported:** REST APIs (Adzuna, Arbeitnow, Himalayas, Arbeitsagentur, Remotive, JustJoin.IT hydration), RSS feeds, HTML scraping, Workday, SmartRecruiters, Personio XML, Recruitee, Teamtailor, LinkedIn guest endpoint, hidden-API captures.

**Schema of `portals.yml` entries the scanner reads:**

```yaml
title_filter:
  positive: [...]
  negative: [...]
  seniority_boost: [...]

search_queries:        # Google site: queries for skill mode (LLM-based)
  - name: "..."
    query: 'site:example.com "Full Stack" remote'
    enabled: true

companies:             # Direct ATS for scan.mjs (zero-token)
  - name: Bitpanda
    careers_url: https://jobs.lever.co/bitpanda
    enabled: true
  - name: Personio
    careers_url: https://job-boards.greenhouse.io/personio
    api: https://boards-api.greenhouse.io/v1/boards/personio/jobs
    enabled: true
```

`scan.mjs` iterates `companies`, detects API type, fetches, parses titles, runs `title_filter` check, appends matches to `data/pipeline.md`. `search_queries` are handled in skill mode (LLM processes them, not scan.mjs).

**Concurrency + rate limits:**
- `CONCURRENCY = 10` global
- `FETCH_TIMEOUT_MS = 10000` per request
- No per-source rate limiting — assumes ATS APIs are unlimited

**For `remote-portals.yml` we need scan.mjs extensions (new `type:` branches):**
- `rest-json` — generic REST with config-driven URL template + response path
- `rss` — generic RSS/Atom parser
- `smartrecruiters`, `personio-xml`, `recruitee`, `teamtailor` — ATS variants
- `linkedin-guest` — LinkedIn HTML fragment regex + geoId loop
- `hn-whoishiring` — HN Algolia monthly thread walker
- Per-source rate-limit queue (Remotive hard 2 req/min)

See [05-next-steps.md](05-next-steps.md) for extension plan.

## Current `portals.yml` (Salzburg scope)

**`title_filter.positive`** (64 entries) — core role titles (Full Stack, Backend, Software Engineer), stack-specific (.NET, C#, Angular, Node.js, Python, TypeScript, FastAPI, ASP.NET), AI/automation (Applied AI, AI Engineer, Automation Engineer), German keywords (Softwareentwickler, Webentwickler, Programmierer), broader engineering (API Engineer, Integration Engineer, Systems Engineer).

**`title_filter.negative`** — seniority exclusions (Junior, Intern, Werkstudent, Lehrling, Staff, Lead, Principal, Head, Director, VP, CTO).

**`title_filter.seniority_boost`** — Senior, Mid, Experienced.

**`search_queries`** — ~30 Google `site:` queries targeting:
- AMS (jobs.ams.at) — Austrian public employment service
- devjobs.at, karriere.at, metajob.at, StepStone.at, willhaben.at, kununu, jobs.at, hokify — AT-specific boards
- StepStone.de, Indeed.de — nearby DE for AT residents
- All queries scoped `Salzburg OR Wien OR remote` — so "remote" JDs already partially surface but noisily

**`companies`** (~30 entries) — Austrian employers (Dynatrace, Red Bull, Porsche Informatik, Skidata, Palfinger, eurofunk, 2e-systems, Cloudflight, Tricentis, Bitpanda, Adverity, Storyblok) + EU scaleups already added (Celonis, Personio, wefox, Intercom, Vercel, Temporal, Attio, Factorial, Mistral, Zapier, n8n, Retool, GitLab).

**Gap for `remote-portals.yml`:** Nothing targets EU-remote aggregators (Himalayas, Arbeitnow, Arbeitsagentur, JJIT, NoFluffJobs, LinkedIn guest), nothing covers remote-first EU scaleups beyond ~15 already present. See [02-source-catalog.md](02-source-catalog.md) for the EU-remote gap.

## User profile

**Name / identity**: Arshia Hemati (from auto-memory).

**Location**: Zell am See / Salzburg, Austria. Timezone CET / CEST (UTC+1/+2).

**Network**: AT residential IP. This matters because:
- Xing requires residential DE/AT IPs — user has one by default
- LinkedIn requires account's registered country to match IP geo — user's is AT
- Arbeitsagentur has no geo requirement but Austrian access is trivial
- No need to buy residential proxy service for core Tier A sources

**Tech stack** (from `cv.md` + `config/profile.yml`):
- Primary: .NET / C# / ASP.NET Core / Entity Framework
- Frontend: Angular / TypeScript / RxJS
- Backend: Node.js / Express / FastAPI (Python)
- Cloud: Azure preferred
- DB: SQL Server, Postgres
- AI/automation: LLM integration, browser automation, agentic systems, Elyt (user's startup)

**Seniority**: Senior / Mid. Full-stack engineer with founder experience.

**Contract preferences**:
- Full-time employee (permanent)
- Freelance B2B acceptable — Austrian contractor setup works with EU B2B marketplaces (especially Polish ones per File 1)
- No hourly-gig platforms (Upwork/Fiverr) — not career-path

**Language**:
- English: native-level (primary)
- German: native (Austrian dialect, but written Hochdeutsch for jobs)
- Any EU job posting in English acceptable regardless of company location
- German job postings acceptable — DACH mode (`modes/de/`) available in career-ops if the whole evaluation flow needs to run in German

**Explicit filters (from user feedback files in MEMORY.md):**
- `feedback_writing_style`: No stats in prose. Resume carries metrics.
- `feedback_job_search_stance`: Pragmatic. Money + growth priority. Don't over-filter.
- `feedback_direct_vs_recruiter`: Always prefer direct employer listing over recruiter.
- `feedback_scan_dedup`: Track last-seen listing per portal, incremental scans only.

**Anti-preferences (inferred from `portals.yml.title_filter.negative`):**
- No Junior roles
- No Staff/Principal/Lead/Head/Director/VP/CTO (too senior, user is Mid/Senior IC)
- No Internship / Werkstudent / Lehrling / Praktikum

## Chrome DevTools MCP availability

Chrome DevTools MCP plugin is connected in the Claude Code session this research is happening in. Relevant tools:
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page`
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_network_requests`
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__get_network_request`
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script`
- `mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_snapshot`

**Use cases in this research:**
1. Capture hidden-API tokens (Algolia keys, GraphQL Client-Version headers) one-time per site
2. Verify HTML structure of SSR pages (theprotocol.it, bulldogjob, WeAreDevelopers)
3. Extract `__NEXT_DATA__` from Next.js SPAs (TrueUp, JustJoin.IT post /api/offers death)
4. Confirm LinkedIn guest endpoint behavior (HTML shape, rate limits)
5. Log into Xing once on user's real profile, capture GraphQL calls, save for scan.mjs

**Not yet used in this research — flagged in [05-next-steps.md](05-next-steps.md) for phase 2.**

## Prior pipeline integration

Any source added to `remote-portals.yml` inherits:
- `data/applications.md` tracker — new scan results flow through `data/pipeline.md` → evaluation mode → report → tracker
- `batch/tracker-additions/*.tsv` batching (see `CLAUDE.md#tsv-format-for-tracker-additions`)
- Canonical state machine (`templates/states.yml`)
- Liveness check (`check-liveness.mjs`) — re-verifies posting is still open before application
- Report template (`modes/oferta.md` blocks A-F + G legitimacy)

No special pipeline changes needed for remote sources — they just produce more URLs.

## Dependencies on other files in repo

- `merge-tracker.mjs` — merges `batch/tracker-additions/*.tsv` into `applications.md`. Must run after each batch.
- `verify-pipeline.mjs` — integrity check. Run after adding many entries.
- `normalize-statuses.mjs` — enforces canonical states.
- `dedup-tracker.mjs` — removes dupes.

None of these need modification for `remote-portals.yml` — they're source-agnostic.
