# Candidate profile (self-contained)

Source: [../cv.md](../cv.md), [../config/profile.yml](../config/profile.yml), [../modes/_profile.md](../modes/_profile.md). Summarized here so that research files don't need to re-open the root CV.

See also: [goal.md](goal.md) · [options.md](options.md) · [final.md](final.md)

---

## Identity

- **Name:** Arshia Hemati
- **Age:** 22 (born 2003-06-02)
- **Location:** Salzburg, Austria (PLZ 5400)
- **Timezone:** CET (GMT+1)
- **Visa:** RWR+ Karte (Austria). No sponsorship required anywhere in EU.
- **Languages:** English fluent · German professional · Persian native
- **Portfolio:** https://www.ArshiaHemati.com
- **LinkedIn:** arshia-hemati-5358742ab
- **GitHub:** AHGesports

## Experience summary

- **Total YOE:** 4+ years professional full-stack
- **Current role:** Full-stack Software Engineer @ Axess AG, Salzburg (2023-08 → present, ~2.75 years)
- **Prior role:** Full-stack Software Developer @ Atra Ltd (2021-01 → 2022-08, ~1.6 years)
- **Solo project:** Elyt (founder) — commercial agentic browser automation platform

## Role 1 — Axess AG (current)

Enterprise ticketing and access-control systems for 160+ venues in 53 countries (public info on axess.com). Team of ~4.

Work done:
- Re-architected legacy monolith (no DI, no tests, tight coupling) to SOLID domain-separated services with TDD as standard. Doubled codebase to ~447 files + ~56 test files.
- Built multi-tenant B2B POS from scratch as sole developer: device-agnostic hardware abstraction, integrated payment processing. Deployed to 20+ venue operators, handling 20K+ monthly transactions.
- Engineered real-time bi-directional state synchronization between enterprise platform and customer middleware. Event propagation in milliseconds. Deployed to 10+ enterprise customers.
- Built custom enterprise SSO/OAuth framework across 2 product lines. Integrates with customer identity providers (automated provisioning + dual-auth flow). Now standard for all new enterprise onboardings.
- Code reviews and mentorship of 2 junior devs + multiple interns.

Stack (primary): Angular 17–18, .NET 8, TypeScript, JavaScript, Oracle, PL/SQL.
Stack (supporting): RxJS, ASP.NET Core, ASP.NET MVC, EF Core, NHibernate, WPF (basic), Redis, xUnit, Jest, Docker, Azure DevOps, Jira, GitHub Actions.

## Role 2 — Atra Ltd (prior)

Cross-border trade operations platform.

Work done:
- Real-time trade operations platform: 200+ daily cross-border transactions across 8 international markets. Live order tracking, automated multi-currency invoice generation, webhook-driven partner notifications for 30+ active trading partners.
- Redis caching + automated market data pipelines aggregating pricing from 15+ international trade platforms. 10K+ daily price updates via background job queues. Real-time analytics dashboards.
- CI/CD pipelines in Azure DevOps + Docker + staged deployments to Azure. Reduced release cycles from bi-weekly manual deploys to 3+ releases per week across 4 environments.

Stack (primary): C#, Angular, .NET, TypeScript, Python.
Stack (supporting): ASP.NET Core, PostgreSQL, SQL Server, MongoDB, Redis, Docker, Azure, Azure DevOps.

## Elyt (solo founder, ongoing)

Commercial agentic browser automation platform. Architecture:

- **Front end:** Angular web app, WebView2 desktop (Tauri), browser extension. Shared authentication via SSO/OAuth middleware.
- **Orchestrator:** Node.js (Express). 26 routes, 94 service modules. BullMQ job scheduling. Redis caching.
- **Execution engine:** FastAPI (Python). Browser automation framework for agentic AI and web automation scripts.
- **Type safety:** Zero-drift contracts via automated cross-language type generation (TS ↔ Python).
- **Workflow engine:** Visual, node-based composition. Sequential and parallel execution. Real-time state tracking. Recurring and timezone-aware batch automation. Autonomous scheduled execution of AI workflows.
- **LLM layer:** Provider-agnostic abstraction currently supporting 5 providers (OpenAI, Anthropic, Gemini, + 2 others). MCP extensibility. Users can dynamically switch AI models within workflows.
- **Status:** In production per candidate claim. **ROUND 06 AUDIT VERDICT: (c) demo/portfolio piece.** See [data/elyt-audit.md](data/elyt-audit.md). No publicly verifiable traction: no pricing page, no login, no GitHub OSS, no HN/PH/Reddit mentions, no customer logos. Additionally: landing-page positioning targets **anti-detect browser / multi-account / growth-hacking** market (integrates with AdsPower, MoreLogin, etc.) — NOT the "enterprise agentic automation" market implied by the CV summary. This matters for Options D/M: at Browserbase/Skyvern/Langfuse/Parloa the portfolio reads as a scraping tool, not peer infrastructure.

URL: https://elyt-ai.com

## Skills declared on CV

- **Languages:** C#, TypeScript, JavaScript, Python, SQL, PL/SQL
- **Backend:** .NET 8, ASP.NET Core, EF Core, Node.js, Express, FastAPI, Redis, MongoDB, MySQL, Oracle, PostgreSQL, SQL Server
- **Frontend:** Angular, RxJS, Astro, Bootstrap, SCSS, Tailwind
- **DevOps/Testing:** Azure, Azure DevOps, GitHub Actions, Vercel, CI/CD, Docker, Jest, Playwright, Puppeteer, pytest, xUnit, TDD
- **Architecture:** GraphQL, gRPC, SSO, RBAC, JWT, OAuth 2.0, OpenAPI, Contract-First API Design, REST, SOLID, System Design, WebSockets, Agile, Scrum
- **AI/Automation:** Agentic AI, LangChain, LLM API Integration (OpenAI, Anthropic, Gemini), MCP

## Education

- FH Salzburg, Information and Technology Systems, 2023-09 → 2024-06
- IBC Hetzendorf, Business, 2022-09 → 2023-09
- Payame Noor University, Computer Science, 2021-03 → 2022-08

## Economic and location constraints

- **Current comp target (stated):** €60–70K gross EUR (likely underpriced — see [data/salary-bands.md](data/salary-bands.md))
- **Notice period:** 6 weeks (Austrian standard)
- **Location flexibility:** Salzburg on-site/hybrid OK · Vienna only for right role (reluctant to relocate) · Remote Austria/EU/UK/US/CA/AU OK · Other countries declined
- **Dependents:** None stated
- **Existing network:** Axess (ticketing/venues/events), Atra (trade/fintech-adjacent), FH Salzburg alumni

## Self-stated superpowers

- End-to-end system delivery — architecture to production, solo or team
- Enterprise .NET + Angular re-architectures, multi-tenant B2B, hardware integration
- AI automation engineering: LLM integration, browser automation, workflow orchestration
- Cross-stack fluency: C#, TypeScript, Python, SQL/PL-SQL all at production level

## Implicit positioning inferred by research team

- **Senior-shaped CV.** Scope of solo work (POS system, SSO framework, re-architecture, Elyt platform) is above the 4-YOE-generalist pattern. Austrian KV band: realistically ST1 Erfahrung (€62.6K floor) trending toward ST2 Einstieg (€57K floor, rising to €76K Erfahrung).
- **Underpricing.** Stated €60–70K target is the KV minimum band, not the market rate for his scope of work.
- **Language asset underutilized.** Professional German + native Persian + fluent English is rarer than average in DACH engineering hiring — meaningful negotiation lever.
- **Elyt is a wildcard.** Strong portfolio signal, weak product signal without traction data. See [data/elyt-audit.md](data/elyt-audit.md).
- **.NET 8 is an ASSET for DACH-enterprise AI, not a liability.** Round 09 invalidated prior "demote .NET for AI" advice. Microsoft Agent Framework 1.0 + Azure AI + Semantic Kernel ecosystem make .NET a first-class AI stack in DACH enterprise (Post AG, RBI, Siemens, BMW, KPMG). Candidate should run two CV variants: .NET + Azure AI lead for DACH-enterprise AI; Python + Elyt lead for remote-EU/US AI. See [data/jd-samples.md](data/jd-samples.md) for prior-sample-bias correction and [options/D-microsoft.md](options/D-microsoft.md).

## Writing-style preferences (for any public content generated)

Per [../modes/_profile.md](../modes/_profile.md):
- Professional, no hype.
- Let the resume PDF carry the metrics; prose should describe what was built and how, not X% improvements.
- Promote www.ArshiaHemati.com.
- Elyt is the flagship; lead with it when relevant.
- Tone: confident, direct, understated.

## Confidentiality notes

- Do NOT name specific Axess internal projects (CLICS, ACP, etc.) — may violate company TOS.
- Public Axess info (160+ venues, 53 countries, 470+ employees) is fair game.
- Customer types (stadiums, ski resorts, event venues) describable without naming specific venues.
