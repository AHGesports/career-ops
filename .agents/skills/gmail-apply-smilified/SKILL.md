---
name: gmail-apply-smilified
description: Prepare and, after explicit user review, submit Career-Ops applications from evaluated tracker URLs through the user's own Chrome profile. Use for apply-one or apply-N requests from the Gmail-derived pipeline. Read role fit, personal data, resume paths, language, and portal behavior from the current user's Career-Ops files; never hardcode a profession, identity, employer blocklist, or CV path.
---

# Prepare Career-Ops applications

Use the current user's profile and browser. Reuse the tracker, portal recipes, and status scripts; do not create a parallel tracker or batch system.

## Preflight

1. Run `node doctor.mjs --json` and complete onboarding if needed.
2. Read `config/profile.yml`, `cv.md`, and `data/blacklist.md` when it exists.
3. Use `target_roles`, `gmail_classifier.match_excludes`, the evaluated report, and `data/blacklist.md` as the role/company guardrails. Do not substitute software-development rules or any other profession-specific policy.
4. Require an evaluated score at or above `application.minimum_score` (default `4.0`). For a direct unevaluated URL, run the normal Career-Ops evaluation first.
5. Resolve the resume from `application.resumes.by_language.<language>` and then `application.resumes.default`. Refuse to fabricate a path; if the configured file is missing, ask the user to provide a PDF or generate one through the normal PDF mode.

## Select URLs

For a tracker batch, run:

```bash
node scripts/pick-apply-urls.mjs <amount>
```

Without an amount, use 10. The picker reads the latest tracker layout, minimum score, blacklist, and portal recipes. It marks an unknown portal for browser takeover instead of excluding the user's evaluated role.

## Browser

Ask the user to run `launch-chrome.bat` before the apply flow. It creates a per-Windows-user profile outside the repository; every user signs into their own job portals and owns their own cookies.

If Chrome/CDP is closed or unreachable, stop. Do not launch or restart it from the skill. Do not use the browser to test code changes; use it only for the requested live application.

## Prepare each form

Run:

```bash
node scripts/gmail-apply.mjs <url>
```

The script fills stable, profile-backed fields and stops before submission. Inspect its JSON:

- `prepared: true` -> inspect required fields, resume selection, and visible answers with Chrome DevTools MCP.
- `takeover_required: true` -> continue in the reported external ATS tab with Chrome DevTools MCP and upload the reported resume path when needed.
- `job_unavailable: true` -> update the existing tracker row to `Discarded` with `node set-status.mjs`.
- Any missing or job-specific required answer -> use only `cv.md`, `article-digest.md`, `config/profile.yml`, `modes/_profile.md`, and current-conversation facts. Ask the user if the answer is not supported.

Use the form/job language when the profile supports it; otherwise use `language.output`. Upload the configured resume for that language.

Never solve a CAPTCHA manually. Stop for forced login/account creation or an unsolved CAPTCHA. Optional login does not block preparation.

## Review and submit

Never submit in the initial preparation pass. Present the completed form and key answers to the user for review. Only after the user explicitly confirms submission, run:

```bash
node scripts/gmail-apply.mjs <url> --submit --reviewed
```

If the remaining flow is under browser takeover, click Submit only after the same explicit confirmation. Require visible, strict post-submit evidence; a click, detached modal, or URL change alone is not success.

After confirmed success, update the existing row:

```bash
node set-status.mjs <tracker-number> Applied --note "Application submitted and confirmed"
```

Never create a tracker row. Leave blocked or unconfirmed attempts in their current status and report the required manual action.

## Final response

Report planned count, prepared count, confirmed submissions, skipped or blocked roles with reasons, and URLs still requiring user action.
