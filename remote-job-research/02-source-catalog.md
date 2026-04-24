# 02 — Source catalog

See [README](README.md) for index. Also read [00-goal.md](00-goal.md) and [01-context.md](01-context.md).

This is the **exhaustive catalog** of every candidate source considered. Metadata is neutral — ranking happens in [04-evaluation.md](04-evaluation.md). Probe status links to [03-probes.md](03-probes.md).

Columns:
- **Source** — canonical name
- **URL** — endpoint or base URL
- **Auth** — none / free-key / hidden-capture. **Login/authenticated sources are ruled out** (Chrome DevTools MCP can't sustain sessions).
- **Method** — JSON / RSS / SSR-HTML / SPA-render / Google-site
- **EU signal** — estimated relevance for EU-remote .NET/Angular
- **Dedup** — how much this source is reposted from upstream aggregators
- **Status** — probed / unprobed / dead
- **Notes** — short context

Grouping: A = ATS direct, B = REST/JSON API, C = RSS, D = SSR HTML, E = SPA / hidden API, F = Google site:, G = community/social, X = dead/drop.

---

## A — Direct ATS (zero-auth, `scan.mjs`-ready today)

These require **no new scan.mjs code**. Adding a company to `remote-portals.yml` under `companies:` with an ATS-pattern `careers_url` is sufficient.

### A.1 — Already in `portals.yml` (don't duplicate)

| Source | ATS slug | Status |
|--------|----------|--------|
| Storyblok | GH EU `storyblok` | in portals.yml |
| Bitpanda | Lever `bitpanda` | in portals.yml |
| Personio | GH `personio` | in portals.yml |
| wefox | GH `wefox` | in portals.yml |
| n8n | Ashby `n8n` | in portals.yml |
| Retool | custom | in portals.yml |
| Vercel | GH `vercel` | in portals.yml |
| Temporal | GH `temporal` | in portals.yml |
| Attio | Ashby `attio` | in portals.yml |
| Factorial | GH `factorial` | in portals.yml |
| Mistral | Lever `mistral` | in portals.yml |
| Zapier | Ashby `zapier` | in portals.yml |
| GitLab | GH `gitlab` | in portals.yml |
| Intercom | GH `intercom` | in portals.yml |
| Celonis | ? | in portals.yml — verify ATS |
| Dynatrace | ? | in portals.yml — verify ATS |
| Adverity | ? | in portals.yml |
| Cloudflight | ? | in portals.yml |
| Tricentis | ? | in portals.yml |
| Red Bull | Workday? | in portals.yml |
| Porsche Informatik | custom | in portals.yml |
| Skidata | custom | in portals.yml |
| Palfinger | custom | in portals.yml |
| eurofunk | custom | in portals.yml |
| 2e-systems | custom | in portals.yml |

**Task for continuation agent**: verify each `careers_url` in `portals.yml` still resolves to the claimed ATS type. Several Austrian employers use custom ATS or Workday tenants — those won't work with scan.mjs as-is.

### A.2 — EU scaleups to add to `remote-portals.yml`

Pulled from 3 research files' consensus + independent cross-check. Each needs ATS slug verified live before commit.

**Greenhouse (scan.mjs ready):**
- N26 (DE) — `https://boards.greenhouse.io/n26`
- Trade Republic (DE) — `https://boards.greenhouse.io/traderepublic`
- Commercetools (DE) — verify slug
- Pleo (DK) — `https://boards.greenhouse.io/pleo`
- Mews (CZ) — `https://boards.greenhouse.io/mews`
- GetYourGuide (DE) — `https://boards.greenhouse.io/getyourguide`
- Klarna (SE) — `https://boards.greenhouse.io/klarna`
- Wise (UK) — `https://boards.greenhouse.io/wise`
- Bolt (EE) — `https://boards.greenhouse.io/bolt`
- Contentful (DE) — `https://boards.greenhouse.io/contentful`
- Payfit (FR) — verify slug
- Mollie (NL) — `https://boards.greenhouse.io/mollie`
- Delivery Hero (DE) — `https://boards.greenhouse.io/deliveryhero`
- TIER Mobility (DE) — verify slug
- Depop (UK) — `https://boards.greenhouse.io/depop`
- Taxfix (DE) — verify
- Deliveryhero — see above
- Parloa (DE) — verify slug
- Bitmovin (AT) — verify slug (AT-founded, remote-friendly, .NET/video codec space)
- Runtastic (AT, adidas) — verify slug
- Tractive (AT) — verify slug
- Anyline (AT) — verify slug
- TeamViewer (DE) — verify slug
- TourRadar (AT) — verify slug
- GoStudent (AT) — Workable/GH — verify
- Raiffeisen Software (AT) — custom likely — check
- Alan (FR) — verify slug
- Swile (FR) — verify slug

**Ashby:**
- Linear (remote) — `https://jobs.ashbyhq.com/linear`
- PostHog (UK) — `https://jobs.ashbyhq.com/posthog`
- Supabase (remote-EU) — `https://jobs.ashbyhq.com/supabase`
- Ramp (remote) — `https://jobs.ashbyhq.com/ramp`
- Cal.com (remote) — `https://jobs.ashbyhq.com/cal.com`
- Tines (IE) — verify slug

**Lever:**
- Qonto (FR) — `https://jobs.lever.co/qonto`
- Revolut (UK) — custom ATS (not Lever) per File 1 — may skip
- Ableton (DE) — `https://jobs.lever.co/ableton`

**Teamtailor / SmartRecruiters / Recruitee (NOT scan.mjs-native — Tier B):**
- Pipedrive (EE) — Teamtailor
- UiPath (RO) — SmartRecruiters
- Bosch (DE) — SmartRecruiters
- Adyen (NL) — Workday (HARD — skip)
- Zalando (DE) — Workday (HARD — skip)
- Spotify (SE) — Workday (HARD — skip)
- Doctolib (FR) — Workday (HARD — skip)
- HelloFresh (DE) — Workday (HARD — skip)

**Action for continuation agent**: run a batch script — for each slug above, `curl https://boards-api.greenhouse.io/v1/boards/{slug}/jobs` and check HTTP 200 + non-empty `jobs[]`. Log results to [03-probes.md#company-ats-verification](03-probes.md#company-ats-verification).

### A.3 — GitHub repo discovery (expands A.2)

Per File 1, scan these weekly for new EU companies:
- `remoteintech/remote-jobs` — YAML frontmatter, filter `region: europe` + `technologies[]` contains `.NET|Angular|TypeScript`
- `EuropeanRemote/european-remote-software-companies` — markdown, emoji tags for stack
- `poteto/hiring-without-whiteboards` — 1500 companies, Airtable backend at nowhiteboard.org
- `api.ycombinator.com/v0.1/companies` — filter `regions` contains EU + `badges` contains `isHiring`

**Status**: unprobed for EU-tech content. Flagged for Phase 1. See [05-next-steps.md#phase-1-2](05-next-steps.md#phase-1-2-github-discovery).

---

## B — REST / JSON APIs (require scan.mjs extension)

### B.1 — Confirmed live Q2 2026

See [03-probes.md#rest-json-probes](03-probes.md#rest-json-probes) for HTTP evidence.

| Source | URL | Auth | Volume | EU signal | Notes |
|--------|-----|------|--------|-----------|-------|
| Arbeitnow | `https://www.arbeitnow.com/api/job-board-api` | none | 25/page, pagination `?page=N` | HIGH (DE bias) | Fields: `slug`, `company_name`, `title`, `description` HTML, `remote` boolean, `url`, `tags[]`, `location`, `created_at` |
| Himalayas | `https://himalayas.app/jobs/api/search?country=Austria&timezoneRestrictions=0,1,2,3` | none | 115k total, offset/limit paginated | HIGH | Filter by `categories`, `seniority`, `employmentType`, `minSalary`. Recently added `companySlug`. |
| Arbeitsagentur | `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?arbeitszeit=ho&size=50` | header `X-API-Key: jobboerse-jobsuche` (shared, anon) | massive DE | HIGH (DE) | Canonical repo: github.com/bundesAPI/jobsuche-api. Params: `was`, `wo`, `berufsfeld`, `umkreis` km, `arbeitszeit=ho` for Homeoffice, `veroeffentlichtseit` 0-100, `angebotsart=1`. Detail via `/pc/v4/jobdetails/{base64(refnr)}`. |
| Remotive | `https://remotive.com/api/remote-jobs?category=software-dev` | none | curated | MEDIUM | 2 req/min hard cap. Fields: `id`, `url`, `title`, `company_name`, `category`, `tags[]`, `job_type`, `publication_date`, `candidate_required_location`, `salary`, `description`. **Attribution required** in ToS. |
| YC Companies | `https://api.ycombinator.com/v0.1/companies?badges=["isHiring"]` | none | 234 pages | LOW direct (US-heavy) but good for EU-HQ filter | Fields: `batch`, `status`, `tags`, `industries`, `regions`, `locations`, `teamSize`. Use to resolve EU-HQ YC companies → ATS URL. |
| HN Algolia | `https://hn.algolia.com/api/v1/search?tags=story,author_whoishiring&hitsPerPage=3` | none | monthly threads | MEDIUM | 27 pages cached. Use `numericFilters=created_at_i>{unix}`. Pull comment tree via `/items/{id}` for JD text. Regex EU/remote/.NET. |
| Mastodon | `https://hachyderm.io/api/v1/timelines/tag/GetFediHired` | none | small | LOW-MEDIUM | Standard Mastodon pagination via `max_id`/`since_id`. Also try `fosstodon.org`, `mastodon.world`. |

### B.2 — Requires free API key signup

| Source | URL | Auth | Status | Notes |
|--------|-----|------|--------|-------|
| Adzuna | `https://api.adzuna.com/v1/api/jobs/{cc}/search/{page}?app_id=X&app_key=Y` | free `app_id`+`app_key` from developer.adzuna.com | **UNVERIFIED** — probe + signup required | ccTLDs: at, de, ch, nl, pl, fr, be, it, es, gb. Salary histograms. Sign-up needed. |
| Jooble | `https://jooble.org/api/{key}` POST JSON body | free key via partner form | UNVERIFIED | Strong CEE. Body `{keywords, location, page, ResultOnPage}`. |

### B.3 — Per-company APIs (single-company ATS, each needs separate entry)

Not aggregator APIs — one URL per company. For high-value companies on these ATSes, add manually to `A.2 companies:` list. scan.mjs extension covers type.

| ATS | URL pattern | scan.mjs-extension effort |
|-----|-------------|---------------------------|
| SmartRecruiters | `https://api.smartrecruiters.com/v1/companies/{slug}/postings` | Low (~15 LoC) |
| Personio XML | `https://{company}.jobs.personio.com/xml` | Low (~15 LoC) |
| Teamtailor | per-company public API docs | Low |
| Recruitee | `https://{company}.recruitee.com/api/offers` | Low |
| Workday | `/wday/cxs/{tenant}/{site}/jobs` POST + `x-calypso-csrf-token` | HIGH — skip, use hiring.cafe instead |

---

## C — RSS / Atom feeds (generic parser in scan.mjs)

| Source | URL | Status | Volume | Notes |
|--------|-----|--------|--------|-------|
| We Work Remotely | `https://weworkremotely.com/remote-jobs.rss` | probed 200 / 831KB | high, all-cat | Per-cat also: `/categories/remote-full-stack-programming-jobs.rss`, `-back-end-`, `-front-end-`. $299 post fee = quality filter. |
| WWR Full-Stack | `https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss` | unprobed | subset of WWR | Use if filtering client-side too noisy |
| Jobicy AT | `https://jobicy.com/?feed=job_feed&search_region=austria` | probed 200 / 45KB | small AT-focused | Jobicy v2 API also available, refreshed 2025. ToS: "few times daily" cap. |
| Remotive | `https://remotive.com/feed` + per-category | unprobed (API preferred) | curated | Backup for API |
| Himalayas | `https://himalayas.app/jobs/rss` | unprobed (API preferred) | 100/feed | Backup for API |
| Arbeitnow | `https://www.arbeitnow.com/remote-jobs/rss` | unprobed | DE-bias | Backup for API |
| HN Who-is-hiring | `https://hnrss.org/item?id={story_id}` + `https://hnrss.org/newest?q=hiring` | unprobed | monthly | Backup for Algolia |
| jobs.heise.de | `<listing-url>?rm=rss` on specific listing URLs | unprobed | DACH senior dev | German enterprise dev |
| RemoteOK | `https://remoteok.com/rss` | probed timeout (intermittent) | US-heavy, EU subset | First item = legal notice, skip. Attribution required. **Warning**: honeypot phrases to trip LLM-scrapers. |
| euremotejobs.com | `/feed` | unprobed | pure EMEA | Austria tag per File 1 |
| NoDesk | per-cat RSS | unprobed | small | File 1 tier 2 |
| AI-jobs.net | RSS | unprobed | cross-lists fullstack | File 1 mentions |

### C.1 — RSS Format notes for generic parser

Standard RSS 2.0 with `<item><title><link><description><pubDate>...`. Some use Atom (`<feed><entry>`). Parser should handle both. Use `fast-xml-parser` npm package (MIT) — lightweight, no native deps.

---

## D — SSR HTML scrape (no API, but stable selectors)

These render first-page content server-side. Cheerio parse works without JS engine.

| Source | URL pattern | Status | Notes |
|--------|-------------|--------|-------|
| theprotocol.it | `/filtry/fullstack;sp/zdalna;rw` + `/filtry/backend;sp/zdalna;rw` | unprobed | Polish, ~40% fully remote. URL grammar: `filtry/<value>;<code>` where `rw`=remote, `sp`=specialization. Mandatory salary. |
| bulldogjob.com | `/companies/jobs/s/city,Remote/skills,.NET` + `/skills,Angular` + `/skills,TypeScript` | unprobed | Polish. Clean URL scheme. Luxoft/Accenture/ERGO volume. |
| GermanTechJobs.de | Austria + remote filter | unprobed | DevITjobs network. Transparent salary + stack disclosure. |
| SwissDevJobs.ch | remote + CH filter | unprobed | Sister of GTJ.de |
| DevJobs.at | already in portals.yml | covered | User's AT-specific sister |
| WeAreDevelopers Jobs | `wearedevelopers.com/en/jobs` | unprobed | **AT-founded** per my research. Remote EU filter. |
| EuroTechJobs | `eurotechjobs.com` | unprobed | EU-tech niche, often overlooked |
| Dou.ua/jobs | `dou.ua/jobs/?remote` | unprobed | Ukraine, heavy EU-remote pivot since 2022 |
| Berlin Startup Jobs | `berlinstartupjobs.com` | unprobed | WordPress scrapable |
| Landing.jobs | `landing.jobs` | unprobed | PT-based EU dev marketplace |
| The Hub | `thehub.io` | unprobed | Nordic, Copenhagen/Stockholm remote-EU |
| Relocate.me | `relocate.me` | unprobed | EU dev relocation + remote |
| 4dayweek.io/europe | `/remote-jobs/europe` | unprobed | ~12 premium (Supabase, Linear, saas.group) |
| Europe Remotely | `europeremotely.com` | unprobed | 100% EU-curated, small high-signal |
| JustRemote | `justremote.co` + Europe filter | unprobed | Clean toggle, dev category |
| Remote Rocketship | `remoterocketship.com/country/europe/jobs/net` | unprobed | ~35k Europe claim, heavy US leakage warning |
| Jobgether | `jobgether.com/remote-jobs/european-union` | unprobed | Belgian HQ, GDPR-native, AI-matched |
| nextleveljobs.eu | `nextleveljobs.eu` | unprobed | €100k+ EU software curator |
| dotnetjobs.dev | `dotnetjobs.dev` | unprobed | Next.js SPA per my research. .NET-only. May need hydration capture — see E. |
| dotnetjobs.co | `dotnetjobs.co` | unprobed | Sister site. |
| hnhiring.com | `/technologies/.net` + `/locations/remote` | unprobed | Pre-parsed HN threads, filterable |
| karriere.at (remote subset) | `karriere.at/jobs/remote` or filter params | already in portals.yml | Largest AT generalist. Re-weight filter for remote. |
| StepStone.at (remote) | remote filter | partial in portals.yml | Moderate anti-bot |
| willhaben.at jobs | remote filter | in portals.yml | Growing, scrapable |
| metajob.at | — | in portals.yml | Meta-aggregator, dedup-heavy |

---

## E — SPA / hidden API captures (Chrome DevTools MCP, one-time per site)

Sites with rich data behind JS-only XHRs. Capture the URL + headers once via DevTools, paste into scan.mjs as a `hidden-api` type entry.

| Source | Endpoint to capture | Notes |
|--------|---------------------|-------|
| **hiring.cafe** | internal JSON — explore via DevTools Network on hiring.cafe | Aggregates **46 ATSes** incl. Workday/SmartRecruiters/iCIMS/Recruitee/Teamtailor. 1M+ users late 2025. **Highest-leverage single capture.** |
| JustJoin.IT | `/_next/data/{buildId}/job-offers/all-locations.json` | `/api/offers` dead since Nov 2023. buildId rotates — must re-capture. |
| NoFluffJobs | `/api/posting/search` POST with browser headers | 405 on plain GET. Needs body + UA. |
| Indeed (global) | `apis.indeed.com/graphql` POST + header `Client-Version: <value>` | JobSpy reverse-engineered. Version header may rotate. |
| Welcome to the Jungle | `csekhvms53-dsn.algolia.net/1/indexes/*/queries` + public `x-algolia-api-key` | Key rotates occasionally. |
| Xing Jobs | `/jobs/search/api/...` GraphQL | User's AT IP is required geo match. |
| Jobs.ch | `/api/v1/public/search` | File 3 mention only. Verify. |
| TrueUp | `__NEXT_DATA__` in page HTML (no API call, just hydrated JSON) | Next.js, scrape embedded JSON per page. |
| LinkedIn guest | `/jobs-guest/jobs/api/seeMoreJobPostings/search?geoId=X&f_WT=2&f_TPR=r86400&start=N` | Returns HTML fragment (~25 cards). No JS needed but HTML regex required. Personal pacing: ≤1 req/3s, <100/day. |
| LinkedIn job detail | `/jobs/view/{id}/` — extract `<script type="application/ld+json">` | Full JobPosting with `jobLocationType=TELECOMMUTE` + `applicantLocationRequirements[]`. **Authoritative EU-fit signal.** |

---

## F — Google `site:` queries (existing skill mode, LLM tokens)

Fallback for sources where neither API nor SSR works cleanly. These go in `remote-portals.yml` `search_queries:` and are processed by skill mode, not `scan.mjs`.

Candidates (from 3 files consensus):
- `site:linkedin.com/jobs/view "(.NET OR Angular)" remote EU`
- `site:xing.com/jobs "(.NET OR Angular)" remote Austria`
- `site:welcometothejungle.com "(.NET OR Angular)" remote Europe`
- `site:theprotocol.it/filtry fullstack zdalna`
- `site:bulldogjob.com Remote .NET OR Angular OR TypeScript`
- `site:germantechjobs.de Austria remote`
- `site:swissdevjobs.ch .NET OR Angular remote`
- `site:jobgether.com/remote-jobs/european-union .NET OR Angular`
- `site:nofluffjobs.com .NET OR Angular remote`
- `site:hnhiring.com .NET OR remote`
- `site:hiring.cafe .NET OR Angular remote`
- `site:euremotejobs.com`
- `site:4dayweek.io/remote-jobs/europe`
- `site:europeremotely.com`
- `site:relocate.me remote EU`
- `site:wearedevelopers.com/jobs remote`
- `site:ai-jobs.net EU remote`

Cost: Google site: queries run via WebSearch tool (Claude-native) — LLM tokens consumed per query. Cap at ~20 queries per scan to bound cost.

---

## G — Community / social (mixed methods)

| Source | URL | Method | Status | Volume | Notes |
|--------|-----|--------|--------|--------|-------|
| Reddit `.json` | `/r/forhire/new.json?limit=100` with custom UA | REST | probed 200 / 24KB with UA | real-time | Flair=HIRING filter. Also r/cscareerquestionsEU, r/remotejs, r/jobbit, r/dotnet, r/csharp, r/angular, r/typescript, r/reactjs, r/webdev monthly "Who's Hiring" megathreads. |
| Mastodon | (see B.1) | REST | confirmed live | small | Authless, unique signal |
| Telegram `t.me/s/{channel}` | HTML preview | SSR | unprobed | medium but dupy | `germantechjobs`, `remotedevjobs` (20k), `remotejobss` (30k), `workewco` (10k), `prog_jobs`, `hitech_jobs`, `it_jobs`, `dotnet_jobs`, `angular_jobs`. **Cross-post heavily — dedup aggressively.** |
| X / Twitter | web + no-login limits | HTML + login after 2023 | not usable at scale | — | Skip — login-gated |
| Discord | — | — | not usable | — | Needs burner account + per-server maintenance; not worth the overhead |
| Slack communities | login gated | — | not usable | — | Burner account + per-workspace auth needed |

---

## X — Dead / deprecated (do not scrape)

Evidence in [04-evaluation.md#drops](04-evaluation.md#definite-drops). Listed here for agent reference — do not reconsider these without new evidence.

| Source | Status | Evidence |
|--------|--------|----------|
| Stack Overflow Jobs | Dead Mar 2022 | Archived announcement |
| GitHub Jobs | Dead May 2021 | GitHub blog |
| Hired.com | → LHH (Adecco) Jun 2024 | Industry news |
| Triplebyte | Gutted 2022 | — |
| SimplyHired | → Indeed 2016 | — |
| Women Who Code | Ceased Apr 2024 | Announcement |
| Otta | → Welcome to the Jungle Oct 2024 | — |
| Glassdoor Partner API | Closed 2021 | — |
| Indeed Publisher API | Deprecated 2020 | — |
| Proxycurl | **Shut down Jul 2025** after LinkedIn lawsuit | Liquidated. Irrelevant anyway — was LinkedIn-profile enrichment, not job scraping. |
| **JustJoin.IT `/api/offers`** | **Dead since Nov 2023** | Probed 404 on 2026-04-20. `jszafran.dev` dataset notes confirm. Use Next.js hydration capture (Section E) instead. |
| Indeed RSS | Dead | Probed 404 on 2026-04-20. Use GraphQL via DevTools (Section E). |

---

## X.1 — Deprioritize (low EU-remote signal or high cost)

Not dead but not worth including. Evidence in [04-evaluation.md](04-evaluation.md).

- Monster, ZipRecruiter, Bing Jobs, Seek, Dice, FlexJobs, Virtual Vocations, Outsourcely, Pangian, RemoteHub, Remotely.works, Remote.io, Jobspresso, Nomad List, DailyRemote, PowerToFly, Remote Leaf — US bias / paid / low volume
- Jooble, Careerjet — duplicative with Adzuna (File 2's own call)
- Glassdoor discovery — 70-90% Indeed dup
- Wellfound — login-gated past page 2 + weak .NET signal
- Workday direct tenants — hiring.cafe covers them better
- EURES — massive but non-tech-dominated
- Honeypot, MoBerries — reverse boards, register-once not scrape
- Turing, Toptal, Gun.io, X-Team, Braintrust, Crossover, Lemon.io — talent marketplaces

---

## Cross-reference

- **Probing status per source**: [03-probes.md](03-probes.md)
- **Ranked picks with rationale**: [04-evaluation.md](04-evaluation.md)
- **What to do next with this catalog**: [05-next-steps.md](05-next-steps.md)

**Attribution note (operational, not legal)**: RemoteOK, Jobicy, Remotive ask for source link in their ToS. Include in report block headers when surfacing jobs from these.
