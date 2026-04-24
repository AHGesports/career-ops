# Elyt commercial-traction audit

**Scope.** Primary-evidence check on the claim that Elyt (https://elyt-ai.com) is a "commercial agentic browser automation platform" with production deployment, as stated in the candidate CV and [candidate.md](../candidate.md). This audit only uses externally verifiable signals — not candidate self-report.

**Date.** 2026-04-20. Sources consulted: WebFetch of `elyt-ai.com` root, WebFetch of `/login`, `/pricing`, `app.elyt-ai.com`, Google web search for press/HN/Reddit/ProductHunt mentions, LinkedIn company-page lookup, GitHub org search under the candidate's known handle (AHGesports).

---

## Verdict up front

**(c) — Demo / portfolio piece. Live marketing-site, no visible commerce surface, no community or OSS signal, no independent mentions anywhere on the public web.**

Confidence: **HIGH.** Multiple independent signals all point the same direction. This is not a probabilistic "we couldn't find it" — it is an active-absence finding across 9 channels.

For the purposes of the career evaluation, Elyt should be read as **"sophisticated portfolio project with a polished landing page"**, not as **"production SaaS with users and MRR."** This materially affects Option D (Applied AI) and Option M (Platform + Agent) scoring — see Implications below.

---

## Evidence table

| # | Signal | Finding | Confidence | Source |
|---|---|---|---|---|
| 1 | Is `elyt-ai.com` live? | Yes. Returns a marketing landing page with product description, feature list, and "Book a Demo" / "Contact Sales" CTAs. Copyright 2026. | HIGH | Direct WebFetch |
| 2 | Is there a pricing page? | **No.** `/pricing` returns 404. | HIGH | Direct WebFetch |
| 3 | Is there a login / signup? | **No.** `/login` returns 404. `app.elyt-ai.com` ECONNREFUSED (no app subdomain exists). | HIGH | Direct WebFetch × 2 |
| 4 | Customer logos on site? | **No named customer logos.** The eight logos shown are anti-detect *browser providers* the product integrates with (AdsPower, MoreLogin, GoLogin, MultiLogin, Kameleo, Dolphin Anty, Incogniton) — not customers. Site explicitly lacks testimonials, case studies, named users. | HIGH | Landing-page fetch |
| 5 | Team page / about-us? | None visible. Only attribution: "Founded by Arshia Hemati." | HIGH | Landing-page fetch |
| 6 | LinkedIn company page for Elyt? | **Not found.** `linkedin.com/company/elyt-ai` returns 404. Company not indexed on LinkedIn under this handle. | HIGH | Direct fetch + site-restricted search |
| 7 | Product Hunt launch? | **No launch page found.** Web search for "Elyt" "Arshia Hemati" "Product Hunt" returns zero matching results. | HIGH | WebSearch |
| 8 | Hacker News mention? | **No mention.** Zero results on targeted search. | HIGH | WebSearch |
| 9 | Reddit / Indie Hackers mention? | **No mention.** Search for "elyt" + adspower/multiaccount/automation returns only unrelated AdsPower marketing articles. | MEDIUM-HIGH (absence of thread evidence, but smaller forums not indexed) | WebSearch |
| 10 | GitHub org or OSS repo? | **No public OSS.** Candidate's known GitHub handle (`AHGesports`) has 13 repos / 21 total stars; visible repos are `idk`, `unity-proj`, `unity2proj`, `unityyf`, `E`, `HotelManagementApp`. No repo visibly named "elyt" or related. Search for `"elyt-ai" github` returns zero repos. | HIGH | Direct fetch + WebSearch |
| 11 | Twitter/X presence? | Not independently verified by this audit (no obvious handle surfaced via search). Absence of search surface on a 2026 "commercial AI product" is itself a weak negative. | LOW-MEDIUM | Indirect |
| 12 | Press / review coverage? | **Zero.** Search for `"elyt-ai.com" review` returns only the product's own site plus an unrelated Intex ELYT Dual smartphone from 2018. | HIGH | WebSearch |

---

## What the landing page actually says (and what it implies)

The landing page pitches Elyt as:
- **"Scale from 1 to 1,000 profiles without changing a single workflow"**
- **"AI humanizer generates realistic mouse movements, typing rhythms, random scroll patterns"**
- Integrates with anti-detect browsers (AdsPower, MoreLogin, etc.)
- Target use cases: **data collection, e-commerce price monitoring, lead generation, social media management (Instagram, LinkedIn)**

This positioning is **not "enterprise agentic automation"** as framed in [candidate.md](../candidate.md). It is closer to the **multi-account / scraping / growth-hacking** segment — the same market AdsPower, Multilogin, GoLogin serve. That market exists and is large, but it is fundamentally different from the "Browserbase / Stagehand / Skyvern / Anthropic Applied" market that Option D assumes.

**Two distinct implications flow from this:**

1. **Hiring-signal implication.** When the candidate pitches "founder of Elyt — commercial agentic browser automation platform" to a Browserbase / Skyvern / Langfuse / Parloa recruiter, the linked site will read to them as a scraping / growth-hack tool in the anti-detect space — not as peer infrastructure to what they sell. This significantly degrades the portfolio signal for Option D/M high-credibility employers. MEDIUM confidence (based on how recruiters at that tier typically filter portfolios).

2. **Narrative-risk implication.** The CV claim "In production" is not falsifiable from public signals. There is no self-serve sign-up, no pricing, no stated customer count, no revenue disclosure. A diligent hiring manager who does the same 5-minute audit this document does will reach the same verdict (c) — and will either (a) ask the candidate directly ("who are your users?") or (b) silently discount the claim. Either outcome is worse than not leading with it. HIGH confidence.

---

## What would move the verdict to (a) or (b)

If any of the following surfaced in the next 60 days, the verdict would shift:

- **(→ b) live with unknown traction:** self-serve signup at `/signup` or `app.elyt-ai.com`, a visible pricing page, or a single named paying customer case study. This removes the "demo piece" framing and makes the product commercially real even absent numbers.
- **(→ a) live with traction:** any of — ≥50 named users, MRR disclosed, ≥100 GitHub stars on an OSS component (eval harness, browser-action DSL, trace format), a posted HN / PH launch with ≥50 upvotes, a case study on an anti-detect-browser partner's site, a published user testimonial.

The candidate can produce any of these in 2–4 weeks. The cheapest route to **(b)** is to open-source one reusable piece (the workflow engine, the LLM-provider abstraction, or the TS↔Python type-gen). This moves Elyt from "demo" to "public infra + demo" without requiring commercial traction.

---

## Contradictions with prior research rounds

- **Round 04 and Round 05** treated Elyt as "production with commercial traction unverified." This audit upgrades the "unverified" language to **"no publicly verifiable traction signals exist."** The distinction matters: "unverified" implies existence that we haven't checked; "no public signal" is a direct finding.
- **Round 05's Option M rating of 8.1** implicitly assumed Elyt could serve as a credible "production agent platform" exhibit in interviews at Browserbase/Skyvern/Langfuse tier. This audit says: at that tier, it reads as a portfolio piece, not peer infrastructure. Option M's Elyt-leverage premium shrinks.
- **[final.md](../final.md#d--applied-ai--agent-engineer)** says: "Without public proof, it's a €79K AT play. With proof, it's a €100–140K remote-EU play." This audit confirms we are in the "no public proof" state. Default Option D expected comp should drop toward AT P50 €79K (per [SalaryExpert](https://www.salaryexpert.com/salary/job/ai-engineer/austria/vienna)) until proof is shipped.

---

## Impact on ranking

With the traction claim demoted to "unproven portfolio piece":

- **Option D (Applied AI) score:** prior 7.4 → **6.8–7.0.** The Elyt ceiling case is gone until proof ships. Floor-case (€79K AT at applied-AI roles filtered on skills, not founder-narrative) remains.
- **Option M (Platform + Agent/AI stacked) score:** prior 8.1 → **7.6–7.8.** M's Elyt-leverage premium was the differentiator over E at 8.0. Without the premium, M and E collapse to approximately equal scoring, with E (pure platform) having the slight edge on simpler ramp and cleaner narrative.
- **Option K (Founding Engineer) score:** unchanged. Founding-eng JDs read portfolios more generously and value "built a polished landing page + real codebase" even without traction.

The **main-agent decision triggers in [final.md](../final.md#decision-triggers)** already anticipate this: "Elyt can't show measurable traction or OSS signal by Month 2 → Demote Elyt in CV to one bullet; don't lead with it; M score downgrades to 7.5 but still #1." This audit provides the Month-0 data needed to either treat Month-2 as already triggered (act now) or give the candidate 60 days to produce proof.

---

## Recommended actions for the main agent to consider

1. **Do not lead CV or cover letters with "founder of Elyt — commercial agentic browser automation platform"** until at least one proof item from the "→ (b)" list above exists. Lead with Axess re-architecture + POS + SSO (real production, real users, verifiable scope) and mention Elyt as "solo-built agentic browser automation platform — [OSS component X on GitHub] + [case study / demo video]."
2. **Cheapest upgrade path: open-source one component.** TS↔Python type-gen tooling and LLM-provider abstraction layer are both plausibly stand-alone tools that would get stars from the agent / browser-automation community. Estimated effort: 2–3 weekends.
3. **Reposition landing page away from anti-detect / growth-hacker framing** if the candidate wants the page to work as a hiring portfolio for Browserbase/Skyvern tier. Current framing directly conflicts with those employers' brand positioning.
4. **Update [candidate.md](../candidate.md) Elyt section** to note that the "in production" claim is not publicly verifiable and that for scoring purposes we should treat it as portfolio-tier until proof ships.
