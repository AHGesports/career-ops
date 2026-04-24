# Round 08 — No-degree accessibility dimension

**Date:** 2026-04-20
**Scope:** Candidate has no completed university degree (FH Salzburg ITS 2023–2024, IBC Hetzendorf 2022–2023, Payame Noor CS 2021–2022 — all incomplete or in-progress per [../candidate.md](../candidate.md)). He succeeded in SWE without a degree; he wants every option to be accessible on the same basis.

Also confirmed: "ease of getting a job" is already captured by the combination of Market + Ease + (new) Degree dimensions. Not a separate dimension.

See: [README](../README.md) · [methodology.md](../methodology.md) · [round-07](round-07-knowledge-transfer.md) · [final.md](../final.md)

---

## Per-option degree-accessibility scores

Scored 1 (often requires degree) to 5 (never requires; portfolio/experience substitutes).

| Option | Score | Reasoning |
|---|---|---|
| A Stay .NET | 5 | DACH enterprise SWE is experience-driven; HTL/FH/"vergleichbare Berufserfahrung" universal |
| B Pivot Java | 4 | Same, minor exceptions in AT banking ("abgeschlossenes Studium" sometimes listed) |
| C Pivot React | 5 | Pure portfolio/experience-driven |
| D Applied AI / Agent | 3 | Top-tier AI employers (Anthropic, OpenAI, DeepMind-alum) filter on CS/ML degree; applied-AI at DACH scaleups (Parloa, Langfuse) more flexible. Mixed pool. |
| E Platform / SRE / DevOps | 5 | Certs (CKA, AWS) + experience > degree universally |
| F Security / DevSecOps | 4 | Certs (OSCP, CISSP) are the real gate; some government/banking roles list degree preference |
| G Data Engineering | 4 | Mostly experience-driven; quant-heavy data roles at banks may require degree |
| H Distributed Systems IC | 4 | FAANG-tier filters on degree; DACH scaleout employers (Zalando, N26) flexible |
| I Embedded / Real-time | 2 | Often strict EE / CS degree requirement at automotive / industrial employers |
| J Fintech Backend | 3 | AT banks (Raiffeisen, Erste, Bawag) often list "abgeschlossenes Studium"; Bitpanda + fintech-native more flexible |
| K Founding Engineer | 5 | Portfolio + shipping is the filter; no degree consideration |
| M Stacked (E + D) | 4 | Average of E (5) + D (3) |

## New weighted ranking (8 dimensions)

Weights: AI-res ×2, Long-term ×2, AT ×1, EU ×1.5, US ×1, Ease ×1.5, Transfer ×2, Degree ×1. Max = 60; /10 = ×(10/60).

| Rank | Option | R05 | R06 | R07 | **R08** | Change vs R07 |
|---|---|---|---|---|---|---|
| 1 | M Platform + Agent/AI | 8.1 | 7.6–7.8 | 8.7 | **8.67** | flat |
| 2 | **E Platform / SRE** | 8.0 | 8.0 | 8.4 | **8.50** | ↑ slight |
| 3 | H Distributed IC | 7.1 | 7.1 | 8.5 | **8.42** | ↓ slight (degree 4/5) |
| 4 | K Founding Eng | 6.9 | 6.9 | 8.0 | **8.17** | ↑ (degree 5/5 rewards this) |
| 5 | D Applied AI | 7.4 | 6.8–7.0 | 8.3 | **8.08** | ↓ (degree 3/5 hits D) |
| 6 | J Fintech Backend | 7.3 | 7.3 | 8.1 | **7.92** | ↓ slight (degree 3/5) |
| 7 | G Data Eng | 7.0 | 7.0 | 7.7 | **7.75** | flat |
| 8 | F Security | 7.0 | 7.0 | 7.3 | **7.33** | flat |
| 9 | A Stay .NET | 5.9 | 5.9 | 6.7 | **7.00** | ↑ slight |
| 10 | B Pivot Java | 5.1 | 5.1 | 6.8 | **6.92** | flat |
| 11 | I Embedded | 6.1 | 6.1 | 7.0 | **6.75** | ↓ (degree 2/5 is real penalty) |
| 12 | C Pivot React | 4.4 | 4.4 | 5.9 | **6.25** | ↑ |

## Key shifts under degree-accessibility weighting

- **K (Founding Engineer)** rises to #4 — degree is irrelevant at AI-native startups. Portfolio + shipping is the filter. This strengthens K as a genuine parallel track, not just sidequest.
- **D (Applied AI)** drops slightly — degree gate at top-tier AI employers (Anthropic/OpenAI/DeepMind alumni cos) is real. For DACH-only search this matters less (Parloa, Langfuse, Celonis are portfolio-tolerant).
- **I (Embedded)** drops further — already bottom-tier, now confirmed: embedded at automotive/industrial employers frequently filters on EE/CS degree.
- **J (Fintech)** drops slightly — AT banks (Raiffeisen, Erste, Bawag) often list degree requirement. Bitpanda specifically is more flexible.
- **E (Platform)** rises slightly — fully degree-neutral in DACH.

## Does primary recommendation change?

**No.** E remains primary (8.50). M remains conditional upgrade (8.67 gated by Elyt-OSS sprint). Ranking order stabilizes around what round 07 already established.

**Additional insight surfaced:** Option K (Founding Engineer at AI-native startup) is now a stronger secondary target than previously framed. At 8.17 it beats D, J, and G. Its access problem (network-driven, not application-driven) remains, but the upside of landing one is now scored accurately.

## "Ease of getting a job" — confirmed coverage

The candidate explicitly asked whether "ease of getting a job" is already captured. Answer:

**Yes, through three composite dimensions:**

1. **Market scores (AT / EU / US)** — is there demand at all?
2. **Ease for candidate** — can current CV pass the first technical filter in 6 weeks, 6 months, or never?
3. **No-degree accessibility** (now explicit) — are you filtered out before anyone reads the CV?

A role scoring well on all three = easy to land. A role with 150 postings (market 5) but 18-month ramp (ease 2) and degree-required (degree 2) = you hear "no" before you even get an interview.

Not split into a 4th redundant dimension; the composite already maps to hiring-pipeline friction.

## Propagation status

- [x] round-08-degree-gate.md (this file)
- [x] methodology.md — dimension added + ease clarification
- [x] final.md — ranking table updated
- [ ] individual options/*.md — degree score notes pending (round-07 + round-08 are authoritative)
- [ ] decisions/primary.md — round-08 note (below)
- [ ] TODO.md — no new P0 items
