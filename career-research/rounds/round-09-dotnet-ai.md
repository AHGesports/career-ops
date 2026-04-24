# Round 09 — Is .NET / Microsoft-stack AI engineering a real DACH niche in 2026?

**Date.** 2026-04-20
**Trigger.** A real Austrian JD surfaced — Österreichische Post / Post Business Solutions, "Technical Specialist – Cloud, On-Prem & AI" (€70K min, Vienna, .NET full stack + C# + Azure Cognitive Services + Azure OpenAI + Kubernetes). This contradicts [round-06](round-06-deep.md)'s hard claim that ".NET appeared in zero of 9 AI-specific JDs" and that "Python is table-stakes" for Option D. Time to recheck.

**Goal.** Determine whether .NET + AI engineering is a genuine, growing DACH niche — or whether Post AG is an outlier. If genuine, does the candidate's .NET/C# identity flip from **liability** (round 06 framing) to **asset** for a sub-variant of Option D ("D-Microsoft")?

See: [../options/D-applied-ai.md](../options/D-applied-ai.md) · [../options/D-deepdive.md](../options/D-deepdive.md) · [../data/jd-samples.md](../data/jd-samples.md) · [round-06](round-06-deep.md)

---

## Executive summary

1. **.NET AI ecosystem is NOT a marketing gimmick — it is a production reality in April 2026.** Microsoft shipped **Agent Framework 1.0 GA on 2026-04-03** (17 days before this round) for .NET and Python, built on `Microsoft.Extensions.AI`, consolidating Semantic Kernel + AutoGen. KPMG, BMW, Fujitsu are named enterprise production users. Over 10,000 organizations use the managed Azure AI Foundry Agent Service. **HIGH**
2. **Round 06's "Python is table-stakes, .NET absent" claim is NOT invalidated for the median AT AI JD, but it over-generalized.** Of 40 LLM-tagged roles on karriere.at today, zero explicitly name C#/.NET as required stack — same result as round 06 for the Python-absent side. But **language-agnostic LLM JDs dominate** (18 visible, 0 name a language explicitly), which means both Python and .NET candidates compete on equal JD-surface terms. The real story is stack-specific employers, not aggregate counts. **HIGH**
3. **Post AG is NOT an outlier — it is the leading visible example of a real DACH-local pattern.** The pattern is "Microsoft-stack enterprise doing Azure OpenAI + C# + Azure AI Foundry." Confirmed DACH employers: Österreichische Post, Raiffeisen Bank International (public Microsoft case study — RBI ChatGPT on Azure OpenAI / Azure AI Search / Azure AI Foundry), Siemens (Industrial Copilot on Azure OpenAI), KPMG, BMW. **MEDIUM-HIGH** (pattern is clear; JD-volume count is still thin vs. Python-primary roles).
4. **This opens a defensible sub-path ("D-Microsoft") for the candidate that reuses his existing .NET identity instead of suppressing it.** Unlike core D4 (Python + LangChain + pgvector + Langfuse), D-Microsoft is C#/.NET + Semantic Kernel / Microsoft Agent Framework + Azure OpenAI + Azure AI Foundry + MCP. Candidate has 4 YOE .NET production experience at Axess — this is **closer to a Post-AG-fit candidate than to a Parloa-fit candidate**. The 5-YOE floor at Python-native scaleups does not apply at Microsoft-stack enterprises. **MEDIUM-HIGH**
5. **Does the primary recommendation change? Option E stays primary for Salzburg-local stability. But Option D's sub-branch D-Microsoft becomes the best AI-specific upside path for this candidate — better than generic D4.** Revised D score: keep 7.4 for D4-generic, add **D-Microsoft at 7.2–7.6** for this specific candidate (ease rises from 4 to 5; AT market rises from 3 to 4; EU market drops from 5 to 3 since Parloa/Langfuse/DeepL do not care about .NET). Net: D-Microsoft is a credible Option D instantiation without requiring Elyt public traction. **MEDIUM**

---

## 1. .NET AI ecosystem status — actual state in April 2026

### 1.1 Semantic Kernel (the predecessor)

- **GitHub stars:** ~27,300–27,700 as of April 2026 ([multiple tracker posts](https://is4.ai/blog/our-blog-1/semantic-kernel-microsoft-ai-framework-2026-297), [GitHub](https://github.com/microsoft/semantic-kernel)). For comparison: LangChain has ~95K stars, LangGraph ~8K, LlamaIndex ~37K — Semantic Kernel sits between LangGraph and LlamaIndex in mindshare, not a marginal toy. **HIGH**
- **Language support:** C#, Python, Java — first-class parity across all three. This is Microsoft's explicit enterprise angle vs. Python-exclusive frameworks ([cloudsummit.eu](https://cloudsummit.eu/blog/microsoft-agent-framework-production-ready-convergence-autogen-semantic-kernel)). **HIGH**
- **Enterprise positioning:** Microsoft describes it as the "preferred choice for developers building production-grade AI agents" — marketing copy, but the Fortune 500 adoption claim is backed by named case studies (see §1.4). **MEDIUM**
- **Successor status:** Microsoft has publicly announced Semantic Kernel is being superseded by **Microsoft Agent Framework**, while pledging continued support "at least one year after Microsoft Agent Framework leaves Preview and is GA" ([Microsoft Learn migration guide](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-semantic-kernel/)). Semantic Kernel skills remain directly transferable. **HIGH**

### 1.2 Microsoft.Extensions.AI (the foundation layer)

- Released 2024 as a unified AI library for .NET. Provides standard abstractions (IChatClient, IEmbeddingGenerator, tool-calling, streaming) across model providers — the `System.Net.Http.HttpClient`-equivalent for AI. ([devblogs.microsoft.com](https://devblogs.microsoft.com/semantic-kernel/semantic-kernel-and-microsoft-extensions-ai-better-together-part-2/)) **HIGH**
- This is the substrate for the entire .NET AI stack: Semantic Kernel uses it, Microsoft Agent Framework uses it, third-party .NET AI libraries target it. **HIGH**

### 1.3 Microsoft Agent Framework (the current primary)

- **Announced:** 2025-10-01 at .NET Conf 2025 RC. ([Visual Studio Magazine](https://visualstudiomagazine.com/articles/2025/10/01/semantic-kernel-autogen--open-source-microsoft-agent-framework.aspx)) **HIGH**
- **GA:** 2026-04-03, Version 1.0. Single unified SDK for .NET AND Python, combining AutoGen's agent abstractions + Semantic Kernel's enterprise features (state management, type safety, middleware, telemetry) + new graph-based multi-agent orchestration. ([Visual Studio Magazine](https://visualstudiomagazine.com/articles/2026/04/06/microsoft-ships-production-ready-agent-framework-1-0-for-net-and-python.aspx), [Microsoft Learn](https://learn.microsoft.com/en-us/agent-framework/overview/), [github.com/microsoft/agent-framework](https://github.com/microsoft/agent-framework)) **HIGH**
- **Features:** A2A (agent-to-agent) and MCP interoperability, OpenTelemetry observability, Azure Monitor, Entra ID auth, CI/CD via GitHub Actions and Azure DevOps. This is enterprise-grade, not a research toy. **HIGH**
- **Named production users at launch:** KPMG (audit automation), BMW (vehicle telemetry analysis across terabytes), Fujitsu (integration services), 10,000+ orgs on Azure AI Foundry Agent Service. ([digitalapplied.com](https://www.digitalapplied.com/blog/microsoft-agent-framework-1-0-dotnet-python-guide), [cloudsummit.eu](https://cloudsummit.eu/blog/microsoft-agent-framework-production-ready-convergence-autogen-semantic-kernel)) **HIGH** on existence, **MEDIUM** on depth of actual production use.

### 1.4 Azure OpenAI + Azure AI Foundry (the platform)

- **Azure AI Foundry** launched 2025 as Microsoft's end-to-end AI platform: model catalog, fine-tuning, agent service, evaluations, content safety. Replaces "Azure AI Studio" naming. **HIGH**
- **Enterprise DACH references:** 
  - **Raiffeisen Bank International** — built "RBI ChatGPT" on Azure OpenAI + Azure AI Search inside Azure AI Foundry for document summarization, legal/reg doc processing ([Microsoft Customer Stories](https://www.microsoft.com/en/customers/story/21406-raiffeisen-bank-international-azure)). **HIGH**
  - **Siemens Industrial Copilot** — Siemens + Microsoft partnership on Azure OpenAI for manufacturing/automation ([Microsoft Source](https://news.microsoft.com/source/2024/10/24/siemens-and-microsoft-scale-industrial-ai/)). **HIGH**
  - **SAP** — MCP support for SAP HANA Cloud (Joule Agents), GA planned Q1 2026. Relevant because SAP shops in DACH are .NET-adjacent frequently. **HIGH**

### 1.5 AutoGen for .NET

- Originally Python-only Microsoft Research framework. AutoGen's agent abstractions are now folded into Microsoft Agent Framework (1.0 GA). AutoGen-for-.NET as a separate product is effectively deprecated in favor of Agent Framework. **HIGH**

### 1.6 .NET 9 / .NET 10 AI features

- .NET 9 (Nov 2024) added `Microsoft.Extensions.AI` built-in, native tensor primitives, performance improvements for inference workloads.
- .NET 10 (expected Nov 2026) is announced to have deeper Agent Framework integration, better streaming and tool-calling ergonomics, improved `IChatClient` abstractions.
- **Inference:** `TorchSharp` and ONNX Runtime for .NET exist but are niche; the mainstream .NET AI story is **call Azure OpenAI (or another hosted model) via `Microsoft.Extensions.AI`**, not self-host. This matters for candidate positioning: the .NET-AI job isn't GPU engineering, it's API orchestration + RAG + agents — exactly what the candidate already does. **HIGH**

---

## 2. Actual JD volume data

### 2.1 karriere.at (Austria)

- **"LLM" tag: 40 total listings as of 2026-04-20** ([karriere.at/jobs/llm](https://www.karriere.at/jobs/llm)). Of 18 visible on the first page, **zero explicitly name C#/.NET as required stack, and zero explicitly name Python as required stack** — the JDs are language-agnostic in their keyword surface, which means filter-boolean searches under-count true addressable volume on both sides. **HIGH** on count, **HIGH** on "language not in JD headline."
- **"AI Engineer" tag:** 79–80 total (confirmed via [round 06 jd-samples.md line 149](../data/jd-samples.md)). **HIGH**
- **Explicit .NET + AI cross-reference search:** no aggregate filter exists on karriere.at. Specific confirmed postings found:
  - **Österreichische Post / Post Business Solutions — "Technical Specialist – Cloud, On-Prem & AI" (w/m/d)** — Vienna 1230, €70K min all-in, full-stack .NET (C#, ASP.NET Core, Blazor, TS/JS), Azure Cognitive Services + Azure OpenAI integration, Kubernetes. ([karriere.at/jobs/7619955](https://www.karriere.at/jobs/7619955), [stepstone.at](https://www.stepstone.at/stellenangebote--Technical-Specialist-Cloud-On-Prem-AI-Post-Busines-Solutions-GmbH-w-m-d-Wien-Oesterreichische-Post-AG--932104-inline.html)) **HIGH**
  - **Österreichische Post / Post Business Solutions — "C# Senior Developer with Cloud Experience" (w/m/d)** — Vienna, €60K min, C#/.NET, MSSQL/Postgres, Python/Bash scripting, Azure preferred, **explicit mention of AI-assisted development tools (GitHub Copilot, Cursor)**. ([jobwald.at](https://www.jobwald.at/581674/0/C)) **HIGH** — not an AI-engineer role, but AI-adjacent .NET role.
  - **Österreichische Post / Post Business Solutions — "IT Specialist – Cloud, On-Prem & AI"** — separate variant of #1. ([karriere.post.at](https://karriere.post.at/job/Wien-IT-Specialist-Cloud,-On-Prem-&-AI-Post-Busines-Solutions-GmbH-(wmd)-Wien-1230/1242678701/)) **HIGH**
- **Aggregate ".NET + AI" JD volume estimate for AT:** realistic addressable pool is **5–15 active senior roles at any given moment** — small but non-zero, and growing. **LOW-MEDIUM** (no public aggregate filter; estimate from named-employer scan).

### 2.2 stepstone.de (Germany)

- **"AI Engineer" in Berlin: 121 listings** ([stepstone.de/jobs/ai-engineer/in-berlin](https://www.stepstone.de/jobs/ai-engineer/in-berlin)). **HIGH**
- **"AI Software Developer" in Berlin: 424 listings** ([stepstone.de/jobs/ai-software-developer/in-berlin](https://www.stepstone.de/jobs/ai-software-developer/in-berlin)). **HIGH**
- Evidence of Microsoft-stack AI roles: one JD surfaced in the search mentioned a Berlin AI Engineer position "primarily with Microsoft Copilot, Copilot Studio (Agents) and Azure AI" — confirming the pattern exists in DE too. **MEDIUM**
- **stepstone.at "AI Engineer" in Wien: only 1 listing** ([stepstone.de/jobs/ai-engineer/in-wien](https://www.stepstone.de/jobs/ai-engineer/in-wien)) — confirms karriere.at is the primary AT channel, not stepstone. **HIGH**

### 2.3 Glassdoor / LinkedIn (DACH aggregate)

- **Austria artificial intelligence jobs: 214** as of March 2026 ([Glassdoor](https://www.glassdoor.com/Job/austria-artificial-intelligence-jobs-SRCH_IL.0,7_IN18_KO8,31.htm)). **HIGH**
- **Vienna artificial intelligence jobs: 111** ([Glassdoor Vienna](https://www.glassdoor.com/Job/wien-artificial-intelligence-jobs-SRCH_IL.0,4_IC3174503_KO5,28.htm)). **HIGH**
- **Austria .NET developer jobs: 86–90** (Glassdoor November 2025 / September 2025 snapshots). **HIGH** — a separate pool, much larger than AI pool, but with growing overlap via the Post/RBI/bank pattern.
- **Austria machine learning engineer jobs: 65** (Glassdoor December 2025). **HIGH**
- **MetaJob AT "AI Wien": 150+** ([metajob.at/ai-wien](https://www.metajob.at/ai-wien)). **MEDIUM**

### 2.4 Growth indicator (2025 → 2026)

- Round 06 cited 79 AI Engineer karriere.at postings and 150 total AI Vienna roles. Current numbers (79–80 karriere.at, 111 Glassdoor Vienna, 150+ MetaJob) are **flat or marginally up** — AT AI volume is stable, not exploding. **MEDIUM**
- The meaningful growth is in the **ecosystem maturation** (Microsoft Agent Framework GA, 10K+ Azure AI Foundry orgs, RBI case study) rather than in JD count per se. **MEDIUM**
- **Interpretation:** the niche is growing *structurally* (tools, platforms, enterprise commitments) faster than it is growing *visibly in JD boards*, because Microsoft-stack enterprises rebrand internal roles or ask for "Senior .NET Engineer" and mention Azure AI in the JD body, not the title. **INFERENCE, MEDIUM**

---

## 3. DACH employer list — confirmed or strongly likely .NET + AI hiring

| Employer | Country | Evidence | JD / case study URL | Confidence |
|---|---|---|---|---|
| Österreichische Post / Post Business Solutions | AT | Three active .NET + AI JDs including €70K min Azure AI role | [karriere.at/7619955](https://www.karriere.at/jobs/7619955), [stepstone.at 932104](https://www.stepstone.at/stellenangebote--Technical-Specialist-Cloud-On-Prem-AI-Post-Busines-Solutions-GmbH-w-m-d-Wien-Oesterreichische-Post-AG--932104-inline.html), [jobwald.at 581674](https://www.jobwald.at/581674/0/C) | HIGH |
| Raiffeisen Bank International | AT | RBI ChatGPT built on Azure OpenAI + Azure AI Foundry — published Microsoft case study. RBI AI Tribe exists ([round 06](../data/jd-samples.md)). | [microsoft.com/customers RBI](https://www.microsoft.com/en/customers/story/21406-raiffeisen-bank-international-azure) | HIGH |
| Erste Group Tech Hub | AT | Inferred from NIS2/DORA + Microsoft-stack bank pattern; no direct .NET-AI JD read for this round | — | MEDIUM |
| Bawag | AT | Same inference as Erste | — | LOW-MEDIUM |
| Axess AG (candidate's current) | AT | .NET 8 + Azure shop; AI adoption likely in 2026 roadmap. Unknown externally. | — | LOW |
| Dynatrace Davis AI | AT | Java/Python primary; AI causal modeling; **not** Microsoft-stack — exclude from D-Microsoft list | — | HIGH (exclusion) |
| Porsche Informatik | AT | Salzburg/Vienna, large .NET footprint, Azure shop; AI JDs not visible yet but probable 2026 entrant | [porscheinformatik.com/jobs](https://www.porscheinformatik.com/jobs) | MEDIUM |
| Siemens (AT + DE) | DACH | Industrial Copilot on Azure OpenAI — confirmed partnership. Siemens uses .NET heavily internally. | [Microsoft Source](https://news.microsoft.com/source/2024/10/24/siemens-and-microsoft-scale-industrial-ai/) | HIGH |
| BMW Group | DE | Named production user of Microsoft Agent Framework (vehicle telemetry). BMW has large Munich .NET footprint. | [digitalapplied.com](https://www.digitalapplied.com/blog/microsoft-agent-framework-1-0-dotnet-python-guide) | HIGH |
| KPMG (DACH) | DACH | Named production user of Microsoft Agent Framework (audit automation) | same | HIGH |
| Fujitsu (DACH) | DACH | Named production user of Microsoft Agent Framework (integration services) | same | HIGH |
| SAP | DE | MCP support for SAP HANA Cloud / Joule Agents, GA Q1 2026; SAP has .NET integration consulting ecosystem | [sap.cn H2 2025](https://www.sap.cn/topics/innovation-guide/h2) | HIGH |
| Allianz / Uniqa / ERGO | DACH insurance | .NET-heavy insurers adopting Azure AI — no direct JD this round, inferred from industry pattern | — | LOW-MEDIUM |
| Deutsche Telekom / Magenta | DE/AT | .NET-heavy telco; DevSecOps JDs surfaced in [round 06 F](../data/jd-samples.md), AI roles plausible | — | LOW-MEDIUM |
| Microsoft Austria / Germany | DACH | Obviously hires .NET + AI — FDE / Solutions Architect roles | [microsoft.ai/job](https://microsoft.ai/job/senior-software-engineer-57/) | HIGH |

**Net:** at least **6 high-confidence DACH employers** are actively running .NET + Azure AI in production with public evidence. Post AG is NOT an outlier.

---

## 4. Re-evaluation of Option D — D-Microsoft sub-variant

### 4.1 Reframing

Round 06 collapsed Option D into a single D4 target ("Python + LangChain + pgvector + Langfuse, Elyt-proof-gated"). Reality: **Option D has two accessible tracks**, and the candidate-fit ranking is different for each.

| Track | Core stack | Target employer archetype | Candidate fit | Elyt-proof dependency |
|---|---|---|---|---|
| **D4-Python** (status quo) | Python + LangChain/LangGraph + pgvector + Langfuse + LLM APIs | Python-native scaleups: Parloa, Langfuse, Continue.dev, Mistral, Black Forest Labs, Browserbase, Skyvern | **MEDIUM** (4 YOE borderline vs 5-YOE floors; Python is secondary language; no OSS signal) | **HIGH** — without Elyt OSS/traction signal, candidate is under-credentialed |
| **D-Microsoft** (new) | C#/.NET + Microsoft Agent Framework / Semantic Kernel + Microsoft.Extensions.AI + Azure OpenAI + Azure AI Foundry + MCP | Microsoft-stack enterprises: Post AG, RBI, Siemens, BMW, KPMG, Fujitsu, Porsche Informatik, SAP consultancies | **HIGH** — candidate has 4 YOE .NET 8 production at Axess, Azure DevOps, EF Core, C# as primary language. Only missing: hands-on Semantic Kernel / Agent Framework project (2–6 weeks of work) | **LOW** — Elyt optional. What matters is a C# + Semantic Kernel agent + Azure OpenAI RAG demo on GitHub. |

### 4.2 Scoring — D-Microsoft

Using the same rubric as [D-applied-ai.md](../options/D-applied-ai.md):

| Dim | D4-Python (round 06) | D-Microsoft (this round) | Rationale for D-Microsoft |
|---|---|---|---|
| AI-resistance | 3 | 3 | Same — AI engineering is AI engineering, Microsoft-stack or not |
| Long-term | 4 | 4 | Slightly more durable (enterprise inertia protects Microsoft-stack jobs) but also more coupled to one vendor's roadmap. Net-neutral. |
| AT market | 3 | **4** | Post AG, RBI, Siemens Austria, Porsche Informatik, bank cluster — AT has more .NET+Azure AI jobs than Python+LangChain+Langfuse jobs, because AT is a Microsoft-stack country |
| EU market | 5 | **3** | Lower — Parloa/Langfuse/DeepL/Mistral do NOT care about .NET. The EU ceiling caps at ~€85–100K Microsoft-consultancy / BMW-tier roles; no Mistral €120–140K path. |
| US market | 5 | **2** | Very low — US remote AI market is overwhelmingly Python. SF AI-native startups explicitly Python. Only exception: Microsoft itself / enterprise Microsoft-stack consultancies. |
| Ease | 4 | **5** | Much easier — candidate's CV is already 70% there. No Python identity-shift required. |
| **Weighted /10** | **7.4** | **7.2–7.6** (depending on AT-vs-EU weighting) | Comparable overall score, very different risk profile |

**Net:** D-Microsoft is a **narrower-ceiling, lower-variance, AT-local version of Option D**. It trades US remote-contractor upside for local employability and near-zero career-switching cost.

### 4.3 Is .NET a liability or asset?

Round 06 framing: **"liability" — demote to secondary, lead with Python/Elyt.**

This round's refined framing: **context-dependent.**

- For D4-Python / Parloa / Langfuse / US remote: **.NET remains a liability.** Round 06 is correct for that segment. Demote it, lead with Elyt Python.
- For D-Microsoft / Post AG / RBI / Siemens / BMW / KPMG: **.NET is the #1 asset.** Lead with it. Position Elyt as "the Python execution engine in my platform; I also build C#/.NET enterprise systems at Axess, and have 4 YOE shipping ASP.NET Core + EF Core production." Add a Semantic Kernel / Microsoft Agent Framework project to bridge "enterprise .NET engineer" to "enterprise .NET AI engineer."

**The candidate should run two CV variants, not one.** This is a concrete actionable change from round 06's single-CV D-positioning guidance.

---

## 5. Contradictions / refinements vs. round 06

| Round 06 claim | Status after round 09 | Evidence |
|---|---|---|
| ".NET appeared in zero of 9 AI-specific JDs sampled" | **TRUE but sample-biased.** The 9 JDs in [jd-samples.md](../data/jd-samples.md) were drawn from Python-native scaleups (Parloa, Langfuse, Dynatrace, RBI AI Tribe, EY). No Post AG, no Siemens Industrial Copilot, no KPMG/BMW/Fujitsu Microsoft Agent Framework role was in the sample. | §3 employer list |
| "Python is table-stakes for applied AI" | **TRUE for D4-Python track. FALSE for D-Microsoft track.** | §4.1 split |
| "Candidate's .NET identity is less valuable here; Python-first CV positioning needed" | **TRUE for D4-Python target. INVERSE (lead with .NET) for D-Microsoft target.** | §4.3 |
| "Elyt public-proof is the single biggest variable in D's score" | **TRUE for D4-Python. FALSE for D-Microsoft** — a Semantic Kernel / Agent Framework GitHub repo is sufficient signal for Microsoft-stack employers. | §4.1, §4.2 Ease dimension |
| "AT native-AI volume is thin (~79 karriere.at)" | **STILL TRUE in aggregate**, but the Microsoft-stack subset of those 79 + the larger pool of 86–90 .NET-developer-with-AI-duties roles makes the effective candidate-fit pool larger than 79. | §2.1, §2.3 |
| "Anthropic acquired Vercept for browser-agent work → Elyt bucket is hot" | Unchanged, still TRUE for D4 path. | [D-deepdive §2](../options/D-deepdive.md) |

**Round 06 was not wrong, but over-applied a Python-native lens across a DACH market that is heavily Microsoft-stack.** Round 06's bias: it drew JDs from a pre-selected "top-tier AI employer" list (Parloa, Langfuse, Mistral, Anthropic Applied, Browserbase, Skyvern) which by construction skews Python. When the candidate's actual accessibility filter is "DACH, Salzburg-hybrid or Vienna-tolerant, €65–90K", the employer distribution shifts dramatically toward Microsoft-stack enterprises.

---

## 6. Recommendation updates

### 6.1 Primary path

- **Option E (Platform / SRE / DevOps)** remains **primary** for Salzburg-local stability and candidate-fit. Nothing in this round changes E's evaluation. **UNCHANGED.**

### 6.2 AI-specific upside path

- **Old:** Option D via D4-Python, gated by Elyt public proof, ~7.4/10 with HIGH variance.
- **New:** Option D as a **portfolio of two tracks**, run in parallel:
  - **D-Microsoft** (primary D instantiation for this candidate): ~7.4/10, **low variance**, AT-local, €70–90K, Post AG / RBI / Siemens / Porsche Informatik / BMW Munich target list. Requires: 1 Semantic Kernel or Microsoft Agent Framework GitHub project (4–6 weeks) + .NET-AI-positioned CV variant. **No Elyt public traction gate.**
  - **D4-Python** (secondary D instantiation): ~7.4/10, HIGH variance, €85–140K EU-remote ceiling. Requires: Elyt OSS extraction + blog + LangGraph/Langfuse/pgvector portfolio. Same 3–6 month plan as [D-deepdive.md](../options/D-deepdive.md) recommends.
- **Net change:** applying to Post AG today (with an updated CV emphasizing .NET + Azure AI + 4 YOE + a quick Semantic Kernel side-project) is a **genuine, interview-credible move right now**, with a realistic €70–85K outcome. This is NOT true for Parloa or Langfuse today.

### 6.3 Option M (Platform + Agent stacked)

- Still valid. In fact, **M becomes more accessible via the D-Microsoft route** than via the D4-Python route, because a DACH enterprise hiring "Senior .NET engineer who also does Azure AI agents + Azure DevOps + Kubernetes" IS Option M by construction. Post AG's Technical Specialist JD is literally an M-shaped role (.NET full stack + Azure AI + Kubernetes). **UPGRADE confidence on M's AT viability.**

### 6.4 Actionable items for next round / TODO

1. **Write D-Microsoft option file** at `../options/D-microsoft.md` or extend `D-applied-ai.md` with a D-Microsoft subsection.
2. **Scan karriere.at / stepstone.at / stepstone.de / LinkedIn AT for explicit ".NET + Azure OpenAI" or ".NET + Semantic Kernel" JDs.** Target: 10–15 real JDs to confirm the 6-employer list is not cherry-picked. Expected yield: 10–25 active roles at any given time across DACH.
3. **Build a Semantic Kernel / Microsoft Agent Framework GitHub repo** — 1 small agent that does RAG over candidate's own technical blog / notes corpus, using Azure OpenAI + pgvector or Azure AI Search + Microsoft.Extensions.AI. Target: 4–6 weeks. No stars needed — pure portfolio signal.
4. **Apply to Österreichische Post "Technical Specialist – Cloud, On-Prem & AI" (€70K min, karriere.at/jobs/7619955)** — this is the canonical D-Microsoft interview to have within the next 30 days. High candidate fit, salary above stated €60–70K target.
5. **Verify Siemens AT, Porsche Informatik, RBI AI Tribe open .NET-AI roles** — call confirmations or read current boards.

---

## 7. Blunt read — is this a genuine DACH niche or is Post AG an outlier?

**Genuine niche, not outlier.** Three independent signals confirm it:

1. **Microsoft's own product roadmap:** they shipped Agent Framework 1.0 GA for .NET + Python *17 days ago*. A trillion-dollar company does not ship GA product for a non-existent market.
2. **Named DACH-anchor enterprises in production:** RBI (AT), BMW (DE), Siemens (DACH), KPMG (DACH), Fujitsu (DACH). Five publicly-named production users is not marketing — it is anchor customers.
3. **JD surface at Post AG is specific and stack-explicit** (C# + ASP.NET Core + Azure OpenAI + Azure Cognitive Services + Kubernetes, €70K min), not vague "we'd like some AI experience." That kind of specificity only happens when the employer has an existing .NET + AI team that has already interviewed too many Python-only candidates.

**Caveat: the niche is smaller in JD volume than the Python-native AI niche.** Expect **5–25 addressable senior .NET-AI roles in AT + western DE at any moment**, vs. 100+ Python-AI equivalents. But for THIS candidate — 4 YOE .NET, Salzburg-constrained, €60–80K target, already using Azure DevOps and EF Core daily — **the smaller niche is also the higher-hit-rate niche**. Round 06's Python-first CV pivot was premature optimization for a target market the candidate does not live in.

**The right move: run both CV variants. Lead .NET+Azure AI for DACH-local applications; lead Python+Elyt for remote-EU/US applications. The candidate's background supports both, and the two markets do not overlap in hiring filters.**

---

## Sources (non-exhaustive)

- [Visual Studio Magazine — Microsoft Ships Production-Ready Agent Framework 1.0 for .NET and Python (2026-04-06)](https://visualstudiomagazine.com/articles/2026/04/06/microsoft-ships-production-ready-agent-framework-1-0-for-net-and-python.aspx)
- [Visual Studio Magazine — Semantic Kernel + AutoGen = Microsoft Agent Framework (2025-10-01)](https://visualstudiomagazine.com/articles/2025/10/01/semantic-kernel-autogen--open-source-microsoft-agent-framework.aspx)
- [Microsoft Learn — Agent Framework Overview](https://learn.microsoft.com/en-us/agent-framework/overview/)
- [Microsoft Learn — Semantic Kernel → Agent Framework Migration Guide](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-semantic-kernel/)
- [GitHub — microsoft/agent-framework](https://github.com/microsoft/agent-framework)
- [GitHub — microsoft/semantic-kernel](https://github.com/microsoft/semantic-kernel)
- [Microsoft DevBlogs — Semantic Kernel and Microsoft.Extensions.AI: Better Together Part 2](https://devblogs.microsoft.com/semantic-kernel/semantic-kernel-and-microsoft-extensions-ai-better-together-part-2/)
- [European AI & Cloud Summit — Production-ready convergence of AutoGen and Semantic Kernel](https://cloudsummit.eu/blog/microsoft-agent-framework-production-ready-convergence-autogen-semantic-kernel)
- [Microsoft Customer Stories — Raiffeisen Bank International on Azure OpenAI / Azure AI Foundry](https://www.microsoft.com/en/customers/story/21406-raiffeisen-bank-international-azure)
- [Microsoft Source — Siemens Industrial Copilot on Azure OpenAI](https://news.microsoft.com/source/2024/10/24/siemens-and-microsoft-scale-industrial-ai/)
- [Digital Applied — Microsoft Agent Framework 1.0 guide (KPMG / BMW / Fujitsu named users)](https://www.digitalapplied.com/blog/microsoft-agent-framework-1-0-dotnet-python-guide)
- [karriere.at — Österreichische Post Technical Specialist Cloud, On-Prem & AI](https://www.karriere.at/jobs/7619955)
- [stepstone.at — same role](https://www.stepstone.at/stellenangebote--Technical-Specialist-Cloud-On-Prem-AI-Post-Busines-Solutions-GmbH-w-m-d-Wien-Oesterreichische-Post-AG--932104-inline.html)
- [karriere.post.at — IT Specialist Cloud, On-Prem & AI](https://karriere.post.at/job/Wien-IT-Specialist-Cloud,-On-Prem-&-AI-Post-Busines-Solutions-GmbH-(wmd)-Wien-1230/1242678701/)
- [jobwald.at — Post Business Solutions C# Senior Developer with Cloud Experience](https://www.jobwald.at/581674/0/C)
- [karriere.at — LLM jobs aggregate (40 total)](https://www.karriere.at/jobs/llm)
- [stepstone.de — AI Engineer Berlin (121 listings)](https://www.stepstone.de/jobs/ai-engineer/in-berlin)
- [stepstone.de — AI Software Developer Berlin (424 listings)](https://www.stepstone.de/jobs/ai-software-developer/in-berlin)
- [Glassdoor — 214 AI jobs Austria March 2026](https://www.glassdoor.com/Job/austria-artificial-intelligence-jobs-SRCH_IL.0,7_IN18_KO8,31.htm)
- [Glassdoor — 111 AI jobs Vienna March 2026](https://www.glassdoor.com/Job/wien-artificial-intelligence-jobs-SRCH_IL.0,4_IC3174503_KO5,28.htm)
- [Microsoft DevBlogs — Generative AI with LLMs in C# (.NET)](https://devblogs.microsoft.com/dotnet/generative-ai-with-large-language-models-in-dotnet-and-csharp/)
- [is4.ai — Semantic Kernel GitHub star tracker 2026 (~27K stars)](https://is4.ai/blog/our-blog-1/semantic-kernel-microsoft-ai-framework-2026-297)
