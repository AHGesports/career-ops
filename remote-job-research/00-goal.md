# 00 — Goal

See [README](README.md) for index.

## Primary objective

Produce **`remote-portals.yml`** in the career-ops root — a sister configuration file to the existing `portals.yml`.

- **`portals.yml` (existing)**: Salzburg / DACH-local job sources. Keeps user's physical-location search.
- **`remote-portals.yml` (to build)**: EU-remote job sources. Runs when user wants to expand beyond Salzburg into remote-first roles.

Both files feed the same scanner (`scan.mjs`) and use the same filter / dedup / tracker pipeline.

## Why separate files (not one)

- User-intent split: Salzburg search vs EU-remote search have **different filter criteria** (location=Salzburg AND stack vs remote=true AND EU-timezone AND stack) and **different rate-limit tolerances** (high for Salzburg daily, lower for EU daily × 10 countries).
- Scanner can run each on independent schedule (`node scan.mjs --portals portals.yml` vs `node scan.mjs --portals remote-portals.yml`).
- Source lists barely overlap — AMS/karriere.at/devjobs.at are AT-specific; JJIT/Arbeitsagentur/Himalayas are EU-remote targeted.

## User profile (driver of source selection)

- **Location**: Zell am See / Salzburg, Austria. Native AT residential IP available.
- **Stack**: .NET / C# / Angular / TypeScript / Node.js / Python / FastAPI / ASP.NET.
- **Level**: Mid / Senior (not Junior, not Staff/Principal/Lead — see `portals.yml` `title_filter.negative`).
- **Work model sought**: full remote or EU-timezone remote. OK with AT on-site too but that's covered by `portals.yml`.
- **Language**: English + German. Some EU non-English markets tolerable (e.g. Polish B2B in English JDs).
- **Contract model**: full-time employee OR freelance B2B (Austrian contractor-friendly EU markets).

Full details: see [01-context.md#user-profile](01-context.md#user-profile).

## Success criteria

**Quantitative:**
- `remote-portals.yml` covers ≥10 live public-API sources (verified live within last 30 days — see [03-probes.md](03-probes.md)).
- `remote-portals.yml` lists ≥40 EU scaleup companies using GH/Ashby/Lever ATS for zero-token scanning.
- One daily scan pass completes in <15 min with <10 API keys needed (free tiers only).
- Zero tokens consumed per scan for Tier A sources (REST/RSS parsers in `scan.mjs`).
- EU-fit precision ≥80% — <20% of surfaced jobs should be US-only despite "remote" label.

**Qualitative:**
- Research is reproducible: another agent can verify picks via [03-probes.md](03-probes.md).
- Drops are evidence-backed: every source not included has a reason logged in [04-evaluation.md](04-evaluation.md).
- No Cloudflare-bypass tooling required for Tier A (Chrome DevTools MCP accepted for Tier B only).

## Scope — IN

- EU-located remote jobs OR EU-timezone remote jobs worldwide (matching user's CET+1)
- .NET / C# / Angular / TypeScript / Node / Python fullstack roles
- Mid/Senior level
- Full-time employee OR B2B freelance
- Sources accessible via: public JSON/XML REST, RSS, SSR HTML scrape, one-time Chrome DevTools MCP capture, or Google `site:` queries
- Both English and German job descriptions

## Scope — OUT

- **Any source requiring login / authenticated session** — Chrome DevTools MCP cannot sustain auth state across scans. Hard rule.
  - LinkedIn authenticated SPA, Xing authenticated, Wellfound, YC Work at a Startup, Honeypot, MoBerries, X Pro, Slack communities, Discord servers, Gmail-based email alerts (LinkedIn/Xing Saved Searches), Pragmatic Engineer Jobs Digest (email)
  - Only **guest / public** endpoints of these platforms are in scope (e.g. LinkedIn `/jobs-guest/...`, Xing public `/jobs/search`)
- Sources requiring paid solvers (2Captcha/CapSolver) or residential proxy services — cost + ops burden
- Sources requiring paid tier to access (FlexJobs, Virtual Vocations, Remote Leaf, X Pro) — not free
- Discord / Slack community scraping — burner accounts + per-workspace auth overhead (not worth maintenance)
- US-only or non-EU-accessible remote boards (Dice, ZipRecruiter, Monster)
- Salzburg-local / AT-only sources — that's `portals.yml` scope, not this file
- Sources known dead (Stack Overflow Jobs, GitHub Jobs, Hired, Triplebyte, Proxycurl)
- LLM-based resume-match services (Hired, Triplebyte successor attempts) — not discovery

## Constraints

**Technical:**
- `scan.mjs` currently parses only 3 ATS types (Greenhouse, Ashby, Lever JSON). See [01-context.md#scan-mjs-capabilities](01-context.md#scan-mjs-capabilities).
- Zero-token preference: Tier A sources must hit public JSON/XML/RSS — no LLM in the scan path.
- Chrome DevTools MCP available for hidden-API capture but only as one-time dev setup, not per-scan.
- Node.js + YAML + Playwright already in stack; no new runtime deps preferred.

**Usage:**
- Personal use only (single user). No redistribution, no resale.
- Three sources ask for attribution in ToS — RemoteOK, Jobicy, Remotive. Polite to include source link in report headers.

**Budget:**
- $0 / month preferred. Adzuna / Jooble free tiers acceptable. No paid scraping services.
- One-time time investment on DevTools captures acceptable (10 min per site).

**Time:**
- Phase 1 (MVP Tier A) target: 1 weekend, ~400 LoC scan.mjs extension + yml draft.
- Full roadmap target: 4 weekends (see [05-next-steps.md](05-next-steps.md)).

## Anti-goals (what NOT to build)

- Not a LinkedIn scraper with logged-in persistence. Use LinkedIn guest endpoint only.
- Not a universal job board aggregator. Targeted to user stack.
- Not a replacement for `portals.yml`. Both coexist.
- Not a real-time pipeline. Daily scan cadence matches user's application volume.
- Not an auto-apply tool. Career-ops ethical policy: never submit without user review.

## How to measure "done"

1. `remote-portals.yml` exists in career-ops root.
2. `node scan.mjs --portals remote-portals.yml --dry-run` runs without error and lists ≥50 unique jobs.
3. EU-fit gate catches ≥80% of US-only "remote" jobs (manual spot-check of 50 surfaced jobs).
4. 10 daily scans in a row produce <5% duplicate-company-role pairs (source-priority dedup works).
5. This research folder is consistent — another agent can pick up at [05-next-steps.md](05-next-steps.md) and continue.
