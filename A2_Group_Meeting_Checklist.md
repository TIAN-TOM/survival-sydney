# A2 — Loose Ends Checklist（组会处理清单）

> **用途：** 记录对话过程中冒出来、单独不够 P0 但容易遗忘的小事情。组会上一项一项过、当场拍板或分工。
>
> **首次会议目标：** Week 1 第一次组会上一次性过完
>
> **本文件位置：** Playbook + Guide 是**主文档**；本文件是**组会议程缓冲区**。Items 在会议上处理完应：(a) 划掉，(b) 如果产生持续约束 → 上推到 Playbook，(c) 如果只影响 Tom → 上推到 Guide。
>
> **维护规则：** 每次组会前 Tom review 一次，新增遗漏项；每次组会后清理已 resolve 的项。

---

## 1. 核心决策（必须组里拍板，不能拖）

| # | 决策 | Tom 默认推荐 | 决定后 propagate 到 |
|---|------|------------|-------------------|
| 1.1 | Quiz 长度：固定 10 题 / 6-10 随机 / 用户选 | **固定 10** [Ed #164 + minimum-viable 原则] | README justification + Playbook §1 |
| 1.2 | Leaderboard scope：all-attempts / best-per-user | **best-per-user** | README justification + Playbook §1 |
| 1.3 | 截止日期对齐 | submission 按 Spec metadata Due 字段 committed（不走 late window） | Playbook §8 已对齐 |
| 1.4 | Branch 策略：feature branch + regular merge / 其它 | **feature branch + regular merge（不 squash）** [Ed #151] | README git workflow note |
| 1.5 | shared/schemas 路径：monorepo / 双份 schema | **30 分钟 timebox 试 monorepo，跑不通双份** | Playbook §7 第 3 项 |
| 1.6 | 文件后缀：`.jsx` / `.js` 全队统一 | **`.jsx` (Vite)** [Ed #162] | README setup |
| 1.7 | Mongo 启动方式：Docker / brew install / 各人自便 | **Docker：`docker run -d -p 27017:27017 --name mongo mongo:7`** | README setup |

---

## 2. 状态确认（核对已做没做）

| # | 项 | 谁负责 | 当前状态 |
|---|---|--------|---------|
| 2.1 | Repo 是否已重命名（去 typo `COMP5437`） | Raven 操作 | ❓ 未知 — 我之前先说"不用改"后又说"建议改"，需要确认实际状态。如已改，4 人需要 `git remote set-url origin <新URL>` |
| 2.2 | tutor 已加 collaborator | Raven | ❓ 假设已做但需验证 |
| 2.3 | `main` branch protection | Tom | ⏳ Pending（10 分钟工程：Settings → Branches → Add rule → Require PR + 1 approval） |
| 2.4 | 4 人 commit author email 是绑定到 `github.sydney.edu.au` 账号的悉尼大学邮箱（学生通常是 `*@uni.sydney.edu.au`，**不是** `@sydney.edu.au` staff 域） | 4 人各自 | ⏳ Audit checklist 已写好待发；3 人跑完截图回传 |
| 2.5 | Tom 的 GitHub username | Tom 自填 | ✅ Done — `ytia0619`，已落 Playbook §6 + Guide §2 |
| 2.6 | `.gitignore` cover `node_modules/` 和 `.env` | Day 1 谁先建谁配 | ⏳ 第一次 push 之前必须就位 |
| 2.7 | `.env.example` 入库（无敏感值） | D / 任一人 | ⏳ Phase 1 |
| 2.8 | `docs/integration-decisions.md` 建好 + ADR 模板（v3.0 §6） | Tom | ⏳ Day 1 |
| 2.9 | 4 个 `docs/private-journal/<unikey>.md` 4 人各自建好（v3.0 §8.6） | 4 人各自 | ⏳ Day 1 — Tom 提醒每人当天 commit 第一条 |
| 2.10 | README skeleton 按 v3.0 §9 owner 标注 TODO 落地 | Tom | ⏳ Day 1 |
| 2.11 | `docs/postman-collection.json` 第一版（v3.0 §8.5） | Tom | ⏳ Phase 2 末（Week 1 后半末） |
| 2.12 | `docs/manual-test-checklist.md` 骨架建好（v3.0 §8.5） | Tom 起头，4 人共建 | ⏳ Phase 3（Week 2 前半起） |

---

## 3. 红线提醒（一对一同步给具体成员）

> 这一节是开会时**说出来给具体的人听**的，不需要他们事后查文档。

### Tracy（A — Auth）
- **必读 Ed #156**：Auth 必须手搓
- **禁用清单**：Auth0、Firebase Auth、Clerk、Supabase Auth、Google/GitHub/Facebook OAuth — 用了直接违规，10 分 Security 重灾
- `passport-local` 是薄包装、staff 没明确表态 — **建议直接 `bcrypt + jsonwebtoken`** 最稳，避免争议
- **v3.0 ownership**：你覆盖 **AuthContext + Login.js + Register.js 前端组件**（不只是 backend auth）。这是 vertical slice ownership——D 不替你写登录注册 UI

### Raven（B — Quiz Core + Review Mode）
- **Score schema 必须存完整答题列表**（`questionId` + `selectedAnswer` + `isCorrect`）—— 这是 **Spec §9.2 硬要求**，不是 Review Mode 加的
- **Review Mode 页用 Mongoose population**（`Score.answers.questionId` → `Question`）拿题目全文 —— 这是 **team design decision（Playbook §4）**，不是 spec mandate。Spec 同时允许 snapshot 作为 robustness fallback，但我们组没采用
- 选 population 的理由：admin 改题/加 explanation 后老 review 自动同步；snapshot 会让历史和最新题库不一致
- 别中途改成 snapshot —— 会 invalidate Playbook §4 写进 README 的 justification
- **v3.0 ownership**：你拥有 **Leaderboard 后端 endpoint（`GET /api/quiz/leaderboard` in `quiz.controller.js`，含 aggregation query）+ History page**——D 只接前端 UI。理由：你是 Score model owner，aggregation 和 history 都是 Score 数据的延伸

### Allen（C — Admin）
- bulk import 必须做 **server-side validation**（Spec §8 硬要求）；**team convention 用 Zod + atomic insert**（数组里第 N 项非法 → 整批 reject，不能部分插入）—— atomic 不是 spec 强制，是我们组的 robustness 选择
- 错误信息要明确告诉用户**第几条**有问题（不是只说"有错"）
- Active/inactive toggle：**recommended endpoint** `PATCH /api/admin/questions/:id/active`（team REST 设计选择；spec 只要求 toggle 能力，没规定 endpoint 形状）
- **v3.0 ownership**：你边界是 **Admin dashboard / QuestionForm / BulkImport / active toggle**——你**不**负责 History page（Raven 的）、不负责 Question consumer 逻辑（Raven 的）

### Tom（D — Integration Lead）— 给自己的红线
- **D ≠ 兜底 owner**（v3.0 §6 红线）：A/B/C 的 endpoint Swagger JSDoc、子系统 README 段、controller Jest 单测都由 owner 自己写。如果发现 PR 里某 owner 的 evidence 缺失，**退回让本人补，不要替他写**——否则他失去 reflection evidence、你被压垮
- D 必须做：6 个 shared contracts、Home page、Leaderboard frontend integration、README 框架 + 架构图、Swagger 框架 + JSDoc 一致性审计、Postman E2E（第一版 + 终版）、`docs/integration-decisions.md` ADR 维护、envelope/errorHandler Jest 单测

### 全员
- **MongoDB 必须本地**（Docker 视为 local，Atlas 禁）[Ed #144]
- **Bonus 功能要拿分必须在 README 写 What / Why / How-it-integrates 三段式**[Ed #143]，没文档 = 没分
- **commits 12-15 个最低线**，目标 18-25。Generic "fix bug" / "update" 不算
- **Conventional commit** 前缀：`feat:` / `fix:` / `refactor:` / `docs:` / `test:`
- **每人维护 daily journal 进 git**（`docs/private-journal/<unikey>.md`），按 Playbook §8.6 4 行格式：commits / what / challenge / how solved。Week 2 末写 Reflection 时是命根。**Daily journal（进 git）和群里 daily check-in 是两件事，都要做**——前者攒 reflection 素材，后者让 D 看到 blocker
- **不许多写 spec 没要求的功能**：Tailwind / Three.js / GSAP 零加分 [Ed #154]；OAuth / WebSocket / 文件上传 / 高级动画全禁 [Spec §9.6]；多人 / 实时 / 自适应分支全禁 [Spec §6 Disallowed]

---

## 4. Pair 结构落地（这周内做）

- [ ] **A+D（Tracy + Tom）30 分钟同步**：middleware + envelope + axios interceptor 契约对齐。auth middleware 怎么把 error 冒泡进 errorHandler、再变成 envelope；axios interceptor 怎么解 envelope
- [ ] **B+C（Raven + Allen）30 分钟同步**：定 `Question` schema 字段（含 `explanation: String, default: ''`）。两人一起决定字段约束（max length、是否 trim、是否 sanitise HTML）
- [ ] **Code review 强绑定共识**：A 的 middleware PR 必须 D 审；B/C 的 Question model 改动互相必须 approve

---

## 4.5 Cross-Pair Contract Sync（v3.0 §6 — 6 项 contract 全组对齐）

> Pair sync 不够——以下 6 项契约改一个就牵动 3 人以上，必须全组在场对齐，决议进 `docs/integration-decisions.md`（ADR 风格，D 维护）。**完整规则见 Playbook §6 Cross-Pair Integration Sync**，本节只是组会上逐项问"定了没"的清单。

- [ ] **JWT token shape**：payload 含哪些字段（`userId` / `role` / `iat` / `exp`），过期策略多久
- [ ] **Response envelope**：`{ success, data?, error? }` 字段名、`error` 是 string 还是 object
- [ ] **Question schema**：字段、validation 规则、`explanation` 是 required 还是 optional default `''`
- [ ] **Score schema**：`answers` 数组结构、是否 populate `questionId`
- [ ] **Error format**：4xx vs 5xx 暴露什么、HTTP status code 约定
- [ ] **Frontend route map**：哪些路由 protected、哪些是 admin-only、参数命名

**Cadence：** Daily async check-in 贯穿 2 周；Week 1 至少 2 次 15 分钟 stand-up；Week 2 隔日 15 分钟 stand-up。**主持人：D。**

## 4.6 Daily check-in vs Daily journal（v3.0 §8.6 — 两个都要做）

> 容易混。组会上一次说清楚，避免组员把 daily check-in 当成 daily journal。

| 维度 | Daily check-in | Daily journal |
|------|----------------|---------------|
| 在哪 | 群里（微信/Discord/Slack） | `docs/private-journal/<unikey>.md`（**进 git**） |
| 目的 | D 知道 blocker、谁卡谁 | 攒 Reflection PDF 的素材 |
| 时机 | 每天早上 / 工作前 | 每天工作结束 / commit 完 |
| 格式 | 3 行（昨天/今天/blocker） | 4 行（commits / what / challenge / how solved） |

**核心论点（组会上要说出来）：** Reflection 评分 generic vs specific 差距 9-12 分（Playbook §8.6 引 Spec §11 原文）。Daily journal 是产出 specific reflection 的最低成本路径——每天 5 分钟，节省最后 3-4 小时凭记忆补写。

---

## 5. README placeholder（Tom Day 1 完成 — v3.0 §9 Day 1 skeleton）

- [ ] Spec §10 的 6 个必需 section 全部建空壳，按 v3.0 §9 ownership 标注 TODO owner：
  1. **Setup instructions**（含 `.env.example` + Docker Mongo 命令）→ TODO (Tom)
  2. **System overview + Architecture diagram** → TODO (Tom)
  3. **Variation description + justification** → TODO (Raven)
  4. **Subsystem Documentation 段**（4 个子段）：
     - Auth & Security → TODO (Tracy)
     - Quiz Logic & Review Mode → TODO (Raven)
     - Admin Subsystem → TODO (Allen)
     - Integration & Documentation → TODO (Tom)
  5. **Team Roles & Key Commits**（每人 3-5 个代表 commit）→ 每人各自填
  6. **API Documentation**（链接到 `/api-docs` Swagger UI）→ TODO (Tom)
  7. **Git Workflow note** [Ed #151] → TODO (Tom)
- [ ] `## Beyond the Specification — Bonus Features` 段：What/Why/How 三段式模板放好（feature 提议者补三段式）

> **要点：** Day 1 skeleton 让"每人完成自己的 feature 后顺手填 2 分钟"，不要等到 Week 2 末才补。每个 TODO 标 owner 比"集中找 Tom 补"更可靠。详见 Playbook §9 README.md Day 1 placeholder skeleton。

---

## 6. 待 tutor 澄清（攒到下次 tutorial 或 Ed DM 一次问完）

来源：Ed Supplement "Gaps / Open Questions" + 我们对话中冒出的不确定项。

- [ ] **Variation 留痕**：Ed DM 给 tutor 把"Review Mode + 单 repo"写上，对方 ✓ 即可（口头确认 → 书面证据）
- [ ] Rate limit 是否有具体阈值要求？还是 "basic" 就够？
- [ ] 错误响应必须 body 里带 `success: false` 还是只 4xx HTTP status 即可？
- [ ] Shuffle 范围：只打乱题目顺序，还是 4 个选项也要打乱？
- [ ] Dark mode：单一 toggle 共享 player + admin，还是两边各有各的？
- [ ] Individual Reflection 1-2 页是否包含 sequence diagram？还是 diagram 不算页数？
- [ ] Admin 账户：能在 UI 自助注册，还是只能通过 seed script 创建？
- [ ] Bulk import JSON 字段是否有具体 required fields list？
- [ ] Variation 偏离的扣分是固定数还是按比例？

> 一次性问完比每次 tutorial 零碎问效率高。Tom 整理成一条 Ed DM。

---

## 7. 之前给过的建议但状态不明（需要 Tom 当场 check）

- [ ] Audit checklist 是否已发给 Tracy/Raven/Allen？是否收到 3 份截图？
- [ ] Repo 是否已重命名？我建议过改为 `comp5347-a2-quiz-game` 但用户没确认
- [ ] Repo 是否已邀请 tutor 当 collaborator？

---

## 8. 不在本次会议处理但记录在案（提醒 Tom 后续）

> 不需要会议讨论，但容易忘 — Tom 自己跟踪。

- [ ] Tom 个人 daily journal `docs/private-journal/ytia0619.md`（**进 git**）**从 Week 1 第一天就开始写**（不是 Week 2 末才补），按 Playbook §8.6 4 行格式
- [ ] Phase 1 D 的 6 个 shared contract 代码骨架
- [ ] Phase 4 Bonus features 收集时盯 What/Why/How 是否齐 — 不齐就 PR 退回
- [ ] Demo Week 12 提前 1 周组织 walk-through，每人讲自己 + 听别人

---

## 会议结束后的 propagate 路径

| 议程项类型 | 解决后去哪 |
|-----------|----------|
| 团队级长期约束（如 quiz 长度定 10） | → Playbook v3.x（bump minor） |
| Tom 个人执行（如 journal 已开始） | → Guide v3.x |
| 单次行为（如 main branch protection 已配） | → 本文件划掉，不动其它 |
| 待 tutor 澄清的 → 已得到答案 | → Ed Supplement v0.x（如 Tom 维护这个） + Playbook |

---

*Loose ends checklist — 回扫整个 A2 对话历史聚合而成。Audit trail：v2.5 三处措辞修正（§2.4 邮箱域名、§3 Raven population 红线降级、§3 Allen atomic insert + PATCH endpoint 降级）；v2.7 去日期化以便跨学期复用；v3.0 sync round 1 — §3 全员 journal 描述对齐 Playbook §8.6 / §9 Tom 个人 journal 路径同步 / propagate 路径表 v2.x → v3.x；v3.0 sync round 2 — §2 加 5 个 v3.0 deliverable 状态项（integration-decisions.md / 4× private-journal / README skeleton owner-tagged / Postman v1 / manual-test-checklist）；§3 各角色段加 v3.0 ownership 边界提醒（Tracy 覆盖 AuthContext+Login+Register；Raven 拥有 Leaderboard 后端 + History；Allen 不负责 History；Tom = D 不是兜底 owner）；新增 §4.5 Cross-Pair Contract Sync（6 项 contract checklist，引用 Playbook §6 不复述）；新增 §4.6 Daily check-in vs Daily journal 对比表；§5 README placeholder 按 v3.0 §9 owner 标注 TODO。组会后清理已 resolve 的项，剩余滚动到下次会议。*
