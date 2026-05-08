# Delivery Readiness Checklist

Last updated: 2026-05-07

This checklist records the current evidence for code readiness and the remaining submission blockers. It should be refreshed after the final Git commits and before creating the Canvas submission ZIP.

## Verified Code Checks

| Check | Result | Evidence |
|---|---:|---|
| Backend Jest + Supertest suite | PASS | `npm test --prefix backend -- --runInBand` -> 4 suites, 16 tests |
| Frontend production build | PASS | `npm run build --prefix frontend -- --outDir /tmp/comp5347-a2-frontend-build --emptyOutDir` |
| Postman collection JSON validity | PASS | `python3 -m json.tool docs/postman-collection.json >/dev/null` |
| Swagger/app load with JWT secret | PASS | `JWT_SECRET=test-local-secret node -e "require('./backend/src/app')"` |
| Whitespace diff check | PASS | `git diff --check` |
| Real API smoke test | PASS | Register, start quiz, submit, duplicate submit rejection, review, admin login, invalid bulk import index |
| Browser smoke test | PASS | Product-style Sydney Life home page, single quiz CTA, spaced header navigation, split light/dark theme control, high-contrast Login header action, protected-route login notices, register, 10-question quiz, completion, Review Mode, admin login via login page, admin page load, theme persistence |
| Security/rate-limit mapping | PASS | `docs/security-validation.md` maps auth, RBAC, validation, rate limiting, injection protection, and error envelopes to implementation files |
| Git workflow note | PASS | README documents repository URL, `main`, `git log --all --graph --oneline --decorate`, `git shortlog -sne --all`, and project-level reference commits |
| Variation scope guard | PASS | README states Review Mode is the only implemented variation and clarifies that topic/difficulty metadata does not create a Categorised Quiz flow |
| Bonus-eligible evidence | PASS | README documents metadata-rich sampling, durable Review snapshots, Review summary/filter, Review learning breakdown, actionable validation/import errors, and accessible feedback in What/Why/How format |

## Current Full-Mark Risks

| Area | Status | Required action |
|---|---:|---|
| Git contribution evidence | BLOCKED | Commit the actual subsystem work with real authorship; each member needs 12-15 meaningful commits for reflection evidence. |
| Individual key commit links | DEFERRED | Project-level commit links are in README. Per-student key commits should be selected in each student's reflection after final contribution evidence is settled. |
| Individual reflections | BLOCKED | Each student must write a 1-2 page PDF with subsystem scope, challenge, diagram, commit analysis, and Review Mode design reflection. |
| Group coversheet | BLOCKED | Obtain the signed group assignment coversheet and include it in the final submission bundle. |
| Final ZIP | PENDING | Build from the repo after commits; exclude `node_modules/`, `.env`, local build artifacts, and scratch files. |

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
- Review Mode uses `Score.answers[].questionSnapshot` so completed attempts remain reviewable if questions are later edited or deleted.
