---
name: cover-letter
description: >
  Generate a cover letter tailored to a specific role. Reads candidate profile
  from config/profile.yml and modes/_profile.md. Always runs through /humanizer
  skill before presenting. User must approve before sending.
  Triggers: cover letter, Bewerbungsschreiben, Anschreiben, application letter.
---

# Cover Letter Generator

Produces a cover letter tailored to a specific role at a specific company. Generic letters are useless — every letter must reference the actual job and stack.

## Before you start

1. Read `config/profile.yml` for candidate identity
2. Read `modes/_profile.md` for narrative, proof points, communication rules
3. Read `cv.md` for experience details
4. Get the JD (from URL, pipeline, or user paste)
5. Detect language: German JD → German letter. English JD → English letter.

## Candidate-specific rules (MANDATORY)

These override the generic cover letter rules below. Follow them exactly.

### DO:
- **Cite BOTH work experience AND personal commercial projects** for every technology mentioned. Example: "I use Angular daily at my employer and equally in my own commercial projects."
- **Always mention www.ArshiaHemati.com** — direct recruiters to portfolio
- **Drop elyt-ai.com naturally once per letter** — wherever it fits: after mentioning commercial projects, after citing experience with a technology, after describing something you built. Just a short parenthetical like "(see elyt-ai.com)" or "which is live at elyt-ai.com". Not a sales pitch. One brief mention where it feels natural.
- **Write in developer voice but PROFESSIONAL tone** — not casual, not stiff HR. Confident and measured. No slang, no "works for me", no "happy to chat". Think senior engineer writing to a hiring manager, not a friend.
- **Follow the cover letter structure below** (opening hook, the match, the fit, close) — not limited to exactly 4 paragraphs, use what the letter needs.
- **Always run through `/humanizer` skill** before presenting to user
- **User MUST review and approve** before sending. Never auto-submit.

### DON'T:
- **NEVER mention Axess AG by name, stats, or product names** (160 venues, 53 countries, CLICS, ACP, B2B POS, etc.) — describe employer generically ("mein aktueller Arbeitgeber", "ein internationales Technologieunternehmen")
- **NEVER name "Elyt"** in cover letters — say "eigene kommerzielle Produkte/Projekte" or "mein eigenes kommerzielles Produkt"
- **NEVER use stats/numbers** — let the CV carry metrics
- **NEVER rehash cv.md work experience** — the cover letter is NOT a prose version of the resume. Don't list what you built in sequence. Instead, pick 1-2 achievements that directly connect to the JD's requirements and explain WHY they matter for this role. Add context the CV can't carry: what you learned, what was hard, why you chose an approach. If the recruiter wanted a resume summary, they'd read the resume.
- **NEVER mention education** — not relevant, waste of space
- **NEVER use AI-sounding patterns** — no "mit großem Interesse", no "Darüber hinaus", no rule-of-three, no em-dash overuse, no "ich bringe X mit"
- **NEVER use "To whom it may concern"** — use "Dear Sir or Madam," in English, "Sehr geehrte Damen und Herren," in German
- **NEVER use casual tone** — no "works for me", "happy to chat", "that's what got my attention", "suits me". Professional and measured throughout.
- **When citing experience duration, check cv.md** — if a skill appears in BOTH Axess AG (2023-present) and Atra Ltd (2021-2022), say "over four years" not "several years" or "a few years". Be specific about duration based on actual CV dates.

### Candidate quick-reference:
- **Name:** Arshia Hemati
- **Location:** Salzburg, PLZ 5400
- **Notice period:** 6 weeks
- **Availability in cover letters:** hybrid or remote ONLY. Never say "onsite" in cover letters even if role is onsite.
- **Current employer:** International tech company (ticketing/access solutions) — DO NOT name
- **Daily stack at work:** Angular 17-18, .NET 8, C#, TypeScript, Oracle
- **Personal projects stack:** Angular, Node.js/Express, FastAPI/Python, Tauri (desktop), multi-provider LLM integration, browser automation, workflow orchestration
- **Key achievements (describe, don't quantify):** Built B2B system from scratch as sole dev, re-architected legacy monolith to domain-separated services with TDD, built SSO/OAuth framework across 2 product lines, built commercial AI/automation platform solo
- **Portfolio:** www.ArshiaHemati.com
- **CVs:** German: `C:\Users\a.hemati\Downloads\C\de\CV_www.ArshiaHemati.com.pdf` / English: `C:\Users\a.hemati\Downloads\C\en\CV_Arshia_Hemati_EN.pdf`

---

## Cover letter structure

Under one page. Every paragraph earns its place. Use as many paragraphs as needed (typically 3-5), not a fixed number.

**Opening hook:**
Why this role, why now. Reference something specific about the role or company. No "I am writing to express my interest..." or "I am excited to apply..." — wasted sentences. Lead with your strongest stack overlap or connection to the role.

**The match (why you):**
Two to three specific examples of how your experience maps to their requirements. For each technology, cite both work and personal project experience. Mention concrete things you built (without naming employer). This is not a resume summary — pick the strongest matches and give brief context. Be honest about gaps and prove learning speed.

**The fit (why this company/role):**
Show you understand what makes this role specific. Reference their product area, team setup, tech decisions, or a specific aspect of the work that appeals to you as an engineer. Explain why this matters to you. Generic flattery does not count. Point to www.ArshiaHemati.com.

**Close:**
Notice period (six weeks). Location fit if relevant. Clear, professional call to action. "I would welcome the opportunity to discuss this further." or "Über ein Gespräch würde ich mich freuen." Confident, not desperate, not casual.

### Sign-off:
- German: "Mit freundlichen Grüßen" + name + www.ArshiaHemati.com
- English: "Kind regards" + name + www.ArshiaHemati.com

### Addressing:
- If contact person known → "Sehr geehrte/r Frau/Herr [Name],"
- If unknown → "Sehr geehrte Damen und Herren,"

---

## Tone

Write like a developer writing to another developer, not like HR writing to HR.

| Signal | Do this | Not this |
|--------|---------|----------|
| Tech interest | "Angular und Spring Boot im Stack, das Team arbeitet eigenständig an einem Produktbereich — das kenne ich und finde es gut" | "Ihre innovative Unternehmenskultur und der moderne Technologie-Stack haben mein Interesse geweckt" |
| Honesty about gaps | "Blazor ist neu für mich, aber mit Angular und dem .NET-Ökosystem bin ich tief genug drin" | "Ich bin stets lernbereit und anpassungsfähig" |
| Achievements | "Bei meinem Arbeitgeber habe ich ein System allein aufgebaut" | "Ich bringe umfangreiche Erfahrung in der Softwareentwicklung mit" |

---

## Tone matching by company type

Read the JD and company website to calibrate:

| Company type | Tone | Example |
|-------------|------|---------|
| Startup / tech | Conversational, direct | "Ich arbeite seit Jahren mit genau diesem Stack" |
| Corporate / enterprise | Professional, measured | "In meiner aktuellen Rolle verantworte ich vergleichbare Systeme" |
| Recruiting agency | Efficient, skills-focused | Lead with stack match, keep brief — recruiter forwards to client |
| Family business / Mittelstand | Personal, grounded | Show genuine interest in the product/industry |

## Length and format

- Under one page, always
- Plain text for form paste, or PDF matching CV design
- German close: "Mit freundlichen Grüßen"
- English close: "Kind regards"

## Special circumstances

**Tech stack gaps:** Be honest. "Blazor ist neu für mich" is fine. Then prove learning speed by referencing personal projects where you learned a new stack from scratch.

**Recruiter listings (employer hidden):** Focus on the role and stack, not the company. You can't reference company culture or products you don't know.

**Overqualified concerns:** If applying to a role that seems below your level, briefly explain what draws you (location, specific tech, work-life balance). Don't over-justify.

## Common mistakes to avoid

- **Rehashing the resume.** Cover letter adds context and personality — don't repeat bullet points.
- **Generic openings.** "Ich bewerbe mich mit großem Interesse..." tells nothing. Open with what you do.
- **No company/role reference.** If you could send the same letter to 50 companies, it's too generic.
- **Underselling or overselling.** State what you did, factually. No "ich bin der perfekte Kandidat" and no "ich weiß, dass mir noch Erfahrung fehlt, aber..."
- **Burying the lead.** If you have a direct connection to the role (you use their tech stack daily, you've built similar systems), say it first.

---

## Process

1. Read JD → extract key technologies, team structure, what makes this role specific
2. Draft cover letter following structure above
3. Run through `/humanizer` skill
4. Present to user with note: "Approve? Then apply."
5. If user gives feedback → revise and re-humanize
6. Never submit without user approval

## Output

Deliver as plain text (not markdown, no bold, no headers) — ready to paste into application forms or save as PDF.
