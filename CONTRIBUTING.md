# Contributing

Thanks for your interest in contributing. This guide covers local setup, the checks we run, and how to propose changes.

## License

**Current license: MIT. AGPLv3 relicensing is planned** (pending contributor IP consent). By contributing you agree that your contributions are provided under the repository's current MIT license and may be relicensed under AGPLv3 as part of the planned transition. If you have concerns about the relicensing, raise them in your pull request or an issue before contributing.

## Prerequisites

- **Node.js 20+** (see `.nvmrc`; run `nvm use`).
- **MongoDB** running locally, or use the Docker Compose setup.
- npm (bundled with Node).

## Project layout

Two packages orchestrated by a root `package.json`:

- `backend/` - Express 4 + Mongoose 8 API (plain JS). Entry point `src/server.js`, port 5001.
- `frontend/` - React 18 + Vite 6 SPA (plain JS). Builds to `dist/`.

Each package has its own `package.json` and `package-lock.json`.

## Local setup

```bash
# Install both packages
npm run install:all

# Configure the backend
cp backend/.env.example backend/.env
# Edit backend/.env and set a strong JWT_SECRET:
#   openssl rand -hex 32
# The backend refuses to start on a weak or placeholder secret.

# Configure the frontend (optional; defaults to http://localhost:5001/api)
cp frontend/.env.example frontend/.env

# Seed demo questions (requires a running MongoDB)
npm run seed --prefix backend

# Run backend + frontend together
npm run dev
```

Backend dev server: http://localhost:5001  |  Frontend dev server: http://localhost:5173

Prefer containers? See the self-host section in the README and run `docker compose up -d --build`.

## Running checks locally

Run the same checks CI runs before opening a pull request:

```bash
# Lint
npm run lint --prefix backend
npm run lint --prefix frontend

# Tests
npm test            # runs both backend and frontend
# or individually:
npm run test:backend
npm run test:frontend

# Frontend production build
npm run build --prefix frontend
```

Backend tests use Jest + Supertest and require a reachable MongoDB. Frontend tests use Vitest + Testing Library.

## CI expectations

Every pull request runs `.github/workflows/ci.yml`, which must pass:

- **Backend job** (Node 20, MongoDB 7 service): `npm ci` -> `npm run lint` -> `npm test` (in `backend/`).
- **Frontend job** (Node 20): `npm ci` -> `npm run lint` -> `npm test` -> `npm run build` (in `frontend/`).

Please ensure lint, tests, and the frontend build all pass locally first.

## Pull request guidelines

- Keep changes focused; avoid unrelated refactors in the same PR.
- Follow the existing code style (ESLint is the source of truth).
- Add or update tests for behaviour changes.
- Do not weaken the security controls described in `SECURITY.md` without an explicit discussion.
- Never commit secrets. `.env` files are gitignored; only `.env.example` is tracked.
- Use clear commit messages (Conventional Commits are welcome).

## Reporting security issues

Do not open public issues for vulnerabilities. Follow the private process in `SECURITY.md`.

## Code of Conduct

This project follows the Contributor Covenant. See `CODE_OF_CONDUCT.md`.
