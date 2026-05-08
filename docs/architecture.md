# Architecture

## Overview

The application is a MERN-style quiz platform with a React frontend, Express API, and local MongoDB database. The backend owns authentication, quiz data, attempt submission, Review Mode data expansion, and admin CRUD. The frontend consumes the API through one shared axios instance so JWT handling and response normalization stay consistent.

## Backend

- `backend/src/config/db.js` connects Mongoose to `MONGODB_URI`, defaulting to `mongodb://localhost:27017/comp5347_quiz`.
- `backend/src/utils/responseEnvelope.js` defines shared `ok()` and `fail()` response envelopes with the required `{ success, data? }` / `{ success, error }` shape.
- `backend/src/middleware/errorHandler.js` provides a global Express error handler. It returns client-safe 4xx messages and hides 5xx implementation details behind `Internal server error`.
- `backend/src/docs/swagger.js` defines the OpenAPI base document and a `setupSwagger(app)` helper for `/api-docs`.

## Frontend

- `frontend/src/api/api.js` creates a shared axios client, attaches a stored JWT, unwraps successful envelopes, and normalizes API errors.
- `frontend/src/contexts/ThemeContext.jsx` stores the selected light or dark theme in local storage and applies it through `document.documentElement.dataset.theme`.
- `frontend/src/pages/HomePage.jsx` is the product-style landing route for the Sydney Life Quiz theme. It keeps a single primary quiz CTA, previews the 10-question attempt, and shows the core Sydney life practice areas without coursework/demo copy.
- `frontend/src/App.jsx` owns the public app shell, including spaced primary navigation, the split light/dark theme toggle, and the single public Login entry point.
- `frontend/src/components/ProtectedRoute.jsx` redirects unauthenticated users to login with a contextual notice so protected actions explain why login is required.
- `frontend/src/styles.css` contains the base theme tokens and Home page styles. The visual system uses a Sydney University-inspired ochre/orange-red and charcoal palette with accessible contrast for primary controls.

## Review Mode

Review Mode is implemented as a completed-attempt view. `/api/quiz/start` dynamically samples active questions and stores a short-lived in-memory snapshot of the served question text, options, correct answer, topic, difficulty, and explanation. `/api/quiz/submit` scores against that locked snapshot and stores the same review snapshot in `Score.answers`, while still keeping the original `questionId` reference. History/review responses use Mongoose population when the original question still exists and fall back to the stored snapshot when it has been edited or deleted. The database intentionally has `Question` and `Score` collections, not a persisted `Quiz` collection.

## Question Bank and Sampling

Questions carry `topic` and `difficulty` metadata. The seed bank provides 50 active Sydney life questions across 5 categories and the `foundation`, `application`, and `analysis` difficulty levels. Runtime selection keeps the fixed 10-question length for leaderboard comparability, but it now targets 3 foundation, 4 application, and 3 analysis questions and limits repeated topics when the active bank has enough coverage. If a difficulty bucket is underfilled, the selector fills from the remaining active bank so the app remains usable with admin-managed content.

## Data Flow

1. The frontend sends requests through `api.js`.
2. The request interceptor adds `Authorization: Bearer <token>` when a JWT exists in local storage.
3. Route controllers return `ok(data)` or pass errors to the global handler.
4. The error handler returns `fail(message, statusCode, details, code)`.
5. The response interceptor returns the successful `data` payload or throws a normalized error object.

## Documentation

Swagger is intentionally kept as a setup helper so feature routes can add JSDoc annotations beside their controllers or route files. The base OpenAPI document already defines bearer authentication and reusable success/failure envelope schemas.
