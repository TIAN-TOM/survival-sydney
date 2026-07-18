# Survival Sydney

> Could you survive real life in Sydney? A full-stack quiz that tests international students on the things nobody warns them about — with server-side exam-integrity controls so the score actually means something.

![CI](https://github.com/TIAN-TOM/openassess/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Tests](https://img.shields.io/badge/tests-72%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

Survival Sydney is a full-stack **TypeScript** quiz app for newcomers to Sydney — international students especially. Each run deals ten random questions on the stuff that actually trips people up: Opal cards and airport station access fees, rental bonds and tenancy rights, work-hour caps and minimum wage, beach flags, scam calls, and the rest. Miss a question and the review screen explains the answer, so every attempt doubles as a survival lesson.

Under the hood it takes scoring seriously: answers are locked on the server one question at a time, attempts are bound to a signed replay-protected token, and answer keys never reach the browser before submission — the leaderboard can't be gamed from DevTools. It runs with a single `docker compose up`.

**→ How the integrity model works: [ARCHITECTURE.md](ARCHITECTURE.md)**  ·  **Deploy your own: [DEPLOY.md](DEPLOY.md)**

<!-- Add once deployed: 🔗 **Live demo:** https://survival-sydney-web.onrender.com  (demo login: player1 / PlayerPass123) -->
<!-- Add a screenshot or short GIF of the quiz flow here — it is the single biggest "not a toy" signal. -->

> **Status:** pre-1.0 and actively evolving. Independently extended from an original group coursework project into a standalone app. License: **MIT**.

## Features

- **A question bank grounded in real Sydney life.** 57 questions across arrival, transport, housing, work rights, safety, money, culture, and wellbeing — every one with an explanation shown in review.
- **Accounts and roles.** Registration, login, logout, JWT-protected routes; separate player and admin roles.
- **Quiz flow.** Ten random active questions per attempt, options shuffled per question, one locked answer each.
- **Integrity by design.** Each answer is locked on the server one question at a time and can never be changed once set; the final submit scores only those server-locked answers. Attempts are bound to a signed `attemptToken` (user + question set + option order) and rejected if tampered, expired, replayed, or from another user. Scoring happens on the server.
- **Review mode.** After submitting, players review each question, their answer, the correct answer, and the explanation — the "learn from every miss" loop.
- **History and leaderboard.** Per-user attempt history and a top-50 best-score leaderboard, with survival ranks from *Just Landed* to *Local Legend*.
- **Admin console.** Create, edit, delete, activate/deactivate, and JSON bulk-import questions.
- **Light/dark theme**, accessible UI, and consistent `{ success, data }` / `{ success, error }` response envelopes.

## Tech stack

| Layer | Tools |
|---|---|
| Language | TypeScript (strict, front and back) |
| Frontend | React 18, Vite 6, React Router 6, React Hook Form + Zod |
| Backend | Node.js 20, Express 4, Mongoose 8 |
| Database | MongoDB |
| Auth | bcrypt, JWT (HS256) |
| Tooling | Swagger, Jest, Supertest, Vitest, Testing Library, ESLint, Docker, GitHub Actions |

## Quick start (local dev)

Prerequisites: **Node.js 20+**, npm, and MongoDB (local or Docker).

```bash
# 1. Install both packages
npm run install:all

# 2. Environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Set a strong JWT_SECRET in backend/.env — the app refuses to boot on a
# placeholder or a secret shorter than 32 characters:
openssl rand -hex 32

# 3. Start MongoDB (skip if you already run one)
docker run -d -p 27017:27017 --name survival-sydney-mongo mongo:7

# 4. Seed the question bank and demo accounts (also clears existing scores)
npm run seed --prefix backend

# 5. Run backend + frontend
npm run dev
```

- Player app: `http://localhost:5173`
- Admin login: `http://localhost:5173/admin/login`
- API docs (dev only): `http://localhost:5001/api-docs`

Seeded demo accounts: `admin` / `AdminPass123`, `player1` / `PlayerPass123`.

## Self-host with Docker

The bundled compose file brings up MongoDB, the API, and the nginx-served frontend (which proxies `/api` to the backend, so no CORS or hostname wiring is needed).

```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET (openssl rand -hex 32).
docker compose up -d --build

# Load the question bank once (optional)
docker compose run --rm seed
```

Then open `http://localhost:8080`. Terminate TLS at your own reverse proxy in front of the frontend container. See [SECURITY.md](SECURITY.md) for the hardening checklist.

## Adapting it to another city

The product name, copy, and rank tiers are centralised, so re-theming for another city (or another subject entirely) is a small edit:

- Frontend copy and rank bands: [`frontend/src/config/brand.ts`](frontend/src/config/brand.ts) (or set `VITE_APP_NAME` at build time).
- Backend / API title: set the `APP_NAME` environment variable, or edit [`backend/src/config/brand.ts`](backend/src/config/brand.ts).
- Question bank: replace [`backend/src/seeds/data/survival_sydney_questions.json`](backend/src/seeds/data/survival_sydney_questions.json) or bulk-import through the admin console.

## Project structure

```text
backend/src/
  config/       # env, db, auth, quiz, and brand config
  controllers/  # auth, quiz, admin
  middleware/   # auth, admin, rate limiters, error handler
  models/       # User, Question, Score
  routes/  docs/  seeds/  tests/  utils/  validators/
frontend/src/
  api/  components/  contexts/  pages/  config/  styles/
```

## API overview

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Quiz | `GET /api/quiz/start`, `POST /api/quiz/answer`, `POST /api/quiz/submit`, `GET /api/quiz/history`, `GET /api/quiz/history/:id`, `GET /api/quiz/leaderboard` |
| Admin | `GET/POST /api/admin/questions`, `PUT/DELETE /api/admin/questions/:id`, `PATCH /api/admin/questions/:id/toggle`, `POST /api/admin/questions/bulk-import` |

Admin accounts are blocked from player quiz routes (enforced server-side by `forbidAdminQuiz` and mirrored on the client). Full schema at `/api-docs` in development.

## Testing and linting

```bash
npm test               # backend (Jest) + frontend (Vitest)
npm run test:backend
npm run test:frontend
npm run lint --prefix backend
npm run lint --prefix frontend
npm run build --prefix frontend
```

CI (`.github/workflows/ci.yml`) runs lint, tests (with a MongoDB service container), and the frontend build on every push and pull request.

## Contributing & security

- Contributions: see [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
- Vulnerabilities: **do not** open a public issue — follow [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE). An AGPLv3 relicensing is planned; see [CONTRIBUTING.md](CONTRIBUTING.md) for details.
