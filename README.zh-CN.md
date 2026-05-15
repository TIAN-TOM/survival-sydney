# COMP5347 Assignment 2 - MERN Quiz Platform

[English](README.md) | [中文](README.zh-CN.md)

这是为 COMP5347 Assignment 2 构建的全栈单人 Quiz 应用。玩家端体验围绕面向留学生的 Sydney Life Survival Quiz 主题组织，包含注册/登录、动态 10 题答题流程、完成后的 Review Mode、历史记录、后端 leaderboard data，以及用于管理题库的 Admin 界面。

## 🧭 快速概览

| 项目 | 内容 |
|---|---|
| Approved variation | 完成后的 Review Mode |
| Quiz 长度 | 固定 10 题 |
| 一键运行 | `npm run demo` |
| Admin demo 账号 | `admin` / `AdminPass123` |
| Player demo 账号 | `player1` / `PlayerPass123`, `player2` / `PlayerPass123` |
| Seed 题库 | 来自源 JSON 的 50 道悉尼生活题 |
| 前端视觉主题 | Sydney University 赭橙/橙红 + 炭黑风格，并使用悉尼生活题库相关首页文案 |
| API 文档 | `http://localhost:5001/api-docs` |

## 🧩 功能特性

- 本地用户名/密码认证，使用 bcrypt 和 JWT。
- 玩家/Admin 角色权限控制。
- 从 active questions 动态生成 quiz attempts。
- 悉尼生活题库包含题干、四个选项、正确答案索引、active 状态和可选 explanation。
- 从 active questions 中生成固定长度 quiz。
- 固定 10 题，保证排行榜分数可比较。
- 产品化的 Sydney Life Quiz 首页已对齐 seed 题库主题，并采用 USYD 风格的赭橙/橙红 + 炭黑视觉系统。
- 每题只能选择一次，选择后锁定。
- Review Mode 在原题仍存在时展示用户答案、正确/错误、正确答案和 explanation。
- Admin 题目 CRUD、active/inactive toggle、JSON 批量导入和校验。
- Player/Admin 共用的持久化 dark mode。
- Swagger API 文档和 Postman collection。
- 后端 Supertest/Jest 覆盖核心 API 流程。

## 🧱 技术栈

| 层级 | 技术 |
|---|---|
| Frontend | React, Vite, React Router, Context + useReducer |
| Forms | React Hook Form, Zod |
| Backend | Node.js, Express |
| Database | 本地 MongoDB, Mongoose |
| Auth | bcrypt, JSON Web Token |
| API docs | Swagger/OpenAPI, Postman |
| Testing | Jest, Supertest |

## 👥 团队分工

| 成员 | 角色 | 主要子系统 |
|---|---|---|
| Tracy Cui | A | Authentication, JWT, role checks, login/register UI |
| Raven Ge | B | Quiz flow, scoring, Review Mode, history, leaderboard data |
| Allen Ji | C | Admin question CRUD, active toggle, bulk import |
| Tom Tian | D | Integration, response envelope, error handling, theme, docs, tests |

主要后端/前端入口文件中也标注了对应 subsystem ownership。

## 🔀 Git Workflow 与 Marker Evidence

仓库托管在 Sydney University GitHub Enterprise：

```text
https://github.sydney.edu.au/wege8390/COMP4347-COMP5347-Assignment-2--Group5
```

最终集成分支是 `dev`，小组 review 并验证完整实现后再合并到 `main`。Marker 可以在本地用以下命令查看贡献历史：

```bash
git log --all --graph --oneline --decorate
git shortlog -sne --all
```

每位同学的 Individual Reflection 应单独引用自己的 commit evidence，并解释自己负责的 subsystem decisions。

## 🚀 快速开始

### 前置要求

- Node.js 20 或更高版本
- npm
- Docker，用于本地 MongoDB

### 一键运行 Demo

```bash
npm run demo
```

这个命令会在本地 `.env` 文件缺失时自动创建它们，安装缺失依赖，在本地 MongoDB 不可用时启动 Docker MongoDB container，写入 demo 题目和 demo 用户，然后同时启动 backend 和 frontend。

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Swagger UI: `http://localhost:5001/api-docs`
- Admin login: `admin` / `AdminPass123`
- Player logins: `player1` / `PlayerPass123`, `player2` / `PlayerPass123`

如需只停止该 helper 创建的 demo MongoDB container：

```bash
npm run demo:stop
```

### 手动配置

#### 1. 启动本地 MongoDB

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

后端默认连接：

```bash
MONGODB_URI=mongodb://localhost:27017/comp5347_quiz
```

#### 2. 安装依赖

```bash
npm install
npm run install:all
```

#### 3. 配置环境变量

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

后端环境变量：

```bash
JWT_SECRET=replace-with-a-long-local-secret
JWT_EXPIRES_IN=2h
MONGODB_URI=mongodb://localhost:27017/comp5347_quiz
CLIENT_ORIGIN=http://localhost:5173
```

前端环境变量：

```bash
VITE_API_BASE_URL=http://localhost:5001/api
```

在 Jest test 环境之外，如果没有配置 `JWT_SECRET`，后端会拒绝启动。

#### 4. 写入演示数据

```bash
npm run seed --prefix backend
```

Seed 后的 admin 账号：

```text
username: admin
password: AdminPass123
```

Seed 后的 player 账号：

```text
username: player1
password: PlayerPass123

username: player2
password: PlayerPass123
```

Seed 同时会从 `backend/src/seeds/data/sydney_life_survival_quiz_50_questions.json` 创建 50 道悉尼生活 active questions。源题库覆盖抵达基础、交通、租房与消费权益、工作/税务/健康，以及安全/海滩/防诈骗，给固定 10 题随机 quiz 提供足够余量。

#### 5. 运行应用

```bash
npm run dev
```

- Backend: `http://localhost:5001`
- Frontend: `http://localhost:5173`
- Swagger UI: `http://localhost:5001/api-docs`

## 🗂️ 项目结构

```text
.
├── backend/                 # Express API, Mongoose models, tests, Swagger
├── frontend/                # React/Vite application
├── docs/                    # 架构、Postman、手测清单、交付准备记录
├── package.json             # 根目录辅助脚本
└── README.md
```

## 🏗️ 系统架构

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

后端通过 `backend/src/utils/responseEnvelope.js` 返回统一 response envelope。前端通过 `frontend/src/api/api.js` 访问 quiz/admin API，受保护请求会携带 bearer JWT。

## 👀 Review Mode Variation

本组批准的 variation 是完成答题后的 Review Mode。提交 quiz 后，用户可以查看每道题、自己的选择、是否正确、正确答案和可选 explanation。

Variation scope boundary：Review Mode 是唯一已实现的 approved variation。本应用没有实现 timed questions、用户先选择 category 的 quiz flow、image-based questions、multiplayer、real-time behaviour、adaptive branching、metadata-balanced sampling 或任何替代计分规则。

设计决策：

- `Question.explanation` 是 optional，方便题库逐步补充解析。
- `Score.answers` 保存 `questionId`、`selectedAnswer` 和 `isCorrect`。
- 应用使用 `Question` 和 `Score` collection，不新增持久化 `Quiz` collection。
- Review/history endpoints 从当前 `Question` documents 重新展开 review 数据；如果原题已删除，会显示 deleted-question placeholder。

## 🏆 Quiz 与排行榜规则

- Quiz 长度：固定 10 题。
- 题目选择：后端每次从 active questions 中随机抽取 10 题。
- 计分：每道正确答案 +1，无负分。
- 排行榜：后端返回每个用户的最佳成绩，按分数降序排序；当前后端 leaderboard endpoint 是 public，前端 `/leaderboard` route 受保护但仍只渲染 placeholder。tie-break 排序和 admin-score filtering 需要 quiz/leaderboard owner 在最终提交前跟进。

## 📘 API 文档

- Swagger UI: `http://localhost:5001/api-docs`
- Postman collection: [`docs/postman-collection.json`](docs/postman-collection.json)
- Security and validation map: [`docs/security-validation.md`](docs/security-validation.md)

主要路由组：

- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `/api/quiz/start`, `/api/quiz/submit`, `/api/quiz/history`, `/api/quiz/history/:id`, `/api/quiz/leaderboard`
- `/api/admin/questions`, `/api/admin/questions/:id`, `/api/admin/questions/:id/toggle`, `/api/admin/questions/bulk-import`

## 🔒 Security 与 Validation

| 要求 | 实现 |
|---|---|
| 本地认证 | 用户通过 username/password 注册和登录；密码入库前使用 bcrypt hash。 |
| JWT protected routes | Quiz start、submit、history/review 和 admin routes 要求 `Authorization: Bearer <token>`；当前后端 leaderboard endpoint 是 public，尽管前端 route 受保护。 |
| Backend RBAC | `/api/admin/*` 同时要求已认证且 `role === "admin"`。 |
| Frontend RBAC | Admin 导航和 `/admin` 通过 `ProtectedRoute adminOnly` 限制。 |
| Rate limiting | Login 通过 `backend/src/middleware/rateLimiters.js` 使用 `express-rate-limit`；quiz submit limiter helper 已定义但尚未挂载。 |
| Server validation | Auth routes 使用 Zod validators；quiz 和 admin controllers 使用显式请求检查以及 Mongoose validation。 |
| Injection/XSS protection | 使用 `helmet`、`express-mongo-sanitize`、严格 validation，以及 React 默认 escaping；应用不渲染用户 HTML。 |
| Error safety | 全局 error middleware 隐藏 5xx 内部细节，并保持统一 failure envelope。 |

## 🛠️ 常用脚本

```bash
npm run demo              # 准备 env、MongoDB、seed data，然后运行完整 demo
npm run demo:stop         # 停止 helper 创建的 demo MongoDB container
npm run install:all       # 安装 backend 和 frontend 依赖
npm run dev               # 同时运行 backend 和 frontend
npm test --prefix backend # 运行后端 Jest/Supertest 测试
npm run build --prefix frontend
```

## ✅ 验证命令

```bash
npm test --prefix backend -- --runInBand
npm run build --prefix frontend
python3 -m json.tool docs/postman-collection.json >/dev/null
JWT_SECRET=test-local-secret node -e "require('./backend/src/app'); console.log('app-load-ok')"
git diff --check
```

后端测试覆盖 auth、quiz start/submit/history/review data、leaderboard、admin access、admin CRUD 和 invalid bulk import index 等核心路径。

更多手测步骤见 [`docs/manual-test-checklist.md`](docs/manual-test-checklist.md)。交付准备记录见 [`docs/delivery-readiness.md`](docs/delivery-readiness.md)。

## ✨ Additional Evidence

当前实现包含实用的 Sydney-life 题库、统一 API response envelope、JWT/RBAC 保护、login rate limiting、前端表单校验和主题化 React shell。除非后续分支真正实现，否则不要声称 metadata-balanced sampling、deleted-question durable snapshots 或 `/api/quiz/review/:attemptId`。
