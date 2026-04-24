# 12-month action plan — Primary Option M

See: [../decisions/primary.md](../decisions/primary.md) · [../decisions/triggers.md](../decisions/triggers.md) · [../options/M-platform-plus-agent.md](../options/M-platform-plus-agent.md)

---

## Framing

Execute Option M (Platform + Agent/AI stacked) as primary. Run Option F hedge at 15% effort in parallel. Run Option K sidequest at 5% effort. Keep Option A as pure fallback insurance.

All months index from **2026-05-01** (Month 1). End date: **2027-04-30**.

## Month 1 — May 2026

### Elyt positioning (critical, time-sensitive)
- [ ] Decide based on [../data/elyt-audit.md](../data/elyt-audit.md):
  - (a) If Elyt has real users/revenue → upgrade CV framing to "Founder & Principal Engineer, Elyt."
  - (b) If Elyt is a portfolio piece → open-source one reusable piece (eval harness / browser-action DSL / trace format) with README on HN + LinkedIn.
  - (c) If Elyt is just a prototype → demote to one CV bullet; proceed with M on Platform leg.

### Platform ramp
- [ ] Buy CKA exam voucher. Start Killer.sh prep 2h/day.
- [ ] Stand up personal GitOps K8s cluster at home (k3s + Argo CD + Flux). Deploy Elyt to it.

### CV + LinkedIn
- [ ] Rewrite CV headline: "Full-stack + Platform & Agent Specialist · 4 YOE · Built Elyt (agentic platform)"
- [ ] Update LinkedIn with same headline. Post one technical write-up teaser.

### Calibration applications
- [ ] Apply to 3 AT platform-eng roles (Porsche Informatik, Dynatrace Davis AI, Anexia) as calibration signal. Don't accept yet; observe interview-invite rate.

### Hedge-F baseline
- [ ] Book Security+ exam for July 2026. ~€400.

## Month 2 — June 2026

### Platform
- [ ] Pass CKA exam.
- [ ] Book AWS Solutions Architect Associate for August.

### Public signal #1
- [ ] Publish blog post: "Building production browser agents — what actually breaks." Post to Hacker News, LinkedIn, dev.to.
- [ ] Open-source chosen Elyt piece. README in English with code examples.

### Agent/AI ramp
- [ ] Read: Anthropic's Prompt Eng course, LangChain docs. Hands-on with Langfuse dashboard on Elyt traces.

### Network
- [ ] Reach out to 5 people on LinkedIn at Dynatrace Davis AI / Celonis / Anexia. Coffee chat requests, no pitches.

## Month 3 — July 2026

### Platform
- [ ] Pass AWS SA Associate.
- [ ] Start Terraform Associate prep (2 weeks).
- [ ] Security+ exam.

### Public signal #2
- [ ] Publish blog post: "An eval harness for browser agents" with code. Reference open-sourced Elyt piece.

### Network
- [ ] 5 more coffee chats at Browserbase / Parloa / Langfuse / Continue.dev (remote-EU targets).
- [ ] Attend 1 meetup / conference (Vienna DevOps Meetup, Salzburg Tech Meetup, or similar).

### Observability deepening
- [ ] Prometheus + Grafana + OTel deployment at the personal K8s cluster. Instrument Elyt. Publish dashboards as template OSS.

## Month 4 — August 2026

### Platform
- [ ] Pass Terraform Associate.
- [ ] CKS (security) or CKAD (app dev) — choose based on which direction network conversations trended.

### Serious applications start
- [ ] 5 applications/week minimum. Mix:
  - 2 AT-local platform/M-fit roles
  - 2 remote-DACH M-fit roles
  - 1 remote-US/EU agent-eng role
- [ ] Track: interview invite rate, rejection reasons, comp anchors from hiring managers.

### Hedge continues
- [ ] 1 TryHackMe / HackTheBox challenge per week (maintenance).

## Month 5 — September 2026

### Trigger T-03 check
- [ ] **If no onsite invites by end of month: diagnose.** Request feedback from Month 3 coffee-chat network. Is it CV, market, or candidate signal?

### Onsite prep
- [ ] System-design prep for Platform interviews: cloud architecture, K8s in prod, eventual consistency.
- [ ] System-design prep for Agent interviews: eval harness design, RAG-at-scale, cost/latency tradeoffs.

### Third public signal (tactical)
- [ ] Publish blog post: "Running agents on Kubernetes — cold-start, scale-to-zero, cost" with code. Differentiates candidate at exactly the M intersection.

## Month 6 — October 2026

### Negotiate
- [ ] If offer(s) on the table: negotiate. Anchor €90K+ AT / €100K+ remote-DACH. Use Bitpanda P50 €79K and Dynatrace tier as comps.
- [ ] **Trigger T-04 / T-05 evaluation:** see [../decisions/triggers.md](../decisions/triggers.md).

### NIS2 deadline (external)
- [ ] NIS2 compliance deadline for "essential" AT entities. Security job market should visibly heat up. Note target employer list for potential F-pivot in 2027.

## Month 7 — November 2026

### Close or iterate
- [ ] If accepted offer: finalize contract, notice Axess (6 weeks), prepare transition.
- [ ] If no offer yet: iterate (feedback-driven CV rewrite, widen search geography, consider stretch roles at lower comp).

## Month 8 — December 2026

### Decision point
- [ ] Either: onboarding new role.
- [ ] Or: comprehensive M9 trigger evaluation. If offers are progressing slowly but still active, continue M. If pipeline is dry → trigger T-06.

## Month 9 — February 2027

### Trigger T-06 check (critical)
- [ ] **If no offer ≥ €85K:** pivot 60% of career-dev time to F hedge.
- [ ] Book OSCP exam (~€1549). Start 4–6 month intensive prep.
- [ ] Target NIS2 / DORA compliance roles at Erste / Raiffeisen / OMV / ÖBB / A1 Telekom for Spring 2027.

## Months 10–12 — March–April 2027

### Case A — M succeeded
- [ ] Settle into new role.
- [ ] Keep Elyt alive as public infra / OSS.
- [ ] Continue Security+/passive hedge (1 TryHackMe/week) as ongoing optionality.

### Case B — F hedge activated
- [ ] OSCP in progress.
- [ ] Apply NIS2 compliance roles with "backend + security awareness + compliance project" positioning.
- [ ] Target signed offer by June 2027.

### Case C — Neither worked
- [ ] Fall back to Option A: senior-.NET role at Dynatrace/Bitpanda/Porsche Informatik at €75K.
- [ ] Reassess in 12 months (annual career-research review).

## Ongoing disciplines (every month)

- 1 hour per week: read industry blogs (Pragmatic Engineer, Addy Osmani, Simon Willison, Kube.careers, NIS2 news)
- 30 min per week: review [../TODO.md](../TODO.md), mark progress, add new items
- Quarterly: re-evaluate trigger thresholds against new market data
- Keep Elyt project active (no commits for > 2 months = signal death)

## Budget

| Item | Approx cost |
|---|---|
| CKA exam | €350 |
| AWS SA Associate | €150 |
| Terraform Associate | €150 |
| CKS or CKAD | €350 |
| Security+ (hedge) | €400 |
| OSCP exam (only if T-06 triggers) | €1549 |
| Study materials | €200 |
| Conference / meetups | €300 |
| TryHackMe subscription | €180/yr |
| **Total 12-month investment** | **~€1,800 (no OSCP) / €3,350 (with OSCP)** |

Return on investment: €15–30K per year in comp uplift if M succeeds. ROI ratio 5–15×.
