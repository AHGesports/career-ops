# Research methodology

See: [README.md](README.md) · [goal.md](goal.md) · [TODO.md](TODO.md)

---

## Source hierarchy (trust order, most → least)

### Tier 1 — Authoritative primary sources
- **Government statistics:** Statistik Austria, AMS, Eurostat, US BLS
- **Collective agreements:** WKO KV-IT (Kollektivvertrag Informationstechnologie)
- **Industry surveys:** Stack Overflow Developer Survey (annual), JetBrains State of Developer Ecosystem (annual), GitHub Octoverse (annual)
- **Major vendor research:** Anthropic Economic Index, GitHub Copilot impact studies
- **Academic:** Stanford Digital Economy Lab, Brookings, MIT Sloan
- **Regulatory:** EU NIS2 directive text, DORA regulation text, EU AI Act text

### Tier 2 — Market-data aggregators
- Levels.fyi (verified TC submissions, US-heavy but growing EU)
- Glassdoor, kununu, Payscale, SalaryExpert (self-report, bias-adjusted)
- RemoteOK, arbeitnow, WeWorkRemotely (live job volumes)
- karriere.at, stepstone.at, stepstone.de (AT/DE job volumes)

### Tier 3 — Analyst reports and industry blogs
- Pragmatic Engineer (Gergely Orosz)
- Addy Osmani blog
- Simon Willison
- LinkedIn Jobs on the Rise / Emerging Jobs (directional but noisy)
- Challenger Gray layoff reports
- Specialist blogs (Signify Technology, Kube.careers, Second Talent)

### Tier 4 — Narrative sources (cite with skepticism)
- Hacker News threads
- Reddit r/cscareerquestions
- Company-sponsored marketing research (Second Talent, CertPayback, etc.)
- LinkedIn Pulse posts (verify authorship and incentives)

**Rule:** Any claim moving the ranking must cite Tier 1 or Tier 2. Tier 3 is directional. Tier 4 is color, not evidence.

## What to verify before propagating a claim

When a prior round states "X % of devs doing Y" or "$Z median for role W":

1. **Find the original source.** Is it a study, a survey, a vendor blog repeating a survey, or a LinkedIn post repeating a vendor blog?
2. **Check the sample.** US-only ≠ DACH. 50 respondents ≠ 5000. Self-report ≠ verified comp.
3. **Check the year.** "2024 data" quoted in 2026 may be obsolete for fast-moving markets.
4. **Check the framing.** "79% of Claude Code conversations are automation" is not "79% of dev work is automatable" — a round-3 finding that round-2 had misread.
5. **Tag confidence:** HIGH (Tier 1/2, recent, specific), MEDIUM (Tier 3, or Tier 1/2 but aging), LOW (Tier 4 or unverifiable).

## Scoring rubric (for options evaluation)

Each option in [options/](options/) is scored 1–5 on **7 dimensions**:

| Dimension | 1 (worst) | 5 (best) |
|---|---|---|
| **AI-resistance** | Almost entirely automatable by 2028 | Structurally AI-resistant through 2031+ |
| **Long-term (2026–2031)** | Shrinking structurally | Growing structurally, durable moat |
| **AT market** | <30 roles, Salzburg void | 150+ roles, Salzburg-accessible employers |
| **EU market** | Thin outside DACH | Deep DACH + remote-EU options |
| **US market** | US-residency gated | Remote-EU-friendly at premium comp |
| **Ease for candidate** | 24+ months ramp, pay dip | Zero ramp, existing skill match |
| **Knowledge transfer** (added round 07) | New discipline; general SWE principles apply < 40% of daily work | General SWE principles apply ≥ 90% of daily work |
| **No-degree accessibility** (added round 08) | Formal university degree frequently required (>50% of JDs) | Degree rarely / never required; experience + portfolio substitute |

**CRITICAL — what "knowledge transfer" means and does NOT mean:**

Counts (these ARE general SWE principles):
- System design, architecture judgment
- Debugging, root-cause analysis
- Testing discipline (unit / integration / E2E, TDD)
- API design (REST, GraphQL, gRPC, contract-first)
- Database thinking (relational modeling, indexes, queries, migrations)
- Concurrency, async patterns
- Refactoring, code review, SOLID, design patterns
- Git workflows, CI/CD fundamentals
- Scalability and reliability thinking
- Security fundamentals (authn/authz, input handling)

Does NOT count (these are specific-tech or business-domain carryover, NOT general SWE):
- "I know .NET → I should go to .NET" — specific tech stack
- "I know ticketing / POS / venues → I should go to ticketing" — business domain
- "I know Oracle → I should use Oracle" — specific technology

**Why the distinction matters.** The candidate explicitly wants his *programming and software-development knowledge* to transfer, not his C#/Angular/Oracle stack identity or his Axess ticketing-industry knowledge. A role that demands Spring Boot instead of ASP.NET Core still gives 100% SWE-principle transfer (backend is backend; the candidate uses the same mental models on day 1). A role that demands pager-carrying incident-response 3 days per week gives ~60% SWE-principle transfer (debugging applies, but "respond to alert" is not a programming act).

**Knowledge-transfer distinguished from ease:** Ease measures time-to-credible (ramp length, pay dip). Transfer measures how much of the candidate's general SWE knowledge maps to day-to-day output in the new role. A role can be fast to ramp but new-discipline-heavy (low transfer) OR slow to ramp but SWE-heavy (high transfer). They are not the same thing.

**"Ease of getting a job" — where it lives in the rubric.** Three dimensions together capture hiring-pipeline ease:
1. **Market dimensions** (AT / EU / US) — is there demand at all?
2. **Ease for candidate** — can current CV pass the first technical filter? (zero ramp = filter passes; 24+ month ramp = filter fails)
3. **No-degree accessibility** — are you formally filtered out by a degree requirement before anyone reads the CV?

Not a separate dimension because the composite already captures it; explicitly documented so the next agent doesn't try to add a fourth redundant dimension.

Weighted totals (round 08 revision): AI-resistance ×2, Long-term ×2, AT ×1, EU ×1.5, US ×1, Ease ×1.5, Knowledge transfer ×2, **No-degree accessibility ×1**.
Max weighted = 12 × 5 = 60; normalize to /10 by multiplying by 10/60 ≈ 0.167.

**Austrian context for degree dimension:** AT/DE JDs frequently list "abgeschlossenes Studium (TU/FH) oder HTL-Matura oder vergleichbare Berufserfahrung" — meaning HTL technical high school or equivalent experience substitutes for university. Candidate has no completed university degree but has 4 YOE + industry work. In DACH software eng generally, experience substitutes. The dimension separates roles where that substitution is accepted (score 4–5) from roles where formal degrees are filtered-on (score 1–3).

Prior-round scores (rounds 05–06) used the 6-dimension rubric. Round 07 reranking applies the 7-dimension rubric. Both are preserved for traceability; final.md shows current (round 07) ranking.

## Required fields for every option file

Every `options/X-*.md` file must contain:

1. One-paragraph description
2. Pros (bullets, cite evidence)
3. Cons (bullets, cite evidence)
4. AT market (volume, comp P25/P50/P75, named employers)
5. EU market (same)
6. US market (same, with remote-accessibility and AT-tax-adjusted net comp)
7. Long-term outlook 2026–2031 with reasoning
8. AI-replacement risk 1–5 with reasoning
9. Ease for this candidate 1–5 with reasoning
10. Scoring table
11. Verdict
12. Cited sources (URLs inline)

## How to run a research round

1. Pick open item from [TODO.md](TODO.md).
2. List the specific sub-questions.
3. Choose sources (Tier 1 first, then 2).
4. Do the research — prefer WebFetch to specific URLs over WebSearch where possible.
5. Write `rounds/round-NN-<slug>.md` with:
   - Date
   - Scope (which questions, which options)
   - Sources consulted (full URLs)
   - Findings (with confidence tags)
   - Claims validated from prior rounds
   - Claims invalidated from prior rounds
   - Open sub-questions surfaced
6. Propagate: update affected `options/`, `data/`, `final.md`, `TODO.md`.

## Research biases to actively counter

Prior rounds exhibited these failure modes. Watch for them:

- **Hype inflation.** "AI engineer is the hot path" without volume data.
- **Ceiling-not-distribution.** Reporting P90 / top-of-market as if typical.
- **Aggregating ill-defined buckets.** "AI engineer" contains ML research, data eng, prompt eng — disambiguate.
- **Survivor bias in anecdotes.** "Founder of Y-combinator agent startup earns $400K" is not a path; it's a tail.
- **Stats recency.** 2024 data is stale for AI-hiring markets.
- **Over-weighting US.** Candidate is AT resident; US numbers need tax-adjustment and remote-accessibility filter.
- **Language-lane reasoning.** Languages are fungible per [goal.md](goal.md); don't relapse.
- **Elyt as definitive.** Unknown traction. Do not treat as product unless data proves it.

## When to invalidate a prior round

A prior round's conclusion should be invalidated (not just refined) when:

- Its primary evidence is shown to be misread (e.g. round-3 invalidated round-2's "48% layoffs AI-attributed" number)
- Its framing assumption is rejected (e.g. round-4 invalidated "stay in your lane" by the fungibility premise)
- New authoritative data directly contradicts (with citation)

Invalidation is logged in the invalidating round's file + propagated to `final.md`. Original round is not deleted — it stays as history.
