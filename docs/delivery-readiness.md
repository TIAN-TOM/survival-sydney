# Delivery Readiness Checklist

Last updated: 2026-05-14

This checklist records the current evidence for code readiness and the remaining submission blockers. It should be refreshed after the final Git commits and before creating the Canvas submission ZIP.

## Verified Code Checks

| Check | Result | Evidence |
|---|---:|---|
| Backend Jest + Supertest suite | PASS | `npm test --prefix backend` -> 5 suites, 19 tests |
| Frontend production build | PASS | `npm run build --prefix frontend` |
| Postman collection JSON validity | PASS | `python3 -m json.tool docs/postman-collection.json >/dev/null` |
| Swagger/app load with JWT secret | PASS | `JWT_SECRET=test-local-secret node -e "require('./backend/src/app')"` |
| Whitespace diff check | PASS | `git diff --check` |
| Real API smoke test | NEEDS REFRESH | Previous notes predate current `dev`; rerun after final fixes if submission evidence is needed |
| Browser smoke test | NEEDS REFRESH | Previous notes predate current `dev`; rerun against the final branch before submission |
| Security/rate-limit mapping | PASS | `docs/security-validation.md` maps auth, RBAC, validation, rate limiting, injection protection, and error envelopes to implementation files |
| Git workflow note | PASS | README documents repository URL, `main`, `git log --all --graph --oneline --decorate`, `git shortlog -sne --all`, and project-level reference commits |
| Variation scope guard | PASS | README states Review Mode is the only implemented variation and does not claim metadata-balanced sampling |
| Documentation/API alignment | PASS | README, Swagger, Postman, and security notes describe current `dev` routes and fields |

## Current Full-Mark Risks

| Area | Status | Required action |
|---|---:|---|
| Git contribution evidence | BLOCKED | Commit the actual subsystem work with real authorship; each member needs 12-15 meaningful commits for reflection evidence. |
| Individual key commit links | DEFERRED | Project-level commit links are in README. Per-student key commits should be selected in each student's reflection after final contribution evidence is settled. |
| Individual reflections | BLOCKED | Each student must write a 1-2 page PDF with subsystem scope, challenge, diagram, commit analysis, and Review Mode design reflection. |
| Group coversheet | BLOCKED | Obtain the signed group assignment coversheet and include it in the final submission bundle. |
| Final ZIP | PENDING | Build from the repo after commits; exclude `node_modules/`, `.env`, local build artifacts, and scratch files. |
| Leaderboard contract | OWNER REVIEW | Backend route is currently public and sorts only by best score; frontend route is protected and rendering is still a placeholder. Confirm/fix with the quiz/leaderboard owner before final submission. |

## Final Pre-Submission Commands

Run these from the repository root immediately before submission:

```bash
git status --short
npm test --prefix backend -- --runInBand
npm run build --prefix frontend
python3 -m json.tool docs/postman-collection.json >/dev/null
git diff --check
```

Then run one manual browser pass using `docs/manual-test-checklist.md`.

## Marker Notes To Keep Accurate

- The database is local MongoDB only.
- Quiz attempts are generated dynamically from active `Question` documents.
- In-progress quiz state is short-lived server memory plus frontend state; completed attempts are persisted in `Score`.
- There is no persisted `Quiz` collection.
- Admins use the same backend login mechanism as players; `/admin/login` is an optional frontend entry for admin workflow clarity.
- Review Mode uses `Score.answers[]` plus current `Question` documents; deleted questions render as placeholders rather than durable snapshots.
