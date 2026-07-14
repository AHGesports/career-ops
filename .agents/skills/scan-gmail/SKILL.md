---
name: scan-gmail
description: Scan the current user's read-only Gmail job alerts into the Career-Ops pipeline. Use for requests to scan, sweep, ingest, or pull job-alert email URLs, including /scan-gmail and /career-ops scan gmail with an optional time window. Read targeting from config/profile.yml, support any profession, and never modify Gmail.
---

# Scan Gmail into Career-Ops

Run the deterministic scanner in the current session. Do not spawn subagents and do not place raw email HTML in context.

## Preflight

1. Run `node doctor.mjs --json`. Complete normal Career-Ops onboarding if required.
2. Read `config/profile.yml`. Use `target_roles` as the default classifier. Treat `gmail_classifier.match_keywords` and `match_excludes` as optional user overrides; never insert profession-specific defaults into system files.
3. Check `.env` for `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` without printing their values.
4. If the refresh token is missing, ask the user to create a Google OAuth Desktop client, put the client id and secret in `.env`, and run `node scripts/gmail-auth.mjs`.

Gmail access must remain `gmail.readonly`. Never mark messages read, label, archive, delete, or send mail.

## Run

Map the requested window directly: no argument or `24h`/`today` -> `1d`; `48h` -> `2d`; `weekend` -> `3d`; `week` -> `7d`; `month` -> `30d`.

Run a dry scan first:

```bash
node scripts/gmail-scan.mjs --window <window>
```

If `warnings` is non-empty, do not commit. Inspect the sender configuration or retry tracker resolution. A sender marked `untested` requires inspecting one real message and updating `config/gmail-senders.yml` before enabling it.

When the dry run is clean, commit the scan output:

```bash
node scripts/gmail-scan.mjs --window <window> --commit
```

Use `--no-follow` only when the user accepts losing tracker-wrapped job URLs.

## Outputs

- Profile matches -> `data/pipeline.md` as pending URLs for the normal evaluation pipeline.
- Non-matches -> `data/pipeline-deferred.md` for later review.
- Search/list pages -> `data/pipeline-lists.md`.
- Processed message ids -> `data/gmail-scan-history.tsv` for idempotency.

Do not invent a score, create application rows, or introduce `Auto-Match` as a tracker status. Let the existing Career-Ops pipeline evaluate a role before it becomes an application.

## New providers

Add only extraction mechanics to `config/gmail-senders.yml`; keep candidate preferences in `config/profile.yml`. Support `direct`, `plaintext`, `base64`, `zlib`, and `tracker` extraction. Leave an unverified provider as `untested` until one real alert proves its format.

## Final response

Report the requested window, messages processed, new matched/deferred/list URLs, tracker failures, warnings, and whether files were committed.
