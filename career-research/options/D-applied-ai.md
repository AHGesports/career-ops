# Option D (D4-Python) — Applied AI / Agent Engineer (Python-native track)

> **ROUND 09 UPDATE (2026-04-20):** Option D split into two tracks. **This file covers D4-Python only.** For .NET + Azure AI track, see [D-microsoft.md](D-microsoft.md) — which is the better fit for THIS candidate's existing skill set. Round 06's "Python table-stakes, .NET absent" claim was sample-biased, not wrong-in-general.

**Status:** Track 1 (Python-native). Ceiling-component of M, gated by Elyt proof.
**R08 score:** 8.08/10 (after round 07 transfer dimension + round 08 degree dimension). R06 raw: 6.8–7.0.

> **ROUND 06 UPDATE:** Elyt audit ([../data/elyt-audit.md](../data/elyt-audit.md)) = verdict (c) demo piece, no public traction. D4-Python's high-ceiling case evaporates without public proof: candidate competes on raw skills at 4 YOE vs applicants with 5+ YOE (Parloa explicit filter per [../data/jd-samples.md](../data/jd-samples.md)).

See: [README](../README.md) · [options](../options.md) · [final](../final.md)

Related: [M-platform-plus-agent.md](M-platform-plus-agent.md) (stacked version) · [K-founding-engineer.md](K-founding-engineer.md) (adjacent upside)

---

## Description

Lead CV as "Applied AI / Agent Engineer — built Elyt, a production agentic browser automation platform." Target applied-LLM, RAG, agent-building, browser-automation, eval-engineering roles.

Titles: AI Engineer, Applied AI Engineer, LLM Engineer, Agent Engineer, AI Software Engineer, Forward-Deployed Engineer (at AI cos).

## Sub-taxonomy

"AI Engineer" decomposes into four distinct sub-paths — candidate should target D4 specifically:
- **D1 ML Research / Scientist** — PhD-adjacent, publications required. Poor fit.
- **D2 ML Platform / Infra** — covered under Option [M](M-platform-plus-agent.md).
- **D3 Fine-tuning / Training** — mediocre fit; niche skill.
- **D4 Applied LLM / Agent Engineer** — **strong fit, Elyt directly maps.**

## Pros
- Highest AT comp premium: P50 **€79K (Vienna €87K)** ([SalaryExpert](https://www.salaryexpert.com/salary/job/ai-engineer/austria/vienna)), 25% above senior .NET.
- Elyt directly matches the niche — it is literally what Browserbase/Stagehand/Skyvern/Anthropic Applied build.
- LLM-specialist demand grew **135.8% YoY** in 2026 ([Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/)).
- Meta-layer work (agent design, tool design, eval harnesses) is structurally harder to automate than code generation.
- Remote-EU ceiling: €100–140K senior.

## Cons
- **AT volume thin:** 80 "AI Engineer" postings, of which ~30–40 are genuinely applied-AI (rest renamed data-eng or SAP-AI). LLM keyword specifically: **40 postings**.
- Salzburg: **≈0 AI-specific roles**.
- Competition: every 8–10 YOE senior backend engineer in DACH is repositioning as "AI engineer" right now.
- **Elyt credibility hinges on traction.** Without public users, revenue, GitHub stars, or OSS community, hiring managers read "founder of Elyt" as "sophisticated side project" → no pay premium. See [../data/elyt-audit.md](../data/elyt-audit.md).
- AI-native startups have 50%+ 2-year mortality.
- 2026 may be peak-hype. AI-winter-lite in 2027 would compress comp and close hiring windows quickly.

## AT market

- 80 total AI-Engineer postings; applied-AI subset 30–40. Vienna concentration.
- AT P50 €79K; Vienna P50 €87K; ceiling €100–110K at Dynatrace Davis AI / Anyline / Celonis.
- **Employers:** Anyline (Vienna), Storyblok, Celonis (Munich/Vienna), Dynatrace Davis AI (Linz), Tricentis, Bitpanda (AI ops), Anexia.

<!-- EXTEND: round-06 JD samples -->

## EU market

- Strongest in Berlin, Munich, Paris, Amsterdam, London.
- Remote-EU P50 €90–110K, P75 €120–140K ([Remotely Talents](https://www.remotelytalents.com/blog/ai-engineer-salaries-2026-us-vs-europe-vs-latin-america)).
- **Target employers:** Mistral, DeepL, Aleph Alpha, Black Forest Labs, Nyonic, Parloa, Helsing, Continue.dev, Langfuse, n8n, Pylon, Sana, 11x, Decagon, Lindy.

## US market

- **$220–280K for LLM/agent specialists** ([Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/)).
- Remote-US contractor realistic: $150–200K gross → €75–100K net after AT tax/social.
- **Target employers:** Browserbase, Stagehand, Skyvern, Anthropic Applied, OpenAI, LangChain, Sierra, Harvey, Cresta, Factory, Cognition, Imbue alumni cos.

## Long-term outlook 2026–2031

- **Bull case:** Every enterprise needs "first 5 AI engineers" 2026–2028. Window is now.
- **Bear case:** By 2029–2030, "AI engineer" disambiguates into ML-infra / eval-eng / agent-eng specializations. Generic title commoditizes as tooling matures.
- **Durable sub-niche:** eval design + agent observability — stays human because agents can't self-grade at production-critical thresholds.

## AI-replacement risk — **3/5 (MEDIUM)**

**Why:** Building agents is harder to automate than writing React, but parts are still automatable. Durable core = eval / observability / tool design. Pure RAG plumbing is getting commoditized (LangChain template level). Ship eval depth, not prompt templates.

## Ease for this candidate — **4/5 (HIGH)**

**Why:** Elyt directly matches the niche — if positioned right, he's 60–70% there today. Remaining 30%: public-proof (traction or OSS), eval-design rigor (likely thin currently), LangGraph/LangFuse/Braintrust/Arize fluency. 4–6 months to competitive senior-candidate strength. Bottleneck = Elyt public narrative, not skill.

## Scoring

| Dim | Score |
|---|---|
| AI-resistance | 3 |
| Long-term | 4 |
| AT market | 3 |
| EU market | 5 |
| US market | 5 |
| Ease | 4 |
| **Weighted /10** | **7.4** |

## Verdict

**Top-tier option, conditional on Elyt commercialization or OSS signal within 60 days.** Without public proof, it's a €79K AT play. With proof, it's a €100–140K remote-EU play. High variance. **Preferred path: access through M (stacked) rather than pure D.**

## Open research

- **P0.1 — Elyt audit.** See [../data/elyt-audit.md](../data/elyt-audit.md). SINGLE biggest variable in this option's score.
- P1.3 — which specific AI-native employers match candidate profile best
- P4.1 — interview format: take-home eval design, live RAG debugging, system-design-for-agents
