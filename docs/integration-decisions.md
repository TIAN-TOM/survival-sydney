# Integration Decisions

## Response Envelope

All backend JSON responses should use the shared envelope helpers:

- Success: `ok(data)` -> `{ success: true, data }`
- Failure: `fail(message, statusCode, details, code)` -> `{ success: false, error: message, statusCode?, details?, code? }`

Controllers should return success envelopes directly and pass errors to `next(error)` instead of manually formatting failure responses.

## Error Handling

The global error middleware hides all 5xx implementation details from clients. Validation and authorization errors can expose safe details through top-level `details` and `code` fields when the status is below 500. The top-level `error` value remains a display-ready string for simple frontend consumers.

## Authentication Header

The frontend API client reads a JWT from local storage using the keys `token`, `jwt`, or `authToken`. The first value found is sent as `Authorization: Bearer <token>`.

## Review Mode Contract

Review Mode data should be backend-expanded. The API returns completed attempts with question text, answer choices, selected answers, correct answers, and explanation fields already available for rendering. Attempts store a question snapshot so Review Mode still works if an admin later edits, deactivates, or deletes the original question.

## Quiz Attempt State

Quiz attempts are generated dynamically from active `Question` documents. The backend keeps the started question set in a short-lived in-memory session until submission, then persists only the completed `Score` attempt. This follows the Ed #182 guidance that quizzes are runtime constructs rather than stored quiz documents.

## Frontend Theme

The public landing page and app shell should present the project as the Sydney Life Quiz because the seeded bank now contains Sydney/NSW life-survival questions for international students. Public-facing copy should feel like a released quiz product, not a coursework demo. Shared CSS tokens use a Sydney University-inspired ochre/orange-red and charcoal palette, with a high-contrast Login button and a split light/dark theme control in the header. Admin login should stay inside the login flow rather than competing as a primary public header action. The landing page should avoid duplicate CTAs that navigate to the same route. Header dropdowns should be avoided unless they contain non-duplicate actions such as continuing an in-progress attempt, choosing a practice topic, or opening recent results.

## Protected Route Feedback

Protected routes should redirect unauthenticated users to the matching login page with a contextual notice. This keeps frontend RBAC aligned with the spec while making blocked actions understandable to players and admins.

## JWT Secret

The backend must have `JWT_SECRET` configured outside Jest. Startup fails without it so local or marker deployments do not accidentally use a predictable development signing key.

## Swagger

Swagger lives behind `/api-docs` when `setupSwagger(app)` is mounted by the server. The required runtime packages are `swagger-jsdoc` and `swagger-ui-express`.

## MongoDB

The default local connection string is `mongodb://localhost:27017/comp5347_quiz`. Developers can override it with `MONGODB_URI`.
