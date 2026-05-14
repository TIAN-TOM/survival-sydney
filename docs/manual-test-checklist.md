# Manual Test Checklist

## Execution Record

Use this table to record browser-oriented verification. Automated browser smoke checks do not replace the final human demo rehearsal, but they provide reproducible evidence that the main flows load and connect correctly.

| Date | Tester | Browser | Backend port | Frontend port | Overall result |
|---|---|---|---|---|---|
| 2026-05-06 | Tom Tian | Local browser | 5001 | 5173 | Browser smoke PASS |

## Browser Smoke Evidence

Executed on 2026-05-06 against local MongoDB and seeded demo data:

- Opened `http://localhost:5173` and confirmed the Sydney Life Quiz home page, spaced primary navigation, split light/dark theme control, and main login button rendered.
- Registered a new player account through the React form and confirmed redirect to the home page.
- Started a fixed 10-question quiz from the home page CTA, confirmed each question rendered exactly four radio options, selected one answer per question, and submitted the quiz.
- Confirmed the completion state displayed a final score and a Review answers link.
- Opened Review Mode from the completed attempt and confirmed the Review Mode page rendered.
- Logged out, signed in as `admin` through `/admin/login`, and confirmed `/admin` displayed Admin Question Management, Create question, Bulk import, and Question bank sections.
- Toggled dark mode, reloaded the app, and confirmed the theme persisted.

Backend Supertest coverage additionally verifies auth, quiz start/submit/history/review data, leaderboard, admin CRUD/toggle/delete, invalid bulk import indexes, and player 403 on admin routes.

## Environment

- Start MongoDB locally: `docker run -d -p 27017:27017 --name mongo mongo:7`
- Set `MONGODB_URI=mongodb://localhost:27017/comp5347_quiz` if overriding defaults.
- Start the backend and confirm it connects to MongoDB.
- Start the frontend and confirm it can reach the API base URL.

## Authentication

- Register a new user.
- While logged out, open protected player routes such as `/quiz`, History, and Leaderboard and confirm the login page explains why login is required.
- While logged out, click the home page Start quiz CTA and confirm only one quiz-start CTA exists on the home page.
- Log in and confirm the JWT is stored in local storage.
- Refresh the browser and confirm authenticated API requests still include the JWT.
- Log out and confirm protected routes are no longer accessible.

## Quiz Flow

- Start a fixed 10-question quiz from the active question bank.
- Confirm the returned quiz contains 10 active questions from the seeded bank.
- Confirm rendered questions show question text and four answer options without exposing correct answers before submission.
- Select answers and submit the attempt.
- Confirm the final score is shown.

## Review Mode

- Open a completed attempt.
- Confirm each question displays the selected answer.
- Confirm incorrect answers show the correct answer.
- Confirm explanation text appears when a question has an explanation.
- Confirm Review Mode still works after a page refresh.
- Confirm Review Mode handles a deleted source question with the current placeholder state.

## Admin Flow

- Log in as an admin user.
- Confirm `/admin/login` rejects a normal player account.
- Create questions with question text, four answer options, a correct answer index, active state, and explanations.
- Edit an existing question.
- Confirm the Question bank table displays question text, options, correct answer, active state, and explanation for created/imported questions.
- Delete or deactivate a question and confirm it no longer appears to players.
- Confirm a player JWT receives 403 from `/api/admin/questions`.
- Confirm an unauthenticated request receives 401 from `/api/admin/questions`.
- Bulk import a valid JSON array and confirm new questions appear.
- Bulk import a JSON array with one invalid item and confirm the UI/API reports the failing item index.
- Send `{ "active": "false" }` to the toggle endpoint and confirm it is rejected with 400.

## Error Handling

- Submit an invalid form and confirm the UI shows a clear validation message.
- Trigger an unauthorized request and confirm the UI handles the 401 response.
- Confirm server errors do not reveal stack traces or database details in the browser.
- Confirm login rate limiting is mounted via `backend/src/routes/auth.routes.js`; note that the quiz-submit limiter helper is defined but not currently mounted.

## Theme

- Confirm the home page title, quiz preview, and practice-area cards match the Sydney life seed bank.
- Confirm the light theme uses the USYD-inspired ochre/orange-red and charcoal palette for brand accents and primary controls.
- Confirm the top banner keeps Login as the only primary public action, uses a split light/dark theme toggle, and keeps Admin login inside the login page.
- Toggle dark mode.
- Refresh the page and confirm the theme persists.
- Toggle back to light mode and confirm the change persists.

## Documentation

- Open `http://localhost:5001/api-docs`.
- Confirm bearer authentication is listed.
- Confirm success and failure response envelopes are documented.
