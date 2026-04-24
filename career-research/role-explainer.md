# Role explainer — Platform Engineer and AI Engineer

See: [README](README.md) · [options/E-platform-sre.md](options/E-platform-sre.md) · [options/D-applied-ai.md](options/D-applied-ai.md) · [options/M-platform-plus-agent.md](options/M-platform-plus-agent.md) · [candidate.md](candidate.md)

Answers four questions: (A) why these two roles, (B) what they actually are and what skills are required, (C) how fast can the candidate add those skills to his CV, (D) how much of his current SWE knowledge transfers.

---

## A. Why were Platform Engineer and AI Engineer the top choices?

They scored highest on the weighted rubric ([methodology.md#scoring-rubric](methodology.md#scoring-rubric-for-options-evaluation)) across the six evaluation dimensions: AI-resistance, long-term outlook, AT/EU/US market, ease-for-candidate.

### Platform Engineer (Option E)
- **AI-resistance 5/5** — on-call scar tissue, production mutation authority, compliance ownership are not automatable. [Surfing Complexity Feb 2026](https://surfingcomplexity.blog/2026/02/14/lots-of-ai-sre-no-ai-incident-management/) confirmed that AI SRE tools augment but don't replace operators. See [data/ai-replacement.md](data/ai-replacement.md).
- **Long-term 5/5** — NIS2 (AT deadline Oct 2026), DORA (in force Jan 2025), EU AI Act all force platform + compliance maturity. Demand-inelastic through 2031.
- **AT market 4/5** — 154 live postings on karriere.at ([data/at-market.md](data/at-market.md)).
- **Salzburg-accessible** — Porsche Informatik Salzburg HQ runs platform teams; Dynatrace Linz is 1h20 commute or remote; Anexia Vienna/Klagenfurt remote-friendly.
- **Stack Overflow 2025 ranks Cloud Infra Engineer as #1 highest-paid role globally, $165K median** ([link](https://survey.stackoverflow.co/2025/work)).
- **Candidate already has 40% of the skills** — CI/CD at Axess + Docker + Azure + Elyt deployment experience transfers directly.

### AI Engineer (Option D) and the stacked version (Option M)
- **Highest ceiling**: remote-EU senior AI/agent engineer P50 €105K, P75 €122K, P90 €140K (per [data/salary-bands.md](data/salary-bands.md)).
- **Highest market growth**: LLM specialist demand grew +135.8% YoY in 2026 ([Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/)).
- **Elyt was assumed to be a direct portfolio match** — solo-built agentic browser automation platform. Round 06 audit downgraded this: Elyt has no publicly verifiable traction ([data/elyt-audit.md](data/elyt-audit.md)), which dropped D's score from 7.4 → 6.8–7.0 and cost M its premium over E.
- **AI-resistance 3/5** — lower than Platform. Pure RAG plumbing is automatable. The durable sub-niche is *eval design + agent observability*, which stays human because agents can't self-grade at production-critical thresholds.

### Why the stacked version (M = Platform + AI)
Most AI engineers can't operate K8s in production. Most platform engineers can't design agent evals. The intersection is structurally scarce → scarcity premium. "AI Platform Engineer" is the emerging title for this combination.

### Why not the other options
- **A (.NET stay), B (Java), C (React):** high AI-replacement risk (2/5 for .NET, 1/5 each for Java and React). Anthropic Economic Index identifies UI/HTML/JS and CRUD scaffolding as the top-automated categories.
- **F (Security):** best pure durability (5/5 AI-resistance) but 12–18 month ramp with pay dip; kept as HEDGE not primary.
- **G (Data Engineering):** dominated by E + M on pay and durability.
- **H (Distributed Systems IC):** best 5-year destination but moat requires 3–5 years on a qualifying system; accessed through E.
- **I (Embedded):** most AI-resistant but wrong shape — 2–4 year real C/C++ ramp.
- **J (Fintech):** domain moat is real; best accessed THROUGH an E or M role at Bitpanda/Raiffeisen.
- **K (Founding eng):** asymmetric lottery ticket; runs as 5% sidequest.
- **L (Remote-US contractor):** employment structure, not a path. Only wins at AI-tier $180K+ USD given AT tax realities.

Full scorecards: [final.md](final.md) and [options/](options/).

---

## B. What are these roles actually and what skills do they require?

### Platform Engineer / SRE / DevOps Engineer

**What they do (day to day):**
Own the infrastructure that application engineers deploy to. Build internal platforms (developer self-service), keep production healthy, debug when things break, carry pager, design for reliability, automate everything, enforce security and compliance guardrails at the infra layer.

Roughly: "the application teams ship features; we make sure those features run in production and don't fall over."

**Core skill stack (required almost everywhere):**
- **Kubernetes** — container orchestration. Not "I deployed a pod" — "I know why my pod OOM-kills in eu-west-2 after a 1.28 upgrade." Confirmed universal in [data/jd-samples.md](data/jd-samples.md) (8/8 AT senior platform JDs).
- **At least one cloud** — AWS (highest-paid per [CertPayback](https://certpayback.com/aws-certification-roi)), Azure (most common in AT/DACH enterprise), or GCP. Deep on one beats shallow on three.
- **Infrastructure as Code** — Terraform (dominant), Pulumi, sometimes CloudFormation or Bicep.
- **CI/CD** — GitHub Actions, GitLab CI, Jenkins, Azure DevOps, Argo Workflows, Tekton.
- **GitOps** — Argo CD or Flux, for declarative deployment.
- **Observability** — Prometheus + Grafana + OpenTelemetry. Distributed tracing, logging, metrics, SLO design.
- **Linux sysadmin fundamentals** — shell, systemd, networking basics (TCP, HTTP, DNS, TLS), process model, storage.
- **Scripting** — Bash, Python, Go.
- **On-call practice** — you will carry a pager.

**Nice-to-have (differentiators):**
- Service mesh (Istio, Linkerd), eBPF tooling (Cilium)
- Deep networking (BGP, VXLAN, VPCs/peering, load-balancer internals)
- Specific managed services (EKS, AKS, GKE, RDS, S3, EventBridge)
- Security at infrastructure level (policy-as-code with OPA, secrets management with Vault)
- Cost engineering (FinOps basics)
- SRE concepts — error budgets, toil reduction, blameless postmortems

**Certs that actually matter:**
- **CKA** (Certified Kubernetes Administrator) — signal booster, ~€350, ~6 weeks of prep. Not a hard gate in AT JDs ([data/jd-samples.md](data/jd-samples.md)), but ATS filters like it.
- **AWS Solutions Architect Associate or Professional** — SA Associate is the entry; SA-Pro carries the real premium (+25.9% per [CertPayback](https://certpayback.com/aws-certification-roi)).
- **Terraform Associate** — cheap, fast, signals the right mental model.
- **CKS** (Kubernetes Security) — for the security-adjacent platform track.

Not worth for this profile: CCNA, CKAD (redundant if CKA), second cloud certs past one deep.

### AI Engineer (Applied LLM / Agent Engineer — the D4 subtype)

**Disambiguation first.** "AI Engineer" is often used loosely. Four distinct sub-specialties:

| Sub-specialty | What they do | Candidate fit |
|---|---|---|
| **ML Research / Scientist** | Invents new models. PhD required. Papers. | Poor |
| **ML Platform / Infra** | Runs GPU clusters, training infra, inference systems at scale. | Mediocre — this is Option M's Platform leg |
| **Fine-tuning / Training** | LoRA, PEFT, DPO, RLHF. Hybrid of research + eng. | Mediocre |
| **Applied LLM / Agent Engineer** | Builds LLM-powered product features. RAG, agents, evals. | **Strong** — this is D4 |

**What D4 (the relevant one) does day to day:**
Designs and ships LLM-powered features in production: retrieval-augmented generation (RAG), AI agents that take actions via tools, evaluation harnesses to test agent behavior, prompt-engineered workflows, production observability for non-deterministic systems, cost/latency optimization.

**Core skill stack:**
- **Python** — near-universal, 7/9 AI-specific JDs in AT sample required it ([data/jd-samples.md](data/jd-samples.md)). **.NET does not appear in any AI JD sampled.**
- **LLM API fluency** — OpenAI, Anthropic, Gemini, open-weights. Understanding streaming, function-calling, structured output, tool-use patterns.
- **RAG at production scale** — vector DBs (pgvector, Weaviate, Qdrant, Pinecone), chunking strategies, hybrid search (BM25 + vector), reranking (Cohere rerank, BGE rerank), context-window management.
- **Agent frameworks** — LangChain, LangGraph, LlamaIndex, MCP. Don't mistake tutorial fluency for production experience.
- **Eval design** — Langfuse, Braintrust, Arize Phoenix, Inspect AI. This is the durable sub-niche. Building test sets, LLM-as-judge, cost/latency/quality tradeoffs.
- **Prompt engineering** — systematic, not vibes. Few-shot design, chain-of-thought, structured output, prompt-cache optimization.
- **Observability for LLMs** — trace capture, token accounting, failure-mode taxonomies.

**Nice-to-have:**
- Fine-tuning (LoRA, PEFT, DPO) — 25–40% premium per [Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/) but narrow
- vLLM / SGLang / Triton for self-hosting models
- Browser-agent orchestration (Playwright + LLM, Browserbase / Stagehand API)
- MCP (Model Context Protocol) — candidate has this from Elyt

**Certs:** none that matter. Portfolio + public writing > certs.

### Option M (Platform + Agent/AI stacked)
Union of the two above. The title "AI Platform Engineer" is rare in published JDs ([data/jd-samples.md#option-m](data/jd-samples.md)); you find the roles by reading JD content under titles like "Senior Python Backend (LLM)", "Staff SWE Observability", "Agent Platform Engineer".

---

## C. How fast can these skills be added to the CV?

The fungibility premise ([goal.md#premise](goal.md#premise-users-own-reframing-accepted)) says languages/frameworks transfer in 4–8 weeks with AI assist. But platform + AI engineering skills aren't just syntax — several components need reps, not just learning.

### Fast additions (≤ 2 months with focused effort)

| Skill | Effort | Credibility gain |
|---|---|---|
| New language fluency (Go, Python to shipping-level if starting from C#) | 4–8 weeks | High |
| LangChain / LlamaIndex / OpenAI SDK | 2–4 weeks | Medium |
| Terraform basics | 4–6 weeks | Medium |
| Docker + docker-compose (already has) | done | — |
| CI/CD pipeline authoring (already has) | done | — |
| Prompt engineering patterns | 1–2 weeks | Low (table-stakes) |
| RAG scaffolding (toy project) | 2–4 weeks | Low (table-stakes) |
| CKA exam prep | 6 weeks | High signal |
| AWS SA Associate | 4–6 weeks | High signal |

### Medium additions (3–6 months)

| Skill | Effort | Credibility gain |
|---|---|---|
| Kubernetes production-debugging level | 3–6 months deliberate + real workloads | High |
| Terraform at module-authoring level | 2–3 months | Medium |
| Observability at production level (Prom + Grafana + OTel) | 2–3 months | High |
| LLM eval harness design with real test sets | 2–3 months | Very high — this is the durable sub-niche |
| Production RAG with reranking + cost/latency evals | 2–3 months | High |
| AWS Solutions Architect Professional | 2–3 months intensive | High |

### Slow additions (cannot be shortcut)

| Skill | Real timeline | Why |
|---|---|---|
| On-call pattern-recognition | 12–24 months carrying pager | Pattern matching on real failure modes only comes from reps |
| Compliance judgment (NIS2/DORA) | 1–2 years in-role | What auditors accept is experience-gated |
| Distributed systems intuition | 3–5 years on a real system | Jepsen-level thinking |
| Regulated-industry domain (fintech, medtech) | 18–36 months | Context isn't transferable |
| LLM eval taste at production scale | 6–12 months + real agent failures | Knowing which 50 tests catch 90% of regressions |

See [rounds/round-04-fungibility.md](rounds/round-04-fungibility.md) for the full fungibility analysis.

### Realistic timeline-to-CV-credible for the candidate

Assuming current Axess role continues in parallel:

- **Option E (Platform Eng) credible senior-level CV:** 6–9 months from start. Current baseline is ~40% there (Azure DevOps + Docker + CI/CD + Elyt ops). Remaining: CKA, AWS SA Assoc, Terraform Assoc, production-K8s homelab project, one technical blog post about platform work. Hard moat (on-call reflexes) accrues in-role after landing first platform role.
- **Option D (Applied AI) credible mid-senior CV:** 4–6 months. Current baseline is ~60–70% there (Python, LLM APIs, MCP, agent-building via Elyt). Remaining: production eval harness, RAG with reranking project, one blog post about agent failure modes, one OSS component extracted from Elyt. The Elyt audit ([data/elyt-audit.md](data/elyt-audit.md)) means portfolio needs public artifacts to count — candidate's CV-credibility ramp is longer without proof than prior rounds assumed.
- **Option M (stacked):** 9–12 months. Combines E + D ramps but D-leg is faster for this candidate than E-leg, so partial overlap.

"CV credible" means: passes ATS filters + recruiter screen + first-round technical conversation. Full senior-IC credibility after landing + 12 months in-role.

---

## D. Does the candidate's existing SWE knowledge transfer?

**Yes, most of it.** Platform eng and AI eng are not cold pivots for this candidate. They are adjacent specializations of generalist SWE with high transfer rates.

### What transfers directly

| CV asset | Transfers to Platform? | Transfers to AI? | Why |
|---|---|---|---|
| Axess re-architecture (legacy monolith → SOLID/TDD domain services) | ✅ strong | ✅ strong | System design, architecture judgment, refactoring — universal senior signals |
| Axess B2B POS from scratch (sole dev, 20K monthly txns) | ✅ strong | ✅ medium | End-to-end ownership, production responsibility |
| Axess multi-tenant system | ✅ strong | ⚠️ partial | Tenant isolation is a platform concern; relevant for AI-platform too |
| Axess SSO/OAuth custom framework | ✅ strong | ⚠️ partial | Auth/security adjacency; direct platform relevance, indirect AI |
| Axess real-time middleware sync (10+ enterprise customers) | ✅ strong | ✅ medium | Distributed-systems basics, event propagation, reliability |
| Atra trade platform (200 daily cross-border txns, 15 pricing feeds) | ✅ strong | ⚠️ partial | Redis, background job queues, CI/CD in Azure |
| Atra CI/CD Azure DevOps + Docker + staged deployments | ✅✅ very strong | ✅ medium | Direct platform-eng credit |
| Elyt 3-tier (Angular + Express + FastAPI) | ✅ medium | ✅✅ very strong | Microservices, type-safe contracts, orchestration |
| Elyt Node.js orchestrator with BullMQ | ✅ medium | ✅ strong | Job scheduling, Redis, async pipeline patterns |
| Elyt FastAPI execution engine | ✅ medium | ✅✅ very strong | Python production service — directly relevant to AI eng |
| Elyt LLM abstraction (5 providers + MCP) | ⚠️ partial | ✅✅ very strong | Direct AI-eng signal |
| Elyt workflow engine (node-based, timezone batch) | ⚠️ partial | ✅✅ very strong | Agent orchestration proxy |
| Skills: Docker, Azure, CI/CD, GitHub Actions | ✅✅ very strong | ✅ medium | Platform-eng table stakes |
| Skills: TDD, xUnit, Jest, pytest, Playwright | ✅ strong | ✅ strong | Testing discipline transfers everywhere |
| Skills: Python + FastAPI at production level | ⚠️ partial | ✅✅ very strong | Primary AI-eng language |

### What transfers partially

- **C#/.NET expertise** — transfers for the "senior SWE thinking" credit, but direct language relevance is low for AI eng (.NET does not appear in any AI-specific JD sampled) and medium for platform (some orgs use C#/.NET in their infra tooling, e.g. Microsoft-ecosystem shops).
- **Angular / RxJS** — UI work is the most automatable category; transfers minimally to either target.
- **Oracle / PL/SQL** — niche; platform eng uses different primary DBs (PostgreSQL, MySQL), AI eng uses vector DBs.
- **NHibernate, WPF** — irrelevant.

### What DOESN'T transfer (needs new)

For Platform Engineer:
- Kubernetes at production-debugging level — **new skill**
- Terraform at module-authoring level — new
- Deep AWS/Azure (past basic services) — partially new
- Prometheus / Grafana / OTel at production — new
- On-call pattern-recognition — can only be earned in-role
- eBPF, service mesh, advanced networking — new (nice-to-have, not required for entry)

For AI Engineer:
- Production eval harness design — new (but RAG/agent basics candidate already has)
- Vector DB production ops (pgvector, Qdrant at scale) — new
- Agent observability fluency (Langfuse, Braintrust) — new (Elyt lacks this, per audit)
- Fine-tuning / LoRA — new (nice-to-have)

### Net assessment

**Platform Eng (Option E):** ~60% of CV transfers directly. Remaining 40% = K8s + Terraform + cloud cert + on-call. 6–9 months ramp. Axess and Elyt both contribute usable production-experience signals.

**AI Engineer / Agent Engineer (Option D):** ~70% of CV transfers directly IF framed correctly. Elyt is the core transfer vehicle (Python FastAPI + LLM provider abstraction + agent orchestration + MCP). But the [Elyt audit](data/elyt-audit.md) finding — no public traction, landing page targets wrong market — means the transfer degrades at high-credibility employers (Browserbase, Skyvern, Parloa, Langfuse). Remaining 30% = production eval harness + RAG with reranking + one public-signal artifact (blog post or OSS). 4–6 months ramp.

**Option M (stacked):** inherits both transfer rates. ~65% transfer overall. 9–12 months ramp. The candidate is NOT starting from zero — he is reframing + filling specific gaps.

### One-sentence honest summary

Neither Platform Engineer nor Applied AI Engineer is a cold pivot for this candidate — the CV already carries a significant fraction of each role's prerequisites, and the ramp is a matter of filling 3–5 specific skill gaps (plus shipping public signal for AI) rather than learning a discipline from scratch.

---

## E. Will the candidate still be programming in these roles?

Common question, important to answer honestly because there's a misconception that "Platform" or "AI" roles are less code-centric. **Both roles are still programming jobs.** Amount and type of code differs from generic full-stack — but neither is "configuring YAML all day" or "just prompting ChatGPT."

### Platform Engineer — programming time spectrum

Platform is a spectrum from ops-heavy to software-heavy. Titles blur, so the actual code-time depends on the specific role, not the title.

| Sub-role | Typical coding time | What you write |
|---|---|---|
| **Traditional SRE / Ops Engineer** | 30–50% | Bash, Ansible, monitoring-config, runbooks, occasional Python/Go tool. Less product code, more scripts + configuration. Incident response is not coding. |
| **DevOps Engineer (AT enterprise flavor — e.g. Porsche Informatik, Anexia)** | 40–60% | Terraform modules, Helm charts, Kubernetes manifests, CI/CD pipeline code (GitLab CI, GitHub Actions), Python/Go glue scripts, sometimes custom K8s operators. |
| **Platform Engineer (modern internal-developer-platform flavor — Zalando, Celonis, HashiCorp, Grafana)** | **60–80%** | Go or Rust (internal platform products), TypeScript + React (developer portals like Backstage), custom controllers, SDKs, CLIs. **This IS full software engineering — you're shipping a product, your customers are internal devs.** |
| **AI Platform / MLOps Engineer (Dynatrace Davis AI, Celonis agent ops)** | 60–80% | Python + Go mix, eval pipeline code, inference-infra glue, observability instrumentation, agent runtime plumbing. |

[data/jd-samples.md](data/jd-samples.md) confirms: the AT platform JDs sampled (Porsche Informatik, Anexia, BRZ, EDITEL) all require programming-language fluency (Java/TS/JS or Go) on top of K8s/cloud — not just ops skills.

**So for the candidate:** if he takes an Anexia-flavor DevOps role, coding is ~40–60% of his day (similar ratio to his current work, just different code). If he takes a Grafana/Celonis-flavor platform role, coding is 60–80% (similar to his Elyt work — he'd be building products for developers).

### AI Engineer — programming-heavy

Applied AI / Agent Engineering is **fundamentally a software engineering discipline** where LLMs are a new primitive you program against. It is NOT:

- "Prompt engineering" (that's a junior sub-skill, not a career)
- "Pasting into ChatGPT" (that's not a job)
- "Using no-code AI tools" (that's a product role, different from AI engineer)

It IS:

- Writing Python services that call LLM APIs with retry / fallback / cost / latency handling
- Building RAG pipelines (retrieval, reranking, context assembly — all code)
- Designing agent orchestration loops (LangGraph, custom state machines)
- Writing eval harnesses (LLM-as-judge, test-set generation, regression suites) — this is code-heavy
- Building production observability for non-deterministic systems
- Shipping user-facing AI features (full-stack work, backend-heavy)

**Typical coding time: 70–85%** of the job. Higher than generic full-stack because there's less "sit in meetings about UI mockups" overhead and more "write and debug Python services that orchestrate LLM calls."

Candidate's Elyt project is actually a reasonable preview of what AI-eng day-to-day looks like: a Node orchestrator + FastAPI execution engine + provider-agnostic LLM layer = pure software engineering, just with LLM calls as primitives.

### What changes vs his current role

| Current Axess work | Platform Eng | AI Engineer |
|---|---|---|
| Angular components, forms, UI state | Rare (except internal dev portals) | Occasional (AI feature UIs) |
| .NET controllers, EF queries | Replaced by Go / Python / Terraform | Replaced by Python + FastAPI |
| PL/SQL stored procs | Replaced by PostgreSQL / vector DB queries | Replaced by Python data handling |
| Oracle DB schema design | Different DBs, but schema-design skill transfers | Vector DB design, retrieval strategy |
| Code reviews (mentoring juniors) | Still present | Still present |
| Architecture discussions | More (platform is inherently architectural) | Present (agent-system design) |
| Debugging production | **More (this becomes the job)** | Present (non-deterministic failures) |
| Writing tests | TDD transfers; also new: SLO verification, chaos tests | TDD transfers; also new: eval harnesses |

**Net:** candidate will still code roughly the same amount (possibly more at the modern-platform or AI-eng ends of the spectrum). The language changes. The target of the code changes. But "programming" is not being traded away for "meetings" or "ops toil" — modern versions of both roles are builder-shaped jobs.

### If the goal is LESS coding

Then Platform Eng and AI Eng are not the right targets — they are both builder-shaped. Roles that actually reduce coding are:

- **Engineering Manager** (people-management, not IC — wrong for 22yo with 4 YOE)
- **Technical Program Manager / TPM** (coordination, planning, non-IC)
- **Solution Architect** (pre-sales, consulting, diagramming more than coding)
- **Product Manager** (spec-writing, customer interviews, roadmap)
- **Developer Advocate / DevRel** (writing, speaking, demos — some code but not shipping product)

None of these are currently on the options list because (a) the candidate didn't signal interest in less coding, (b) the primary goal stated is pay × durability × AI-resistance, and those non-IC roles either pay less, ramp slower, or are less AI-resistant than Platform/AI eng. If the real goal includes "less code," open a new research round to evaluate these; see [TODO.md](TODO.md) for how to add.

### If the goal is MORE interesting coding (less CRUD, more system-design)

Then Platform Eng (modern internal-developer-platform flavor) and AI Engineer are exactly right. Both trade feature-CRUD work for either (a) infrastructure / developer-product code with more systems thinking, or (b) LLM-orchestration code with novel primitives. The candidate's CV already shows he prefers end-to-end builder work over pure ticket-chopping — both these paths reward that preference.
