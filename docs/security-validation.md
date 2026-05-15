# Security and Validation Map

This document maps the assignment security and validation requirements to concrete implementation files and verification evidence.

## Requirement Coverage

| Requirement | Implementation files | Evidence |
|---|---|---|
| Local username/password authentication | `backend/src/controllers/auth.controller.js`, `backend/src/models/User.js` | `User#setPassword()` hashes with bcrypt; login compares hashes and issues JWTs. |
| No third-party auth provider | `backend/package.json` | Auth uses `bcryptjs` and `jsonwebtoken`; no OAuth/Auth0/Firebase/Clerk dependency. |
| JWT protected routes | `backend/src/middleware/auth.middleware.js`, `backend/src/routes/*.routes.js` | Quiz start/submit/history and admin routes require bearer JWTs. The frontend treats leaderboard as protected, but the backend leaderboard route currently does not enforce auth and needs owner follow-up. |
| Role-based admin access | `backend/src/middleware/admin.middleware.js`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/App.jsx` | Backend rejects non-admins with 403; frontend hides admin navigation and redirects non-admin users away from `/admin`. |
| Rate limiting on login | `backend/src/routes/auth.routes.js`, `backend/src/middleware/rateLimiters.js` | `/api/auth/login` uses `loginLimiter`, 5 requests/minute outside Jest. |
| Rate limiting on quiz submit | `backend/src/middleware/rateLimiters.js` | `quizSubmitLimiter` exists but is not currently mounted on `/api/quiz/submit`. |
| Server-side input validation | `backend/src/validators/auth.validators.js`, `backend/src/controllers/*.controller.js` | Zod validates auth route bodies. Quiz and admin controllers use explicit request checks plus Mongoose validators. |
| Form validation | `frontend/src/components/Login.jsx`, `frontend/src/components/Register.jsx`, `frontend/src/components/QuestionForm.jsx`, `frontend/src/components/BulkImport.jsx` | React Hook Form + Zod provide field-level feedback before API submission. |
| Injection protection | `backend/src/app.js` | `helmet`, JSON size limit, `express-mongo-sanitize`, auth request schemas, explicit controller checks, and Mongoose validators reduce common injection risks. |
| XSS protection | `frontend/src/**/*.jsx` | React renders text as escaped content; the app does not use `dangerouslySetInnerHTML` or render user-provided HTML. |
| Safe error handling | `backend/src/middleware/errorHandler.js`, `backend/src/utils/responseEnvelope.js` | 5xx responses hide implementation details; all failures use the same envelope shape. |

## Verification Evidence

Automated checks:

```bash
npm test --prefix backend -- --runInBand
npm run build --prefix frontend -- --outDir /tmp/comp5347-a2-frontend-build --emptyOutDir
python3 -m json.tool docs/postman-collection.json >/dev/null
JWT_SECRET=test-local-secret node -e "require('./backend/src/app'); console.log('app-load-ok')"
git diff --check
```

Backend tests cover:

- Public registration cannot assign an admin role.
- `/api/auth/me` requires authentication.
- Player JWTs receive 403 from admin routes.
- Invalid login returns a safe error envelope.
- Quiz start requires authentication and enough active questions.
- Quiz submission rejects duplicate question IDs and invalid answer indexes.
- Review Mode rebuilds attempt details through `/api/quiz/history/:id`.
- Authenticated leaderboard requests return each user's best score.
- Admin CRUD, active toggle, and invalid bulk import indexes.

Browser smoke coverage is recorded in `docs/manual-test-checklist.md`.
