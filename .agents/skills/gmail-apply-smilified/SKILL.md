---
name: gmail-apply-smilified
description: Complete eligible Career-Ops applications from evaluated tracker URLs through the user's own Chrome profile, and submit them automatically when application.auto_submit is enabled. Use for apply-one or apply-N requests from the Gmail-derived pipeline. Read role fit, personal data, resume paths, language, submission policy, and portal behavior from the current user's Career-Ops files; never hardcode a profession, identity, employer blocklist, or CV path.
---

# Complete Career-Ops applications

Use the current user's profile and browser. Reuse the tracker, portal recipes, and status scripts; do not create a parallel tracker or batch system.

## Preflight

1. Run `node doctor.mjs --json` and complete onboarding if needed.
2. Read `config/profile.yml`, `cv.md`, and `data/blacklist.md` when it exists.
3. Use `target_roles`, `gmail_classifier.match_excludes`, the evaluated report, and `data/blacklist.md` as the role/company guardrails. Do not substitute software-development rules or any other profession-specific policy.
4. Require an evaluated score at or above `application.minimum_score` (default `4.0`). For a direct unevaluated URL, run the normal Career-Ops evaluation first.
5. Resolve the resume from `application.resumes.by_language.<language>` and then `application.resumes.default`. Refuse to fabricate a path; if the configured file is missing, ask the user to provide a PDF or generate one through the normal PDF mode.
6. Read `application.auto_submit`. The skill always completes an eligible application. This flag controls only the final submission: `true` is standing permission to submit after validation; `false` stops at the fully completed form.
7. Read `application.captcha_wait_seconds` (default `300`) for the CAPTCHA-extension wait.

## Select URLs

For a tracker batch, run:

```bash
node scripts/pick-apply-urls.mjs <amount>
```

Without an amount, use 10. The picker reads the latest tracker layout, minimum score, blacklist, and portal recipes. It marks an unknown portal for browser takeover instead of excluding the user's evaluated role.

## Browser

Ask the user to run `launch-chrome.bat` before the apply flow. It creates a per-Windows-user profile outside the repository; every user signs into their own job portals and owns their own cookies.

If Chrome/CDP is closed or unreachable, stop. Do not launch or restart it from the skill. Do not use the browser to test code changes; use it only for the requested live application.

## Complete each form

Run:

```bash
node scripts/gmail-apply.mjs <url>
```

The script fills stable, profile-backed fields. If `application.auto_submit: true`, it also submits a validated supported portal. Inspect its JSON:

- `prepared: true` -> inspect required fields, resume selection, and visible answers with Chrome DevTools MCP.
- `takeover_required: true` -> continue immediately in the reported external ATS tab with Chrome DevTools MCP, upload the reported resume path when needed, and finish every required field. This is a handoff, not a completed or skipped attempt.
- `job_unavailable: true` -> update the existing tracker row to `Discarded` with `node set-status.mjs`.
- Any missing or job-specific required answer -> use only `cv.md`, `article-digest.md`, `config/profile.yml`, `modes/_profile.md`, and current-conversation facts. Ask the user if the answer is not supported.

Use the form/job language when the profile supports it; otherwise use `language.output`. Upload the configured resume for that language.

Do not stop or skip merely because a CAPTCHA appears. The user's solver extension runs in the same launched Chrome profile. Leave that tab open and wait up to `application.captcha_wait_seconds` for the extension to solve it; check periodically and continue the form as soon as the challenge clears. Do not click the challenge, switch browsers, reload the page, or attempt to solve it manually. If the configured wait expires, report the application as blocked with the current URL and CAPTCHA state. Stop for forced login or account creation. Optional login does not block form completion.

## Finish and submit

Always finish all supported fields for every role that passes the profile, score, blacklist, and availability gates.

- With `application.auto_submit: true`, submit immediately after validation. Do not pause for another review prompt. For a scripted portal, the plain command above performs submission. For browser takeover, click Submit after validating the completed form.
- With `application.auto_submit: false`, stop only at the final Submit action and present the fully completed form and key answers. If the user then explicitly confirms, run:

```bash
node scripts/gmail-apply.mjs <url> --submit --reviewed
```

Regardless of submission mode, require visible, strict post-submit evidence; a click, detached modal, or URL change alone is not success.

After confirmed success, update the existing row:

```bash
node set-status.mjs <tracker-number> Applied --note "Application submitted and confirmed"
```

Never create a tracker row. Leave blocked or unconfirmed attempts in their current status and report the required manual action.

## Final response

Report planned count, completed-form count, confirmed submissions, skipped or blocked roles with reasons, and URLs still requiring user action.
