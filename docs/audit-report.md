# Audit Report — A2 Group 5 MERN Quiz App

| Field | Value |
|---|---|
| Audit date | 2026-05-18 |
| Branch | `final-shuffled-answer-tests` |
| HEAD commit | `e7aac8e` *Merge pull request #26 from wege8390/docs/tracy-reflection* |
| Approved variation | Review Mode (per `README.md:9`, confirmed by `quiz.controller.js:122-137`) |
| Spec sources | `docs/assignment/A2_Specification.md` + `docs/assignment/A2_Ed_Discussion_Supplement.md` |
| Scope | Audit refreshed after README and packaging-documentation fixes. No runtime code/test edits, no commits. |
| Auditor | Internal submission readiness audit |

---

## §1 — Executive summary

**Backend tests pass (6 suites / 25 tests in 2.1 s). Frontend production
build succeeds (367 kB JS, 1.04 s). No functional blocker was found by
these checks.** The issues below are documentation,
deliverable-completeness, test-coverage, and literal spec-compliance risks.

### Items fixed in this refresh

| Original ID | Result | Evidence |
|---|---|---|
| H-01 | README admin routes now match server route definitions. | `README.md:200`, `backend/src/routes/admin.routes.js:37,55` |
| M-02 | README now includes a `Beyond the Specification — Bonus Features` section with What / Why / How-it-integrates entries. | `README.md:160-192` |
| M-05 | Tracy reflection files now use the checklist-friendly `TracyCui-reflection.*` naming. | `docs/individual-reflections/TracyCui-reflection.pdf`, `.tools/final-manual-test-checklist.md:144` |

### Top remaining actions

| Rank | ID | Action | Marks at stake | Effort |
|---:|---|---|---:|---:|
| 1 | **M-01** | Add at least one literal `.populate()` usage or document why `$lookup`/batch-fetch is used instead. | 1-3 possible (§1) | 15-45 min |
| 2 | **H-02** | Add frontend smoke tests for reducer, navigation guard, parser, and route guards. | 0-2 possible (§2) | 2-3 h |
| 3 | **M-03** | Add one README sentence explaining admins are intentionally blocked from player quiz/history/leaderboard routes. | marker-question defusal | 5 min |

### Projected total

Range, not a point estimate, because Reflection marks depend on PDF
contents the audit did not read in depth and on individual marker
strictness on the populate-vs-aggregation clause.

| Scenario | Projected /100 | Bonus | Confidence |
|---|---:|---:|---|
| Current state after README + filename fixes | **88-96** | +2 to +5 | Medium |
| Populate/front-end-test/admin-note follow-ups also fixed | **92-98** | +3 to +5 | Medium |

### Top 3 strengths

- Deterministic option shuffle keyed by question `_id` (`utils/shuffleQuestion.js:9-57`) — stateless server-side validation; elegant and bug-resistant.
- Self-hosted Swagger UI **and** Postman collection (`backend/src/docs/swagger.js`, `docs/postman-collection.json:253 lines`) — exceeds Spec §10 "OR" requirement.
- Active-quiz navigation guard (`frontend/src/App.jsx:28-115` + `QuizContext.jsx:88-162`) — prevents cheat-by-refresh and accidental data loss without breaking back-button UX.

---

## §2 — Methodology

All commands run from `/Users/tomtianys/Desktop/COMP4347-COMP5347-Assignment-2--Group5` on 2026-05-18.

```text
$ npm test --prefix backend -- --runInBand
PASS src/tests/api.test.js
PASS src/tests/admin.controller.test.js
PASS src/tests/validators.test.js
PASS src/tests/errorHandler.test.js
PASS src/tests/forbidAdminQuiz.middleware.test.js
PASS src/tests/envelope.test.js
Test Suites: 6 passed, 6 total
Tests:       25 passed, 25 total
Time:        2.063 s

$ npm run build --prefix frontend
vite v6.4.2 building for production...
✓ 137 modules transformed.
dist/index.html                   1.18 kB │ gzip:   0.55 kB
dist/assets/index-BuCV_qF3.css  252.78 kB │ gzip:  42.77 kB
dist/assets/index-CTgZkYol.js   367.37 kB │ gzip: 112.62 kB
✓ built in 1.04s

$ rg -n "\.populate\(" backend/src/controllers
(no matches)

$ rg -n "\$lookup" backend/src/controllers
backend/src/controllers/quiz.controller.js:300:        $lookup: {

$ find frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) | wc -l
36
$ find frontend/src -type f \( -name "*.test.*" -o -name "*.spec.*" \) | wc -l
0

$ wc -l backend/src/tests/*.js
708 total

$ ls docs/individual-reflections/
AllenJi-reflection.pdf   (99 750 bytes)
RavenGe-reflection.pdf   (204 778 bytes)
TomTian-reflection.pdf   (152 940 bytes)
TracyCui-reflection.pdf  (403 276 bytes)
TracyCui-reflection.md   (11 897 bytes)
```

### Not audited (intentional, listed for honesty)

- **PDF content quality** for the four present reflection PDFs. File existence and size confirmed; rubric §6 partly depends on contents (commit hashes, Mermaid diagrams, ≥12 commits, variation reflection) which were not deeply inspected. Tracy's companion markdown was skimmed enough to identify it as Tracy Cui's reflection.
- **Live demo** — Spec §13/§14. Out of scope (cannot perform).
- **GitHub Organization / tutor access** — Ed #157, #175. Cannot verify from local checkout.
- **Group coversheet signatures** — the coversheet PDF now exists, but signatures/content were not inspected.
- **Individual commit counts ≥12 per student** — Spec A.10 row 3. Tracy's reflection markdown lists 15 commits (`TracyCui-reflection.md:90-110`); deeper `git log --author=` checks for every member were not performed because the audit is documentation-focused.

---

## §3 — Rubric scoring matrix

One row per Rubric §16 line item after the README route, bonus-section, and Tracy filename fixes.

| # | Criterion | Cap | Status | Projected | Driver / evidence |
|---:|---|---:|---|---:|---|
| 1 | Backend Architecture & APIs | 25 | Partial | 22-24 | M-01 populate gap; otherwise clean. `backend/src/routes/*.js`, `backend/src/controllers/*.js`, `backend/src/utils/responseEnvelope.js:1-37`. |
| 2 | Frontend UI & UX | 25 | Implemented | 22-25 | RHF+Zod (`Register.jsx:9-26`, `LoginFormPanel.jsx:8-11`, `QuestionForm.jsx:6-16`, `BulkImport.jsx:7-20`); Context+useReducer (`QuizContext.jsx:21-84`); dark mode (`ThemeContext.jsx:1-72`). H-02 reduces ceiling. |
| 3 | Quiz Logic & Mechanics | 10 | Implemented | 10 | 10-Q fixed (`quiz.controller.js:14`); 4 options (`Question.js:9-15`); answer-locked (`QuizContext.jsx:30-31`); +1/correct (`quiz.controller.js:104-106`); Review Mode (`quiz.controller.js:122-137`); shuffled per attempt (`utils/shuffleQuestion.js:32-57`). |
| 4 | Admin Interface & Access Control | 10 | Implemented | 9-10 | CRUD + toggle + bulk (`admin.routes.js:25-55`); backend `adminMiddleware` (`admin.routes.js:18-19`) + frontend `ProtectedAdminRoute` (`ProtectedAdminRoute.jsx:8-46`). |
| 5 | Security & Validation | 10 | Implemented | 9-10 | helmet/cors/mongoSanitize (`app.js:17-20`); bcrypt (`User.js:35-42`); JWT 2 h (`auth.controller.js:6-11`); rate-limit login/register/submit (`rateLimiters.js:10-33`); Zod auth schemas (`validators/auth.validators.js`); custom admin schema (`admin.controller.js:4-47`). |
| 6 | Individual Reflections | 15 | Present | 10-15 | Four reflection PDFs now exist under member-readable filenames, including `TracyCui-reflection.pdf`. Content quality was not fully audited. |
| 7 | Documentation & Process | 5 | Implemented | 4-5 | README includes setup, architecture diagram, variation, team table, commit links, dual API docs, corrected route table, and bonus section. |
| Bonus | UI/UX + features + error handling | +5 | Documented | +2 to +5 | README now documents Active-Quiz Guard, Swagger+Postman, theme transitions, `/bosscoming`, and accessibility/error-feedback polish per Ed #143. |
| **Totals** | | **100 (+5)** | | **88-96 (+2/+5)** | |

---

## §4 — Findings detail

Only unresolved High / Medium findings are written up. Issues fixed during this refresh are listed in §1.

### H-02 — Frontend zero test coverage  (High)

- **Evidence**:
  - `find frontend/src -type f \( -name "*.js" -o -name "*.jsx" \) | wc -l` → **36**.
  - `find frontend/src -type f \( -name "*.test.*" -o -name "*.spec.*" \) | wc -l` → **0**.
  - `frontend/package.json` has no `test` script and no Jest/Vitest/RTL/Playwright dev-dependency.
- **Untested critical logic**:
  - `frontend/src/contexts/QuizContext.jsx:21-84` — `quizReducer` (7 action types, scoring/phase state machine).
  - `frontend/src/App.jsx:28-115` — `ActiveQuizNavigationGuard` (popstate, beforeunload, click interception).
  - `frontend/src/components/BulkImport.jsx:35-71` — `parseImportPayload` (JSON parser, Zod validation, error path).
  - `frontend/src/components/ProtectedRoute.jsx:11-26` + `ProtectedAdminRoute.jsx:8-46` — RBAC redirects.
- **Caveat**: Spec does **not** mandate frontend tests. Rubric §2 wording is *"intuitive flow matching approved variation"*. A strict marker reading "robustness and correctness" (Spec §1 Overview) may still dock.
- **Rec ID**: R-03 (post-submission improvement; not actionable now given user's "audit-only" scope).

### M-01 — No `Mongoose.populate()` anywhere in controllers  (Medium — literal spec-compliance risk)

- **Evidence**:
  - `rg -n "\.populate\(" backend/src/controllers` → 0 matches.
  - `rg -n "\$lookup" backend/src/controllers` → 1 match: `quiz.controller.js:300` (leaderboard `$lookup`).
  - Manual batch-fetch instead of populate at `quiz.controller.js:84-94` (submit), `:171-176` (history topics), `:229-235` (review).
- **Spec anchor**: `A2_Specification.md` §9.1: *"Use **Mongoose population** where appropriate."*
- **Engineering nuance**: aggregation `$lookup` and explicit batch-fetch are functionally **equivalent** (often faster). This is a **literal spec-compliance risk**, NOT a functional bug. A lenient marker will accept it; a strict marker may dock 1-3 marks on Rubric §1.
- **Rec ID**: R-04. Effort: ~15 min to replace at least one join (e.g. `Score.find().populate('userId', 'username')` in leaderboard) and document the choice.

### M-03 — Admin is blocked from `/quiz/leaderboard` and `/quiz/history`  (Medium — UX choice undocumented)

- **Evidence**: `backend/src/routes/quiz.routes.js:33, :39, :45` all chain `forbidAdminQuiz` middleware (`forbidAdminQuiz.middleware.js:4-8` returns 403 for admins).
- **Spec gap**: Spec §7 mandates *"registered users"* see the leaderboard; silent on whether admins should. The current design (admins manage content only, don't compete) is defensible per Ed #146 Admin sub-system definition (*"not gameplay"*) but markers may ask.
- **Risk**: Likely a marker question, not a deduction, if README documents the choice.
- **Rec ID**: R-06. Effort: 1 README sentence.

### M-04 — Backend untested edge paths exist  (Medium)

Detailed list in §5 below. Same risk character as H-02 but lower-impact because backend has 25 passing tests covering happy paths, leaderboard cap/tie behaviour, and several validation failures.

---

## §5 — Test-gap matrix

Each row = an untested code path. Severity is the *coverage* risk; passing tests still demonstrate the path executes, but absence of an assertion means a future regression will slip through.

### Backend (existing 25 tests cover happy paths, leaderboard cap/tie behaviour, and several validation failures)

| ID | Untested path | Evidence | Severity |
|---|---|---|---:|
| T-B-01 | Question deleted between `/quiz/start` and `/quiz/submit` → `quiz.controller.js:87-89` returns `"Some question IDs are invalid"` | `quiz.controller.js:87-89` | High |
| T-B-02 | `/quiz/submit` with `answers.length !== 10` → 400 `"Must submit exactly 10 answers"` | `quiz.controller.js:53-55` | Medium |
| T-B-03 | `/quiz/submit` missing `questionId` / non-ObjectId / non-integer index → 400 | `quiz.controller.js:65-80` | Medium |
| T-B-04 | `/quiz/history/:id` with another user's `scoreId` → 404 (ownership check) | `quiz.controller.js:220-223` | High |
| T-B-05 | `/quiz/history/:id` with malformed ObjectId → 400 | `quiz.controller.js:216-218` | Low |
| T-B-06 | Review path when one question in the saved attempt was deleted later → `"[Question deleted]"` graceful degrade | `quiz.controller.js:240-251` | Medium |
| T-B-07 | Expired JWT branch → `auth.middleware.js:18` `"Token expired"` | `auth.middleware.js:14-20` | High |
| T-B-08 | `PUT /api/admin/questions/:id` with non-existent id → 404 | `admin.controller.js:118-120` | Low |
| T-B-09 | `DELETE /api/admin/questions/:id` non-existent id → 404 | `admin.controller.js:136-138` | Low |
| T-B-10 | `PATCH /api/admin/questions/:id/toggle` non-existent id → 404 | `admin.controller.js:153-156` | Low |
| T-B-11 | `/quiz/history` empty list (new user) | `quiz.controller.js:158-208` | Info |
| T-B-12 | `/quiz/leaderboard` empty | `quiz.controller.js:288-316` | Info |
| T-B-13 | Rate-limit 429 envelope is correct (test mode hardcodes limit=1000 so production path is uncovered) | `rateLimiters.js:6-8, :12` | Medium |

Existing test files (cover happy paths + a few negatives):
`backend/src/tests/api.test.js` (403 lines, full quiz lifecycle + leaderboard cap/tie tests), `admin.controller.test.js` (183 lines, CRUD + bulk), `validators.test.js` (29), `envelope.test.js` (23), `errorHandler.test.js` (47), `forbidAdminQuiz.middleware.test.js` (23) — total 708 lines / 25 tests.

### Frontend (0 tests, 36 source files)

| ID | Untested critical surface | Evidence | Severity |
|---|---|---|---:|
| T-F-01 | `quizReducer` state transitions (7 actions) | `frontend/src/contexts/QuizContext.jsx:21-84` | High |
| T-F-02 | `ActiveQuizNavigationGuard` confirm-leave logic for popstate / link clicks / refresh | `frontend/src/App.jsx:28-115` | High |
| T-F-03 | `parseImportPayload` JSON validation paths | `frontend/src/components/BulkImport.jsx:35-71` | Medium |
| T-F-04 | `ProtectedRoute` + `ProtectedAdminRoute` redirect logic | `frontend/src/components/ProtectedRoute.jsx`, `ProtectedAdminRoute.jsx` | Medium |

### E2E coverage

| ID | Surface | Evidence | Severity |
|---|---|---|---:|
| T-E-01 | No automated end-to-end test framework configured (no Playwright/Cypress in any `package.json`). Manual checklist exists at `.tools/final-manual-test-checklist.md` (160 lines), but it is human-run, not CI. | `.tools/final-manual-test-checklist.md` | Info |

### Security cross-cut (audit not pen-test)

| ID | Threat | Mitigation present | Evidence | Gap |
|---|---|---|---|---|
| T-S-01 | NoSQL operator injection (`$where`, `$ne`, …) | mongoSanitize strips `$`/`.` from input keys | `app.js:6, :20` | None observed |
| T-S-02 | XSS via `questionText` rendered in review | React JSX escapes by default; no `dangerouslySetInnerHTML` anywhere in `frontend/src/` | `rg dangerouslySetInnerHTML frontend/src` ⇒ 0 hits | None observed |
| T-S-03 | Password brute force | bcrypt rounds 10 (configurable), login limiter 5/min (`rateLimiters.js:10-15`) | `User.js:35-42`, `rateLimiters.js:10` | None observed |
| T-S-04 | JWT secret leak | Loaded from env via `getJwtSecret()`; `.env.example` ships placeholder | `auth.controller.js:3, :9`, `backend/.env.example` | OK |
| T-S-05 | JWT revocation on logout | Not implemented (no server-side blocklist); token expiry 2 h | `auth.controller.js:10` | Acceptable for assignment; document |
| T-S-06 | RBAC bypass via direct URL | Backend `adminMiddleware` 403, frontend `ProtectedAdminRoute` redirect, frontend `ProtectedRoute` `blockAdmin` for player areas | `admin.routes.js:18-19`, `ProtectedAdminRoute.jsx:8-46`, `ProtectedRoute.jsx:12-26` | None |
| T-S-07 | CORS over-permissive | Single allowed origin via env, default `localhost:5173` | `app.js:18` | OK |
| T-S-08 | Helmet headers | `app.use(helmet())` | `app.js:17` | OK |
| T-S-09 | JSON body bomb | `express.json({ limit: '1mb' })` | `app.js:19` | OK |

No security blocker found.

---

## §6 — Strengths now cited in README

These now map to the README bonus section added during this refresh and support the +5 bonus pillars (UI/UX polish, thoughtful features, strong error handling).

- **Deterministic option shuffle** keyed by question `_id` — stateless server-side validation, eliminates session storage (`utils/shuffleQuestion.js:9-57`).
- **Active-quiz navigation guard** — popstate + beforeunload + click interception, prevents accidental data loss and gating-by-refresh attacks (`App.jsx:28-115`, `QuizContext.jsx:88-162`).
- **Dual API docs** — self-hosted Swagger UI at `/api-docs` plus Postman collection (`backend/src/docs/swagger.js`, `docs/postman-collection.json` 253 lines). Spec §10 only required one.
- **Theme switching with `document.startViewTransition`** when supported, with graceful fallback (`ThemeContext.jsx:34-49`).
- **Test-mode rate-limit override** — limits drop to high in `NODE_ENV=test` so the full integration suite runs without 429 flakes (`rateLimiters.js:12, :21, :28`).
- **Consistent response envelope** with optional `meta`, `code`, `details` fields (`utils/responseEnvelope.js:1-37`) — used everywhere; covered by `tests/envelope.test.js` + `tests/errorHandler.test.js`.
- **103 `aria-*` attribute occurrences** across `frontend/src/**` — non-trivial accessibility investment.

### Low / Info one-liners

- L-01 `Question.options` model validator enforces `length === 4` but admin controller does the non-empty check (`Question.js:9-15` vs `admin.controller.js:17-22`). Defense in depth, minor invariant placement.
- L-02 `Score.answers` has a `length >= 1` validator (`Score.js:41-46`) but no upper bound (could persist > 10 answers if controller validation were ever bypassed). Belt-and-suspenders missing.

---

## §7 — Remediation backlog

Sorted by (Risk ↓, Marks-at-stake ↓, Effort ↑). Rows below are remaining follow-up actions after the README route, README bonus, and Tracy filename fixes.

| ID | Action | Risk | Marks at stake | Effort | Owner |
|---|---|---|---:|---:|---|
| R-04 | **Replace one `$lookup` or one batch-fetch with `.populate()`** to satisfy Spec §9.1 literal wording (e.g. `Score.find({userId:req.user.id}).populate({path:'answers.questionId', select:'topic'})` in `getHistory`) | Medium | 1-3 (§1) | 30-45 min | Backend (Raven) |
| R-06 | **Add a one-line README note** under "Architecture Summary" or "Main API Routes" explaining the admin-cannot-see-leaderboard UX choice ("Admins manage questions only; player-only endpoints return 403 for admins, see Ed #146 sub-system definition") | Medium | 0-1 (§4 marker Q) | 5 min | Doc owner |
| R-03 | **Add Vitest + 4 frontend smoke tests** for `quizReducer`, `ActiveQuizNavigationGuard`, `parseImportPayload`, `ProtectedRoute`. **Post-submission improvement only** given the current "audit-only" scope. | High | 0-2 (§2) | 2-3 h | Frontend |
| R-07 | **Add backend negative-path tests** for T-B-01 (deleted question between start/submit), T-B-04 (cross-user attempt access), T-B-07 (expired JWT). Same caveat as R-03. | Medium | 0-1 (§5) | 1-2 h | Backend |

> Lines marked "post-submission improvement" are intentionally listed because the user asked for a full risk picture, but they are **not** prerequisites for the deadline.

### Completed during this refresh

- R-01: Tracy reflection renamed to `docs/individual-reflections/TracyCui-reflection.pdf`.
- R-02: README admin route table now uses `PUT /api/admin/questions/:id` and `POST /api/admin/questions/bulk-import`.
- R-05: README now includes the Ed #143 What / Why / How-it-integrates bonus section.

---

## §8 — Appendix

### A. Route inventory (from running source)

```
backend/src/routes/auth.routes.js
  POST   /api/auth/register     [registerLimiter, validate(registerSchema)]
  POST   /api/auth/login        [loginLimiter, validate(loginSchema)]
  GET    /api/auth/me           [auth]

backend/src/routes/quiz.routes.js
  GET    /api/quiz/start            [auth, forbidAdminQuiz]
  POST   /api/quiz/submit           [auth, forbidAdminQuiz, quizSubmitLimiter]
  GET    /api/quiz/history          [auth, forbidAdminQuiz]
  GET    /api/quiz/history/:id      [auth, forbidAdminQuiz]
  GET    /api/quiz/leaderboard      [auth, forbidAdminQuiz]

backend/src/routes/admin.routes.js
  (all: [auth, adminMiddleware])
  GET    /api/admin/questions
  POST   /api/admin/questions
  PUT    /api/admin/questions/:id
  DELETE /api/admin/questions/:id
  PATCH  /api/admin/questions/:id/toggle
  POST   /api/admin/questions/bulk-import

backend/src/app.js
  GET    /              — service metadata envelope
  GET    /api/health    — health probe
  GET    /api-docs/*    — Swagger UI
  (404 fallback)
```

### B. File-size and test footprint

| Area | Files | Lines |
|---|---:|---:|
| Backend source (excluding tests/seeds/data) | (multi) | **1 961** |
| Backend tests | 6 | **708** (36 % ratio) |
| Frontend source (`.js`/`.jsx`) | **36** | **3 598** |
| Frontend tests | **0** | 0 |
| Postman collection | 1 | 253 |
| Swagger spec definition | 1 | 512 |
| README | 1 | 262 |
| Spec + Supplement | 2 | 462 + 611 |

### C. Reflection PDF check

| Expected file | Present? | Size |
|---|---|---:|
| `docs/individual-reflections/TracyCui-reflection.pdf` | yes | 403 276 B |
| `docs/individual-reflections/TracyCui-reflection.md` | yes — editable source for Tracy reflection | 11 897 B |
| `docs/individual-reflections/RavenGe-reflection.pdf` | yes | 204 778 B |
| `docs/individual-reflections/AllenJi-reflection.pdf` | yes | 99 750 B |
| `docs/individual-reflections/TomTian-reflection.pdf` | yes | 152 940 B |

### D. Risk taxonomy used

| Level | Definition |
|---|---|
| **Blocker** | ≥ 3 marks at stake OR submission-incomplete |
| **High** | Visible to strict marker; required behaviour/evidence missing |
| **Medium** | 0.5–1 mark deduction OR likely marker question |
| **Low** | Polish, under-documented strength |
| **Info** | Observation, neither plus nor minus |

---

*End of audit. Report refreshed 2026-05-18 against commit `e7aac8e`. Findings
above use concrete command output or `path:line` anchors; unsupported claims
were omitted rather than guessed.*
