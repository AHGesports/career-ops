# AI-replacement evidence

Verified during round 03 (pushback) and extended in round 10. Prior rounds cited many numbers that didn't survive scrutiny. This file has the verified versions + reasoning.

See: [README](../README.md) · [methodology](../methodology.md) · [final](../final.md) · [round 10](../rounds/round-10-ai-replacement-deep.md)

---

## Core thesis (verified)

1. **Junior developer hiring (0–2 YOE) has contracted** in the US: ~20% decline for 22–25yo in SWE cohort through July 2025 [HIGH]. Stanford Canaries **v3 (Nov 13, 2025)** refines: the statistically attributable effect begins in **2024**, not 2022 — earlier declines were partly other factors. [HIGH, [Stanford v3 PDF](https://digitaleconomy.stanford.edu/wp-content/uploads/2025/11/CanariesintheCoalMine_Nov25.pdf)]
2. **Mid-level developers (4 YOE+) fluent with AI tools have INCREASED employment share.** Pragmatic Engineer Q1 2026: companies consolidating from "a backend + frontend + iOS + Android + QA + web" team to **"2–3 full-stacks"** — reduces total headcount but concentrates remaining work on mid-senior AI-fluent ICs [HIGH, [Pragmatic Engineer 2026](https://newsletter.pragmaticengineer.com/p/the-impact-of-ai-on-software-engineers-2026)].
3. **AI-attributed layoffs: denominator matters.** Challenger Gray (cross-sector) 2025 = 5% full-year; 2026 YTD ~13%. Tom's Hardware / Vucense (tech-sector-only) Q1 2026 = **~48% of 80K tech cuts** AI-attributed. Both true — different denominators. [HIGH, [Tom's Hardware](https://www.tomshardware.com/tech-industry/tech-industry-lays-off-nearly-80-000-employees-in-the-first-quarter-of-2026-almost-50-percent-of-affected-positions-cut-due-to-ai)]
4. **DACH mid-level devs are NOT in layoff crisis.** They're in raise-freeze. Softwareentwickler/in remains on 2026 Mangelberufe list. Risk = stagnation [HIGH, AMS / WIFI].
5. **Task automation by Copilot/Cursor is real and concentrated in UI/CRUD/scaffolding.** **New 2025 labor-market confirmation:** frontend SWE postings **−10% YoY through mid-2025** — the biggest declining sub-role [HIGH, [Stack Overflow blog](https://stackoverflow.blog/2025/12/26/ai-vs-gen-z/)].
6. **NEW — Experienced developers are NOT uniformly sped up by AI on mature codebases.** METR RCT (Jul 2025): **AI slows experienced OSS devs by 19%** on large complex codebases they already know, even though they perceive a 20% speedup. Follow-up experiment (Feb 2026) has self-selection bias caveats [HIGH, [arXiv 2507.09089](https://arxiv.org/abs/2507.09089), [METR Feb 2026 update](https://metr.org/blog/2026-02-24-uplift-update/)].
7. **NEW — AI Engineer is the #1 fastest-growing LinkedIn title in US (+143% YoY postings, +1000% for "agentic AI" 2023→2024).** LLM specialists command $220–280K. Generic AI engineer title is commoditizing; specialization (eval / observability / agent platform) matters [HIGH, [Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/)].
8. **NEW — Platform / SRE / Cloud Infra is the single fastest-growing durable SWE sub-role in 2026.** NVIDIA SRE comp: median $350K, IC4 ~$331K. FinOps-literate platform engineers close offers fastest per KORE1 2026 talent data [HIGH, [KORE1 2026](https://www.kore1.com/tech-layoffs-2026/)].
9. **NEW — SRE work is augmented, not replaced, by AI tools.** Surfing Complexity (Feb 2026) + Traversal independently: AI SRE tools (Rootly, incident.io, Resolve.ai) assist triage but don't replace coordination-under-uncertainty, mutation authority, or institutional memory [HIGH, [Surfing Complexity](https://surfingcomplexity.blog/2026/02/14/lots-of-ai-sre-no-ai-incident-management/)].

## Primary sources (trust tier 1)

### Stanford "Canaries in the Coal Mine" (Brynjolfsson et al., Aug 2025)

- [Paper PDF](https://digitaleconomy.stanford.edu/wp-content/uploads/2025/08/Canaries_BrynjolfssonChandarChen.pdf)
- [Fortune summary](https://fortune.com/2025/08/26/stanford-ai-entry-level-jobs-gen-z-erik-brynjolfsson/)
- Data: ADP payroll, US-only
- Finding: **-20% employment for 22–25yo software developers** through July 2025
- Finding: **22–40yo in same firms grew or stayed flat**
- **What it does NOT say:** nothing about Europe, nothing about 4+ YOE cohort, nothing about DACH specifically
- **Candidate implication:** 22yo with 4 YOE is in the cohort that grew, not the cohort that shrank

### Anthropic Economic Index (Jan 2026 + Mar 2026)

- [Anthropic research: impact on software development](https://www.anthropic.com/research/impact-software-development)
- [Jan 2026 report](https://www.anthropic.com/research/anthropic-economic-index-january-2026-report)
- [Mar 2026 report](https://www.anthropic.com/research/economic-index-march-2026-report)
- Data: Claude.ai + Claude Code usage, coding = ~35% of Claude.ai traffic
- Finding: **79% of Claude Code sessions = full automation** (vs 49% on Claude.ai general)
- Finding: **Augmentation 52% / Automation 45%** across all Claude usage (closer to balanced)
- Finding: Most-automated categories = **UI/UX work, JavaScript/HTML tasks, simple app scaffolding**
- **What it does NOT say:** "79% of dev work is automatable" (widely misread). The 79% is the share of *power-user delegation interactions* in an agentic tool, not labor-market automation rate.
- **Anthropic's quiet admission:** a separate skill-formation paper shows AI coding causes **17% skill-mastery reduction** in new hires ([InfoQ](https://www.infoq.com/news/2026/02/ai-coding-skill-formation/)). Cohort of AI-dependent juniors arrive unable to do the senior work agents can't do.

### Challenger Gray layoff reports

- [March 2025 report](https://www.challengergray.com/blog/challenger-report-march-cuts-rise-25-from-february-ai-leads-reasons/)
- [2025 year-end report](https://www.challengergray.com/blog/2025-year-end-challenger-report-highest-q4-layoffs-since-2008-lowest-ytd-hiring-since-2010/)
- Finding: 54,836 layoffs attributed to AI in 2025 = **5% of total cuts**
- Finding: March 2025 peak: 15,341 cuts = 25% of that month's total
- Finding: 2026 YTD AI-attributed ranks 5th at ~13%
- **Implication:** AI is a real but minority driver of layoffs. It is not "48% of Q1 2026 cuts" (which prior round 02 incorrectly claimed).

### AMS / Statistik Austria

- [Statistik Austria unemployment](https://www.statistik.at/statistiken/arbeitsmarkt/arbeitslosigkeit/arbeitslose-arbeitssuchende)
- [WIFI Mangelberufe 2026](https://www.wifi.at/blog/detail/1080-mangelberufe-oesterreich)
- AT national unemployment Aug 2025: 7.0%
- Salzburg: ~4–5%
- Vienna: 11.7%
- Tyrol: 3.4%
- "Softwareentwickler/in" on 2026 Mangelberufe list (shortage occupation)
- **Implication:** DACH software engineers are STILL a shortage occupation in 2026. No crisis.

## Task-level automation map (triangulated, updated round 10)

Sources: Anthropic Economic Index (Jan + Mar 2026) + Pragmatic Engineer 2025–2026 + Addy Osmani + Simon Willison + JetBrains 2025 + METR 2025 + Surfing Complexity 2026.

| Task class | Status 2026 | 2028 | 2031 |
|---|---|---|---|
| CRUD endpoints, forms, simple UI | **Fully automated — labor impact visible** (frontend −10% YoY) | Agent-owned | Commodity |
| Basic refactors, test scaffolding, docs | Automated | Fully automated | Agent-owned |
| Framework migration, language translation | Mostly automated | Fully automated | Agent-owned |
| **Prototyping / greenfield scaffolds** (NEW round 10) | Devalued — v0, Lovable, Artifacts ship production-grade | Fully automated | Commodity |
| Debugging weird production bugs in mature/legacy | **Augmented — but METR: −19% speed** on mature codebases | Augmented | Still human-led |
| Ambiguous product-to-architecture translation | Augmented | Augmented | Still human-led |
| Distributed systems design, data-intensive design | Augmented | Augmented | Still human-led |
| **Agent design, tool design, eval design (meta-layer)** | **Human-dominant / scarce** | **Still scarce** | Frontier |
| Security architecture, compliance-gated work | Augmented | Augmented | Still human-led (liability) |
| Physical-world / embedded / hard-realtime | Barely touched | Slightly augmented | Still human-led |
| **On-call / incident commander / mutation authority** | **Augmented NOT replaced** (Surfing Complexity 2026) | Augmented | Still human-led |
| **FinOps / infra cost optimization** (NEW round 10) | Fastest-closing platform-eng sub-niche | Growing | Growing |
| **AI platform / GPU cluster ops** (NEW round 10) | NVIDIA/Modal/Baseten hiring aggressively | Growing | Growing |

## What durable moats look like

From Pragmatic Engineer + Addy Osmani + Simon Willison 2026 consensus:

- **"Language polyglot" edge is dying.** Being "a React dev" or "a .NET dev" is worth less every quarter.
- **Staff-level traits scarce:** product sense, ambiguity-handling, system design, reviewing agent output, "the human 30%".
- **Senior + AI-fluent** is the one bucket whose comp is still climbing.
- **Domain expertise** (fintech, healthtech, automotive) beats language expertise long-term.

## Rankings of non-fungible skills by (comp premium × durability)

| Non-fungible skill | Premium | Durability | Ramp | Rank |
|---|---|---|---|---|
| Distributed systems IC depth | 30–50% | 5yr+ | 3–5 yr | 1 |
| Compliance-gated security | 25–40% | 5yr+ | 1–2 yr | 2 |
| Production K8s / on-call | 20–35% | 5yr+ | 1–2 yr | 3 |
| Domain fintech/medtech | 20–40% | 10yr+ | 1–3 yr | 4 |
| Agent/LLM eval design | 25–50% | 3–5yr (volatile) | 6–12 mo | 5 |
| Embedded/realtime | 15–30% | 10yr+ | 2–4 yr | 6 |

## Claims INVALIDATED from prior rounds

1. **"79% Claude Code = dev jobs automatable"** — misreading of the Anthropic metric.
2. **"48% of Q1 2026 layoffs AI-attributed"** — Challenger actual is 5% full-year 2025, ~13% 2026 YTD.
3. **"Entry-level dev hiring down 25%"** — Stanford says -20%, and only for 22–25yo 0–2 YOE US-only. 4 YOE cohort grew.
4. **"Remote-US contractor = clean $150K upside"** — net after AT tax is ~€70–85K.

## Open research

- P2.1 — verify full Anthropic Economic Index methodology (sample, inclusion criteria)
- P2.4 — find DACH-specific AI-impact data (AMS, BA, EU Labour Force Survey)
- P10.1 — quantify AT/DE platform-eng hiring delta 2024→2026 (karriere.at + stepstone.de historical data)
- P10.2 — track METR 2025–2026 larger-N follow-up once self-selection bias is resolved
- P10.3 — watch for NIS2 Q4 2026 deadline effect on DACH security-eng hiring
- P10.4 — monitor whether generic "AI Engineer" title commoditizes vs splits into LLM-eval / agent-platform / MLOps by late 2026
