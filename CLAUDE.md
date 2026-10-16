# Scotling product repo — studio rules (this repo is PUBLIC)

The constitution lives in the private studio repo `~/scotling-studio/CLAUDE.md` (sections 3, 4, 7.7); it binds every agent working here. Short form:
- `main` is founder-only and deploys to production on push. Never checkout, merge, rebase or push `main`. Never open a pull request (a PR deploys a preview). Never `firebase deploy`, `wrangler`, `npm publish`.
- V2 work is on `dev/v2`; harness and evals on `studio/*` branches. Commit named paths only: `git add <paths> && git commit -m "..." -- <paths>`. Never `git add -A`.
- No Gaelic string lives in code; strings come from the studio's `gaelic_strings.json` through the content pipeline, every one `PENDING` native-speaker review.
- No trackers, ads, chat, streaks, loot boxes, geolocation or profiling (ICO Children's Code). Pupils are pseudonymous.
- No contact with any person or organisation, no spending, no sign-ups. Prepare; put it on the Founder Card.
- Guardrails here are `scripts/guard.py` and `.claude/settings.json`; no agent edits them (7.7.6).
