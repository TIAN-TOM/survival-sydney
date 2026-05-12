# COMP5347 Assignment 2 - MERN Quiz Platform

[English](README.md) | [中文](README.zh-CN.md)

A full-stack single-player quiz application built for COMP5347 Assignment 2. The player experience is themed around a Sydney Life Survival Quiz for international students, with registration/login, a dynamic 10-question quiz flow, Review Mode after completion, leaderboard/history pages, and an admin interface for managing the question bank.

## 🧭 At a Glance

| Item | Value |
|---|---|
| Approved variation | Review Mode after completion |
| Quiz length | Fixed 10 questions |
| One-command demo | `npm run demo` |
| Admin demo account | `admin` / `AdminPass123` |
| Player demo accounts | `player1` / `PlayerPass123`, `player2` / `PlayerPass123` |
| Seeded question bank | 50 Sydney life questions across 5 categories and 3 difficulty levels |
| Frontend visual theme | Sydney University ochre/orange-red and charcoal styling with Sydney-life landing copy |
| API docs | `http://localhost:5001/api-docs` |

## 🧩 Features

- Local username/password authentication with bcrypt and JWT.
- Role-based access control for player and admin workflows.
- Dynamic quiz attempts generated from active questions.
- Sydney life question bank with topic and difficulty fields.
- Balanced quiz sampling that targets foundation/application/analysis coverage and limits topic repetition.
- Fixed 10-question attempts for comparable leaderboard scores.
- Product-style Sydney Life Quiz landing page aligned to the seeded question-bank theme and a USYD-inspired ochre/orange-red and charcoal colour system.
- One answer per question, locked after selection.
- Review Mode with a score ring, selected answers, correctness, correct answers, explanations, and collapsible answer detail panels.
- Durable review snapshots so completed attempts remain reviewable after question edits/deletes.
- Admin CRUD, active/inactive toggle, and JSON bulk import with validation.
- Persistent dark mode across player and admin interfaces.
- Swagger API docs and Postman collection.
- Backend Supertest/Jest coverage for core API flows.

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Context + useReducer |
| Forms | React Hook Form, Zod |
| Backend | Node.js, Express |
| Database | Local MongoDB, Mongoose |
| Auth | bcrypt, JSON Web Token |
| API docs | Swagger/OpenAPI, Postman |
| Testing | Jest, Supertest |

## 👥 Team Roles

| Member | Role | Primary subsystem |
|---|---|---|
| Tracy Cui | A | Authentication, JWT, role checks, login/register UI |
| Raven Ge | B | Quiz flow, scoring, Review Mode, history, leaderboard data |
| Allen Ji | C | Admin question CRUD, active toggle, bulk import |
| Tom Tian | D | Integration, response envelope, error handling, theme, docs, tests |

Representative subsystem ownership is also marked in the main backend/frontend entry files.

## 🔀 Git Workflow and Marker Evidence

The repository is hosted on Sydney University GitHub Enterprise:

```text
https://github.sydney.edu.au/wege8390/COMP4347-COMP5347-Assignment-2--Group5
```

The final integration branch is `dev`, and final release should be merged to `main` after the group has reviewed and verified the complete implementation. To inspect contribution history locally:

```bash
git log --all --graph --oneline --decorate
git shortlog -sne --all
```

Each student's individual reflection should cite their own selected commit evidence and explain the subsystem decisions they personally owned.

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or later
- npm
- Docker, for local MongoDB

### One-Command Demo

```bash
npm run demo
```

This command prepares local `.env` files when they are missing, installs missing dependencies, starts a Docker MongoDB container when no local MongoDB is reachable, seeds demo questions and demo users, and then starts the backend and frontend together.

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Swagger UI: `http://localhost:5001/api-docs`
- Admin login: `admin` / `AdminPass123`
- Player logins: `player1` / `PlayerPass123`, `player2` / ``PlayerPass123

To stop only the demo MongoDB container created by the helper:

```bash
npm run demo:stop
```

### Manual Setup

#### 1. Start Local MongoDB

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

The backend defaults to:

```bash
MONGODB_URI=mongodb://localhost:27017/comp5347_quiz
```

#### 2. Install Dependencies

```bash
npm install
npm run install:all
```

#### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend environment:

```bash
JWT_SECRET=replace-with-a-long-local-secret
JWT_EXPIRES_IN=2h
MONGODB_URI=mongodb://localhost:27017/comp5347_quiz
CLIENT_ORIGIN=http://localhost:5173
```

Frontend environment:

```bash
VITE_API_BASE_URL=http://localhost:5001/api
```

The backend refuses to start without `JWT_SECRET` outside the Jest test environment.

#### 4. Seed Demo Data

```bash
npm run seed --prefix backend
```

Seeded admin account:

```text
username: admin
password: AdminPass123
```

Seeded player accounts:

```text
username: player1
password: PlayerPass123

username: player2
password: PlayerPass123
```

The seed creates **50** active questions from `backend/src/seeds/data/wizard_sydney_questions.json` (Sydney-student “wizard” theme: transport, renting, culture, scams, safety, food, survival, etc.), giving the fixed 10-question quiz enough surplus inventory for varied attempts. The older `sydney_life_survival_quiz_50_questions.json` file remains in the repo for reference but is **not** loaded by `seed.js` anymore.

#### 5. Run the App

```bash
npm run dev
```

- Backend: `http://localhost:5001`
- Frontend: `http://localhost:5173`
- Swagger UI: `http://localhost:5001/api-docs`

## 🗂️ Project Structure

```text
.
├── backend/                 # Express API, Mongoose models, tests, Swagger
├── frontend/                # React/Vite application
├── docs/                    # Architecture, Postman, manual checks, readiness notes
├── package.json             # Root helper scripts
└── README.md
```

## 🏗️ Architecture

```mermaid
flowchart LR
  User["Player/Admin Browser"] --> React["React Frontend"]
  React --> ApiClient["Axios API Client"]
  ApiClient --> Express["Express API"]
  Express --> Auth["JWT + Role Middleware"]
  Express --> Quiz["Quiz/Score Controllers"]
  Express --> Admin["Admin Question Controllers"]
  Quiz --> Mongo[("Local MongoDB")]
  Admin --> Mongo
  Auth --> Mongo
```

The backend returns consistent response envelopes from `backend/src/utils/responseEnvelope.js`. The frontend uses `frontend/src/api/api.js` for quiz and admin API calls, and protected requests include a bearer JWT.

## 👀 Review Mode Variation

The approved variation is Review Mode after completion. After submitting a quiz, users can review every answered question, their selected answer, whether it was correct, the correct answer, and optional explanation text.

Variation scope boundary: Review Mode is the only approved variation implemented. The app does not implement timed questions, a category-selection quiz flow, image-based questions, multiplayer, real-time behaviour, adaptive branching, or any alternative scoring scheme. `Question.topic` and `Question.difficulty` are metadata for coverage, admin auditability, and balanced sampling; they are not a Categorised Quiz variation because users do not choose a category before starting a quiz.

Design decisions:

- `Question.explanation` is optional so the question bank can be populated gradually.
- `Question.topic` and `Question.difficulty` make the bank auditable and support balanced sampling.
- `Score.answers` stores `questionId`, `selectedAnswer`, `isCorrect`, and a question snapshot.
- A short-lived in-memory quiz session binds the started question set to the later submit request without adding a persisted `Quiz` collection.
- Review/history endpoints use stored snapshots plus Mongoose population when available, so completed attempts remain reviewable after question edits or deletes.

## 🏆 Quiz and Leaderboard Rules

- Quiz length: fixed 10 questions.
- Question selection: backend samples 10 active questions per attempt, targeting 3 foundation, 4 application, and 3 analysis questions while limiting topic repetition when the active bank allows it.
- Scoring: +1 per correct answer only.
- Leaderboard: best score per user, sorted by score descending and earlier submission first for ties.

## 📘 API Documentation

- Swagger UI: `http://localhost:5001/api-docs`
- Postman collection: [`docs/postman-collection.json`](docs/postman-collection.json)
- Security and validation map: [`docs/security-validation.md`](docs/security-validation.md)

Key route groups:

- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `/api/quiz/start`, `/api/quiz/submit`, `/api/quiz/history`, `/api/quiz/review/:attemptId`, `/api/quiz/leaderboard`
- `/api/admin/questions`, `/api/admin/questions/:id`, `/api/admin/questions/:id/toggle`, `/api/admin/bulk-import`

## 🔒 Security and Validation

| Requirement | Implementation |
|---|---|
| Local authentication | Users register/log in with username and password; passwords are hashed with bcrypt before storage. |
| JWT protected routes | Authenticated routes require `Authorization: Bearer <token>`; JWT payload includes user role. |
| Backend RBAC | `/api/admin/*` routes require both authentication and `role === "admin"`. |
| Frontend RBAC | Admin navigation and `/admin` are restricted by `ProtectedRoute adminOnly`. |
| Rate limiting | Login and quiz submit use `express-rate-limit` via `backend/src/middleware/rateLimiters.js`. |
| Server validation | Auth, quiz submit, admin CRUD, toggle, and bulk import requests use Zod validators. |
| Injection/XSS protection | `helmet`, `express-mongo-sanitize`, strict validation, and React's default escaping are used; the app does not render user HTML. |
| Error safety | Global error middleware hides 5xx internals and keeps failure responses in the same envelope shape. |

## 🛠️ Scripts

```bash
npm run demo              # prepare env, MongoDB, seed data, then run the full demo
npm run demo:stop         # stop the helper-created demo MongoDB container
npm run install:all       # install backend and frontend dependencies
npm run dev               # run backend and frontend together
npm test --prefix backend # run backend Jest/Supertest suite
npm run build --prefix frontend
```

## ✅ Verification

```bash
npm test --prefix backend -- --runInBand
npm run build --prefix frontend
python3 -m json.tool docs/postman-collection.json >/dev/null
JWT_SECRET=test-local-secret node -e "require('./backend/src/app'); console.log('app-load-ok')"
git diff --check
```

The backend suite includes Supertest API coverage for auth, quiz sessions, review snapshots, admin access, admin CRUD, and invalid bulk import indexes.

Additional manual checks are listed in [`docs/manual-test-checklist.md`](docs/manual-test-checklist.md). Delivery readiness notes are tracked in [`docs/delivery-readiness.md`](docs/delivery-readiness.md).

## ✨ Bonus-Eligible Evidence

The SPEC allows up to +5 bonus marks for exceptional UI/UX polish, thoughtful features that enhance the approved variation, and strong error handling/user feedback. The items below are the documented bonus candidates in What / Why / How-it-integrates format. Mandatory baseline items such as dark mode, React Hook Form + Zod, response envelopes, JWT protection, and rate limiting are treated as core compliance above, not standalone bonus claims.

### Sydney Life Question Bank

- What: the seeded bank contains **50** active questions in `wizard_sydney_questions.json` (student-life topics with a light narrative frame).
- Why: the quiz content matches a practical Sydney/international-student theme while keeping enough active questions for varied 10-question attempts.
- How it integrates: `/api/quiz/start` samples **10** random active questions from MongoDB; topics and explanations are returned on submit and in history review payloads.

### Durable Review Mode Snapshots

- What: completed attempts store question snapshots with explanation text.
- Why: users can review what they answered even if an admin later edits or deletes the source question.
- How it integrates: `/api/quiz/start` snapshots the served question set, `/api/quiz/submit` stores the review snapshot in `Score.answers`, and review/history pages render backend-expanded attempt data.

### Review Summary and Collapsible Answer Review

- What: Review Mode shows a score ring, correct count, incorrect count, accuracy percentage, collapsible answer detail panels, and an Incorrect only filter.
- Why: users can identify mistakes quickly instead of scanning all 10 answers manually.
- How it integrates: `ReviewPage` derives the summary from the completed attempt returned by `/api/quiz/review/:attemptId`; the filter is client-side only and does not change stored scores.

### Review Learning Breakdown

- What: Review Mode breaks down performance by topic, then provides expandable quick navigation to questions that need review.
- Why: users can see which knowledge areas need more attention and jump directly to the relevant incorrect answers.
- How it integrates: `ReviewPage` derives the breakdown from the existing completed-attempt payload. It deepens Review Mode only and does not change quiz selection, scoring, persistence, or the approved variation boundary.

### Actionable Validation and Import Errors

- What: validation failures expose field-level messages, and bulk import failures report the invalid item index and path.
- Why: admins and players can fix bad input directly instead of guessing what failed.
- How it integrates: frontend forms validate before submission, backend Zod validators return structured envelope errors, and `BulkImport` renders item/path-specific issues without inserting partial invalid data.

### Accessible Feedback and Empty States

- What: key loading, locked-answer, protected-route login notices, success, and empty states use visible guidance plus `role="status"`, `role="alert"`, or `aria-live` where appropriate.
- Why: users receive clearer feedback during quiz, history, leaderboard, login, and admin workflows, including keyboard/screen-reader users.
- How it integrates: the polish stays inside existing React pages/components and shared CSS, with no extra runtime dependencies.
