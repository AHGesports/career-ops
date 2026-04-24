# Round 11 — Hiring Reality: What Actually Gets You Hired as an AI Engineer

**Date.** 2026-04-21
**Trigger.** Deep research session covering: (1) real hiring data from AI Engineering Field Guide (2,445 JDs, 51 company interview processes), (2) Microsoft .NET AI learning path audit (official MS Learn paths, new certs, Agent Framework v1.0), (3) AT Python AI job scan, (4) community-sourced signals on what gets candidates hired.

**Goal.** Ground the research in real hiring mechanics, not just JD counts. What does the actual interview look like? What does "ready to apply" mean? What's the single biggest differentiator?

See: [../options/D-microsoft.md](../options/D-microsoft.md) · [../data/jd-samples.md](../data/jd-samples.md) · [../data/at-market.md](../data/at-market.md) · [round-09-dotnet-ai.md](round-09-dotnet-ai.md) · [round-10-ai-replacement-deep.md](round-10-ai-replacement-deep.md)

---

## Executive summary

1. **Python = 82.5% of AI engineer JDs globally. RAG = #1 required skill (35.9%). Evaluation = #1 differentiator (only 39.6% of candidates show it; YC startups flag absence as red flag).** Source: AI Engineering Field Guide, 895 JD analysis, Q4 2025–Q1 2026. **HIGH**
2. **Backend engineers → AI engineer in 2–3 months is the consensus. Candidate's production engineering background is the asset, not the liability.** Quote: "Many AI engineers from research backgrounds struggle with production engineering. You already have this." **HIGH**
3. **Microsoft stack update: Semantic Kernel is deprecated (March 2026). Microsoft Agent Framework v1.0 is GA (April 3, 2026). AI-102 retires June 30, 2026; replaced by AI-103 (agents/GenAI, Python-first beta April 21, 2026) and AI-200 (cloud infra AI, beta April 30, 2026).** **HIGH**
4. **New AT Python AI job postings confirm Python AI is real in Austria.** KERN Engineering (LangChain/LangGraph), Swietelsky (RAG/vector DB), ANDRITZ (LLM architecture), Fabasoft (LLM dev), Gebrüder Weiss (RAG/agents/Python), AI DevOps at Michael Page (LLM+Cloud infra), Canva Vienna (Research Engineer – Evaluations). **HIGH**
5. **Take-home assignments appear in 33% of AI engineer interview processes (17/51 companies surveyed). RAG system = 40%+ of all take-home assignments. Eval harness = top signal; its absence is a red flag.** If candidate shows Elyt + adds RAG + eval, he's prepared for the take-home round. **HIGH**
6. **Project deep-dive (Elyt) is the interview weapon — if framed correctly.** "Why did you choose this approach" > "I used LangChain." Frame around decisions and trade-offs, not tech names. **HIGH**

---

## 1. Real hiring data — AI Engineering Field Guide

**Source:** `github.com/alexeygrigorev/ai-engineering-field-guide` — research by Alexey Grigorev based on 2,445 job descriptions, 51 company interview processes with disclosed detail. Q4 2025 / Q1 2026. This is the most rigorous public dataset on AI engineer hiring mechanics available.

### 1.1 Skill frequency from 895 JDs (AI-first roles only)

**Programming languages:**
| Language | Jobs | % |
|---|---|---|
| Python | 738 | **82.5%** |
| TypeScript | 209 | 23.4% |
| Java | 133 | 14.9% |
| Go | 101 | 11.3% |
| SQL | 88 | 9.8% |
| C# / .NET | Not in top-10 | — |

**GenAI skills:**
| Skill | Jobs | % |
|---|---|---|
| **RAG** | 321 | **35.9%** ← #1 |
| Prompt engineering | 260 | 29.1% |
| LLMs | 227 | 25.4% |
| LangChain | 168 | 18.8% |
| Agents | 129 | 14.4% |
| OpenAI API | 78 | 8.7% |
| LangGraph | 72 | 8.0% |
| LlamaIndex | 52 | 5.8% |
| Anthropic API | 49 | 5.5% |

**Ops skills in AI-first roles:**
| Skill | Jobs | % |
|---|---|---|
| Docker | 277 | — |
| CI/CD | 262 | — |
| Kubernetes | 260 | — |
| MLOps | 107 | — |
| Terraform | 104 | — |

**Cloud:**
- AWS: 359 jobs (>Azure, >GCP)
- Azure: 214 jobs
- GCP: 205 jobs

**Database/vector:**
- Vector databases: 97 jobs
- PostgreSQL: 83 jobs
- Pinecone: 53 jobs
- Redis: 43 jobs
- Weaviate: 41 jobs

**Key structural finding:**
> "93% of AI-first roles require skills BEYOND just GenAI. Only 1.4% are pure GenAI."

Full-stack expectations within AI-first roles:
- Backend skills required: 49.6%
- Frontend skills required: 31.4%
- Both: 21.6%

**Fine-tuning:** Only 4.0% of AI-first roles list fine-tuning as primary responsibility. 80.8% don't mention it at all. **Focus on RAG + agents, not fine-tuning.**

### 1.2 The #1 differentiator: evaluation

> "39.6% of AI-first roles explicitly require evaluation skills (model evaluation, monitoring, observability, testing, quality). RAG and agents are becoming baseline. The ability to measure whether an AI system actually works — LLM-as-judge, golden datasets, hallucination detection, drift monitoring — is what separates candidates."

> "Red flag if candidate doesn't start with evals." — YC startups

Candidate's current Elyt status: **no eval harness.** This is the single gap most likely to cost an offer. Fix before applying.

### 1.3 Backend → AI engineer transition

> "The software engineering overlap is significant. Realistically, you can take a software engineer and make them a ready AI engineer in two to three months."

> "Your advantage as a backend engineer: you know how to build things reliably. You know testing, deployment, monitoring. Many AI engineers coming from research backgrounds struggle with production engineering. You already have this."

Candidate-specific starting position:
- Already done (Elyt + Axess + Atra): agents ✅, LLM APIs ✅, MCP ✅, orchestration ✅, Docker ✅, CI/CD ✅, multi-provider abstraction ✅
- Must add: RAG + Azure AI Search + eval harness → 3–4 weeks
- Estimated time to apply-ready: **6–8 weeks** (faster than 2–3 month baseline because Elyt covers most ground)

---

## 2. What the interview actually looks like

**Source:** AI Engineering Field Guide — 51 companies with disclosed interview processes.

### 2.1 Process structure

Median: **4 rounds**. Range: 2–7. Duration: 3–6 weeks.

| Round | Duration | What they test |
|---|---|---|
| Recruiter screen | 15–30 min | Salary fit, basic background |
| Technical / coding | 45–60 min | LeetCode-style, sometimes AI-flavored |
| AI/ML deep-dive | 45–90 min | RAG, hallucinations, fine-tuning vs prompting, agent design |
| Take-home / project | 1–7 days | Build RAG or agent system |
| System design | 60 min | Scale LLM apps, cost/latency optimization |
| Project deep-dive | 30–60 min | Walk through YOUR project, defend decisions |
| Behavioral | 30–60 min | STAR format, ownership in ambiguous work |

### 2.2 Take-home assignments (33% of companies)

17 of 51 companies include take-home. Additional 5 use paid work trials. Analysis from 100+ GitHub repos of actual submissions:

**What companies ask:**
| Category | Frequency |
|---|---|
| RAG system (doc upload, vector DB, citation support) | 40%+ |
| Agent with tools (tool-calling, multi-step, orchestration) | 30%+ |
| Conversational AI (chatbot, voice assistant) | 20%+ |
| Document processing (PDF parsing, extraction) | 15% |
| LLM-as-judge evaluation harness | 10%+ |

**Real assignment examples:**
- "Build RAG chatbot. Must say 'I don't have that information' for out-of-scope queries. Answers must come from retrieved context only. Evaluate on 7-question set across 3 categories."
- "Build customer support agent. Detect and refuse PII requests. No raw rows passed to LLM — aggregates only."
- "Build an agentic RAG system. Must use 100% open-source. Evaluate with RAGAS metrics."
- "Refactor a messy RAG app into clean architecture. Preserve all external API contracts. Ensure testability without running services."
- "Build multi-agent pipeline: Spec Builder → Storyteller → LLM Judge → Rewriter. Up to 2 revision cycles."

**Evaluation criteria companies use:**
- Functional correctness
- Code quality / architecture / extensibility
- **Evaluation methodology** (do you build an eval harness?)
- Production readiness (caching, monitoring, cost optimization, PII handling)
- Performance targets (typically <2s p95 latency)
- Testing + documentation
- **Defence round** — the walkthrough interview is often more important than the code itself

**Biggest mistake:** not building an eval harness. Quote from YC startups: "Red flag if candidate doesn't start with evals."

**Candidate's prep:** Elyt already handles orchestration and tool-calling. Add RAG + eval before applying → take-home is now a Elyt demo variant, not a cold build.

### 2.3 Project deep-dive (Elyt is the weapon)

Format: 30–60 min, progressive depth, can occupy an entire senior interview. Interviewers ask:

- "Walk me through an AI project you built end-to-end."
- "Why did you choose that approach over alternatives?"
- "What went wrong? What was harder than expected?"
- "Is there an actual eval framework, or is it vibes-based?"
- "How do you monitor post-deployment for drift?"
- "What would you do differently?"

**What they evaluate:**
- Did you DRIVE decisions or execute someone else's plan?
- Can you explain the WHY, not just the WHAT?
- Can you go 3 levels deep when probed?
- Do you frame around impact or technology names?

**Key signal:** "Best candidates frame around impact ('reduced response time by 40%'), not technology names ('used LangChain and Pinecone')."

**How to frame Elyt:**

❌ "I built Elyt with LangChain, FastAPI, and Angular using a 3-tier architecture."

✅ "I needed workflow orchestration that could run AI agents in parallel with zero drift between TypeScript orchestrator and Python execution engine. I solved it by generating cross-language types automatically from a single schema — which eliminated an entire category of runtime bugs. The tradeoff was 2 weeks of build time upfront, but it meant I could iterate on agent logic without touching integration code."

**Decision points to prepare:**
- Why provider-agnostic LLM abstraction? (5 providers in Elyt — multi-vendor resilience, avoid lock-in, users switch models within workflows)
- Why 3-tier? (separation of concerns: UI state vs orchestration logic vs execution environment)
- Why FastAPI execution engine? (Python LLM ecosystem, isolation from TypeScript orchestrator, zero shared state)
- Why cross-language type generation? (contract enforcement, eliminates runtime type drift bugs)
- What would you do differently? (honest answer — probably: add eval harness from day 1, instrument Langfuse traces earlier)

---

## 3. Microsoft .NET AI stack update

### 3.1 Semantic Kernel deprecated

**March 2026:** Semantic Kernel officially deprecated. Microsoft Agent Framework v1.0 is the direct replacement.

Migration summary (11 key changes):
- Namespace: `Microsoft.SemanticKernel` → `Microsoft.Agents.AI`
- Agent creation: `Kernel` builder → `.AsAIAgent()` extension on any `IChatClient`
- Tool registration: `[KernelFunction]` attribute → `AIFunctionFactory.Create()`
- Invocation: `IAsyncEnumerable<AgentResponseItem>` → single `AgentResponse`
- DI: `services.AddKernel()` → `services.AddKeyedSingleton<AIAgent>()`
- Agent types: `ChatCompletionAgent`, `OpenAIAssistantAgent` (separate) → single `ChatClientAgent`

**Bottom line:** Elyt will need to be ported to Agent Framework, not Semantic Kernel, to be current. Semantic Kernel tutorials on the internet are now outdated. Ignore them.

### 3.2 Microsoft Agent Framework v1.0 (GA April 3, 2026)

NuGet:
```
Microsoft.Extensions.AI.Abstractions    ← IChatClient, IEmbeddingGenerator
Microsoft.Extensions.AI                 ← middleware, DI, telemetry, function invocation
Microsoft.Agents.AI                     ← Agent Framework core
Microsoft.Agents.AI.Foundry             ← Foundry-specific provider
Microsoft.Extensions.AI.Evaluation      ← eval harness (safety + quality evaluators)
```

Quickstart:
```csharp
AIAgent agent = new AIProjectClient(
    new Uri("https://your-foundry.services.ai.azure.com/api/projects/your-project"),
    new AzureCliCredential())
  .AsAIAgent(model: "gpt-4o", instructions: "You are a helpful assistant.");

Console.WriteLine(await agent.RunAsync("What is the largest city in France?"));
```

Supported providers: Microsoft Foundry, Azure OpenAI, OpenAI, Anthropic (direct + Foundry), Ollama, Amazon Bedrock, Google Gemini, GitHub Models.

### 3.3 Official Microsoft learning paths (current)

| Path | Modules | Status | URL |
|---|---|---|---|
| Develop generative AI apps in Azure (AI-3016) | 6 | Active | `learn.microsoft.com/en-us/training/paths/develop-generative-ai-apps/` |
| Develop AI agents on Azure (AI-3026) | 9 | Active | `learn.microsoft.com/en-us/training/paths/develop-ai-agents-azure/` |
| Develop generative AI apps with SK | 5 | **DEPRECATED** | — |

**AI-3026 modules 1–9:**
1. Agents with Microsoft Foundry + VS Code
2. Custom tools integration
3. MCP Tools with Azure AI Agents ← candidate already knows MCP
4. RAG for agents — Foundry IQ (enterprise knowledge)
5. M365 integration
6. Agent-driven workflows
7. **Microsoft Agent Framework in C#** ← core module
8. **Multi-agent orchestration** ← core module
9. A2A protocol

### 3.4 Certification landscape update

| Cert | Exam | Status | Target |
|---|---|---|---|
| Azure AI Engineer Associate | AI-102 | **Retiring June 30, 2026** | Skip |
| Azure AI Apps & Agent Developer | **AI-103** | Beta April 21, 2026; GA June 2026 | D-Microsoft cert |
| Azure AI Cloud Developer | **AI-200** | Beta April 30, 2026; GA July 2026 | Option M cert |

**AI-103 covers:** agents + GenAI apps + RAG + Microsoft Foundry + Azure AI services. Python-first in exercises but C# accepted. Beta = discounted/free exam window.

**AI-200 covers:** containerized compute (AKS, Container Apps), vector databases (Cosmos DB, pgvector, Redis), event-driven AI pipelines, serverless, distributed observability. This is the Option M cert — AI infrastructure, not just AI apps.

**Recommendation:** Do NOT rush AI-102 (10 weeks for a retiring cert, 40% covers vision/NLP you'll never use). Target AI-103 beta (June), AI-200 beta (July) if pursuing M.

### 3.5 Best practical learning resources (ranked)

| Resource | Type | Level | Key coverage | URL |
|---|---|---|---|---|
| SteveSandersonMS/dotnet-ai-workshop | Workshop | Intermediate | Chat → embeddings → vector DB → RAG → function calling → evaluation | `github.com/SteveSandersonMS/dotnet-ai-workshop` |
| microsoft/Agent-Framework-Samples | Samples | Beginner→Advanced | 28+ samples: agents, tools, MCP, A2A, RAG, workflows, evaluation | `github.com/microsoft/Agent-Framework-Samples` |
| dotnet/eShopSupport | Reference app | Advanced | Production .NET Aspire AI: RAG, classification, eval with grounded Q&A | `github.com/dotnet/eShopSupport` |
| dotnet/ai-samples | Samples | Intermediate | `Microsoft.Extensions.AI.Evaluation` — safety + quality + agent evaluators | `github.com/dotnet/ai-samples` |
| Jamie Maguire MAF course | Video series | Intermediate | MAF from zero: state, tools, human-in-loop, MCP, RAG, real agents | `jamiemaguire.net/index.php/2026/02/24/new-free-course-understanding-microsoft-agent-framework/` |
| Generative AI for Beginners .NET v2 | Structured course | Beginner→Advanced | 5 lessons + 28 samples on .NET 10 + MEAI | `github.com/microsoft/Generative-AI-for-beginners-dotnet` |

### 3.6 Recommended study order for candidate

Given Elyt (LangChain + LLM APIs + MCP), skip all beginner content. Compressed ramp:

```
Day 1–3    Read: "LLMs in C# 2026" devblogs.microsoft.com post
           Install Microsoft.Agents.AI; port 1 Elyt LLM call to IChatClient

Day 4–7    SteveSandersonMS workshop modules 1–6
           Focus module 6 (RAG) — build on Elyt's docs corpus

Day 8–10   Agent-Framework-Samples: 00.ForBeginners + 05.Providers (MCP)
           Port Elyt orchestrator to Microsoft Agent Framework

Day 11–14  AI-3016 path (6 modules) — Azure Foundry specifics

Day 15–21  AI-3026 path (9 modules) — modules 7+8 critical
           Module 3 (MCP) = fast (you already know it)

Day 22–25  dotnet/ai-samples — Microsoft.Extensions.AI.Evaluation
           Add eval harness to Elyt agent outputs

Day 26–30  eShopSupport — read full codebase for production patterns

Month 2    AI-103 beta exam (June GA)
```

Result: Elyt runs on `Microsoft.Extensions.AI` + Agent Framework + Azure AI Foundry + Azure AI Search + eval harness. CV reads correctly for D-Microsoft JDs.

---

## 4. New AT Python AI job postings (April 2026)

From this session's karriere.at scan. Confirms D4-Python is also a real AT market, not just remote-EU.

| Role | Employer | URL | Key stack | Notes |
|---|---|---|---|---|
| AI Engineer – Data & ML Solutions | KERN Engineering | [karriere.at/7776353](https://www.karriere.at/jobs/7776353) | LLMs, Transformers, **LangChain/LangGraph**, RAG Pipelines | Classic D4-Python profile |
| Agentic AI Engineer | Netural GmbH | [karriere.at/10015040](https://www.karriere.at/jobs/10015040) | LLM apps, agent architectures, **LangGraph, Google ADK, LlamaIndex** | Also takes Azure OpenAI = D-Microsoft crossover |
| Senior AI Engineer | Swietelsky AG | [karriere.at/7775843](https://www.karriere.at/jobs/7775843) | RAG pipelines, vector DB, **performance RAG architectures** | Construction/engineering sector |
| AI & Digitalization Engineer | ANDRITZ | [karriere.at/7781894](https://www.karriere.at/jobs/7781894) | LLM-based architectures, Python | Industrial manufacturing |
| AI DevOps Engineer – LLM & Cloud | Michael Page | [karriere.at/7781279](https://www.karriere.at/jobs/7781279) | **LLM + Cloud infra** | Option M hybrid role |
| AI/ML Engineer | Fabasoft | [karriere.at/7531765](https://www.karriere.at/jobs/7531765) | LLM use cases concept→deployment, Python | Document/ECM software company |
| AI Engineer | Gebrüder Weiss | [karriere.at/7635420](https://www.karriere.at/jobs/7635420) | GenAI, LLMs, agents, prompt eng, Python, **RAG architectures** | Logistics/transport sector |
| Senior ML Engineer – NLP | XUND Solutions | [karriere.at/10005859](https://www.karriere.at/jobs/10005859) | NLP, ML, Python | HealthTech |
| Research Engineer – Evaluations | **Canva** Vienna | [lifeatcanva.com](https://www.lifeatcanva.com/en/jobs/6000000000498204/research-engineer-evaluations/) | Evaluation systems, research | Canva's Vienna office → eval specialist role |

**Canva Vienna (Research Engineer – Evaluations) is a notable find.** Eval engineering as a standalone role in Vienna, at a global tech company. Consistent with the field guide finding that "eval is the #1 differentiator." Candidate should bookmark for Month 3–4 application (requires demonstrated eval work).

**Patterns observed across Python AI AT sample:**
- LangChain/LangGraph appear by name in multiple JDs — confirming they're expected vocabulary in AT Python AI roles
- RAG is universal — every posting mentions it
- Vector databases (implicit in RAG) appear in most
- Industrial/logistics employers (ANDRITZ, Gebrüder Weiss, Swietelsky) — AI adoption is broader than just tech companies in AT
- Python is explicit or implied in every role
- Eval as a role (Canva) = emerging specialization as predicted

---

## 5. Contradictions / refinements vs. prior rounds

| Prior claim | Status | Update |
|---|---|---|
| "Python is absent from AT AI JDs" (round 06) | **CONTRADICTED.** | Round 11 finds 8+ Python AI AT JDs with specific stacks named. |
| "Semantic Kernel is the D-Microsoft tool to learn" (round 09) | **SUPERSEDED.** | SK deprecated March 2026. Candidate should learn Agent Framework v1.0. |
| "AI-102 cert is the path for D-Microsoft" | **SUPERSEDED.** | AI-102 retires June 30, 2026. Target AI-103 (beta this week) and/or AI-200 (beta April 30). |
| "Eval is optional for AI roles" (implied) | **CONTRADICTED.** | Eval is the #1 differentiator per field guide data; 39.6% of roles require it explicitly. |
| "Backend → AI takes 6–12 months" (implied in round timelines) | **CONTRADICTED.** | Field guide consensus: 2–3 months for backend engineers. Candidate = 6–8 weeks. |
| "Take-home assignment: candidate builds a demo" | **REFINED.** | Best practice is to start with eval harness, then build the system. The defence walkthrough is as important as the code. |

---

## 6. TODO updates from this round

**Resolved / partially resolved:**
- P0.10 (volume-verify D-Microsoft pool): partially complete. New D-Microsoft AT JDs found: Netural (Agentic AI), Techem (SK+C#+Azure OpenAI), A1 (Azure OpenAI+Foundry), ZETA (C#/Python+Azure), Celonis remote-DACH (.NET+C#+Azure OpenAI). Pool estimate tightens to 10–20 accessible senior roles AT, 30–50 DACH. Still short of 15-JD target.
- P4.1 (interview format): substantially complete. See §2 above.

**New P0 items:**
- **P0.12 — Port Elyt to Microsoft Agent Framework v1.0** (NOT Semantic Kernel). 2–3 weekends. The single highest-ROI portfolio action. Semantic Kernel is deprecated; any demo built on it is outdated on day 1.
- **P0.13 — Add RAG + eval harness to Elyt** before first AI engineer application. RAG = #1 required skill; eval absence = red flag. Use Azure AI Search + `Microsoft.Extensions.AI.Evaluation`.
- **P0.14 — Apply to AI-103 beta exam** (GA June 2026, beta discounted). Best cert path post AI-102 retirement.
- **P0.15 — Prepare Elyt deep-dive narrative.** Frame 5 key architectural decisions with "why X not Y" reasoning. Practice going 3 levels deep on: (a) provider abstraction, (b) 3-tier split, (c) cross-language type generation, (d) parallel execution model. This is the interview, not LeetCode.
- **P0.16 — Apply to Netural GmbH Agentic AI Engineer** and **A1 Telekom AI Expert** as D-Microsoft calibration roles (both currently open, both match D-Microsoft profile, both mention LLM/agent/Azure explicitly).

---

## Sources

- [AI Engineering Field Guide — GitHub](https://github.com/alexeygrigorev/ai-engineering-field-guide)
- [AI Engineering Field Guide — Backend Engineer Path](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/learning-paths/from-backend-engineer.md)
- [AI Engineering Field Guide — Skills (895 JDs)](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/role/02-skills.md)
- [AI Engineering Field Guide — Interview Process (51 companies)](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/01-interview-process.md)
- [AI Engineering Field Guide — Take-Home Assignments](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/06-home-assignments.md)
- [AI Engineering Field Guide — Project Deep Dive](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/03-project-deep-dive.md)
- [Microsoft Agent Framework Overview — Microsoft Learn](https://learn.microsoft.com/en-us/agent-framework/overview/)
- [Semantic Kernel → Agent Framework Migration Guide](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-semantic-kernel/)
- [AI-3026: Develop AI Agents on Azure](https://learn.microsoft.com/en-us/training/paths/develop-ai-agents-azure/)
- [AI-3016: Develop Generative AI Apps](https://learn.microsoft.com/en-us/training/paths/develop-generative-ai-apps/)
- [AI-200T00 Course — Azure AI Cloud Developer](https://learn.microsoft.com/en-us/training/courses/ai-200t00)
- [Microsoft Agent Framework v1.0 GA Announcement](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/)
- [AI-103 New Cert Announcement](https://techcommunity.microsoft.com/blog/skills-hub-blog/new-microsoft-certified-azure-ai-apps-and-agents-developer-associate/4494126)
- [AI-102 Retirement — fulldumps.com](https://www.fulldumps.com/ai-102-is-being-retired-in-2026-should-you-still-take-it-or-move-to-ai-103/)
- [Agent Framework Samples — GitHub](https://github.com/microsoft/Agent-Framework-Samples)
- [eShopSupport Reference App — GitHub](https://github.com/dotnet/eShopSupport)
- [SteveSandersonMS dotnet-ai-workshop — GitHub](https://github.com/SteveSandersonMS/dotnet-ai-workshop)
- [Canva Vienna — Research Engineer Evaluations](https://www.lifeatcanva.com/en/jobs/6000000000498204/research-engineer-evaluations/)
- [karriere.at — AI Engineer jobs (70+ current)](https://www.karriere.at/jobs/ai-engineer)
