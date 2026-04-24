# Option M — Platform + Agent/AI (stacked)

**Status:** CONDITIONAL UPGRADE (round 06 revision, confidence HIGH on conditions). Primary demoted to Option [E](E-platform-sre.md) pending Elyt-OSS sprint.
**Score:** 7.6–7.8/10 weighted (revised from 8.1 in round 05)

> **ROUND 06 UPDATE:** Round 06's Elyt audit ([../data/elyt-audit.md](../data/elyt-audit.md)) found **no publicly verifiable commercial traction** for Elyt. Verdict (c) — demo/portfolio piece, HIGH confidence. M's Elyt-leverage premium shrinks. E (pure platform) now scores equal/higher. See [../decisions/primary.md](../decisions/primary.md) for revised strategy.
>
> **M upgrades back to #1 IF** candidate ships an Elyt OSS component with ≥30 GitHub stars by 2026-06-20. Otherwise commit to E as primary.

See: [README](../README.md) · [goal](../goal.md) · [options](../options.md) · [final](../final.md) · [candidate](../candidate.md)

Related files:
- [../decisions/primary.md](../decisions/primary.md) — rationale
- [../plans/action-plan-12mo.md](../plans/action-plan-12mo.md) — month-by-month
- [../data/jd-samples.md](../data/jd-samples.md) — real JD analysis (round-06)
- [../data/salary-bands.md](../data/salary-bands.md) — comp distributions (round-06)

---

## Description

Combine Option [E (Platform/SRE)](E-platform-sre.md) and Option [D (Applied AI)](D-applied-ai.md). Target titles: "AI Platform Engineer", "Staff Engineer — AI Infrastructure", "Agent Platform Engineer", "MLOps + Agent Eng", "Infra for Agents", "Developer Experience — AI Platform".

Build a skill-stack that is rare by intersection:
- **Platform side:** K8s + Terraform + one deep cloud (AWS SA-Pro or Azure Solutions Architect) + observability (OTel, Prometheus, Grafana) + GitOps (Argo/Flux) + on-call reflexes
- **Agent/AI side:** LLM-ops (Langfuse / Braintrust / Arize) + eval harness design + RAG-at-scale + MCP + LangGraph + vector-DB production ops + cost/latency optimization
- **Elyt as proof:** the candidate already runs a production agentic system; the platform skills are the legible wrapper

## Why the combination beats either alone

**E alone:** scores 8.0 — best floor + durability, but generic platform-eng profile is common.
**D alone:** scores 7.4 — highest ceiling + Elyt-leverage, but depends on Elyt proof; AT volume thin.
**M stacked:** scores 8.1 — E's floor covers D's thin-volume risk; D's ceiling + Elyt-leverage covers E's generic-profile risk.

Rare skill-combo premium: most AI engineers can't operate K8s in prod; most platform engs can't design agent evals. The intersection is structurally scarce.

## Pros
- Highest weighted score on the board.
- Inherits AI-resistance from BOTH components.
- Geographic flexibility: AT-local (Porsche Informatik, Dynatrace Davis AI), remote-DACH (Celonis, Grafana EU), remote-US (Browserbase, Parloa, Skyvern, Factory, Modal, Baseten).
- Elyt is directly leverageable as a demonstration artifact.
- Durable through 2031: production AI needs production infrastructure + production agent operations. Both stay human.

## Cons
- More ramp than a single pivot: CKA + cloud cert + LLM-ops in 6–9 months (tight but doable).
- "AI Platform Engineer" title is emerging; not every JD uses it — candidate must read between JD lines.
- Requires candidate to commit to shipping Elyt signal (traction or OSS) for the D-leverage to materialize.

## AT market

- **Volume:** Union of E (~154 karriere.at) + D (~40 genuinely applied-AI) − overlap. Realistic stacked-target pool: ~30–50 roles/year in AT that truly fit. Vienna concentration.
- **Primary AT employer fit:** Dynatrace (Davis AI / AI SRE teams, Linz — 1h20 commute from Salzburg or remote).
- **Other AT employers:** Anexia (Klagenfurt/Vienna), Porsche Informatik (Salzburg HQ), Bitpanda (Vienna — has platform + applied-AI ops teams), A1 Digital, Raiffeisen Informatik, Celonis (Munich/Vienna hybrid), Tricentis.
- **Salary:** See [../data/salary-bands.md](../data/salary-bands.md). Preliminary: P50 €80–95K, P75 €95–110K at Dynatrace/Celonis tier.

<!-- EXTEND: round-06 agent populates with real JD sample analysis -->

## EU market

- **Strong:** every AI-native scaleup needs platform-AI engineers.
- **Target employers:** Zalando, Delivery Hero, Celonis, DB Schenker Tech, Lufthansa Systems, Swisscom, Grafana Labs EU, Datadog EU, HashiCorp, Elastic, GitLab, Cloudflare, Fastly, Netlify, Vercel, Fly.io, Parloa (Berlin/Munich), DeepL, Aleph Alpha, Black Forest Labs, Langfuse (Berlin), Continue.dev.
- **Salary:** remote-DACH/EU P50 €95–115K, P75 €120–140K.

## US market

- **Hottest sub-niche currently.** Agent-platform + MLOps companies are explicitly hiring remote-EU engineers with production experience.
- **Target US employers (remote-EU-friendly subset):** Browserbase, Stagehand (its parent co), Skyvern, Factory, Modal, Replicate, Baseten, Together.ai, Predibase, Anthropic Applied (via EOR), Scale AI (EU hires).
- **Salary (contractor or EOR):** $140–180K gross → €75–100K net after AT Neue Selbständige + tax. See [../data/salary-bands.md](../data/salary-bands.md).

## Long-term outlook 2026–2031

- **Bull case:** production AI workloads continue growing through 2028+. Every enterprise that deploys agents needs someone who can keep them running in prod — candidates who know both sides compound scarcity premium.
- **Bear case:** "AI Platform" title stabilizes into just "Platform Engineer (with AI workload experience)" — meaning candidates who branded themselves only on M language lose "AI Platform" as a distinct role. But the underlying skills remain valuable either way.
- **Net:** structurally durable. Both component niches are demand-inelastic through 2031.

## AI-replacement risk — **5/5 (VERY LOW)**

**Why:** Inherits strongest durability signals from both components:
- Platform side: on-call scar tissue, production mutation authority, compliance ownership — not automatable (see [../data/ai-replacement.md](../data/ai-replacement.md)).
- Agent side: eval / observability / tool design is the meta-layer above code generation. Agents cannot self-grade at production-critical thresholds.

Sources supporting: [Surfing Complexity Feb 2026](https://surfingcomplexity.blog/2026/02/14/lots-of-ai-sre-no-ai-incident-management/), [Anthropic Economic Index Jan 2026](https://www.anthropic.com/research/anthropic-economic-index-january-2026-report), [Addy Osmani — The Human 30%](https://gitnation.com/contents/the-human-30percent-thriving-as-a-developer-in-the-age-of-ai-coding-assistants).

## Ease for this candidate — **3/5 (MEDIUM)**

**Why:** 30–40% there already:
- Already uses CI/CD (Axess Azure DevOps + GitHub Actions, Elyt deployments)
- Azure familiarity + Docker + basic cloud
- LLM API integration (5 providers), MCP, agent architecture via Elyt

**Remaining 60% (9–12 months):**
- CKA exam (~6 weeks prep with Killer.sh)
- AWS SA Associate + Terraform Associate (2 months)
- CKS or CKAD depending on angle (1–2 months)
- Deep observability (Prometheus + Grafana + OTel production setup) — 2 months
- LLM-ops fluency: Langfuse / Braintrust / Arize hands-on — 2 months
- Eval harness design project (shippable as OSS) — 2 months
- Elyt: ship public traction OR open-source one reusable piece — parallel track

Bottleneck skill: on-call reflexes. Not learnable from a book. Requires first role + tenure.

## Scoring

| Dim | Score | Reasoning |
|---|---|---|
| AI-resistance | 5 | Meta-layer + prod-ops = durable |
| Long-term | 5 | Both components growing |
| AT market | 3 | 30–50 true stacked roles/year |
| EU market | 5 | Every AI scaleup needs this |
| US market | 5 | Remote-friendly, hottest sub-niche |
| Ease | 3 | 9–12 month ramp, Elyt-leverage accelerates |
| **Weighted /10** | **8.1** | |

## Verdict

**Primary path.** Optimal combination of floor (platform), ceiling (agent/AI), durability (both sides AI-resistant), and Elyt-leverage. See [../decisions/primary.md](../decisions/primary.md) for full decision record.

## Hedge

Option [F (Security/DevSecOps)](F-security.md) at 15% effort. See [../decisions/hedge.md](../decisions/hedge.md).

## Open research (fed into TODO.md)

- P0.2: 10–20 real AT + remote JDs matching M profile — see [../data/jd-samples.md](../data/jd-samples.md)
- P0.3: P25/P50/P75 comp distributions specific to stacked roles — see [../data/salary-bands.md](../data/salary-bands.md)
- P1.1: Week-by-week ramp curriculum
- P4.1: Interview format at top 10 target employers
