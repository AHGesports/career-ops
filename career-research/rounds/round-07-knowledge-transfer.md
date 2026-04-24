# Round 07 — Knowledge-transfer dimension + reranking

**Date:** 2026-04-20
**Scope:** Candidate explicit goal: "transfer my knowledge of programming and software development to the next career development." Add knowledge-transfer as a 7th scoring dimension; re-rank all options. Clarified: general SWE principles count; specific tech stack (C#/.NET/Oracle) and business domain (ticketing) do NOT count.

See: [README](../README.md) · [methodology.md](../methodology.md#scoring-rubric-for-options-evaluation) · [final.md](../final.md) · [../decisions/primary.md](../decisions/primary.md)

---

## The new dimension

**"Knowledge transfer"** = what fraction of the candidate's general software-development knowledge maps to the new role's daily work.

**Counts as transfer (general SWE):** system design, debugging, testing discipline, API design, database thinking, concurrency, refactoring, code review judgment, scalability, security fundamentals.

**Does NOT count (specific / domain):** .NET-specific familiarity, Angular-specific familiarity, Oracle/PL-SQL, ticketing/POS industry knowledge.

Rationale: the candidate wants his *programming craft* to transfer, not his stack-identity. The fungibility premise ([round 04](round-04-fungibility.md)) already covered language swaps. Now we measure whether the role IS still programming work at a similar abstraction level.

## Per-option knowledge-transfer scores

| Option | Transfer | Reasoning (general SWE principles) |
|---|---|---|
| A Stay .NET | 5/5 | Identical role; same abstraction; 100% SWE-principle overlap |
| B Java / Spring | 5/5 | Backend is backend; SOLID/TDD/system-design/API-design all apply unchanged |
| C React / Next | 4/5 | Frontend SWE principles apply, but UI state / rendering / a11y / CSS are specific disciplines — less "pure" SWE |
| D Applied AI / Agent | 5/5 | Python service work, API design, async, debugging, testing all apply. LLM-eval design is new but it IS SWE (test-set design = test engineering) |
| E Platform / SRE / DevOps | 3/5 | Debugging and system design apply strongly. But significant portion is config/incidents/on-call/ops — these are not programming acts. Modern internal-dev-platform roles (Grafana/Celonis tier) transfer higher (~4/5); ops-heavy SRE roles transfer lower (~2/5). Weighted 3/5. |
| F Security / DevSecOps | 2/5 | Code review + SOLID help; but threat modeling, red-team reasoning, compliance judgment are different disciplines. Paradigm shift. |
| G Data Engineering | 4/5 | SQL/Python + pipeline design apply; data-specific patterns (schema evolution, lineage, warehouse modeling) are adjacent-discipline, not pure app SWE |
| H Backend / Distributed IC | 5/5 | Pure SWE at higher rigor. All principles apply + deepen |
| I Embedded / Real-time | 3/5 | Programming principles apply, but hardware-in-loop, timing, memory-mapped work is a different paradigm. ~50% overlap. |
| J Fintech Backend | 5/5 | Backend is backend; domain is separate concern. All SWE principles apply unchanged |
| K Founding Engineer | 5/5 | Full-stack solo delivery — exactly what general SWE IS. Elyt is literal proof |
| M Platform + Agent (stacked) | 4/5 | Weighted avg of D-leg (5) + E-leg (3). Slightly platform-flavored → 4 |
| L Remote-US contractor | inherits underlying role | |
| N Go/Rust | (not standalone) | |

## Revised weights (round 07)

AI-resistance ×2, Long-term ×2, AT market ×1, EU market ×1.5, US market ×1, Ease ×1.5, **Knowledge transfer ×2**.

Max weighted total = 11 × 5 = 55. Normalize to /10 by ×(10/55).

## Revised ranking

| Rank | Option | R05 score | R06 score | **R07 score** | Change |
|---|---|---|---|---|---|
| **1** | **M — Platform + Agent/AI stacked** | 8.1 | 7.6–7.8 | **8.7** | ↑ |
| 2 | **H — Distributed Systems IC** | 7.1 | 7.1 | **8.5** | ↑↑ |
| 3 | **E — Platform / SRE / DevOps** | 8.0 | 8.0 | **8.4** | ↑ slight |
| 4 | **D — Applied AI / Agent Engineer** | 7.4 | 6.8–7.0 | **8.3** | ↑↑ |
| 5 | **J — Fintech Backend** | 7.3 | 7.3 | **8.1** | ↑ |
| 6 | K — Founding Engineer | 6.9 | 6.9 | **8.0** | ↑ |
| 7 | G — Data Engineering | 7.0 | 7.0 | **7.7** | ↑ |
| 8 | F — Security / DevSecOps | 7.0 | 7.0 | **7.3** | flat |
| 9 | I — Embedded / Real-time | 6.1 | 6.1 | **7.0** | ↑ slight |
| 10 | B — Pivot to Java | 5.1 | 5.1 | **6.8** | ↑ |
| 11 | A — Stay .NET | 5.9 | 5.9 | **6.7** | ↑ |
| 12 | C — Pivot to React | 4.4 | 4.4 | **5.9** | ↑ |

## What changed vs. round 06

**Biggest risers under transfer weighting:**
- **D (Applied AI)** +1.5. Python/LLM/agent work is pure SWE; Elyt gave candidate the foundation. Transfer dimension surfaces this even though round 06 downgraded D for credibility reasons.
- **H (Distributed Systems)** +1.4. Pure backend SWE; all principles apply at higher rigor. Access still the bottleneck.
- **B (Java), A (.NET), C (React)** all rise because same-discipline work transfers fully. But other dimensions (AI-replacement, long-term) still keep them in the bottom tier.

**Relative drop:**
- **E (Platform)** rises only slightly because transfer penalty (3/5) holds it back. Ops/incidents/config work is NOT programming.
- **F (Security)** stays near-flat. Transfer penalty (2/5) is real — security is a different discipline despite sharing tools.

## Does primary recommendation change?

**Short answer: primary stays E. But J and D are now serious alternative contenders.**

### Why M doesn't automatically become primary despite highest score (8.7)

M's Elyt-credibility gate from [round 06](round-06-deep.md) is independent of skill transfer. Knowledge-transfer dimension measures "does candidate's programming work apply day 1" — answer for M is yes (4/5). Credibility dimension measures "does hiring manager believe candidate at target employer" — answer without Elyt proof is no at Browserbase/Skyvern/Parloa tier. These are orthogonal.

Round-06 primary decision stands: execute E, run 60-day Elyt-OSS sprint, upgrade to M if traction materializes.

### Why H doesn't become primary despite high score (8.5)

H's ease score is 2/5 — access to distributed-systems-at-scale employers requires signal the candidate doesn't yet have. Highest-SWE-transfer role on the list, but the entry ticket requires either (a) scale-employer tenure or (b) public portfolio of distributed work. Neither available today. H is the right 5-year destination, best accessed through E at a scale-out employer (Dynatrace, Grafana, Bitpanda trading desk).

### New insight: J (Fintech Backend) now a genuine primary alternative

J's new score 8.1 tied with K and close behind E. Key advantages under transfer-weighting:
- Pure backend SWE transfer (5/5)
- Durability 5/5 (compliance-gated, DORA-driven)
- Domain moat compounds over 18–24 months in-role
- Bitpanda (Vienna) is a specific accessible target
- Atra cross-border trade experience is real relevant domain signal

J's disadvantages vs E:
- AT volume lower (~30–50 fintech vs 154 platform postings)
- Access harder (Bitpanda is single dominant target)
- No Salzburg-local option

**If candidate values programming-purity above everything else**, J is the more consistent choice: 100% SWE transfer, clean backend work, no ops-tax on daily time.

**If candidate values accessibility + verified floor**, E remains primary.

### Revised three-track recommendation (post round 07)

| Track | Role | Why |
|---|---|---|
| **Primary** | **E — Platform/SRE/DevOps** | Highest accessibility score among top-5; Porsche Informatik Salzburg-local; verifiable Axess CI/CD credibility |
| **Primary alternative (if candidate prefers pure programming)** | **J — Fintech Backend at Bitpanda/RBI** | Highest SWE-transfer at 5/5 among accessible options; durable domain; Atra signal |
| **Conditional upgrade** | **M — Platform + Agent/AI** | Requires Elyt OSS sprint (60 days) |
| **Hedge** | F — Security / DevSecOps | Security+ as low-cost hedge; OSCP if M9 primary stalls |
| **5-year destination, accessed through primary** | H — Distributed Systems IC | Landing in E or J at a scale-out employer → accrue H moat over 18–24 months |

## Candidate-facing framing

The knowledge-transfer dimension makes the **bottom of the list less punishing** (A, B all rise) and makes the **programming-heavy middle shine brighter** (D, H, J, K rise substantially).

It does NOT elevate .NET-stay to primary because AI-resistance (2/5) and long-term (2/5) still dominate the weighted total. You can stay in SWE-land without staying in .NET-land.

The real choice point: **E** (accepts 3/5 transfer for highest accessibility) vs **J** (accepts narrower market for 5/5 transfer). Both are defensible.

## Propagation status

- [x] round-07-knowledge-transfer.md (this file)
- [x] methodology.md updated with dimension definition
- [ ] final.md top ranking table needs update
- [ ] decisions/primary.md should note round-07 consideration (E vs J)
- [ ] individual options/*.md files: new score notes pending (authoritative ref is this round file)
- [ ] TODO.md: no new P0 items surfaced; existing items unchanged
