# career-research/ — handoff guide

**Purpose.** Ongoing, multi-round research on the candidate's optimal career path. Designed so a fresh agent with no prior context can navigate, understand, extend, or correct the work.

**Start here if you are a new agent.** Read in this order:

1. [goal.md](goal.md) — what the research is solving (15 min read)
2. [candidate.md](candidate.md) — self-contained candidate profile (no need to open `../cv.md`)
3. [methodology.md](methodology.md) — how to research, which sources to trust
4. [options.md](options.md) — the full menu of paths evaluated
5. [final.md](final.md) — current summary evaluation + ranking
6. [TODO.md](TODO.md) — open research questions, priority-ordered; pick next task from top

## Folder map

| Folder / file | What's in it |
|---|---|
| `README.md` | This file. Handoff entry point. |
| `goal.md` | Problem statement, constraints, success metric. |
| `candidate.md` | Self-contained candidate profile. Cite this instead of `../cv.md`. |
| `methodology.md` | Research methodology, source hierarchy, scoring rubric. |
| `role-explainer.md` | What Platform Engineer and AI Engineer actually are, why they were chosen, skill requirements, ramp timelines, transfer of candidate's existing knowledge. |
| `options.md` | Index of all 13 paths evaluated. |
| `final.md` | Summary-level evaluation + ranking + primary recommendation. |
| `TODO.md` | Ordered list of open research tasks for the next round. |
| `rounds/` | One file per completed research round (traceability + sources). |
| `options/` | One file per path with deep-dive content (expandable independently). |
| `data/` | Shared data tables (markets, salaries, regulatory, AI-replacement evidence). |
| `decisions/` | Decision records with rationale (primary, hedge, triggers). |
| `plans/` | Action plans (12-month, interview prep, etc.). |

## How to add a research round

1. Pick the top open item from [TODO.md](TODO.md).
2. Do the research. Cite sources inline.
3. Create `rounds/round-NN-<short-slug>.md` with: goal, sources, findings, new claims, invalidated claims.
4. If findings change an option's evaluation, update the matching `options/X-*.md` file.
5. If findings change the final ranking, update [final.md](final.md) and link the round that caused the change.
6. Remove the completed TODO item and add any new items the round surfaced.

## Cross-linking convention

- Relative links only. Always link when referencing a fact whose source is in another file.
- When adding a new claim to any file, cite either (a) an external URL, or (b) a `rounds/round-NN-*.md` or `data/*.md` file that has the source.
- Never repeat large data tables across files — put them in `data/` and link.

## File naming conventions

- `rounds/round-NN-<slug>.md` — zero-padded two-digit round number.
- `options/X-<slug>.md` — option letter prefix (A–N) matches [options.md](options.md).
- `data/<topic>.md` — topic slug.
- `decisions/<slug>.md` — short slug.

## Ground rules (do not skip)

1. **Never delete a prior round's conclusions — refine or invalidate with citation.** Traceability matters.
2. **Always distinguish fact from inference.** Put `[fact]` or `[inference]` tags if ambiguous.
3. **Cite confidence level** on non-trivial claims: HIGH / MEDIUM / LOW.
4. **Push back on prior rounds where the data doesn't support them.** Prior rounds have been wrong before (see rounds/round-02 and round-03).
5. **Be blunt.** The candidate explicitly asked for "no assumption or bias." Diplomatic hedging across options is anti-signal.
6. **Languages are fungible.** See [goal.md#premise](goal.md#premise-users-own-reframing-accepted). Do not relapse into "stay in your .NET lane" reasoning.
