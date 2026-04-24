# Remote-job research — index

**Goal:** produce a `remote-portals.yml` for career-ops — sister file to the Salzburg-focused `portals.yml` — covering EU remote dev jobs for a .NET/Angular/Node/Python fullstack engineer based in Austria.

**Status:** Research phase. 3 probe sessions complete (84 endpoints tested). No code changes yet.

**Last updated:** 2026-04-20 session 3.

---

## TL;DR (v3 — Gmail-first strategy)

- **Goal**: every-6h automated scan + LLM-powered apply loop. Binding constraint = **token budget**, not source count.
- **PRIMARY STRATEGY — verified 2026-04-20**: user subscribes to 10-12 job-alert emails (LinkedIn Saved Search, Indeed, WWR, Remotive, RemoteOK, HNHiring via IFTTT, WTTJ, NFJ, JJIT + Xing + Arbeitsagentur Jobagent + karriere.at/devjobs.at after subscription test). Claude + Gmail MCP reads daily digests → parses URLs → WebFetches unauthenticated JD pages → feeds career-ops pipeline. **Most job pages are publicly viewable even though Apply requires login.** See [final.md](final.md) for full eval + Category A/B classification.
- **Dropped from Gmail list**: Pragmatic Engineer (DEAD Apr 2024), Jobgether/Wellfound/Hiring.cafe (marketing-nudge alerts without rich cards).
- **Why Gmail-first**: covers auth-gated sources we ruled out (LinkedIn/Xing/Wellfound — they email user without needing scraper auth); zero source-site scraping; pre-filtered by user's saved-search criteria; one auth (Gmail MCP) not N auths per site.
- **SUPPLEMENTARY** (fills gaps Gmail doesn't cover well):
  1. **Existing `portals.yml`** — unchanged
  2. **Arbeitsagentur REST** — DE small/mid employers
  3. **Himalayas API** — remote-first scaleups
- **Per-company ATS** — dropped from MVP, covered by Gmail alerts instead
- **DevTools captures** — largely redundant with Gmail (Gmail alerts cover LinkedIn/Xing/Indeed/WTTJ/JJIT/NFJ if user subscribes)
- **No salary filter** for remote jobs (per user)
- **Dropped permanently**: sources not yet supporting email alerts that also have no public API; Arbeitnow (dups Arbeitsagentur); Remotive-as-source (user subscribes to Remotive email instead); Careerjet/Jooble (dup Adzuna)
- **Research evidence**: 82 endpoints probed live ([03-probes.md](03-probes.md)). Key stale-data fixes: JustJoin.IT API dead Nov 2023, Indeed RSS dead, Proxycurl shut down Jul 2025.
- **Build effort**: ~11 hours for Phase 1 (2 user setup + 9 code). Phase 2 reactive.

---

## Files in reading order

| File | Purpose |
|------|---------|
| [00-goal.md](00-goal.md) | What we're building + success criteria + scope boundaries |
| [01-context.md](01-context.md) | career-ops architecture, scan.mjs capability, user profile, existing portals.yml |
| [02-source-catalog.md](02-source-catalog.md) | Every candidate source with URL, auth, method, estimated volume |
| [03-probes.md](03-probes.md) | Live endpoint verification log (date-stamped HTTP probes) |
| [04-evaluation.md](04-evaluation.md) | Ranked picks Tier A/B/C/D + definite drops with rationale |
| [05-next-steps.md](05-next-steps.md) | Actionable todos for continuation agent |
| **[final.md](final.md)** | **LOCKED PLAN** — what goes into `remote-portals.yml`, build phases, confidence, decisions resolved/open. Read this if you're executing. |

**Note on legal / ToS**: personal use only, not commercial. No separate legal file kept. Three sources ask for attribution in their ToS if we want to be polite — RemoteOK, Jobicy, Remotive — noted inline in [02-source-catalog.md](02-source-catalog.md). Otherwise unconcerned.

**Note on authentication**: Chrome DevTools MCP cannot sustain logged-in sessions across scans. **All login-gated sources are OUT of scope** (LinkedIn authenticated SPA, Xing authenticated, Wellfound, YC WaaS, Honeypot, MoBerries, X Pro, Slack, Discord, Gmail-based email alerts). Only public/guest endpoints of these platforms are usable.

---

## How another agent continues this work

1. **Read in order 00 → 06.** Numbered prefixes = natural reading order.
2. **Check [03-probes.md](03-probes.md) freshness.** Re-run probes if file is >30 days old — APIs drift.
3. **Pick up at [05-next-steps.md](05-next-steps.md).** Current phase and open questions are there.
4. **Don't re-research what's already decided.** [04-evaluation.md](04-evaluation.md) logs drops with evidence — respect them unless new data contradicts.
5. **Update probes.md on any new probe.** Append date-stamped entries; never delete history.

---

## Input research files (original source material)

Three research documents drove this work. Referenced by path (not copied — large):

- File 1: `C:\Users\a.hemati\Downloads\compass_artifact_wf-8318e449-e571-4c63-b4d6-95643b21e367_text_markdown.md` — Browser-agent playbook (LinkedIn, Indeed ccTLDs, Xing, Polish trio, Jobgether)
- File 2: `C:\Users\a.hemati\Downloads\compass_artifact_wf-ab8ef780-109a-452f-8110-67237431d72a_text_markdown.md` — API-clean sources (Himalayas, Arbeitnow, Adzuna, HN Algolia, ATS direct)
- File 3: `C:\Users\a.hemati\Downloads\compass_artifact_wf-fa3ea14a-658f-4935-a11c-4aa6f50626a0_text_markdown.md` — Browser-agent + hidden APIs (Xing GraphQL, Indeed GraphQL, Arbeitsagentur, JJIT)

If files move, re-fetch from Claude artifact system or re-research. [02-source-catalog.md](02-source-catalog.md) captures the distilled findings.

---

## Outputs when done

When this research concludes, deliverables are:

1. `/remote-portals.yml` — new sister file to `portals.yml`
2. Extension to `/scan.mjs` — new parser types for REST APIs + RSS
3. Possibly `/data/remote-portal-scraping-guide.md` — sibling to existing `data/portal-scraping-guide.md`

Nothing in this folder becomes production code. It's the paper trail.
