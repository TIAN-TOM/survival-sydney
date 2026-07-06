// Shared domain types for data exchanged with the backend API.
// Shapes mirror what the backend controllers actually return
// (backend/src/controllers/{auth,quiz,admin}.controller.js) after envelope unwrapping.

/** Safe user object returned by /auth/login, /auth/register, and /auth/me. */
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

/** Payload of POST /auth/login. */
export interface LoginResult {
  token: string;
  user: User;
}

/** Payload of POST /auth/register (account created; no JWT issued). */
export interface RegisterResult {
  user: User;
  message: string;
}

/** Payload of GET /auth/me. */
export interface MeResult {
  user: User;
}

/**
 * Question as served to players by GET /quiz/start — no correctAnswer/explanation
 * (answer keys stay server-side until submit).
 */
export interface PublicQuestion {
  _id: string;
  questionText: string;
  options: string[];
  topic?: string;
  /** Legacy alias for topic kept for older payloads; prefer `topic`. */
  category?: string;
}

/** Payload of GET /quiz/start. */
export interface StartQuizResult {
  attemptToken: string;
  questions: PublicQuestion[];
}

/** Payload of POST /quiz/answer (per-question server-side lock acknowledgement). */
export interface AnswerLockResult {
  locked: boolean;
  answered: number;
  total: number;
}

/** One Review Mode row from POST /quiz/submit or GET /quiz/history/:id. */
export interface ReviewRow {
  /** null when the underlying question was deleted after the attempt. */
  questionId: string | null;
  questionText: string;
  options: string[];
  selectedAnswer: number;
  /** null when the underlying question was deleted after the attempt. */
  correctAnswer: number | null;
  isCorrect: boolean;
  optionOrder: number[];
  topic: string;
  explanation: string | null;
  /** Legacy alias for topic kept for older payloads; prefer `topic`. */
  category?: string;
}

/** Payload of POST /quiz/submit. */
export interface AttemptResult {
  score: number;
  total: number;
  scoreId: string;
  review: ReviewRow[];
}

/** Payload of GET /quiz/history/:id (single attempt with full review data). */
export interface AttemptDetail {
  score: number;
  total: number;
  createdAt: string;
  review: ReviewRow[];
}

/** One row of GET /quiz/history (newest first). */
export interface HistoryRow {
  _id: string;
  score: number;
  createdAt: string;
  totalQuestions: number;
  topics: string[];
}

/** One row of GET /quiz/leaderboard (best attempt per scholar, top 50). */
export interface LeaderboardRow {
  username: string;
  bestScore: number;
  bestAchievedAt: string;
}

/** Full question document returned by the /admin/questions endpoints. */
export interface AdminQuestion {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Body sent to POST/PUT /admin/questions (built by QuestionForm / BulkImport). */
export interface QuestionPayload {
  questionText: string;
  options: string[];
  correctAnswer: number;
  active: boolean;
  explanation: string;
  topic: string;
}

/** Payload of POST /admin/questions/bulk-import. */
export interface BulkImportResult {
  insertedCount: number;
  questions: AdminQuestion[];
}

// The motion system drives staggered entrances via a per-item CSS variable
// (e.g. style={{ '--motion-stagger-index': i }}); allow custom properties in
// React style objects instead of casting at every call site.
declare module 'react' {
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined;
  }
}
