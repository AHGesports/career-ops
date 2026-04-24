# Final evaluation

See: [goal.md](goal.md) · [options.md](options.md) · [candidate.md](candidate.md)

> **ROUND 11 (2026-04-21):** Hiring reality deep-dive. Primary rec HOLDS. No score changes. Key findings: (1) Python = 82.5% of AI JDs globally; RAG = #1 required skill (35.9%); **eval = #1 differentiator** (39.6% of roles; absence = red flag). (2) Backend → AI = 2–3 months consensus; candidate = 6–8 weeks. (3) **Semantic Kernel deprecated March 2026** — target Microsoft Agent Framework v1.0 (GA April 3, 2026). AI-102 retiring June 30 → skip; target AI-103 beta (June) and AI-200 (July). (4) 9 AT Python AI JDs confirmed (KERN, Netural, Swietelsky, ANDRITZ, Fabasoft, Gebrüder Weiss, Michael Page, XUND, Canva Vienna). (5) Take-home appears in 33% of AI interviews; RAG = 40%+ of assignments; Elyt is the interview weapon if framed around decisions not tech names. See [rounds/round-11-hiring-reality.md](rounds/round-11-hiring-reality.md).
>
> **ROUND 10 (2026-04-20):** Deep AI-replacement evidence refresh. Primary rec HOLDS. See [rounds/round-10-ai-replacement-deep.md](rounds/round-10-ai-replacement-deep.md). Qualitative shift: E CV-framing should lead **FinOps + K8s + Terraform + AI-workload ops**, not generic platform. Frontend −10% YoY labor-market confirmation (biggest SWE sub-role decline); reinforces C bearish.
>
> **ROUND 09 (2026-04-20):** Option D split into D4-Python + D-Microsoft. See [rounds/round-09-dotnet-ai.md](rounds/round-09-dotnet-ai.md).
>
> **ROUND 07 REVISION:** Knowledge-transfer dimension added. See [rounds/round-07-knowledge-transfer.md](rounds/round-07-knowledge-transfer.md).
>
> **ROUND 06 REVISION:** Elyt audit found no public traction. See [rounds/round-06-deep.md](rounds/round-06-deep.md).
>
> Authoritative recommendation: [decisions/primary.md](decisions/primary.md).

## Current top ranking (post round 09)

| Rank | Option | Score | Notes |
|---|---|---|---|
| 1 | M — Platform + Agent/AI stacked | **8.67** | Credibility-gated: requires 60-day Elyt-OSS sprint. |
| **2** | **E — Platform / SRE / DevOps** | **8.50** | **PRIMARY.** Porsche Informatik Salzburg-local. |
| 3 | H — Distributed Systems IC | 8.42 | 5-year destination; access-gated. |
| 4 | K — Founding Engineer | 8.17 | Rose under degree-neutrality; access-gated. |
| 5 | D4-Python — Applied AI (Python track) | 8.08 | Remote-EU/US ceiling; Elyt-OSS-gated. |
| 6 | J — Fintech Backend | 7.92 | Pure programming alternative. |
| **6b** | **D-Microsoft — Applied AI (.NET track)** ⭐ | **7.75** | **NEW round 09. Best-execution AI path for THIS candidate.** Post AG, RBI, Porsche Informatik. 4–6 week ramp; no Elyt-OSS required. |
| 7 | G — Data Engineering | 7.75 | Dominated. |
| 8 | F — Security / DevSecOps | 7.33 | HEDGE. |
| 9 | A — Stay .NET | 7.00 | Fallback insurance. |
| 10 | B — Pivot Java | 6.92 | Skip. |
| 11 | I — Embedded | 6.75 | Degree-gated; skip. |
| 12 | C — Pivot React | 6.25 | Checkbox only. |

**Raw score vs execution probability.** D-Microsoft (7.75) ranks below D4-Python (8.08) by raw weighted score, but has much higher execution probability for this specific candidate (70% already there, 4–6 week ramp, no OSS gate). The recommended three-track approach uses BOTH:
- **E primary** for floor + Salzburg access
- **D-Microsoft parallel** as the AI upgrade on .NET stack (DACH enterprise targets)
- **D4-Python** only if Elyt-OSS sprint succeeds (remote-EU/US targets)

Added dimensions across rounds: **R07** added *Knowledge transfer*. **R08** added *No-degree accessibility*. **R09** split Option D into Python and Microsoft tracks after round-06 sample bias invalidation. See [methodology.md](methodology.md).

---

The per-option evaluation below was produced in round 05 under the original M=8.1 assumption. Scores in the tables below reflect the round-05 state; round-06 revisions are applied in each `options/X-*.md` file via ROUND 06 UPDATE notices at top. Authoritative current state: [decisions/primary.md](decisions/primary.md).

Each option is evaluated against the criteria from [goal.md](goal.md#what-a-good-answer-looks-like): pros/cons, AT market, EU market, US market, long-term outlook 2026–2031, AI-replacement risk with reasoning, ease-of-pursuit for this candidate with reasoning, final verdict.

All job volumes are karriere.at / stepstone / RemoteOK live counts April 2026. All salaries are gross EUR/yr unless noted. Key premise — **languages are fungible** — is carried from [goal.md](goal.md#premise-users-own-reframing-accepted) throughout.

**Scoring scale** (each dimension 1–5, higher better). Final score is weighted average: AI-resistance ×2, Long-term ×2, AT market ×1, EU ×1.5, US ×1, Ease-for-candidate ×2.

---

## A — Stay .NET enterprise

**Description.** Remain primary-stack C#/.NET 8 + Angular + Azure. Target senior full-stack / senior backend roles at DACH enterprise (Axess alumni network, Dynatrace, Bitmovin, Porsche Informatik, Erste, Raiffeisen Informatik, Post AG, A1, Magenta).

### Pros
- Zero ramp: candidate is already operating here.
- On the 2026 Austrian Mangelberufe list — structurally protected hiring.
- KV-IT ST2 Erfahrung €76.2K is a realistic 24-month floor simply by tenure accumulation.
- Highest job-match rate in DACH enterprise; German language helps.
- Stable; low layoff rate in DACH enterprise .NET shops.

### Cons
- Enterprise CRUD (forms, repos, controllers, Razor, EF scaffolding) is the **#1 category of work being automated by Copilot/Cursor** per the Anthropic Economic Index ([link](https://www.anthropic.com/research/impact-software-development)).
- Pay ceiling in AT ~€85–95K even at senior; staff track is rare in DACH .NET shops outside Dynatrace.
- Locks trajectory to Microsoft enterprise vendors — narrows 5-year optionality.
- Most .NET greenfield is replaced by Go / TS / Python in new companies.

### AT market
- **139 live postings** on karriere.at ([link](https://www.karriere.at/jobs/.net)).
- Senior .NET P50: **€63K** ([Stepstone AT](https://www.stepstone.at/jobs/net-senior-developer/in-%C3%96sterreichweit)); P75 ~€75K; P90 ~€95K at Dynatrace/Bitpanda tier.
- Salzburg-local: ~1–2 explicit .NET roles; Axess is one of them.

### EU market
- Moderate demand, concentrated in DACH + Nordics. Remote-EU .NET senior P50 ~€70–85K ([WeAreDevelopers Salary Europe](https://www.wearedevelopers.com/en/magazine/538/the-state-of-tech-salaries-in-europe-in-2025-538)).
- Thinner than Java/Python/Go in non-German-speaking EU.

### US market
- Healthy niche (enterprise, gov-tech, defense). Remote-US .NET senior $120–180K nominal ([Levels.fyi](https://www.levels.fyi/)). After AT contractor tax/social → ~€60–90K net.
- Most .NET US postings require US residency; remote-accessible subset is smaller than Go/Python/TS.

### Long-term outlook 2026–2031
- .NET is not declining in DACH — it's compounding in enterprise (banks, insurance, government).
- But greenfield AI-native teams overwhelmingly choose Python/TS/Go. Means: staying .NET locks you out of the hottest 2028–2031 employers.
- JetBrains 2025 Developer Ecosystem: C# stable share, declining relative to TS/Python ([link](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)).

### AI-replacement risk — **HIGH (2/5)**
**Why:** .NET enterprise work sits squarely in the highest-automated bucket. CRUD endpoints, EF migrations, ASP.NET Razor views, Angular forms, standard auth flows — these are exactly the tasks Anthropic's Economic Index identifies as delegated in 79% of Claude Code sessions. A senior .NET IC doing ticket-shop work is exposed. Only the staff-level work (architecture, ambiguity translation, review-of-agent-output) is durable — but that's staff+, not the role candidate is filtering for today.

### Ease for this candidate — **VERY HIGH (5/5)**
**Why:** He already is this person. No ramp, no cert, no portfolio conversion. A new-role search would convert in 6–10 weeks.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 2 |
| Long-term | 2 |
| AT market | 5 |
| EU market | 3 |
| US market | 2 |
| Ease | 5 |
| **Weighted total /10** | **5.9** |

### Verdict
**Fallback runway, not primary plan.** Candidate's existing .NET identity is insurance — always there, always around €63–75K. Optimizing the career *around* .NET capitulates on both durability and ceiling.

---

## B — Pivot to Java (Spring)

**Description.** Rewrite CV to lead with Java / Spring Boot. Target DACH banking, insurance, and Mittelstand (Erste, Raiffeisen Informatik, Oberbank, RBI, Allianz, Zurich, Munich Re, Siemens, Bosch, SAP).

### Pros
- 308 AT postings — **2.2× the .NET volume**. Largest enterprise pool in DACH.
- Banking/insurance pays on the higher end of enterprise in AT/DE.
- C# → Java is the shortest possible lang pivot (3–6 weeks with Claude Code); Spring is another 4–6 weeks.
- Stable employers, low layoff rate.

### Cons
- Java Spring is the **single most AI-commoditized ecosystem**: annotations, DTOs, repository boilerplate, service factories are the canonical targets of code-generation. Oracle/Amazon/Google Java orgs led the Q1 2026 layoff volume in the original Anthropic/Vucense data ([link](https://vucense.com/ai-intelligence/industry-business/tech-layoffs-q1-2026-ai-displacement-80000/)).
- Java = global bootcamp exit language; competes with low-cost offshore supply in India/Eastern EU. Price pressure.
- Banking roles explicitly require 5–8 YOE Java-specific. 4 YOE + 2 months of Claude-Code-assisted Java will pass filter but struggle in live whiteboard / system-design rounds in-lang.
- Trades strong .NET senior identity for weak Java mid identity — identity tax.

### AT market
- **308 live postings** on karriere.at ([link](https://www.karriere.at/jobs/java)).
- Senior Java AT P50: ~€52K low-end (Glassdoor) to €70–87K (Payscale high-end) ([link](https://www.glassdoor.at/Geh%C3%A4lter/senior-java-developer-gehalt-SRCH_KO0,21.htm)). Wide dispersion.
- Banking/insurance pays P75+ €80–90K.

### EU market
- Largest enterprise pool EU-wide. DE has 8–12K active Java postings per Stepstone.de ([link](https://www.stepstone.de/jobs/java)).
- Remote-EU senior Java P50 €70–90K.

### US market
- Huge market, mostly bank-tech / legacy. Remote-US Java senior $130–170K nominal, post-tax €65–85K net for AT contractor.
- US hiring skews on-site to Charlotte/NYC financial hubs.

### Long-term outlook 2026–2031
- Declining share in JetBrains ecosystem reports while Python/TS/Go grow ([JetBrains 2025](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)).
- DACH banking lift from DORA (in force Jan 2025) but compliance hiring flows to security not to Java-IC.
- Likely to be increasingly automation-targeted through 2028–2030.

### AI-replacement risk — **VERY HIGH (1/5)**
**Why:** Every structural factor that makes .NET vulnerable applies more strongly to Java: higher boilerplate density, more repetitive patterns, bigger bootcamp supply, cleaner code-gen training data. Oracle's actual 2024–2025 engineering layoffs specifically targeted Java IC work.

### Ease for this candidate — **HIGH (4/5)**
**Why:** Cheap to learn (6–8 weeks). BUT landing a senior role against Java-native candidates in a bank, with genuine Java-specific system-design whiteboarding, adds 4–6 months of preparation. Mid-level role achievable in 3 months; senior-banking in 9–12.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 1 |
| Long-term | 2 |
| AT market | 5 |
| EU market | 5 |
| US market | 3 |
| Ease | 4 |
| **Weighted total /10** | **5.1** |

### Verdict
**Skip as primary pivot.** Volume uplift doesn't pay for the identity tax + higher AI-replacement exposure. Java as a "can also discuss" column on the CV is fine; as an identity reshuffling, net negative.

---

## C — Pivot to React / Next.js

**Description.** Lead CV as frontend-primary: React, Next.js 15, TypeScript, Tailwind, shadcn/ui. Target global remote frontend / full-stack TS roles.

### Pros
- **Largest global remote pool**: 376 live on RemoteOK ([link](https://remoteok.com/remote-react-jobs)). Remote-first companies are disproportionately React/Next-first.
- Angular → React is ~4–8 weeks of focused learning.
- Modern, JD-friendly (cuts through ATS filters that reject Angular-only).
- Pairs naturally with Elyt's Node.js + Tauri story.

### Cons
- **AT market is tiny**: 56 postings total, 0 in Salzburg ([link](https://www.karriere.at/jobs/react)).
- Salaries are structurally lower: AT P50 €45–55K for senior React ([link](https://www.karriere.at/gehalt/frontend-entwickler)).
- Frontend work is the **#1 automated category in the Anthropic Economic Index**. v0.dev, Lovable, Bolt.new, Claude Artifacts produce production-quality React pages today.
- Pure-frontend identity commoditized by bootcamp pipeline.

### AT market
- 56 postings, 0 Salzburg. P50 €45–55K. Ceiling ~€70K at Dynatrace/Bitpanda frontend roles.

### EU market
- Healthy pool in DE/NL/UK but again salary-compressed vs backend. Remote-EU React senior P50 €60–75K.

### US market
- Huge. Remote-US React senior $110–150K nominal → €55–75K net for AT contractor after tax.
- Most remote-first US companies use Next.js + TS + shadcn. Accessible but comp-compressed relative to backend.

### Long-term outlook 2026–2031
- React itself isn't going anywhere; but the **job** of writing components is the most automatable segment of software. Through 2031 the margin will shift from "write React" to "design / evaluate / integrate React output from agents."
- Pure frontend roles will shrink; frontend + design + product-ownership roles will persist.

### AI-replacement risk — **VERY HIGH (1/5)**
**Why:** The Anthropic Economic Index explicitly identifies UI/UX work, JavaScript/HTML tasks, and simple app scaffolding as the top automated categories. v0 + Cursor + Claude produce shippable React in minutes. Prior rounds' "safe because largest pool" framing is backwards — largest pool = most training data for models = most compressible.

### Ease for this candidate — **VERY HIGH (5/5)**
**Why:** 3 weekends of deliberate practice, pair with Tailwind + shadcn, done. Angular → React transfer is mechanical.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 1 |
| Long-term | 2 |
| AT market | 2 |
| EU market | 4 |
| US market | 3 |
| Ease | 5 |
| **Weighted total /10** | **4.4** |

### Verdict
**Not a path — a checkbox.** Learn React in 3 weekends so JDs stop filtering. Do NOT rebuild identity around it. Keep as the frontend half of full-stack roles, never as primary lane.

---

## D — Applied AI / Agent Engineer

**Description.** Lead CV as "Applied AI / Agent Engineer — built Elyt, a production agentic browser automation platform." Target applied-LLM, RAG, agent, browser-automation, eval-engineering roles.

### Pros
- Highest AT comp premium: P50 **€79K (Vienna €87K)** ([SalaryExpert](https://www.salaryexpert.com/salary/job/ai-engineer/austria/vienna)), 25% above senior .NET.
- Elyt directly matches the niche — it is literally what Browserbase / Stagehand / Skyvern / Anthropic Applied do.
- LLM-specialist demand grew **135.8% YoY** in 2026 ([Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/)).
- Meta-layer work (agent design, tool design, eval harnesses) is structurally harder to automate than code generation itself.
- Remote-EU ceiling: €100–140K senior.

### Cons
- **AT volume is thin**: 80 "AI Engineer" postings ([link](https://www.karriere.at/jobs/ai-engineer)), of which ~30–40 are genuinely applied-AI (rest are renamed data-eng or SAP-AI). LLM specifically: **40 postings** ([link](https://www.karriere.at/jobs?keywords=llm)).
- Salzburg: **≈0 AI-specific roles**.
- Competition: every 8–10 YOE senior backend engineer in DACH is trying to reposition as "AI engineer" right now.
- **Elyt's credibility hinges on traction.** Without public users, revenue, GitHub stars, or OSS community, hiring managers read "founder of Elyt" as "sophisticated side project" → no pay premium.
- AI-native startups have 50%+ 2-year mortality; FTE stability is lower than enterprise.
- 2026 may be peak-hype. An AI-winter-lite in 2027 would compress comp and close hiring windows quickly.

### AT market
- 80 total AI-Engineer postings; realistic applied-AI subset 30–40. Vienna concentration.
- AT P50 €79K; Vienna P50 €87K; ceiling €100–110K at Dynatrace Davis AI / Anyline / Celonis.

### EU market
- Strongest: Berlin, Munich, Paris, Amsterdam, London. Remote-EU P50 €90–110K, P75 €120–140K ([Remotely Talents](https://www.remotelytalents.com/blog/ai-engineer-salaries-2026-us-vs-europe-vs-latin-america)).
- Target employers: Mistral, DeepL, Aleph Alpha, Black Forest Labs, Nyonic, Parloa, Helsing, Continue.dev, Langfuse, n8n, Pylon, Sana, 11x, Decagon, Lindy.

### US market
- **$220–280K for LLM/agent specialists** ([Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/)). 
- Remote-US contractor realistic: $150–200K gross → €75–100K net for AT resident after tax/social.
- Target employers: Browserbase, Stagehand, Skyvern, Anthropic Applied, OpenAI, LangChain, Sierra, Harvey, Cresta, Factory, Cognition, Imbue alumni cos.

### Long-term outlook 2026–2031
- **Bull case:** Every enterprise needs "the first 5 AI engineers" in 2026–2028. Window is now.
- **Bear case:** By 2029–2030 "AI engineer" will be disambiguated into ML-infra / eval-eng / agent-eng specializations. Generic "AI engineer" title will commoditize as the tooling matures. Candidates who enter now and specialize survive; generic repositioners get squeezed.
- Durable sub-niche: **eval design + agent observability**, which becomes more important as production agents fail in production.

### AI-replacement risk — **MEDIUM (3/5)**
**Why:** Building agents is harder to automate than writing React, but parts are still automatable. The durable core is eval / observability / tool design — "what to measure and how to debug when agents fail." That stays human because the agent can't grade itself at production-critical thresholds. Pure RAG plumbing is getting automated quickly (LangChain template level). Ship eval depth, not prompt templates.

### Ease for this candidate — **HIGH (4/5)**
**Why:** Elyt directly matches the niche — if he positions it right, he's 60–70% of the way there today. Remaining 30%: public-proof (traction or OSS), eval-design rigor (currently likely thin), LangGraph / LangFuse / Braintrust / Arize fluency. 4–6 months to competitive senior-candidate strength. Bottleneck = Elyt public narrative, not skill.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 3 |
| Long-term | 4 |
| AT market | 3 |
| EU market | 5 |
| US market | 5 |
| Ease | 4 |
| **Weighted total /10** | **7.4** |

### Verdict
**Top-tier option, conditional on Elyt commercialization or OSS signal within 60 days.** Without public proof, it's a €79K AT play. With proof, it's a €100–140K remote-EU play. High variance.

---

## E — Platform / SRE / DevOps

**Description.** Pivot to infrastructure: Kubernetes in production, cloud (AWS or Azure deep), Terraform, GitOps (Argo/Flux), observability (Prometheus, Grafana, OTel), incident response, SLO design.

### Pros
- **154 live AT postings** ([link](https://www.karriere.at/jobs/devops)), second only to Java/Python.
- Stack Overflow 2025: Cloud Infra Engineer = **#1 highest-paid role globally, $165K median** ([link](https://survey.stackoverflow.co/2025/work)).
- AI-resistant: on-call pattern-recognition, incident triage, mutation-authority, compliance ownership don't AI-automate cleanly ([Surfing Complexity Feb 2026](https://surfingcomplexity.blog/2026/02/14/lots-of-ai-sre-no-ai-incident-management/)).
- Salzburg-adjacent employers exist (Porsche Informatik at Salzburg HQ; Dynatrace Linz 1h20).
- AT senior platform-eng: €70–85K; remote-DACH €85–105K.
- Demand is steady or growing through 2031 regardless of AI trajectory.

### Cons
- **True ramp is real**: K8s production debugging, on-call scar tissue, and Terraform module-authoring at governance level are NOT fungible with AI-assist. 6–9 months deliberate practice + first role to carry pager.
- Salzburg-local platform roles are rare; realistic target = Vienna hybrid or remote-DACH.
- No Elyt-specific leverage beyond "I deploy and run Elyt" — useful but not a differentiator.

### AT market
- 154 postings ([link](https://www.karriere.at/jobs/devops)).
- Platform Engineer Vienna P50 €65K ([Glassdoor](https://www.glassdoor.com/Salaries/vienna-austria-platform-engineer-salary-SRCH_IL.0,14_IM1118_KO15,32.htm)); senior P75 €80–90K; P90 €100K at Dynatrace/Porsche Informatik.
- Strong employers: Porsche Informatik, Dynatrace, Anexia, A1 Digital, Raiffeisen Informatik, Erste Group Tech Hub, PlanRadar, TTTech.

### EU market
- Very strong, especially DE/NL/CH. Remote-DACH senior €85–110K. Zurich on-site CHF 120–150K (~€125–160K).
- Target employers: Zalando, Delivery Hero, Celonis, DB Schenker Tech, Lufthansa Systems, Swisscom, Grafana Labs (EU), Datadog (EU), HashiCorp, Elastic, GitLab, Cloudflare, Fastly.

### US market
- Largest pool, but remote-US platform roles often require US residency. Subset accessible to AT contractor: $150–200K nominal → €75–100K net.
- Target employers (remote-EU-friendly): Datadog, Grafana Labs, HashiCorp, Cloudflare, Fastly, Netlify, Vercel, Fly.io.

### Long-term outlook 2026–2031
- Every AI-forward company (agentic systems, ML inference at scale) needs platform engineering MORE, not less — agents hit production, they fail, someone has to debug and mutate.
- NIS2 (Oct 2026 deadline), DORA (in force Jan 2025), EU AI Act — all force platform + compliance maturity.
- Durable through 2031: production K8s + compliance-gated work is demand-inelastic.

### AI-replacement risk — **LOW (5/5)**
**Why:** Two independent 2026 analyses ([Surfing Complexity](https://surfingcomplexity.blog/2026/02/14/lots-of-ai-sre-no-ai-incident-management/), [Traversal](https://traversal.com/blog/incident-management-how-ai-sre-changes-equation)) consistently show that AI SRE tools (Rootly, incident.io, Resolve.ai, Harness) AUGMENT operators but don't replace the human work — coordination under uncertainty, reading institutional memory, production-mutation authority, auditor-facing judgment calls. On-call scar tissue compounds over years and is gate-kept by having carried a pager on a real system.

### Ease for this candidate — **MEDIUM-HIGH (3/5)**
**Why:** CI/CD and deployment experience from Axess + Elyt gives a 40% head start. Remaining 60% (K8s prod, Terraform governance, on-call reflexes, observability depth, cloud cert) = 6–9 months of deliberate practice + first role. CKA exam in 6 weeks is achievable; ramp to full senior platform-eng profile is 9–12 months.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 5 |
| Long-term | 5 |
| AT market | 4 |
| EU market | 5 |
| US market | 4 |
| Ease | 3 |
| **Weighted total /10** | **8.0** |

### Verdict
**Highest pure-dimension score. Best floor × durability combination on the table.** The trade vs Option D is: D has higher ceiling + Elyt-leverage but depends on Elyt proof; E has higher floor + durability but slower ramp.

---

## F — Security / DevSecOps

**Description.** Pivot to compliance-gated security work: cloud security, AppSec, DevSecOps, NIS2/DORA/EU-AI-Act compliance engineering. Certs: Security+, OSCP (real gate), CISSP (senior gate).

### Pros
- Structurally the **most AI-resistant** category on this list. Compliance judgment, auditor-facing work, red-team intuition are liability-bound — no CIO delegates legal exposure to a coding agent.
- **Regulatory forcing function:** NIS2 deadline Oct 2026 (every "essential" and "important" AT entity hiring now), DORA in force Jan 2025 for all financial entities, EU AI Act phased 2025–2027. Estimated €34B DACH compliance spend through 2027 ([LinkedIn/Hasani](https://www.linkedin.com/pulse/dach-market-alert-dora-nis2-34-billion-compliance-wave-nora-hasani--xygff)).
- AT DevSecOps P50 ~€73K, senior ~€84K ([SalaryExpert](https://www.salaryexpert.com/salary/job/devsecops-engineer/austria)).
- Stable employers: banks, insurance, telco, critical infrastructure.

### Cons
- **12–18 month ramp**, cert-gated. OSCP is the real gate (hard, expensive ~€1500, high signal).
- No Elyt leverage — cold pivot.
- Candidate has zero documented security experience; banks will filter on cert + demonstrable experience, not on "interested in security."
- Culture different from product-engineering — more process, less shipping.

### AT market
- ~120 DevSecOps / Cloud Security / AppSec postings across AT boards.
- Senior AT €80–95K at regulated entities; premium above generic senior SWE.

### EU market
- DE/CH very strong. Remote-DACH security eng €90–120K. Swiss banks pay CHF 130–160K on-site.
- Target: Snyk, Aikido, Wiz EU, Semgrep, Datadog Security, Checkmarx, Veracode.

### US market
- Huge, but US security hiring is heavily US-residency-gated (clearances common).
- Product-security at SaaS companies (Snyk, Wiz) accessible remote-EU.

### Long-term outlook 2026–2031
- **Structurally growing.** Regulatory load only increases (NIS3 already in draft, DORA extensions, EU AI Act enforcement 2026–2027, potential EU sovereign-cloud mandates).
- Most durable category on this list for 2028–2031.

### AI-replacement risk — **VERY LOW (5/5)**
**Why:** Liability-bound work is structurally human. Auditors don't accept "the agent said it was fine." Compliance attestations must be signed by a named human. Red-team / threat-modeling requires reasoning about adversarial intent, which agents don't do reliably. The parts that DO automate (SAST scans, dependency checks, policy-as-code) are tool maturation, not role replacement.

### Ease for this candidate — **LOW (2/5)**
**Why:** Cold pivot. No existing security signal on CV. 12–18 months of deliberate ramp: Security+ (3 weekends), TryHackMe / HackTheBox daily, OSCP (4–6 months intensive), first junior-security role (often €55–65K = pay cut short-term), then 12–18 months tenure before senior DevSecOps. Total to €85K target: ~2 years minimum, and candidate takes a pay dip during ramp.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 5 |
| Long-term | 5 |
| AT market | 4 |
| EU market | 4 |
| US market | 3 |
| Ease | 2 |
| **Weighted total /10** | **7.0** |

### Verdict
**Best pure durability on the board, but the slowest ramp + pay dip during transition + no Elyt leverage make it the #1 HEDGE path, not the primary.** If primary stalls at Month 9, pivot remaining 6 months to OSCP → NIS2 compliance roles in 2027.

---

## G — Data Engineering

**Description.** Modern data stack: Python + SQL + dbt + Airflow + Spark + Snowflake/Databricks + lakehouse architecture. Target data-platform and analytics-engineering roles.

### Pros
- **139 AT postings** ([link](https://www.karriere.at/jobs/data-engineer)). Solid volume.
- Python + SQL are directly transferable from candidate's existing stack.
- Data pipelines are infrastructure (AI-resistant — someone has to own the bytes).
- Adjacent to AI workloads → natural crossover path to Applied AI.

### Cons
- **AT market is SAP/DWH-heavy.** Most AT data-eng roles are SAP BW/4HANA, Oracle DWH, or IBM Cognos — older tech, lower ceilings.
- Modern-stack roles (dbt + Snowflake + Databricks) are rarer in AT, more common in Berlin/Amsterdam.
- AT P50 €58–65K, Vienna P75 €75K ([Glassdoor](https://www.glassdoor.com/Salaries/vienna-austria-data-engineer-salary-SRCH_IL.0,14_IM1118_KO15,28.htm), [Jobicy](https://jobicy.com/salaries/at/data-engineer)).
- No Elyt leverage.

### AT market
- 139 postings, roughly 60% SAP/legacy, 40% modern stack. Vienna concentration.

### EU market
- Stronger in Berlin/Amsterdam/Dublin. Remote-EU senior data-eng €75–95K.

### US market
- Very strong. Remote-US senior data-eng $140–180K → €70–95K net for AT contractor.

### Long-term outlook 2026–2031
- Lakehouse/vector-DB convergence makes data-eng increasingly AI-adjacent. Durable through 2031.
- SAP data-eng specifically is slowly commoditized by LLM-assisted migration tools.

### AI-replacement risk — **MEDIUM-LOW (4/5)**
**Why:** Data pipelines have meaningful operational surface (late data, schema drift, cost explosions, compliance) that doesn't AI-automate cleanly. But ETL scaffolding and SQL generation are heavily LLM-compressed — the lower-rung work is more automatable than platform/security work.

### Ease for this candidate — **MEDIUM (3/5)**
**Why:** Python + SQL already strong. Modern-stack tools (dbt, Airflow, Snowflake/Databricks) learnable in 3–6 months. No production-data-at-scale experience — ramp to senior requires first role + tenure. Realistic timeline to €85K: 12–18 months.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 4 |
| Long-term | 4 |
| AT market | 4 |
| EU market | 4 |
| US market | 4 |
| Ease | 3 |
| **Weighted total /10** | **7.0** |

### Verdict
**Reasonable option, but dominated by E (Platform/SRE) on durability + pay and by D/M on ceiling.** Pick only if candidate has genuine interest in data work — doesn't provide a niche advantage.

---

## H — Backend / Distributed Systems IC

**Description.** Deep specialist in high-scale backends: Kafka/Pulsar, event streaming, consistency protocols, sharded databases, distributed tracing, service mesh.

### Pros
- Deeply AI-resistant: distributed systems intuition (Jepsen-level thinking, real CAP tradeoffs) is built by 3–5 years of carrying on-call for a real large-scale system.
- High ceiling: senior at scale-out companies €90–120K DACH remote.
- Optionality: opens doors to FAANG-adjacent and infra-first startups.

### Cons
- The moat REQUIRES years on a real large-scale system. Candidate's Axess experience (20K monthly POS txns, 10+ enterprise customers) is real but not "10B events/day Kafka" scale. Credible positioning requires either:
  - (a) Joining a high-scale shop and accruing 18–24 months, OR
  - (b) Open-sourcing / writing deeply about a distributed-systems problem he's solved.
- Slowest skill accretion on this list.
- AT has very few "real distributed systems" roles — Vienna has a handful (Dynatrace, Bitpanda, Raiffeisen Informatik's trading desk). Most are in Berlin/London/Zurich/remote-US.

### AT market
- Merged with backend eng: ~200 postings that could qualify as distributed-systems work. Realistic count of "actual distributed systems at scale": 20–30 roles.

### EU market
- Stronger in Berlin (Zalando, Delivery Hero, Stripe EU, N26 backend), Dublin (Stripe, Intercom), Amsterdam (Booking, Adyen), London (Monzo, Cloudflare, HashiCorp).
- Remote-EU senior €85–115K; staff IC €110–140K.

### US market
- Highest ceiling of any on this list. Remote-US distributed-systems staff IC $250–400K nominal. But US direct-hire is the only way to hit that — contractor roles compress.

### Long-term outlook 2026–2031
- Structurally durable. More distributed systems exist every year; more of them hit AI workloads; more specialized debugging needed.

### AI-replacement risk — **LOW (4/5)**
**Why:** Distributed bugs are generally out of LLM training distribution. Subtle consensus failures, partition-tolerance edge cases, and cross-region consistency issues are the kind of long-tail work that agents fail on. The scaffolding around them (writing consumers, producers, etc.) IS getting automated.

### Ease for this candidate — **LOW (2/5)**
**Why:** Can get into a backend role easily; getting hired as "distributed systems IC" requires signaling beyond the 4-YOE generalist CV. Ramp to credibly-senior DS engineer: 2–3 years including tenure on a qualifying system.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 4 |
| Long-term | 5 |
| AT market | 3 |
| EU market | 5 |
| US market | 5 |
| Ease | 2 |
| **Weighted total /10** | **7.1** |

### Verdict
**Excellent 5-year destination, wrong 12-month entry point.** Best accessed via E (Platform/SRE at a distributed-systems shop) or M (Platform+Agent at Dynatrace/Grafana-tier), accruing the moat over 18–24 months in-role.

---

## I — Embedded / Real-time / Robotics

**Description.** C/C++ embedded or Rust/embedded for automotive, industrial, robotics. Target AT/DE Mittelstand (Magna, KTM, Red Bull, Andritz, Pöttinger, TTTech, ams OSRAM, Bosch, Siemens).

### Pros
- **Most AI-resistant category** after security. Agents don't debug scope traces or memory-mapped registers.
- Highly stable employers.
- Austrian automotive / industrial base is real (Linz/Graz concentration).

### Cons
- **Ramp is 2–4 years of real C/C++**, not fungible with AI-assist (embedded debugging = hardware + timing + real-world state, not syntax).
- Salzburg-thin; heavy commute to Linz/Graz required.
- Lower ceilings in AT: senior embedded €55–75K typically ([Payscale](https://www.payscale.com/research/AT/Job=Embedded_Software_Engineer/Salary/6be988ce/Vienna)).
- No Elyt leverage; completely different world.
- Culturally very different from product engineering.

### AT market
- Linz / Graz concentration. ~80 postings across automotive/industrial boards.

### EU market
- Strong DE (BMW, Mercedes, Bosch, Continental). Senior €70–95K. Robotics/autonomous-driving premium tier (€90–120K).

### US market
- Largely US-residency-gated (defense / automotive).

### Long-term outlook 2026–2031
- Durable. Physical-world problems persist.

### AI-replacement risk — **VERY LOW (5/5)**
**Why:** Hardware-in-the-loop debugging, timing analysis, DMA setup, memory-mapped register work — agents don't have runtime state access to the physical device. The closest automation (copilot for embedded boilerplate) helps but doesn't replace.

### Ease for this candidate — **VERY LOW (1/5)**
**Why:** 18–24 months of real C/C++ + embedded toolchain + one in-house mentor. Pay dips during transition (junior embedded €45–55K). Not realistic for a 22yo with income continuity needs.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 5 |
| Long-term | 5 |
| AT market | 3 |
| EU market | 4 |
| US market | 2 |
| Ease | 1 |
| **Weighted total /10** | **6.1** |

### Verdict
**Best durability on the list but wrong shape for this candidate's timeline and base.** Revisit at 30 only if primary paths have failed and he's willing to commit 2+ years. Skip.

---

## J — Fintech Backend Specialist (DACH)

**Description.** Enter a fintech employer (Bitpanda, N26, Trade Republic, Raiffeisen Bank International trading desk, Erste private banking, Flatex, Scalable Capital, Deutsche Börse, SIX, Wise) as senior backend eng and accrue fintech domain over 2–3 years.

### Pros
- **Domain premium is real and durable.** Fintech domain (payments, clearing, AML, MiCA, DORA) is not-fungible with AI-assist and not-replicable with just CS knowledge.
- **Highest AT fintech comp**: Bitpanda senior SWE P50 €79K, ceiling €96K ([Levels.fyi](https://www.levels.fyi/companies/bitpanda/salaries)); N26 Berlin senior €80–110K ([Levels.fyi](https://www.levels.fyi/companies/n26/salaries/software-engineer/title/backend-software-engineer)).
- Domain compounds — 5-year trajectory opens doors to staff+ IC roles at EU fintechs, Swiss private banks, prop-trading shops.
- DORA-driven hiring wave 2025–2027.

### Cons
- Cold pivot in-domain: no fintech experience on CV. Bitpanda/N26 will filter.
- Access is the bottleneck, not skill.
- Atra (2021–2022) gave candidate some cross-border trade experience — modest relevant signal. Worth highlighting.

### AT market
- Bitpanda (Vienna) is the primary high-comp target. Raiffeisen, Erste, RBI, Bawag all hire senior backend but more enterprise-y.
- ~30–50 fintech-backend-specific roles at any time in AT.

### EU market
- Very strong. Berlin (N26, Trade Republic, Scalable Capital), Amsterdam (Adyen, Mollie), London (Monzo, Revolut, Wise, Cleo, Starling), Frankfurt (Deutsche Börse, SIX), Zurich (Julius Baer, Credit Suisse/UBS).

### US market
- Remote-US fintech is tough (KYC, regulatory) but Stripe, Plaid, Airwallex, Brex hire remote-EU subset.

### Long-term outlook 2026–2031
- Structurally strong. DORA, MiCA, upcoming EU Payment Services Directive 3 all drive fintech platform investment.

### AI-replacement risk — **LOW (4/5)**
**Why:** Fintech domain + compliance overlap means most work has liability / audit attachment. Agent-safety concerns and money-movement correctness make automation slow to adopt.

### Ease for this candidate — **MEDIUM (3/5)**
**Why:** 4 YOE generalist backend + .NET/Python/SQL is a credible profile for a fintech senior-backend filter. The Atra trade-ops experience is real domain signal. But senior-fintech specifically typically wants 2+ years in-fintech, so the realistic entry is mid-senior backend, accruing domain over 18–24 months. Bitpanda is the most accessible target.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 4 |
| Long-term | 5 |
| AT market | 3 |
| EU market | 4 |
| US market | 3 |
| Ease | 3 |
| **Weighted total /10** | **7.3** |

### Verdict
**Strong 5-year destination, BEST accessed through M (Platform+Agent) or D (Applied AI) at a fintech employer, not as a direct pivot.** Target Bitpanda, Trade Republic, Raiffeisen's trading desk as *employers of choice* for options D/E/M rather than as a separate path.

---

## K — Founding Engineer at AI-native startup

**Description.** Employee #2–5 at a seed/Series-A AI company in Berlin, Paris, Amsterdam, London, or remote-EU. Cash comp moderate + meaningful equity + staff-track trajectory.

### Pros
- Elyt profile is literally what "founding engineer" JDs ask for.
- Compensation: €75–110K cash base + 0.5–2% equity at seed/A. Equity is the real prize.
- Staff-track compression: 18–24 months of founding-eng tenure = senior-at-BigCo trajectory.
- Highest ceiling optionality of any option (tail outcomes: company succeeds, equity → €500K–€2M+).

### Cons
- **50%+ 2-year mortality.** Most seed AI startups fail.
- Cash comp below senior FTE at established co.
- Access: requires existing network or aggressive outbound. Most roles filled via YC Work-at-a-Startup, Lenny's Jobs, Pallet, cord.co, warm intros.
- Requires candidate willing to accept pay dip + volatility.

### AT market
- Near zero AT-based AI-native startups at this scale.

### EU market
- Berlin (Parloa, DeepL, Langfuse, Continue.dev), Paris (Mistral, H, Helsing, Poolside), Amsterdam (Onfido, Bird), London (DeepMind-alum startups, 11x), Zurich (Scandit, Unique.ch, Together.ai).

### US market
- Full remote accessible subset: Browserbase, Skyvern, Stagehand, Factory, Sierra (EU hires), Cognition, Lindy, Pylon, Decagon.

### Long-term outlook 2026–2031
- Dependent on AI funding cycle. Currently hot through at least 2027; tail risk for 2028–2029 if AI-winter materializes.

### AI-replacement risk — **LOW (4/5)**
**Why:** Founding-engineer work is by definition ambiguous + product-to-arch + debugging-under-pressure. Least automatable slice of IC work.

### Ease for this candidate — **MEDIUM-HIGH (4/5)**
**Why:** Elyt is the perfect signal — solo-shipped production agentic platform maps almost 1:1 to "show me you can build and ship in ambiguity." Bottleneck is access, not skill. Requires 3–6 months of outbound networking + blog writing + OSS contributions to surface.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 4 |
| Long-term | 4 |
| AT market | 1 |
| EU market | 4 |
| US market | 5 |
| Ease | 4 |
| **Weighted total /10** | **6.9** |

### Verdict
**Asymmetric lottery — apply 3–5/year as optionality, don't plan around it.** If one hits with a company that gets to Series B, candidate's career compresses 3 years. If none hit, zero cost. Best run as a sidequest alongside primary (M or D).

---

## L — Remote-US contractor (W-8BEN, 1099-equivalent)

**Description.** Register as Austrian self-employed (Gewerbe / Neue Selbständige). Contract with US companies as senior backend / AI / platform engineer.

### Pros
- Highest nominal gross: $150–200K USD for senior contractor roles.
- Global market access.
- No Austrian employer hierarchy; pure IC work.

### Cons
- **Tax/social reality**: Austrian SVS ~27%, income tax to 50%, VAT reverse-charge admin, plus US-side W-8BEN filings. Net take-home: ~€75–100K for a $150K gross — NOT the $150K Reddit headline.
- No Abfertigung Neu, no 13./14. Monatsgehalt, no Krankengeld, no Urlaubsgeld, no employer pension contributions.
- Isolation risk — remote-solo work at 22 can be culturally costly.
- Contract volatility — US startups cut contractors first during downturns.
- Timezone (6–9h to PST) means evening/night work for sync meetings.

### AT market
- Not applicable (the point is escaping AT comp structure).

### EU market
- Not applicable (same).

### US market
- Accessible subset: AI-native startups (see K), contractor-friendly scaleups (Vercel, Replicate, PlanetScale, Turso), specialist consultancies.
- Senior backend contractor: $140–180K; senior AI/agent contractor: $180–250K.

### Long-term outlook 2026–2031
- Remote-contract work with US continues to be a real market. EU Social Security Coordination complicates but doesn't block it.

### AI-replacement risk — **DEPENDS ON THE WORK**
**Why:** Contractor just means employment structure, not skill. If the work is agent-engineering or platform-engineering → inherits those scores. If it's CRUD API at a US scaleup → inherits full-stack scores.

### Ease for this candidate — **MEDIUM (3/5)**
**Why:** Admin burden is real (Neue Selbständige registration, VAT setup, accountant ~€2–3K/year). Landing a first US contract requires portfolio + English fluency (candidate has both). Realistic timeline: 4–8 months to signed contract.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 4 (if agent/platform work) |
| Long-term | 4 |
| AT market | 1 |
| EU market | 1 |
| US market | 5 |
| Ease | 3 |
| **Weighted total /10** | **6.0** |

### Verdict
**Employment structure, not a career path.** Use as *how* for paths D, E, K, or M when the right US role appears — not as a separate plan.

---

## M — **Platform + Agent/AI stacked** (hybrid)

**Description.** Combine options E (Platform/SRE) + D (Applied AI / Agent Engineer). Target titles: "AI Platform Engineer", "Staff Engineer — AI Infrastructure", "Agent Platform Engineer", "MLOps + Agent Eng". Build skill-stack: K8s + Terraform + cloud cert + LLM-agent/eval/observability + Elyt as proof.

### Pros
- **Rare combination.** Most AI engineers can't operate K8s in production; most platform engineers can't design agent evals. The intersection is scarce and well-paid.
- Inherits E's floor (€70–85K AT platform eng, always available) and D's ceiling (€100–140K remote-EU).
- Elyt is directly leverageable: he already operates the platform that runs his agents.
- Durable through 2031: production AI needs production infrastructure + production agent operations. Both stay human.
- Geographically flexible: AT-local (Porsche Informatik, Dynatrace Davis AI), remote-DACH (Celonis, Grafana, Datadog), remote-US (Browserbase, Parloa if US-funded, Skyvern, Factory).

### Cons
- More skills to ramp than a single pivot — CKA + cloud cert + LLM-ops in 6–9 months. Tight but doable.
- "AI Platform Engineer" title is emerging; not every JD uses it. Requires candidate to read between JD lines.

### AT market
- Union of E (154) + D (~40 applied-AI) − overlap. Realistic target pool: ~30–50 roles/year in AT that truly fit the stacked profile. Vienna concentration.
- Dynatrace Davis AI is the canonical AT employer.

### EU market
- Strong. Every AI-native scaleup needs platform-AI engineers. Remote-DACH/EU P50 €95–115K, P75 €120–140K.

### US market
- Hottest sub-niche currently. Agent-platform at Browserbase, Skyvern, Stagehand, MLOps at Modal, Replicate, Baseten, Together.ai, Predibase. Remote-EU-friendly subset: €90–120K net contractor.

### Long-term outlook 2026–2031
- Structurally durable: intersection of two growing fields.
- Risk: "AI Platform" title stabilizes into just "Platform Engineer (who also handles AI workloads)" — but the underlying skills remain valuable either way.

### AI-replacement risk — **VERY LOW (5/5)**
**Why:** Inherits the strongest durability signals from both components. Production infrastructure + agent-eval/observability are both in the "meta-layer that agents can't self-replicate" bucket.

### Ease for this candidate — **MEDIUM (3/5)**
**Why:** He's 30–40% of the way here (CI/CD, Azure, Docker, Elyt ops, LLM APIs, MCP). Remaining 60%: CKA, AWS SA Associate, Terraform, eval-harness fluency (Langfuse/Braintrust/Arize), LangGraph patterns, production on-call. 9–12 months structured work. More ramp than D alone, less than F alone.

### Scores
| Dim | Score |
|---|---|
| AI-resistance | 5 |
| Long-term | 5 |
| AT market | 3 |
| EU market | 5 |
| US market | 5 |
| Ease | 3 |
| **Weighted total /10** | **8.1** |

### Verdict
**Highest weighted score on the board.** Takes the best of E and D while each covers the other's weakness: E's floor fixes D's thin-volume risk; D's ceiling + Elyt-leverage fixes E's generic-pay-profile risk.

---

## N — Go / Rust systems pivot

**Description.** Within the "language is fungible" premise — pick Go or Rust as the *specific* language to lead with, targeting systems / infra / performance roles.

### Pros
- **Go** pairs well with option E (Platform/SRE) — Kubernetes, HashiCorp tooling, Docker, Grafana all Go.
- **Rust** pairs with high-performance systems and AI infra (Polars, Candle, vLLM-rs, Axum). Premium comp in Cloudflare / Fly.io / Discord-tier.
- Both transfer cleanly from C#.

### Cons
- **AT volume is tiny**: Go = 8 postings, Rust = **1 posting nationwide** (Commend Salzburg) ([karriere.at Rust](https://www.karriere.at/jobs/rust)).
- Remote pool for Go: 121 RemoteOK. For Rust: ~20 total globally per week.
- As a standalone path, Go/Rust adds language-branding over niche-branding — which is exactly what the fungibility premise says not to do.

### AT market
- Essentially nonexistent as a primary-stack requirement. Useful as "can also work in Go" for platform roles.

### EU/US markets
- Go: healthy remote market (~500 active postings globally), strong infra concentration.
- Rust: narrow but premium — Cloudflare, Fly.io, Discord, 1Password, Signal. €100–140K remote-EU typical.

### Long-term outlook 2026–2031
- Go: stable growth, likely dominant for agent runtimes and microservices.
- Rust: compounding for systems work, AI infra, hypervisor/OS-adjacent.

### AI-replacement risk — depends on niche, NOT on language
See E (Platform), H (Distributed Systems), M (Stacked) — picking Go/Rust just changes the lang used within those niches.

### Ease for this candidate — **HIGH (4/5)**
**Why:** C# → Go = 4 weeks fluent. C# → Rust = 8–12 weeks fluent (borrow checker is the only real obstacle). Low ramp cost.

### Scores
Not a standalone path. See niche scoring in E, H, M.

### Verdict
**Language choice, not a path.** Under the fungibility premise, pick Go for M (Platform+Agent). Learn Rust only if targeting Cloudflare/Fly.io-tier systems roles. Do not make "Go developer" or "Rust developer" the CV identity — make the niche the identity, and mention the language.

---

## Final ranking (weighted total, /10)

| Rank | Option | Score | Notes |
|---|---|---|---|
| **1** | **M — Platform + Agent/AI stacked** | **8.1** | Best combination of floor, ceiling, durability |
| 2 | E — Platform / SRE / DevOps | 8.0 | Best durability pure-play |
| 3 | D — Applied AI / Agent Engineer | 7.4 | Best ceiling, Elyt-dependent |
| 4 | J — Fintech Backend Specialist | 7.3 | Best domain moat |
| 5 | H — Backend / Distributed Systems IC | 7.1 | Best 5-year destination |
| 6 | F — Security / DevSecOps | 7.0 | Best pure durability, slowest ramp → primary HEDGE |
| 7 | G — Data Engineering | 7.0 | Dominated by E and M |
| 8 | K — Founding Engineer | 6.9 | Lottery ticket; run as sidequest |
| 9 | I — Embedded / Real-time | 6.1 | Wrong shape for candidate timeline |
| 10 | L — Remote-US contractor | 6.0 | Employment structure, not path |
| 11 | A — Stay .NET | 5.9 | Fallback runway only |
| 12 | B — Pivot to Java | 5.1 | Skip |
| 13 | C — Pivot to React | 4.4 | Checkbox only |
| — | N — Go/Rust | (not standalone) | Language choice inside M |

## Primary recommendation

**Option M: Platform + Agent/AI stacked.**

**Confidence: HIGH.**

The fungibility premise ([goal.md](goal.md#premise-users-own-reframing-accepted)) changes the strategic shape: with language free to choose, the right move is to pick the **niche × durability × Elyt-leverage** bundle that maximizes the weighted score. That bundle is M.

**Hedge at 15% effort: Option F (Security / DevSecOps).** Specifically Security+ cert in Q2 2026 as a small baseline investment. If by Month 9 primary has failed to produce an offer ≥ €90K, pivot remaining effort to OSCP → NIS2 compliance roles at Erste / Raiffeisen / OMV in 2027.

**Sidequest at 5% effort: Option K (Founding Engineer).** 3–5 targeted applications over 12 months at AI-native startups (Browserbase, Parloa, Skyvern, Langfuse, Continue.dev) via YC Work-at-a-Startup, Lenny's Jobs, cord.co. Zero cost if none hit; career-compressing outcome if one does.

**Fallback floor: Option A (.NET).** Always available at €63–75K AT. Don't plan the career around it; know it exists as insurance.

## 12-month action plan (primary = M)

| Month | Action |
|---|---|
| M1 | Convert Elyt to public signal: ship v2 with real users OR open-source one reusable piece (eval harness / browser-action DSL / trace format). Start CKA prep. Update CV / LinkedIn to "Full-stack + Platform & Agent specialist". Apply to 3 AT platform-eng roles (Porsche Informatik, Dynatrace, Anexia) as calibration. |
| M2 | Pass CKA. Write blog post #1: "Building production browser agents — what actually breaks." Post to HN + LinkedIn. |
| M3 | AWS SA Associate + Terraform Associate. Blog post #2: "An eval harness for browser agents" with code. 10 coffee chats at Browserbase / Parloa / Dynatrace Davis. |
| M4 | CKS or CKAD based on which conversations trended. Begin serious applications: 5/week across platform-EU, AT-local platform, agent-eng remote-EU. Calibrate comp expectations from real offers. |
| M5–6 | Onsite rounds. If no onsites by M5 — profile is wrong, iterate CV with feedback from M3 coffee-chat contacts. |
| M7–9 | Negotiate. Target €90K+ AT / €100K+ remote-DACH / €110K+ remote-US-contractor-net. Anchor on Bitpanda P50 €79K for AT and Levels.fyi for remote. If no offer ≥ €85K by M9 → trigger hedge: start OSCP prep. |
| M10–12 | Sign offer, start new role. Keep Elyt alive as public infra / OSS artifact. Continue hedge OSCP prep through onboarding if primary comp landed below ceiling. |

## Decision triggers

| Trigger | Action |
|---|---|
| Elyt can't show measurable traction or OSS signal by Month 2 | Demote Elyt in CV to one bullet; don't lead with it; M score downgrades to 7.5 but still #1 |
| Month 5 — no onsite invites | Iterate CV / change target mix; request explicit feedback from M3 network |
| Month 9 — no offer ≥ €85K | Trigger hedge F (OSCP → NIS2 roles spring 2027) |
| Month 6 — offer at Browserbase / Parloa / Skyvern / similar at €100K+ | Accept immediately; this is the option D/M win state |
| Month 6 — offer from AT-local platform-eng at €80K+ | Accept if no M3-network warm leads progressing; negotiate to €85K |
| Any month — founding-eng offer at reputable AI startup (YC backed, Series A funded) | Evaluate carefully; equity value vs cash tradeoff |

## Summary

Read [goal.md](goal.md) for the problem framing, [options.md](options.md) for the full menu, and this file for the evaluation. The one-paragraph synthesis: with languages fungible, the scarcest 12-month-achievable skill bundle for this candidate is **"can build, ship, and operate an agent-driven system in production"** — which is Option M (Platform + Agent/AI stacked). Floor €70K AT, expected €85–95K at 12 months, ceiling €110–130K remote-EU at 24 months. Hedge with F (Security) if primary stalls by Month 9. Fall back to A (.NET) only as runway insurance.
