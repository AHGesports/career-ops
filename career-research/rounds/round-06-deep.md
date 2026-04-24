# Round 06 — Data-hardening deep research

**Date:** 2026-04-20
**Scope:** Execute P0.1 (Elyt audit), P0.2 (real JDs per top option), P0.3 (salary P25/P50/P75) from [TODO.md](../TODO.md).
**Agent:** general-purpose agent with WebFetch/WebSearch access, running in parallel with main-agent folder restructuring.

See: [README](../README.md) · [final](../final.md)

Outputs produced:
- [../data/elyt-audit.md](../data/elyt-audit.md)
- [../data/jd-samples.md](../data/jd-samples.md)
- [../data/salary-bands.md](../data/salary-bands.md)

---

## Headline findings

### 1. Elyt audit verdict: **(c) demo / portfolio piece** — HIGH confidence

Independent signals:
- `elyt-ai.com/pricing` → 404
- `elyt-ai.com/login` → 404
- `app.elyt-ai.com` → ECONNREFUSED
- LinkedIn company page → 404
- GitHub (AHGesports): 13 repos, 21 stars, none named Elyt
- Zero HN, Product Hunt, Reddit, press mentions
- No named customer logos or case studies

**Additional surprise finding:** the Elyt landing page actually targets the **anti-detect / multi-account / growth-hacking** market (integrates with AdsPower, MoreLogin, GoLogin, MultiLogin, Kameleo, Dolphin Anty, Incogniton). This is **NOT** the "enterprise agentic automation" market implied in [candidate.md](../candidate.md). The mismatch hurts portfolio signal at exactly the target employers (Browserbase, Skyvern, Langfuse, Parloa) that prior rounds assumed would value it.

### 2. Real JD analysis: K8s universal; Python for AI; .NET invisible for AI

- **K8s = universal** in 8/8 senior AT platform postings sampled.
- **Python = table-stakes** in 7/9 AI/agent JDs. **.NET does not appear** in any AI-specific posting sampled.
- **CKA is not a hard gate** in any of 8 AT platform JDs read — it's a signal booster, not a filter.
- **Parloa requires 5 YOE explicit** — candidate at 4 YOE is on the filter edge at top AI scaleups.
- **Bitpanda Ops Hub JD** is the cleanest Option J match (Java/Spring/Kafka/AWS/K8s + fintech).
- **Porsche Informatik Senior DevOps Platform Engineer** is the single most accessible JD on the board: Salzburg-local, 3+ YOE ask, ~70% stack overlap with candidate's current work.

### 3. Salary distributions — several prior-round numbers were too low

- **Senior Platform/DevOps AT P50 = €78.75K** (Glassdoor AT 2026 senior DevOps). Prior rounds cited €65K — that was "Platform Engineer all seniorities." Correct senior anchor is **~€78–80K**, 20% above prior assumption.
- **KV-IT ST2 Erfahrung €76.2K** = candidate's automatic 24-month floor by tenure alone. Anchoring below this is capitulation.
- **Remote-US contractor NET is ~50–55% of gross** after AT SVS + income tax + admin. A $150K USD contract → **€60–68K NET** (was estimated at €70–85K — revised down).
- **Remote-US contractor only wins at AI/agent tier** ($180K+ USD → €75K+ net). At platform-tier it's a wash; at backend-tier it's a loss vs. AT salaried.

## Score revisions

| Option | Prior score | Revised score | Why |
|---|---|---|---|
| **M — Platform + Agent/AI stacked** | 8.1 | **7.6–7.8** | Elyt-leverage premium shrinks without traction. M's Elyt-leverage was the differentiator over E. |
| **D — Applied AI / Agent Engineer** | 7.4 | **6.8–7.0** | Without Elyt proof, D is pure-skills competition at 4 YOE against 5+ YOE candidates. Ceiling case evaporates. |
| **E — Platform / SRE / DevOps** | 8.0 | **8.0 (unchanged)** | Data validates E. Senior P50 uplift to €78K makes E's floor 20% stronger. |
| J, F, H, K, A, B, C, G, I, L, N | unchanged | unchanged | No new data directly affects these. |

## Revised ranking

| Rank | Option | Score | Change |
|---|---|---|---|
| **1** | **E — Platform / SRE / DevOps** | **8.0** | ↑ (was #2) |
| 2 | M — Platform + Agent/AI stacked | 7.6–7.8 | ↓ (was #1) |
| 3 | D — Applied AI / Agent Engineer | 6.8–7.0 | ↓ |
| 4 | J — Fintech Backend | 7.3 | unchanged |
| 5 | H — Backend / Distributed IC | 7.1 | unchanged |
| 6 | F — Security / DevSecOps | 7.0 | unchanged (HEDGE role unchanged) |
| 7 | G — Data Engineering | 7.0 | unchanged |

## Strategic implications

### Two plausible responses

**Response A — 60-day Elyt-proof sprint, then reassess**
- Spend 2–3 weekends converting one Elyt component to clean open-source release (TS↔Python type-gen, LLM-provider abstraction, or workflow engine). Target ≥50 GitHub stars.
- If traction materializes → Elyt upgrades to (b) or (a) verdict, M score recovers to 7.8–8.0, back on top.
- If traction doesn't materialize in 60 days → commit to E as primary.
- Pro: preserves optionality; Elyt is a sunk cost already and OSS conversion is cheap.
- Con: 60 days of split attention; Elyt-reframing (away from anti-detect/growth-hacker market) adds friction.

**Response B — Pivot primary to E immediately**
- Drop the M framing. Execute pure Option E. Lead CV with Axess re-architecture + SSO + POS (verifiable production scope) and DevOps/CI-CD experience. Mention Elyt as "solo-built agentic browser automation side project" not "platform."
- Pro: cleaner narrative, Porsche Informatik (Salzburg-local!) is a direct match, 30+ AT JDs align.
- Con: leaves D-ceiling upside unclaimed.

### Recommended: Response A with strict deadline

The Elyt-to-OSS conversion is cheap optionality. Commit to 60-day sprint with a hard trigger: if Elyt OSS component doesn't hit 30+ stars or credible traction by 2026-06-20, pivot primary to E and demote Elyt to CV bullet.

See [../decisions/primary.md](../decisions/primary.md) for updated primary decision.

## Contradictions with prior rounds

- **Round 05's M=8.1 primary** — weakened. Still #1 if Elyt converts; else #2.
- **Round 05's "Elyt is asset if commercialized"** — this round shows it's NOT commercialized; audit closes the hypothetical.
- **Round 05's Platform Eng Vienna P50 €65K** — revised to €78.75K senior.
- **Round 02's "remote-US contractor = ~€70–85K net"** — revised to €58–73K for backend tiers; €75–115K only at AI tier.
- **Prior rounds' Parloa-as-target-employer** — still valid but filter-risk (5 YOE) is real; candidate needs portfolio offset.

## Open questions surfaced (feed into TODO.md)

1. Elyt repositioning: should the landing page remove anti-detect framing before hiring-manager review? See [../data/elyt-audit.md#implications](../data/elyt-audit.md).
2. Specific Porsche Informatik interview process — not yet researched (P4.1 candidate for next round).
3. DACH remote-full platform-eng roles are rare — need explicit hunt for the 10% that are fully remote.
4. 4-YOE filter pressure at Parloa-tier → compensating portfolio actions: which OSS repos would most strongly offset?
5. Elyt's anti-detect market positioning: is there commercial pull there that we're ignoring? Worth 1 separate audit round?

## Files produced

- [../data/elyt-audit.md](../data/elyt-audit.md)
- [../data/salary-bands.md](../data/salary-bands.md)
- [../data/jd-samples.md](../data/jd-samples.md)

## Propagation status

- [x] round-06-deep.md (this file)
- [ ] final.md updated
- [ ] options/M-platform-plus-agent.md updated
- [ ] options/D-applied-ai.md updated
- [ ] options/E-platform-sre.md updated
- [ ] decisions/primary.md updated
- [ ] TODO.md updated
- [ ] candidate.md note re: Elyt public verification

To be completed by main agent immediately following this round.
