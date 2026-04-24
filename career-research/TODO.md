# Open research tasks

See: [README.md](README.md) · [methodology.md](methodology.md) · [final.md](final.md)

---

## How to use this file

Pick the highest-priority open task. Do the research per [methodology.md](methodology.md). Create `rounds/round-NN-<slug>.md`. Update affected files. Remove completed item. Add any new items surfaced.

---

## Priority 0 — critical gaps (do first)

- [x] ~~P0.1 — Audit Elyt commercial traction.~~ **COMPLETED in round 06.** Verdict (c) demo/portfolio piece, HIGH confidence. See [data/elyt-audit.md](data/elyt-audit.md).
- [x] ~~P0.2 — Pull real JDs per top option.~~ **COMPLETED in round 06.** 30+ JDs across 5 options. Key finding: Porsche Informatik Senior DevOps is top accessible target. See [data/jd-samples.md](data/jd-samples.md).
- [x] ~~P0.3 — Salary distributions P25/P50/P75.~~ **COMPLETED in round 06.** Full tables at [data/salary-bands.md](data/salary-bands.md). Senior Platform AT P50 revised €65K → €78.75K.

## Priority 0 — NEW (post round 06)

- [ ] **P0.4 — Elyt 60-day OSS sprint OR commit to E + D-Microsoft.** Decision by 2026-06-20. OSS sprint is REQUIRED for D4-Python ceiling but NOT for D-Microsoft (round 09).
- [ ] **P0.5 — Candidate CV rewrite: TWO variants (round 09).** (a) .NET + Azure AI lead — for DACH-enterprise AI targets (Post AG, RBI, Siemens, Porsche Informatik). (b) Python + Elyt lead — for remote-EU/US AI targets (Parloa, Langfuse, Browserbase). See [options/D-microsoft.md](options/D-microsoft.md) and [options/D-deepdive.md](options/D-deepdive.md).
- [ ] **P0.6 — Apply to Porsche Informatik Senior DevOps Platform Engineer** ([karriere.at/jobs/6788786](https://www.karriere.at/jobs/6788786)) — Salzburg-local, 70% stack overlap, top Option E target.
- [ ] **P0.7 — Evaluate Elyt repositioning.** Anti-detect landing page conflicts with enterprise AI framing. Decide: reposition, or stop linking.

## Priority 0 — NEW (post round 09)

- [ ] **P0.8 — Apply to Post AG Senior AI Engineer** ([karriere.at/jobs/7619955](https://www.karriere.at/jobs/7619955)) within 30 days with .NET+Azure-AI CV variant. €70K+ stated. Highest-fit AI role currently open for candidate.
- [ ] **P0.9 — Add Microsoft Agent Framework demo** to GitHub (2–3 weekends). Build one non-trivial agent using Microsoft Agent Framework + Azure OpenAI + MCP. Publish. This is the single CV upgrade most leveraged for D-Microsoft positioning.
- [~] **P0.10 — Volume-verify D-Microsoft addressable pool.** PARTIALLY COMPLETE (round 11). Found Netural, Techem, A1, ZETA, Celonis. Pool tightened to 10–20 AT / 30–50 DACH. Still short of 15-JD target — pull 5+ from DE/CH LinkedIn to close.
- [ ] **P0.11 — Check Porsche Informatik AI roadmap.** Candidate's Salzburg-local employer — do they have or plan D-Microsoft-flavored roles? Direct reach-out or LinkedIn research.

## Priority 0 — NEW (post round 11)

- [ ] **P0.12 — Port Elyt to Microsoft Agent Framework v1.0** (NOT Semantic Kernel — deprecated March 2026). 2–3 weekends. Semantic Kernel tutorials are outdated; any demo built on SK is stale on day 1. Use NuGet: `Microsoft.Agents.AI`, `Microsoft.Agents.AI.Foundry`, `Microsoft.Extensions.AI`. Start with SteveSandersonMS/dotnet-ai-workshop.
- [ ] **P0.13 — Add RAG + eval harness to Elyt** before first AI engineer application. RAG = #1 required skill (35.9% of AI JDs). Eval absence = red flag (YC startups explicit). Use Azure AI Search (RAG) + `Microsoft.Extensions.AI.Evaluation` (eval). This is the single gap most likely to cost an offer.
- [ ] **P0.14 — Apply to AI-103 beta exam** (Azure AI Apps & Agent Developer). Beta open April 21, 2026; GA June 2026. Best cert path post AI-102 retirement (June 30, 2026). Beta typically discounted or free. Do NOT take AI-102 (10 weeks for a retiring exam that covers 40% irrelevant material).
- [ ] **P0.15 — Prepare Elyt deep-dive narrative.** Frame 5 key architectural decisions with "why X not Y" reasoning. Practice going 3 levels deep on: (a) provider abstraction, (b) 3-tier split, (c) cross-language type generation, (d) parallel execution model, (e) eval design (once added). This is the primary interview round for senior AI roles — more important than LeetCode.
- [ ] **P0.16 — Apply to Netural GmbH Agentic AI Engineer** ([karriere.at/10015040](https://www.karriere.at/jobs/10015040)) and **A1 Telekom AI Expert** (Azure OpenAI + Foundry) as D-Microsoft calibration roles. Both currently open. Both match D-Microsoft profile. Apply within 30 days alongside Post AG (P0.8).

## Priority 1 — NEW (post round 10)

- [ ] **P10.1 — AT/DE platform-eng hiring delta 2024→2026.** Round 10 claimed Platform/SRE is fastest-growing durable. Verify AT-specifically with karriere.at / stepstone.de YoY job counts for DevOps, Platform Engineer, SRE, Cloud Engineer.
- [ ] **P10.2 — METR larger-N follow-up.** METR RCT (AI −19% speed on mature codebases) had self-selection bias flagged Feb 2026. Check if Q2/Q3 2026 has larger cohort replication.
- [ ] **P10.3 — NIS2 Q4 2026 deadline effect on DACH security hiring.** October 2026 deadline arrived 6 months ago — did the predicted hiring wave materialize? If yes, option F score rises.
- [ ] **P10.4 — Does "AI Engineer" title split by 2027?** Generic AI Engineer commoditizing per round 10. Track if new titles emerge (LLM Specialist, Eval Engineer, Agent Platform Engineer, RAG Engineer). Affects D / D-Microsoft positioning.

## Priority 1 — per-option deep dives (expand each)

- [ ] **P1.1 — Option M deep dive** ([options/M-platform-plus-agent.md](options/M-platform-plus-agent.md)): exact employer list with job URLs, interview format (system design? live coding? take-home?), real comp bands, 12-month ramp curriculum week-by-week.
- [ ] **P1.2 — Option E deep dive** ([options/E-platform-sre.md](options/E-platform-sre.md)): same.
- [ ] **P1.3 — Option D deep dive** ([options/D-applied-ai.md](options/D-applied-ai.md)): same.
- [ ] **P1.4 — Option F deep dive** ([options/F-security.md](options/F-security.md)): cert path realistic costs (OSCP €1549, CISSP €749 + 5 YOE req), AT NIS2-triggered hiring wave by employer, realistic comp at entry-security vs senior.
- [ ] **P1.5 — Option J deep dive** ([options/J-fintech.md](options/J-fintech.md)): Bitpanda hiring process, realistic domain-ramp timeline, DORA-specific hiring at AT banks.
- [ ] **P1.6 — Options A, B, C, G, H, I, K, L, N**: stub files exist with final.md content — extend only if a round surfaces new data.

## Priority 2 — AI-replacement evidence hardening

- [ ] **P2.1 — Verify Anthropic Economic Index claim set.** Prior rounds cited the Jan 2026 and Mar 2026 reports. Pull the actual PDFs. Extract verbatim: % automation by task category, sample size, methodology, caveats. Write into [data/ai-replacement.md](data/ai-replacement.md).
- [ ] **P2.2 — Verify Stanford "Canaries in the Coal Mine" paper.** Brynjolfsson et al., Aug 2025. ADP payroll data. Extract: sample construction, cohort definitions (ages 22–25 vs 22–40), occupational filter. Is the -20% claim robust?
- [ ] **P2.3 — Pragmatic Engineer empirical updates Q2 2026.** Subscription-gated but summary articles often freely available. Pull latest state-of-the-market.
- [ ] **P2.4 — Find evidence FOR/AGAINST mid-level dev replacement in DACH specifically.** Most AI-replacement narratives are US. AMS data, Statistik Austria, German Bundesagentur für Arbeit may have sector-specific metrics.

## Priority 3 — regulatory environment

- [ ] **P3.1 — NIS2 implementation status in Austria.** NISG 2024 transposition status, NIS-Behörde guidance, which sectors are "essential" vs "important", compliance deadline specifics (October 2026 vs rolling).
- [ ] **P3.2 — DORA coverage.** Which AT financial entities are covered, hiring implications in 2026.
- [ ] **P3.3 — EU AI Act phased enforcement.** GPAI obligations Feb 2025, high-risk systems Aug 2026. Hiring impact on applied-AI roles (option D).

## Priority 4 — interview preparation

- [~] **P4.1 — Typical interview format per option.** SUBSTANTIALLY COMPLETE for D/D-Microsoft (round 11). See [rounds/round-11-hiring-reality.md](rounds/round-11-hiring-reality.md) §2 — full process breakdown: 4 rounds median, take-home 33% of companies, RAG 40%+ of take-homes, Elyt deep-dive framing, defense walkthrough prep. Still missing: E (platform-specific) and F (security-specific) process detail.
- [ ] **P4.2 — Negotiation realism per option.** Typical signing-bonus / RSU / equity norms at target employers. Anchor points.

## Priority 5 — hedging strategies

- [ ] **P5.1 — Economic-downturn resilience per option.** If AI funding contracts in 2027, which options (M, D, K) lose most? Which (E, F, J) gain?
- [ ] **P5.2 — Personal-runway modeling.** If candidate pivots and takes 3-month unpaid search, what's the AT unemployment-insurance replacement rate? Is the Austrian safety net a factor?

## Priority 6 — geographic sub-analysis

- [ ] **P6.1 — Vienna vs Munich vs Zurich vs remote-EU tradeoffs.** Exact cost-of-living-adjusted net comp. Tax comparison. Social-insurance comparison.
- [ ] **P6.2 — Remote-US contractor setup.** Exact AT-side registration, accountant cost, tax rate by income bracket, VAT reverse-charge mechanics.

## Priority 7 — alternative frames

- [ ] **P7.1 — Evaluate "stay Axess, negotiate up" as an option.** Current CV has ~2.75 years Axess tenure. Is a €80K internal promotion realistic? What's the data on internal vs external raises in AT?
- [ ] **P7.2 — Evaluate a sabbatical-to-launch-Elyt option.** If Elyt has hidden traction, should candidate go full-time on it instead of seeking employment? What revenue level changes this calculation?

---

## Completed rounds

- [x] Round 01 — [Initial career strategy research](rounds/round-01-initial.md) — high-level market scan, yielded 3-track recommendation
- [x] Round 02 — [Path comparison A–E + AI-replacement](rounds/round-02-path-comparison.md) — introduced D4 Applied AI + E1/E2 subpaths
- [x] Round 03 — [Pushback + mid-level grounding](rounds/round-03-grounded.md) — invalidated 5 claims from prior rounds; introduced KV-IT floor data
- [x] Round 04 — [Fungibility reframe](rounds/round-04-fungibility.md) — user-driven pivot: langs are fungible with AI assist
- [x] Round 05 — [Niche × domain × role](rounds/round-05-niche-decision.md) — 10-niche scorecard; surfaced M (Platform + Agent/AI stacked) as top
- [x] Round 06 — [Data hardening + Elyt audit](rounds/round-06-deep.md) — Elyt verdict (c) demo/portfolio; E promoted to #1 primary; M becomes conditional upgrade
- [x] Round 07 — [Knowledge transfer dimension](rounds/round-07-knowledge-transfer.md) — added 7th dimension; D/H/M rose
- [x] Round 08 — [No-degree accessibility dimension](rounds/round-08-degree-gate.md) — added 8th dimension; K rose; confirmed ease-of-getting-job is composite-captured
- [x] Round 09 — [.NET + AI DACH niche research](rounds/round-09-dotnet-ai.md) — invalidated round 06 Python-only bias; split Option D into D4-Python + D-Microsoft; D-Microsoft identified as best AI-execution path for candidate
- [x] Round 10 — [AI-replacement deep evidence](rounds/round-10-ai-replacement-deep.md) — primary rec HOLDS. New data: Stanford v3 (junior effect from 2024), METR RCT (−19% speed experienced devs mature code), frontend −10% YoY (biggest declining sub-role), Platform/SRE fastest-growing durable, AI Engineer +143% YoY LinkedIn. E CV-framing qualitative shift: lead FinOps + K8s + Terraform + AI-workload-ops, not generic platform.
- [x] Round 11 — [Hiring reality: what actually gets you hired as AI engineer](rounds/round-11-hiring-reality.md) — no score changes. Python = 82.5% AI JDs; RAG = #1 skill; eval = #1 differentiator. SK deprecated → Agent Framework v1.0. AI-102 retiring → AI-103/AI-200. 9 AT Python AI JDs confirmed. Interview process dissected (4 rounds, 33% take-home, RAG 40% of take-homes). Elyt framing guide produced. New P0.12–P0.16 added.

---

## Priority-scoring convention

- **P0**: blocks primary recommendation confidence — must do first.
- **P1**: deepens option evaluation — order does not matter among P1.
- **P2–P4**: supporting research — pick by interest / time budget.
- **P5–P7**: exploratory — only if P0–P4 done.

## When to stop

Research stops when:
- All P0 items are closed, AND
- At least 3 of top-5 options (M, E, D, F, J) have P1 deep-dives complete, AND
- The final.md primary recommendation has HIGH confidence and no outstanding P0/P1 caveats.
