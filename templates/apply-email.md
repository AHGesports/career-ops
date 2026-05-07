# Application Email — Template

Used by the mailto: apply handler (SKILL.md § Step 3.5).
Opus writes the actual email body using this exact structure. Fill placeholders based on the job posting + CV match.

---

## Language detection

| Signal | lang |
|---|---|
| URL contains `.at`, `.de`, `.ch`, `xing.com` | de |
| Job title contains German words (Entwickler, Ingenieur, etc.) | de |
| URL contains `.com`, `.io`, `.co.uk`, `justjoin.it` | en |
| Default (ambiguous) | de |

---

## CV selection

| lang | CV to attach |
|---|---|
| de | `assets/cv/CV_www.ArshiaHemati.com_DE.pdf` |
| en | `assets/cv/CV_www.ArshiaHemati.com_EN.pdf` |

When lang=de: attach DE cv. Always attach EN cv as well (both attached for DE positions).

---

## Template (EN)

**Subject:** `Application for <role> – Arshia Hemati`

```
Dear <employer/team name>,

I would like to apply for the <role> position.

What drew me to this role is that <relevant technologies from the posting that match CV — both backend and frontend, specific, e.g. ".NET / C# and Angular match my 4+ years of enterprise full-stack work">, which should let me contribute meaningfully from early on.

But what truly made the role stand out for me, is the <second and main thing about this position that matches CV or Elyt — e.g. AI focus, automation, platform work, product ownership>. I've been actively looking for a position where <why this position is special / what it enables>. The clearest example for that is my project Elyt — <one sentence relating Elyt to the role's main theme> (www.Elyt-AI.com), an AI browser automation platform I built around orchestration over agentic workflows.

You can find my CV in English and German attached below. To get a fuller picture of my work and projects please visit my personal website at www.ArshiaHemati.com.

Best regards,
Arshia Hemati
```

---

## Template (DE)

**Subject:** `Bewerbung als <role> – Arshia Hemati`

```
Sehr geehrte/r <employer/team name>,

ich möchte mich für die Position <role> bewerben.

Was mich an dieser Rolle angesprochen hat, ist, dass <relevante Technologien aus der Stellenanzeige, die zum Lebenslauf passen — Backend und Frontend, konkret>, was es mir ermöglichen sollte, von Anfang an sinnvoll beizutragen.

Was die Rolle für mich jedoch wirklich hervorhebt, ist <zweiter und hauptsächlicher Aspekt der Position, der zu Lebenslauf oder Elyt passt>. Ich suche aktiv nach einer Position, bei der <warum diese Stelle besonders ist / was sie ermöglicht>. Das deutlichste Beispiel dafür ist mein Projekt Elyt — <ein Satz, der Elyt mit dem Hauptthema der Stelle in Verbindung bringt> (www.Elyt-AI.com), eine KI-Browser-Automatisierungsplattform, die ich rund um Orchestrierung über agentische Workflows aufgebaut habe.

Meinen Lebenslauf auf Englisch und Deutsch finden Sie im Anhang. Für ein vollständigeres Bild meiner Arbeit und Projekte besuchen Sie bitte meine persönliche Website unter www.ArshiaHemati.com.

Mit freundlichen Grüßen,
Arshia Hemati
```

---

## Rules

- Fill ALL placeholders — never leave angle brackets in the sent email.
- Paragraph 1: identify 2-3 specific tech matches from posting (framework, language, architecture pattern).
- Paragraph 2: identify the ONE thing that makes this role stand out — AI, automation, scale, product ownership, domain. Relate Elyt naturally; don't force it if no connection exists (use a portfolio project instead).
- Never invent skills not in CV. Never use superlatives. Tone: plain, direct, professional.
- Never use em dashes (—) in the email body. Use a comma, period, or rewrite the clause instead.
