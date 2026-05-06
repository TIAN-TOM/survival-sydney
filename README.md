# COMP5347/4347 Assignment 2 Quiz Game

MERN single-player quiz game for COMP5347/4347 Assignment 2.

## Setup

TODO (Tom): document local setup steps.

- Backend env: copy `.env.example` to `.env` and use a local MongoDB URI.
- Local MongoDB example: `docker run -d -p 27017:27017 --name mongo mongo:7`
- Backend: `npm --prefix backend install`
- Frontend: `npm --prefix frontend install`

## System Overview

TODO (Tom): add architecture overview and Mermaid diagram.

## Approved Variation

TODO (Raven): describe and justify Review Mode after completion.

## Subsystems

### Auth & Security

Username + password authentication with JWT-based session tokens. User and admin roles are enforced via middleware on protected routes.

**Endpoints**

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | rate-limited 5/hour |
| POST | `/api/auth/login` | — | rate-limited 5/15min |
| GET  | `/api/auth/me` | Bearer | returns current user |

**How it works**

- Passwords are hashed with bcrypt (10 rounds in dev/prod, 4 rounds in tests for speed). Plain passwords are never persisted.
- JWT payload is `{ userId, role }`, signed with `JWT_SECRET`, expires after `JWT_EXPIRES_IN` (default `2h`).
- `auth.middleware.js` parses `Authorization: Bearer <token>`, verifies the signature, and attaches `req.user`.
- `admin.middleware.js` runs after `auth` and rejects non-admin requests with 403.

**Validation**

- Username trimmed, lowercased, 3–30 chars, unique (Mongoose schema).
- Password required, min 6 chars (controller-side guard, mirrored client-side with zod).
- All API responses use the shared envelope `{ success, data?, error? }`.

**Rate limiting** (`middleware/rateLimit.js`)

- Login: 5 attempts / 15 min per IP — slows brute force.
- Register: 5 accounts / hour per IP — discourages spam signups.
- Both skip when `NODE_ENV=test` so the suite can run repeatedly.

**Frontend**

- `AuthContext.jsx` keeps `user` in state and exposes `login` / `register` / `logout`. On mount it calls `/me` to restore the session if a JWT is in `localStorage`.
- `Login.jsx` and `Register.jsx` use react-hook-form + zod for client-side validation; the server still validates everything independently.

**Tests** (`backend/tests/auth.controller.test.js`)

Six supertest cases covering: register success, register duplicate, login success, login wrong password, `/me` with valid token, `/me` without token. Uses `mongodb-memory-server` so the suite has no external dependency.

### Quiz Logic & Review Mode

TODO (Raven): describe quiz start, submit, scoring, saved answers, history, review mode, and leaderboard backend.

### Admin Question Management

TODO (Allen): describe question CRUD, active toggle, and bulk import validation.

### Integration, Validation & Robustness

TODO (Tom): describe response envelope, error handling, shared frontend API client, dark mode shell, API docs, and integration testing.

## Team Roles & Key Commits

TODO (All): add each member's role and representative commit hashes.

## API Documentation

TODO (Tom + endpoint owners): document Swagger/OpenAPI or Postman collection location.

## Git Workflow

TODO (Tom): document branch workflow and how markers can inspect full contribution history.

## Beyond the Specification — Bonus Features

Each bonus candidate must use:

- **What:**
- **Why:**
- **How it integrates:**
