# Security and Validation Map

This document maps the assignment security and validation requirements to concrete implementation files and verification evidence.

## Requirement Coverage

| Requirement | Implementation files | Evidence |
|---|---|---|
| Local username/password authentication | `backend/src/controllers/auth.controller.js`, `backend/src/models/User.js` | `User#setPassword()` hashes with bcrypt; login compares hashes and issues JWTs. |
| No third-party auth provider | `backend/package.json` | Auth uses `bcryptjs` and `jsonwebtoken`; no OAuth/Auth0/Firebase/Clerk dependency. |
| JWT protected routes | `backend/src/middleware/auth.middleware.js`, `backend/src/routes/*.routes.js` | Protected quiz/history/review/admin routes require bearer JWTs. |
| Role-based admin access | `backend/src/middleware/admin.middleware.js`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/App.jsx` | Backend rejects non-admins with 403; frontend hides admin navigation and redirects non-admin users away from `/admin`. |
| Rate limiting on login | `backend/src/routes/auth.routes.js`, `backend/src/middleware/rateLimiters.js` | `/api/auth/login` uses `loginLimiter`, 5 requests/minute outside Jest. |
| Rate limiting on quiz submit | `backend/src/routes/quiz.routes.js`, `backend/src/middleware/rateLimiters.js` | `/api/quiz/submit` uses `quizSubmitLimiter`, keyed by authenticated user when available. |
| Server-side input validation | `backend/src/validators/*.validators.js`, `backend/src/controllers/*.controller.js` | Zod validates auth, quiz submit, admin question CRUD, active toggle, and bulk import. |
| Form validation | `frontend/src/components/Login.jsx`, `frontend/src/components/Register.jsx`, `frontend/src/components/QuestionForm.jsx`, `frontend/src/components/BulkImport.jsx` | React Hook Form + Zod provide field-level feedback before API submission. |
| Injection protection | `backend/src/app.js` | `helmet`, JSON size limit, `express-mongo-sanitize`, strict Zod schemas, and Mongoose validators reduce common injection risks. |
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
- Quiz submission rejects answers outside the served options.
- Duplicate quiz submission is rejected.
- Review Mode remains available from stored snapshots after a question is deleted.
- Admin CRUD, active toggle, and invalid bulk import indexes.

Browser smoke coverage is recorded in `docs/manual-test-checklist.md`.
