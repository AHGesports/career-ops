# Round 10 — AI replacement deep dive (task-by-task, role-by-role, Q1 2026 data)

**Date:** 2026-04-21
**Goal.** Verify, refine, or overturn the prior rounds' AI-replacement scoring. Focus sources: arXiv CS.SE 2024–2026, Stanford Digital Economy, Anthropic Economic Index, METR, ILO, OECD, WEF, Pragmatic Engineer / Addy Osmani / Simon Willison Q1–Q2 2026.
**Why now.** Round 05 assigned Platform/SRE (E) an AI-resistance score of 5/5 and round 09 gave D-Microsoft 3/5. Round 10 retests both claims against the most recent empirical evidence and checks whether any role category needs to be added, renamed, or flagged as a "do-not-enter."

See also: [../data/ai-replacement.md](../data/ai-replacement.md) · [../final.md](../final.md) · [round-09-dotnet-ai.md](round-09-dotnet-ai.md)

---

## 1. Executive summary (5 bullets)

1. **Stanford Canaries paper, November 13, 2025 revision, now attributes the employment decline in AI-exposed occupations to 2024, not earlier** — the earlier "quiet erosion" framing that had been floating around since August 2025 is narrower than advertised. 22–25yo SWE employment is down ~20% in the US; 22–40yo and 30+ SWEs in the same firms are *flat or growing*. **The candidate (22, 4 YOE) is structurally in the growing cohort**, not the shrinking one. [HIGH] ([Stanford Nov 2025 PDF](https://digitaleconomy.stanford.edu/wp-content/uploads/2025/11/CanariesintheCoalMine_Nov25.pdf), [Bharat Chandar primer](https://bharatchandar.substack.com/p/a-primer-on-canaries-in-the-coal))
2. **Frontend engineer postings dropped ~10% YoY through mid-2025, the single largest decline among software sub-roles** — driven by v0, Lovable, Bolt, Claude Artifacts. Backend, infra, platform, AI/LLM, and data engineering all grew. This is the first quantitative confirmation of the Anthropic Economic Index "UI/JS tasks most automated" finding at the labor-market level. [HIGH] ([Stack Overflow blog](https://stackoverflow.blog/2025/12/26/ai-vs-gen-z/), [CodeSculptorX Medium](https://medium.com/@codesculpturersh/frontend-software-engineers-were-the-biggest-declining-software-job-in-2025-cc2fc4ecb6e9))
3. **SRE / Platform / Cloud-Infra roles are the single fastest-growing SWE category in 2026**, driven by AI workload operations (NVIDIA SRE compensation median ~$350K, IC4 ~$331K; FinOps-literate platform engineers close offers fastest). Prior round-05 claim "Platform/SRE is AI-resistant 5/5" **is validated and arguably understated** — the demand signal is stronger than reported. [HIGH] ([Metaintro](https://www.metaintro.com/blog/software-engineer-job-listings-spike-2026-ai-demand), [KORE1](https://www.kore1.com/tech-layoffs-2026/))
4. **AI Engineer was the #1 fastest-growing US role on LinkedIn 2026 (+143% YoY postings, +1000% for "agentic AI")** — but the *generic* AI engineer title is commoditizing fast. LLM specialist (fine-tuning, evals, agent observability) still commands $220–280K. Candidates riding the generic AI wave will get squeezed 2028+; the specialization matters. [HIGH] ([Second Talent](https://www.secondtalent.com/resources/most-in-demand-ai-engineering-skills-and-salary-ranges/), [herohunt.ai](https://www.herohunt.ai/blog/fastest-growing-ai-roles-in-2026-data-and-rankings/))
5. **METR RCT (July 2025, reaffirmed Feb 2026): AI coding tools slow *experienced* OSS developers by ~19% on mature codebases they already know**, even though developers perceive a 20% speedup. This is the most important recent academic result — it says the productivity narrative is softer than marketing claims, especially for the senior IC cohort. Enterprise studies (GitHub × Accenture) show PR-volume gains that may partly reflect smaller, noisier PRs rather than real throughput. [HIGH] ([METR July 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), [arXiv 2507.09089](https://arxiv.org/abs/2507.09089), [METR Feb 2026 update](https://metr.org/blog/2026-02-24-uplift-update/))

**One-line verdict.** Prior ranking holds. E (Platform/SRE) should arguably rank higher on AI-resistance; D-Microsoft durability is correctly rated at 3–4/5; C (Pivot React) is correctly rated the lowest and the case against it got stronger this round.

---

## 2. New primary sources located in this round

| # | Source | Type | Relevance | URL |
|---|---|---|---|---|
| S1 | Stanford "Canaries" v3 (Nov 13, 2025) | Academic, tier 1 | Refined cohort analysis; 2024-only effect | [digitaleconomy.stanford.edu PDF](https://digitaleconomy.stanford.edu/wp-content/uploads/2025/11/CanariesintheCoalMine_Nov25.pdf) |
| S2 | Anthropic Economic Index — March 2026 "Learning Curves" | Vendor research, tier 2 | API-traffic automation vs Claude.ai augmentation split; tenure effect on successful delegation | [anthropic.com](https://www.anthropic.com/research/economic-index-march-2026-report) |
| S3 | METR — *Measuring the Impact of Early-2025 AI on Experienced OSS Dev Productivity* | RCT, tier 1 | **–19% completion time** with AI on mature codebases, despite +20% self-reported speedup | [arXiv 2507.09089](https://arxiv.org/abs/2507.09089) |
| S4 | METR — "We are changing our developer productivity experiment design" (Feb 24, 2026) | Methodology note | Self-selection bias caveat on 2025 follow-up | [metr.org](https://metr.org/blog/2026-02-24-uplift-update/) |
| S5 | ILO — *Generative AI and Jobs: A 2025 Update* (WP140) | IO / tier 1 | Refined occupational exposure at 6-digit level, ~30,000 tasks; 3.3% of global employment in highest-exposure bucket | [ilo.org PDF](https://www.ilo.org/sites/default/files/2025-05/WP140_web.pdf) |
| S6 | OECD GPAI — *Generative AI and the future of work: global dialogue* (Jan 2025) | IO / tier 1 | Firms' AI adoption still low but accelerating; transformation > elimination | [oecd.ai PDF](https://wp.oecd.ai/app/uploads/2025/01/20250128_GPAI_GenAI_FoW_report_final_VOECD.pdf) |
| S7 | WEF *Future of Jobs Report 2025* | Tier 1 | Software and data roles projected net-positive 2025–2030 | [reports.weforum.org PDF](https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf) |
| S8 | arXiv 2502.20429 — *Impact of AI on Software Engineering Jobs* | Academic, tier 2 | Junior training at risk; boilerplate tasks monopolized by AI; augmentation at senior level | [arxiv.org](https://arxiv.org/html/2502.20429) |
| S9 | arXiv 2506.06576 — *Future of Work with AI Agents* | Academic, tier 2 | Amplified vs Substituted role categories; SWE classified Amplified | [arxiv.org](https://arxiv.org/html/2506.06576v3) |
| S10 | arXiv 2509.15265 — *AI and jobs: theory, estimates, evidence* | Academic survey, tier 2 | Meta-review of AI labor estimates | [arxiv.org](https://arxiv.org/html/2509.15265v1) |
| S11 | arXiv 2601.20245 — *How AI Impacts Skill Formation* | Academic, tier 2 | AI use impairs conceptual understanding / debugging in novices; confirms InfoQ "17% skill mastery reduction" | [arxiv.org](https://arxiv.org/html/2601.20245v2) |
| S12 | Stack Overflow blog — *AI vs Gen Z: How AI has changed the career pathway for junior developers* (Dec 26, 2025) | Industry, tier 2 | Frontend postings −10% YoY (biggest declining sub-role) | [stackoverflow.blog](https://stackoverflow.blog/2025/12/26/ai-vs-gen-z/) |
| S13 | Pragmatic Engineer — *The impact of AI on software engineers in 2026* | Industry, tier 2 | Team consolidation (5 roles → 2–3 full-stacks); boring-stack preference | [pragmaticengineer.com](https://newsletter.pragmaticengineer.com/p/the-impact-of-ai-on-software-engineers-2026) |
| S14 | Pragmatic Engineer — *When AI writes almost all code, what happens to software engineering?* | Industry, tier 2 | Follow-up to Willison; senior-IC orchestrator role | [pragmaticengineer.com](https://newsletter.pragmaticengineer.com/p/when-ai-writes-almost-all-code-what) |
| S15 | Simon Willison — *AI state of the union* (Lenny, Mar–Apr 2026) | Industry, tier 2 | Nov 2025 "inflection point"; software factory paradigm; prototyping + stack-specialism devalue, tech-lead + product-minded traits rise | [lennysnewsletter.com](https://www.lennysnewsletter.com/p/an-ai-state-of-the-union) |
| S16 | Addy Osmani — *My LLM coding workflow going into 2026* + *agent-skills* | Industry, tier 2 | Orchestrator role; senior-engineer discipline encoded into agent skills; "spec-driven" saves six figures vs "vibe coding" costs six figures | [addyosmani.com](https://addyosmani.com/blog/ai-coding-workflow/), [github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) |
| S17 | Surfing Complexity — *Lots of AI SRE, no AI incident management* (Feb 14, 2026) | Practitioner, tier 2 | AI SRE tools augment but don't replace coordination-under-uncertainty work | [surfingcomplexity.blog](https://surfingcomplexity.blog/2026/02/14/lots-of-ai-sre-no-ai-incident-management/) |
| S18 | Tom's Hardware / Vucense — Q1 2026 tech layoffs data | Trade press, tier 3 | ~80K tech cuts Q1 2026; ~48% AI-attributed; Oracle 30K, Amazon 16K; mostly SaaS ops, customer success, mid-level SWE generalists | [tomshardware.com](https://www.tomshardware.com/tech-industry/tech-industry-lays-off-nearly-80-000-employees-in-the-first-quarter-of-2026-almost-50-percent-of-affected-positions-cut-due-to-ai), [vucense.com](https://vucense.com/ai-intelligence/industry-business/tech-layoffs-q1-2026-ai-displacement-80000/) |
| S19 | CNN Business — *The demise of SWE jobs has been greatly exaggerated* (Apr 8, 2026) | Mainstream, tier 3 | SWE job listings +30% YoY 2026; overall demand rising despite individual company cuts | [cnn.com](https://www.cnn.com/2026/04/08/tech/ai-software-developer-jobs) |

**What's NEW vs the prior `data/ai-replacement.md`:** S1 (Canaries v3 — tighter attribution), S3–S4 (METR experienced-dev RCT — the most important counter-narrative to vendor productivity claims), S5 (ILO 6-digit exposure), S12 (frontend −10% YoY — first labor-market confirmation), S15 (Willison November 2025 inflection), S17 (SRE-specific practitioner data).

---

## 3. Task-by-task automation map (revised)

The prior table in `data/ai-replacement.md` is broadly correct. Two refinements:

| Task class | 2026 status | 2028 projection | 2031 projection | Source |
|---|---|---|---|---|
| CRUD endpoints, forms, simple UI | **Fully automated, labor effect visible** (frontend −10% YoY in 2025) | Agent-owned | Commodity; humans only review | S12, S15, Anthropic |
| Basic refactors, test scaffolding, docs | Automated | Fully automated | Agent-owned | Anthropic, Copilot studies |
| Framework migration, language translation | Mostly automated (multi-file agentic) | Fully automated | Agent-owned | Anthropic, S15 |
| **Prototyping / greenfield app scaffolds** | **NEW: devalued by Willison** — v0 + Lovable + Claude Artifacts produce shippable artifacts | Fully automated | Commodity | S15 |
| Debugging weird production bugs in legacy | Augmented (METR: +19% time with AI here) | Augmented | Still human-led | S3 (METR) |
| Ambiguous product-to-architecture translation | Augmented | Augmented | Still human-led | S15, S16 |
| Distributed systems design, data-intensive design | Augmented | Augmented | Still human-led | S14 |
| Agent design, tool design, eval design | Human-dominant | Still scarce | Frontier | S16 |
| Security architecture, compliance-gated | Augmented | Augmented | Still human-led (liability) | round-05 |
| Physical-world / embedded / hard-realtime | Barely touched | Slightly augmented | Still human-led | round-05 |
| **On-call, incident coordination, mutation authority** | **Augmented, NOT replaced** (Surfing Complexity, 2026) | Augmented | Still human-led | S17 |
| **Infra cost/FinOps optimization** | **NEW: fastest-hiring platform-eng sub-niche** | Growing | Growing | S18 (KORE1) |
| **AI platform / GPU cluster ops** | **NEW: NVIDIA, Modal, Together.ai, Baseten hiring aggressively** | Growing | Growing | KORE1, NVIDIA SRE listings |

Three new rows (bolded) that weren't explicit in the prior file:

1. **Prototyping** is now explicitly a *devalued* task — Willison (S15) argues that prototyping + stack specialism are the two things that lose the most value first. Translate to candidate: "I can build an MVP fast" is no longer a resume claim worth leading with.
2. **Incident coordination** — Surfing Complexity (S17) makes the cleanest argument yet that AI SRE = observability + triage assist, *not* the human coordination under uncertainty, mutation-authority, or institutional-memory work. This is the sharpest single source the durability claim for E has ever had.
3. **AI platform / GPU cluster ops** — NVIDIA, Modal, Baseten, Together.ai, CoreWeave are the new $300K+ employer tier. Prior `options/M-*.md` listed these informally; they deserve to be first-class targets.

---

## 4. Role-by-role employment data, 2024 → 2026

| Role category | Hiring delta 2024→2026 | AI-attributed layoff share | Source confidence |
|---|---|---|---|
| Frontend dev (pure React/Next.js) | **–10% YoY through mid-2025** (biggest decliner); continued soft in 2026 | Highest exposure per ILO + Anthropic | HIGH (S12) |
| Backend generalist (Node/Java/.NET CRUD) | Flat to –5%; Oracle Java org cuts concentrated here | Medium — included in the 48% Q1 2026 AI-attributed cuts | MEDIUM (S18) |
| Full-stack generalist | Flat; consolidation (S13: "5 roles → 2–3 full-stacks") | Neutral | MEDIUM (S13) |
| Platform / SRE / DevOps / Cloud Infra | **+20–30% YoY** (Metaintro + KORE1 observation of fastest-filling roles) | Very low | HIGH (S18 KORE1) |
| AI/ML engineer, LLM specialist | **+143% YoY** (LinkedIn) for AI engineer title; +1000% for "agentic AI" 2023→2024 | Near zero | HIGH (herohunt.ai, Second Talent) |
| Data engineering | Flat to +5% | Low | MEDIUM |
| Security / DevSecOps | +10–15% (NIS2/DORA/EU AI Act forcing function) | Near zero | MEDIUM–HIGH |
| QA / manual testing | Flat, but BofA $6M incident shows replacement attempts failing | Medium exposure, low *successful* replacement | MEDIUM (S-QA Financial) |
| Embedded | Flat; shortage in DACH industrial | Very low | MEDIUM |
| Junior 0–2 YOE SWE (US) | **–20%** (Stanford, for 22–25yo) | — structural | HIGH (S1) |
| Mid/senior 4+ YOE SWE (US) | **Flat to +** | — | HIGH (S1) |
| Mid/senior SWE (DACH) | Shortage occupation on 2026 Mangelberufe list; raise freeze but not layoff | — | HIGH (AMS/WIFI) |

**Key single number.** Frontend −10% YoY is the first published labor-market number that confirms the Anthropic Economic Index task-automation signal materializing as real employment change. Every other signal (Stanford, Challenger Gray, ILO) is about *junior* or *generic* exposure. Frontend is the first role-category-level confirmation.

---

## 5. Durable sub-niches identified or refined this round

| Sub-niche | Why durable | Premium | Durability to | Evidence |
|---|---|---|---|---|
| **AI platform / GPU cluster operator** (NVIDIA, Modal, CoreWeave, Baseten) | Physical GPU ops, capacity planning, latency SLOs for inference — needs human-in-loop | ~30–60% over senior SWE | 2031+ | KORE1, NVIDIA SRE ($350K median) |
| **Agent eval / observability eng** (Langfuse, Braintrust, Arize, Helicone) | Agents can't grade themselves at production thresholds; deep-domain knowledge required | 25–50% | 3–5yr (volatile) | S16, anthropic research |
| **FinOps + Platform Engineer** | $X reduced by AI inference cost is the new 2026 currency; hiring managers explicitly ask | 20–40% | 2028+ | KORE1 (S18) |
| **Incident commander / on-call platform lead** | Coordination under uncertainty, mutation authority, auditor-facing judgment | 20–35% | 2031+ | Surfing Complexity (S17) |
| **Compliance-gated security eng** (NIS2/DORA/EU AI Act) | Liability work; attestation must be signed by named human | 25–40% | 2031+ | round-05, already covered |
| **Distributed-systems IC at scale** | Out-of-training-distribution bugs; years of on-call scar tissue | 30–50% | 5yr+ | round-05, already covered |

**New vs prior rounds:** AI platform / GPU ops, FinOps platform-eng, and incident-commander are **more specific variants** of Option E (Platform/SRE) and Option M (Platform + Agent). They do NOT require a new top-level option — they are *targeting variants* inside E and M.

---

## 6. Claims to propagate back to `data/ai-replacement.md`

**Add (verified new):**

- **Frontend SWE postings −10% YoY through mid-2025** — the first labor-market number confirming the UI/JS automation thesis. Source: Stack Overflow blog Dec 2025 (S12). [HIGH]
- **METR RCT: AI slows experienced OSS devs by 19%** on mature codebases despite +20% perceived speedup. Methodological caveat: self-selection bias in 2025 follow-up. Source: METR + arXiv 2507.09089 (S3, S4). [HIGH]
- **AI Engineer +143% YoY postings**; agentic AI +1000% over 2 years; LLM specialist comp $220–280K. Source: LinkedIn Jobs on the Rise / Second Talent. [HIGH]
- **Stanford Canaries v3 (Nov 13, 2025)** — effect statistically attributable only from 2024, not earlier. Narrows but does not invalidate the –20% junior figure. Source: S1. [HIGH]
- **Q1 2026 tech layoffs ~80K, ~48% AI-attributed** (jumped from 5–13% in 2025). Oracle 30K, Amazon 16K. Mostly generalist SWE + customer-ops, NOT platform/SRE/security/distributed. Source: Tom's Hardware / Vucense (S18). [MEDIUM — tier 3 sources]
- **Willison November 2025 inflection point**: Opus 4.5 + GPT-5.2 crossed a capability line that makes multi-file agentic changes workable. Prototyping and stack-specialism devalued; tech-lead + product-minded traits gain. [MEDIUM — opinion but influential]
- **Osmani 2026 thesis**: engineer = orchestrator; spec-driven saves six figures vs vibe-coding costs six figures. Reinforces "senior + AI-fluent + discipline" as the durable bucket. [MEDIUM]
- **WEF Future of Jobs 2025**: software + data roles net-positive 2025–2030. Structurally the largest-numbers counter to the "SWE is cooked" doomer framing. [HIGH]
- **ILO WP140 (May 2025)**: 3.3% of global employment in the highest GenAI-exposure bucket; clerical highest, SWE mid-range, not the top exposure category globally. [HIGH]

**Retain (still valid):**

- All prior Stanford / Anthropic / Challenger Gray claims in the existing file, with the refinement that Canaries v3 now attributes the effect from 2024 (not 2022 as originally read).

**Invalidate / refine:**

- "Challenger 2026 YTD ~13% AI-attributed" → **UPDATE** with Q1 2026 Tom's Hardware figure of ~48% when narrowly scoped to tech-sector cuts (the two numbers measure different denominators — Challenger is cross-sector; Tom's Hardware is tech-sector-only). Both are true; file should clarify the denominator. [MEDIUM]
- "79% Claude Code = full automation" → **REINFORCE the prior correction**: Anthropic March 2026 "Learning Curves" report clarifies that API-side traffic is directive (higher automation share) vs Claude.ai-side that is augmentative. The 79% is specifically the first-party API Claude-Code usage pattern, not labor-market automation. [HIGH]

Updates applied to `data/ai-replacement.md` in the same commit as this round.

---

## 7. Claims to propagate to per-option files (score adjustments)

| Option | Prior AI-resistance score | Proposed score | Rationale | New sources |
|---|---|---|---|---|
| **A — Stay .NET** | 2/5 | **Keep 2/5** (no change) | CRUD is firmly in the automated bucket; Oracle Java-org cuts S18 generalize. | S18, S12 (peripheral) |
| **B — Pivot Java** | 1/5 | **Keep 1/5** | Oracle March 2026 30K cuts hit Java-IC work disproportionately. Evidence strengthens rather than weakens. | S18 |
| **C — Pivot React** | 1/5 | **Keep 1/5 — strong confirmation** | S12 quantifies the decline for the first time at role-category level. Most-confirmed bearish call. | **S12, S15** |
| **D — Applied AI / Agent Eng (generic)** | 3/5 | **Keep 3/5, but flag commoditization risk** | +143% YoY demand but title commoditizing. Specialization (eval/observability) stays 4/5, generic 3/5. | LinkedIn, S16 |
| **D-Microsoft** | 3/5 (round 09) | **Keep 3/5** | No new evidence specifically on Azure-AI. Durability bounded by Microsoft's own customer velocity. | — |
| **D4-Python** | 3/5 | **Keep 3/5** | Same as D generic. | — |
| **E — Platform / SRE / DevOps** | 5/5 | **Keep 5/5 — most-reinforced claim** | S17 + KORE1 + Metaintro + NVIDIA SRE comp + FinOps as the fastest-closing signal. If anything understated. | **S17, S18, KORE1** |
| **F — Security / DevSecOps** | 5/5 | **Keep 5/5** | Regulatory forcing functions continue; no contrary evidence. | — |
| **G — Data Engineering** | 4/5 | **Keep 4/5** | Mixed: dbt/SQL scaffolding automated, operational surface still human. Flat hiring. | ILO |
| **H — Distributed Systems IC** | 4/5 | **Keep 4/5** | Out-of-training-distribution bugs; METR (S3) reinforces AI-struggles-in-complex-mature-codebase finding. | **S3** |
| **I — Embedded** | 5/5 | **Keep 5/5** | — | — |
| **J — Fintech Backend** | 4/5 | **Keep 4/5** | DORA tailwind continues. | — |
| **K — Founding Engineer** | 4/5 | **Keep 4/5** | Ambiguous greenfield work less exposed. Risk = company mortality, not AI. | — |
| **L — Remote-US contractor** | depends-on-work | depends-on-work | — | — |
| **M — Platform + Agent/AI stacked** | 5/5 | **Keep 5/5 — most-reinforced intersection** | All signals from both sides converge; NVIDIA/Modal/Baseten tier proves the intersection exists and pays. | **S17, S18, KORE1** |
| **N — Go/Rust** | (niche choice) | (niche choice) | — | — |

**Net effect on ranking:** zero changes to the integer AI-resistance scores. Qualitatively, E and M deserve an asterisk as "highest-confidence durable calls of the 14 options." C is the highest-confidence bearish call.

---

## 8. New options to add?

**No.** The candidates considered and rejected:

- **"AI GPU-Infra / CoreWeave-tier platform engineer"** → not a new option, this is Option E targeted at NVIDIA/Modal/CoreWeave/Baseten. Fold into E and M.
- **"Agent eval engineer"** → not a new option, this is the durable sub-niche of Option D already identified in round 05.
- **"FinOps Platform Engineer"** → not a new option, this is a targeting variant inside E.
- **"AI-Safety / alignment engineer"** → academic labor market; US-residency-gated for the most part (Anthropic/OpenAI/DeepMind); below the bar for the candidate's 12-month timeline.
- **"Technical Program Manager / AI Delivery Lead"** → off-profile for a 22yo IC; revisit at 28+.

**Verdict: 14 options remains the correct option set.** No addition, no removal.

---

## 9. Final verdict — does the primary recommendation (E + D-Microsoft) hold?

**Yes. Confidence: HIGH.**

The three-track recommendation from rounds 05/07/08/09 — **E primary, D-Microsoft parallel, D4-Python contingent on Elyt-OSS** — survives round 10 unchanged. Every new piece of evidence strengthens rather than weakens it:

- **E primary:** Surfing Complexity (S17) is the strongest single academic/practitioner case yet that the incident/coordination/mutation-authority work doesn't AI-automate. KORE1 (S18) confirms FinOps + K8s + Terraform is the specific skill stack closing offers fastest. NVIDIA SRE comp ($350K median) establishes the ceiling.
- **D-Microsoft parallel:** AI Engineer title is +143% YoY, demand is genuine. The Microsoft/.NET variant remains the highest-execution-probability path for this candidate specifically (70% already there, 4–6 week ramp) — round 09 reasoning is intact.
- **D4-Python contingent:** Elyt-OSS gate still justified; generic AI engineer title commoditizing fast (Willison S15, Osmani S16).

**What changed vs round 09?** Additional confidence on E's durability (from 5/5 confident to 5/5 with three independent 2026 sources backing it). Minor qualitative update: the sub-niche inside E worth targeting first is **FinOps-literate platform eng** (fastest-closing in 2026 data), not generic "senior platform engineer." Porsche Informatik, Dynatrace, A1 Digital, Raiffeisen Informatik all hire this — the Salzburg + Vienna target list in [`../options/E-platform-sre.md`](../options/E-platform-sre.md) doesn't change, only the CV framing changes to lead with cost optimization.

**Role categories to DEFINITELY avoid (no change from prior rounds, but reinforced):**

1. **Pure frontend (Option C as identity)** — single strongest bearish signal in this round. S12's −10% YoY is the labor-market confirmation the Anthropic Economic Index had been predicting. Only keep React on the CV as checkbox; never as identity.
2. **Pure Java IC generalist (Option B as identity)** — Oracle March 2026 cuts hit exactly this profile. Same bearish logic as .NET CRUD but with worse offshore wage pressure.
3. **Generalist full-stack CRUD in a bootcamp-supplied market** — Pragmatic Engineer's "5 roles → 2–3 full-stacks" consolidation means the remaining full-stack roles go to stronger candidates; mid-tier full-stacks get squeezed. The candidate's protection here is the Mangelberufe list + German language + Austrian labor market, not the role itself.

**Role categories the candidate SHOULD double down on (confirmation):**

1. **Platform/SRE with FinOps + AI-workload angle** (E targeted at NVIDIA/Modal/Baseten-tier for US-contractor, Porsche Informatik/Dynatrace for AT-local).
2. **AI eval / observability / agent platform engineering** (M intersection — the prior round 05 bet stands stronger).
3. **Senior + AI-fluent + discipline** (Osmani spec-driven framing) — this is a CV positioning choice, not a new option.

---

## Appendix — Confidence summary

| Claim | Confidence | Evidence strength |
|---|---|---|
| Platform/SRE is AI-resistant to 2031 | HIGH | 3 independent 2026 sources (S17 + KORE1 + NVIDIA SRE comp data) |
| Frontend IC declining at labor-market level | HIGH | S12 quantified for first time |
| AI engineer title commoditizing by 2028 | MEDIUM | S15 + S16 qualitative; demand data confirms peak |
| Junior 0–2 YOE US SWE cohort down ~20% | HIGH | S1 Stanford v3 refined |
| 4+ YOE mid-senior cohort flat to + | HIGH | S1 Stanford v3 |
| METR experienced-dev slowdown generalizes | MEDIUM | S3 RCT is small N=16, OSS-specific; S4 flags self-selection |
| D-Microsoft 3/5 durability | MEDIUM–HIGH | round 09 logic + no contrary 2026 data |
| E should arguably rank higher on AI-resistance | MEDIUM | Qualitative signal that prior 5/5 may understate; no need to re-score integer |
| Three-track primary recommendation holds | HIGH | Every round 10 source points the same direction |

---

## New TODO items surfaced

- P10.1 — Quantify AT/DE platform-eng hiring delta 2024→2026 from karriere.at + stepstone.de historical data (currently we only have US-centric delta data).
- P10.2 — Monitor METR 2025–2026 larger-N follow-up for resolution of self-selection bias; if replicated, the productivity narrative for AI tools weakens further and the "senior judgment" premium rises.
- P10.3 — Track whether "AI Engineer" title in DACH market consolidates into LLM-eval / agent-platform / MLOps specializations by late 2026. If yes, round 09's D-Microsoft vs D4-Python split becomes less important than picking the right *specialization*.
- P10.4 — Watch for NIS2 Q4 2026 compliance deadline effect on DACH security-eng hiring; may re-rank Option F above Option A if hiring wave materializes.
