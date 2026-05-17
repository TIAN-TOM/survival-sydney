# Audit Report — A2 Group 5 MERN Quiz App

| Field | Value |
|---|---|
| Audit date | 2026-05-18 |
| Branch | `final-shuffled-answer-tests` |
| HEAD commit | `fd08cc8` — `fix: enforce admin login boundaries` + working tree changes (uncommitted) |
| Working tree | Contains uncommitted implementation changes from this refresh |
| Approved variation | Review Mode after completion |
| Spec sources | `docs/assignment/A2_Specification.md` + `docs/assignment/A2_Ed_Discussion_Supplement.md` |
| Scope | Submission-readiness implementation pass after the previous audit found populate, frontend-test, per-attempt shuffle, admin-boundary, and packaging risks |
| Auditor | Internal submission readiness audit |

---

## §1 — Executive Summary

**PASS. No submission blocker remains from the four previously identified risks.**

Backend tests pass, frontend smoke tests pass, and the frontend production build succeeds. The backend now uses real Mongoose `.populate()` calls, quiz option order is per-attempt rather than deterministic-per-question, frontend Vitest coverage exists for the highest-value smoke surfaces, the admin/player boundary is documented, and Tracy's extra markdown reflection source has been removed while the PDF deliverable remains.

### Items Fixed In This Refresh

| Original risk | Result | Evidence |
|---|---|---|
| M-01 — no literal `.populate()` usage | Fixed | `backend/src/controllers/quiz.controller.js` now populates `answers.questionId` in both history and attempt-detail paths. |
| H-02 — zero frontend tests | Fixed | `npm test --prefix frontend` passes 4 files / 13 tests. |
| Option order deterministic-per-question | Fixed | `backend/src/utils/shuffleQuestion.js` now generates per-attempt option permutations; `backend/src/utils/quizAttemptToken.js` signs the attempt order. |
| Admin blocked from player routes but undocumented | Fixed | `README.md` now states that admins manage questions only and are blocked from player quiz/history/leaderboard routes. |
| Postman/Swagger stale for quiz submit | Fixed | `backend/src/docs/swagger.js` and `docs/postman-collection.json` include `attemptToken`. |
| Tracy extra markdown source included | Fixed | `docs/individual-reflections/TracyCui-reflection.md` removed; `TracyCui-reflection.pdf` remains. |

### Projected Total

Range, not a point estimate, because reflection marks depend on the PDF content and marker strictness.

| Scenario | Projected /100 | Bonus | Confidence |
|---|---:|---:|---|
| Post-refresh working tree, before any final commit | **93-99** | **+3 to +5** | Medium-high |

Remaining uncertainty is mostly outside code: individual reflection quality, live demo execution, coversheet/signature expectations, and marker interpretation.

---

## §2 — Verification Evidence

All commands were run from `/Users/tomtianys/Desktop/COMP4347-COMP5347-Assignment-2--Group5` on 2026-05-18 AEST.

```text
$ npm test --prefix backend -- --runInBand
PASS src/tests/api.test.js
PASS src/tests/admin.controller.test.js
PASS src/tests/validators.test.js
PASS src/tests/forbidAdminQuiz.middleware.test.js
PASS src/tests/errorHandler.test.js
PASS src/tests/envelope.test.js
Test Suites: 6 passed, 6 total
Tests:       28 passed, 28 total
Time:        1.828 s
```

```text
$ npm test --prefix frontend
Test Files  4 passed (4)
Tests       13 passed (13)
Duration    1.03 s
```

```text
$ npm run build --prefix frontend
vite v6.4.2 building for production...
✓ 137 modules transformed.
dist/index.html                   1.18 kB │ gzip:   0.54 kB
dist/assets/index-BuCV_qF3.css  252.78 kB │ gzip:  42.77 kB
dist/assets/index-DuSML9dL.js   367.80 kB │ gzip: 112.72 kB
✓ built in 1.04s
```

```text
$ rg "\.populate\(" backend/src
backend/src/controllers/quiz.controller.js:      .populate({ path: 'answers.questionId', select: 'topic' })
backend/src/controllers/quiz.controller.js:    }).populate({

$ find frontend/src -type f \( -name "*.test.*" -o -name "*.spec.*" \) | wc -l
4

$ git diff --check
(no output)

$ git ls-files | rg '(^|/)node_modules/' || echo "OK: no node_modules tracked"
OK: no node_modules tracked
```

---

## §3 — Rubric Scoring Matrix

| # | Criterion | Cap | Status | Projected | Driver / evidence |
|---:|---|---:|---|---:|---|
| 1 | Backend Architecture & APIs | 25 | Implemented | 24-25 | Controllers use consistent envelopes, JWT/RBAC, validation, Review Mode APIs, and now `.populate()` where appropriate. |
| 2 | Frontend UI & UX | 25 | Implemented | 23-25 | React Router, Context/useReducer, RHF/Zod forms, protected routes, dark mode, and 4 Vitest/RTL smoke files. |
| 3 | Quiz Logic & Mechanics | 10 | Implemented | 10 | Fixed 10-question attempts, four options, answer locking, +1 scoring, Review Mode, per-attempt option ordering, replay protection. |
| 4 | Admin Interface & Access Control | 10 | Implemented | 9-10 | CRUD/toggle/bulk import plus backend admin middleware and documented player/admin route boundary. |
| 5 | Security & Validation | 10 | Implemented | 9-10 | bcrypt, JWT, rate limits, helmet/CORS/sanitize, Zod/custom validators, signed attempt tokens, replay protection. |
| 6 | Individual Reflections | 15 | Present | 10-15 | Four reflection PDFs exist. Content quality was not fully audited in this pass. |
| 7 | Documentation & Process | 5 | Implemented | 5 | README, Swagger, Postman, assignment docs, audit report, team roles, commit evidence, and test/build commands are present. |
| Bonus | UI/UX + features + error handling | +5 | Documented | +3 to +5 | Active-quiz guard, signed attempt integrity, Swagger+Postman, theme transition polish, admin entry, accessibility/error feedback. |
| **Totals** | | **100 (+5)** | | **93-99 (+3/+5)** | |

---

## §4 — Implementation Findings

### Per-Attempt Option Order

The earlier deterministic shuffle keyed by question `_id` has been replaced. `generateOptionOrder()` creates a fresh permutation at quiz start, `applyOptionOrder()` renders that order, and the signed attempt token carries the exact order for scoring.

The client still receives only public question fields. The backend removes `correctAnswer` and `explanation` from `/quiz/start`, then reconstructs scoring from the signed token at `/quiz/submit`. Client answer order is untrusted; the controller indexes client answers by question id and iterates the token order.

### Attempt Token Security

`backend/src/utils/quizAttemptToken.js` signs payloads with:

- `purpose: "quiz_attempt"`
- `userId`
- `attemptId`
- `items: [{ qid, order }]`

Verification checks signature, purpose, user binding, non-empty attempt id, exact quiz length, valid ObjectIds, valid option permutations, and duplicate question ids. The controller maps invalid/expired/wrong-user tokens to clear 401 errors.

Replay protection is implemented twice: a controller pre-check via `Score.exists({ attemptId })`, and a partial unique index on `Score.attemptId` to close the race between pre-check and insert.

### Review Mode Persistence

`Score.answers[i].optionOrder` persists the option order shown during the attempt. Submit review and history detail responses use that stored order, so Review Mode can show the options exactly as the player saw them. Legacy local score documents without `optionOrder` fall back to `[0, 1, 2, 3]`.

### Mongoose Population

The previous literal spec risk is resolved. `getHistory` populates answer question topics, and `getAttemptDetail` populates full question review fields:

```text
answers.questionId -> topic
answers.questionId -> questionText options correctAnswer topic explanation
```

`getLeaderboard` still uses `$lookup`, which is fine because the rubric risk was lack of any population where appropriate, not a ban on aggregation.

### Frontend Smoke Tests

Four Vitest smoke files now cover:

- `QuizContext` reducer: start token storage, answer locking/submission, restart reset.
- `BulkImport` parser: object form, array form, invalid JSON, wrong option length.
- `ProtectedRoute`: no JWT, admin blocked from player route, player allowed.
- `ProtectedAdminRoute`: guest redirect, player redirect, admin outlet.

The deferred surface is `ActiveQuizNavigationGuard`; it remains a good post-submission hardening target, but extracting browser-history behavior from `App.jsx` during this pass was higher regression risk than the four added smoke tests.

---

## §5 — Residual Risks And Non-Blockers

| ID | Residual issue | Severity | Why not blocking |
|---|---|---:|---|
| R-01 | Reflection PDF content not deeply audited | Medium | Files exist; marks depend on individual content quality and marker reading. |
| R-02 | No automated E2E browser suite | Low | Manual checklist exists; frontend and backend tests now cover critical smoke surfaces. |
| R-03 | `ActiveQuizNavigationGuard` not unit-tested | Low-medium | Guard remains implemented; route guards and reducer/parser smoke tests cover higher-value stable surfaces. |
| R-04 | Live demo not executed in this audit pass | Medium | Cannot be replaced by static audit; run `npm run demo` before submission/demo. |
| R-05 | Build artifacts are generated locally but not part of the current diff | Info | `git status --short` did not show `frontend/dist`; no action needed unless the group intentionally wants to refresh built assets. |

No current backend/frontend code blocker was found.

---

## §6 — Test Footprint

### Backend

```text
backend/src/tests/admin.controller.test.js          183 lines
backend/src/tests/api.test.js                       537 lines
backend/src/tests/envelope.test.js                   23 lines
backend/src/tests/errorHandler.test.js               47 lines
backend/src/tests/forbidAdminQuiz.middleware.test.js 23 lines
backend/src/tests/validators.test.js                 29 lines
```

Backend total: 842 test lines / 28 tests.

### Frontend

```text
frontend/src/components/__tests__/BulkImport.test.jsx           39 lines
frontend/src/components/__tests__/ProtectedAdminRoute.test.jsx  62 lines
frontend/src/components/__tests__/ProtectedRoute.test.jsx       69 lines
frontend/src/contexts/__tests__/QuizContext.test.jsx            57 lines
```

Frontend total: 227 test lines / 13 tests.

---

## §7 — Submission File Check

Reflection deliverables currently present:

| File | Size |
|---|---:|
| `docs/individual-reflections/AllenJi-reflection.pdf` | 99,750 B |
| `docs/individual-reflections/RavenGe-reflection.pdf` | 204,778 B |
| `docs/individual-reflections/TomTian-reflection.pdf` | 152,940 B |
| `docs/individual-reflections/TracyCui-reflection.pdf` | 85,619 B |
| `docs/individual-reflections/TracyCui-reflection.md` | removed; PDF is the deliverable |

`git ls-files | rg '(^|/)node_modules/'` returned no tracked `node_modules` entries.

---

## §8 — API Artifact Check

Swagger and Postman now match the attempt-token flow:

- `/quiz/start` returns `{ attemptToken, questions }`.
- `/quiz/submit` requires `{ attemptToken, answers }`.
- Review responses document `optionOrder`.
- Postman saves `attemptToken` from the start response and reuses it in submit.

The Postman collection remains valid JSON after the update.

---

## §9 — Final Verdict

**PASS for submission readiness, subject to normal final commit/review discipline.**

Recommended final pre-submit actions:

1. Review the uncommitted diff once as a group because the quiz attempt contract changed.
2. Run `npm run demo` and manually verify player flow, history review, admin route blocking, Postman start/submit/replay, and Swagger UI.
3. Commit only after reviewing the uncommitted diff and confirming the expanded attempt-token contract is acceptable to the group.
