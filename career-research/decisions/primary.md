# Primary decision — after round 06 + round 07

**Round 05:** Option M primary (score 8.1).
**Round 06 revision:** E primary (8.0), M conditional (7.6–7.8) after Elyt-audit credibility concern.
**Round 07 revision:** added knowledge-transfer dimension. M rises to 8.7, E to 8.4, **J to 8.1** (new contender). **Primary decision unchanged: E. J added as primary-alternative for candidates prioritizing pure-programming transfer.**
**Confidence:** HIGH.
**Date:** 2026-04-20 (rounds 05 → 06 → 07).

## Round 10 addition: E CV-framing sharpens + primary rec CONFIRMED

Round 10 ([../rounds/round-10-ai-replacement-deep.md](../rounds/round-10-ai-replacement-deep.md)) validated E + D-Microsoft with 7 new 2026 sources (Stanford v3, METR RCT, Stack Overflow frontend −10%, KORE1 FinOps data, Surfing Complexity SRE, Willison Nov 2025, Pragmatic Engineer Q1 2026). No integer score changes; all new data points same direction as prior ranking.

**Qualitative refinement for E execution:** CV should lead FinOps + K8s + Terraform + AI-workload ops, NOT generic "senior platform engineer." NVIDIA SRE median $350K in 2026; FinOps-literate platform engs close offers fastest (KORE1). The AI-workloads-on-K8s intersection is where premium comp lives.

**Reinforced avoids:** pure frontend as identity (C) — labor data now confirms −10% YoY; pure Java IC generalist (B); generalist full-stack CRUD in bootcamp-supplied markets.

---

## Round 09 addition: D-Microsoft as parallel AI track

Round 09 ([../rounds/round-09-dotnet-ai.md](../rounds/round-09-dotnet-ai.md)) invalidated round 06's "Python-only AI" assumption. Microsoft Agent Framework 1.0 shipped GA 2026-04-03 with DACH enterprise adoption (RBI, Siemens, BMW, KPMG, Post AG). Real live JD at Post AG €70K+ Senior AI Engineer in Vienna matches candidate's .NET profile almost 1:1.

**Updated recommendation:**

- **Primary: Option E** (Platform / SRE / DevOps) — unchanged.
- **Parallel AI track: Option D-Microsoft** (NEW) — the best-execution AI path for THIS candidate. 4–6 week ramp (vs 4–6 months for D4-Python), no Elyt-OSS credibility gate, Salzburg-accessible employers exist. See [../options/D-microsoft.md](../options/D-microsoft.md).
- **Conditional upgrade: Option M** (Platform + Agent/AI) — unchanged, still gated by Elyt-OSS sprint.
- **Remote-EU/US AI ceiling: Option D4-Python** — unchanged, still gated by Elyt-OSS sprint. See [../options/D-applied-ai.md](../options/D-applied-ai.md).
- **Hedge: Option F** (Security) — unchanged.

**Two CV variants strategy (new):**
- **.NET + Azure AI lead** — for DACH-enterprise targets (Post AG, RBI, Erste, Siemens, Porsche Informatik). Keep .NET 8 + C# + Azure + SSO in headline. Add Semantic Kernel / Agent Framework demo.
- **Python + Elyt lead** — for remote-EU/US AI targets (Parloa, Langfuse, Browserbase, Skyvern). Demote .NET; lead Python + FastAPI + LLM + agent experience. Requires OSS artifact.

These target non-overlapping hiring filters — no need to pick one or the other at the CV level.

**Immediate action** (within 30 days): apply to Post AG Senior AI Engineer ([karriere.at/jobs/7619955](https://www.karriere.at/jobs/7619955)) and similar DACH-enterprise .NET-AI roles with the .NET+Azure-AI CV variant. This is the highest-probability AI offer on the board for candidate's current profile.

---

## Round 07 addition: primary-alternative J

Under the knowledge-transfer weighting, Option J (Fintech Backend at Bitpanda/RBI) scores 8.1 with **5/5 SWE-transfer** (backend is backend; general SWE principles apply unchanged). E still wins the primary slot on accessibility (Porsche Informatik Salzburg-local, 154 AT postings vs ~30–50 fintech), but J is a defensible alternative if the candidate explicitly values programming-purity over accessibility-floor.

**Decision heuristic for E vs J:**
- If candidate wants highest-floor + Salzburg-accessibility + is OK with 60% programming-time (ops/config/incidents are 40% of platform work) → **E**
- If candidate wants 100% programming-time + durable domain moat + is OK with Vienna-commute for Bitpanda → **J**

Round 07's knowledge-transfer ranking is in [../rounds/round-07-knowledge-transfer.md](../rounds/round-07-knowledge-transfer.md). The rest of this file (round 06 analysis) remains authoritative on strategy; round 07 only adds J as a parallel option.

---

**Previous decision (round 06):** Option E (Platform / SRE / DevOps) primary; Option M as 60-day conditional upgrade.

See: [hedge.md](hedge.md) · [triggers.md](triggers.md) · [../plans/action-plan-12mo.md](../plans/action-plan-12mo.md) · [../rounds/round-06-deep.md](../rounds/round-06-deep.md) · [../data/elyt-audit.md](../data/elyt-audit.md)

---

## What changed since round 05

Round 06 audit found that **Elyt has no publicly verifiable commercial traction** — HIGH confidence verdict (c) demo/portfolio piece. See [../data/elyt-audit.md](../data/elyt-audit.md) for full evidence.

Consequences:
- Option M's Elyt-leverage premium shrinks (8.1 → 7.6–7.8).
- Option D's ceiling case evaporates without proof (7.4 → 6.8–7.0).
- Option E moves from #2 to **#1 (8.0)** on the strength of verified platform-engineer market data + candidate's existing CI/CD experience + availability of Salzburg-local target employer (Porsche Informatik).

## The decision

**Primary path: Option E (Platform / SRE / DevOps).**

- Target titles: Senior Platform Engineer, Senior DevOps Engineer, SRE, Cloud Platform Engineer.
- Target employers (AT): **Porsche Informatik** (Salzburg HQ, top target), Dynatrace (Linz — 1h20 commute or remote), Anexia (Vienna/Klagenfurt), BRZ (Vienna), A1 Digital, Raiffeisen Informatik, Erste Tech Hub, BERNARD.
- Target employers (remote-DACH): Zalando, Celonis, Delivery Hero, HashiCorp EU, Grafana Labs, Datadog EU, Cloudflare EU.
- Floor: KV-IT ST2 Erfahrung €76.2K (legal floor, already available).
- P50 target: €80K AT / €95K remote-DACH.
- P75 stretch: €92K AT / €110K remote-DACH.

**Conditional upgrade to M (in parallel, 60-day sprint):**

- Open-source one Elyt component (TS↔Python type-gen, LLM-provider abstraction, or workflow engine).
- Target: ≥30 GitHub stars OR clear public-infra story within 60 days (by 2026-06-20).
- If met → upgrade CV framing to M (Platform + Agent/AI stacked), apply to AI-platform roles at €95K+ remote-DACH.
- If not met → drop M framing; proceed with E.

## Why E primary beats M primary right now

1. **M depends on Elyt as proof.** Elyt has no proof. Therefore M's differentiator (rare skill combination legitimized by a production agent platform) is currently not defensible in interviews at Browserbase/Skyvern/Parloa tier.
2. **E's market is verified, local, and accessible.** Porsche Informatik Senior DevOps Platform Engineer JD matches candidate's profile directly. 154 AT postings support volume. Senior P50 €78.75K validated by Glassdoor AT 2026.
3. **E ramp is clean.** K8s + Azure (already candidate's cloud) + Terraform + GitOps. 6–9 months. No cert-gating. No identity pivot.
4. **E still enables the M upgrade later.** If candidate lands an E role that operates AI workloads (Dynatrace Davis AI infra, Celonis agent ops, Bitpanda ML-platform), he can transition to explicit M positioning in 18–24 months with production experience as proof.
5. **Lower execution risk.** M requires *and* Elyt-proof *and* CKA ramp. E requires only CKA ramp. If either independent variable fails, E still executes.

## Why M remains a possibility, not dead

- The Elyt-to-OSS conversion is cheap (2–3 weekends). The upside if traction materializes is significant: M upgrades back to #1, remote-DACH AI-platform comp €95–115K accessible.
- The 60-day trigger is decision-forcing: at 2026-06-20 we either see stars/downloads/issues on the OSS component (→ M path alive) or we don't (→ commit E).

## What this means for candidate.md framing

Per [../data/elyt-audit.md](../data/elyt-audit.md):

- Do NOT lead CV or cover letters with "founder of Elyt — commercial agentic browser automation platform."
- Lead with: "Senior Full-stack + Platform Engineer — Axess re-architecture (POS, SSO, real-time middleware)." This is verifiable production scope.
- Mention Elyt as: "Solo-built agentic browser automation platform — [link to OSS component on GitHub]." After OSS conversion.
- If no OSS conversion happens: "Solo side project: agentic browser automation platform for multi-account workflows."

## Expected outcomes (revised)

| Horizon | Outcome (new) |
|---|---|
| Month 2 (June 2026) | Decision point: Elyt-OSS traction achieved? |
| Month 6 (October 2026) | Onsite interviews at 2–3 E-fit employers (Porsche Informatik as primary target) |
| Month 9 (February 2027) | Signed offer €80K+ gross AT at senior platform-eng role, OR €95K+ remote-DACH |
| Month 12 (April 2027) | Role started. If Elyt-OSS succeeded, CV positions for M-tier roles at Month 18. |
| Month 24 | Either promoted to staff-track at platform-eng employer (€100K+), or pivoted to AI-platform at a new employer (€105K+). |

## Comp targets (revised)

- **Floor (always available):** €76K gross AT (KV-IT ST2 Erfahrung — legal minimum at his level by 2028).
- **Near-term realistic P50:** **€80–85K gross AT** at Porsche Informatik / Dynatrace / Anexia senior DevOps.
- **Stretch P75 (12 months):** €92K AT on-site / €110K remote-DACH at Celonis / Grafana / HashiCorp EU.
- **Ceiling (24 months if Elyt→OSS succeeds and transitions to M):** €115K remote-DACH at AI-platform employer.
- **Remote-US contractor:** only if AI-tier contract at $180K+ USD (→ €75K+ net). Not worth pursuing at platform-tier.

## Confidence interval (revised)

| Outcome | Probability |
|---|---|
| Signed offer ≥ €80K gross AT at senior platform-eng role by M12 | **70%** (up from M prior 65%) |
| Signed offer ≥ €95K remote-DACH by M12 | 30% |
| Elyt-OSS conversion succeeds → upgrade to M ceiling | 35% |
| Fall back to A (.NET) at €70–75K by M12 | 10% |
| Pivot to F hedge (OSCP) triggered by M9 | 15% |
| Founding-engineer offer at reasonable AI startup (requires Elyt proof) | 8% |

## Downside floor

Worst case: E primary stalls + Elyt doesn't convert + F hedge takes 18 months. Fall back to Axess or a senior-.NET role at €70–75K. KV-IT tenure still accrues toward €76K auto-floor. No income interruption.

## Why NOT keep M as primary

Without Elyt proof, M is "I want to be an AI platform engineer" rather than "I am one." Hiring managers at Browserbase / Skyvern / Langfuse / Dynatrace Davis AI will filter on: proven AI-platform work (Elyt fails this without OSS), OSS contributions (candidate has none visible), eval-design experience (not explicitly signaled), production AI workload ownership (Axess is ticketing, not AI). The M framing requires a signal the candidate doesn't currently have. E requires signals he DOES have.

The right sequence: **Execute E. Get hired. Build AI-workload experience in-role over 18 months. Reposition to M with verified production work.**

This is longer than the prior "launch M directly in 12 months" plan but has much higher probability of success.

## Propagated changes

- [x] This decision file (primary.md)
- [x] [../rounds/round-06-deep.md](../rounds/round-06-deep.md)
- [ ] [../final.md](../final.md) — ranking update
- [ ] [../options/M-platform-plus-agent.md](../options/M-platform-plus-agent.md) — score revision
- [ ] [../options/D-applied-ai.md](../options/D-applied-ai.md) — score revision
- [ ] [../options/E-platform-sre.md](../options/E-platform-sre.md) — elevated to primary + Porsche target call-out
- [ ] [../candidate.md](../candidate.md) — Elyt framing note
- [ ] [../plans/action-plan-12mo.md](../plans/action-plan-12mo.md) — revise for E primary
- [ ] [../TODO.md](../TODO.md) — close P0.1–P0.3, add Elyt-OSS sprint as new P0
