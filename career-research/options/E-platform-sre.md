# Option E — Platform / SRE / DevOps

**Status:** **PRIMARY RECOMMENDATION (round 06 revision)** — promoted from #2 after Elyt audit weakened M.
**Score:** 8.0/10 weighted (unchanged, but now top)

> **ROUND 06 UPDATE:** Elyt has no public traction ([../data/elyt-audit.md](../data/elyt-audit.md)). M's Elyt-leverage premium gone; E is the new primary. Key new anchors:
> - **Senior Platform/DevOps AT P50 = €78.75K** (Glassdoor AT 2026 senior DevOps). Prior rounds cited €65K — was wrong seniority tier. Real anchor is €78–80K.
> - **Porsche Informatik Senior DevOps Platform Engineer** ([karriere.at/jobs/6788786](https://www.karriere.at/jobs/6788786)) = single most accessible JD on the board. Salzburg-local (candidate's home), 3+ YOE, 70% stack overlap. **This is target #1.**
> - Full real JD analysis in [../data/jd-samples.md#option-e](../data/jd-samples.md).
> See [../decisions/primary.md](../decisions/primary.md) for revised strategy.

See: [README](../README.md) · [options](../options.md) · [final](../final.md)

Related: [M-platform-plus-agent.md](M-platform-plus-agent.md) (stacked version) · [F-security.md](F-security.md) (adjacent hedge)

---

## Description

Pivot to infrastructure work: Kubernetes in production, cloud (AWS or Azure deep), Terraform, GitOps (Argo/Flux), observability (Prometheus/Grafana/OTel), incident response, SLO design, on-call rotations.

Titles: Platform Engineer, Senior Platform Engineer, SRE, DevOps Engineer, Site Reliability Engineer, Infrastructure Engineer, Cloud Engineer.

## Pros
- **154 live AT postings** ([karriere.at/jobs/devops](https://www.karriere.at/jobs/devops)) — second-highest volume after Java.
- Stack Overflow 2025: Cloud Infra Engineer = **#1 highest-paid role globally, $165K median** ([link](https://survey.stackoverflow.co/2025/work)).
- AI-resistant: on-call pattern-recognition, mutation-authority, compliance ownership don't automate cleanly ([Surfing Complexity Feb 2026](https://surfingcomplexity.blog/2026/02/14/lots-of-ai-sre-no-ai-incident-management/)).
- Salzburg-adjacent employers exist (Porsche Informatik, Dynatrace Linz 1h20, Anexia).
- Demand steady/growing through 2031 regardless of AI trajectory.

## Cons
- **True ramp is real**: K8s production debugging, on-call scar tissue, Terraform at governance level are NOT fungible with AI-assist. 6–9 months deliberate + first role to carry pager.
- Salzburg-local platform roles are rare; realistic target = Vienna hybrid or remote-DACH.
- No Elyt-specific leverage beyond "I deploy and run Elyt" — useful but not differentiating.

## AT market

- **154 postings** ([link](https://www.karriere.at/jobs/devops)).
- Vienna Platform Engineer P50 €65K ([Glassdoor](https://www.glassdoor.com/Salaries/vienna-austria-platform-engineer-salary-SRCH_IL.0,14_IM1118_KO15,32.htm)); senior P75 €80–90K; P90 €100K at Dynatrace/Porsche Informatik.
- **Employers:** Porsche Informatik (Salzburg HQ), Dynatrace (Linz), Anexia (Klagenfurt/Vienna), A1 Digital, Raiffeisen Informatik, Erste Group Tech Hub, PlanRadar, TTTech, Adidas Runtastic (Linz).

<!-- EXTEND: round-06 JD samples -->

## EU market

- Very strong, especially DE/NL/CH. Remote-DACH senior €85–110K. Zurich on-site CHF 120–150K (~€125–160K).
- **Employers:** Zalando, Delivery Hero, Celonis, DB Schenker Tech, Lufthansa Systems, Swisscom, Grafana Labs (EU hires), Datadog (EU), HashiCorp, Elastic, GitLab, Cloudflare, Fastly.

## US market

- Largest pool, but remote-US platform roles often require US residency. Subset accessible to AT contractor: $150–200K nominal → €75–100K net.
- **US-remote-EU-friendly:** Datadog, Grafana Labs, HashiCorp, Cloudflare, Fastly, Netlify, Vercel, Fly.io, PlanetScale, Turso.

## Long-term outlook 2026–2031

- Every AI-forward company needs platform engineering MORE, not less — agents hit production, fail, someone debugs and mutates.
- NIS2 (Oct 2026 deadline), DORA (in force Jan 2025), EU AI Act — all force platform + compliance maturity.
- Durable through 2031: production K8s + compliance-adjacent work is demand-inelastic.

## AI-replacement risk — **5/5 (VERY LOW)**

**Why:** Two independent 2026 analyses ([Surfing Complexity](https://surfingcomplexity.blog/2026/02/14/lots-of-ai-sre-no-ai-incident-management/), [Traversal](https://traversal.com/blog/incident-management-how-ai-sre-changes-equation)) consistently show AI SRE tools (Rootly, incident.io, Resolve.ai, Harness) AUGMENT operators but don't replace them. Coordination under uncertainty, institutional-memory reading, mutation-authority, auditor-facing judgment — all stay human. On-call scar tissue compounds over years and is gate-kept by experience.

## Ease for this candidate — **3/5 (MEDIUM-HIGH)**

**Why:** CI/CD and deployment experience from Axess + Elyt gives a ~40% head start. Remaining 60% (K8s prod-debug, Terraform governance, on-call reflexes, observability depth, cloud cert) = 6–9 months deliberate + first role. CKA exam ~6 weeks; full senior profile 9–12 months.

## Scoring

| Dim | Score |
|---|---|
| AI-resistance | 5 |
| Long-term | 5 |
| AT market | 4 |
| EU market | 5 |
| US market | 4 |
| Ease | 3 |
| **Weighted /10** | **8.0** |

## Verdict

**Best pure-play option.** If candidate rejects the stacked M approach (e.g. deprioritizes Elyt), E is the clean #2. Inherit Salzburg-accessibility through Porsche Informatik / Dynatrace. Expected 12-month outcome: €75–90K gross at AT platform-eng role.

## Open research

- P1.2 — week-by-week ramp curriculum (CKA → AWS SA → Terraform → CKS)
- P0.2 — real JD analysis per target employer (see [../data/jd-samples.md](../data/jd-samples.md))
