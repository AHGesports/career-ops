# Option D-Microsoft — Applied AI on Microsoft/.NET stack

**Status:** Updated round 11 (2026-04-21). Semantic Kernel deprecated; Agent Framework v1.0 is now the tool. Cert landscape changed (AI-102 retiring). Eval identified as #1 differentiator. New AT JDs added.
**Score:** 7.75/10 weighted (round 08 rubric). No score change from round 11 — findings confirm positioning, don't shift dimensions.
**Accessibility for candidate:** HIGHEST of any AI option (~70% already there).

See: [D-applied-ai.md](D-applied-ai.md) · [D-deepdive.md](D-deepdive.md) · [M-platform-plus-agent.md](M-platform-plus-agent.md) · [../rounds/round-09-dotnet-ai.md](../rounds/round-09-dotnet-ai.md) · [../data/jd-samples.md](../data/jd-samples.md) · [../decisions/primary.md](../decisions/primary.md)

---

## Why this sub-option exists (round 09 finding)

Round 06 concluded "Python is table-stakes in AI JDs; .NET absent." Round 09 invalidated this as **sample bias**: the prior JD sample drew from Python-native scaleups (Parloa, Langfuse, Browserbase) and missed the Microsoft-enterprise AI track entirely. Real data:

- **Microsoft Agent Framework 1.0 shipped GA 2026-04-03** for **both .NET and Python**, built on `Microsoft.Extensions.AI`. **Semantic Kernel officially deprecated March 2026** — Agent Framework is the direct successor. Named production users: KPMG, BMW, Fujitsu + 10K+ orgs on Azure AI Foundry Agent Service.
- **DACH enterprise has public production case studies:** RBI ChatGPT (Azure OpenAI + Foundry), Siemens Industrial Copilot, BMW telemetry agents on MS Agent Framework.
- **Post AG has a live €70K+ Senior AI Engineer role explicitly requiring C#/.NET + Azure AI + RAG + agentic workflows + MCP + open-source model deployment** — a near-perfect candidate fit.

The full round-09 evidence is in [../rounds/round-09-dotnet-ai.md](../rounds/round-09-dotnet-ai.md).

## Description

Build production AI features on the Microsoft stack: C# / .NET 8+ + Azure OpenAI + Azure AI Foundry + **Microsoft Agent Framework v1.0** + Microsoft.Extensions.AI + Azure AI Search + RAG + MCP + Kubernetes/AKS. (Semantic Kernel is deprecated — do not target it.)

Target titles: Senior AI Engineer, AI Software Engineer, Azure AI Engineer, Senior Software Engineer (AI), Cloud AI Engineer, Technical Specialist AI.

Target segment: DACH enterprise (banks, insurance, logistics, public sector, industrial). Microsoft-shop companies with Azure cloud standardization already in place, now bolting on AI.

## Pros
- **Near-zero ramp for this candidate.** Axess work = .NET 8 + C# + Azure + Docker + SSO/OAuth. Elyt work = Python + LLM provider abstraction + MCP + agent orchestration. Candidate is ~70% of the profile on day one; gap is ~4–6 weeks of Agent Framework hands-on + RAG + eval harness + 1 GitHub demo.
- **Elyt-proof NOT required.** Unlike D4-Python (which needs Browserbase-tier credibility), D-Microsoft employers judge on enterprise .NET fluency + demonstrated Azure AI work + MCP familiarity. Candidate's existing CV + 1 Agent Framework demo + eval harness suffices.
- **Eval is the #1 differentiator.** Per AI Engineering Field Guide (895 JDs): 39.6% of AI roles explicitly require evaluation skills. YC startups flag absence of eval harness as a red flag. Candidate must add `Microsoft.Extensions.AI.Evaluation` to Elyt before applying — this is the single gap most likely to cost an offer.
- **AT-local availability.** Post AG (Vienna), Porsche Informatik (Salzburg HQ — may add AI roles to existing platform teams), Raiffeisen Informatik (Vienna), Erste Tech Hub (Vienna). Real commutable-or-remote options.
- **German language asset monetizes fully.** DACH-enterprise AI roles value German fluency at B2+ level, which candidate has (professional German).
- **Comp €70–90K AT, €80–110K remote-DACH.** Below D4-Python ceiling but above A (.NET stay) and most E platform roles in AT.
- **Durability solid.** Microsoft has committed deep to .NET AI (Semantic Kernel → Microsoft.Extensions.AI → Microsoft Agent Framework all in 2024–2026). Enterprise customers who standardized on Azure are not switching to Python-first vendors. Long tail through 2031+.

## Cons
- **Lower ceiling than D4-Python.** €70–90K AT vs €100–140K remote-EU for Python-native applied AI. The enterprise-DACH comp band is narrower because most employers are Tarif/KV-bound banks.
- **Lower US-remote potential.** US AI is overwhelmingly Python. Remote-US contractor opportunities on .NET stack are narrow (Microsoft, some enterprise-AI consultancies).
- **Some DACH employers list degree requirement.** Post AG's JD explicitly lists "BSc/MSc + Microsoft AI certifications." Candidate's no-completed-degree hits friction at banks. Bitpanda-tier (fintech-native) more flexible; traditional banks less so.
- **5 YOE floor in some JDs.** Post AG wants 5+ YOE; candidate has 4+. Borderline.
- **Ecosystem immaturity vs Python.** Semantic Kernel GitHub 27K stars is healthy but Python's LLM ecosystem (LangChain 90K+, LlamaIndex, Hugging Face Transformers) is vastly broader. Fewer tutorials, smaller community, slower new-tool availability in .NET land.

## AT market

- **Realistic addressable pool:** 10–20 active senior .NET+AI roles at any moment in AT, 30–50 DACH-wide. (Tightened from 5–25 per round 11 JD pull.)
- **Growth trajectory:** rising as enterprise AI adoption follows Azure cloud adoption curve. Microsoft's 2025–2026 push (Agent Framework, Foundry, Copilot Studio) drives .NET-AI hiring at Microsoft-shop enterprises.
- **Primary AT employers:**
  - **Post Business Solutions / Österreichische Post** (Vienna) — confirmed 3 live listings including €70K+ Senior AI Engineer ([karriere.at/jobs/7619955](https://www.karriere.at/jobs/7619955) per round 09)
  - **Raiffeisen Informatik / RBI** (Vienna) — public Azure OpenAI + Foundry deployment; AI Tribe in Vienna
  - **Erste Group Tech Hub** (Vienna)
  - **Bawag, Oberbank** (Vienna / Linz)
  - **Dynatrace** (Linz) — partially; Davis AI has .NET-adjacent work though core is Java/Python
  - **Porsche Informatik** (Salzburg HQ) — AI roles added to existing platform teams (candidate-local)
  - **A1 Telekom / Magenta** (Vienna) — Azure OpenAI + Foundry deployment (round 11)
  - **Netural GmbH** (Linz/Vienna) — Agentic AI Engineer open, LangGraph/ADK/LlamaIndex, Azure OpenAI crossover ([karriere.at/10015040](https://www.karriere.at/jobs/10015040))
  - **ZETA** (Vienna) — C#/Python + Azure AI workloads (round 11)
  - **Techem** (Vienna) — SK + C# + Azure OpenAI (round 11, now should migrate to Agent Framework)
  - **Celonis** (Munich/Vienna remote) — .NET + C# + Azure OpenAI, remote-DACH (round 11)
  - **Kapsch, voestalpine digital** (industrial AI)
  - **Microsoft Austria** (Vienna) — partner/consulting side

## EU market

- **Strong in DACH.** DE (BMW, Siemens, Fujitsu, SAP, DATEV, Allianz, Munich Re, Deutsche Bank, KPMG Germany), CH (UBS, Swiss Re, Zurich Insurance, Swisscom, Migros Tech), NL (ABN AMRO, ING — mixed Java/.NET).
- **Thin outside DACH.** UK has some (Deloitte, Capita, NHS Digital); Nordic and Southern EU lean Java/Python.
- Remote-DACH senior .NET+AI: €80–110K typical, €120K+ at FAANG-adjacent shops.

## US market

- **Narrow but exists.** Microsoft itself (remote-EU sometimes), Accenture Microsoft Business Group, EPAM, Avanade (Microsoft-focused consultancy with global remote).
- Most US AI is Python-first. Contractor remote-US at AI-tier is usually Python.
- Not a strong comp lever for this candidate unless targeting Microsoft itself.

## Long-term outlook 2026–2031

- **Bull case:** Microsoft's enterprise moat compounds. Every bank, insurance, logistics, and government org on Azure gets "AI features" over 2026–2030. Someone has to build those features; most will be on .NET because the teams already are. D-Microsoft demand doubles by 2028.
- **Bear case:** Python AI tooling advantages force enterprises to split teams — platform team on .NET, AI team on Python. D-Microsoft demand plateaus as a niche.
- **Most likely:** steady growth. Not the fastest-growing AI sub-niche, but durable with predictable DACH-enterprise demand.
- Durability through 2031: HIGH (regulatory-adjacent enterprise doesn't change stacks).

## AI-replacement risk — **3/5 (MEDIUM)**

**Why:** Same risk profile as D4-Python applied AI work. Prompt/RAG scaffolding is increasingly automatable; eval design + system integration + production debugging stays human. The durable sub-niche (eval design, agent observability) is stack-agnostic — you can build it in .NET or Python equivalently.

## Ease for this candidate — **5/5 (VERY HIGH)**

**Why:** Lower ramp than E, D4-Python, F, M, or H. Specifically:
- C#/.NET 8: **already expert** (Axess, 2.75 years at senior level)
- Azure: **already production-experienced** (Axess + Atra Azure DevOps + deployments)
- Docker + K8s: already Docker; K8s is the one gap (CKA-level ~6 weeks)
- Azure OpenAI SDK: trivial with existing .NET fluency (~1 week)
- **Microsoft Agent Framework v1.0** (NOT Semantic Kernel — deprecated): ~2–4 weeks hands-on to port Elyt LLM calls to `IChatClient` + `AsAIAgent()` pattern
- MCP: **already has this** (Elyt implements it; maps directly to AI-3026 module 3)
- RAG with Azure AI Search: ~2 weeks
- **Eval harness** (`Microsoft.Extensions.AI.Evaluation`): ~1 week — critical differentiator, do this before applying
- **Total ramp: 4–6 weeks** for CV-credible. Compare to D4-Python (4–6 months) or E (6–9 months).

The bottleneck is NOT skill acquisition. It's producing one public GitHub demo showing Semantic Kernel / Agent Framework production use. 2–3 weekends.

## Scoring (round 08 rubric, 8 dimensions)

| Dim | Score | Reasoning |
|---|---|---|
| AI-resistance | 3 | Same as D4 — applied LLM work, partly automatable, eval-layer durable |
| Long-term | 4 | Microsoft ecosystem durable; DACH enterprise AI growing |
| AT market | 4 | Real 5–25 role addressable; growing |
| EU market | 4 | Strong DACH; thin outside |
| US market | 2 | Narrow; most US AI is Python |
| Ease | 5 | Near-zero ramp for this candidate |
| Knowledge transfer | 5 | C# / .NET directly applies — plus general SWE |
| No-degree accessibility | 3 | Post AG lists degree; mixed |
| **Weighted /10** | **7.75** | |

## Verdict

**The best AI-upside path for THIS specific candidate.** Lower ceiling than D4-Python, but:
- Much higher execution probability
- Zero Elyt-OSS dependency
- Salzburg-accessible employers exist (Porsche Informatik potential)
- Candidate's existing .NET strength is an ASSET, not a liability
- 4–6 weeks to CV-credible

D-Microsoft should be the **parallel AI track** alongside E (platform primary). Two CV variants: one .NET+Azure-AI-lead for DACH-enterprise targets (D-Microsoft), one Python+Elyt-lead for remote-EU/US targets (D4-Python).

## Immediate target

**Post AG Senior AI Engineer** ([karriere.at/jobs/7619955](https://www.karriere.at/jobs/7619955) per round 09) or the related Post AG listings. €70K+ stated minimum; real package likely €75–85K with overpayment. Apply within 30 days with .NET-AI-positioned CV.

## CV positioning for D-Microsoft (differs from D-deepdive.md)

For D-Microsoft specifically, **keep and LEAD with** .NET + Azure + SSO/OAuth + C# — these are assets here, not liabilities. Add:
- **Microsoft Agent Framework v1.0 demo (GitHub)** — Semantic Kernel is deprecated, do not use it
- Azure OpenAI SDK + Azure AI Foundry usage evidence
- RAG implementation (Azure AI Search + vector retrieval)
- **Eval harness** (`Microsoft.Extensions.AI.Evaluation`) — the #1 differentiator; hiring managers at YC-style firms flag its absence as a red flag
- MCP (already have — maps directly to AI-3026 module 3)
- 1 blog post on "AI agents with Microsoft Agent Framework in C#" or "RAG in production with Azure AI Search"

Keep Elyt but reframe as "agentic browser automation platform built on multi-provider LLM abstraction (including Azure OpenAI) with MCP integration, with eval harness measuring agent output quality." Doesn't need OSS proof for D-Microsoft — hiring managers at Post AG / RBI / Siemens judge on enterprise .NET fluency + Azure AI evidence + production eval story.

### Cert path (updated round 11)

| Cert | Status | Action |
|---|---|---|
| AI-102 Azure AI Engineer Associate | **Retiring June 30, 2026** | **Skip** — 10 weeks wasted on retiring exam |
| **AI-103** Azure AI Apps & Agent Developer | Beta April 21, 2026; GA June 2026 | **Target** — agents + GenAI + RAG + Foundry; Python-first but C# accepted |
| **AI-200** Azure AI Cloud Developer | Beta April 30, 2026; GA July 2026 | Target for Option M (K8s + distributed AI infra) |

### Learning resources ranked (round 11 addition)

| Resource | What it covers | Priority |
|---|---|---|
| `github.com/SteveSandersonMS/dotnet-ai-workshop` | Chat → embeddings → RAG → function calling → eval | **Start here** |
| `github.com/microsoft/Agent-Framework-Samples` | 28+ samples: agents, tools, MCP, A2A, RAG, eval | Week 2 |
| AI-3026 path (modules 7+8) | Agent Framework in C#, multi-agent orchestration | Week 3 |
| `github.com/dotnet/eShopSupport` | Production .NET Aspire AI reference app | Week 4 |
| `github.com/dotnet/ai-samples` | `Microsoft.Extensions.AI.Evaluation` — eval harness | Week 4 |

## Open research / TODO

- ~~Pull 10+ more DACH .NET+AI JDs~~ **Partially done (round 11).** Pool tightened to 10–20 AT / 30–50 DACH. Still short of 15-JD target — pull remaining 5+ from DE/CH LinkedIn.
- Verify Porsche Informatik AI roadmap — do they have D-Microsoft-flavored roles or only pure platform? (P0.11)
- Evaluate Microsoft Austria + Accenture Microsoft Business Group + Avanade for remote-EU D-Microsoft contracting
- **NEW (round 11): Apply to Netural GmbH Agentic AI Engineer** ([karriere.at/10015040](https://www.karriere.at/jobs/10015040)) — currently open, explicit LLM/agent/Azure — D-Microsoft calibration role (P0.16)
- **NEW (round 11): Port Elyt to Agent Framework v1.0** before applying anywhere — SK is deprecated (P0.12)
- **NEW (round 11): Add RAG + eval harness to Elyt** — eval absence = red flag in interviews (P0.13)
- **NEW (round 11): Apply to AI-103 beta exam** (GA June 2026, beta discounted/free) (P0.14)
