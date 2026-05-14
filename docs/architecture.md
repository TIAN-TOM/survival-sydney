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

Review Mode is implemented as a completed-attempt view. `/api/quiz/start` samples 10 active questions and withholds correct answers and explanations from the client. `/api/quiz/submit` scores the submitted answer indexes against the current `Question` documents and stores `questionId`, `selectedAnswer`, and `isCorrect` in `Score.answers`. `/api/quiz/history/:id` rebuilds review details from the current questions and returns a deleted-question placeholder if a referenced question no longer exists. The database intentionally has `Question` and `Score` collections, not a persisted `Quiz` collection.

## Question Bank and Sampling

The source seed JSON contains 50 Sydney life questions across practical categories, but the persisted `Question` model currently stores `questionText`, four `options`, `correctAnswer` as an option index, `active`, and optional `explanation`. Runtime selection keeps the fixed 10-question length for leaderboard comparability and randomly samples from active questions. It does not currently persist `topic`/`difficulty` or perform metadata-balanced sampling.

## Data Flow

1. The frontend sends requests through `api.js`.
2. The request interceptor adds `Authorization: Bearer <token>` when a JWT exists in local storage.
3. Route controllers return `ok(data)` or pass errors to the global handler.
4. The error handler returns `fail(message, statusCode, details, code)`.
5. The response interceptor returns the successful `data` payload or throws a normalized error object.

## Documentation

Swagger is intentionally kept as a setup helper so feature routes can add JSDoc annotations beside their controllers or route files. The base OpenAPI document already defines bearer authentication and reusable success/failure envelope schemas.
