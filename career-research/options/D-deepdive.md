# Option D — Deep dive: what "AI Engineer" actually means

Companion to [D-applied-ai.md](D-applied-ai.md). Answers five candidate questions:
1. What are these technologies?
2. Is SWE → AI Engineer a real transition?
3. Which companies accept that transition?
4. What does "AI Engineer" even mean? (job title is overloaded)
5. Do they all use the same stack?

Plus concrete CV keep/remove guidance.

See: [D-applied-ai.md](D-applied-ai.md) · [M-platform-plus-agent.md](M-platform-plus-agent.md) · [../data/jd-samples.md](../data/jd-samples.md) · [../data/elyt-audit.md](../data/elyt-audit.md) · [../candidate.md](../candidate.md)

---

## 1. What "AI Engineer" actually means — the title is overloaded

"AI Engineer" is four different jobs hiding under one title. Before stacking, the candidate must pick which one he's targeting.

| Sub-type | What they do | Typical background | Typical stack | Candidate fit |
|---|---|---|---|---|
| **D1 ML Research / Scientist** | Designs new models, publishes papers, novel architectures. | PhD in ML / CS. Publications at NeurIPS/ICML. | PyTorch, JAX, big-cluster training infra, papers-as-work-product. | Poor. No PhD, no papers. |
| **D2 ML Platform / Infra Engineer** | Runs model-serving infrastructure at scale. GPU orchestration, inference clusters, training infra. | SWE with specialization, or ex-ML researcher moved to eng. | Kubernetes + GPU operators, Ray, vLLM / SGLang / Triton, MLflow / Weights & Biases, Kubeflow. | Mediocre. This is Option M's platform leg. |
| **D3 Fine-tuning / Post-training Engineer** | Fine-tunes open-weights models for customer use cases. LoRA, PEFT, DPO, RLHF. | Hybrid ML+SWE. Knows the math but ships code. | Python, PEFT, Axolotl, Unsloth, DPO, Hugging Face Transformers, eval frameworks. | Mediocre — doable but narrower than D4. |
| **D4 Applied LLM / Agent Engineer** | Ships LLM-powered product features. RAG, agents, tools, evals. **No model training, no GPU clusters.** Calls APIs, orchestrates, measures. | **Regular SWE specialized.** Full-stack, backend, sometimes ex-frontend. | Python + LangChain/LangGraph + vector DB + eval tools + LLM APIs. | **Strong fit. This is where Elyt lives.** |

**The candidate's target is D4.** Everything in this file assumes D4 unless noted. When we say "AI Engineer" going forward, we mean "Applied LLM / Agent Engineer."

---

## 2. Do all AI Engineers use the same stack?

**No.** Even within D4, stacks diverge by product type. Rough pattern:

### The universal core (every D4 job uses these)
- **Python.** Near-universal. [data/jd-samples.md](../data/jd-samples.md) confirms 7/9 AI JDs sampled required it; .NET appeared in zero.
- **LLM provider APIs.** OpenAI SDK, Anthropic SDK, at minimum. Structured output, function-calling, streaming, token accounting.
- **A vector database.** pgvector is the "boring default"; Qdrant and Weaviate are popular managed alternatives.
- **At least one agent/chain framework.** LangChain is the default; LangGraph (state-machine-based) is the current direction; LlamaIndex for document-heavy work.
- **An eval tool.** Langfuse (open-source), Braintrust (commercial), Arize Phoenix, Inspect AI. Nobody ships production LLMs without at least one.

### Product-type variance

| Product type | Extra stack components | Example employer |
|---|---|---|
| **Agent / browser-automation** (Elyt territory) | Playwright / Browserbase SDK, tool-calling patterns, MCP | Browserbase, Skyvern, Stagehand, Lindy |
| **RAG for enterprise docs** | Unstructured.io, advanced chunking, hybrid search (BM25 + vector), reranking (Cohere / BGE) | Glean, Danswer, Hebbia |
| **Voice AI / real-time** | WebSockets, streaming STT/TTS, barge-in handling, latency-budget engineering | Parloa, ElevenLabs, Sesame |
| **Code AI / developer tools** | Tree-sitter, language servers, codebase indexing, diff/patch generation | Continue.dev, Cursor, Sourcegraph |
| **Fine-tuned or self-hosted** | vLLM / SGLang, Ollama, LoRA adapters, quantization | Together.ai, Modal, Replicate |
| **Observability / agent analytics** | ClickHouse, trace formats, OpenTelemetry GenAI spec | Langfuse, Arize, LangSmith |

The candidate's Elyt matches the agent/browser-automation bucket, which is the hottest segment in 2026 ([Anthropic acquired Vercept mid-2025 for exactly this reason](https://www.anthropic.com)).

---

## 3. What each technology actually is (plain-language glossary)

### Foundation layer — the LLM itself
- **LLM API** — You send text (a prompt), the model sends text back. Plus tool-calling (the model returns "call function X with arg Y"), streaming (tokens arrive one at a time), and structured output (JSON guaranteed by the model). Candidate already does this with 5 providers via Elyt.
- **Prompt engineering** — Writing the text you send the model so you get the output you want. Few-shot examples, chain-of-thought, structured schemas. Treated as a systematic discipline, not vibes.
- **Function calling / Tool use** — The LLM can ask your code to run a function and then continue with the result. This is what makes "agents" possible.

### Retrieval layer — giving the LLM context
- **RAG (Retrieval Augmented Generation)** — Instead of asking the LLM a question blind, you first fetch relevant documents and include them in the prompt. "Ground the answer in these sources."
- **Vector embedding** — Convert text to a fixed-length list of numbers (a vector) such that similar meaning → similar numbers. This lets you find "related documents" mathematically.
- **Vector database** — A database optimized to store embeddings and find nearest-neighbors fast. **pgvector** = extension for PostgreSQL (boring, reliable, most common for production). **Qdrant**, **Weaviate**, **Chroma** = specialized vector DBs. **Pinecone** = managed SaaS.
- **Hybrid search** — Combine keyword search (BM25, classic) + vector search (semantic). Keywords catch exact matches; vectors catch meaning. Neither alone is enough for real use cases.
- **Reranking** — After retrieval, run a smaller model over the top 50 candidates to reorder them by relevance to the actual query. **Cohere Rerank** and **BGE Reranker** are the standard tools. Often the difference between a toy RAG and a production one.

### Orchestration layer — building agents
- **LangChain** — The Python framework for chaining LLM calls with other tools. Lego blocks: "call LLM → parse output → call API → call LLM again." Most popular.
- **LangGraph** — LangChain's successor pattern: instead of chains, you model agents as state machines / directed graphs. Node = a step; edge = transition. Standard for production agents in 2026.
- **LlamaIndex** — Competitor to LangChain, focused on document-heavy retrieval. Loses ground to LangGraph.
- **MCP (Model Context Protocol)** — Anthropic's open standard for connecting LLMs to tools. Like USB for AI agents: plug any MCP-compliant tool into any MCP-compliant model. Candidate already does this in Elyt.
- **Agent frameworks (alternatives)** — CrewAI, AutoGen, Smolagents, OpenAI Swarm, Mastra. All trying to solve the same problem (orchestrate multi-step LLM workflows with tools).

### Evaluation layer — the durable sub-niche
- **Evals** — Tests for non-deterministic LLM outputs. You build a test set ("given input X, good output looks like Y"), then grade the model's responses. Without evals, you cannot improve an LLM product — you can only guess.
- **LLM-as-judge** — Use a strong LLM (e.g. Claude Opus) to grade the outputs of a weaker production LLM. Cheaper than human graders; good enough for many cases.
- **Langfuse** — Open-source observability + eval for LLM apps. Captures every trace, gives you dashboards, lets you build eval datasets from production traffic. Berlin-based, recently joined ClickHouse.
- **Braintrust** — Commercial equivalent, used at OpenAI/Notion/Airtable. Strong eval UX, dataset management, regression tracking.
- **Arize Phoenix** — Open-source alternative focused on evals + observability. Commercial tier too.
- **Inspect AI** — From the UK AI Safety Institute. Rigorous eval framework, good for benchmarking.

### Advanced / optional
- **Fine-tuning** — Training a copy of an open-weights model on your data so it's better at your task. **LoRA** (Low-Rank Adaptation) and **PEFT** (Parameter-Efficient Fine-Tuning) let you do this on 1–2 GPUs instead of a cluster. **DPO** (Direct Preference Optimization) is the modern post-training method. Tools: **Axolotl**, **Unsloth**, Hugging Face PEFT library.
- **Inference servers** — Software that serves open-weights models efficiently. **vLLM** (PagedAttention, fastest batching), **SGLang** (structured generation), **Triton** (NVIDIA's inference server), **Ollama** (dev-friendly, local). Only relevant if you self-host models.

---

## 4. Is SWE → AI Engineer a real transition?

**Yes. It's the standard path.** Most applied AI engineers in 2026 were SWEs in 2023. The industry explicitly wires this transition because:

1. **Most AI product work is still software engineering.** Writing Python services, designing APIs, handling async, testing, debugging, observability — 80% of an Applied AI Engineer's day is indistinguishable from a senior backend engineer's day. The LLM call is one line inside a bigger system.
2. **LLM knowledge transfers horizontally, not vertically.** You don't need to know how transformers are trained to ship a RAG product, any more than a web developer needs to understand TCP congestion control to ship an HTTP API. Use the abstraction; understand the primitives enough to debug.
3. **Hiring companies explicitly state this.** Parloa's Senior Python Backend JD asks for "real LLM experience" on top of strong backend — not "ML degree." Langfuse hires on OSS contributions + software craft.
4. **The candidate's Elyt project is literally a proof-of-transition artifact.** Built a 3-tier agentic platform with LangChain-style orchestration, multi-provider LLM abstraction, MCP. That's the D4 job description.

### What slows or blocks the transition

- **Top-tier US labs (Anthropic research, OpenAI research, DeepMind):** filter on CS/ML degree + publications for research roles. **Applied teams at those same companies** hire SWEs with AI portfolios — candidate can target those, not research roles.
- **Without a portfolio/OSS signal at hiring time, SWE→AI is CV-weak.** The round 06 Elyt audit ([../data/elyt-audit.md](../data/elyt-audit.md)) showed Elyt has no public signal — the transition story needs something else to point to.
- **4 YOE is the edge** of the Parloa-tier filter (5 YOE explicit). Candidate will pass some filters and bounce off others.

### The transition in one sentence

SWE → AI Engineer is a real, well-trodden path; what blocks it isn't credential, it's *public-artifact demonstration* of AI work — and the candidate has the work already (Elyt), just not the public-artifact version of it yet.

---

## 5. Which companies accept SWE → AI Engineer?

Three tiers by filter-friendliness.

### Tier 1 — explicitly hire SWE-background applied AI engineers

No filter friction; you are exactly what they want.

**DACH-accessible:**
- **Parloa** (Berlin, €80–105K Senior Python Backend, voice-AI agents) — caveat: 5 YOE explicit
- **Langfuse** (Berlin + remote EU, now ClickHouse) — OSS-background preferred; candidate needs OSS signal
- **Continue.dev** (Berlin + remote, open-source code AI)
- **Celonis AI** (Munich + Vienna)
- **Tricentis** (Vienna, AI-testing)
- **Anyline** (Vienna, applied CV + LLM)
- **Dynatrace Davis AI** (Linz)
- **RBI AI Tribe** (Vienna — rare bank agent team)
- **n8n** (Berlin, workflow automation — Elyt-adjacent)
- **Mistral** (Paris, but DACH-friendly remote subset)
- **DeepL** (Köln + remote)
- **Aleph Alpha** (Heidelberg)
- **Black Forest Labs** (Freiburg)

**Remote-US-accessible (via contractor or EOR):**
- **Browserbase / Stagehand** (SF, but EU hires) — product is literally what Elyt does
- **Skyvern** (SF, open-source, remote-friendly)
- **Factory** (SF + remote)
- **Lindy** (NYC + remote)
- **Pylon** (SF + remote)
- **Decagon** (SF + remote EU)
- **Continue.dev** (mostly remote)
- **LangChain** (SF + remote)

### Tier 2 — hire SWE→AI but with filter friction

You pass eventually, but the top of the funnel is harder.

- **Anthropic Applied** (not research) — hires SWEs with AI portfolios, remote EU via EOR. Strong filter but not degree-gated.
- **OpenAI Applied** — same.
- **Sierra, Harvey, Cresta** (enterprise AI) — hire SWEs but want visible work in AI.
- **Cohere** (Toronto + remote) — similar filter.
- **Hugging Face** — mixed; platform side hires SWEs; research side doesn't.
- **Scale AI** — accessible; filter on ML-adjacent work.

### Tier 3 — skeptical of SWE→AI transition without more

You'd need more than a SWE CV + Elyt to pass.

- **DeepMind research roles** — PhD-gated.
- **Mistral core research** — research-gated.
- **FAIR / Meta AI Research** — same.
- **AI2 / Allen Institute** — research org.
- **Jane Street / Citadel AI teams** — quant-gated more than AI-gated.

### Practical target list for this candidate (3–6 months)

Focus Tier 1 DACH + Tier 1 remote-US-accessible. Skip Tier 2 until OSS + blog signal exists. Ignore Tier 3 entirely.

---

## 6. CV keep / remove / add for Option D positioning

Current CV is structured for generic full-stack DACH enterprise. D positioning requires restructuring — not rewriting from scratch. General SWE credit stays; specific-tech emphasis shifts.

### KEEP and LEAD WITH

| Item | Why it leads for D |
|---|---|
| **Python + FastAPI (Elyt execution engine)** | Universal AI-eng language. Put this in "Skills" top line. |
| **LLM API integration (OpenAI, Anthropic, Gemini + 2 others)** | Directly what applied AI engineers do. |
| **MCP (Model Context Protocol)** | Rare on CVs in 2026; differentiator. |
| **Agentic AI / LangChain experience (Elyt workflow engine)** | Core D4 work. |
| **Node.js orchestrator at Elyt (26 routes, 94 modules)** | Shows production backend scale in AI context. |
| **BullMQ / Redis / async job queues** | AI workflows are async — directly relevant. |
| **System design, re-architecture (Axess)** | Senior-SWE signal that transfers to AI eng without specificity. |
| **Solo shipping ability** (POS from scratch, Elyt end-to-end) | Hiring managers at startups/scaleups weight this highly. |
| **Playwright / Puppeteer** | Browser-agent work — exact match for Browserbase/Skyvern tier. |
| **General SWE: TDD, code review, SOLID, OpenAPI, contract-first, gRPC, REST** | Universal professional signal. |
| **Atra real-time platform (cross-border txns, webhook pipelines)** | Async + event-driven + integrations — all transfer. |
| **English fluent, German professional** | Unchanged; key DACH differentiator. |

### KEEP but DEPRIORITIZE (don't remove; don't lead)

| Item | How to demote |
|---|---|
| **C# / .NET 8** | Move from "Primary" to "Also worked with." Do not put in headline. |
| **Angular, RxJS** | Put in a secondary "Frontend" section, not primary stack. |
| **Oracle / PL/SQL** | Keep in "Databases" list; don't mention in summary. |
| **ASP.NET Core, EF Core** | List in skills, don't feature. |
| **SSO / OAuth / JWT** | Keep — security adjacency is useful. Mention once. |
| **Azure DevOps, GitHub Actions** | Keep — relevant for AI deployments too. Single line. |

### REMOVE or HIDE from D-targeted CV

| Item | Why |
|---|---|
| **NHibernate** | Dead-tech signal; weak for AI roles. |
| **WPF** | Irrelevant. |
| **ASP.NET MVC** | Legacy; signals "old-stack engineer." |
| **Bootstrap, SCSS** | Dated frontend; hiring signal is weak for AI. |
| **SQL Server specifically** | "SQL" alone is enough. |
| **"Full-stack Software Engineer"** as title | Replace with "Applied AI / Backend Engineer" or "AI-focused Software Engineer" depending on target. |

### ADD (build these in the 3-month plan)

| Item | How to add |
|---|---|
| **LangGraph** | Refactor Elyt workflow engine to use LangGraph state machines. Blog the refactor. |
| **Langfuse or Braintrust** | Add eval harness + trace observability to Elyt. Publish eval dashboard screenshot. |
| **pgvector or Qdrant production experience** | Build a RAG project over a real corpus (Elyt docs, your own notes, a dataset). |
| **Cohere / BGE reranking** | Add to the RAG project. Show benchmark numbers before/after reranking. |
| **One OSS component** | Extract from Elyt: LLM-provider abstraction, cross-language type-gen, or workflow engine. Target 30+ GitHub stars. |
| **Blog posts** | "Agent failure modes in production" · "Evals for browser agents" · "Cost/latency tradeoffs in LangGraph". |
| **Agent eval benchmarking project** | Build a public benchmark for browser agents — directly rewards Elyt expertise. |

### Headline rewrite

**Current (inferred from [../cv.md](../../cv.md)):**
> Full-stack Software Engineer with strong experience in building end-to-end systems using .NET, Angular, Node.js, Python, and SQL/NoSQL databases.

**D-targeted:**
> Applied AI / Agent Engineer. 4+ years building production systems end-to-end. Founder of Elyt — agentic browser automation platform (Python + FastAPI + LangChain-style orchestration + multi-provider LLM abstraction + MCP). Strong systems-design background; ships solo.

Lead with what target employers search for. Keep substance honest (don't overclaim).

### Summary structure

**D-targeted summary flow:**
1. Applied AI + systems-design fluency (one sentence)
2. Elyt (flagship, one sentence, link to OSS component when it exists)
3. Professional experience (Axess + Atra, systems-design-heavy framing, avoid "enterprise .NET developer" language)
4. Open-source + blog links

---

## 7. Honest net read

The SWE → Applied AI Engineer transition for this candidate is **real, not aspirational**, but requires concrete artifact-shipping in the next 3 months to become interview-credible at Tier 1 employers. The technologies are learnable — candidate already uses most of them via Elyt. What's missing is the *public-proof version* of what he's already built.

The candidate is not "switching careers." He is **narrowing a generalist identity into a specialist identity that pays better and is more AI-resistant**. All the general SWE knowledge stays; the specific-tech emphasis shifts; Python + LLM work becomes foreground instead of background.

See [D-applied-ai.md#verdict](D-applied-ai.md) for the scoring summary. See [../plans/action-plan-12mo.md](../plans/action-plan-12mo.md) for the full execution plan.
