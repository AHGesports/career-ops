# User Profile Context -- career-ops

<!-- ============================================================
     THIS FILE IS YOURS. It will NEVER be auto-updated.
     
     Customize everything here: your archetypes, narrative,
     proof points, negotiation scripts, location policy.
     
     The system reads _shared.md (updatable) first, then this
     file (your overrides). Your customizations always win.
     ============================================================ -->

## Your Target Roles

| Archetype | Thematic axes | What they buy |
|-----------|---------------|---------------|
| **Full-stack Engineer (.NET/Angular)** | C#, .NET 8, Angular, TypeScript, SQL, enterprise systems | Someone who delivers end-to-end features across backend and frontend in .NET/Angular stacks |
| **Full-stack Engineer (Node.js/Python)** | Express, FastAPI, TypeScript, Python, REST, GraphQL | Someone who builds modern JS/Python backends with frontend delivery |
| **Backend Engineer (.NET)** | ASP.NET Core, EF Core, Oracle/PostgreSQL, system design, SOLID | Someone who architects and ships scalable .NET backend services |
| **Backend Engineer (Node.js/Python)** | Express, FastAPI, Redis, BullMQ, API design, microservices | Someone who builds performant APIs and background processing pipelines |
| **AI / Automation Engineer** | LLM integration, browser automation, workflow orchestration, MCP | Someone who builds production AI agent systems and automation platforms |
| **Software Engineer (Enterprise / B2B)** | Multi-tenant, SSO/OAuth, RBAC, hardware integration, POS | Someone who delivers complex B2B systems with real-world integrations |

## Your Adaptive Framing

| If the role is... | Emphasize about you... | Proof point sources |
|-------------------|------------------------|---------------------|
| Full-stack (.NET/Angular) | Axess: 5 product lines, POS from scratch, re-architecture, Angular migration | cv.md (Axess section) |
| Full-stack (Node/Python) | Elyt: 3-tier platform, Express + FastAPI, workflow engine, cross-platform delivery | cv.md (Elyt section) |
| Backend (.NET) | Re-architecture to domain-separated services with TDD, SSO/OAuth across 2 product lines, 438-controller enterprise system | cv.md (Axess section) |
| Backend (Node/Python) | Elyt: Express orchestrator with 26 routes + 94 service modules, FastAPI execution engine, BullMQ job scheduling, Redis caching | cv.md (Elyt section) |
| AI / Automation | Elyt: provider-agnostic LLM layer (5 providers), MCP support, browser-use framework, workflow orchestration, Tauri desktop app | cv.md (Elyt section) |
| Enterprise / B2B | B2B POS: 20+ venue operators, 20K+ monthly txns. Real-time middleware sync for 10+ enterprise customers. SSO/OAuth standard for all onboardings | cv.md (Axess section) |
| Trade / Fintech | Atra: trade operations platform, 200+ daily cross-border txns, 8 markets, multi-currency invoicing, 15+ pricing feeds | cv.md (Atra section) |
| DevOps-adjacent | CI/CD in Azure DevOps, Docker, GitHub Actions, bi-weekly to 3+ releases/week, 4 environments, automated test gates | cv.md (Atra section) |

## Your Exit Narrative

Use the candidate's exit story from `config/profile.yml` to frame ALL content:
- **In PDF Summaries:** "Enterprise full-stack engineer who also built and shipped a commercial AI automation platform solo -- bridges deep .NET/enterprise expertise with modern AI/automation skills"
- **In STAR stories:** Reference specific Axess systems (without naming internal projects), Atra trade platform, and Elyt as proof points
- **In Draft Answers:** Lead with the dual strength: enterprise-grade backend + modern AI builder. Not just one or the other.

## Your Cross-cutting Advantage

Frame profile as **"Enterprise engineer who ships production AI systems solo"** -- rare combination of:
1. 4+ years at two internationally recognized companies (Axess AG, Atra Ltd) -- not hobby projects, real enterprise at scale
2. Deep architecture understanding -- re-architected a legacy monolith solo, built SSO/OAuth from scratch across product lines
3. Ships production-grade products alone -- Elyt is a full commercial platform, not a side project
4. True full-stack across multiple stacks (.NET + Angular + Node.js + Python + SQL) with end-to-end ownership

## Communication Style Rules

**CRITICAL -- follow these in all generated content (cover letters, form answers, LinkedIn messages, PDF summaries):**

1. **Be professional.** No hype, no overselling, no "passionate about" or "results-driven" filler.
2. **Do NOT use numbers/stats to impress.** Let the resume PDF carry the metrics. In cover letters, form answers, and outreach -- describe what was built and how, not "X% improvement" or "Y thousand transactions."
3. **Promote www.ArshiaHemati.com whenever possible.** Direct recruiters to the portfolio site so they can see the work for themselves. This is the strongest proof point -- let it speak.
4. **Elyt is the flagship achievement.** Lead with it when relevant. Link to elyt-ai.com or the portfolio.
5. **Tone: confident, direct, understated.** Show competence through what was done, not through adjectives.

## Default CV PDFs (no customization for now)

- **German:** `C:\Users\a.hemati\Downloads\C\de\CV_www.ArshiaHemati.com.pdf`
- **English:** `C:\Users\a.hemati\Downloads\C\en\CV_Arshia_Hemati_EN.pdf`

Use German CV for DACH listings in German. English CV for English-language listings. Do NOT generate custom PDFs unless user explicitly asks.

**Notice period:** 6 weeks
**Cover letters:** Read `.claude/skills/cover-letter/SKILL.md` for all cover letter rules, structure, tone, and candidate-specific instructions. That skill file is the single source of truth for cover letter generation.

## Your Portfolio / Demo

- **url:** https://elyt-ai.com
- **portfolio:** https://www.ArshiaHemati.com
- **when_to_share:** AI/Automation roles, Full-stack roles where builder mindset matters, any role where side projects are valued

Offer Elyt demo access in applications for AI/automation-relevant roles. Link portfolio site in all applications.

## Industries Where You Have the Strongest Fit

| Industry | Why |
|----------|-----|
| Enterprise SaaS / B2B platforms | 2+ years building multi-tenant enterprise systems at Axess |
| Ticketing / Events / Venues / Sports | Direct domain experience: 160+ venues, 53 countries at Axess |
| Tourism / Hospitality tech | Reservation management, POS, access control at Axess |
| Trade / Fintech | Trade operations platform at Atra, multi-currency, cross-border |
| AI / Automation tooling | Elyt -- commercial AI browser automation platform |
| POS / Retail tech | Built B2B POS from scratch with hardware integration |
| DevTools / Developer platforms | Workflow engines, API design, cross-language type generation |

## Hard Discard Filters (apply BEFORE scoring)

If any of these match, mark the offer `SKIP` immediately. Do not run full A-G evaluation. Write a one-line discard reason in the report and TSV note.

### Contract type — discard if:
- Temp / fixed-term contract (any duration)
- B2B-only (no UoP / employment option offered)
- Freelance / per-project engagement
- Internship / trainee / apprenticeship

Keep if: permanent employment (UoP in Poland, unbefristeter Arbeitsvertrag in AT/DE, CDI in FR, etc.), or contract type not mentioned (evaluate, note unknown).

### Salary — discard if:
- Salary IS disclosed AND the top of the advertised range is below EUR 55K (minimum from `config/profile.yml`)
- PLN discard thresholds (NBP 4.25, validated April 2026):
  - Permanent/UoP: top of range < **19,480 PLN/month gross (12-pay)**
  - B2B revenue: top of range < **19,100 PLN/month** (cash-parity floor)
  - Hourly B2B: rate < **112 PLN/h** (absolute floor)
- Do NOT discard if salary is hidden / not disclosed — evaluate normally and note in Block D

### Discard output format:
```
**DISCARDED — [contract type | salary below minimum]:** {one-line reason}
Score: N/A
```
Write TSV with status `Discarded` and score `N/A`.

---

## Your Comp Targets

Read current targets from `config/profile.yml` (EUR 55K–80K, minimum EUR 55K). Additional guidance:
- Austrian market: use Glassdoor AT, kununu.com, StepStone AT for comp data
- For remote EU roles: comp may be higher, adjust accordingly
- For UK/US/CA/AU remote roles: expect significantly higher ranges, convert to EUR for comparison

### Validated PLN/EUR Reference (NBP rate 4.25 PLN/EUR, April 2026)

**Permanent via EOR — Austrian payroll, €55,000/year gross (14 pays):**

| Metric | EUR | PLN |
|--------|-----|-----|
| Brutto / year | 55,000 | 233,750 |
| Brutto / month (12-pay — Polish recruiter convention) | 4,583 | 19,479 |
| Brutto / month (14-pay — Austrian standard) | 3,929 | 16,696 |
| Brutto / hour (2,080h nominal paid) | 26.44 | 112 |
| Brutto / hour (1,696h actually worked) | 32.43 | 138 |
| **Netto / year** | **38,430** | **163,300** |
| **Netto / month (12-pay)** | **3,203** | **13,612** |
| **Netto / month (14-pay)** | **2,745** | **11,666** |

When filling PLN salary field for permanent role: write **19,479 PLN/month gross (12-pay)**.

---

**B2B Einzelunternehmer — 15% Basispauschalierung (software dev, 2026):**

| Metric | A: Cash-parity floor | B: Total-value parity ★ | C: Upper end |
|--------|---------------------|-------------------------|--------------|
| Revenue / year (EUR) | 54,000 | 76,000 | 88,800 |
| Revenue / year (PLN) | 229,500 | 323,000 | 377,400 |
| Revenue / month (PLN) | 19,125 | 26,917 | 31,450 |
| Rate / hour @ 1,400h billable (PLN) | 164 | 231 | 270 |
| Rate / hour @ 1,696h billable (PLN) | 135 | 191 | 223 |
| Rate / hour @ 1,736h billable (PLN) | 132 | 186 | 217 |
| **Cash net / year EUR (years 4+)** | **38,823** | **39,592** | **44,368** |
| **Cash net / year PLN (years 4+)** | **165,000** | **168,300** | **188,566** |
| **Cash net / month PLN (years 4+)** | **13,750** | **14,025** | **15,714** |
| Cash net / year EUR (years 1–3, KV relief) | ≈41,160 | ≈41,700 | ≈46,700 |
| Cash net / year PLN (years 1–3) | ≈174,930 | ≈177,200 | ≈198,500 |

★ Recommended ask. Includes self-funded vacation, sick leave, pension top-up, admin, downtime buffer.
Recommended B2B headline rate: **200–230 PLN/h (€47–54/h)**.

---

**Block D evaluation rules:**
- Permanent PLN: floor = 19,479 PLN/month gross (12-pay) = EUR 55K
- B2B PLN: floor = 19,125 PLN/month revenue (cash-parity); target = 26,917 PLN/month (total-value)
- Hourly B2B: floor = 132 PLN/h; target = 200–230 PLN/h
- Salary not disclosed: evaluate normally, note in Block D
- Always convert PLN → EUR at 4.25; note rate used

## Your Negotiation Scripts

**Salary expectations:**
> "Based on market data for this role in Austria, I'm targeting [RANGE from profile.yml]. I'm flexible on structure -- base, bonus, equity, or benefits -- what matters is the total package and the growth opportunity."

**Geographic discount pushback:**
> "I deliver the same output regardless of location."

**When offered below target:**
> "I'm comparing with opportunities in the [higher range]. I'm drawn to [company] because of [reason]. Can we explore [target]?"

**Visa/sponsorship (pre-empt):**
> "I hold an RWR+ visa -- no sponsorship needed. I'm authorized to work in Austria immediately."

## Your Location Policy

**Preferences:**
- Salzburg area: on-site, hybrid, or remote -- all OK
- Vienna: would consider relocating only for the right role
- Rest of Austria: remote only
- EU: remote only
- UK/US/CA/AU: remote only
- Other countries: decline

**In forms:**
- Location: Salzburg, Austria
- Timezone: CET (GMT+1)
- Visa: RWR+ Visa, no sponsorship required
- Availability for on-site: Salzburg area immediately, Vienna if relocating

**In evaluations (scoring):**
- On-site Salzburg: score **5.0**
- Hybrid Salzburg: score **5.0**
- Remote anywhere: score **5.0**
- On-site Vienna: score **4.5** (open but not preferred)
- Remote EU: score **4.5**
- Remote UK/US/CA/AU: score **4.0**
- On-site outside Salzburg/Vienna: score **2.0**
- Countries outside EU/UK/US/CA/AU: score **1.0** (decline)

## Resume Confidentiality Notes

- Do NOT name specific Axess internal projects (CLICS, ACP, etc.) -- may violate company TOS
- CAN describe the systems and what they do (ticketing, accreditation, POS, reservation management)
- CAN mention customer types (stadiums, ski resorts, event venues) without naming specific venues
- Axess AG public info (160+ stadiums, 53 countries, 470+ employees) is fair game -- it's on their website
- Quantification should be credible and scope-based, not fake-precise metrics
