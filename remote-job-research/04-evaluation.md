# 04 — Evaluation + ranked picks

See [README](README.md) for index. Read [02-source-catalog.md](02-source-catalog.md) and [03-probes.md](03-probes.md) first.

This file **ranks the candidate sources** into tiers and logs definite drops with evidence.

---

## Ranking criteria (weighted)

1. **EU-remote .NET/Angular signal** (40%) — actual volume of user-stack jobs
2. **Probe status** (20%) — live confirmed, dead, unknown
3. **Build cost** (15%) — LoC to add parser in scan.mjs, or DevTools capture complexity
4. **Reliability / anti-bot risk** (10%) — Cloudflare + proxy needs, ban-risk on account-auth sources
5. **Uniqueness** (10%) — does this source add jobs not in already-selected sources?
6. **Rate-limit tolerance** (5%) — can we scan daily without throttling?

Tiers:
- **A** = must build in weekend 1 MVP
- **B** = add weekend 2 after Tier A stable
- **C** = add later / nice-to-have
- **D** = Google `site:` fallback (no scan.mjs extension needed)
- **Drop** = do not include — with evidence

---

## Tier A — must build

MVP coverage. Zero or near-zero anti-bot. Confirmed live [probes](03-probes.md#session-1--2026-04-20).

### A.1 — Existing ATS types (no scan.mjs change, just yml entries)

**40-60 EU scaleup companies** on Greenhouse / Ashby / Lever. See [02-source-catalog.md#a2](02-source-catalog.md#a2--eu-scaleups-to-add-to-remote-portalsyml).

**Rationale**: scan.mjs already supports these 3 ATSes. Zero-token. Freshest source (minutes after recruiter opens req). Zero anti-bot. Dedupe against existing `portals.yml`.

**Effort**: verify each slug via one-off probe → drop into yml. ~1 hour for 60 companies.

**Dependency**: none.

### A.2 — Arbeitsagentur REST API

**URL**: `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs` + header `X-API-Key: jobboerse-jobsuche`

**Rationale**: DE federal employment agency. Massive DACH volume. `arbeitszeit=ho` = explicit Homeoffice filter. Zero Cloudflare. Static shared API key (no rotation, anon-safe). Canonical community repo `bundesAPI/jobsuche-api` documents every param.

**Effort**: ~30 LoC scan.mjs `type: 'arbeitsagentur'` branch. 1 hour including response shape parse + detail-endpoint integration for full JD.

**EU signal**: VERY HIGH for DE remote. User's AT residence doesn't block access.

**Confidence**: 100% — probed live 200 with real response body.

### A.3 — Himalayas API

**URL**: `https://himalayas.app/jobs/api/search?country=Austria&timezoneRestrictions=0,1,2,3&limit=20&offset=0`

**Rationale**: 115k total jobs, rich filters (`country`, `timezoneRestrictions`, `categories`, `seniority`, `employmentType`, `minSalary`). `companySlug` field for cross-source dedup. No auth.

**Effort**: ~40 LoC including pagination walk. Walk until `offset+limit >= totalCount`.

**EU signal**: HIGH — TZ filter [0,1,2,3] = UTC/CET/EET aligns with Austria exactly.

**Confidence**: 100%.

### A.4 — Arbeitnow API

**URL**: `https://www.arbeitnow.com/api/job-board-api?page=N`

**Rationale**: 25/page, DE-heavy, `remote` boolean. Berlin-built, zero-auth. Coverage layer complementing Arbeitsagentur (Arbeitsagentur has federal legacy enterprise; Arbeitnow has modern startups).

**Effort**: ~20 LoC. No cursor in response — walk `?page=1..N` until empty array.

**EU signal**: MEDIUM-HIGH (DE bias). Filter `remote:true` client-side.

**Confidence**: 100%.

### A.5 — Adzuna REST API (replaces hiring.cafe at this slot)

**URL**: `https://api.adzuna.com/v1/api/jobs/{cc}/search/{page}?app_id=X&app_key=Y&what=.NET&where=Austria&max_days_old=2&category=it-jobs&results_per_page=50`

**Rationale** (verified by sub-agent 2026-04-20): Free tier **confirmed open** — self-serve signup at `developer.adzuna.com`, no business justification. Rate 25/min, 250/day, 1000/week, 2500/month. 10 EU ccTLDs live (`at`, `de`, `ch`, `nl`, `pl`, `fr`, `be`, `es`, `it`, `uk`). Best single aggregator for AT/DE/CH remote dev.

**Effort**: ~50 LoC scan.mjs `type: 'adzuna'` with config-driven country loop + key from `.env`. Requires `.env.example` entry + docs.

**Attribution**: Adzuna ToS asks for "Jobs by Adzuna" badge (116×23px) on listings + Jobsworth icon (20×20) on salary estimates. Personal use — include a source link in report headers and call it done.

**EU signal**: VERY HIGH across 10 ccTLDs.

**Confidence**: 95% — agent verified current ToS + endpoint shape.

### A.5.1 — hiring.cafe — DEMOTED to Tier C reference

**Status change 2026-04-20**: agent research concluded hiring.cafe aggregates Greenhouse/Lever/Ashby data the pipeline **already gets directly** — no unique value. Cloudflare-protected internal API requires Apify-level scraping ($1.80/1k runs). **Skip as API source**. Keep as manual UI reference for user-side discovery only. Moved to [Tier C](#tier-c--nice-to-have).

### A.6 — Remotive API

**URL**: `https://remotive.com/api/remote-jobs?category=software-dev`

**Rationale**: Curated remote-only. `candidate_required_location` explicit EU/Worldwide filter. Low noise.

**Effort**: ~15 LoC. Single request returns full catalog (no pagination) — cache aggressively to respect 2 req/min cap.

**EU signal**: MEDIUM — global curated, filter `candidate_required_location` for `Worldwide|EMEA|Europe|Austria|EU`.

**Confidence**: 100%.

**Attribution note**: source link in report headers (polite, ToS request).

### A.7 — LinkedIn guest endpoint

**URL**: `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?geoId={URN}&f_WT=2&f_TPR=r86400&sortBy=DD&start={N}`

**Rationale**: Live Q2 2026. Plain HTML response (no JS). All `f_*` filters accepted. User's AT residential IP is the required geo match. Personal pacing (≤1 req/3s, <100/day) safe per 2025 reports. Single biggest EU-remote volume source.

**Effort**: ~60 LoC — HTML regex for job cards + geoId loop + keyword partitioning. No browser automation needed.

**EU signal**: VERY HIGH — ~94k remote EU jobs claim per File 1.

**Confidence**: 85% — alive now but Cloudflare WAF + Akamai are meaner than 2024. Personal pacing mandatory. Public HTML on `/jobs/view/{id}/` for detail enrichment (JSON-LD `jobLocationType=TELECOMMUTE` + `applicantLocationRequirements[]` = **authoritative EU gate**).

**⚠️ Operational risk**: Personal use only. Only account-safety concern: don't hit the guest endpoint from the same IP where you're logged in — separate if ban matters. For guest endpoint specifically, no account to lose.

### A.8 — HN Algolia (Who-is-hiring monthly)

**URL**: `https://hn.algolia.com/api/v1/search?tags=story,author_whoishiring&hitsPerPage=3` → pull latest story ID → `/items/{story_id}` → walk comment tree

**Rationale**: Monthly thread = hundreds of direct-founder posts. 20-40/month are genuine EU-remote-friendly. Zero anti-bot, CORS-enabled. First-of-month only.

**Effort**: ~50 LoC — fetch story + walk children recursively + regex filter for `REMOTE` + EU/Austria keywords + stack.

**EU signal**: MEDIUM — small volume but unique (direct founder posts).

**Confidence**: 100%.

### A.9 — YC companies API

**URL**: `https://api.ycombinator.com/v0.1/companies?badges=["isHiring"]`

**Rationale**: Discovery layer — YC companies with EU HQ that are hiring → resolve `careers_url` → fingerprint ATS → append to A.1 companies list.

**Effort**: ~40 LoC — paginate (234 pages), filter `regions[]` containing EU country, extract `website`, fingerprint ATS via regex on careers page HTML.

**EU signal**: LOW-MEDIUM directly (YC is US-heavy) but discovers EU-HQ YC batch companies that otherwise miss.

**Confidence**: 100%.

### A.10 — Generic RSS parser

**Feeds to include initially**:
- WeWorkRemotely `/remote-jobs.rss` + per-cat ([probed](03-probes.md))
- Jobicy AT `?feed=job_feed&search_region=austria` ([probed](03-probes.md))
- Remotive `/feed` (backup for API)
- jobs.heise.de `?rm=rss` (DACH senior)
- Arbeitnow `/remote-jobs/rss` (backup)
- `hnrss.org/item?id={id}` (backup HN)
- euremotejobs.com `/feed` (EMEA curated)

**Rationale**: One generic RSS parser covers 7+ sources. Use `fast-xml-parser` npm (MIT, no native deps).

**Effort**: ~80 LoC — RSS 2.0 + Atom dual parser + normalized output struct + per-feed URL list in yml.

**EU signal**: MIXED — RSS often US-heavy. Filter client-side against EU regex.

**Confidence**: 90% for WWR + Jobicy (probed); 70% for others (unprobed — see [03-probes.md#unprobed--pending](03-probes.md#unprobed--pending-priority-for-next-session)).

### A.11 — Reddit `.json`

**URL**: `https://www.reddit.com/r/{sub}/new.json?limit=100` + custom UA

**Subs**: r/forhire, r/cscareerquestionsEU, r/remotejs, r/jobbit, r/dotnet, r/csharp, r/angular, r/typescript, r/reactjs, r/webdev

**Rationale**: Real-time direct-poster signal. Monthly megathreads in r/dotnet/r/csharp/r/reactjs carry hundreds of SMB founder posts that never touch LinkedIn.

**Effort**: ~30 LoC — per-sub fetch, filter `link_flair_text == 'HIRING'` on r/forhire, walk comments for megathreads elsewhere.

**EU signal**: MEDIUM — US-heavy feed, but flair + keyword filter extracts EU subset.

**Confidence**: 100% — probed live with UA.

**Operational**: Reddit requires a unique User-Agent on `.json` endpoints — otherwise 429s.

### A.12 — Mastodon #GetFediHired

**URL**: `https://hachyderm.io/api/v1/timelines/tag/GetFediHired` + `fosstodon.org` + `mastodon.world`

**Rationale**: Fediverse-aware startups hiring EU remote. Tiny volume but unique signal — zero overlap with aggregators.

**Effort**: ~20 LoC — standard Mastodon pagination (`max_id`/`since_id`).

**EU signal**: LOW-MEDIUM.

**Confidence**: 100%.

---

## Tier B — weekend 2 additions (DevTools capture + per-company ATS)

### B.1 — Indeed via DevTools-captured GraphQL

**URL**: `https://apis.indeed.com/graphql` POST + header `Client-Version: <value-captured-via-DevTools>`

**Rationale**: Indeed RSS is dead ([probed 404](03-probes.md)). GraphQL is JobSpy reverse-engineered working path. ccTLD filter via query variables.

**Effort**: 15 min DevTools capture + 50 LoC parser. `Client-Version` rotates occasionally — re-capture if 401s appear.

**EU signal**: VERY HIGH for DE/AT/NL/IE/FR Indeed.

**Confidence**: 70% — GraphQL schema may change.

### B.2 — Welcome to the Jungle Algolia

**URL**: `https://csekhvms53-dsn.algolia.net/1/indexes/*/queries` + `x-algolia-api-key` (public, client-side)

**Rationale**: Europe's largest curated tech board. Key is public. One capture + per-country queries.

**Effort**: 15 min capture + 40 LoC.

**EU signal**: HIGH for FR/UK/DE.

**Confidence**: 80%.

### B.3 — Xing GraphQL

**URL**: `/jobs/search/api/...` (capture via DevTools while logged in on user's real Xing)

**Rationale**: File 3: *"functionally more important than LinkedIn for Austrian employers. 40-60% of Austrian IT appears on Xing+karriere.at+Stepstone.at without ever hitting LinkedIn."* User's AT IP = required residential match.

**Effort**: 15 min DevTools capture **on public Xing only, no login** + 60 LoC.

**EU signal**: VERY HIGH for DACH.

**Confidence**: 65% — Xing updates weekly per File 3.

**⚠️ Operational**: use Xing **public search only** (no login). Authenticated scraping ruled out — Chrome DevTools MCP can't sustain auth sessions. User's AT IP matches Xing's geo requirement natively on public calls.

### B.4 — JustJoin.IT Next.js hydration

**URL**: `/_next/data/{buildId}/job-offers/all-locations.json` (capture buildId dynamically from `<script id="__NEXT_DATA__">` in HTML)

**Rationale**: `/api/offers` is dead. Next.js SSR hydration JSON is the replacement documented in GitHub scrapers.

**Effort**: ~60 LoC — fetch `/job-offers/remote/net` HTML → parse `__NEXT_DATA__` → extract buildId → fetch data.json.

**EU signal**: HIGH — Polish B2B .NET/Angular density per File 1.

**Confidence**: 75%.

### B.5 — NoFluffJobs API

**URL**: `https://nofluffjobs.com/api/posting/search` POST body + browser headers

**Rationale**: Multi-country PL/CZ/SK/HU/DE/UA. Mandatory salary. `oskar-j/nofluffapi` wrapper documents body shape.

**Effort**: 15 min DevTools capture of live POST + 40 LoC.

**Confidence**: 70% — 405 on plain GET, needs right body + headers.

### B.6 — Per-company Teamtailor / SmartRecruiters / Recruitee / Personio XML

For each EU company on these ATSes, add individual entry to `companies:`.

**Effort**: 15 LoC per ATS type (~60 total).

**Coverage**:
- Pipedrive, Oda (Teamtailor)
- UiPath, Bosch (SmartRecruiters)
- Various (Recruitee, Personio XML)

---

## Tier C — nice-to-have (probed live unless noted)

Ordered by EU .NET signal + scrape ease.

- **theprotocol.it** (`/filtry/fullstack;sp/zdalna;rw`) — ✅ probed 200 / 691KB SSR. Polish B2B + remote. High signal.
- **bulldogjob.com** (`/companies/jobs/s/city,Remote/skills,.NET`) — ✅ 200 / 84KB. Polish .NET. High.
- **Jobgether** (`/remote-jobs/european-union`) — ✅ 200 / 706KB. AI-matched EU. High.
- **4dayweek.io/remote-jobs/europe** — ✅ 200 / 902KB. Premium (Linear, Supabase, saas.group).
- **Remote Rocketship** (`/country/europe/jobs/net`) — ✅ 200 / 402KB. Heavy US leakage — filter hard.
- **WeAreDevelopers Jobs** (`/en/jobs`) — ✅ 200 / 404KB. **AT-founded.** Good for AT user.
- **EuroTechJobs.com** — ✅ 200 / 248KB SSR. EU-tech niche.
- **Dou.ua/jobs?remote** — ✅ 200 / 91KB. UA → EU-remote pivot.
- **JustRemote** (`/remote-jobs?s=europe-only`) — ✅ 200 / 166KB.
- **Landing.jobs/jobs** — ✅ 200 / 151KB. PT-based EU.
- **Berlin Startup Jobs** — ✅ 200 / 97KB. WordPress scrapable.
- **The Hub** (`?countryCode=DE`) — ✅ 200 / 44KB. Nordic.
- **SwissDevJobs.ch** — ✅ 200 / 4KB (SPA — DevTools capture needed for data).
- **dotnetjobs.dev** — ✅ 200 / 28KB. .NET-specific. DevTools capture likely needed (SPA).
- **Jobs.ch** `/api/v1/public/search` — CH focus, DevTools capture per [02-source-catalog.md#e](02-source-catalog.md#e--spa--hidden-api-captures-chrome-devtools-mcp-one-time-per-site).
- **TrueUp** `__NEXT_DATA__` scrape — probed TIMEOUT 2026-04-20. Retry or drop.
- **GermanTechJobs.de** — probed 404 on `/en/jobs/remote`; find correct URL path.
- **Relocate.me** — probed 404 on `/jobs`; find correct path.
- **hnhiring.com** — probed 404 on `/technologies/.net`; find correct path.
- **hiring.cafe** — **demoted here from Tier A.5**. Duplicates GH/Lever/Ashby we already hit directly. UI reference only.
- **Careerjet v4** — confirmed live (agent). Requires free key. ToS mandates `user_ip` + `user_agent` params. Include as DACH complement if key approved.
- **Jooble** — confirmed live (agent). Requires free key via form (manual approval). Include after approval.
- **Telegram `t.me/s/germantechjobs`** + friends — only if Tier A volume insufficient after dedup.

### Dead / timeout in Session 2 — drop or investigate

- **Europe Remotely** 403 — drop unless UA fix works
- **nextleveljobs.eu** timeout — retry once; if still dead, drop
- **dotnetjobs.co** timeout — retry; drop if dead
- **GermanTechJobs.de** wrong path — find correct URL via site visit
- **Relocate.me** wrong path — find correct URL
- **hnhiring.com** wrong path — find correct URL (try `/technologies/dotnet` or `/`)
- **AI-jobs.net RSS** 404 — probably dead
- **NoDesk RSS** 404 — probably dead

---

## Tier D — Google `site:` queries (skill mode, LLM tokens)

Drop directly into `remote-portals.yml` `search_queries:`. No scan.mjs change needed.

Use for sources where Tier A/B/C is: (a) not yet built, (b) too brittle, or (c) LLM token budget allows occasional broader sweep.

Candidate queries listed in [02-source-catalog.md#f--google-site-queries](02-source-catalog.md#f--google-site-queries-existing-skill-mode-llm-tokens).

---

## Definite drops (with evidence)

### Dead

| Source | Status | Evidence |
|--------|--------|----------|
| Stack Overflow Jobs | Dead Mar 2022 | Archived SO blog |
| GitHub Jobs | Dead May 2021 | GitHub blog |
| Hired.com | → LHH Jun 2024 | — |
| Triplebyte | Gutted 2022 | — |
| SimplyHired | → Indeed 2016 | — |
| Women Who Code | Ceased Apr 2024 | — |
| Otta | → WTTJ Oct 2024 | — |
| Glassdoor Partner API | Closed 2021 | — |
| Indeed Publisher API | Deprecated 2020 | — |
| **Proxycurl** | **Shut down Jul 2025** | LinkedIn lawsuit. Irrelevant — was profile enrichment, not job scraping. |
| **JustJoin.IT `/api/offers`** | Dead Nov 2023 | Probed 404 2026-04-20; `jszafran.dev` dataset shutdown notes. |
| **Indeed RSS** | Dead | Probed 404 2026-04-20. |

### Drop — US-bias / low EU signal

| Source | Evidence |
|--------|----------|
| Monster, ZipRecruiter, Bing Jobs, Seek | File 2 tier 5 — "near-zero unique EU-remote dev inventory" |
| Dice | US engineer focus |
| FlexJobs, Virtual Vocations | Paywall |
| Outsourcely, Pangian, RemoteHub, Remotely.works, Remote.io, Jobspresso, Nomad List, DailyRemote | File 1 tier 3 deprioritize list |
| PowerToFly, Outsourcely | Login walls |

### Drop — duplicate of better source

| Source | Dedups with |
|--------|-------------|
| Jooble | Adzuna (File 2 own recommendation: "dedup against Adzuna") |
| Careerjet | Same — File 2 tier 4 meta-aggregator |
| Glassdoor discovery | 70-90% Indeed dup (File 3) |
| Talent.com, Jobrapido, Trovit | Tier 4 meta-aggregators |
| RemoteTechJobs, Remotees, Real Work From Anywhere | Tier 5 supersets-of-supersets (File 2) |
| Remote Leaf | Paid email curator over RemoteOK/WWR/Remotive |

### Drop — login / authentication required (Chrome DevTools MCP can't sustain auth sessions)

Hard rule: Chrome DevTools MCP is for **one-time hidden-API capture on public surfaces**, not long-lived logged-in scraping. Any source requiring login, cookies, CSRF tokens, or session state = OUT.

| Source | Reason |
|--------|--------|
| **LinkedIn authenticated SPA** | Requires `li_at` cookie. Only LinkedIn *guest* endpoint (A.7) stays. |
| **Xing authenticated** | Requires login. Only Xing *public search* HTML (probed 200 Session 1) stays. |
| **Wellfound (AngelList)** | Login past page 2 + weak .NET + US-biased |
| Honeypot | Login for full search + small EU dev volume |
| MoBerries | Candidate profile required |
| YC Work at a Startup | Login + ~90% US-biased |
| X Pro | $8/mo + login |
| Discord servers | Requires logged-in account |
| Slack communities | Per-workspace auth |
| Gmail-based email alerts (LinkedIn/Xing Saved Searches) | Requires user's Gmail OAuth — same auth-persistence problem. **Could be built as separate user-driven flow, not scan.mjs.** |

**Indeed direct HTML** — stays skipped on Cloudflare/DataDome alone. GraphQL via DevTools (Tier B.1) is the path.

### Drop — fortress anti-bot, high build cost, low unique payoff

| Source | Reason |
|--------|--------|
| Direct Workday tenants (Adyen, Zalando, Spotify, HelloFresh, Doctolib, Siemens, Allianz) | CSRF + session tokens. Per-tenant reverse engineering burden. Aggregator APIs (Adzuna, Himalayas, Arbeitsagentur) index many of these companies' jobs anyway. |
| Glassdoor direct | DataDome + 70-90% Indeed dup — no unique value after Indeed GraphQL path built |

### Drop — reverse / talent marketplace (not scrape target)

| Source | Reason |
|--------|--------|
| Turing, Toptal, Gun.io, X-Team, Braintrust, Crossover, Lemon.io | Register once, wait for DMs. Orthogonal to scraper. |

### Drop — low unique value after dedup

| Source | Reason |
|--------|--------|
| Telegram channels (most) | File 2: "cross-post heavily from RemoteOK/WWR/WorkingNomads, dedup hard". Keep only `germantechjobs` if Tier A volume low. |
| RemoteOK direct poll | Anti-LLM honeypots in JD text. Keep only if attribution layer added. |
| EURES | "Dominated by non-tech" (File 2). Modest postings after filter. |

---

## Cross-file agreement map (confidence weighting)

How confident are we per source, based on research file convergence?

**All 3 input files + live probe agree** → 95% confidence:
- Direct ATS (GH/Ashby/Lever)
- LinkedIn (guest endpoint flavor)
- XING (defer unless DevTools route smooths it)
- Indeed (GraphQL only now that RSS is dead)
- JustJoin.IT (hydration, not dead `/api/offers`)
- HN Who-is-hiring

**2 of 3 files + live probe** → 85% confidence:
- Himalayas, Arbeitnow, Adzuna (probed live for first two)
- Arbeitsagentur (File 3 only but canonical repo + probed live)

**My own research only** → 70% confidence:
- hiring.cafe (my agent + multiple Apify scrapers corroborate, but 403 to plain fetcher)
- dotnetjobs.dev / WeAreDevelopers / EuroTechJobs / Dou.ua (my agent find)

**File-specific gems not cross-referenced** → 60% confidence:
- `remoteintech/remote-jobs` + `EuropeanRemote/european-remote-software-companies` GitHub discovery (File 1 only)
- Mastodon #GetFediHired (File 3 only; live probed but tiny volume)

---

## Summary — what goes into `remote-portals.yml`

**Phase 1 (MVP, weekend 1)**:
- `title_filter` — remote-specific keywords + US-exclusion
- `companies:` — ~50 EU scaleups on GH/Ashby/Lever (A.1)
- `feeds:` (new section) — Tier A.2 through A.11 sources
- `search_queries:` — 10-15 Google site: queries (Tier D) for coverage gaps

**Phase 2 (weekend 2)**:
- `hidden_apis:` (new section) — Tier B.1 through B.5
- Expand `companies:` with per-company Teamtailor/SmartRecruiters/Personio (B.6)

**Phase 3 (weekend 3-4)**:
- Tier C additions as needed
- GitHub discovery loop
- Email-alert layer (LinkedIn Saved Search → Gmail)

---

## Open questions for continuation agent

1. **hiring.cafe rate limits** — verify before committing effort. Likely still skip per agent research (aggregates GH/Lever/Ashby we already hit).
2. **Adzuna free tier status 2026** — probe required. If closed, move Adzuna to paid or drop.
3. **Workday direct** — even single high-value target (Zalando Berlin fullstack) worth the CSRF dance? Currently say no — hiring.cafe covers.
4. ~~Xing authenticated vs public~~ — **resolved**: authenticated OUT (Chrome DevTools MCP can't hold auth sessions). Public Xing search only.
5. **GitHub discovery cron** — weekly enough, or on-demand via skill?
6. **EU-fit gate architecture** — JSON-LD primary, regex fallback — where in pipeline? scan.mjs or separate enrich step?
7. **Rate-limit queue** — per-source limits (Remotive 2/min) — requires scan.mjs rearchitect (currently single global `CONCURRENCY=10`).

See [05-next-steps.md](05-next-steps.md) for these as actionable todos.
