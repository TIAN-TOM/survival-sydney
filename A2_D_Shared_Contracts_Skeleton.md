# D's 6 Shared Contracts — Phase 1 Skeleton Reference

> **Audience:** Tom (D — Integration Lead). Reference material for implementing the Phase 1 shared contracts.
>
> **Purpose:** All 6 files that must land in `main` by end of Phase 1 (Week 1 前半) so A/B/C can build on a stable foundation. Per Playbook §7.
>
> **Coding conventions:**
> - Backend = CommonJS (`require` / `module.exports`) — Express convention
> - Frontend = ESM (`import` / `export`) — Vite default
> - Comments = English (Australian where relevant), explaining **why** not **what**, per A1 carry-over habit
> - All "ready to drop in" — sensible defaults, decision points called out
>
> **Disclaimer:** These are starting points, not final code. Refine based on Tracy's auth design, integration testing, etc.

> ⚠️ **Skeleton 使用守则（先读再用）：** 这些是**起点骨架**，不是终点蓝图。扩展时**只加 spec 必需的逻辑**；任何"我觉得这里再加个 X 会更优雅 / 更通用 / 更 production-ready"的冲动先停一下、查 [Playbook §2 拿分原则](A2_Group_Playbook.md#2-评分拆解与优先级)。简洁拿满分，过度工程可能反扣分。

---

## Tree

```
backend/
├── utils/responseEnvelope.js        ← (1)
├── middleware/errorHandler.js       ← (2)
└── schemas/
    ├── user.schema.js               ← (3a)
    └── question.schema.js           ← (3b)

frontend/src/
├── api/api.js                       ← (4)
├── contexts/ThemeContext.jsx        ← (5)
└── components/ProtectedRoute.jsx    ← (6)

frontend/src/schemas/                ← (3a, 3b mirrored — see decision below)
```

---

## (1) `backend/utils/responseEnvelope.js`

> **Spec §9.5:** All API responses must use `{ success: boolean, data?: any, error?: string }`. This file is the **single source of truth** — every controller goes through these helpers. Never `res.json({...})` directly.

```js
// utils/responseEnvelope.js
//
// Single source of truth for the API response shape mandated by Spec §9.5.
// Every controller MUST use these helpers.
// Reviewer rule: any raw `res.json({...})` in a controller is a bug.

const ok = (data) => ({ success: true, data });
const fail = (error) => ({ success: false, error });

module.exports = { ok, fail };
```

**Usage pattern in controllers:**
```js
const { ok, fail } = require('../utils/responseEnvelope');

// success
res.status(200).json(ok({ user, token }));

// failure (also see errorHandler — usually you `throw` instead and let it convert)
res.status(400).json(fail('Username already exists'));
```

---

## (2) `backend/middleware/errorHandler.js`

> Mounted **last** in `server.js` after all routes (`app.use(errorHandler)`). Catches any thrown error from controllers/middleware and converts to envelope. Lets controllers `throw` instead of manually building error responses.

```js
// middleware/errorHandler.js
//
// Global error handler — must be mounted LAST in server.js, after all routes:
//   app.use(errorHandler);
//
// Controllers throw an Error (optionally with .status set); this catches and
// converts to the envelope. Keeps controllers focused on the happy path.
//
// Why hide 5xx messages: server-internal errors (DB down, undefined access)
// often leak implementation details. Client-facing 4xx messages are written
// for users and are safe to return verbatim.

const { fail } = require('../utils/responseEnvelope');

module.exports = (err, req, res, next) => {
  // Always log server-side so we can debug. Don't trust err to be an Error
  // instance — string throws happen.
  console.error(`[errorHandler] ${req.method} ${req.path}`, err);

  const status = err.status || 500;
  const message =
    status >= 500
      ? 'Internal server error'           // hide details on server faults
      : err.message || 'Bad request';     // expose validation/auth messages

  res.status(status).json(fail(message));
};
```

**Usage pattern in controllers:**
```js
// In any controller — throw with a status, errorHandler converts it.
const e = new Error('Question not found');
e.status = 404;
throw e;

// Or for async functions, use express-async-errors at the top of server.js
// so thrown errors in async handlers don't get lost. One-liner:
//   require('express-async-errors');
```

---

## (3) Zod Schemas — *strategy decision required*

> **Decision pending (Playbook §7 third item — Week 1 早期 timebox):**
> - **Spike A (preferred):** monorepo workspaces, `shared/schemas/` consumed by both sides
> - **Spike B (fallback):** maintain two copies, B+C pair sync via PR review
>
> **Default until decided: write CommonJS in `backend/schemas/`, mirror as ESM in `frontend/src/schemas/`.** B+C pair owns keeping them in sync.

### (3a) `backend/schemas/user.schema.js`

```js
// schemas/user.schema.js
//
// Zod schemas for auth-related request bodies. Imported by:
//   - controllers/auth.controller.js (validates req.body before persistence)
//   - frontend/src/components/Login.jsx, Register.jsx (RHF resolver)
//
// Backend uses CommonJS; frontend mirror file uses `import { z } from 'zod'`
// and `export const ...` instead.

const { z } = require('zod');

// Username: alphanumeric + underscore, 3-20 chars. Adjust if A1 unikey-style
// usernames are needed.
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, digits, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
});

module.exports = { registerSchema, loginSchema };
```

### (3b) `backend/schemas/question.schema.js`

```js
// schemas/question.schema.js
//
// Question + answer-submission schemas. Owned by B+C pair (Raven + Allen) since
// both consume Question shape — Raven on quiz fetch/scoring, Allen on admin CRUD.
// `explanation` is the Review Mode variation field (Spec §5 option 4).

const { z } = require('zod');

// One question. correctIndex (0..3) over correctAnswer string keeps option text
// editable without breaking scoring. Bulk imports use the same shape.
//
// Options must be distinct — spec doesn't explicitly require this, but a quiz
// where two of the four options are identical is obviously broken UX (and
// makes scoring ambiguous if the duplicate happens to include the correct
// answer). This is a team safeguard, not a spec mandate.
const questionSchema = z.object({
  text: z.string().min(1).max(500),
  options: z
    .array(z.string().min(1).max(200))
    .length(4)
    .refine(
      (opts) => new Set(opts.map((o) => o.trim())).size === 4,
      { message: 'All four options must be distinct (after trimming whitespace)' }
    ),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().max(1000).optional().default(''), // Review Mode field
  isActive: z.boolean().default(true),
});

// Bulk import: array of questions. Cap protects against accidental huge pastes.
const bulkImportSchema = z.array(questionSchema).min(1).max(100);

// Submitted answer: one per question. selectedAnswer is the option text (not
// index) so it survives admin shuffling options on the question side.
// (Decision: store text, not index. Discuss with Raven in Pair 2 sync.)
const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedAnswer: z.string().min(1),
});

// Whole-quiz submission. Length matches Spec §6 (6-10 questions).
// If the team locks 'fixed 10' in §1, tighten to .length(10) here.
const submitQuizSchema = z.object({
  answers: z.array(submitAnswerSchema).min(6).max(10),
});

module.exports = { questionSchema, bulkImportSchema, submitAnswerSchema, submitQuizSchema };
```

**Frontend mirror:** copy each file to `frontend/src/schemas/`, replace `const { z } = require('zod')` with `import { z } from 'zod'`, and `module.exports = {...}` with `export { ... }` (or `export const` per item).

---

## (4) `frontend/src/api/api.js`

> Centralised axios instance. JWT injected on request; envelope unwrapped on response. Throws on `success: false` so callers use plain `try/catch`.

```js
// api/api.js
//
// All frontend HTTP traffic goes through this instance. Two responsibilities:
//   1. Inject JWT into Authorization header on every outgoing request
//   2. Unwrap the API envelope so callers get plain data, not { success, data }
//
// On envelope { success: false } or non-2xx, throws an Error whose .message
// is the server-provided error string. Callers catch normally.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10_000,
});

// Request interceptor: attach JWT if present in localStorage. Routes that don't
// need auth (login, register) just have their token ignored server-side.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap { success, data } / throw on { success, error }.
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && body.success === true) {
      return body.data;
    }
    // Bug fix (v2.6 audit): if backend returns 2xx but body says
    // { success: false, error: '...' }, we MUST throw — otherwise the caller
    // will treat the failure envelope as data (`questions = {success:false,...}`)
    // and silently mishandle it. This shouldn't happen if errorHandler is
    // mounted correctly, but defensive code matters when 4 contributors each
    // build their own controllers.
    if (body && body.success === false) {
      throw new Error(body.error || 'Request failed');
    }
    // Last-resort fallback: non-envelope JSON. Return as-is so the caller can
    // inspect it; log a warning so we notice during integration testing.
    console.warn('[api] Non-envelope response body:', body);
    return body;
  },
  (error) => {
    // Backend sent { success: false, error: '...' } with non-2xx status.
    const envelopeError = error.response?.data?.error;
    const message = envelopeError || error.message || 'Network error';

    // Auto-logout on 401 — JWT expired or invalid. Tracy's auth flow should
    // expect this and redirect to /login. Wire that via an event or store.
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt');
      // Optional: window.dispatchEvent(new Event('auth:expired')) — let the
      // app's auth store / router listen and redirect.
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
```

**Usage in components:**
```jsx
import api from '@/api/api';

// GET — gets unwrapped data directly
const questions = await api.get('/quiz/start');

// POST — same pattern
const { score, total } = await api.post('/quiz/submit', { answers });

// Error path — works for both non-2xx AND 2xx-with-success:false
try {
  await api.post('/auth/login', { username, password });
} catch (err) {
  // err.message === backend's envelope.error string
  setLoginError(err.message);
}
```

---

## (5) `frontend/src/contexts/ThemeContext.jsx`

> Spec §9.5 + §A.7: dark mode toggle, persisted in `localStorage`, applies to **both** player and admin. Provider wraps the whole `<App />` so any descendant page can toggle.

```jsx
// contexts/ThemeContext.jsx
//
// Theme context — applies a 'dark' / 'light' attribute to <html> and persists
// the choice in localStorage. Provider wraps <App />, so both player and admin
// trees see the same theme (Spec §A.7 mandate).
//
// CSS pattern: target [data-theme="dark"] selectors in your stylesheet. e.g.
//   :root { --bg: #fff; --fg: #111; }
//   [data-theme="dark"] { --bg: #111; --fg: #eee; }
//   body { background: var(--bg); color: var(--fg); }

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

export const ThemeProvider = ({ children }) => {
  // Lazy initial state from localStorage so first-paint flash is minimal.
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  });

  // Mirror theme to <html data-theme="..."> + persist on every change.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Convenience hook: const { theme, toggle } = useTheme();
export const useTheme = () => useContext(ThemeContext);
```

**Mount in `App.jsx`:**
```jsx
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      {/* Router, providers, etc. */}
    </ThemeProvider>
  );
}
```

**Toggle button (drop in any header):**
```jsx
import { useTheme } from '@/contexts/ThemeContext';
const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Toggle theme">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
```

---

## (6) `frontend/src/components/ProtectedRoute.jsx`

> Frontend route guard. Two modes: any logged-in user, or admin-only. **Backend middleware MUST also enforce** (Spec §8) — this is the UI layer only, not security.

```jsx
// components/ProtectedRoute.jsx
//
// Frontend gating for protected and admin-only routes. Reads the JWT from
// localStorage; for admin routes also decodes the payload to check role.
//
// IMPORTANT: this is UI gating only — the backend admin.middleware.js enforces
// the same rule on every API call. A user who hand-edits their JWT to claim
// role=admin can bypass the FE check but still gets 403 from the BE. Spec §8
// requires both layers.
//
// Usage in router:
//   <Route element={<ProtectedRoute />}>...user-only routes...</Route>
//   <Route element={<ProtectedRoute requireAdmin />}>...admin-only routes...</Route>

import { Navigate, Outlet } from 'react-router-dom';

// Decode JWT payload (no verification — backend re-verifies signature).
// We only read role for FE redirects; trust comes from server.
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    // base64url → base64 normalisation before atob.
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const ProtectedRoute = ({ requireAdmin = false }) => {
  const token = localStorage.getItem('jwt');

  // Not logged in → bounce to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Admin route + non-admin user → bounce home (or /403)
  if (requireAdmin) {
    const payload = decodeJWT(token);
    if (!payload || payload.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
```

**Usage in router:**
```jsx
import { createBrowserRouter, RouterProvider, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/quiz', element: <Quiz /> },
      { path: '/leaderboard', element: <Leaderboard /> },
      { path: '/review/:scoreId', element: <Review /> },
      { path: '/history', element: <History /> },
    ],
  },
  {
    element: <ProtectedRoute requireAdmin />,
    children: [
      { path: '/admin', element: <Admin /> },
    ],
  },
]);
```

---

## Phase 1 DoD (re-stated for D)

After all 6 contracts land in `main`:

- [ ] Anyone can `git clone` → `docker run mongo` → `npm run seed` → both `npm run dev` (BE+FE) → see `/api/health` envelope round-trip
- [ ] Tracy can write `auth.controller.js` knowing `ok` / `fail` exist
- [ ] Raven can write `quiz.controller.js` knowing axios will inject JWT
- [ ] Allen can write admin pages using `<ProtectedRoute requireAdmin />`
- [ ] Dark mode toggle visible somewhere in `<App />`, persists across reloads
- [ ] Each of the 4 of us has at least 2 commits in

---

*Synced with Playbook v3.0. Audit trail: v2.5 removed misleading SSR comment in §5 (this is a Vite SPA, not SSR); v2.6 (a) §3b questionSchema added `.refine(distinct)` on the four options as a team safeguard, (b) §4 axios response interceptor fixed silent fall-through on 2xx + `success: false` (now throws), endpoint example aligned to `/quiz/start` per Playbook §8; v2.7 de-dated inline references (Day-1-4 → Week 1 前半); v2.9 §6 example router added `/history` route (History page now owned by B in Playbook v2.8 role table — Skeleton route map was missing this entry); v3.0 sync — no contract-level code changes (the 6 shared contracts in this Skeleton remain unchanged in v3.0); v3.0 only adds Jest unit-test deliverables for D (`tests/envelope.test.js` + `tests/errorHandler.test.js`) per Playbook §8.5 — these are NOT shared contracts and are intentionally NOT in this Skeleton (write them in Phase 4, see Tom Guide §4 Phase 4). Source: Group_Playbook §7 + Tom_Personal_Guide §4 Phase 1. Use this as an implementation reference; adapt it to the final folder layout, lint config, and team decisions.*
