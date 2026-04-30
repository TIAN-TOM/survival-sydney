# Assignment 2 — Ed Discussion Clarifications (Supplement)

> Compiled from Ed Discussion posts for **Assignments – A2**. Where clarifications below refine or override the original spec, the Ed Discussion staff responses (and tutor-specific overrides) take precedence.
>
> **Status:** Living document — posts added as they appear on Ed.
> **Version:** v0.7 (added paired-reading cross-references) · **Last updated:** 2026-04-29

> ⚠️ **THIS FILE IS HALF OF A PAIR — DO NOT READ IN ISOLATION.**
> The complete A2 reference is **this file + [`A2_Specification.md`](A2_Specification.md)** read together.
>
> - **`A2_Specification.md`**: canonical transcription of the original PDF spec. Stable. Defines what the assignment requires.
> - **`A2_Ed_Discussion_Supplement.md`** (this file): Ed Discussion staff clarifications and tutor-specific overrides. Living document. Refines, constrains, and in some cases overrides the spec.
>
> Reading the supplement without the spec risks reasoning from clarifications without grounding in the actual rules they clarify. Reading the spec without the supplement risks missing binding constraints. **Always read both.**

---

## Quick Reference

| Topic | Key Rule | Source |
|-------|----------|--------|
| **What is a "sub-system"?** | A cohesive, well-bounded part of the application delivering **one specific responsibility**, spanning backend + frontend where relevant, owned and explainable by **one student**. NOT a single function, single file, or "whatever I worked on". | #146 |
| **Authentication** | **Implement your own** — user registration, password hashing, session/token auth, and role-based access control (user vs admin). **No OAuth, no Google/GitHub/Facebook login, no third-party auth services.** | #156 |
| **Allowed libraries (frontend tools)** | Tailwind CSS, Three.js, GSAP etc. are **technically permitted** but **attract zero extra marks** — learning outcomes are *"not about using specific frontend tools or libraries"* and *"not about visual sophistication"*. Native HTML/CSS (clean) is sufficient for full marks. | #154 |
| **MongoDB deployment** | **Must be local** (not MongoDB Atlas or other cloud services). Marker must be able to deploy and test the app in a fully standalone environment. | #144 |
| **GitHub repository** | Default Ed guidance: each team creates their **own GitHub Organization** on `github.sydney.edu.au`, **adds their tutor**, then creates repos inside. **However, individual tutors may relax this** — Tom's tutor confirmed verbally that a single repository (without an Organization wrapper) is sufficient. **Confirm with your own tutor before deciding.** | #157 + tutor |
| **Git branch workflow** | Feature-branch workflow is **acceptable** — you do not have to commit directly to `main`. You **must document in the README** how you used Git and **where the marker can find the log** (which branches, how to `git log` across them). Also invite the tutor to your private repo for commit verification. | #151 |
| **Bonus mark documentation** | To qualify for any of the **+5 bonus marks** (UI/UX polish, thoughtful features, strong error handling), **document in the README** what the feature is, **why** you added it, and **how** it integrates with the rest of the system. Undocumented additions do not earn bonus. | #143 |
| **Categorised variation — data model** | If you choose the Categorised variation: `category` is a property of the **Question**, not of a separate Quiz entity. There is **one Question collection**; when a user picks a category, the backend fetches matching questions and constructs a quiz session on the fly. No separate Quiz collection needed. | #160 |
| **`.js` vs `.jsx` for React** | Both extensions are **acceptable** for React component files. **No marking impact** either way. | #162 |
| **Quiz length (6–10 questions)** | The system (your implementation) decides — **fixed constant, randomised per attempt, or user-selected** are all acceptable, as long as every quiz has between 6 and 10 questions. **Document your choice** in the README. | #164 |

---

## Sub-System Definition & Examples (#146) ⭐ PINNED

> Staff: Masa Takatsuka. Pinned thread — treat as authoritative.

### What a sub-system IS

A sub-system is *"a cohesive, well-bounded part of an application that delivers a specific responsibility, and spans backend and frontend where relevant, and can be clearly owned and explained by one student."*

Three properties must hold:

1. **Cohesion** — the parts inside it belong together (single responsibility).
2. **Vertical span** — it cuts across layers (backend + frontend + DB where relevant), not just one horizontal slice.
3. **Ownership** — one student can point at it, explain it end-to-end, and show commits for it.

### What a sub-system is NOT

- A **single function** (too small / not cohesive enough).
- A **single file** (too narrow / doesn't span layers).
- *"Whatever I happened to work on"* (not bounded by responsibility — just by contribution history).

> Implication for Tom: when writing the Individual Contribution Reflection (15 marks), the subsystem description needs to name a **responsibility**, not a file list. Examples in the rubric hint that markers are looking for "Auth subsystem", not "the files I touched".

### Canonical sub-system examples given by staff

| Sub-system | Core responsibility |
|------------|---------------------|
| **Authentication & User Flow** | Handling *"who the user is and what they're allowed to do"* |
| **Quiz Logic & Scoring** | Handling how the quiz works according to the fixed mechanics |
| **Admin Question Management** | Allowing admins to manage quiz content (**not gameplay**) |
| **Validation, Robustness & Integration** | Ensuring the system behaves correctly under invalid input and edge cases *(staff note: "this might not be so called sub-system, but …")* |

> The parenthetical for Validation/Integration suggests staff themselves are slightly uneasy calling it a "sub-system" in the strict sense — but they accept it as a legitimate primary responsibility, especially for the mandatory 4-person-team integration role described in the spec.

> **Note:** The original post appears to continue beyond what was captured in the screenshot (`...` indicator visible). Further examples or caveats may exist — will update when full thread is available.

---

## Authentication Requirements (#156)

> Staff: Masa Takatsuka. Direct answer to a student question, marked as accepted answer.

**Rule:** You must **implement your own authentication**. External identity providers are **disallowed**.

### You MUST implement

- **User registration and login** — done yourself, not delegated
- **Password handling** — hashing (e.g. bcrypt, argon2) before storage
- **Session or token-based authentication** — JWT counts (and aligns with the spec's "JWT with protected routes" mandate)
- **Role-based access control** — distinguishing `user` vs `admin`

### You must NOT use

- **External authentication providers** — Google, GitHub, Facebook login are all out
- **OAuth / OpenID Connect flows**
- **Third-party services that abstract away authentication logic** — i.e. no Auth0, no Firebase Auth, no Clerk, no Supabase Auth

> Implication: this intentionally forces students to demonstrate understanding of *how* auth works (hashing, token issuance, middleware verification), not just how to wire up a SaaS SDK. This is consistent with the rubric's 10-mark "Security & Validation" criterion.

> **Not explicitly addressed but worth asking the tutor:** whether `passport.js` local strategy counts as "third-party service that abstracts away auth logic" or just a library. Interpretation: `passport-local` is a thin wrapper you still configure yourself — likely acceptable. But if in doubt, hand-roll with `bcrypt` + `jsonwebtoken` to be safe.

---

## Allowed Libraries & Frontend Tools (#154)

> Student: Anonymous. Staff answer: Masa Takatsuka.

**Rule:** You **can** use frontend libraries like Tailwind CSS, Three.js, GSAP, etc., but they **will not earn you any extra marks**. Clean native HTML/CSS is sufficient for full marks.

### Exact staff wording

> *"You can use but it will not attract any extra mark since it will not address the learning outcomes."*
>
> *"The learning outcomes for this assignment are **not about using specific frontend tools or libraries**, and they are **not about visual sophistication**."*

### What this actually means

The follow-up question clarified the key ambiguity: *"Would switching back to native HTML CSS guarantee the mark (if it's clean enough)?"* Staff's answer is effectively **yes** — the markers are looking at architecture, correctness, security, and the approved variation, not at how polished the UI looks or whether you used a trendy library.

### Practical implications for Tom's group

- **Don't add Tailwind/Three.js/GSAP hoping for bonus marks** — you'll eat the complexity cost (bundler config, class-name churn) with zero marking upside.
- **The bonus marks (up to +5) for "Exceptional UI/UX polish"** in the spec are not about libraries — they're about UX thoughtfulness (error messages, loading states, keyboard navigation). Plain CSS done well can get these marks; a messy Tailwind implementation won't.
- **If you already know Tailwind and it speeds you up**, fine — use it. But budget time for config, not for marks.
- **React is obviously still required** (spec mandates it); this clarification is about *additional* styling/animation libraries layered on top.
- **React Hook Form + Zod are still required** by the spec — this clarification doesn't override that.

> Consistent message with #156 (auth): the course is about demonstrating you understand the *principles* (MVC, REST, auth, validation). Libraries that abstract those principles away → no marks. Libraries that just style things → no extra marks.

---

## Database Deployment (#144)

> Student: Maria Zhang. Staff answer: Masa Takatsuka.

**Rule:** **MongoDB must be local.** Cloud-hosted MongoDB (Atlas, DigitalOcean managed Mongo, etc.) is disallowed — even via `MONGODB_URI` connection string.

### Exact staff wording

> *"Please keep the database local. This ensures that if the marker needs to deploy and test the application, they can do so in a fully standalone environment without relying on any external cloud services."*

### Practical implications

- **Connection string in `.env`** should point at `mongodb://localhost:27017/<dbname>` (or equivalent), not an `mongodb+srv://` Atlas URI.
- **README setup instructions** must tell the marker how to run MongoDB locally:
  - Option A: `brew install mongodb-community && brew services start mongodb-community` (macOS)
  - Option B: Docker — `docker run -d -p 27017:27017 --name mongo mongo:7` (cross-platform, recommended for reproducibility)
  - Option C: MongoDB Compass + community edition installer (Windows)
- **Include a seed script** (e.g. `npm run seed`) that populates sample questions and at least one admin user — otherwise the marker has an empty DB and can't test anything.
- **Do NOT commit a `.env` with real credentials**, but DO commit a `.env.example` with the expected variable names.

> This rule cascades into your README's "Setup Instructions" section (Documentation Requirements, 5 marks). Leaving it vague costs marks directly.

### Edge case — is Dockerised local Mongo "local"?

Staff didn't explicitly address this, but the reasoning (*"fully standalone environment without relying on any external cloud services"*) strongly implies **yes, Docker counts as local** — the marker runs the container themselves, no cloud involved. Document the Docker command in the README to avoid any ambiguity.

---

## GitHub Repository Setup (#157)

> Student question: Jonas Lim. Staff confirmation: Mark Denisov.

The spec says the repo *"must be on Sydney University's Github (github.sydney.edu.au)"* but gives no instructions for setup. Staff have clarified the process:

### Setup steps (confirmed by tutor Mark Denisov)

1. **Each team creates their own GitHub Organization** on `github.sydney.edu.au`.
2. **Add the team's tutor** to the organisation.
3. **Create the project repository (or repositories) inside the organisation.**

There is **no pre-existing course-wide organisation** that students join — the team provisions its own org from scratch.

### Practical notes

- Using the Sydney GitHub Enterprise instance (`github.sydney.edu.au`) means you must sign in with your **uni email credentials**, not a personal `github.com` account. Check the spec's Group Member Contribution section: *"Failure to join and use the provided GitHub organisation account (using your uni email) might result in 0% contribution."*
- Having your own org (not a shared class one) means your team has full admin over repos, branches, and members — useful for enforcing PR-based workflows and commit attribution.
- Add the tutor as a **Member** (not just Outside Collaborator) so they can see contribution graphs and issues for grading purposes.

### ⚠️ Tutor-specific override (Tom's group)

After showing this Ed thread to Tom's tutor, the tutor confirmed verbally that **Tom's group does NOT need to create an Organization** — a single repository on `github.sydney.edu.au` (with the tutor added as a collaborator) is sufficient.

This is a **per-tutor relaxation** of the Ed-staff default, not a course-wide change. Implications:

- **For Tom's group**: skip Organization setup. Create one private repo under any team member's `github.sydney.edu.au` account, add the tutor as a collaborator, done.
- **For other groups reading this doc**: do **not** assume your tutor will grant the same flexibility. The Ed thread (where the staff response is from a different tutor, Mark Denisov) is still the authoritative default. Confirm with your own tutor.
- **General lesson**: tutor-level interpretations can legitimately override generic Ed staff guidance for your specific marking. When the spec is ambiguous and your tutor is reachable, **ask them directly first** — their answer is what binds your group.

The Git workflow requirements from #151 (README documenting how to find the log, no squash merges, descriptive commit messages, individual commit references in the reflection) are **unaffected** — they apply regardless of whether you're inside an Organization or a standalone repo.

---

## Git Workflow & Tutor Access (#151)

> Student: Sanskar Agarwal. Staff answer: Masa Takatsuka.

Two related questions, both answered in one post.

### Question 1 — Branch workflow vs. single-main-branch

**Student's plan:** Each member works on their own feature branch with regular commits, then merges into `main` 3–4 times per person. Concern was that `git log` on `main` might hide commits that only exist on feature branches.

**Staff answer:** *"You just need to document how you used the git and where the marker can find the log in the README document."*

### Interpretation

Staff are **not** prescribing a specific workflow. Feature branches are fine, direct-to-main is fine, GitFlow is fine — the requirement is simply that **the marker can find your commit history**. The onus is on you to write the README in a way that makes it findable.

### Concrete README checklist for this

- Name the **branching model** you chose (e.g. "trunk-based with short-lived feature branches").
- State where the authoritative commit history lives — e.g. *"After merging, all commits are preserved on `main`. Use `git log --all --graph` to see the full DAG including merged branches."*
- If you used squash-merging (which collapses feature-branch commits into one), **explicitly warn the marker** — otherwise individual contribution evidence disappears. If you want preserved history, **use regular merge or rebase-merge**, not squash.
- Link each team member's key commits by hash in the individual reflection (spec already requires this).

### Tom's recommendation for the group

Given the spec's hard requirement of **12–15 meaningful commits per person** and the weight on individual evidence (15 marks), strongly prefer:
- **Feature branches per subsystem** (one branch per Role A/B/C/D) → clearer ownership
- **Regular merges** (not squash) → preserves individual commit history
- **Descriptive commit messages** — the marker will read them
- **One final PR per feature with the tutor CC'd as reviewer** → creates a reviewable audit trail

### Question 2 — Tutor access to private repo

**Student's question:** Individual reflection references commit hashes as evidence; should tutor be added as collaborator? Or make the repo public at submission time?

**Staff answer:** *"Yes, it's a good idea to invite your tutor to your private repository."*

### Interpretation

- **Keep the repo private** (no need to make it public at submission).
- **Invite the tutor as a collaborator** (or, following #157, add them to the parent Organization — that's an even cleaner solution since it gives access to all repos in the org at once).
- Do this **early in the project**, not at submission time, so the tutor can observe contribution patterns if needed.

> Combined with #157: create the Org → invite tutor to Org (one-time action, covers all future repos) → create repos inside the Org. This is the minimum-friction path.

---

## Bonus Marks Documentation (#143)

> Student: Maria Zhang. Staff answer: Masa Takatsuka.

**Rule:** To qualify for any of the **up to +5 bonus marks**, every bonus-contributing feature **must be documented in the README** with a three-part description: **what**, **why**, and **how it integrates**.

### What the spec says (context)

The spec lists three avenues for bonus marks:
1. Exceptional UI/UX polish while maintaining clean code.
2. Additional thoughtful features that enhance your approved variation *(clearly documented)*.
3. Strong error handling and user feedback throughout the application.

The parenthetical *"clearly documented"* was ambiguous — student asked whether README is the right place and what format.

### Staff confirmation

Maria proposed a three-point template:
- What the added feature is
- Why we added it
- How it integrates into the overall system

Staff response: *"Yes, all those points should be clearly stated in the README."*

### Interpretation & practical implications

- **The `What / Why / How-it-integrates` triplet is effectively the required format** for each bonus feature.
- Although the spec's parenthetical specifically attaches to point 2 ("thoughtful features enhancing your variation"), staff's reply treats **all three bullet points** under the same documentation standard. Implication: if you want credit for UI/UX polish or error handling, **document those too** — don't assume the marker will infer them from the code.
- **Undocumented polish is invisible polish.** A beautifully-styled empty state that's not mentioned in the README is functionally the same as not having it, for marking purposes.

### Suggested README section template

Consider adding a section to the README specifically for bonus-eligible additions:

```markdown
## Beyond the Specification — Bonus Features

This section documents features added beyond the minimum specification
requirements, included to enhance the user experience.

### 1. [Feature name, e.g. "Toast notification system for all async actions"]

- **What:** One-to-two-sentence description of what the feature does.
- **Why:** What problem it solves / what user experience it improves.
- **How it integrates:** Which components/routes use it; any architectural
  coupling (e.g. "consumed via a `useToast` hook exposed through
  `ToastContext`; called from the quiz submission flow, admin CRUD
  actions, and login/register").

### 2. [Next feature…]
…
```

### Concrete candidates for Tom's group

Natural bonus-mark candidates given the spec constraints (not adding them all — pick 2–3 and document them well):

- **Loading skeletons** on quiz/leaderboard pages (UI/UX polish)
- **Optimistic UI updates** on admin CRUD (polish)
- **Accessible keyboard navigation** through quiz questions (polish, and low-effort if done early)
- **Input validation error messages that are specific** ("Username must be 3–20 alphanumeric characters") rather than generic (error handling)
- **Offline detection banner** or retry logic on network failure (error handling)
- **Per-question review notes** in Review Mode (if that's your variation — thoughtful feature enhancing variation)
- **Category filter on leaderboard** (if Categorised is your variation)

> Tom's principle *"simplest code for full marks"* still applies — don't over-engineer for +5 marks if it adds risk to the core 100 marks. Pick features that (a) you were already going to build for correctness, (b) cost almost nothing to document, and (c) have no regression risk. Document those; skip the rest.

---

## Categorised Quizzes Variation — Data Model (#160)

> Student: Jonas Lim. Staff answer: Masa Takatsuka.

**Only relevant if your group chooses the Categorised Quizzes variation.** Tom's group is currently leaning toward Review Mode, in which case this section can be skimmed for awareness only.

### The ambiguity

The spec says: *"users first select a category; only questions from that category are presented (add a category field to the Question model)."* Two reasonable interpretations:

1. **Filter-within-quiz**: each quiz contains questions from multiple categories, and users filter which category they want at attempt time.
2. **Category-per-quiz**: there are multiple quizzes, each tied to a single category; users pick a category-specific quiz.

### Staff confirmation — interpretation #2

> *"The intended interpretation is the 2nd one. A category is a property of the question, not of an individual question set within a single quiz session. So, when a user selects a category, the system should fetch only questions belonging to that category, and constructs a quiz session using questions from that selected category only."*

### Implications for data model & admin interface

- **One `Question` collection.** Each `Question` document has a `category` field (string or enum).
- **No separate `Quiz` collection.** A "quiz" is a transient runtime object — the backend assembles 6–10 questions matching the chosen category at request time. The result of an attempt is still saved to the `Score` collection (per the spec's mandatory `Score` model).
- **Admin manages the Question collection directly** — they don't author "Quiz objects" or pre-bundle questions into named quizzes. Admin CRUD is on questions only.

### Open follow-up (not yet confirmed by staff)

The student (Jonas Lim) followed up with a clarifying comment summarising the implication for the admin interface — *"admin(s) log into admin interface, and they directly CRUD this 1 Question collection? Is my understanding correct?"* — but **staff have not yet replied** at the time of this snapshot.

The interpretation is the **most natural reading** of staff's first answer (no separate Quiz collection, category lives on Question, no `quizId → questionId` mapping table needed), but until staff explicitly confirm, treat the admin-CRUD-only-on-questions approach as the **default plan** and watch the thread for confirmation.

### Why this matters even if you don't pick Categorised

The principle generalises: **questions are the primary data; quizzes are runtime constructs.** This is consistent with the spec's mandate that *"questions must be shuffled randomly for each quiz attempt"* — implying quizzes don't pre-exist in the DB, they're built per-attempt. So even for Review Mode or Timed variations, your data model should have:
- `Question` collection (the question bank)
- `Score` collection (attempt records, with full answer list per spec)
- **No** `Quiz` collection (would be an over-design)

---

## React File Extensions: `.js` vs `.jsx` (#162)

> Student: Jingchen Li. Staff answer: Masa Takatsuka.

**Rule:** Both `.js` and `.jsx` extensions are acceptable for React component files. **No marking impact.**

### Practical note

This is a low-stakes question but worth recording so the team doesn't churn on it. If you're using **Vite** (default React scaffolding tool in 2026), the conventions are:

- **Vite default**: `.jsx` for files containing JSX syntax. JSX in `.js` requires a Vite config tweak.
- **Create React App (legacy)**: `.js` was the historical convention.

Pick one and stay consistent across the team — mixed extensions in the same repo signal lack of convention discipline (won't cost marks per staff, but won't help either).

> Tom's group recommendation: **default to `.jsx`** if using Vite (no config needed); **default to `.js`** if for some reason you're sticking with CRA. The shorthand-import behaviour (`import X from './X'` resolving with or without extension) works the same either way.

---

## Quiz Length: Fixed, Random, or User-Chosen? (#164)

> Student: Anonymous. Staff answer: Masa Takatsuka.

**Rule:** The number of questions per quiz is **your design decision**, as long as it stays within the 6–10 range mandated by the spec.

### Exact staff wording

> *"You (as your system) can decide how many (between 6 - 10) questions are sequentially presented."*

### Three valid implementations

| Approach | How it works | Trade-offs |
|----------|-------------|-----------|
| **Fixed constant (e.g. always 8)** | Hard-code a single value | Simplest. Predictable for testing. Leaderboard scores are directly comparable across attempts. |
| **Randomised per attempt** | Each quiz attempt picks a number between 6 and 10 at session-start | More variety. Slightly harder leaderboard fairness — a 6-question quiz has a max score of 6, a 10-question quiz has a max score of 10, so raw scores aren't apples-to-apples. |
| **User-selected** | UI lets the user choose how long their quiz should be | Most flexible. Same leaderboard concern as randomised. |

### Tom's recommendation

**Use a fixed constant — pick 10.** Reasons:
1. **Simplest code**, consistent with Tom's principle of minimum-viable-implementation.
2. **Leaderboard comparability** — every score on the leaderboard is "X out of 10", trivially ranked. Avoids needing percentage-normalisation logic.
3. **Easier to demo and test** — markers running through a few attempts will hit the same length each time.
4. **Document the choice in README** — staff explicitly asked for documentation of design choices throughout the spec; one sentence covers it. *"Each quiz contains exactly 10 questions, randomly selected from the active question pool. We chose a fixed length over a randomised or user-selected length to keep leaderboard scores directly comparable."*

### Interaction with seed data

If you go with fixed-10, your seed script must populate **at least 10 active questions**. If you go with Categorised variation + fixed-N, you need **at least N active questions per category** — otherwise the quiz can't be assembled and the marker hits an error. This is an edge case worth handling explicitly: backend should return a clear error if there aren't enough questions matching the request.

### Interaction with leaderboard scope (still an open question — see Gaps)

The student's note *"this would affect the leaderboard implementation"* is correct. The spec leaves it open whether leaderboard shows "all attempts" or "best per user", but if you allow variable quiz length, you also need to think about whether the leaderboard should normalise (e.g. show percentages) or display raw scores. Fixed length sidesteps this entirely.

---

## Source Posts Index

| Post | Title | Author | Staff Response | Views |
|------|-------|--------|----------------|-------|
| #143 | Documentation for additional features | Maria Zhang | Masa Takatsuka (STAFF) | 156 |
| #144 | Does MongoDB need to be local? | Maria Zhang | Masa Takatsuka (STAFF) | 174 |
| #146 ⭐ | What Counts as a "Sub-System" in This Assignment? | Masa Takatsuka (STAFF) | — (original post) | 192 |
| #151 | Git Workflow & Tutor Access for Group Assignment Submission | Sanskar Agarwal | Masa Takatsuka (STAFF) | 180 |
| #154 | Allowed libraries | Anonymous | Masa Takatsuka (STAFF) | 106 |
| #156 | Do we need to implement our own authentication or can we integrate external providers for authentication? | Jonas Lim | Masa Takatsuka (STAFF) | 68 |
| #157 | Git repository (backend + frontend) with clean commit history. This must be on Sydney University's Github (github.sydney.edu.au). | Jonas Lim | Mark Denisov (STAFF) | 234 |
| #160 | Clarification on Assignment 2 Variant: Categorized Quizzes | Jonas Lim | Masa Takatsuka (STAFF) | 158 |
| #162 | ".js" vs ".jsx" for React frontend | Jingchen Li | Masa Takatsuka (STAFF) | 152 |
| #164 | Quiz Question Number Clarification | Anonymous | Masa Takatsuka (STAFF) | 108 |

---

## Gaps / Open Questions (to watch for)

As more Ed posts arrive, expect clarifications on these spec-ambiguous areas:

- **Variation approval mechanism** — how exactly does the Week 9 tutor acknowledgement work? Written email, in-lab signoff, PR comment?
- **Rate limiting specifics** — what counts as "basic"? Per IP, per user, fixed window, sliding window? Any required thresholds?
- **API envelope on errors** — does a 4xx/5xx HTTP status alone suffice, or must `success: false` also be in the body?
- **Leaderboard scope** — "all attempts" vs "each user's best attempt" is student choice, but does staff have a preference for the demo?
- **Shuffling scope** — must *answer options* also be shuffled, or only the question order?
- **Dark mode coverage** — does "applies to both player and admin interfaces" mean a single shared toggle/state, or each can have its own?
- **Individual reflection format** — does the 1–2 page limit include the sequence diagram?
- **Admin account provisioning** — is admin self-registration allowed, or must admins be seeded in the DB?
- **Bulk import JSON schema** — exact required fields and validation rules?
- **Variation deviation penalty** — spec says *"any deviation will result in deductions"* — is that a fixed mark loss or proportional?

---

## ⚠️ End of Supplement — Continue Reading

This file is **half of a pair**. The other half is **[`A2_Specification.md`](A2_Specification.md)**, the canonical transcription of the original PDF spec. The clarifications above refine, constrain, and in some cases override the rules in the spec.

**If you reached this point without reading the spec, stop and read it now.** The two files together form the complete A2 reference.

---

*Document maintained by Tom. Compiled from Ed Discussion threads under Assignments – A2.*
