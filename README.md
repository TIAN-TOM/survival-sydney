# OpenAssess

> Open-source, self-hostable quiz and assessment platform with built-in exam-integrity controls.

OpenAssess is a MERN application for running quizzes and knowledge checks where the **result has to be trustworthy**. Scoring is server-side, each attempt is bound to a signed, replay-protected token, and answer keys never reach the browser before submission. It ships as a self-hostable app you can run with a single `docker compose up`.

> **Status:** early, pre-1.0, and evolving from a coursework project into a product. License is currently **MIT**; an **AGPLv3** relicensing is planned (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Features

- **Accounts and roles.** Registration, login, logout, JWT-protected routes; separate player and admin roles.
- **Quiz flow.** Ten random active questions per attempt, options shuffled per question, one locked answer each.
- **Integrity by design.** Submitting requires the signed `attemptToken` issued at start — bound to the user, the exact question set, and the option order, and rejected if tampered, expired, replayed, or from another user. Scoring happens on the server.
- **Review mode.** After submitting, players review each question, their answer, the correct answer, and any explanation.
- **History and leaderboard.** Per-user attempt history and a top-50 best-score leaderboard.
- **Admin console.** Create, edit, delete, activate/deactivate, and JSON bulk-import questions.
- **Light/dark theme**, accessible UI, and consistent `{ success, data }` / `{ success, error }` response envelopes.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite 6, React Router 6, React Hook Form + Zod |
| Backend | Node.js 20, Express 4, Mongoose 8 |
| Database | MongoDB |
| Auth | bcrypt, JWT (HS256) |
| Docs / tests | Swagger, Jest, Supertest, Vitest, Testing Library, ESLint |

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
docker run -d -p 27017:27017 --name openassess-mongo mongo:7

# 4. Seed demo questions (also clears existing scores)
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

# Load demo questions once (optional)
docker compose run --rm seed
```

Then open `http://localhost:8080`. Terminate TLS at your own reverse proxy in front of the frontend container. See [SECURITY.md](SECURITY.md) for the hardening checklist.

## White-labelling

The product name and user-facing copy are centralised, so making it yours is a small edit:

- Frontend: [`frontend/src/config/brand.js`](frontend/src/config/brand.js) (or set `VITE_APP_NAME` at build time).
- Backend / API title: set the `APP_NAME` environment variable, or edit [`backend/src/config/brand.js`](backend/src/config/brand.js).

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
| Quiz | `GET /api/quiz/start`, `POST /api/quiz/submit`, `GET /api/quiz/history`, `GET /api/quiz/history/:id`, `GET /api/quiz/leaderboard` |
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
