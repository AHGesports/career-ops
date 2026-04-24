# Option F — Security / DevSecOps

**Status:** Primary HEDGE for option M. Best pure durability on the board, slowest ramp.
**Score:** 7.0/10 weighted

See: [README](../README.md) · [options](../options.md) · [final](../final.md)

Related: [../decisions/hedge.md](../decisions/hedge.md)

---

## Description

Pivot to compliance-gated security work: cloud security, AppSec, DevSecOps, NIS2/DORA/EU-AI-Act compliance engineering, vulnerability management, threat modeling.

Certs path: Security+ (baseline) → OSCP (the real gate) → optionally CISSP (requires 5 YOE security).

Titles: DevSecOps Engineer, Security Engineer, AppSec Engineer, Cloud Security Engineer, Security Architect, Compliance Engineer.

## Pros
- Structurally the **most AI-resistant** category. Compliance judgment, auditor-facing work, red-team intuition are liability-bound — no CIO delegates legal exposure to a coding agent.
- **Regulatory forcing function:** NIS2 deadline Oct 2026 (every AT "essential" and "important" entity hiring), DORA in force Jan 2025 (all financial entities), EU AI Act phased 2025–2027. Estimated €34B DACH compliance spend through 2027 ([LinkedIn/Hasani](https://www.linkedin.com/pulse/dach-market-alert-dora-nis2-34-billion-compliance-wave-nora-hasani--xygff)).
- AT DevSecOps P50 ~€73K, senior ~€84K ([SalaryExpert](https://www.salaryexpert.com/salary/job/devsecops-engineer/austria)).
- Stable employers: banks, insurance, telco, critical infrastructure.

## Cons
- **12–18 month ramp**, cert-gated. OSCP is the real gate (hard, expensive ~€1549, high signal).
- No Elyt leverage — cold pivot.
- Candidate has zero documented security experience; banks will filter on cert + demonstrable experience, not on interest.
- Culture different from product-engineering — more process, less shipping.

## AT market

- ~120 DevSecOps / Cloud Security / AppSec postings across AT boards.
- Senior AT €80–95K at regulated entities (premium above generic senior SWE).
- **Employers:** Erste Group Security, Raiffeisen Bank International, ÖBB CISO office, A1 Telekom, Kapsch TrafficCom, OMV, Verbund — all NIS2 "essential" entities.

## EU market

- DE/CH very strong. Remote-DACH security eng €90–120K. Swiss banks CHF 130–160K on-site.
- **Employers:** Deutsche Börse, Allianz, Swiss Re, Zurich Insurance, German Sparkasse tech units, DATEV, SAP Security, Siemens Healthineers, Snyk, Aikido, Wiz EU, Semgrep, Datadog Security.

## US market

- Huge, but US security hiring heavily residency-gated (clearances common).
- **Product-security remote-EU-friendly:** Snyk, Aikido, Wiz (EU hires), Semgrep, Datadog Security, Checkmarx, Veracode.

## Long-term outlook 2026–2031

- **Structurally growing.** Regulatory load only increases (NIS3 already in draft, DORA extensions, EU AI Act enforcement 2026–2027, potential EU sovereign-cloud mandates).
- Most durable category on the board for 2028–2031.

## AI-replacement risk — **5/5 (VERY LOW)**

**Why:** Liability-bound work is structurally human. Auditors don't accept "the agent said it was fine." Compliance attestations must be signed by a named human. Red-team / threat-modeling requires adversarial reasoning. The parts that DO automate (SAST scans, dependency checks, policy-as-code) are tool maturation, not role replacement.

## Ease for this candidate — **2/5 (LOW)**

**Why:** Cold pivot. No existing security signal on CV. Ramp:
- Security+ (~€400, 3 weekends)
- TryHackMe / HackTheBox daily (2–3 months to gain competence)
- OSCP (4–6 months intensive) — the real gate
- First junior-security role (€55–65K entry — pay dip short-term)
- 12–18 months tenure before senior DevSecOps

Total to €85K target: ~2 years minimum, with pay dip during transition.

## Scoring

| Dim | Score |
|---|---|
| AI-resistance | 5 |
| Long-term | 5 |
| AT market | 4 |
| EU market | 4 |
| US market | 3 |
| Ease | 2 |
| **Weighted /10** | **7.0** |

## Verdict

**Best pure durability on the board, but slowest ramp + pay dip + no Elyt leverage = #1 HEDGE path, not primary.** Trigger conditions in [../decisions/triggers.md](../decisions/triggers.md):
- If M primary stalls by Month 9 (no offer ≥ €90K), pivot remaining 6 months to OSCP → NIS2 roles Spring 2027.

## Low-cost hedge actions (do regardless)

- Security+ cert in Q2 2026 (~€400, 3 weekends) = baseline credential; small investment, big optionality.
- Subscribe to 1–2 security newsletters (Risky Business, tl;dr sec).

## Open research

- P1.4 — exact cert path costs and timelines
- P3.1 — NIS2 AT implementation specifics, NIS-Behörde guidance, "essential" vs "important" sector list
- P3.2 — DORA-covered AT financial entities hiring patterns
