# Role D 口试最后一小时 Guide

> 用途：口试前最后 30-60 分钟快速阅读。
> 策略：只保留高频技术问题，低频 Admin / Leaderboard / UI polish 只给兜底一句话。
> 主线：**JWT 证明身份 → 后端随机抽题 → attemptToken 锁定试卷 → submit 后端算分 → token 过期拒绝**。

---

## 0. 导师提问规律

根据最新口试消息，已出现的问题是：

1. JWT
2. Quiz 的核心逻辑
3. 如何随机选择题目
4. Token 过期以后怎么处理

这说明导师喜欢问的不是“页面长什么样”，而是：

| 导师真正想确认 | 你要证明 |
|---|---|
| 你懂身份认证吗 | JWT 怎么签发、怎么验证、过期怎么办 |
| 你懂 quiz 生命周期吗 | start 和 submit 两阶段怎么走 |
| 你懂数据从哪里来吗 | MongoDB `$sample` 如何随机抽题 |
| 你懂后端为什么重要吗 | 不信前端，后端验 token、验题目、算分 |
| 你懂边界条件吗 | token 过期、重复提交、题目不匹配怎么办 |

最后一小时，不要再重点背 Admin CRUD、Leaderboard 细节、CSS、theme。它们不是完全不会问，但优先级明显低。

---

## 1. 你先背这一段总答案

> This project is a React, Express, and MongoDB quiz system. My Role D work focused on integration and robustness: shared API contracts, response envelopes, route protection, error handling, frontend API wiring, documentation, tests, and quiz-attempt integrity. The most important flow is quiz start and submit. On start, the backend authenticates the user, blocks admins, randomly samples 10 active questions, shuffles option order, signs an attempt token, removes answer fields, and returns public questions. On submit, the backend verifies the token, checks question IDs, maps selected answers through `optionOrder`, calculates score server-side, saves the result, and returns review data.

中文理解：

> 这个项目是一套 React + Express + MongoDB 的 quiz 系统。我的 Role D 重点是把各模块安全、稳定地接起来。最核心的流程是：开始 quiz 时后端验证身份、随机抽 10 题、打乱选项、签 attemptToken、隐藏答案；提交 quiz 时后端验证 token、检查题目、自己算分、保存结果。

---

## 2. 高频题 1：JWT 是什么？项目里怎么用？

### 2.1 老奶奶版

JWT 像一张有服务器签名的会员卡：

1. 用户登录成功后，服务器发一张“会员卡”给前端。
2. 前端之后每次请求都带上这张卡。
3. 后端检查卡是不是自己签的、有没有过期。
4. 检查通过后，后端知道这个请求是谁发来的。

### 2.2 项目实现

登录成功：

```js
jwt.sign(
  { userId: user._id.toString(), role: user.role },
  getJwtSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
)
```

JWT 里有：

- `userId`
- `role`
- 过期时间，默认 2 小时

secret 来源：

- 正常环境：`process.env.JWT_SECRET`
- test 环境：`test-only-jwt-secret`

前端做什么：

```text
Authorization: Bearer <token>
```

后端 `authMiddleware` 做什么：

1. 读取 `Authorization` header。
2. 检查格式是不是 `Bearer token`。
3. 用 `jwt.verify(token, getJwtSecret())` 验签名和过期时间。
4. 用 token 里的 `userId` 重新查数据库。
5. 把安全版 user 放到 `req.user`。

### 2.3 英文口试版

> JWT is used for authentication. After login, the backend signs a token containing the user's ID and role, with a default two-hour expiry. The frontend sends it in the `Authorization: Bearer` header. On protected routes, `authMiddleware` verifies the token, reloads the user from MongoDB, and attaches a safe user object to `req.user`. JWT proves identity; role middleware handles authorisation.

### 2.4 追问：JWT 和 bcrypt 是什么关系？

不要说 JWT 加密密码。

正确说：

> Passwords are hashed with bcrypt before storage. JWT is only issued after the password check succeeds. bcrypt protects stored passwords; JWT proves the logged-in user's identity in later requests.

---

## 3. 高频题 2：Token 过期以后怎么处理？

先分清楚两个 token：

| token | 用途 | 过期时间 | 过期时返回 |
|---|---|---:|---|
| Login JWT | 证明用户是谁 | 默认 2 小时 | `401 Token expired` |
| `attemptToken` | 证明这次 quiz 的题目和选项顺序 | 2 小时 | `401 Attempt token expired` |

### 3.1 Login JWT 过期

流程：

```text
Frontend sends old JWT
  -> authMiddleware
  -> jwt.verify()
  -> TokenExpiredError
  -> 401 { success: false, error: "Token expired" }
```

前端处理：

- app 启动时 `/auth/me` 失败，会清掉 localStorage 里的 `jwt` 和 `user`。
- start/submit quiz 时如果遇到 401，`QuizContext` 会 `logout()`，并提示重新登录。

英文口试版：

> If the login JWT expires, `authMiddleware` catches `TokenExpiredError` from `jwt.verify` and returns `401` with `"Token expired"`. The frontend then clears stored authentication or asks the user to sign in again.

### 3.2 attemptToken 过期

`attemptToken` 是 start quiz 时签的，TTL 是：

```js
ATTEMPT_TOKEN_TTL_SECONDS = 2 * 60 * 60
```

submit 时：

```text
submitQuiz
  -> verifyAttemptToken(attemptToken, req.user.id)
  -> expired
  -> 401 { success: false, error: "Attempt token expired" }
```

结果：

- 不会计分。
- 不会保存 Score。
- 用户需要重新开始 quiz。

英文口试版：

> If the quiz attempt token expires, `verifyAttemptToken` maps it to an `expired` error. `submitQuiz` returns `401` with `"Attempt token expired"`. The expired attempt is rejected and not scored, so the user must start a new quiz.

### 3.3 一句话区别

> Login JWT expiry means the user's session is no longer trusted. `attemptToken` expiry means that specific quiz attempt is no longer accepted.

---

## 4. 高频题 3：Quiz 的核心逻辑是什么？

导师问 “quiz core logic” 时，不要只说“用户答题然后得分”。要按 **Start Quiz** 和 **Submit Quiz** 两阶段讲。

### 4.1 Start Quiz

```text
GET /api/quiz/start
  -> authMiddleware
  -> forbidAdminQuiz
  -> Question.aggregate()
  -> $match active questions
  -> $sample 10 questions
  -> generateOptionOrder()
  -> signAttemptToken()
  -> strip correctAnswer / explanation
  -> return attemptToken + public questions
```

关键解释：

- `authMiddleware`：确认用户已登录。
- `forbidAdminQuiz`：admin 不能作为 player 答题。
- `$sample`：随机抽 10 道 active questions。
- `generateOptionOrder()`：每道题四个选项单独打乱。
- `attemptToken`：锁定这次 quiz 的 userId、attemptId、questionIds、optionOrder。
- `toStartQuizPayload()`：发给前端时不包含正确答案和解释。

### 4.2 Submit Quiz

```text
POST /api/quiz/submit
  -> authMiddleware
  -> forbidAdminQuiz
  -> quizSubmitLimiter
  -> verifyAttemptToken()
  -> validate exactly 10 answers
  -> check submitted question IDs match token
  -> reject duplicate attemptId
  -> fetch real questions from MongoDB
  -> map selectedAnswer through optionOrder
  -> calculate score server-side
  -> save Score
  -> return score + review
```

关键解释：

- 后端不相信前端报分。
- 前端只提交用户选了屏幕上的第几个选项。
- 后端用 `optionOrder` 翻译回数据库原始选项。
- `Score.exists({ attemptId })` 和 unique index 防重复提交。

### 4.3 英文口试版

> The quiz core has two phases: start and submit. On start, the backend authenticates the user, blocks admins, randomly samples 10 active questions, shuffles option order, signs an attempt token, strips answer fields, and returns public questions. On submit, the backend verifies the attempt token, validates exactly 10 answers, checks that submitted question IDs match the token, rejects duplicate submissions, maps selected answers through `optionOrder`, recalculates score server-side, saves `Score`, and returns review data.

---

## 5. 高频题 4：如何随机选择题目？

### 5.1 老奶奶版

后端不是按顺序发题，而是：

1. 先只看 active 的题。
2. 让 MongoDB 随机抽 10 道。
3. 如果 active 题少于 10 道，就报错。
4. 抽完题以后，再单独打乱每道题的四个选项。

### 5.2 源码逻辑

```js
const raw = await Question.aggregate([
  { $match: { active: true } },
  { $sample: { size: QUIZ_LENGTH } },
  {
    $project: {
      questionText: 1,
      options: 1,
      topic: 1,
      correctAnswer: 1,
    },
  },
]);
```

关键点：

- `QUIZ_LENGTH = 10`
- `$match: { active: true }`：只抽启用题。
- `$sample: { size: QUIZ_LENGTH }`：MongoDB 随机抽 10 题。
- `$project`：只取后续需要的字段。
- 如果不足 10 题，返回 400：`Not enough active questions in database`。

### 5.3 最容易混的点

随机有两层：

| 随机类型 | 代码 | 作用 |
|---|---|---|
| 随机抽题 | MongoDB `$sample` | 从题库抽 10 道题 |
| 随机选项顺序 | `generateOptionOrder()` | 打乱每道题四个选项 |

英文口试版：

> Questions are randomly selected in the backend using a MongoDB aggregation pipeline. The controller first filters active questions with `$match`, then uses `$sample` with `QUIZ_LENGTH`, which is 10, to randomly select quiz questions. If there are fewer than 10 active questions, the backend returns a clear 400 error. Option order is shuffled separately with `generateOptionOrder()`.

---

## 6. 高频题 5：attemptToken 是什么？为什么需要？

### 6.1 一句话

> JWT proves who the user is. `attemptToken` proves which quiz attempt is being submitted.

中文：

> JWT 证明“你是谁”；attemptToken 证明“你这次 quiz 的试卷是什么”。

### 6.2 attemptToken 里有什么

```js
{
  purpose: 'quiz_attempt',
  userId: String(userId),
  attemptId,
  items: [
    { qid: '...', order: [2, 0, 3, 1] }
  ]
}
```

它锁住：

- 这次 quiz 属于哪个 user。
- 这次 quiz 的 attemptId。
- 这次 quiz 的 10 个 questionId。
- 每道题的 optionOrder。
- 过期时间 2 小时。

### 6.3 防什么

如果没有 attemptToken，用户可能：

- 换 questionId。
- 少交/多交答案。
- 拿别人的题目提交。
- 改选项顺序。
- 重复提交同一次 quiz。

英文口试版：

> `attemptToken` protects quiz attempt integrity. It is signed server-side and includes the user ID, attempt ID, exact question IDs, and option order for each question. On submit, the backend verifies the token before scoring, so the frontend cannot change the question set or option mapping.

---

## 7. 高频题 6：optionOrder 怎么计分？

数据库原始选项：

```text
0 = A
1 = B
2 = C  <-- correctAnswer = 2
3 = D
```

本次 quiz 打乱：

```text
optionOrder = [2, 0, 3, 1]
```

用户看到：

```text
visible[0] = original[2] = C
visible[1] = original[0] = A
visible[2] = original[3] = D
visible[3] = original[1] = B
```

如果用户选第 0 个：

```text
selectedAnswer = 0
originalIndex = optionOrder[selectedAnswer]
              = optionOrder[0]
              = 2
```

因为数据库正确答案也是 2，所以答对。

源码核心：

```js
const originalIndex = item.order[ans.selectedAnswer];
const isCorrect = originalIndex === question.correctAnswer;
```

英文口试版：

> The frontend submits the visible shuffled index. The backend uses `optionOrder` from the signed attempt token to map that visible index back to the original question-bank index, then compares it with `question.correctAnswer`.

---

## 8. 高频题 7：为什么后端不能相信前端？

这是所有 quiz 安全题的总答案。

前端在用户浏览器里，用户可以改：

- localStorage
- request body
- questionId
- selectedAnswer
- attemptToken
- API call order

所以关键逻辑必须在后端：

- JWT 在后端验。
- role 在后端验。
- question IDs 在后端验。
- attemptToken 在后端验。
- score 在后端算。
- duplicate attempt 在后端挡。

英文口试版：

> The frontend is not a security boundary because it runs in the user's browser. Users can modify local storage or API requests. Therefore, the backend must verify JWTs, enforce roles, validate submitted question IDs, verify attempt tokens, calculate score server-side, and reject duplicate attempts.

---

## 9. 显而易见但可能被顺手问的实现细节

这些不是最高频主线，但导师很容易追问一句 “how did you implement that?”。你不用展开太久，知道关键词即可。

### 9.1 选项顺序是如何打乱的？

实现文件：`backend/src/utils/shuffleQuestion.js`

实现方式：

1. `generateOptionOrder()` 先生成 `[0, 1, 2, 3]`。
2. 用 Fisher-Yates 风格的交换逻辑和 `Math.random()` 打乱这个数组。
3. `applyOptionOrder(question, order)` 用 `order.map(index => opts[index])` 生成前端看到的选项顺序。
4. 正确答案也要跟着换位置：`correctAnswer: order.indexOf(correctIdx)`。
5. `optionOrder` 会被签进 `attemptToken`，submit 时用来计分，也会保存进 `Score.answers[i].optionOrder`，Review Mode 才能还原当时顺序。

英文一句话：

> Option order is shuffled by generating a permutation of `[0,1,2,3]`, applying it to the options, signing it into the attempt token, and later using it to map the visible selected index back to the original correct answer index.

### 9.2 抽题是如何实现的？

实现文件：`backend/src/controllers/quiz.controller.js`

实现方式：

1. `Question.aggregate()` 建一个 MongoDB aggregation pipeline。
2. `$match: { active: true }` 只从启用题里抽。
3. `$sample: { size: QUIZ_LENGTH }` 随机抽 10 道。
4. `$project` 只保留后面要用的字段。
5. 如果 active 题不足 10 道，返回 400，不让 quiz 半残开始。

英文一句话：

> Random question selection is done server-side with MongoDB aggregation: match active questions, sample 10 using `$sample`, project the needed fields, and return a 400 error if there are not enough active questions.

### 9.3 做 quiz 时如何防止误触退出？

相关 commit：`06697e1 fix: guard active quiz navigation`

实现文件：

- `frontend/src/App.jsx`
- `frontend/src/contexts/QuizContext.jsx`
- `frontend/src/components/navbars/PlayerNavbar.jsx`

实现方式：

1. `QuizContext` 用 `hasActiveQuiz` 判断是否正在 quiz / calculating。
2. `ActiveQuizNavigationGuard` 监听 `beforeunload`，防止刷新或关闭页面直接丢失 quiz。
3. 它还监听 `popstate`，也就是浏览器返回按钮。
4. 它拦截站内链接点击，离开 quiz 前弹确认框。
5. Player navbar 的 logout / restart 也会先调用 `confirmActiveQuizExit()`。

英文一句话：

> Active quiz navigation is guarded on multiple exits: browser unload, back navigation, internal link clicks, logout, and restart. If a quiz is active, the user must confirm before leaving, otherwise the navigation is cancelled.

### 9.4 Admin page 的分页、搜索、高亮怎么做？

相关 commit：

- `a3b4891 feat: improve admin search and mobile layout`
- `ff21e63 feat: improve admin question bank controls`

实现文件：`frontend/src/pages/AdminPage.jsx`

实现方式：

1. `searchQuery` 保存搜索词。
2. `getQuestionSearchText()` 把 question text、options、正确选项、explanation、topic、active/inactive 合并成一段 searchable text。
3. 搜索时统一 trim + lowercase，所以大小写不敏感。
4. `filteredQuestions` 先过滤，再用 `pageSize` 和 `currentPage` 计算当前页。
5. 页大小支持 `[10, 25, 50]`。
6. `renderHighlightedText()` 把匹配片段包进 `<mark className="admin-search-highlight">`，所以页面能高亮命中词。

英文一句话：

> Admin search builds a searchable text string from question fields, filters questions case-insensitively, paginates the filtered result, and highlights matched text with a `<mark>` element.

### 9.5 重复导入是如何防住的？

相关 commit：

- `76b54a4 fix: protect admin question imports`
- `4a3be10 fix: harden admin question validation`

实现文件：

- `frontend/src/components/BulkImport.jsx`
- `backend/src/controllers/admin.controller.js`

前端先挡一层：

1. 支持 JSON array 或 `{ questions: [...] }`。
2. 用 Zod 校验 questionText、options、correctAnswer、active、explanation、topic。
3. 用 `normalizeTextForCompare()` 把 questionText trim、合并空白、转小写。
4. 用 `Map` 检查同一个导入文件里有没有重复 questionText。
5. 错误会指出 `Question N`。

后端再挡一层：

1. 再次校验每道题，不能相信前端。
2. `getBulkDuplicateErrors()` 检查 batch 内重复。
3. 再查数据库里是否已经有相同 questionText。
4. 查数据库时用 regex 处理大小写和空白差异。
5. 如果重复，返回 409；只有完全干净才 `insertMany(..., { ordered: true })`。

英文一句话：

> Bulk import duplicate protection is done both client-side and server-side. The frontend validates JSON and catches duplicate rows in the import file, while the backend re-validates, checks duplicates within the batch and against existing database questions, then only inserts if the whole batch is clean.

### 9.6 你的 commit 历史里还能提什么？

如果 tutor 问 “besides JWT / quiz, what else did you contribute?”，可以按含金量顺序说：

| commit | 可以怎么讲 |
|---|---|
| `73d24c6 feat: secure quiz attempts and add frontend tests` | attemptToken、optionOrder、Score 保存、route tests，是最能体现技术深度的贡献 |
| `f5d3d98 test: lock shuffled quiz answer mapping` | 用测试锁住“打乱选项后仍能正确计分” |
| `06697e1 fix: guard active quiz navigation` | 防误触退出 quiz，保护用户正在进行的 attempt |
| `a3b4891 feat: improve admin search and mobile layout` | Admin 搜索、分页、高亮、移动端布局 |
| `ff21e63 feat: improve admin question bank controls` | Admin question bank 控件和管理体验 |
| `76b54a4 fix: protect admin question imports` | bulk import 权限和导入保护 |
| `4a3be10 fix: harden admin question validation` | questionText、options、duplicates、explanation/topic 的校验加固 |
| `58187e5 fix: align response envelope contract` | 统一 `{ success: true, data }` / `{ success: false, error }` |

不要把这些都背成一大段。口试时只挑和问题相关的一个例子讲。

### 9.7 Admin / Leaderboard 低频兜底句

Admin：

> Admin CRUD was mainly Role C. My Role D angle is integration: protected admin routes, shared response envelopes, validation hardening, bulk import protection, search/pagination polish, documentation, and tests.

Leaderboard：

> Leaderboard data logic was mainly Role B. My Role D angle is integration and access control. I understand the aggregation: it ranks each user by best score, breaks ties by the earliest time that best score was achieved, limits to top 50, and joins usernames with `$lookup`.

UI / CSS / Theme：

> My UI-related work was mainly shared shell and theme integration, not the main technical risk area. The oral focus should be backend design, security, authentication, routing, and quiz integrity.

---

## 10. 最后 10 分钟背诵版

### 10.1 JWT

> JWT proves user identity. The backend signs it after login with user ID and role, the frontend sends it as `Authorization: Bearer`, and `authMiddleware` verifies it before protected routes.

### 10.2 Token 过期

> Login JWT expiry returns `401 Token expired`. Quiz `attemptToken` expiry returns `401 Attempt token expired`. Expired attempts are rejected and not scored.

### 10.3 Quiz 核心逻辑

> Start quiz authenticates the user, blocks admins, randomly samples 10 active questions, shuffles option order, signs an attempt token, and hides answers. Submit verifies the token, checks question IDs, maps answers through optionOrder, calculates score server-side, saves Score, and returns review.

### 10.4 随机抽题

> Random question selection uses MongoDB aggregation: `$match` active questions, then `$sample` 10 questions. Option shuffling is separate and uses `generateOptionOrder()`.

### 10.5 attemptToken

> JWT proves identity. `attemptToken` proves attempt integrity: user ID, attempt ID, exact question IDs, and option orders.

### 10.6 optionOrder

> `selectedAnswer` is the visible shuffled index. The backend maps it through `optionOrder` back to the original option index before comparing with `correctAnswer`.

### 10.7 后端安全边界

> Frontend guards are UX. Backend middleware is the real security boundary because API requests can be called directly.

---

## 11. 千万不要说

| 不要说 | 应该说 |
|---|---|
| JWT encrypts passwords | bcrypt hashes passwords; JWT carries signed identity claims |
| attemptToken is just JWT | It is JWT-like, but it protects quiz attempt integrity |
| Frontend guard is enough | Backend middleware is the real security boundary |
| selectedAnswer equals correctAnswer | selectedAnswer must be mapped through optionOrder first |
| GET /api/quiz/start is perfectly RESTful | It works here, but POST would be cleaner |
| Expired attemptToken can still submit | No, it returns 401 and is not scored |
| I built all Admin and Leaderboard | Those were mainly other roles; I handled integration and robustness |

---

## 12. 打开代码时只看这些文件

| 问题 | 文件 |
|---|---|
| JWT 签发 | `backend/src/controllers/auth.controller.js` |
| JWT 验证 | `backend/src/middleware/auth.middleware.js` |
| JWT secret | `backend/src/config/auth.js` |
| quiz start / submit | `backend/src/controllers/quiz.controller.js` |
| quiz routes | `backend/src/routes/quiz.routes.js` |
| attemptToken | `backend/src/utils/quizAttemptToken.js` |
| optionOrder | `backend/src/utils/shuffleQuestion.js` |
| quiz constants | `backend/src/config/quiz.js` |
| response envelope | `backend/src/utils/responseEnvelope.js` |
| frontend API token header | `frontend/src/api/api.js` |

---

## 13. 口试现场答题模板

如果导师问一个你没完全准备的问题，用这个结构：

```text
1. Start with the purpose:
   "The purpose of this part is..."

2. Explain the flow:
   "The request goes from frontend to api.js, then route, middleware, controller, model."

3. Name the security boundary:
   "The backend is the real security boundary."

4. Mention exact code concept:
   "This is handled by authMiddleware / verifyAttemptToken / $sample / optionOrder."

5. Admit ownership clearly:
   "That feature was mainly Role A/B/C; my Role D contribution is integration and robustness."
```

最后一句万能兜底：

> At implementation level, the key idea is that the backend verifies the trusted state and the frontend only presents the user experience.
