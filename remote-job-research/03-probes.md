# 03 — Probe log

See [README](README.md) for index. Source catalog: [02-source-catalog.md](02-source-catalog.md). Evaluation: [04-evaluation.md](04-evaluation.md).

This is a **date-stamped log of live endpoint verification**. Append only — don't delete history. If an endpoint re-probes with different result, add new entry.

Conventions:
- `HTTP 200` + non-empty JSON = **LIVE**
- `HTTP 404` = **DEAD** (confirmed gone)
- `HTTP 403` = **BLOCKED** (needs DevTools / browser headers)
- `HTTP 405` = **WRONG METHOD** (try POST with body)
- `HTTP 000` = **TIMEOUT** (intermittent — retry or consider dead)

---

## Session 1 — 2026-04-20

**Probed by**: Claude Opus 4.7 in Claude Code worktree.
**Method**: `curl -A "Mozilla/5.0" -s -o /dev/null -w "HTTP:%{http_code} SIZE:%{size_download}"` with 10-15s timeout.

### REST JSON probes

| # | Source | URL | HTTP | Size | Verdict |
|---|--------|-----|------|------|---------|
| 1 | justjoin.it | `https://justjoin.it/api/offers` | **404** | 0 | **DEAD** — research files stale |
| 2 | justjoin.it v2 | `https://api.justjoin.it/v2/user-panel/offers` | 404 | 83 | Dead |
| 3 | justjoin.it new v2 | `https://api.justjoin.it/v2/user-panel/offers/by-params` | 404 | 93 | Dead |
| 4 | justjoin.it frontpage | `https://justjoin.it/job-offers/remote/net` | 200 | 1928KB | SSR Next.js — use hydration capture |
| 5 | Arbeitnow | `https://www.arbeitnow.com/api/job-board-api` | 200 | 465KB | **LIVE** — see shape below |
| 6 | Himalayas | `https://himalayas.app/jobs/api/search?country=Austria` | 200 | 134KB | **LIVE** — 115k total, TZ filter |
| 7 | Arbeitsagentur | `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?arbeitszeit=ho&size=5` + header `X-API-Key: jobboerse-jobsuche` | 200 | 32KB | **LIVE** — DE federal, remote filter works |
| 8 | Remotive | `https://remotive.com/api/remote-jobs?category=software-dev` | 200 | 318KB | **LIVE** — 2 req/min cap per docs |
| 9 | YC Companies | `https://api.ycombinator.com/v0.1/companies` | 200 | 32KB | **LIVE** — filter EU HQ |
| 10 | Mastodon GetFediHired | `https://hachyderm.io/api/v1/timelines/tag/GetFediHired` | 200 | 119KB | **LIVE** |
| 11 | HN Algolia | `https://hn.algolia.com/api/v1/search?tags=story,author_whoishiring&hitsPerPage=3` | 200 | 29KB | **LIVE** |
| 12 | NoFluffJobs GET | `https://nofluffjobs.com/api/posting/search` | 405 | 133 | Wrong method — POST needed + CF-resistant headers |
| 13 | RemoteOK JSON | `https://remoteok.com/api` | 000 | 0 | TIMEOUT — intermittent + anti-LLM honeypots reported |
| 14 | Hiring.cafe | `https://hiring.cafe/` | **403** | 4583 | **BLOCKED to plain fetcher** — requires DevTools capture |
| 15 | Reddit forhire | `https://www.reddit.com/r/forhire/new.json?limit=5` + UA `career-ops/1.0` | 200 | 24KB | **LIVE** with custom UA |

### LinkedIn / Xing probes

| # | Source | URL | HTTP | Size | Verdict |
|---|--------|-----|------|------|---------|
| 16 | LinkedIn guest seeMore | `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?geoId=91000000&f_WT=2&f_TPR=r86400&start=0` | 200 | 30KB | **LIVE** — HTML fragment returned |
| 17 | LinkedIn search HTML | `https://www.linkedin.com/jobs/search?keywords=.NET+Angular&geoId=91000000&f_WT=2&f_TPR=r86400` | 200 | 291KB | **LIVE** |
| 18 | Xing public search | `https://www.xing.com/jobs/search?keywords=.NET&remoteOption=FULL_REMOTE&location=Austria` | 200 | 160KB | **LIVE** without login |

### RSS probes

| # | Source | URL | HTTP | Size | Verdict |
|---|--------|-----|------|------|---------|
| 19 | WWR RSS | `https://weworkremotely.com/remote-jobs.rss` | 200 | 831KB | **LIVE** — huge feed |
| 20 | Jobicy AT RSS | `https://jobicy.com/?feed=job_feed&search_region=austria` | 200 | 45KB | **LIVE** — explicit AT filter |
| 21 | **Indeed AT RSS** | `https://at.indeed.com/rss?q=.NET+remote&l=&sort=date` | **404** | 65KB (error page) | **DEAD** — Indeed killed RSS |

---

## Session 2 — 2026-04-20 (continued)

**Probed by**: Claude Opus 4.7.
**Method**: `curl -sL -A "Mozilla/5.0..." -o /dev/null -w "%{http_code}:%{size_download}"` per URL; 5-10s timeout.

### RSS feed probes (Phase 0.2)

| # | Source | URL | HTTP | Size | Verdict |
|---|--------|-----|------|------|---------|
| 22 | Remotive RSS | `https://remotive.com/feed` | 404 | 0 | **DEAD** — use API instead |
| 23 | Himalayas RSS | `https://himalayas.app/jobs/rss` | 200 | — | **LIVE** (backup for API) |
| 24 | Arbeitnow RSS | `https://www.arbeitnow.com/remote-jobs/rss` | 200 | — | **LIVE** (backup for API) |
| 25 | euremotejobs.com | `https://euremotejobs.com/feed` | 200 | — | **LIVE** — EMEA focused |
| 26 | hnrss.org | `https://hnrss.org/newest?q=hiring` | 502 | 0 | INTERMITTENT — retry needed |
| 27 | RemoteOK RSS | `https://remoteok.com/rss` | 200 | — | **LIVE** (vs `/api` timeout) — use this path + attribution |
| 28 | WWR Full-Stack | `https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss` | 200 | — | **LIVE** |
| 29 | WWR Back-End | `https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss` | 200 | — | **LIVE** |
| 30 | jobs.heise.de RSS | `https://www.jobs.heise.de/feed/rss` | 000 | 0 | TIMEOUT — retry with different URL pattern |
| 31 | AI-jobs.net RSS | `https://ai-jobs.net/feed/` | 404 | 0 | **DEAD** — search alternate URL |
| 32 | NoDesk RSS | `https://nodesk.co/remote-jobs/feed.xml` | 404 | 0 | **DEAD** |
| 33 | Jobicy /feed | `https://jobicy.com/feed` | 200 | — | **LIVE** (general feed vs AT-filtered) |

### SSR HTML probes (Phase 0.3)

| # | Source | URL | HTTP | Size | Verdict |
|---|--------|-----|------|------|---------|
| 34 | theprotocol.it | `/filtry/fullstack;sp/zdalna;rw` | 200 | 691KB | **LIVE** large SSR — Polish fullstack remote |
| 35 | bulldogjob.com | `/companies/jobs/s/city,Remote/skills,.NET` | 200 | 84KB | **LIVE** SSR .NET remote |
| 36 | GermanTechJobs.de | `/en/jobs/remote` | **404** | 4KB | **DEAD URL** — find correct path |
| 37 | SwissDevJobs.ch | `/` | 200 | 4KB (small home) | **LIVE** — SPA likely, inspect via DevTools |
| 38 | WeAreDevelopers Jobs | `/en/jobs` | 200 | 404KB | **LIVE** large — AT-founded, scrape-ready |
| 39 | dotnetjobs.dev | `/` | 200 | 28KB | **LIVE** — likely Next.js, DevTools capture |
| 40 | dotnetjobs.co | `/` | 000 | 0 | TIMEOUT / dead |
| 41 | EuroTechJobs.com | `/` | 200 | 248KB | **LIVE** large SSR |
| 42 | Dou.ua/jobs | `/?remote` | 200 | 91KB | **LIVE** — Ukraine, many EU-remote |
| 43 | Jobgether EU | `/remote-jobs/european-union` | 200 | 706KB | **LIVE** huge — AI-matched EU |
| 44 | Europe Remotely | `/` | **403** | 58 | BLOCKED — try UA variations |
| 45 | JustRemote EU | `/remote-jobs?q=&s=europe-only` | 200 | 166KB | **LIVE** |
| 46 | Remote Rocketship | `/country/europe/jobs/net` | 200 | 402KB | **LIVE** — US leakage warning |
| 47 | Relocate.me | `/jobs` | 404 | 40KB (error page) | **DEAD URL** — try `/remote` |
| 48 | 4dayweek.io EU | `/remote-jobs/europe` | 200 | 902KB | **LIVE** large — premium filter |
| 49 | hnhiring.com | `/technologies/.net` | 404 | 1.7KB | **DEAD PATH** — try `/` or `/technologies/dotnet` |
| 50 | Landing.jobs | `/jobs` | 200 | 151KB | **LIVE** — PT EU dev |
| 51 | The Hub DE | `/jobs?countryCode=DE` | 200 | 44KB | **LIVE** — Nordic |
| 52 | Berlin Startup Jobs | `/` | 200 | 97KB | **LIVE** — WordPress |
| 53 | nextleveljobs.eu | `/` | 000 | 0 | TIMEOUT |
| 54 | TrueUp | `/companies` | 000 | 0 | TIMEOUT — retry |

### Per-company ATS slug probes (Phase 0.5)

**Greenhouse** — `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs`:

| Slug | HTTP | Size | Verdict |
|------|------|------|---------|
| n26 | 200 | 34KB | ✅ LIVE |
| traderepublic | 200 | 601 | ⚠️ LIVE but near-empty (verify slug) |
| commercetools | 200 | 22KB | ✅ LIVE |
| pleo | 200 | 30 | ⚠️ LIVE but empty (slug may be `pleotechnologies`) |
| contentful | 200 | 129KB | ✅ LIVE (big) |
| getyourguide | 200 | 61KB | ✅ LIVE |
| parloa | 200 | 40KB | ✅ LIVE |
| gostudent | 200 | 18KB | ✅ LIVE |
| **mews** | 404 | — | ❌ wrong slug — try `mewssystems` |
| **klarna** | 404 | — | ❌ try `klarnagroup` or GH EU |
| **wise** | 404 | — | ❌ try `wiseplc` |
| **bolt** | 404 | — | ❌ try `bolteu` or `bolt-technology` |
| **mollie** | 404 | — | ❌ try `molliepayments` |
| **depop** | 404 | — | ❌ moved? |
| **deliveryhero** | 404 | — | ❌ try `delivery-hero` |
| **tiermobility** | 404 | — | ❌ slug may differ |
| **taxfix** | 404 | — | ❌ |
| **teamviewer** | 404 | — | ❌ |
| **tourradar** | 404 | — | ❌ |
| **alan** | 404 | — | ❌ |
| **swile** | 404 | — | ❌ |
| **payfit** | 404 | — | ❌ |
| bitmovin / tractive / anyline | 000 | — | TIMEOUT — retry |

**Ashby** — `https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true`:

| Slug | HTTP | Size | Verdict |
|------|------|------|---------|
| posthog | 200 | 231KB | ✅ LIVE |
| supabase | 200 | 620KB | ✅ LIVE (huge) |
| ramp | 200 | 1.8MB | ✅ LIVE (huge) |
| cal.com | 404 | — | ❌ try `calcom` |
| tines | 404 | — | ❌ try `tines-io` |
| stripe | 404 | — | ❌ Stripe uses custom ATS |
| linear / plaid | 000 | — | TIMEOUT |

**Lever** — `https://api.lever.co/v0/postings/{slug}`:

| Slug | HTTP | Size | Verdict |
|------|------|------|---------|
| qonto | 200 | 1.3MB | ✅ LIVE (huge) |
| ableton | 404 | — | ❌ |
| brex | 404 | — | ❌ |
| glovo | 404 | — | ❌ |
| mistral.ai | 404 | — | ❌ — but `mistral` in portals.yml works |

### LinkedIn typeahead geoId verification

All probed 2026-04-20, live and returning expected URNs. **Bonus finding: DACH cluster `91000006`** (not in prior research lists).

| Display | URN | Status |
|---------|-----|--------|
| Austria | 103883259 | ✅ verified |
| **DACH** | **91000006** | ✅ NEW — cluster code |
| Vienna, Austria | 107144641 | ✅ verified |
| Germany | 101282230 | ✅ verified |
| North Rhine-Westphalia | 103480659 | ✅ verified |
| Bavaria | 100545973 | ✅ verified |
| Switzerland | 106693272 | ✅ verified |
| Zurich | 102436504 | ✅ verified |
| European Union | 91000000 | ✅ verified |
| Poland | 105072130 | ✅ verified |
| Mazowieckie | 102996679 | ✅ verified |
| Warsaw | 105076658 | ✅ verified |
| Netherlands | 102890719 | ✅ verified |
| The Randstad | 90009706 | ✅ verified |
| North Holland | 106993522 | ✅ verified |
| France | 105015875 | ✅ verified |
| Île-de-France | 104246759 | ✅ verified |
| Paris | 106383538 | ✅ verified |

### JustJoin.IT `__NEXT_DATA__` capture attempt

`curl + grep "buildId":"..."` returned empty. This means either:
- The page hydration structure changed (no longer `__NEXT_DATA__` in flat scan),
- The JSON is embedded but not on line expected by `grep -oE`,
- The build ID is not top-level.

**Next action**: capture via `mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page` + `evaluate_script` to inspect DOM structure.

### Arbeitsagentur sample response

```json
{
  "stellenangebote": [
    {
      "beruf": "Softwareentwickler/in",
      "titel": "Softwareentwickler (m/w/d)",
      "refnr": "10001-1002822469-S",
      "arbeitsort": {
        "plz": "49393", "ort": "Lohne (Oldenburg)",
        "strasse": "Südring 25", "region": "Niedersachsen",
        "land": "Deutschland",
        "koordinaten": { "lat": 52.659558, "lon": 8.1927675 }
      },
      "arbeitgeber": "ATKA GmbH Kunststoffverarbeitung",
      "aktuelleVeroeffentlichungsdatum": "2026-03-25",
      "modifikationsTimestamp": "2026-03-25T12:25:13.587",
      "eintrittsdatum": "2026-03-25",
      "kundennummerHash": "VprkxY1g5LYleU6I8QED5fkDcBfLJh6WYq61ioBEvQw="
    }
  ],
  "maxErgebnisse": 97,
  "page": 1,
  "size": 2,
  "facetten": { ... }
}
```

`maxErgebnisse = 97` for `was=Softwareentwickler&arbeitszeit=ho&size=2`. Detail endpoint: `/pc/v4/jobdetails/{base64(refnr)}`.

---

## Session 3 — 2026-04-20 (slug + URL discovery)

### Greenhouse slug variant discovery

Tested ~35 slug variants for the 14 Session 2 404s:

| Company | Winning slug | Verdict |
|---------|--------------|---------|
| **Mews** | `mewssystems` | ✅ LIVE 48KB |
| Klarna | — (Greenhouse dead) | → **found on Ashby** `klarna` ✅ 6KB |
| Wise | — all variants 404 | ❌ NOT on GH — custom or Workday |
| Bolt (ride-share EU) | — | ❌ NOT on GH (Ashby stub 28B = empty) |
| Mollie | — | ❌ |
| Depop | — | ❌ |
| Delivery Hero | — | ❌ (likely Workday) |
| TIER Mobility | — | ❌ |
| Taxfix | — | ❌ |
| TeamViewer | — | ❌ (Workday likely) |
| TourRadar | — | ❌ (custom AT) |
| Alan | — | ❌ |
| Swile | — | ❌ |
| PayFit | — | ❌ |
| Bitmovin / Tractive / Anyline (AT) | — | ❌ all 404 |
| Pleo | — (bare `pleo` returns 30B empty) | ❌ empty |

**Conclusion**: ~14 expected-EU-unicorn GH slugs are dead or empty. These companies migrated to Workday, custom ATS, or shrunk their GH boards. **Aggregator APIs (Adzuna / Himalayas / Arbeitsagentur) will cover them — don't chase GH slugs further.**

### Additional Greenhouse LIVE (bonus finds)

| Slug | Size | Region |
|------|------|--------|
| **databricks** | 699KB | US/global but strong EU remote |
| **datadog** | 565KB | US/global, EU offices |
| **doctolib** | 191KB | FR — good FR remote signal (contrary to File 1 "Workday" claim) |
| storyblok (retest) | 10KB standard / 31KB on GH EU | AT |
| bitpanda (retest) | 33KB standard / 62KB on GH EU | AT |

**Note**: `boards-api.greenhouse.io/v1/boards/{slug}/jobs` works; `job-boards.eu.greenhouse.io/embed/job_board?for={slug}` returns 404 for many — different API path. Stick with standard.

### Ashby additions

| Slug | HTTP | Size | Verdict |
|------|------|------|---------|
| **linear** (retest) | 200 | 236KB | ✅ LIVE (Session 2 timeout resolved) |
| **klarna** (NEW) | 200 | 6KB | ✅ LIVE — small but present |
| calcom / cal-com / tines-io | 404 | — | ❌ no Ashby |

### Lever additions

| Slug | HTTP | Size | Verdict |
|------|------|------|---------|
| **mistral** | 200 | **3.7MB** | ✅ HUGE (note: `mistral.ai` was the 404 — bare `mistral` works) |
| ableton-ag | 000 | — | timeout |
| bolteu / depop / klarna / wise | 404 | — | ❌ not on Lever |

### URL fixes (Phase 0.7)

| Source | Original URL | Fixed URL | Status |
|--------|-------------|-----------|--------|
| GermanTechJobs.de | `/en/jobs/remote` | `/` | ✅ 200 but 4KB — SPA, needs DevTools |
| Relocate.me | `/jobs` (404) | `/` (200 / 112KB) | ✅ Use root for scrape entry |
| Relocate.me | `/jobs-from-europe` | — | ❌ 404 |
| hnhiring.com | `/technologies/.net` | `/technologies/dotnet` | ✅ 200 / 68KB |
| jobs.heise.de | `/feed/rss` (000) | `/` (200 / 316KB) | ✅ HTML scrape; inspect page for per-listing RSS |
| ai-jobs.net | `/feed/` (404) | `/` (200 / 320KB) + `/?feed=rss2` | ✅ HTML root; verify RSS exact URL via DevTools |
| nextleveljobs.eu | various | — | ❌ still timeout — drop |
| dotnetjobs.co | any | — | ❌ dead |
| Europe Remotely | any | — | ❌ 403 — drop unless UA fix works |

### Updated live-source summary

**Definitive Tier A Greenhouse list** (scan.mjs-ready, 2026-04-20 verified):
- n26, commercetools, contentful, getyourguide, parloa, gostudent, traderepublic, mewssystems, storyblok, bitpanda, doctolib, databricks, datadog

**Definitive Tier A Ashby list**:
- posthog, supabase, ramp, linear, klarna, n8n, attio, zapier

**Definitive Tier A Lever list**:
- qonto, mistral, bitpanda (if not in GH)

**Dead for zero-token path** (must use aggregators): wise, bolt, mollie, depop, deliveryhero, tiermobility, taxfix, teamviewer, tourradar, alan, swile, payfit, bitmovin, tractive, anyline, cal.com, tines, pleo

---

## Session 2 — agent research findings (Adzuna/Jooble/Careerjet/Hiring.cafe)

Sub-agent `a1bcdbe8456b5c8e7` delivered verified report 2026-04-20.

### Adzuna — CONFIRMED OPEN FREE TIER

- Self-serve signup at `developer.adzuna.com` → `app_id` + `app_key` instantly, no business justification
- **Rate**: 25/min, 250/day, 1000/week, 2500/month
- Countries in path (not param): `at`, `de`, `ch`, `nl`, `pl`, `fr`, `be`, `es`, `it`, `uk` all live
- **Attribution**: "Jobs by Adzuna" badge (116×23px) required for ad listings + Jobsworth icon for salary data
- **URL**: `https://api.adzuna.com/v1/api/jobs/at/search/1?app_id=X&app_key=Y&what=.NET&where=Austria&max_days_old=2&category=it-jobs&results_per_page=50&content-type=application/json`
- **Verdict**: **include-in-pipeline**. Best single aggregator for AT/DE/CH.

### Jooble — free key via form

- Form at `jooble.org/api/about` — manual approval (same-day to few days)
- POST body: `{keywords, location, radius (0|4|8|16|26|40|80), salary, page, ResultOnPage, SearchMode}`
- Location: free-text "City, Country"
- **Verdict**: **include-if-free-tier-open**

### Careerjet — v4 REST live

- `https://search.api.careerjet.net/v4/query`, Basic Auth (key as username, empty pass)
- **Required params**: `user_ip` + `user_agent` (missing = 403)
- Locales confirmed: `de_AT`, `de_DE`, `de_CH`, `fr_FR`, `fr_BE`, `fr_CH`, `nl_NL`, `pl_PL`, `en_GB`
- **Verdict**: **include-in-pipeline** — good DACH complement

### Hiring.cafe — REFRAMED

Agent verdict differs from earlier assessment:
- Still ~2.8M listings from 46 ATSes
- **No official public API** — internal JSON, Apify scrapers at $1.80/1k runs
- Cloudflare bot checks on endpoint
- **Recommendation: skip as API source. Use Greenhouse/Lever/Ashby directly — same data, zero legal grey area.**

**⚠️ This demotes hiring.cafe from Tier A.5 → Tier C (reference only).** Update [04-evaluation.md](04-evaluation.md#a5--hiringcafe-via-chrome-devtools-capture).

### New 2024-2026 aggregator confirmations

- Himalayas API — no auth, filter country/seniority/employment/timezone — **strong for .NET/TS remote EU**
- Arbeitnow — DACH best single source
- Jobicy — RSS + JSON, 50 listings, attribution required
- RemoteOK JSON — broad remote, attribution required

All four: **include**, zero-auth, legal.

---

## Sample response shapes (for parser design)

### Arbeitnow (#5) sample

```json
{
  "data": [
    {
      "slug": "niederlassungsleiterin-branch-managerin-am-standort-hamburg-harburg-201701",
      "company_name": "Annette Wittram - AWi Personalvermittlung und Bewerbercoaching",
      "title": "Niederlassungsleiter*in - Branch Manager*in am Standort Hamburg-Harburg",
      "description": "<p>...HTML...</p>",
      ...
    }
  ]
}
```

Observed fields (complete list from research):
- `slug` — unique ID
- `company_name` — employer
- `title` — JD title
- `description` — HTML body
- `remote` — boolean
- `url` — apply URL
- `tags[]` — skill/type tags
- `job_types[]` — employment type
- `location` — city/country
- `created_at` — unix timestamp

**Pagination**: `?page=N`. No cursor field in response — walk until empty.

### Himalayas (#6) sample

```json
{
  "comments": "13/03/2026: The API has been updated to include the companySlug field in the response.",
  "updatedAt": 1776682584,
  "offset": 0,
  "limit": 20,
  "totalCount": 2648,
  "jobs": [
    {
      "title": "Manager, Product Marketing - Math",
      "excerpt": "Who We Are...",
      "companyName": "Great Minds",
      "companySlug": "great-minds",
      "companyLogo": "https://cdn-images.himalayas.app/...",
      "employmentType": "Full Time",
      "minSalary": 106000,
      "maxSalary": 117000,
      "seniority": ["Mid-level"],
      "currency": "USD",
      "locationRestrictions": [],
      "timezoneRestrictions": [-11,-10,-9.5,-9,-8,-7,-6,-5,-4,-3.5,-3,-2,-1,0,1,2,3,3.5,4,4.5,5,5.5,5.75,6,6.5,7,8,8.75,9,9.5,10,10.5,11,12,12.75,13,14],
      "categories": ["Product-Marketing","Marketing-Strategy","K..."]
    }
  ]
}
```

**Key insight**: `timezoneRestrictions` is an array of UTC offsets. **EU-fit filter**: restrict to `[0, 1, 2, 3]` (UTC, CET, EET — matches Austria CET+1).

`totalCount=2648` was for `country=Austria`. Response note says totalCount of all jobs is 115k.

**Pagination**: `offset` + `limit`. Walk in 20-item pages.

**Dedup**: `companySlug` + `title` hash.

### Arbeitsagentur (#7) params (from canonical `bundesAPI/jobsuche-api` repo)

```
GET /jobboerse/jobsuche-service/pc/v4/jobs?
  was=Softwareentwickler         # keyword
  &wo=Wien                       # location
  &berufsfeld=...                # occupational field
  &page=1
  &umkreis=50                    # radius km
  &arbeitszeit=ho                # Homeoffice (Telearbeit) — REMOTE FILTER
  &veroeffentlichtseit=7         # published in last N days (0-100)
  &angebotsart=1                 # regular jobs (not apprentice/self-employed)
  &size=100                      # results per page

Header:
  X-API-Key: jobboerse-jobsuche  # shared anonymous key
```

Job detail fetch:
```
GET /jobboerse/jobsuche-service/pc/v4/jobdetails/{base64-encoded-refnr}
```

### LinkedIn guest seeMore (#16) sample behavior

Returns HTML fragment (not JSON) containing ~25 `<li>` elements, one per job card. Parse with regex or Cheerio:

```html
<li>
  <div class="base-card ...">
    <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/123456789/...">
    <h3 class="base-search-card__title">Senior .NET Engineer</h3>
    <h4 class="base-search-card__subtitle">Company Name</h4>
    <span class="job-search-card__location">Austria (Remote)</span>
    <time datetime="2026-04-19">1 day ago</time>
  </div>
</li>
```

**Pagination**: `&start=0`, `&start=25`, ... up to ~1000 hard cap. Partition by geoId + f_TPR window to exceed cap.

**EU geoId URNs** (re-verify via `/jobs-guest/api/typeaheadHits?typeaheadType=GEO&query=<country>` before production):
- European Union (cluster): 91000000
- EEA: 91000002
- Austria: 103883259
- Germany: 101282230
- Switzerland: 106693272
- Netherlands: 102890719
- Ireland: 104738515
- France: 105015875
- Spain: 105646813
- Italy: 103350119
- Poland: 105072130
- Belgium: 100565514
- Czechia: 104508036
- Sweden: 105117694
- Denmark: 104514075
- Finland: 100456013
- Norway: 103819153
- UK: 101165590
- Portugal: 100364837
- Luxembourg: 104042105

**Filters that matter**:
- `f_WT=2` — remote
- `f_TPR=r86400` — last 24h (also `r604800` week, `r3600` hour)
- `f_E=3,4` — associate + mid-senior
- `f_JT=F,C` — full-time or contract
- `f_AL=true` — actively hiring (Easy Apply marker)
- `f_JIYN=true` — <10 applicants (high-signal)
- `sortBy=DD` — newest first (essential)

Boolean in `keywords`: `(".NET" OR "C#" OR Angular OR TypeScript) NOT Senior` (quotes, parentheses, OR/AND/NOT all work).

---

## Dead endpoints (do not retry — evidence logged)

| Endpoint | Evidence | Note |
|----------|----------|------|
| `justjoin.it/api/offers` | 404 probed 2026-04-20 + jszafran.dev dataset shutdown post | Dead since Nov 2023. Use Next.js hydration. |
| `api.justjoin.it/v2/user-panel/offers*` | 404 probed 2026-04-20 | No v2 replacement public |
| `at.indeed.com/rss` | 404 probed 2026-04-20 | Indeed killed RSS. Use GraphQL via DevTools. |

---

## Blocked endpoints (need DevTools / special headers)

| Endpoint | HTTP | Remedy |
|----------|------|--------|
| `hiring.cafe/` | 403 | One-time Chrome DevTools capture of internal JSON endpoint. Apify scrapers document structure. |
| `nofluffjobs.com/api/posting/search` | 405 GET | POST with JSON body + browser headers. Capture via DevTools. |
| `remoteok.com/api` | 000 timeout | Try real browser once. Has anti-LLM honeypots — use UA + honor attribution. |

---

## Unprobed — pending (priority for next session)

Ordered by priority. See [05-next-steps.md#phase-0](05-next-steps.md#phase-0-live-endpoint-verification) for schedule.

### High priority — must verify before yml commit

- [ ] Adzuna — sign up at developer.adzuna.com, test one country (AT or DE) — is free tier still open 2026?
- [ ] Jooble — request free key via partner form, test POST
- [ ] RemoteOK RSS at `/rss` (separate from `/api`) — plus attribution compliance
- [ ] hnhiring.com `/technologies/.net` + `/locations/remote` — live?
- [ ] WeAreDevelopers Jobs `wearedevelopers.com/en/jobs` — API or SSR HTML?
- [ ] dotnetjobs.dev + dotnetjobs.co — live and scrapeable?
- [ ] EuroTechJobs.com — structure check
- [ ] Dou.ua/jobs — EU-remote filter available?
- [ ] theprotocol.it — SSR HTML intact?
- [ ] bulldogjob.com `/companies/jobs/s/city,Remote/skills,.NET` — SSR?
- [ ] GermanTechJobs.de — live + Austria filter?
- [ ] SwissDevJobs.ch — live?
- [ ] Jobgether `/remote-jobs/european-union` — scrapable?
- [ ] euremotejobs.com — RSS confirmed?
- [ ] ai-jobs.net — RSS + JSON-LD?
- [ ] jobs.heise.de — RSS on specific listings still works?

### Medium priority — for Tier B+ investigation

- [ ] LinkedIn `/jobs-guest/api/typeaheadHits?typeaheadType=GEO&query=Germany` — confirm geoId verification endpoint
- [ ] LinkedIn `/jobs/view/{id}/` — confirm JSON-LD `jobLocationType` still embedded
- [ ] Welcome to the Jungle — Algolia key still on client? Capture via DevTools.
- [ ] Xing GraphQL — capture via DevTools
- [ ] Indeed GraphQL — capture via DevTools
- [ ] TrueUp — `__NEXT_DATA__` shape

### Low priority — Tier D Google queries

Google `site:` queries don't need probing — Google accepts them. Only need to verify target site is still live (covered above).

---

## Probing template for continuation agent

To add a new probe, paste this template under a new `### Session N — YYYY-MM-DD` heading:

```markdown
### Session N — YYYY-MM-DD

**Probed by**: <agent identity / user>
**Method**: <curl command template>

| # | Source | URL | HTTP | Size | Verdict |
|---|--------|-----|------|------|---------|
| 1 | <name> | `<full-url>` | <code> | <bytes> | <LIVE/DEAD/BLOCKED/TIMEOUT> |
```

Rules:
- Always include User-Agent header (some sources 403 without)
- Use `-o /dev/null -w "HTTP:%{http_code} SIZE:%{size_download}"` to avoid dumping bodies to terminal
- For JSON endpoints with auth-gated variants, test both with and without auth
- For SPAs, probe `/` + observe if HTML has `<script>` hydration blob — if yes, document buildId discovery
- Record sample response shape (first ~800 chars) for any new JSON API in the **Sample response shapes** section above

---

## Cross-reference

- Catalog all sources: [02-source-catalog.md](02-source-catalog.md)
- Ranked picks based on probes: [04-evaluation.md](04-evaluation.md)
- Probe todos: [05-next-steps.md#phase-0](05-next-steps.md)
