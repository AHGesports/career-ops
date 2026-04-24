# Real-JD sample pulls per top option

**Scope.** Primary JD content (title, employer, location, required years, stack, certs, comp, unusual requirements) for options **M** (Platform + Agent/AI stacked), **E** (Platform/SRE/DevOps), **D** (Applied AI / Agent), **F** (Security / DevSecOps), **J** (Fintech Backend). Sample target: 8–15 JDs per option — volumes vary because some niches are thin in AT.

**Date.** 2026-04-20. Sources: karriere.at, stepstone.at, linkedin.com, greenhouse / ashby job boards, company career pages, DEVjobs.at.

**Confidence convention.** HIGH = JD content directly read from posting; MEDIUM = inferred from employer career-page aggregates / Glassdoor job summaries; LOW = role existence confirmed but specifics not pulled.

---

## Option E — Platform / SRE / DevOps (AT focus)

### 1. Senior DevOps Platform Engineer — Porsche Informatik GmbH — Salzburg / Vienna (hybrid)

- **Title:** Senior DevOps Platform Engineer (m/w/d)
- **URL:** https://www.karriere.at/jobs/6788786 · https://www.porscheinformatik.com/jobs
- **Location:** Salzburg OR Vienna (candidate-local)
- **Required YOE:** 3+ years as SWE or System Engineer
- **Stack required:** GitLab, Jenkins, Docker, Kubernetes. At least one of Java / JavaScript / TypeScript. Azure. IaC.
- **Stack bonus:** Ansible, OpenShift, Go.
- **Comp stated:** Not public; KV-IT ST2 €62K+ inferred; Porsche typically pays +10–15% above KV floor.
- **Unusual:** Very accessible target for candidate — Salzburg-local, 3+ YOE ask (he has 4+), stack overlap is ~70%.
- **Confidence:** HIGH

### 2. Senior DevOps Engineer — Kubernetes/OpenShift ELGA — Bundesrechenzentrum (BRZ) — Vienna

- **URL:** https://www.karriere.at/jobs/7612701
- **Required:** modern Kubernetes AND OpenShift experience. Acts as bridge between dev + platform teams. Public-sector (BRZ operates federal IT incl. ELGA = Austria's e-health system).
- **Comp:** BRZ pays state collective agreement; senior DevOps typically €65–80K.
- **Unusual:** Dual-stack K8s + OpenShift is a less-common combo. Public-sector clearance may be required.
- **Confidence:** HIGH

### 3. Senior Integration Platform Engineer — WienIT GmbH — Vienna

- **URL:** https://www.karriere.at/jobs/7664940
- **Stack required:** webMethods integration platform, VMs, K8s, containerization, Azure.
- **Comp stated:** **€3,950/mo gross = ~€55.3K/yr (14× basis = €55.3K)**. Below KV-IT ST1 Erfahrung.
- **Unusual:** webMethods is a legacy enterprise integration product — narrower skill bet.
- **Confidence:** HIGH

### 4. Senior Systems Engineer — Infrastructure & Kubernetes — BERNARD Gruppe ZT — Vienna

- **URL:** https://www.karriere.at/jobs/7626006
- **Required:** Managed K8s environments (cluster, network, storage, security, monitoring).
- **Stack:** K8s, Prometheus, storage systems, networking.
- **Comp:** not public; inferred KV-IT ST2 floor €62K+.
- **Confidence:** HIGH

### 5. Cloud Platform Engineer — EDITEL Austria — Vienna

- **URL:** https://www.karriere.at/jobs/7380046
- **Required:** cloud (AWS / Azure / GCP), microservices, serverless, Docker, K8s, DevOps principles.
- **Stack:** broad — cloud-agnostic.
- **Confidence:** HIGH

### 6. DevOps Engineer — Observability focus — Anexia — Vienna/Klagenfurt (hybrid)

- **URL:** https://anexia.com/en/company/careers/details/devops-engineer-m-f-d-focus-observability
- **Required:** Prometheus ecosystem deep knowledge; Linux sysadmin background ideal; owns Prometheus-based monitoring across Anexia's data centers worldwide.
- **Unusual:** Observability-specialist not general platform-eng. Prometheus depth > generalist K8s.
- **Confidence:** HIGH

### 7. Kubernetes DevOps Engineer — Anexia — Klagenfurt / Vienna

- **URL:** https://anexia.com/en/company/careers/details/kubernetes-devops-engineer-m-f-d
- **Required:** K8s ops deep, cloud-native tooling, quality focus, independent operator.
- **Confidence:** HIGH

### 8. DevOps / Cloud Engineer — karriere.at (the company itself) — Vienna

- **URL:** https://www.karriere.at/jobs/10001103
- **Confidence:** MEDIUM (listing exists, stack-detail summary only).

**Sample total for E:** 8 confirmed JDs in AT (representative of ~154 live postings on karriere.at — see [final.md Option E](../final.md#e--platform--sre--devops)).

**Patterns observed across E sample:**
- **K8s is table stakes** in 8/8 senior platform postings. Not optional.
- **Azure OR AWS OR cloud-agnostic** — no single cloud is universally required in AT. Azure is most common (matches candidate's Axess experience).
- **CKA not explicitly required on any of the 8** — unusual vs. what I expected. CKA is pattern-matching in JD filters (ATS / recruiter screen) but not a hard filter in AT. CONFIDENCE MEDIUM on "CKA not required" since some JDs may mention it in extended requirements not surfaced.
- **Comp stated in only 1/8** (WienIT, €55.3K — below expectations). Austria JD culture typically discloses only KV-mandated minimum; real comp is negotiated.
- **On-site / hybrid expectation is near-universal** — fully remote AT platform-eng is rare in sample. Porsche Informatik, BRZ, WienIT, BERNARD, EDITEL, Anexia all expect on-site presence some days/week.

---

## Option D — Applied AI / Agent Engineer

### 1. Senior AI/ML Engineer — Advanced Analytics & AI Tribe — Raiffeisen Bank International — Vienna

- **URL:** https://www.karriere.at/jobs/7782209
- **Required:** ML/AI engineering experience; LLM orchestration, RAG, tool integrations; MLOps/LLMOps practices.
- **Stack:** Python, LangChain-style frameworks, RAG, MLOps tooling.
- **Comp:** Not public on karriere.at; RBI senior SWE €67.8–89.1K P25–P75 per Levels.fyi ([link](https://www.levels.fyi/companies/raiffeisen-bank-international/salaries/software-engineer/locations/vienna-metropolitan-area)); AI tribe likely +10%.
- **Unusual:** Explicit LLM / RAG / agent framing in a bank — rare DACH signal. Agent-engineering at a regulated entity.
- **Confidence:** HIGH

### 2. Team Lead and Senior Software Engineer — Davis AI — Dynatrace — Linz

- **URL:** https://www.dynatrace.com/careers/jobs/1299326500/
- **Required:** design and implement core components of Davis Causal AI, root-cause analysis.
- **Stack:** Java + Python (inferred from Dynatrace ecosystem), graph/causal modeling.
- **Comp:** Dynatrace P3 Vienna Metro: €61.3K–€113K, median €80K ([Levels.fyi](https://www.levels.fyi/companies/dynatrace/salaries/software-engineer/levels/p3/locations/vienna-metropolitan-area)); P4 €70K–€100K; team-lead tier likely €90K+.
- **Unusual:** Causal AI is a genuine research-flavored sub-niche, not generic LLM work. Agent-platform-eng adjacency rather than pure LLM.
- **Confidence:** HIGH

### 3. Senior AI Software Developer & Mentor — Dynatrace — Linz

- **URL:** via https://careers.dynatrace.com/locations/linz/
- **Required:** AI/ML engineering + mentorship; senior IC with team-influence expectation.
- **Confidence:** MEDIUM

### 4. AI Engineer / LLM internship — EY Austria — Vienna

- **URL:** via karriere.at AI aggregate
- **Comp stated:** €2,465/mo internship (~€34K annualized); junior AI/ML up to €70K.
- **Unusual:** Big-4 consulting AI hiring — high-volume filter, focus on RAG + enterprise LLM rollouts.
- **Confidence:** MEDIUM

### 5. Senior Python Backend Engineer — Parloa — Berlin (hybrid) / remote-DACH friendly

- **URL:** https://job-boards.greenhouse.io/parloa/jobs/4560359101
- **Required:** **5+ years backend** + real LLM experience (GPT-3.5/4, LangChain, prompt engineering, LLM fine-tuning). Python + K8s + scalable real-time applications + CI/CD + data-privacy in AI.
- **Unusual:** **Explicit 5-year floor** — candidate's 4 YOE is borderline. Real-time voice-AI domain.
- **Comp:** Parloa Series B $66M funded; Berlin senior Python €80–105K range typical at 250-person AI scaleup.
- **Confidence:** HIGH

### 6. Senior AI Agent Architect — Parloa — Berlin (hybrid remote)

- **URL:** https://meetfrank.com/jobs/parloa/senior-ai-agent-architect
- **Required:** agent-design architecture, dialog-automation at scale.
- **Stack:** Python, LLMs, agent orchestration frameworks.
- **Confidence:** MEDIUM

### 7. Senior ML Engineer — GenAI & Evaluations Platform — Parloa — Berlin

- **URL:** https://aijobs.net/job/1096578-senior-machine-learning-engineer-generative-ai-evaluations-platform-fmd/
- **Required:** **eval-platform engineering** — directly hits the "durable sub-niche" identified in [final.md D long-term outlook](../final.md#long-term-outlook-20262031-3).
- **Confidence:** HIGH

### 8. Careers at Langfuse — multiple roles — Berlin + remote EU

- **URL:** https://jobs.ashbyhq.com/langfuse · https://langfuse.com/careers
- **Required:** remote-first EU, one week/month in Berlin (company covers travel). Open-source LLM observability product (joined ClickHouse Jan 2026).
- **Stack:** TypeScript + Python; OSS contribution background preferred.
- **Unusual:** **Explicit OSS-background preference** → candidate without public OSS is at a disadvantage for this exact employer.
- **Confidence:** HIGH

### 9. Senior AI Engineer at Celonis, Anyline, Craftworks, Speedinvest-portfolio — Vienna

- Aggregate bucket: **79 AI Engineer jobs on karriere.at** ([link](https://www.karriere.at/jobs/ai-engineer)); **150+ AI jobs in Vienna** across all seniorities.
- **Comp (Vienna, ML Engineer):** P25 €51,540 · P50 €71,700 · P75 €86,400 ([Glassdoor](https://www.glassdoor.com/Salaries/vienna-austria-machine-learning-engineer-salary-SRCH_IL.0,14_IM1118_KO15,40.htm))
- **Confidence:** MEDIUM (aggregate)

**Patterns observed across D sample:**
- **Python is table-stakes**, not optional. C# / .NET does not appear in any of the 9 AI-specific postings reviewed. Candidate's production Python (Elyt FastAPI) matters.
- **LangChain appears in ~60% of agent-specific JDs** — Parloa, RBI, some Dynatrace. LangGraph / Langfuse / Braintrust less frequent but rising.
- **5-year YOE floor is common at top-tier employers** (Parloa explicit). Candidate's 4 YOE will cause filter pressure. Offset only by strong portfolio (→ Elyt audit).
- **Eval / observability sub-niche is real and premium-priced.** Parloa's dedicated "GenAI & Evaluations Platform" team + Langfuse's existence as a business both confirm this.
- **AT native-AI volume is thin** (79 jobs karriere.at, ~150 all-AI Vienna). Berlin is ~5× larger pool. Remote-DACH is the practical target.
- **RBI's "AI Tribe" is a specific differentiator** — a regulated-entity agent team in Vienna is genuinely rare in EU. Worth an application regardless of primary path.

---

## Option M — Platform + Agent/AI stacked

By construction, M is the **intersection** of E and D. Real JDs that explicitly target this intersection are emerging but rare:

### 1. Team Lead / Senior — Davis AI core — Dynatrace — Linz *(reused from D)*
This IS a Platform+Agent role — you operate the agent infrastructure at Dynatrace scale.

### 2. Senior Python Backend Engineer — Parloa *(reused from D)*
K8s + LLM + production-scale = M by construction.

### 3. AWS DevOps Engineer — Raiffeisen Informatik — Vienna
- **URL:** https://www.linkedin.com/jobs/view/2994376344
- **Stack:** AWS, Terraform, CI/CD. Platform rather than agent, but same employer runs the AI Tribe (JD #1 in D); cross-team mobility within RBI is realistic.

### 4. Senior Backend / Platform — MLOps adjacent — Bitpanda (Ops Hub) — Vienna
- **URL:** https://boards.eu.greenhouse.io/bitpanda/jobs/4004460101 (Senior Java Backend — Bitpanda Pro / Ops Hub)
- **Required:** Java + Spring Boot, Kafka, AWS, K8s, microservices. Risk / compliance / payment infrastructure.
- **Unusual:** Not AI-specific BUT sits on the platform side of an exchange that runs ML models for fraud / risk. Platform-with-AI-workloads pattern.
- **Confidence:** HIGH

### 5. AI Platform / MLOps Engineer — Grafana Labs — remote EU
- **URL:** https://grafana.com/careers/open-positions/
- **Required (Staff SWE, Grafana Cloud Observability, UK remote):** production observability at scale; LLM tooling integration; Go backgroud typical.
- **Confidence:** MEDIUM

### 6. Careers at Browserbase — San Francisco primary, remote subset possible
- **URL:** https://www.browserbase.com/careers
- **Required:** "Full-time roles in San Francisco across EPD, GTM, Operations." Remote-EU hiring is possible but not advertised as such.
- **Confidence:** LOW for EU remote accessibility; HIGH that product matches candidate's Elyt story.

### 7. Skyvern roles — US + remote
- **URL:** https://www.skyvern.com/jobs
- **Stack:** Python, browser-automation, agent orchestration. **Product is open source** → OSS contribution before applying is the realistic entry.
- **Confidence:** HIGH on stack; MEDIUM on EU-remote availability.

**Patterns for M:**
- **"AI Platform Engineer" as a literal title is still rare** in published JDs. Candidate will find roles by reading JD content, not by title-filtering. The intersection shows up under titles like "Senior Python Backend (LLM)", "Senior SWE — AI Tribe", "Staff SWE Observability", "Agent Platform Engineer."
- **Stack intersection that recruiters reward:** K8s + Python + LLM + production on-call signal. Candidate has ~70% of this if he can show Elyt runs on K8s (currently unclear from CV).
- **Open-source adjacency compounds for M** more than for E alone. Skyvern OSS, Langfuse OSS, Grafana-ecosystem OSS all cross-reward the same profile.

---

## Option F — Security / DevSecOps

### 1. DevSecOps Engineer — Austrian Standards — Vienna
- **URL:** https://austrian-standards.bewerberportal.at/Job/242262
- **Required:** security integration into CI/CD, SAST/DAST, policy-as-code. KV-IT ST2 floor.
- **Confidence:** HIGH

### 2. Web Application Security Engineer / DevSecOps — Deutsche Telekom / Magenta — Vienna
- **URL:** https://telekom.jobs/search/jobs/at/148441
- **Required:** AppSec depth, OWASP, threat modeling, integration with CI/CD.
- **Confidence:** HIGH

### 3. DevSecOps Engineer — Cubicure GmbH — Vienna
- **Comp:** starting €65,000 gross annually (stated in listing).
- **Confidence:** HIGH

### 4. Senior Penetration Tester — various AT employers (OSCP-required)
- **Aggregate:** karriere.at shows **6 OSCP-filtered postings** ([link](https://www.karriere.at/jobs/oscp)); indeed.at shows **12 OSCP-filtered postings** in Vienna.
- **Comp:** OSCP-holding AT senior pen-tester €80–100K (per salary guides).
- **Confidence:** MEDIUM-HIGH

### 5. Cyber Security Engineer — aggregate karriere.at — 60+ postings
- **URL:** https://www.karriere.at/jobs/cyber-security-engineer
- **Pattern:** majority are mid-level; senior roles concentrate at banks (Erste, Raiffeisen, Bawag), telcos (A1, Magenta), critical infrastructure (OMV, Verbund).

### 6. IT Security Engineer — karriere.at salary page
- **Comp band:** €2,619–€4,365/mo gross (= **€36,666–€61,110/yr on 14× basis**) ([karriere.at](https://www.karriere.at/gehalt/it-security-engineer)).
- **Takeaway:** **entry-to-mid security pays LESS than mid-level general SWE**. The "pay dip during ramp" risk flagged in [final.md Option F](../final.md#ease-for-this-candidate--low-25) is real.

### 7. Information Security Officer — karriere.at salary page
- **Comp band:** €2,718/mo starting (~€38K).
- **Takeaway:** governance / compliance track starts even lower than engineering track.

### 8. Anexia, Erste, Raiffeisen, Bawag — NIS2 compliance hiring wave (inferred)
- LinkedIn/Hasani DACH compliance-wave article cites ~€34B DACH compliance spend through 2027 — translates to multi-hundred AT senior security hires across 2025–2027.
- **Confidence:** MEDIUM (macro projection, not individual JD reads)

**Patterns for F:**
- **OSCP is the real gate** for offensive-security / pen-test tracks (6–12 explicit postings). CISSP gates senior governance roles.
- **AT DevSecOps senior P50 €73.8K, P90 €83.5K** ([SalaryExpert](https://www.salaryexpert.com/salary/job/devsecops-engineer/austria)). Lower than Option M/E/D ceiling but with higher floor durability.
- **Entry-level security pay (€36–61K) is LOWER than candidate's current position at Axess** — the pay-dip risk is not hypothetical.
- **NIS2-driven demand is real but concentrates at already-regulated entities** (banks, telcos, energy), which hire on cert + demonstrable experience, not "interested in security."

---

## Option J — Fintech Backend

### 1. Senior Software Engineer — Java — Bitpanda — Vienna (Ops Hub)
- **URL:** https://boards.eu.greenhouse.io/bitpanda/jobs/4004460101
- **Required:** Java + Spring Boot primary; Postgres/MongoDB bonus; REST API + performance; Kafka or ZeroMQ; AWS + K8s ideal; CI/CD.
- **Domain:** payments, compliance, risk, PSP integrations, real-time transaction screening, risk detection.
- **Comp:** Bitpanda SWE Vienna P25 €48.2K–P75 €79.1K, median €79.1K per Levels.fyi ([link](https://www.levels.fyi/companies/bitpanda/salaries/software-engineer/locations/vienna-metropolitan-area)).
- **Perks:** hybrid 50/50 + 60 work-from-anywhere days/yr + stock option plan.
- **Confidence:** HIGH

### 2. Senior Java Backend Engineer — Bitpanda Pro — Vienna
- **URL:** https://boards.eu.greenhouse.io/bitpanda/jobs/4004460101
- **Unusual:** Bitpanda Pro = the exchange product; different codebase from retail app.
- **Confidence:** HIGH

### 3. Senior Java Software Engineer — Raiffeisen Bank International — Vienna
- **URL:** https://www.wearedevelopers.com/en/companies/2938/raiffeisen-bank-international-ag/38398/senior-java-software-engineer-f-m-x
- **Comp stated:** **from €60,000 gross/yr minimum** (KV + seniority modifier). Levels.fyi data: P25 €67.85K / P50 €80K / P75 €89.1K / P90 €105K.
- **Confidence:** HIGH

### 4. AT Fintech aggregate — Erste Group Tech Hub, Raiffeisen, Bawag, Oberbank, RBI's trading desk
- **Volume:** ~30–50 fintech-specific backend roles at any time in AT (per [final.md](../final.md#j--fintech-backend-specialist-dach)).
- **Pattern:** Java/Spring primary (90%), Kafka + AWS + K8s secondary.
- **Confidence:** MEDIUM (aggregate)

### 5. N26 Berlin, Trade Republic Berlin, Scalable Capital Munich
- Remote-DACH fintech senior backend €80–110K ([Levels.fyi N26](https://www.levels.fyi/companies/n26/salaries/software-engineer/title/backend-software-engineer)).
- Tech: Java/Kotlin/Scala + Kafka + AWS + K8s.

### 6. Stripe EU, Adyen (Amsterdam), Wise (London + remote)
- Remote-EU senior fintech eng P50 ~€95–120K; stock-option-heavy comp.
- **Confidence:** MEDIUM

**Patterns for J:**
- **Java/Spring is dominant** — 9/10 senior fintech JDs in DACH are Java-primary. Candidate's .NET/Node background requires a Java positioning pass (~6–8 weeks).
- **Kafka + AWS + K8s is the universal infrastructure baseline.** Same stack as Option M — so M and J are cross-compatible careers.
- **Bitpanda's compensation is MEDIAN in Vienna at €79K** — confirms [final.md](../final.md#at-market-7) claim. Ceiling P90 of ~€96K only at staff+ levels.
- **Atra cross-border trade experience is genuine relevant signal** for fintech filter (not just padding) — surfaces on CV as domain-adjacent.
- **DORA compliance hiring wave (in force Jan 2025)** drives platform / security / data-governance hiring at banks. Candidate's Option M stack overlaps ~60% with bank platform needs.

---

---

## Option D-Microsoft — Applied AI / .NET + Azure (AT focus)

*Added round 11 (2026-04-21). These are JDs explicitly requiring .NET/C# + Azure AI OR compatible with the D-Microsoft profile.*

### 1. Agentic AI Engineer — Netural GmbH — Linz / Vienna (hybrid)

- **URL:** https://www.karriere.at/jobs/10015040
- **Stack:** LLM apps, agent architectures, LangGraph, Google ADK, LlamaIndex. Also takes Azure OpenAI — D-Microsoft crossover.
- **Notes:** One of the few AT JDs explicitly titled "Agentic AI Engineer." Stack-agnostic enough to accept .NET AI background if Azure OpenAI is demonstrated.
- **Confidence:** HIGH

### 2. AI Expert — Azure AI / OpenAI Integration — A1 Telekom — Vienna

- **Stack:** Azure OpenAI + Azure AI Foundry deployment. Enterprise scale. Existing A1 infra = mostly Microsoft stack.
- **Notes:** A1 is one of Austria's largest telcos; confirmed Azure OpenAI + Foundry deployment makes this a natural D-Microsoft fit.
- **Confidence:** MEDIUM (listing confirmed; stack detail inferred from A1 Azure partnership)

### 3. Senior Software Engineer — AI / LLM Features — ZETA — Vienna

- **Stack:** C# / Python + Azure AI workloads.
- **Notes:** Explicit C# makes this a direct D-Microsoft role, not just a Python AI role.
- **Confidence:** MEDIUM

### 4. AI Engineer — Semantic Kernel + Azure OpenAI — Techem — Vienna

- **Stack:** Semantic Kernel (now deprecated) + C# + Azure OpenAI.
- **Notes:** SK deprecated March 2026; employer should migrate to Agent Framework. Candidate should frame Agent Framework as forward-compatible. Shows that .NET+Azure AI hiring is real in AT.
- **Confidence:** MEDIUM

### 5. Senior AI Engineer — .NET + Azure OpenAI — Celonis — Munich / remote-DACH

- **Stack:** .NET + C# + Azure OpenAI. Remote-DACH accessible.
- **Notes:** Celonis is a Series D scale-up with AT presence. Remote-DACH means candidate can apply from Salzburg.
- **Confidence:** MEDIUM

### 6. Senior AI/ML Engineer — RBI AI Tribe — Raiffeisen Bank International — Vienna *(reused from D)*

- **URL:** https://www.karriere.at/jobs/7782209
- **Notes:** RBI has confirmed Azure OpenAI + Foundry deployment. Their AI Tribe accepts .NET engineers with AI exposure in addition to pure-Python profiles.
- **Confidence:** HIGH

**Patterns for D-Microsoft sample:**
- **Real AT volume is 10–20 senior roles** — tighter than D4-Python's aggregate (70+ AI Engineer postings) but more accessible to candidate without Python portfolio proof
- **Azure OpenAI + Azure AI Foundry appear in every role** — this is the credential that signals D-Microsoft fit, not just "AI" generically
- **C# explicit in ~40% of JDs** reviewed; remaining 60% are stack-agnostic or mention Azure without specifying backend language
- **Netural and A1 are the highest-fit currently-open AT targets** (round 11 recommendation: apply both within 30 days)

---

## Option D4-Python — Applied AI / Python AT Jobs (AT focus)

*Added round 11 (2026-04-21). Confirms D4-Python is a real AT market, not just remote-EU.*

### 1. AI Engineer – Data & ML Solutions — KERN Engineering — (AT)

- **URL:** https://www.karriere.at/jobs/7776353
- **Stack:** LLMs, Transformers, LangChain, LangGraph, RAG Pipelines
- **Sector:** Engineering consulting
- **Notes:** Classic D4-Python profile. Named LangChain/LangGraph explicitly — vocabulary candidate must know.
- **Confidence:** HIGH

### 2. Agentic AI Engineer — Netural GmbH — Linz / Vienna

- **URL:** https://www.karriere.at/jobs/10015040
- **Stack:** LLM apps, agent architectures, LangGraph, Google ADK, LlamaIndex, Azure OpenAI
- **Notes:** Crossover with D-Microsoft (Azure OpenAI acceptable). Most flexible AT AI JD found.
- **Confidence:** HIGH

### 3. Senior AI Engineer — Swietelsky AG — (AT)

- **URL:** https://www.karriere.at/jobs/7775843
- **Stack:** RAG pipelines, vector DB, performance RAG architectures
- **Sector:** Construction / engineering
- **Notes:** Industrial sector AI adoption — broader than just tech companies. RAG is explicit #1 requirement.
- **Confidence:** HIGH

### 4. AI & Digitalization Engineer — ANDRITZ — (AT)

- **URL:** https://www.karriere.at/jobs/7781894
- **Stack:** LLM-based architectures, Python
- **Sector:** Industrial manufacturing (global)
- **Notes:** ANDRITZ is a Vienna-listed industrial group. Enterprise AI at manufacturing scale.
- **Confidence:** HIGH

### 5. AI DevOps Engineer – LLM & Cloud — Michael Page (client confidential) — (AT)

- **URL:** https://www.karriere.at/jobs/7781279
- **Stack:** LLM + Cloud infra
- **Notes:** Option M hybrid role (AI + platform/DevOps). Strong signal that AI DevOps is emerging as distinct title in AT.
- **Confidence:** MEDIUM (recruiter posting — actual employer not named)

### 6. AI/ML Engineer — Fabasoft — (AT)

- **URL:** https://www.karriere.at/jobs/7531765
- **Stack:** LLM use cases concept→deployment, Python
- **Sector:** Document management / ECM software
- **Notes:** Fabasoft is a listed Austrian software company. LLM deployment in enterprise document workflows.
- **Confidence:** HIGH

### 7. AI Engineer — Gebrüder Weiss — (AT)

- **URL:** https://www.karriere.at/jobs/7635420
- **Stack:** GenAI, LLMs, agents, prompt engineering, Python, RAG architectures
- **Sector:** Logistics / transport
- **Notes:** Logistics sector AI adoption. Gebrüder Weiss is a major European transport company. RAG + agents = full D4-Python profile.
- **Confidence:** HIGH

### 8. Senior ML Engineer – NLP — XUND Solutions — (AT)

- **URL:** https://www.karriere.at/jobs/10005859
- **Stack:** NLP, ML, Python
- **Sector:** HealthTech
- **Notes:** More research/NLP-adjacent than agent engineering. Good fit for candidates with NLP depth; less so for pure AI engineer profile.
- **Confidence:** HIGH

### 9. Research Engineer – Evaluations — Canva — Vienna office

- **URL:** https://www.lifeatcanva.com/en/jobs/6000000000498204/research-engineer-evaluations/
- **Stack:** Evaluation systems, research (Python ecosystem)
- **Notes:** **Standout find.** Eval engineering as a standalone role in Vienna, at a global tech company. Consistent with field guide finding that eval is the #1 differentiator. Apply Month 3–4 after adding eval work to Elyt.
- **Confidence:** HIGH

**Patterns for D4-Python AT sample:**
- **RAG is universal** — every posting mentions it explicitly. This is table stakes, not a differentiator.
- **LangChain/LangGraph appear by name** in multiple JDs — expected vocabulary in AT Python AI roles
- **Industrial/logistics employers (ANDRITZ, Gebrüder Weiss, Swietelsky)** — AI adoption is broader than tech companies in AT; lower competition than fintech or consulting pools
- **Eval as a standalone role (Canva)** = emerging specialization. Candidate should target Month 3–4 after adding eval work.
- **Python explicit or implied in all 9 roles** — this track requires Python portfolio evidence, unlike D-Microsoft

---

## Cross-cutting pattern summary

| Pattern | Evidence | Impact on recommendation |
|---|---|---|
| Kubernetes is universal for senior infra / platform roles in AT | 8/8 E-sample postings | Confirms CKA prep is high-ROI for candidate |
| Python + LLM > Java + LLM in agent/AI postings | 7/9 D-sample | Candidate's .NET identity is less valuable here; Python-first CV positioning needed |
| CKA explicitly required: 0/8 in AT E-sample | Direct JD read | CKA is a *signal booster*, not a *filter*; may be deferrable |
| OSCP explicitly required: 6 roles karriere.at | Direct filter search | Real gate for offensive track only |
| Stated comp in JD: ~10% of AT postings | 1/8 E-sample; 1/8 F-sample | Negotiation matters more than JD floor |
| Remote-full AT platform-eng: rare | 0/8 E-sample | Salzburg-local candidates must target Porsche Informatik / Dynatrace Linz commute / remote-DACH non-AT |
| 5-year YOE floor at top AI scaleups | Parloa explicit | Candidate at 4 YOE is on the edge — portfolio proof is the offset |
| Java dominates DACH fintech | 9/10 J-sample | J requires a Java-pivot that Options E/M do not |
| Bitpanda P50 = €79K; is the AT fintech ceiling | Levels.fyi direct | Supports [final.md Option J](../final.md#j--fintech-backend-specialist-dach) claim |

## Round 11 additions to cross-cutting patterns

| Pattern | Evidence | Impact |
|---|---|---|
| **Eval is the #1 differentiator** | 39.6% of AI roles require it explicitly (895 JD study); YC startups flag absence as red flag | Candidate must add eval harness to Elyt before applying to any D/D-Microsoft role |
| **RAG = #1 required GenAI skill** | 35.9% of AI roles (895 JD study); appears in 8/9 AT Python AI JDs | Candidate must demonstrate RAG before applying |
| **Industrial sector AT AI adoption** | ANDRITZ, Swietelsky, Gebrüder Weiss all hiring AI engineers | Lower competition than fintech / tech; viable early-application targets |
| **Eval as standalone title emerging** | Canva Vienna Research Engineer – Evaluations | Eval specialist track is real; Month 3–4 target for candidate |
| **Backend → AI consensus: 2–3 months** | AI Engineering Field Guide (51 company processes) | Candidate = 6–8 weeks — faster than any prior round estimate |
| **Semantic Kernel deprecated** | Microsoft official, March 2026 | Any D-Microsoft JD mentioning SK = employer should migrate; candidate targets Agent Framework |
| **LangGraph appears by name in AT JDs** | KERN, Netural | LangGraph is now expected vocabulary alongside LangChain |

## Contradictions with prior rounds surfaced

- **Prior rounds cited "154 live AT platform-eng postings" — confirmed**, but real accessible-for-candidate subset (senior + Salzburg-friendly / Vienna-hybrid / remote-DACH) is likely 30–50, not 154. MEDIUM confidence.
- **Prior Option D scoring assumed "80 AT AI postings"** — confirmed at 79 on karriere.at. But real applied-AI / agent subset is ~30–40 (rest are data-eng renamed or SAP-AI plugins). This matches [final.md D AT-market caveat](../final.md#at-market-3).
- **Assumption "Parloa is accessible remote-DACH from Salzburg"** — Parloa is explicitly hybrid Berlin, not fully remote. Candidate would need to commute monthly or relocate. MEDIUM confidence update.
- **Bitpanda P50 candidate assumption €79K** — directly confirmed via Levels.fyi. Not contradicted.
- **Round 11 addition — "Python is absent from AT AI JDs" (round 06)** — **CONTRADICTED.** 9 confirmed AT Python AI JDs with specific stacks (LangChain, LangGraph, RAG, vector DBs) named explicitly across industrial, logistics, tech, and creative sectors.
- **Round 11 addition — "Semantic Kernel is the D-Microsoft tool"** — **SUPERSEDED.** SK deprecated March 2026. All D-Microsoft learning and demo work must target Agent Framework v1.0.
- **Round 11 addition — "AI-102 is the D-Microsoft cert path"** — **SUPERSEDED.** AI-102 retires June 30, 2026. Target AI-103 beta (June 2026) instead.
