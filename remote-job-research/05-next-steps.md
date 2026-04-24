# 05 — Next steps (actionable TODO)

See [README](README.md) for index. This is the **living todo list** for any agent continuing the work.

**Convention**:
- `[ ]` = open
- `[x]` = done
- `[~]` = in progress
- `[!]` = blocked
- Each todo has: description, dependencies, acceptance criteria, owner (human/agent), links

Update this file as you work. Move completed items to the **Done log** at bottom with date.

---

## Current phase

**Phase 0 — Live endpoint verification** (IN PROGRESS — partial)

Session 1 (2026-04-20) probed 21 endpoints. See [03-probes.md](03-probes.md).

**Remaining Phase 0 work**: probe ~20 more endpoints for Tier A.10 (RSS) + B (DevTools captures) + C (HTML scrapes) + B.6 (per-company ATS verification).

When Phase 0 complete → move to Phase 1.

---

## Phase 0 — Live endpoint verification

### [ ] 0.1 — Probe API-key sources

Sources requiring free-tier signup, not yet verified live.

- [ ] **Adzuna** — sign up at `https://developer.adzuna.com/`, get `app_id` + `app_key`, probe `https://api.adzuna.com/v1/api/jobs/at/search/1?app_id=X&app_key=Y&what=.NET&where=Austria&max_days_old=2&sort_by=date&category=it-jobs`. Record observed rate limit. Also probe for `de`, `ch`, `nl`, `pl` ccTLDs.
  - **Acceptance**: HTTP 200 + valid JSON shape documented in [03-probes.md](03-probes.md). Rate limit noted inline.
  - **Owner**: human (signup) + agent (probe + log)
- [ ] **Jooble** — request free key via partner form at `https://jooble.org/api/about`. Test POST `https://jooble.org/api/{key}` with body `{"keywords":".NET","location":"Austria","page":1,"ResultOnPage":5}`.
  - **Acceptance**: verified live or dropped (if key approval >7 days, drop).
- [ ] **Careerjet** — request key. Decision: probably DROP regardless — [04-evaluation.md](04-evaluation.md) classifies as Adzuna-duplicate. Skip this todo unless Adzuna fails.

### [ ] 0.2 — Probe RSS feeds (Tier A.10)

- [ ] **Remotive backup RSS** — `https://remotive.com/feed`
- [ ] **Himalayas RSS** — `https://himalayas.app/jobs/rss`
- [ ] **Arbeitnow RSS** — `https://www.arbeitnow.com/remote-jobs/rss`
- [ ] **jobs.heise.de RSS** — find an actual listing URL + append `?rm=rss`
- [ ] **euremotejobs.com RSS** — `https://euremotejobs.com/feed`
- [ ] **AI-jobs.net RSS** — find endpoint
- [ ] **RemoteOK RSS** — `https://remoteok.com/rss` (direct, vs `/api` that timeouts)
- [ ] **HN who-is-hiring RSS** — `https://hnrss.org/newest?q=hiring`
- [ ] **NoDesk per-cat RSS** — find endpoint

**Acceptance**: each returns HTTP 200 + valid RSS/Atom XML + ≥5 items. Log in [03-probes.md](03-probes.md). Sample 1 item per feed in probes.

### [ ] 0.3 — Probe SSR HTML scrape targets (Tier C)

- [ ] **theprotocol.it** — `https://theprotocol.it/filtry/fullstack;sp/zdalna;rw` — SSR HTML with job cards visible?
- [ ] **bulldogjob.com** — `https://bulldogjob.com/companies/jobs/s/city,Remote/skills,.NET` — SSR?
- [ ] **GermanTechJobs.de** — with Austria + remote filter — SSR?
- [ ] **SwissDevJobs.ch** — same pattern
- [ ] **WeAreDevelopers Jobs** — `https://www.wearedevelopers.com/en/jobs?location=remote` — AT-founded check
- [ ] **dotnetjobs.dev** — is it Next.js (needs hydration)?
- [ ] **dotnetjobs.co** — same
- [ ] **EuroTechJobs.com** — HTML structure
- [ ] **Dou.ua/jobs** — EU-remote filter available via URL?
- [ ] **Jobgether** `/remote-jobs/european-union` — SSR?
- [ ] **Europe Remotely** — `https://europeremotely.com`
- [ ] **JustRemote** with Europe filter
- [ ] **Remote Rocketship** `/country/europe/jobs/net`
- [ ] **Relocate.me** — `https://relocate.me/jobs`
- [ ] **4dayweek.io/europe** — SSR?
- [ ] **hnhiring.com** `/technologies/.net` + `/locations/remote`
- [ ] **Landing.jobs** — clean HTML?
- [ ] **The Hub (thehub.io)** — Nordic
- [ ] **Berlin Startup Jobs** — WordPress
- [ ] **nextleveljobs.eu**
- [ ] **TrueUp** — check `__NEXT_DATA__` shape

**Acceptance**: per site, document `HTTP code`, `HTML hydration style` (SSR vs SPA), `selector hint` (which CSS path hits job cards), in [03-probes.md](03-probes.md).

### [ ] 0.4 — Probe hidden-API targets via Chrome DevTools MCP (Tier B)

Use `mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page` + `list_network_requests` + `get_network_request` tools.

- [ ] **hiring.cafe** — navigate `https://hiring.cafe/?techStack=.NET`, observe XHRs, capture internal API URL + headers + body. Document auth tokens if any.
- [ ] **LinkedIn job detail** — navigate `/jobs/view/{some-id}/`, extract `<script type="application/ld+json">`. Confirm `jobLocationType=TELECOMMUTE` + `applicantLocationRequirements` still embedded.
- [ ] **LinkedIn typeahead** — `/jobs-guest/api/typeaheadHits?typeaheadType=GEO&query=Germany` — confirm geoId=101282230 still.
- [ ] **WTTJ** — navigate `https://www.welcometothejungle.com/en/jobs?query=.NET&remote=true`, observe Algolia POST request, capture URL + `x-algolia-api-key` + body.
- [ ] **Xing Jobs public** — navigate `https://www.xing.com/jobs/search?keywords=.NET&remoteOption=FULL_REMOTE` **WITHOUT logging in**, observe only the GraphQL calls available without auth. Auth-gated endpoints = out of scope (Chrome DevTools MCP can't sustain sessions).
- [ ] **Indeed DE** — navigate `https://de.indeed.com/jobs?q=.NET+remote`, observe `apis.indeed.com/graphql` POST, capture `Client-Version` header value.
- [ ] **JustJoin.IT Next.js** — navigate `https://justjoin.it/job-offers/remote/net`, extract `<script id="__NEXT_DATA__">` content, find `buildId`, confirm `/_next/data/{buildId}/job-offers/all-locations.json` fetches.
- [ ] **NoFluffJobs** — navigate `https://nofluffjobs.com/pl/remote`, observe POST request to `/api/posting/search`, capture body JSON shape.
- [ ] **TrueUp** — navigate `https://www.true-up.io/companies?tech=.NET`, extract `__NEXT_DATA__`.
- [ ] **Jobs.ch** — navigate `https://www.jobs.ch/en/vacancies/?term=.NET&employment-type=1&region=5,6,7` (CH regions), observe API calls.

**Acceptance**: per site, document full curl reproduction of captured request (including all required headers + body) in [03-probes.md](03-probes.md) as new subsection "Hidden-API captures". Include a one-time timestamp (these drift).

### [ ] 0.5 — Probe per-company ATS slugs (Tier A.1 + B.6)

Batch-probe 60 EU company ATS slugs. Script:
```bash
for slug in n26 pleo mews klarna wise bolt contentful mollie depop getyourguide deliveryhero ...; do
  echo "=== $slug ==="
  curl -s -o /dev/null -w "HTTP:%{http_code} SIZE:%{size_download}\n" \
    "https://boards-api.greenhouse.io/v1/boards/$slug/jobs" -m 5
done
```

- [ ] **Greenhouse slugs** — 30 companies listed in [02-source-catalog.md#a2](02-source-catalog.md#a2)
- [ ] **Ashby slugs** — 10 companies
- [ ] **Lever slugs** — 5 companies
- [ ] **Teamtailor slugs** — verify each
- [ ] **SmartRecruiters slugs** — verify each
- [ ] **Personio XML** — per-company URLs

**Acceptance**: append results to [03-probes.md](03-probes.md) under new section "Company ATS verification". Mark each slug LIVE/MOVED/DEAD. For MOVED, find new location or drop.

---

## Phase 1 — Draft `remote-portals.yml`

Depends on: Phase 0 complete (at least 0.1, 0.2, 0.5).

### [ ] 1.1 — Write `remote-portals.yml` header + title_filter

- [ ] Copy header comment from `portals.yml` adapted
- [ ] `title_filter.positive` — strip Salzburg-specific, keep stack (.NET/C#/Angular/TypeScript/Node/Python), add remote tokens (Remote, EU Remote, Europe, EMEA, DACH, Home Office, Telearbeit, Distributed, home-based)
- [ ] `title_filter.negative` — keep existing seniority negatives + add US-only gates:
  ```yaml
  - "US only"
  - "USA"
  - "United States"
  - "US citizen"
  - "must reside in US"
  - "PST"
  - "EST"
  - "Eastern Time"
  - "Pacific Time"
  - "EST required"
  - "Americas only"
  ```
- [ ] `seniority_boost` — unchanged from portals.yml

**Acceptance**: file parses as valid YAML + `scan.mjs` loads it without error.

### [ ] 1.2 — Populate `companies:` section

- [ ] Start with A.1 probed-live slugs from Phase 0.5
- [ ] Group by region comment (DACH, Nordics, BeNeLux, FR/UK/IE, Remote-first)
- [ ] Each entry has: `name`, `careers_url`, optionally `api` (for GH where slug is not obvious), `enabled: true`
- [ ] Dedupe against `portals.yml` — if company already in `portals.yml`, don't add here (single source of truth)

**Acceptance**: ≥40 entries, all with live ATS URLs verified in Phase 0.5.

### [ ] 1.3 — Add `feeds:` section (NEW schema)

Proposed schema extension:
```yaml
feeds:
  - name: "Arbeitsagentur — Homeoffice"
    type: "arbeitsagentur"
    url: "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs"
    params:
      arbeitszeit: "ho"
      size: 100
      veroeffentlichtseit: 7
    headers:
      X-API-Key: "jobboerse-jobsuche"
    rate_limit_per_min: 30
    enabled: true

  - name: "Himalayas — EU TZ"
    type: "himalayas"
    url: "https://himalayas.app/jobs/api/search"
    params:
      country: "Austria"
      timezoneRestrictions: "0,1,2,3"
      limit: 20
    rate_limit_per_min: 30
    enabled: true

  - name: "Arbeitnow"
    type: "arbeitnow"
    url: "https://www.arbeitnow.com/api/job-board-api"
    enabled: true

  - name: "Remotive — software-dev"
    type: "remotive"
    url: "https://remotive.com/api/remote-jobs"
    params:
      category: "software-dev"
    rate_limit_per_min: 2      # ⚠️ hard cap
    attribution_required: true
    enabled: true

  - name: "WeWorkRemotely — full-stack"
    type: "rss"
    url: "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss"
    enabled: true

  - name: "Jobicy — Austria"
    type: "rss"
    url: "https://jobicy.com/?feed=job_feed&search_region=austria"
    attribution_required: true
    enabled: true

  # ... etc per Tier A.10
```

- [ ] Define schema above in `remote-portals.yml`
- [ ] Add entries for all Tier A.10 sources verified in Phase 0.2
- [ ] Document schema in `remote-portals.yml` comment block at top

**Acceptance**: YAML parses; types defined for all Tier A sources.

### [ ] 1.4 — Add `hidden_apis:` section (NEW schema)

Proposed:
```yaml
hidden_apis:
  - name: "hiring.cafe"
    type: "hiring-cafe"
    url: "<captured-URL-from-Phase-0.4>"
    method: "POST"
    headers: {...}     # captured
    body_template: |
      {...}
    captured_at: "2026-05-??"
    enabled: true
```

- [ ] Schema defined
- [ ] Entries for Tier B.1-B.5 from Phase 0.4 captures

**Acceptance**: schema parses; `captured_at` lets continuation agent re-capture if >90 days old.

### [ ] 1.5 — Add `search_queries:` section (existing schema, for skill mode)

- [ ] Add Tier D Google site: queries from [02-source-catalog.md#f](02-source-catalog.md#f--google-site-queries-existing-skill-mode-llm-tokens)
- [ ] Cap at ~15 queries for token budget

**Acceptance**: queries well-formed, no duplicates vs `portals.yml` queries.

---

## Phase 2 — Extend `scan.mjs`

Depends on: Phase 1 complete, types defined.

### [ ] 2.1 — Add `--portals` CLI flag

Current: `const PORTALS_PATH = 'portals.yml';` hardcoded.

New: `scan.mjs [--portals <path>] [--dry-run] [--company <name>]`. Default = `portals.yml`. `--portals remote-portals.yml,portals.yml` runs both and dedups.

- [ ] Parse argv
- [ ] Load multiple yaml files + merge
- [ ] Cross-file dedup

**Acceptance**: `node scan.mjs --portals remote-portals.yml --dry-run` runs without regression.

### [ ] 2.2 — Add parser: generic RSS

- [ ] Use `fast-xml-parser` npm (MIT)
- [ ] Handle RSS 2.0 + Atom 1.0
- [ ] Normalize to `{title, url, company_name, description, published_at}`
- [ ] Route all Tier A.10 `type: 'rss'` entries here

**Acceptance**: WWR feed returns ≥10 parsed jobs in dry-run.

### [ ] 2.3 — Add parser: Arbeitsagentur

- [ ] Hit URL with header `X-API-Key: jobboerse-jobsuche`
- [ ] Paginate until `stellenangebote[]` exhausted
- [ ] Optional: fetch detail via `/pc/v4/jobdetails/{base64(refnr)}` for full JD

**Acceptance**: returns ≥50 AT/DE remote jobs.

### [ ] 2.4 — Add parser: Himalayas

- [ ] Hit `/jobs/api/search` with user-supplied params
- [ ] Walk `offset`/`limit` until `totalCount` reached
- [ ] Apply `timezoneRestrictions` filter client-side if yaml specifies

**Acceptance**: pulls ≥100 EU-TZ jobs.

### [ ] 2.5 — Add parser: Arbeitnow

- [ ] Walk `?page=N` until empty
- [ ] Filter `remote:true` client-side

**Acceptance**: pulls ≥50 remote jobs.

### [ ] 2.6 — Add parser: Remotive + rate-limit queue

- [ ] Single request returns full catalog
- [ ] Filter `candidate_required_location` client-side against EU whitelist
- [ ] Implement per-source rate-limit queue (2 req/min hard for Remotive)

**Acceptance**: respects cap, returns ≥20 filtered EU jobs.

### [ ] 2.7 — Add parser: LinkedIn guest

- [ ] Loop geoIds + keyword partitions
- [ ] Parse HTML fragment via Cheerio or regex
- [ ] Enforce 3-10s random delay, <100 req/day global
- [ ] Optional: second pass for `/jobs/view/{id}/` JSON-LD extraction

**Acceptance**: returns ≥50 jobs across 5 EU countries in dry-run.

### [ ] 2.8 — Add parser: HN Algolia + YC companies + Mastodon + Reddit + hiring.cafe

One parser per source. Each ~30-60 LoC.

**Acceptance**: each returns ≥5 jobs in dry-run.

### [ ] 2.9 — EU-fit gate

Post-parser filter applied to every job regardless of source:

1. If JSON-LD available → check `jobLocationType` + `applicantLocationRequirements[]`
2. Else → regex description/title for EU positive + absence of US-only negative
3. Else → mark `euFitConfidence: low` and let LLM gate handle

**Acceptance**: ≥80% of surfaced jobs pass manual EU-fit spot check on 50 samples.

### [ ] 2.10 — Source-priority dedup

- [ ] Compute `dedup_key = SHA1(lower(title) + lower(normalized_company) + hostname(apply_url))`
- [ ] On collision, retain entry from lowest tier (ATS=1 < niche=2 < aggregator=3 < RSS=4 < Google=5)

**Acceptance**: daily scan shows <5% duplicate title+company pairs.

---

## Phase 3 — Chrome DevTools captures + hidden APIs

Depends on: Phase 0.4 done, Phase 2 parser infrastructure in place.

### [ ] 3.1 — hiring.cafe capture + parser
### [ ] 3.2 — Indeed GraphQL capture + parser
### [ ] 3.3 — WTTJ Algolia capture + parser
### [ ] 3.4 — Xing GraphQL capture + parser (PUBLIC endpoints only — no login)
### [ ] 3.5 — JustJoin.IT Next.js hydration parser (buildId dynamic)
### [ ] 3.6 — NoFluffJobs POST capture + parser

**Each**: 15 min DevTools session + 40-60 LoC parser + yml entry.

**Acceptance**: each source contributes ≥10 unique jobs not in Tier A sources.

---

## Phase 4 — Discovery + operations

### [ ] 4.1 — GitHub repo discovery loop

- [ ] Parse `remoteintech/remote-jobs` YAML frontmatter → filter `region: europe` + tech tags → extract `careers_url`
- [ ] Parse `EuropeanRemote/european-remote-software-companies` markdown
- [ ] For each `careers_url`, fingerprint ATS (regex on page HTML for `greenhouse.io|lever.co|ashbyhq.com|workday.com|smartrecruiters.com|personio.com|recruitee.com|teamtailor.com`)
- [ ] Auto-append new companies to `remote-portals.yml` `companies:` with PR for review

**Cadence**: weekly cron.

### [ ] 4.2 — ~~Email alert ingestion~~ — DROPPED

Requires Gmail OAuth or IMAP auth — same auth-persistence problem as LinkedIn/Xing logged-in scraping. Chrome DevTools MCP can't sustain auth sessions. Skip entirely.

If user wants this, build as separate user-driven flow outside scan.mjs (user runs a local script with their own Gmail credentials). Not in scope for `remote-portals.yml`.

### [ ] 4.3 — Write `data/remote-portal-scraping-guide.md`

Sibling of existing `data/portal-scraping-guide.md`. Document:
- LinkedIn guest geoId partitioning strategy
- Chrome DevTools MCP capture procedure (step-by-step per site)
- EU-fit gate implementation
- Pacing table per source
- Attribution inline (RemoteOK, Jobicy, Remotive, Adzuna ask for source link)

### [ ] 4.4 — Rate-limit queue in scan.mjs

Current: single global `CONCURRENCY=10`.

New: per-source queue (`rate_limit_per_min` config).

- [ ] Implement per-source bucket
- [ ] Remotive: 2/min
- [ ] Himalayas: 30/min (on 429 backoff)
- [ ] LinkedIn guest: 20/min
- [ ] Reddit: 30/min (with UA)
- [ ] Others: unlimited (concurrency cap only)

### [ ] 4.5 — Attribution in report headers

For sources with `attribution_required: true` (Remotive, Jobicy, RemoteOK), include source link + "via X" in report A-F block.

---

## Open questions (need user or agent judgment)

1. ~~Xing scraping — include or defer?~~ — **RESOLVED**: include **public search only**. Authenticated Xing is out (auth-persistence impossible with Chrome DevTools MCP).

2. **Adzuna — drop if signup friction >15 min?**
   - Adzuna = biggest single aggregator API per File 2.
   - If free tier requires payment verification or business use case, decide: drop or escalate to paid.

3. **hiring.cafe — worth including at all?**
   - Agent research (Session 2) said: skip. Aggregates GH/Lever/Ashby we already hit directly. No unique value.
   - Keep Tier C reference only (manual UI browse).

4. **Workday direct tenants — worth the effort for Zalando / Siemens Berlin fullstack?**
   - Currently: NO, hiring.cafe covers Workday aggregation.
   - If hiring.cafe coverage turns out poor, reconsider.

5. **EU-fit gate architecture** — where in pipeline?
   - Option A: inline in scan.mjs per-source (complex)
   - Option B: post-scan enrichment step (simpler, extra job)
   - Option C: LLM gate in skill mode (expensive, most accurate)
   - Recommend B for MVP, C for noisy sources only.

6. **GitHub discovery cadence** — weekly cron, on-demand skill, or manual trigger?

7. **Should `remote-portals.yml` replace or complement `portals.yml`?**
   - Currently recommending COMPLEMENT (two files, dedup at scan time).
   - Alternative: single `portals.yml` with `profile: salzburg|remote|both` tag per entry.

---

## Done log

- [x] **2026-04-20 Session 1** — Probed 21 endpoints. Dead: justjoin.it/api/offers, Indeed RSS. Alive: Arbeitnow, Himalayas, Arbeitsagentur (sample returned 97 DE jobs for Softwareentwickler+Homeoffice), Remotive, YC, Mastodon, HN Algolia, WWR RSS, Jobicy RSS, Reddit, LinkedIn guest, Xing public. See [03-probes.md#session-1--2026-04-20](03-probes.md#session-1--2026-04-20).
- [x] **2026-04-20** — Created research folder structure (7 files).
- [x] **2026-04-20** — Cross-file agreement map + confidence scoring: [04-evaluation.md](04-evaluation.md).
- [x] **2026-04-20 Session 2** — Phase 0.2 (RSS), 0.3 (SSR HTML), 0.5 (ATS slugs), LinkedIn typeahead geoId verification. 33 more probes. See [03-probes.md#session-2--2026-04-20-continued](03-probes.md#session-2--2026-04-20-continued). Key finds:
  - **Adzuna free tier confirmed open** — Tier A promotion.
  - **hiring.cafe demoted** — duplicates GH/Lever/Ashby we already hit.
  - **8 EU Greenhouse slugs live**: n26, commercetools, contentful, getyourguide, parloa, gostudent, traderepublic, pleo.
  - **14 slugs 404** — need alternate slug discovery for mews/klarna/wise/bolt/mollie/depop/deliveryhero/tiermobility/taxfix/teamviewer/tourradar/alan/swile/payfit.
  - **Ashby live**: posthog, supabase, ramp.
  - **Lever live**: qonto (1.3MB).
  - **LinkedIn DACH geoId 91000006** discovered (bonus).
  - **13 live SSR HTML sources** confirmed for Tier C (theprotocol.it, bulldogjob.com, jobgether, 4dayweek, WeAreDevelopers, EuroTechJobs, Dou.ua, JustRemote, Landing.jobs, Berlin Startup Jobs, The Hub, Remote Rocketship, SwissDevJobs).
- [x] **2026-04-20 Session 3** — Phase 0.6 (slug variants) + 0.7 (URL fixes). See [03-probes.md#session-3--2026-04-20-slug--url-discovery](03-probes.md#session-3--2026-04-20-slug--url-discovery). Key finds:
  - **Mews** → `mewssystems` (48KB live).
  - **Klarna** → NOT on Greenhouse, **on Ashby** `klarna` (6KB live).
  - **Linear** (retest) + **Mistral** (3.7MB!) + **Databricks** + **Datadog** + **Doctolib FR** (191KB) all live.
  - **14 EU scaleups NOT on any of GH/Ashby/Lever** (wise, bolt, mollie, depop, deliveryhero, tiermobility, taxfix, teamviewer, tourradar, alan, swile, payfit, bitmovin, tractive, anyline). Must cover via aggregator APIs (Adzuna/Himalayas/Arbeitsagentur) or hiring.cafe UI.
  - **URL fixes**: hnhiring uses `/technologies/dotnet` (not `/.net`); jobs.heise.de root works; relocate.me root works; ai-jobs.net root works (feed URL needs DevTools verify).
  - **SPA targets for DevTools capture**: GermanTechJobs.de (4KB HTML = SPA), SwissDevJobs.ch (4KB SPA), dotnetjobs.dev (28KB likely Next.js).
  - **Drop**: nextleveljobs.eu (persistent timeout), dotnetjobs.co (dead), Europe Remotely (403).

## New todos added during Session 2

### [ ] 0.6 — Find correct slugs for failed Greenhouse companies

The following probed 404 — likely different slug, custom ATS, or migrated. Research each:

- [ ] **Mews** — try `mewssystems`, `mews-systems`, search their careers page for "Powered by Greenhouse"
- [ ] **Klarna** — try `klarnagroup`, `klarna-group`; they may use Teamtailor now
- [ ] **Wise** — try `wiseplc`, `wise-payments`; may use Workday
- [ ] **Bolt** — try `bolteu`, `bolt-technology` (not Bolt US ride-share)
- [ ] **Mollie** — try `molliepayments`
- [ ] **Depop** — may be `depop` on Lever, not Greenhouse
- [ ] **Delivery Hero** — try `delivery-hero` or DACH subsidiary slug
- [ ] **TIER Mobility** — try `tiermobility`, `tier-mobility`, `dott-mobility` (merged)
- [ ] **Taxfix** — custom ATS likely
- [ ] **TeamViewer** — likely Workday
- [ ] **TourRadar** — custom AT-hosted
- [ ] **Alan** — try `alanfr`, `alaninsurance`
- [ ] **Swile** — try `swile-fr`
- [ ] **PayFit** — try `payfit-fr`, `payfitsa`
- [ ] **Bitmovin** — retry (timeout); try `bitmovin-inc`
- [ ] **Tractive** — retry; try `tractive-at`
- [ ] **Anyline** — retry; try `anyline-at`

**Method**: visit each company's careers page, look for "Powered by Greenhouse/Ashby/Lever" footer or inspect network tab for ATS API call. Document in [03-probes.md](03-probes.md) under new section.

**Acceptance**: each company either resolved to correct slug or marked "custom ATS — skip".

### [ ] 0.7 — Fix probed wrong-URL 404s

- [ ] **GermanTechJobs.de** — visit root `germantechjobs.de`, find correct `jobs` path
- [ ] **Relocate.me** — visit root, find jobs path
- [ ] **hnhiring.com** — visit root, find tag path (may be `/technology/.net` or `/tags/dotnet`)
- [ ] **nextleveljobs.eu** — retry, use real browser if still timeout
- [ ] **dotnetjobs.co** — retry, confirm alive or dead

### [ ] 0.8 — Capture JJIT Next.js hydration via Chrome DevTools MCP

`curl grep buildId` returned empty. Structure must have changed.

- [ ] `navigate_page` to `https://justjoin.it/job-offers/remote/net`
- [ ] `evaluate_script` — `document.getElementById('__NEXT_DATA__')?.textContent` — inspect shape
- [ ] If `__NEXT_DATA__` absent → try `window.__INITIAL_STATE__` or similar
- [ ] Look for hydration blob in `<script>` tags via DOM walk
- [ ] Document finding in [03-probes.md](03-probes.md) + update [02-source-catalog.md](02-source-catalog.md#e) entry

### [ ] 0.9 — Register Adzuna + Jooble keys

- [ ] Register Adzuna: go to `developer.adzuna.com`, get `app_id` + `app_key` — store in `.env`
- [ ] Register Jooble: submit partner form at `jooble.org/api/about` — note approval date
- [ ] Document approval status, rate limits actual vs advertised, in [03-probes.md](03-probes.md)

### [ ] 0.10 — Reset Tier A list with corrected slugs

- [ ] Once 0.6 + 0.7 done, produce final `companies:` list for `remote-portals.yml`
- [ ] Target ≥30 verified-live EU scaleup slugs on GH/Ashby/Lever

---

## How to resume

If you are a fresh agent:

1. Read [README](README.md) → [00-goal.md](00-goal.md) → [01-context.md](01-context.md)
2. Scan [03-probes.md](03-probes.md) for current endpoint status (re-probe if >30 days old)
3. Scan this file's "Current phase" + first open `[ ]` todo in that phase
4. Execute the todo — log results to [03-probes.md](03-probes.md), update this file, append to Done log
5. Don't skip phases — dependencies matter

**Do NOT** regenerate or re-research sources already in the **Definite drops** section of [04-evaluation.md](04-evaluation.md) without new counter-evidence.
