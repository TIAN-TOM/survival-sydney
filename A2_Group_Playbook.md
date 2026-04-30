# Assignment 2 MERN Quiz App — Execution Playbook (v3.0)

> **课程：** COMP4347/5347 Web Application Development
> **学期：** Semester 1, 2026
> **性质：** 4 人小组全栈项目 + 个人反思组件
> **时长：** **2 周冲刺**(Week 1 基础设施 + 核心功能;Week 2 打磨 + 文档 + 提交)。submission 截止与 demo 时段以 Spec metadata + tutor lab schedule 为准
> **总分：** 100 分 + 最多 5 分 bonus(封顶 100%)
> **我们的 Variation：** Review Mode after completion ✅ tutor 已口头确认(待补 Ed 私信存档)
> **小组：** 4 人组 — Tracy Cui (A) / Raven Ge (B) / Allen Ji (C) / Tom Tian (D)
> **Repo：** `https://github.sydney.edu.au/wege8390/COMP4347-COMP5437-Assignment-2---Full-Stack-Group-Project`(单 repo 路径,tutor 已同意豁免 Ed #157 的 Org 默认要求)

> ⚠️ **本文件是衍生文档,权威来源是 Spec + Ed Supplement 这一对源文件。**
>
> - 当本 Playbook 和源文件冲突时,**源文件赢**:`A2_Specification.md`(canonical 规格) + `A2_Ed_Discussion_Supplement.md`(Ed staff 澄清,可覆盖 spec)
> - 所有事实性断言通过 `[Spec §X]` / `[Ed #N]` 标注追溯到源
>
> **改源文件不会自动同步本文件。** 如发现本文件与源文件矛盾,立即修本文件。

> 🆕 **v3.0 = v2.9 战略框架 + v2.8 执行细节融合版**
>
> **保留 v2.9 的(战略层):**
> - 分工:B 写 leaderboard 后端 + D 写前端(分层正确,B 是 Score model owner)
> - History 留给 B(数据 owner 写自己 endpoint)
> - Tracy 覆盖 AuthContext + Login/Register 前端组件
> - Tom 覆盖 Home page
> - §6 Documentation/Test/Schema Ownership 规则(防 D 累死 + 保护每人 evidence)
> - §6 Cross-Pair Sync 6 项 contract 列表 + ADR 决议留痕
> - §8 内联 🚧 critical path 标记
>
> **从 v2.8 移植回来的(执行层):**
> - §8.5 三层测试策略(Jest 单元 + Postman + 手测清单),但 owner 按 v2.9 原则
> - §8.6 Daily check-in vs Daily journal:两个都要做 + Generic vs Specific reflection 示例
> - §9 README Day 1 placeholder skeleton(按 v2.9 ownership 表重新分配占位符)
>
> **未纳入(用户明确要求):** 5 分钟 demo 时间预排、排练 2 次流程

---

## 目录

0. [术语速查(先看这里)](#0-术语速查先看这里)
1. [作业在讲什么(一页纸概览)](#1-作业在讲什么一页纸概览)
2. [评分拆解与优先级](#2-评分拆解与优先级)
3. [硬性技术约束(不遵守即扣分)](#3-硬性技术约束不遵守即扣分)
4. [Variation 深度:Review Mode 怎么做](#4-variation-深度review-mode-怎么做)
5. [需要掌握的知识地图](#5-需要掌握的知识地图)
6. [四人分工方案(含 pair 结构 + ownership 规则)](#6-四人分工方案含-pair-结构--ownership-规则)
7. [Week 1 必须锁死的共享基础设施](#7-week-1-必须锁死的共享基础设施)
8. [2 周时间线](#8-2-周时间线)
   - 8.5 [测试策略与 QA 分摊](#85-测试策略与-qa-分摊)
   - 8.6 [Daily check-in vs Daily journal:两个都要做](#86-daily-check-in-vs-daily-journal两个都要做)
9. [交付清单](#9-交付清单)
10. [Demo 准备与口头问答预案](#10-demo-准备与口头问答预案)
11. [风险清单与避坑指南](#11-风险清单与避坑指南)

---

## 0. 术语速查(先看这里)

> Playbook 里高频出现的专业词汇及简明解释。**对零基础转码同学:遇到不认识的术语先翻这里。** 后面章节会直接使用这些词,不再重复解释。

### 后端基础设施

- **Node.js** —— JavaScript 的服务端运行环境(让 JS 不只能跑在浏览器里,也能跑服务器)
- **Express** —— 基于 Node 的 Web 框架,几行代码就能搭一个 HTTP 服务,处理路由和请求
- **MongoDB** —— 一种 NoSQL 文档数据库;数据按"文档"存(类似 JSON 对象的结构)
- **Mongoose** —— Node 和 MongoDB 之间的桥梁库;让你用 JS 对象的方式操作数据库

### 三层架构

- **Routes(路由)** —— 定义 URL 长什么样、哪个 HTTP 方法(GET/POST/PUT/DELETE)触发哪个处理函数
- **Controllers(控制器)** —— 处理具体业务的函数:从 request 拿数据 → 调 model 操作数据库 → 返回 response
- **Models(数据模型)** —— 定义某种数据在数据库里长什么样(哪些字段、什么类型)+ 提供查询/保存方法
- **Middleware(中间件)** —— 请求到达 controller 之前必经的一道处理函数;常用于做认证、校验、日志、限流等通用逻辑

### 数据 & 查询

- **Schema** —— 数据形状定义;规定一条数据应有哪些字段、各字段是什么类型
- **Mongoose population(关联查询)** —— 数据 A 里只存了一个引用 ID 指向数据 B;populate 自动用这个 ID 去查 B 的完整内容、填进 A 里返回(前端不用再单独发请求)
- **Aggregation query** —— MongoDB 的复杂查询管道,能做分组、排序、统计(例如 leaderboard 的"每用户最高分"查询)

### 认证 & 安全

- **JWT (JSON Web Token)** —— 登录后服务端发给前端的一段加密字符串令牌;前端每次请求带着它证明身份,服务端用密钥验证
- **Hash(哈希)** —— 把密码经过单向不可逆运算变成乱码字符串存起来;即使数据库泄露,也看不到原密码
- **bcrypt** —— 一个标准的密码 hash 库,自动加 salt(盐)防 rainbow table 攻击
- **Rate limiting(限流)** —— 限制同一 IP/用户在单位时间内能调多少次某个端点;防暴力破解和滥用
- **Injection / XSS** —— 两类常见 Web 攻击。**Injection** 是攻击者把恶意代码塞进输入字段让数据库执行;**XSS**(跨站脚本攻击)是让别人浏览器执行恶意 JS。`helmet` + `express-mongo-sanitize` 是两个常用挡这些攻击的库
- **Sanitize(消毒/净化)** —— 在用用户输入之前先过一遍,移除危险字符

### API 设计

- **RESTful API** —— 一种 API 设计风格:资源(如 questions)用 URL 表示(`/api/questions`),HTTP 动词决定动作(GET 查 / POST 创建 / PUT 改 / DELETE 删)
- **Response envelope(响应信封)** —— 所有 API 返回都包一层统一结构 `{ success, data?, error? }`;前端拿到的形状永远一致,方便统一处理

### 前端

- **React functional components** —— 用普通 JS 函数写组件(不是 class);现在 React 推荐这种写法
- **Hooks** —— React 16.8+ 的特性,让函数组件也能有 state、生命周期。`useState` / `useEffect` / `useContext` / `useReducer` 都是 hooks
- **React Context** —— 把数据从顶层组件传给深层后代,不用一层层 props 往下传
- **useReducer** —— 比 `useState` 更适合复杂 state 管理;状态变化通过 dispatch action 触发,逻辑集中在 reducer 函数里
- **React Hook Form (RHF)** —— 管理表单状态、收集用户输入、做客户端验证的 React 库
- **Zod** —— 运行时数据验证库;和 RHF 配合给表单做 schema-based 验证;同一份 schema 也能在后端复用
- **Zustand** —— 一个轻量的 React 状态管理库(替代 Context+useReducer 或 Redux)

### 工程工具

- **Vite** —— 现代前端构建工具(编译/打包/热重载);比老版 Create React App 快很多
- **Swagger / OpenAPI** —— 用 JSDoc 风格的注释自动生成 API 文档页(挂在 `/api-docs` 路径)
- **Mermaid** —— 一种用文本写图的语法;GitHub README 里直接用 ` ```mermaid ` 代码块就能渲染流程图、序列图等
- **Conventional commits** —— commit message 的标准前缀写法:`feat:` 新功能 / `fix:` 修 bug / `refactor:` 重构 / `docs:` 文档 / `test:` 测试
- **ADR (Architecture Decision Record)** —— 一种简短的决议留痕格式:决议日期 + 涉及成员 + 决议原文 + 上下文。本组用在 `docs/integration-decisions.md`

### Git 工作流

- **Feature branch(功能分支)** —— 每个功能开一个独立分支开发,做完通过 PR 合并回 main,不直接在 main 上 commit
- **PR (Pull Request)** —— 在 GitHub 上发起的"我要把这个分支合到那个分支,请 review"的请求
- **Squash merge vs regular merge** —— Squash 把分支上多个 commit 合成一个再 merge(commit 历史变干净但失去过程);Regular merge 保留所有原始 commit(个人贡献历史完整保留,本作业评分需要这个)

---

> 💡 **做事方针(先读这一句再读后面):** 简洁的代码 = 高分。Spec 要求什么就做什么,**不主动加"我觉得更好"的改动**。详细评分逻辑见 [§2 拿分原则](#2-评分拆解与优先级)。

---

## 1. 作业在讲什么(一页纸概览)

**应用形态:** 一个单人制的在线 quiz 游戏,不是多人、不是实时、不是自适应题库。

**两个子系统:**
- **Player Interface:** 用户注册/登录 → 抽题 → 答题 → 看分数 → 查历史记录 → 看排行榜
- **Admin Interface:** 管理员登录 → CRUD 题目 + 切换启用状态 → 通过 textarea 贴 JSON 批量导入

**核心游戏规则(禁止改动):**
- 每次 quiz 6-10 题,每题 4 选项 1 正确答案
- 题目通过 RESTful API 拉取,每次 quiz 都随机打乱
- 每题提交后不可改
- 答对 +1 分,没有连击/负分/其他花式计分
- 完成后保存 user_id + score + timestamp + 完整答题记录

**Admin 能力:**
- 管理题目的增删改查 + active/inactive toggle
- textarea 粘贴 JSON 数组批量导入(需验证)
- 访问控制必须在后端 middleware 强制执行,前端只做 UI 限制

**我们的 variation — Review Mode(已 tutor 口头确认):** 最终得分页之后,展示所有题目+正确/错误标记+(可选)解析字段。Question model 需要加一个 `explanation` 字段。

**禁止做的:** 多人、WebSocket、OAuth、文件上传、花哨动画——做了也不给分。

**两个待文档化的设计选择**(Spec §6 + Ed #164 都要求 README 写明我们的选择):

| 决策 | 推荐 | 理由 |
|------|------|------|
| Quiz 长度 | **固定 10 题** | 简化代码、leaderboard 直接可比;seed 至少 10 题就能跑 |
| Leaderboard scope | **best-per-user** 每用户最佳成绩 | UX 更干净;写一句 README justification 即可 |

---

## 2. 评分拆解与优先级

| 模块 | 分值 | 关键评估点 | 投入优先级 |
|------|------|-----------|-----------|
| Backend Architecture & APIs | 25 | MVC 分层清晰、RESTful、response envelope 一致、variation 正确集成 | **最高** |
| Frontend UI & UX | 25 | Context/useReducer、RHF+Zod、dark mode、直觉化流程 | **最高** |
| Individual Technical Contribution & Reflection | 15 | 12-15 个 meaningful commits、个人挑战、子系统图、variation 相关决策反思 | **高**(每人独立必做) |
| Quiz Logic & Mechanics Compliance | 10 | 严格遵守核心机制 + 精确实现 approved variation | 中(variation 不做直接封顶 Pass) |
| Admin Interface & Access Control | 10 | 完整 CRUD + 批量导入 + 安全 enforcement | 中 |
| Security & Validation | 10 | 密码 hash、rate limiting、输入验证、envelope 一致性 | 中 |
| Documentation & Process | 5 | README 完整、架构图、variation justification | 低但易拿满分 |

**Bonus up to +5:** UI/UX 打磨、variation 额外功能、错误处理和用户反馈做到位。

> **Bonus 必须文档化**[Ed #143]:每个 bonus feature 必须在 README 单独段落用 **What / Why / How-it-integrates** 三段式记录。staff 原话:*"Yes, all those points should be clearly stated in the README."* 没文档的 polish = invisible polish,marker 不会推断。详见 §9 README 模板。

**丢分重灾区(按概率排序):**
1. ❌ 忘了用 approved variation → Quiz Logic 封顶 Pass(-5 以上)
2. ❌ Response envelope 不统一 → Backend 评分直接降级
3. ❌ 没用 RHF+Zod、没用 Context/useReducer → Frontend 评分降级
4. ❌ 个人 commits 过少或 meaningless → Individual Reflection 低分
5. ❌ Admin access control 只在前端做 → Security 扣分 + Admin 扣分
6. ❌ README 里没有架构图或没 justify variation → Docs & Process 丢分
7. ❌ Bonus 加分写了但 README 没用 What/Why/How 记录 → 拿不到 +5(bonus 评分按 Ed #143 的格式判,没格式 = 没说明 = 不给)

### 拿分原则(贯穿整个项目)

- **简洁拿满分,复杂可能减分。** 评分 rubric 里没有"酷炫加分"——做了 spec 没要求的东西不会多给分;反而代码复杂度上去后 review 难度上升、bug 率上升,可能反扣 Backend / Frontend 评分
- **判断标准(每加一行代码前先问自己):** 是 spec 必需的? → 做。是 Bonus 三段式可文档化的? → 做。是"我觉得这样更好"? → **不做**
- **Bonus 的位置:** 核心 100 分锁死之前,**不要**碰 UI 镀金、动效、额外 feature。Bonus 是核心达标后的 cherry on top,不是替代品
- **特别警惕:** Tailwind / Three.js / GSAP 等花哨前端库**零加分** [Ed #154];引入它们只会让 demo 时被追问"为什么用这个",徒增风险
- **对零基础同学的特别提醒:** 你在网上看的教程经常 over-engineer(教 Redux、教 Tailwind、教 microservice),**那不代表这个作业需要那样写**。对照 spec 做最小满足版即可

---

## 3. 硬性技术约束(不遵守即扣分)

> **本节高频出现 JWT / middleware / envelope / population / RHF + Zod 等术语,不熟悉的同学先翻 [§0 术语速查](#0-术语速查先看这里)。**

### Backend 必须

- **Node.js + Express**,代码按职责分层:路由(routes)/ 控制器(controllers)/ 数据模型(models)放在各自文件夹,不混在一个文件里
- **MongoDB + Mongoose**:Score 数据模型必须存完整答题列表(每条 answer 至少有 `questionId` + `selectedAnswer` + `isCorrect` 三个字段)
- **MongoDB 必须本地运行**[Ed #144]:不允许 Atlas 或任何云数据库;Docker 视为 local。`MONGODB_URI` 形如 `mongodb://localhost:27017/...`。**README 必须给出本地起 Mongo 的具体步骤**(推荐 Docker:`docker run -d -p 27017:27017 --name mongo mongo:7`)。staff 原话:"*Please keep the database local. This ensures that if the marker needs to deploy and test the application, they can do so in a fully standalone environment without relying on any external cloud services.*"
- 在适当处使用 **Mongoose population**(例如 leaderboard 关联 user、Review page 关联 question 全文)
- 所有 API 响应必须使用 envelope:
  ```js
  { success: boolean, data?: any, error?: string }
  ```
- **JWT** 保护路由 + **rate limiting** 在 login 和 quiz submit 两个端点
- 服务端输入验证 + 防常见注入/XSS(用 `express-validator` 或 `zod` + `helmet` + `express-mongo-sanitize`)
- 每次 quiz 的题目**必须随机打乱**

### Authentication 必须 [Ed #156]

- **自行实现 authentication** — register / login / password hashing / token issuance / role-based access control 全部手写
- **完全禁止以下**:
  - OAuth / OpenID Connect 流程
  - Google / GitHub / Facebook 等社交登录
  - Auth0、Firebase Auth、Clerk、Supabase Auth 等任何抽象掉 auth 逻辑的第三方服务
- `passport-local` 是薄包装、staff 没明确表态——但**建议直接 `bcrypt + jsonwebtoken` 手搓**最稳,避免任何争议
- staff 原话:"*you must implement your own authentication... external authentication providers are disallowed.*"
- **Tracy(A)注意**:这条是 Auth subsystem 的红线,不是建议

### Frontend 必须

- **React functional components**(不要 class components)
- **React Context + useReducer**(或 **Zustand**)做 quiz state management——**不要只用 useState 散着写**
- 所有表单必须用 **React Hook Form + Zod** 做 validation
- **Dark mode toggle** 持久化到 localStorage,对 player 和 admin 两个界面都生效
- Admin 路由必须前端保护(路由守卫)+ 后端 middleware 双重 enforcement

### Repo 必须

- 使用悉尼大学的 GitHub Enterprise:`github.sydney.edu.au`
- **本组路径(tutor 已口头同意豁免 Ed #157 默认 Organization 要求)**:单 repo 挂 Raven 个人 namespace `wege8390/...`,4 人作为 collaborators,tutor 也加为 collaborator
- **所有 commits 的 author email 必须是绑定到本人 `github.sydney.edu.au` 账号的悉尼大学邮箱**(学生身份通常是 `<unikey>@uni.sydney.edu.au`,**不是** `<unikey>@sydney.edu.au`——后者是 staff 域)——每人本地跑一次 `git config user.email` 检查并修正。否则 GitHub Enterprise 不把 commits 算到 uni 身份的 contribution stats 上,Spec §15 的 *"may result in 0% contribution"* 风险触发
- 清晰的 commit history,每人至少 12-15 个 meaningful commits
- 分支策略:feature branch per subsystem,**regular merge(不要 squash)**保留个人 commit 历史 [Ed #151]

> **建议**:下次 tutorial 后在 Ed 给 tutor 发一条私信确认 "single-repo for our group + Review Mode variation",把口头协议留痕。这是 §11 风险清单里的低成本对冲。

### 超纲不给分

OAuth、WebSocket、文件上传、高级动画——做了也不算分 [Spec §9.6]。

---

## 4. Variation 深度:Review Mode 怎么做

✅ **状态:tutor 已口头确认。** 待 Ed 私信留痕。

这是我们选的 variation,也是唯一能拿满 Quiz Logic 10 分的钥匙。PDF 原文:

> **Review mode after completion** — after the final score, display all questions with correct/incorrect indicators and (optional) an explanation field added to the Question model.

### 必做

1. **Question schema 加字段:**
   ```js
   explanation: { type: String, default: '' }  // Admin editable; shown on review page
   ```

2. **Score schema 存完整答题记录(这本来就是硬性要求):**
   ```js
   answers: [{
     questionId: { type: mongoose.Types.ObjectId, ref: 'Question' },
     selectedAnswer: String,
     isCorrect: Boolean
   }]
   ```

3. **Review page 组件:**
   - 显示每道题目、四个选项
   - 用户选的答案:对→绿色勾、错→红色叉
   - 正确答案高亮
   - 如果题目有 `explanation` 字段,在下方显示
   - 前端用 `population` 拿到带题目全文的答题记录

4. **Admin 端:** 编辑题目的表单里加 `explanation` textarea 字段

> **Week 1 末就要能展示一个最简版本的 Review 页**(哪怕只显示 1 道题、explanation 是空字符串都行)。这样 demo 风险锁死。Raven 在做 Quiz 骨架时,**Score schema 一次性按最终需要的字段定义**——避免 Week 2 改 schema 触发数据迁移。

### 设计决策要写进 README(拿 justification 分)

- 为什么选 Review Mode(学生学习场景下的自然闭环:答错→看解析)
- `explanation` 字段为什么是 optional(兼容已有题库,渐进补充)
- 为什么 review 页通过 population 拉题目全文而不是存快照(简化 admin 修改后的一致性)

---

## 5. 需要掌握的知识地图

### 后端栈

| 技术 | 作用 | 关键知识点 |
|------|------|-----------|
| **Node.js** | 运行时 | npm/yarn、package.json、nodemon 开发 |
| **Express** | Web 框架 | 路由、middleware、error handler |
| **MongoDB** | 数据库 | document 模型、索引、聚合基础 — **必须本地运行** [Ed #144] |
| **Mongoose** | ODM | Schema、Model、populate、validation、aggregation pipeline |
| **jsonwebtoken** | JWT | sign/verify、过期时间、middleware 解析 |
| **bcrypt** | 密码 hash | salt rounds、compare、pre-save hook |
| **express-rate-limit** | 限流 | 按 IP 限 login、按 user 限 submit |
| **express-validator** 或 **zod** | 输入验证 | body schema、sanitize |
| **helmet** | 安全头 | CSP、XSS 保护 |
| **express-mongo-sanitize** | 防 NoSQL 注入 | 过滤 `$` 和 `.` |
| **cors** | 跨域 | 白名单 origin |
| **dotenv** | 环境变量 | `.env` 不进 git |
| **swagger-jsdoc + swagger-ui-express** | API 文档 | JSDoc 注释自动生成 |
| **jest + supertest** | 测试 | unit + endpoint 测试(详见 §8.5) |

### 前端栈

| 技术 | 作用 | 关键知识点 |
|------|------|-----------|
| **React 18+** | UI 库 | functional components、hooks |
| **React Router v6** | 路由 | protected routes、`useNavigate`、`Outlet` |
| **React Context** | 全局状态 | Provider、useContext |
| **useReducer** | 复杂 state | action、reducer、dispatch |
| **React Hook Form** | 表单 | `useForm`、`register`、validation 集成 |
| **Zod** | 验证 schema | `z.object`、`zodResolver` |
| **axios** | HTTP | interceptor 自动加 JWT、response envelope 解包 |
| **Vite** 或 **CRA** | 构建 | 推荐 Vite(更快) |

### DevOps & 协作

- **Git flow:** main + feature/*,PR review 强制(不直接 push main)
- **Branch protection:** main 禁止 force push,PR 需 review approval
- **Conventional commits:** `feat:`、`fix:`、`docs:`、`refactor:`、`test:`
- **Mermaid diagrams:** 架构图、sequence diagram(GitHub 自动渲染)
- **Markdown:** README, 个人 reflection
- **Postman** 或 **Swagger UI:** 手测 API + 交付文档

### 不熟的地方优先补

按本课程进度,以下是大概率需要现学的:
- **Zod + RHF 集成**(第一次用 validation schema 和 hook form 结合)
- **React Context + useReducer 组合**(不是散的 useState)
- **Mongoose population**(尤其是 nested populate)
- **Mongoose aggregation pipeline**(leaderboard 的 best-per-user 查询)
- **Swagger JSDoc 写法**
- **express-rate-limit 的 key 策略**(按 user 还是 IP)
- **Mermaid 语法**(架构图和 sequence 图)

---

## 6. 四人分工方案(含 pair 结构 + ownership 规则)

### 4 人方案 — 实际成员分配

| 成员 | 主责子系统 | 核心产出 | 关键文件 |
|------|----------|---------|---------|
| **A — Auth & Security**<br>**Tracy Cui** · `ycui0519` | 用户认证、JWT、middleware、rate limiting、密码 hash、输入 sanitize、AuthContext + 登录/注册前端 | 注册/登录/登出 flow、AuthContext、protected route middleware、admin middleware | `models/User.js`、`controllers/auth.controller.js`、`routes/auth.routes.js`、`middleware/auth.middleware.js`、`middleware/admin.middleware.js`、`frontend/src/contexts/AuthContext.js`、`frontend/src/components/Login.js`、`frontend/src/components/Register.js` |
| **B — Quiz Core Logic**<br>**Raven Ge** · `wege8390` | 题目抽取与随机、答题流程、评分、Score 持久化、**Review Mode**、历史记录、Leaderboard 数据契约 | 前端 Quiz 组件 + useReducer、后端 quiz API、Review page、History page、Leaderboard aggregation query | `models/Question.js`、`models/Score.js`、`controllers/quiz.controller.js`、`routes/quiz.routes.js`、`frontend/src/components/Quiz.js`、`frontend/src/pages/Review.js`、`frontend/src/pages/History.js`、`frontend/src/contexts/QuizContext.js` |
| **C — Admin Subsystem**<br>**Allen Ji** · `yuji0315` | Admin UI、题目 CRUD、批量 JSON 导入、active/inactive toggle | Admin dashboard、题目管理表单(RHF+Zod)、bulk import 验证 | `controllers/admin.controller.js`、`routes/admin.routes.js`、`frontend/src/pages/Admin.js`、`frontend/src/components/QuestionForm.js`、`frontend/src/components/BulkImport.js` |
| **D — Integration Lead**<br>**Tom Tian** · `ytia0619` | Response envelope、全局 error handler、dark mode 框架、Swagger 框架、架构图、E2E 集成测试、Leaderboard UI 集成、Home 落地页 | envelope wrapper、error middleware、ThemeContext、ProtectedRoute、axios interceptor、Swagger 框架 + JSDoc 审计、README 框架 + 架构图、Home page、Leaderboard 组件 | `middleware/errorHandler.js`、`utils/responseEnvelope.js`、`frontend/src/contexts/ThemeContext.js`、`frontend/src/components/Leaderboard.js`、`frontend/src/components/ProtectedRoute.js`、`frontend/src/pages/Home.js`、`docs/swagger.js`、`README.md` |

> **4 人时 D 是强制角色(Spec §11.1 原文):** *"one student must take primary responsibility for system integration, validation, and robustness. This includes handling edge cases, input validation, and ensuring consistent behaviour between the frontend and backend."*

### Pair 结构(按耦合度配对,非按工作量均分)

**理由:** 耦合高的 pair 起来减少集成冲突;耦合低的拆开避免互相阻塞。

| Pair | 共同主线 | 天然耦合点 |
|------|---------|-----------|
| **Pair 1: A (Tracy) + D (Tom)** — 平台层/横切关注点 | auth middleware 和 error handler 在同一层;rate limiting 和 response envelope 都是全局基础设施;前端 ProtectedRoute 依赖 axios interceptor | A 写 `authMiddleware` → D 写 `errorHandler` → 两人一起确定 error 如何冒泡进 envelope;A 写 axios interceptor 加 JWT → D 写 axios interceptor 解 envelope → 同一个 `api.js` 文件 |
| **Pair 2: B (Raven) + C (Allen)** — 围绕 Question model | 两人共享 `Question` schema、共享 Zod validation 规则、共享题目相关的业务逻辑;B 是题目消费者,C 是题目生产者 | B+C 共同维护 `models/Question.js` 和对应 Zod schema;B 需要 `explanation` 字段做 Review Mode → C 在 admin form 里加这个字段;B 做答题不参与 bulk import,但 C 做 bulk import validation 时复用 B 定的 question schema;前端共用 `<QuestionCard>` 组件(B 用于答题展示,C 用于预览) |

**Pair 内强制做法:**
- **Code review 强绑定**:A 的 middleware PR 必须 D 审;B 的 Question/Score model 改动 C 必须 approve;反之亦然
- **每周末 30 分钟 pair sync**:两人对一遍各自这周的接口契约和共享 schema 是否同步

### Documentation / Test / Schema Ownership 规则 ⭐

> **为什么单独写:** 防止"D 一个人收所有尾活"——这既不公平也不符合 Spec §11 个人贡献评估(每人需要自己的 commit history / Reflection evidence)。Spec §11.1 让 D 主导 integration / validation / robustness,但 documentation 和 per-subsystem 测试是 feature owner 的本职工作。

| 工作类型 | Primary owner | D 的角色 |
|---------|--------------|---------|
| Endpoint Swagger JSDoc | 该 endpoint 的作者(A/B/C/D 各管自己) | 格式审计 + `/api-docs` 集成 + 命名一致性 |
| README 子系统说明段(Auth / Quiz / Admin / Integration) | 该子系统的 owner | README 框架 + setup 段 + 架构图 + Bonus 三段式 section |
| 子系统 Jest 单元测试(详见 §8.5) | 该子系统的 owner | envelope/errorHandler 自测 + Postman E2E 集成测试 |
| 子系统手测 checklist | 该子系统的 owner | 跨子系统 E2E happy path audit |
| Question schema 字段结构(`text` / `options` / `correctAnswer` / `explanation`) | **B primary** | C approve(C 不可单方面改这些字段) |
| Admin form validation 提示文案 / bulk import 错误显示 | **C primary** | — |
| Zod schema 共享方式(路径 / monorepo / 双份 fallback 决策) | **D** | (由 D 30 分钟 timebox 决定,详见 §7 第 3 项) |
| Zod schema 业务语义(user / quiz / question / bulk import 字段含义) | A (user) / B (quiz, submit) / B+C (question, bulk import) | — |
| Leaderboard 后端 endpoint + aggregation query (`GET /api/quiz/leaderboard` in `quiz.controller.js`) | **B**(endpoint + 数据契约 + query) | D 集成到前端 `Leaderboard.js` |

**一句话:** Feature owner 写自己的内容,D 做集成审计和跨域协调。

### Cross-Pair Integration Sync ⭐

Pair sync 保留为深度同步,但 quiz 流程跨两个 pair(A 登录 → B 开始 quiz → C admin seed 题 → D leaderboard),**仅靠 pair 同步不够**——下面这 6 项 contract 改一个就会牵动 3 人以上,必须全组在场对齐。

**全组 contract sync 节奏:**

- **Daily async check-in(贯穿 2 周):** 每天群里发一条三件套:昨日 commit short SHA + 一句话 / 今天计划 / blocker。**不开会,文字即可。** 双重作用:(1) D 在最早时刻发现哪个 pair 卡住;(2) 给每人的 individual journal 喂素材,但 **journal 还要单独写**(详见 §8.6 — daily check-in ≠ daily journal)
- **Week 1:至少 2 次** 15 分钟 stand-up(建议 Week 1 前半末 + Week 1 后半末),对齐 6 项 contract:
  1. JWT token shape(payload 字段、过期策略)
  2. Response envelope(`{ success, data?, error? }` 字段名 + error 是 string 还是 object)
  3. Question schema(字段、validation 规则、`explanation` 是否 required)
  4. Score schema(`answers` 数组结构、是否 populate questionId)
  5. Error format(4xx vs 5xx 暴露什么、HTTP status code 约定)
  6. Frontend route map(哪些路由 protected、哪些是 admin-only、参数命名)
- **Week 2:隔日 15 分钟** stand-up,重点是 blocker、deliverable status、整合冲突

**主持人:** D。所有决议写进 `docs/integration-decisions.md`(每条用 ADR 风格 + 日期 + 涉及成员 + 决议原文)——这既是 audit trail,也给 D 的 Individual Reflection 攒可引用的 commit。

### 个人 commit 量目标

每人 **12-15 个 meaningful commits 最低线**,目标 18-25 个。这是 Individual Reflection 评分的关键 evidence。

**Meaningful commit 的标准:**
- ❌ "fix bug"、"update"、"commit changes"
- ✅ "feat(auth): add JWT middleware with rate limiting on /login"
- ✅ "refactor(quiz): extract shuffle logic into service layer"
- ✅ "fix(review): correct isCorrect flag population in Score.answers"

---

## 7. Week 1 必须锁死的共享基础设施

这一部分是整个项目最容易集成崩盘的地方。**Week 1 结束前必须敲定并合并到 main 分支**,否则 Week 2 每个人各写各的会产生大量不兼容代码。

### 必须 Week 1 完成的 6 个共享 contract

1. **Response Envelope 工具函数**
   ```js
   // utils/responseEnvelope.js
   const ok = (data) => ({ success: true, data });
   const fail = (error) => ({ success: false, error });
   module.exports = { ok, fail };
   ```
   **所有 controller 必须用这两个函数 return 响应**,不能直接 `res.json({...})`。

   > 命名说明:用 `ok`/`fail` 而不是 `success`/`failure`——避免与 envelope 字段 `success: true` 同名(如果 helper 也叫 `success`,则 `success(data)` 既是函数名又是 return 对象的字段名,code review 时极易看错)。

2. **全局 Error Handler middleware**
   ```js
   // middleware/errorHandler.js
   const { fail } = require('../utils/responseEnvelope');

   module.exports = (err, req, res, next) => {
     console.error(`[errorHandler] ${req.method} ${req.path}`, err);
     const status = err.status || 500;
     // Hide 5xx internals — they may leak DB strings / stack fragments.
     // 4xx messages are written for users and safe to return verbatim.
     const message = status >= 500
       ? 'Internal server error'
       : err.message || 'Bad request';
     res.status(status).json(fail(message));
   };
   ```

3. **Zod Schemas — 重要:先评估再决定共享方式**

   原方案:放在 `shared/schemas/` 下让前后端都 import。**实操坑较多**:
   - Vite 默认不 transpile node_modules 之外的源文件,跨目录 import 要配 alias 或 monorepo workspaces
   - 后端 CommonJS、前端 ESM,schema 文件要么二选一要么 dual-package
   - 2 周 deadline + 4 人学习中,配置 debug 时间不可控

   **推荐做法(D 主导,30 分钟时间盒决定):**
   - 先尝试 monorepo workspaces 路径,**30 分钟跑不通就回退**
   - 回退方案:**前后端各自维护一份 Zod schema**,B 和 C 在 commit 里互相 reference 同步(两人本来就是 pair)
   - 中间方案:写一个**纯 JSON 的 question shape constants 文件**(`shared/constants.js` 只 export 字段名和枚举值),两边各自基于这个 constants 写 Zod schema

   不论哪种方案,需要的 schema:
   - `userSchema`(注册/登录)
   - `questionSchema`(创建/更新题目)
   - `bulkImportSchema`(批量导入数组)
   - `submitQuizSchema`(提交答题)

4. **Axios instance + interceptor**
   ```js
   // frontend/src/api/api.js
   // Auto-attach JWT from localStorage to Authorization header
   // Auto-unwrap { success, data } → data; throw on failure
   ```

5. **Theme Context(dark mode)**
   ```jsx
   // frontend/src/contexts/ThemeContext.js
   // Read/write 'theme' key in localStorage; apply to document.documentElement
   ```

6. **Protected Route 组件**
   ```jsx
   // frontend/src/components/ProtectedRoute.js
   // Check whether JWT exists/valid and admin role (two modes)
   ```

### Week 1 任务清单(按周分配,关键路径见 §8 🚧 标记)

**已完成:** ✅ 第一次组会、分工敲定、variation 选定 (Review Mode)、tutor 口头确认、repo 已建、tutor 加为 collaborator

**Week 1 内全员要做的事:**

- 4 人各自跑 repo audit prompt,verify commit author email 是绑定到本人 `github.sydney.edu.au` 账号的悉尼大学邮箱(学生通常是 `*@uni.sydney.edu.au`)
- 配 main branch protection(禁止 force push、PR 需 1 人 review approval)
- 决定 quiz 长度(推荐 fixed 10)+ leaderboard scope(推荐 best-per-user),写进 README placeholder
- D 主导写上面 6 个共享基础设施(A 协助 middleware 相关)
- B + C 一起定 `Question` schema 字段(含 `explanation`)
- **每人 Day 1 创建 `docs/private-journal/<unikey>.md`**,记下今天做了什么(详见 §8.6)
- **D Day 1 建 README skeleton**,每个 section 按 §9 模板写 placeholder TODO
- 每个人在自己的 feature branch 上基于 shared contract 开始 feature 开发
- 第一次 integration 联调,确保登录 → 抽题 → 答题 → 出分的骨架能跑通(功能都是空壳可以接受)

**Week 1 末验收:** 用 Postman 能注册一个 user、登录拿 JWT、用 JWT 调 `/api/quiz/start` 拿到题目数组;前端能登录后开始 quiz(答题逻辑可以是占位的)。

---

## 8. 2 周时间线

> **节奏假设:** Week 1 + Week 2 共约 14 天用于实施 + 提交;submission 截止日具体见 Spec metadata,live demo 在课程 **Week 12 lab** 时段(与 submission 不一定同一天,以 tutor 安排为准)。如果到 Week 1 末核心功能仍 < 50%,立即组级 escalate(详见 §11)。

### Week 1(前半):基础设施搭建

**目标:** D 的 6 个 shared contract 落地,A/B/C 各自子系统骨架建好;4 人都至少 2 commits 入 main。

> 🚧 **Critical path(先做完这两块,其他人才能并行):**
> 1. **D 的 envelope helper + errorHandler + axios interceptor** — 阻塞 B/C 的 controller 编写(缺这套,B/C 写完要回头换 envelope,纯返工)
> 2. **A 的 User model + JWT sign/verify + auth middleware 骨架** — 阻塞 B/C 的 protected endpoints(缺这套,所有需要认证的接口都没法测)
>
> D 的 ProtectedRoute / ThemeContext / Home 骨架,以及 B/C 的子系统骨架可以并行开工,不在 critical path 上。

- A (Tracy):User model + bcrypt + JWT sign/verify + auth middleware 骨架 + **admin middleware 骨架** + 登录注册端点骨架 + AuthContext + Login/Register 组件骨架 🚧 *auth middleware 在 critical path*
- B (Raven):Question model + Score model 定义 + `/api/quiz/start` 和 `/api/quiz/submit` 端点骨架(题目随机用 `$sample`)+ 前端 Quiz 组件骨架 + QuizContext(useReducer)
- C (Allen):Admin 页面占位(登录后能看到即可,**消费 A 提供的 admin middleware**;CRUD 业务逻辑推到 Week 1 后半)
- D (Tom):6 个共享 contract(envelope helper、errorHandler、axios、ThemeContext、ProtectedRoute、Zod schemas 决策)+ React Router 框架 + Home 页面骨架 + Swagger 初始化 + **README skeleton 建好**(详见 §9)🚧 *envelope/errorHandler/axios 在 critical path*

**Week 1 前半联调验收:** 用 Postman 能注册一个 user、登录拿 JWT、用 JWT 调 `/api/quiz/start` 拿到题目数组;前端能登录后开始 quiz(答题逻辑可以是占位的)。

### Week 1(后半):核心功能闭环

**目标:** 全部 player 功能可用 + Admin 能手动 CRUD;端到端 happy path 跑通;**Review Mode 最简版能展示 1 道题**。

- A (Tracy):admin middleware 强化(角色判断、错误冒泡进 errorHandler)+ rate limiting(login + quiz submit)+ input sanitize(helmet、mongo-sanitize)+ 注册/登录表单 RHF+Zod 集成 + AuthContext token 持久化 + 过期处理
- B (Raven):完整答题流程 + 评分 + Score 存完整答案列表 + **Review Mode 页面(核心 variation)** —— 哪怕只展示 1 道题、explanation 是空字符串都行 + 历史记录页 + Leaderboard 后端 endpoint(`GET /api/quiz/leaderboard` in `quiz.controller.js`,含 aggregation query;D 接前端 UI 组件)
- C (Allen):Admin 完整 CRUD UI(List/Create/Edit/Delete)+ active toggle + **bulk import with JSON validation**
- D (Tom):Leaderboard UI 组件(消费 B 提供的 aggregation query)+ dark mode 覆盖所有页面(ThemeContext + 各页 owner 自测) + Swagger 框架(`/api-docs` 集成 + 命名 convention)+ **Postman collection 第一版**(覆盖 happy path)

**Week 1 末联调验收:** 从注册→登录→答完一局→看到 review 页→看到 leaderboard 全流程无 bug;Admin 可以增删改题。**这是最关键的中期节点 —— 这里没跑通就立刻 escalate。**

### Week 2(前半):打磨 + 边界处理 + 文档冲刺

**目标:** 错误处理、边界情况、文档全部到位;进入 final hardening 阶段。

- A:完整 security audit checklist(列出来对着过)+ rate limit 策略文档化 + **自己 endpoint 的 Swagger JSDoc + README "Auth & Security" 子系统说明段** + **auth.controller 的 Jest 单元测试**(详见 §8.5)
- B:quiz 中断恢复、网络错误提示、Review Mode 细节打磨(explanation 显示、对错标记、population 优化)+ **自己 endpoint 的 Swagger JSDoc + README "Quiz Logic & Review Mode" 子系统说明段** + **quiz.controller 的 Jest 单元测试**
- C:bulk import 的错误提示(明确哪一行 JSON 不合法)+ Admin UI 打磨 + History 页面打磨(分页、跳转 review)+ **自己 endpoint 的 Swagger JSDoc + README "Admin Subsystem" 子系统说明段** + **admin.controller 的 Jest 单元测试**
- D:完整架构图(Mermaid)+ Swagger 框架审计(命名 / response envelope / status code 一致性,逐 endpoint 过)+ README 框架(setup + architecture + variation justification + Bonus 三段式 section + 整合 A/B/C 的子系统段)+ **Postman collection 终版**(保存到 `docs/postman-collection.json`,含 8-10 个 E2E case;详见 §8.5)+ envelope 一致性 audit(grep `res.json(`)+ 手测 rate limiting 真触发 + **envelope/errorHandler 的 Jest 单元测试**

**每个人 Day 8 起每天花 10 分钟整理自己的 daily journal,挑出 12-15 个最有意义的 commit 准备 Reflection 素材(详见 §8.6)。**

### Week 2(后半):Reflection + 提交 + Demo 排练

- 每人完成自己的 Individual Reflection PDF(含 Mermaid sequence diagram、12-15 个 commit hash + 一句话说明、variation 设计反思)—— **从 daily journal 直接提炼,不是从零回忆**
- 每人深度复习自己子系统 + **其他人的子系统**(demo 时会被问到其他部分;详见 §10 Demo 准备)
- 跑一遍完整 demo 流程
- README 终版 verify:Spec §10 的 6 个 section 齐 + Bonus 三段式段(如有)+ git workflow note
- 检查 zip 不含 `node_modules` 和 `.env`
- 签 group coversheet 4 人都到位
- **submission**:按 Spec metadata Due 日期上传 Canvas
- **live demo**:按 tutor lab schedule 安排(Week 12 lab;可能晚于 submission,不要假设同一天)

---

## 8.5 测试策略与 QA 分摊

> **owner 分配按 §6 Documentation/Test/Schema Ownership 表 — 每个 controller 的作者写自己的 unit test,D 主责集成测试 + envelope 单元测试。** 这样每人都有 test commits 入 reflection。

### 三层测试 + 各自 owner

| 层 | Owner | 工具 | 覆盖目标 | 目标数量 |
|----|-------|------|---------|---------|
| **单元测试** | 每人对自己的 controller | Jest + supertest | 关键 controller 的 happy path + 1 个 error case | 每人 2-4 个 |
| **集成测试** | Tom 主责 | Postman collection | 端到端 happy path(player + admin 各一条) | 8-10 个 case |
| **手测清单** | 4 人共建 | `docs/manual-test-checklist.md` | demo 关键场景 + 边界情况 | 一份 list,demo 前 4 人各跑一遍 |

### 单元测试目标(每人 2-4 个 Jest 测试)

```
Tracy (auth.controller.test.js):
  ✓ POST /register success → 201 + envelope { success: true, data: { token } }
  ✓ POST /register duplicate username → 409 + envelope { success: false, error }
  ✓ POST /login wrong password → 401

Raven (quiz.controller.test.js):
  ✓ GET /quiz/start authenticated → returns 10 shuffled questions
  ✓ POST /quiz/submit valid answers → score saved with full answers list
  ✓ POST /quiz/submit unauthenticated → 401
  ✓ GET /quiz/leaderboard → aggregation returns best-per-user sorted

Allen (admin.controller.test.js):
  ✓ POST /admin/questions valid body → 201
  ✓ POST /admin/bulk-import valid JSON array → all inserted
  ✓ POST /admin/bulk-import malformed item at index 2 → returns which index failed

Tom (envelope.test.js + errorHandler.test.js):
  ✓ ok(data) returns { success: true, data }
  ✓ fail(msg) returns { success: false, error: msg }
  ✓ errorHandler 5xx hides internal message
  ✓ errorHandler 4xx returns user message verbatim
```

**目标不是覆盖率高,而是 happy path 永远不翻车。每人写 2-4 个测试只花 1-2 小时,但锁死了核心流程。**

### 集成测试 — Postman collection(Tom 主责)

`docs/postman-collection.json` 必须包含至少这 10 个 case:

```
Player Flow:
1. Register new user
2. Login with that user → save token to env var
3. GET /api/quiz/start with token → 10 questions
4. POST /api/quiz/submit with all correct → score = 10
5. POST /api/quiz/submit with mixed → correct score
6. GET /api/quiz/history with token → shows the attempts
7. GET /api/quiz/leaderboard → shows username + best score per user

Admin Flow:
8. Admin login → save admin token
9. POST /api/admin/questions create question
10. POST /api/admin/bulk-import with 5 valid + 1 invalid → tells which failed
```

Demo 前 1 天,Tom 把整个 collection runner 跑一遍——**全绿才能上交**。

### 手测清单(4 人共建)

`docs/manual-test-checklist.md` 含这些场景(每场景一行 checkbox):

```
Player Happy Path:
- [ ] Register → Login → Start Quiz → Answer 10 → See Score → See Review
- [ ] Login → View History → Click on attempt → See Review again
- [ ] Login → View Leaderboard → username + score visible

Edge Cases:
- [ ] Quiz mid-session: refresh page → behavior is documented
- [ ] Quiz submit with network down → user gets clear error
- [ ] Login with rate limiting triggered → 429 message shown
- [ ] Dark mode persists after refresh
- [ ] Dark mode applies to admin page too

Admin:
- [ ] Admin login → Create question → see in list
- [ ] Edit question → changes reflect on player side
- [ ] Toggle inactive → no longer appears in player quizzes
- [ ] Bulk import 5 valid → all created
- [ ] Bulk import with invalid JSON → clear error pointing to index

Security:
- [ ] curl /admin/questions with player JWT → 403
- [ ] curl /quiz/start without JWT → 401
- [ ] Login 6 times within 1 minute → 5th gets rate-limited
```

**Demo 前 4 人各跑一遍,谁跑出 bug 谁自己 fix。**

---

## 8.6 Daily check-in vs Daily journal:两个都要做

> **关键区别:** v2.9 的 daily check-in(§6 Cross-Pair Sync)和这里的 daily journal **不是同一件事**。两者粒度不同、目的不同,**两个都要做**——前者是 operational,后者是 retrospective。

### 两者对比

| 维度 | Daily check-in | Daily journal |
|------|----------------|---------------|
| 在哪 | 群里(微信/Discord/Slack) | `docs/private-journal/<unikey>.md`(进 git) |
| 目的 | 让 D 和组员知道你今天做什么、被谁卡住 | 攒 Reflection PDF 的素材(challenge + how solved) |
| 时机 | 每天早上 / 工作前 | 每天工作结束 / commit 完 |
| 格式 | 3 行(昨天/今天/blocker) | 4 行(commits / what / challenge / how solved) |
| 谁看 | 全组实时看 | 自己 + Reflection 评分时引用 |
| 覆盖时段 | "我即将做什么" | "我刚刚做了什么 + 遇到什么坑" |

### Daily check-in 格式(在群里)

```
昨天:<commit hash 短码> <一句话做了什么>
今天:<计划做什么>
Blocker:<被谁/什么卡住,或 None>
```

### Daily journal 格式(进 git 的 markdown 文件)

```markdown
## 2026-04-23 (Tue)
- Today's commits: a3f9c2, b4e8d1
- What I did: completed JWT sign/verify + auth middleware, merged to main; unblocked B/C
- Challenge / problem: middleware 在 next() 调用顺序上踩坑 — 写在 routes 之后才生效
- How I solved: 把 app.use(authMiddleware) 移到所有 protected routes 注册之前
```

### 为什么要分开做?

- **Daily check-in 缺第四行 "How I solved"** — Reflection PDF 需要的"我遇到什么具体问题、怎么解决的"无法从 check-in 推回来。Week 2 末写 reflection 时还是要凭记忆补,容易写得 generic。
- **Daily journal 不在群里** — journal 涉及具体的 stack trace、错误日志、思路转折,在群里发会刷屏 + 模糊重点。Markdown 文件适合慢慢写,git history 还能追溯。

### Journal 文件位置

```
docs/private-journal/
├── ycui0519.md   (Tracy)
├── wege8390.md   (Raven)
├── yuji0315.md   (Allen)
└── ytia0619.md   (Tom)
```

> ⚠️ **commit 时不需要互相 review,但要进 git**(进 git 才能在 reflection 里引用具体的"我那天写的"内容)。journal 不是私密的——marker 不会专门看,但同组成员可以参考。

### 14 天累计 → Reflection 提炼

到 Week 2 末:
1. 数 journal 里所有 commit hash → 应该有 18-25 个
2. 挑 12-15 个最有故事的
3. 挑 1-2 个 challenge 写成 reflection 的 "major technical challenge" 段
4. 用 journal 里记录的 "how I solved" 作为 reflection 里"如何解决"的素材

**这件事每天花 5 分钟,节省最后 3-4 小时的回忆+编造时间,而且写出来的 reflection 是真实的、具体的、有 commit hash 印证的——直接拿满分。**

### Reflection 评分逻辑(Spec §11)

> *"Reflections that appear generic or lack personal evidence (e.g., specific commits, diagrams, challenges) will receive low marks."*

**Generic reflection** — 0-3 / 15:

> "I worked on the auth subsystem and learned a lot about JWT."

**Specific reflection** — 12-15 / 15:

> "I worked on auth.middleware.js (commit a3f9c2). My major challenge was that Express middleware runs in declaration order — when I registered authMiddleware after the protected routes, it never fired. I fixed this in commit b4e8d1 by moving app.use(authMiddleware) before route registration. See sequence diagram below for the request flow."

**差距 9-12 分。** Daily journal 是产出后者的最低成本路径。

---

## 9. 交付清单

### Git 仓库结构(按 PDF suggested skeleton + 本组调整)

```
quiz-game/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── config/db.js
│   ├── models/{User,Question,Score}.js
│   ├── controllers/{auth,quiz,admin}.controller.js
│   ├── routes/{auth,quiz,admin}.routes.js
│   ├── middleware/{auth,admin,errorHandler}.middleware.js
│   ├── utils/responseEnvelope.js
│   ├── tests/{auth,quiz,admin,envelope}.test.js
│   └── docs/swagger.js
├── frontend/
│   ├── package.json
│   └── src/
│       ├── index.js, App.js
│       ├── api/api.js
│       ├── contexts/{QuizContext,ThemeContext,AuthContext}.js
│       ├── components/{Quiz,Login,Register,Leaderboard,ProtectedRoute,QuestionForm,BulkImport}.js
│       └── pages/{Home,Review,History,Admin}.js
├── shared/  (可选 — 见 §7 第 3 项 caveat)
├── docs/
│   ├── architecture.md (含 Mermaid 图)
│   ├── integration-decisions.md (ADR 风格,D 维护)
│   ├── postman-collection.json (集成测试,Tom 主责)
│   ├── manual-test-checklist.md (4 人共建)
│   ├── private-journal/ (每人的 daily journal)
│   │   ├── ycui0519.md
│   │   ├── wege8390.md
│   │   ├── yuji0315.md
│   │   └── ytia0619.md
│   └── individual-reflections/
│       ├── {unikey-tracy}.pdf
│       ├── {unikey-raven}.pdf
│       ├── {unikey-allen}.pdf
│       └── {unikey-tom}.pdf
├── README.md
└── Assignment 2 Group Assignment Coversheet.doc (全员签名)
```

### README.md Day 1 placeholder skeleton ⭐

> **Day 1 Tom 就建这个 skeleton,每个人完成对应功能后顺手填自己的部分(2 分钟事)。不要等到最后再写。占位符按 §6 Ownership 表分配。**

```markdown
# COMP4347/5347 Assignment 2 — MERN Quiz App

## Team
- Tracy Cui (ycui0519) — Auth & Security
- Raven Ge (wege8390) — Quiz Core + Review Mode + Leaderboard backend
- Allen Ji (yuji0315) — Admin Subsystem
- Tom Tian (ytia0619) — Integration + Documentation + Testing

## Setup Instructions
<!-- TODO (Tom): Node version, MongoDB Docker command, .env.example, npm install steps -->

## System Overview & Architecture
<!-- TODO (Tom): Mermaid architecture diagram + brief overview -->

## Approved Variation: Review Mode
<!-- TODO (Raven): justification + design decisions (why optional explanation, why population not snapshot) -->

## Subsystem Documentation

### Auth & Security
<!-- TODO (Tracy): JWT strategy, rate limiting, password hashing, sanitization -->

### Quiz Logic & Review Mode
<!-- TODO (Raven): question shuffling, scoring, Score schema, Review Mode flow -->

### Admin Subsystem
<!-- TODO (Allen): CRUD endpoints, bulk import validation strategy, error feedback -->

### Integration & Documentation
<!-- TODO (Tom): response envelope rationale, error handling, dark mode, Swagger setup -->

## Team Roles & Key Commits
<!-- Each person fills 3-5 representative commit links -->

### Tracy
- TODO

### Raven
- TODO

### Allen
- TODO

### Tom
- TODO

## API Documentation
<!-- TODO (Tom): link to /api-docs Swagger UI; mention each endpoint owner per ownership table -->

## Git Workflow
<!-- TODO (Tom): branching model + how to view full commit log [Ed #151] -->

## Beyond the Specification — Bonus Features
<!-- Each bonus feature uses What/Why/How three-part format [Ed #143] -->
<!-- Add as we go; keep this section even if empty until end of Week 2 -->
```

### README.md 必含(对着 Spec §10 勾)

- [ ] Clear setup instructions 含 `.env.example` + Docker MongoDB 启动命令 [Ed #144]
- [ ] System overview + **Architecture diagram** (Mermaid)
- [ ] **Description and justification of Review Mode variation**
- [ ] Team role breakdown + links to key commits(每人 3-5 个代表性 commit 链接)
- [ ] Self-hosted API documentation — 推荐 **Swagger UI** 挂 `/api-docs`
- [ ] **Git workflow note** [Ed #151]:分支模型 + 哪里能看完整 commit log(例如 `git log --all --graph`)
- [ ] **Beyond the Specification — Bonus Features** 段(如果有 bonus 想拿,每个 feature 用下面三段式):

  ```markdown
  ## Beyond the Specification — Bonus Features

  ### 1. [Feature 名,例如 "Toast notification system for all async actions"]
  - **What:** 一两句说做了什么
  - **Why:** 解决什么问题 / 改善什么 UX
  - **How it integrates:** 哪些组件/路由用它、架构耦合点(例如 "consumed via a `useToast` hook exposed through `ToastContext`; called from quiz submission, admin CRUD, and login/register")

  ### 2. [下一个 feature]
  ...
  ```

  这是 Ed #143 staff 明确确认的格式:*"Yes, all those points should be clearly stated in the README."* 没文档 = 没分。

### 每人的 Individual Reflection PDF (1-2 页,PDF 格式)

- [ ] 你主责的子系统名称 + 实现方式
- [ ] 至少一个 major technical challenge + 如何解决(带代码 snippet 或 commit link)—— **从 daily journal 提炼**
- [ ] **子系统的 Mermaid sequence diagram 或 UML**
- [ ] git commit history 分析(列出**至少 12-15 个有意义的 commit**,带 hash 和说明)—— **从 daily journal 提炼**
- [ ] 对 Review Mode variation 相关设计决策的反思

### 提交 zip 文件

- [ ] 包含整个 repo(从 GitHub 点 `Code → Download ZIP`)
- [ ] 不包含 `node_modules/` 和 `.env`
- [ ] 包含签名的 Group Assignment Coversheet.doc
- [ ] 提交到 Canvas

---

## 10. Demo 准备与口头问答预案

### Demo 格式

- Week 12 lab
- **所有成员必须 present 一部分**
- 每个成员要能**回答关于任何部分**的问题(bus factor)

### 预案:每人准备以下三类问题的答案

**1. 你的子系统怎么工作(深度问题)**

示例:
- A (Tracy) 被问:JWT expire 了前端怎么处理?refresh token 有没有做?
- B (Raven) 被问:题目随机用的是什么 MongoDB operator?为什么不用 `Math.random` 在 Node 端打乱?Leaderboard 的 best-per-user aggregation 怎么写的?
- C (Allen) 被问:bulk import 的 JSON validation 是哪层做的?如果数组里第 3 个对象非法,怎么告诉用户?
- D (Tom) 被问:为什么要用 response envelope?如果不用会怎么样?

**2. 别人的子系统怎么工作(宽度问题)**
- 每个人必须能讲清所有 model 的 schema、主要 endpoint、前端路由结构
- 建议 Week 2 后半做一个集体 walk-through,每人讲自己的部分但大家都听

**3. 设计决策为什么这样选**
- 为什么选 Context+useReducer 不选 Redux?(答:课程要求 + state 局限于 quiz 不需要全局 store)
- 为什么用 Zod 不用 Yup?(答:type inference 更好、前后端共享 schema)
- 为什么选 Review Mode 做 variation?(答:教育场景自然闭环、改动最小风险可控)
- 为什么 Leaderboard 后端 endpoint 放 quiz.controller 而不是单独 leaderboard.controller?(答:数据源是 Score model,属于 quiz domain;独立 controller 反而割裂数据所有权)

### 外部库使用警告

PDF 原话:
> 如果你使用了教程中未提及的外部库,请与你的导师讨论。你的导师可能不熟悉你使用的库。你需要做好准备,回答有关作业中库使用情况的问题。

**建议:** 只用课程 tutorial 提过或 PDF 明确列出的库(express, mongoose, jwt, bcrypt, RHF, Zod, axios)。想加额外的库(比如 `date-fns`、`clsx`、`lucide-react`)前先评估必要性。

---

## 11. 风险清单与避坑指南

### 高风险项(历年容易翻车)

| 风险 | 后果 | 缓解 |
|------|------|------|
| Week 1 没锁死 shared contract,大家各写各的 | Week 2 集成爆炸、大量重构、commit history 混乱 | 严格执行 §7 Week 1 内 shared infra 冲刺,D 主导;关键路径见 §8 🚧 标记 |
| Admin access control 只做前端路由守卫 | Security 扣分 + Admin 扣分 = 可能丢 10+ 分 | 后端 middleware 必须 enforcement;**手测清单里有 curl admin 端点带 player JWT 的 case** |
| 忘了给 login / quiz submit 加 rate limiting | Security 扣分 | Week 1 就装好 `express-rate-limit`;Tom 的 Postman collection 里有触发 rate limit 的 case |
| 密码用明文或者 hash 但忘了 salt | Security 直接扣分 | bcrypt with `saltRounds >= 10`,pre-save hook |
| Score model 没存完整答案列表 | Review Mode 做不了、Backend 扣分 | Week 1 建 Score model 时就按最终 schema 建 |
| Variation 实现不到位或和批准的不一致 | Quiz Logic 封顶 Pass | ✅ 已 tutor 口头确认;待 Ed 私信留痕加固 |
| Individual Reflection 写得太 generic | 15 分中大量扣分 | **Daily journal 制度**(§8.6)— 每天 5 分钟,Week 2 末直接提炼 |
| commits 太少(<12)或全是"fix bug" | Individual Reflection 低分 | 用 `feat:/fix:/refactor:` 前缀、每个小功能一个 commit |
| node_modules 提交到 repo | Process 扣分 | `.gitignore` 第一天就配好 |
| .env 提交到 repo | 安全事件 + 扣分 | `.env.example` 入库,`.env` 进 gitignore |
| D 一人收所有文档/测试尾活 | A/B/C 缺 docs evidence,Reflection 评分降级 | §6 Documentation/Test/Schema Ownership 表 — feature owner 写自己的内容 |
| 集成测试到 Week 2 末才跑,发现一堆问题来不及修 | Demo 翻车 | Tom Week 1 末就写第一版 Postman collection,Week 2 每天跑一次 |

### 本组特有风险

| 风险 | 后果 | 缓解 |
|------|------|------|
| Commits 的 author email 不是绑定到 `github.sydney.edu.au` 账号的悉尼大学邮箱 | GitHub Enterprise contribution stats 不归 uni 身份 → Spec §15 *"may result in 0% contribution"* 触发可能 | **Week 1 早期 4 人各自跑 repo audit prompt**;本地 `git config user.email "<unikey>@uni.sydney.edu.au"`(学生用 `@uni.sydney.edu.au`;`@sydney.edu.au` 是 staff 域,配错会让 commits 不归到学生 uni 身份);如果历史 commits 邮箱错了,用 `git rebase -i` 或 `git filter-branch` 修正(注意:force push 要谨慎) |
| Tutor 同意单 repo / variation 仅有口头记录 | 万一交付时换 marker / 投诉升级,无书面证据 | 下次 tutorial 后在 Ed 给 tutor 发一条**私信**同时确认两件事:(1) variation = Review Mode;(2) single repo at `wege8390/...` instead of Org。对方点 ✓ 即可 |
| `shared/schemas/` 跨前后端 import 配置卡住 | Week 1 进度延迟,可能拖累所有人 | **30 分钟时间盒**:D 在 Week 1 早期尝试,跑不通就立刻回退到前后端各自维护 schema + B/C pair 同步(详见 §7 第 3 项) |
| 第三方 auth 库(Auth0/Firebase/Clerk)误用 | Auth subsystem 直接违规,10 分 Security 重灾 | **Tracy 必读 §3 Authentication 必须**;只用 `bcrypt + jsonwebtoken` 手搓 |
| MongoDB 用了 Atlas 或云数据库 | marker 部署失败,§3 直接扣 + Setup 文档分扣 | 本地 Docker:`docker run -d -p 27017:27017 --name mongo mongo:7`;README 写明这一行 |
| Bonus features 做了但 README 没用 What/Why/How 写 | 拿不到 +5 bonus | D 在 README 里建 `## Beyond the Specification — Bonus Features` 空 section,组员加 feature 时 PR 进去顺手填三段式 |
| Time crunch(2 周节奏被 submission deadline 压紧)| Week 2 后半浓缩到几天,质量下降 | Week 1 前半拿稳骨架,Week 1 后半完成核心,给 Week 2 留出真·打磨 buffer;**任何子系统在 Week 1 末 < 50% 立即组级 escalate** |
| Tom 当天 envelope 没交 → A/B/C 写的 controller 全要返工 | Day 3-4 集中返工,士气崩 | Daily check-in 第一句话 Tom 必须给出 envelope 状态;envelope/errorHandler 在 §8 critical path 标记 |
| Daily check-in 当成 daily journal 来用 | Reflection 仍然 generic | §8.6 明确两者区别 — check-in 在群里,journal 进 git,**两个都要做** |

### 低风险但容易忽略的

- README 里没画架构图 → Process 扣分
- Swagger 只是装了但没写 JSDoc → API 文档不完整
- Dark mode 只有 player 页做了、admin 页没做 → UX 扣分
- 表单用原生 `<input>`+手动 validate 而没用 RHF+Zod → UX 扣分
- Mongoose population 忘了用,前端手动拼接 → Backend 评分降级
- Leaderboard 用 `find().sort().limit()` 而不是 aggregation pipeline → 同一个用户多条记录都进榜,best-per-user 失败

### 好习惯

- 每次 commit 前跑 `npm run lint` 和手测关键功能
- PR review 至少一个人 review 才 merge 到 main
- **Daily check-in 不能跳**(就算只能在群里 push 3 行也要 push)
- **Daily journal 也不能跳**(就算只能写 4 行 markdown 也要 commit)
- Week 末全组开 30 分钟碰头会,统一阻塞问题
- 保留所有草稿和 AI 对话记录一年(学术诚信要求)

---

## 附录:通用协作好习惯

以下是过往全栈作业中验证有效的工程习惯,A2 继续适用:

- **注释写"为什么"不写"做什么":** 尤其是 Review Mode 实现、shuffle 策略、envelope 包装、leaderboard aggregation 选择 → 都是 tutor 会追问的
- **边界情况主动处理并注释:** quiz 中途断网、Score model 里有已删除题目的 answer、admin 删除一个正被进行中的 quiz 引用的题目
- **AI 使用透明披露:** README 或单独的 `AI_USAGE.md` 文件声明,不要藏
- **简单代码拿满分:** 不做 spec 没要求的"我觉得更好"的改动;想加 enhancement 先评估是 bonus 还是 scope creep
- **改动 skeleton 时不要破坏已有功能:** 这次没 skeleton,但要用 conventional commit 清晰追踪谁改了什么
- **口头考核才是真正 deliverable:** 代码跑起来只是起点,解释能力决定分数

---

*v3.0 — Synthesis of v2.9 strategic framework (ownership rules, leaderboard split, cross-pair sync) + v2.8 execution detail (3-tier testing, daily journal vs check-in distinction, README Day-1 skeleton). Demo time-box and rehearsal sections intentionally omitted per group decision. Source of truth: `A2_Specification.md` + `A2_Ed_Discussion_Supplement.md` (paired source files).*
