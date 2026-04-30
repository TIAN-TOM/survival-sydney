# Assignment 2 — Full Stack Group Project (Canonical Spec)

> **Source:** `Assignment_2_-_Full_Stack_Group_Project.pdf` (Canvas).
> **Purpose:** Working source-of-truth document for completing Assignment 2. Faithful structured transcription of the original PDF — no additions, no omissions, no interpretations. Where the PDF contains obvious typos (e.g. "Grame" → "Game", "Sydne" → "Sydney"), the corrected form is used and the typo is noted in `[sic]`-style brackets only when the original wording matters.
> **Section numbering:** The original PDF does not visibly number its sections (only headings). Section numbers `1.`–`18.` below are introduced by this document for navigation. Where the PDF contains internal cross-references like *"see Section 5"* or *"see Section 11"*, the original PDF reference is preserved verbatim, with this document's mapping in `[in this document, Section X]` brackets.
> **Verification:** Cross-checked against `pdftotext -layout` extraction of the source PDF on 2026-04-29. All 57 critical facts verified present (dates, points, percentages, all 4 variations, all 7 rubric items, contribution scaling table, repository skeleton, URLs). No fabrications, no omissions.
>
> **Transcription correction (2026-04-30):** Section ordering re-verified against Canvas screenshot. Sections **§11 (Individual Assessment Component)** and **§12 (Bonus Marks)** were swapped in earlier transcription versions; their content has been re-ordered to match the source PDF, and three internal cross-refs corrected: line 86 (Individual reflection ref), line 238 (skeleton ref `Section 19` → `Section 17` — there are only 18 sections), line 298 (rubric Bonus ref `Section 11` → `Section 12`). Subsection numbers `§12.1`/`§12.2` correspondingly renumbered to `§11.1`/`§11.2`. Downstream docs (Playbook, Tom Guide) updated to reference `Spec §11.1` for the 4-person integration mandate.

> ⚠️ **THIS FILE IS HALF OF A PAIR — DO NOT READ IN ISOLATION.**
> The complete A2 reference is **this file + [`A2_Ed_Discussion_Supplement.md`](A2_Ed_Discussion_Supplement.md)** read together.
>
> - **`A2_Specification.md`** (this file): canonical transcription of the original PDF spec. Stable. Defines what the assignment requires.
> - **`A2_Ed_Discussion_Supplement.md`**: Ed Discussion staff clarifications and tutor-specific overrides. Living document. **Refines, constrains, and in some cases overrides the spec below.**
>
> Reading the spec without the supplement risks missing binding constraints (e.g. MongoDB must be local; OAuth-style external auth is disallowed even though "JWT" is permissive on its face; tutor-specific GitHub setup may differ from the staff default). Always check the supplement before treating any rule below as final.

---

## Course & Submission Metadata

| Field | Value |
|-------|-------|
| Course | Web Application Development (COMP5347 / COMP4347) |
| School | School of Computer Science |
| Assignment | Assignment 2 — MERN Stack Online Game [PDF says "Grame"] |
| Points | 100 (Bonus up to +5, final mark capped at 100%) |
| Submission window | 4/13/2026 – 6/7/2026 |
| Due | 5/15/2026 |
| Attempts | Unlimited |
| Duration | 4 weeks |
| Group size | 3 or 4 students |
| Assessment type | Group with individual component |
| Technology stack | MongoDB, Express, React, Node.js (MERN) |

---

## 1. Assignment Overview

In this assignment you will work in a group of three (3) or four (4) students to design and implement a full-stack web application using the MERN stack.

The application is a **single-player online quiz game** that includes:

- a user interface for players to take quizzes, and
- a separate admin interface for managing quiz questions.

The assignment is designed to be completed over 4 weeks and emphasises:

- correct system architecture,
- client–server interaction,
- authentication and authorisation,
- robustness and correctness,

**rather than** graphical complexity or feature breadth.

---

## 2. Project Structure

Your app will have two main components:

1. **User interface and functionality** (frontend + backend)
2. **Admin interface and functionality** (dedicated admin page)

---

## 3. Learning Objectives

By completing this assignment, students will demonstrate the ability to:

- Design a web application using MVC (or clean architecture) principles
- Build RESTful APIs using Node.js and Express
- Persist data using MongoDB and Mongoose
- Develop an interactive frontend using React with proper state management
- Implement authentication and role-based access control
- Apply fundamental web application security practices
- Collaborate effectively in a small development team and document their individual technical contributions with evidence

---

## 4. Team Structure and Expectations

- Groups may consist of either three (3) or four (4) students.
- Each student must:
  - contribute to **both backend and frontend** development, and
  - take **primary responsibility for one clearly defined subsystem**.
- All group members are expected to understand the overall system, even if they are not the primary contributor for every component.
- Each student must submit an Individual Contribution Reflection describing their role and technical work (see Section 11).

---

## 5. Mandatory Group-Specific Variant (IMPORTANT!!)

To ensure originality and deeper learning, each group must select and obtain your tutor's acknowledgement for **one** game mechanic variation listed below by **the end of Week 9**.

You must implement the **core fixed mechanics** (see Section 5 [in this document, Section 6]) **plus your variation**.

> **Standard plain multiple-choice implementation without a variation will be capped at Pass level for Quiz Logic & Mechanics.**

### Allowed variations (choose exactly one)

1. **Timed questions** — each question has an individual countdown timer; remaining time adds a small bonus (max +1 point total per quiz, still based primarily on correctness).
2. **Categorised quizzes** — users first select a category; only questions from that category are presented (add a `category` field to the Question model).
3. **Image-based questions** — at least 50% of questions include an image URL; display the image with the question text.
4. **Review mode after completion** — after the final score, display all questions with correct/incorrect indicators and (optional) an explanation field added to the Question model.

Your chosen variation must be:

- clearly described in the README,
- justified with design decisions, and
- demonstrated in the final submission.

**Any deviation from your approved variation will result in deductions.**

---

## 6. Core Game Mechanics Specification (Fixed — Must be followed)

The base game mechanics remain fixed:

- Each quiz consists of **6–10 multiple-choice questions** presented sequentially.
- Each question has **exactly four (4) answer options** and **one correct answer**.
- Questions are retrieved from the backend via a RESTful API.
- Users select one answer per question; **once submitted, the answer cannot be changed**.
- **Scoring:** +1 point per correct answer only (no negative marking, streaks, or complex bonuses except the small timer bonus if your approved variation includes it).
- After the final question, display the final score and **save the quiz attempt to the database** (including user ID, score, timestamp, and full list of answers for your variation).
- **Leaderboard** displays username and score (highest first; ties allowed). You may show all attempts or each user's best attempt (**document your choice**).

### Disallowed

Multiplayer, real-time features, adaptive branching, alternative scoring schemes beyond your approved variation.

---

## 7. User Functionality (Player Interface)

Registered users must be able to:

- Register and log in/out
- Take a quiz (following core mechanics + your approved variation)
- View immediate final score
- View their past quiz attempts (including answers selected if part of your variation)
- View the leaderboard

---

## 8. Admin Functionality (Dedicated Admin Interface)

Admin users must be able to:

- Log in via the admin interface
- Create, edit, delete, and toggle active/inactive status of questions (including any extra fields required by your variation)
- Bulk import questions via a textarea (JSON array) with validation

**Admin access must be enforced on the backend (middleware) and restricted on the frontend.**

---

## 9. Technical Requirements & Constraints

### 9.1 Backend

- **Node.js + Express** with clear separation of concerns (routes, controllers, models/services).
- Use **Mongoose population** where appropriate.

### 9.2 Database

- **MongoDB with Mongoose.**
- The **Score model must store the full list of answers** (`questionId` + `selectedAnswer` + `isCorrect`).

### 9.3 Frontend

- **React** (functional components) using **React Context + useReducer** (or **Zustand**) for quiz state management.
- All forms must use **React Hook Form + Zod** for validation.

### 9.4 Authentication

- **JWT** with protected routes.
- Implement **basic rate limiting** on login and quiz submit endpoints.

### 9.5 Additional mandates

- All API responses must use a consistent envelope: `{ success: boolean, data?: any, error?: string }`.
- Questions must be **shuffled randomly** for each quiz attempt.
- Implement a **dark mode toggle** (persisted in `localStorage`) that applies to **both player and admin interfaces**.
- Backend must include **basic server-side input validation** and **protection against common injection/XSS**.

### 9.6 Out-of-scope (no marks)

OAuth, WebSockets, file uploads, advanced animations.

---

## 10. Documentation Requirements

Your Git repository must include a comprehensive **`README.md`** containing:

- Clear setup instructions (including environment variables)
- System overview and architecture diagram (Mermaid or UML)
- Description and justification of your approved variation
- Team role breakdown with links to key commits
- Self-hosted API documentation (e.g., Swagger/OpenAPI or clear Postman collection export)

---

## 11. Individual Assessment Component (15 marks)

Each student must submit a **1–2 page Individual Contribution Reflection (PDF)** that includes:

- The subsystem you were primarily responsible for and how you implemented it.
- At least one major technical challenge you encountered and how you resolved it (include relevant code snippets or commit links).
- A **Mermaid sequence diagram or UML diagram** for your subsystem.
- Analysis of your git commit history (**minimum 12–15 meaningful commits**) showing your contributions with **specific commit hashes and explanations**.
- Reflection on design decisions related to your group's approved variation.

### 11.1 Group-of-4 specific requirement

In groups of four (4), **one student must take primary responsibility for system integration, validation, and robustness**. This includes handling edge cases, input validation, and ensuring consistent behaviour between the frontend and backend.

### 11.2 Group-of-3 specific requirement

In groups of three (3), these above mentioned responsibilities are **shared among the team**.

> **Reflections that appear generic or lack personal evidence (e.g., specific commits, diagrams, challenges) will receive low marks.**

---

## 12. Bonus Marks (up to +5, final mark capped at 100%)

Bonus may be awarded for:

- Exceptional UI/UX polish while maintaining clean code.
- Additional thoughtful features that enhance your approved variation (clearly documented).
- Strong error handling and user feedback throughout the application.

---

## 13. Deliverables

- **Git repository** (backend + frontend) with clean commit history. This must be on Sydney University's GitHub (`github.sydney.edu.au`) [PDF says "Sydne"]. The suggested repository skeleton is provided at the bottom of this specification (Section 17).
- **Group assignment coversheet** — [download link](https://edstem.org/au/courses/31106/resources?download=22808).
- **`README.md`** as specified (Section 10).
- **Individual contribution reflections** (one per student).
- **Submit a zip file** with all your files in your repository including the group assignment cover sheet signed by all members **on Canvas**. (You can use "Download ZIP" menu from your repository's "<> Code" menu.)
- **Do not include** the JavaScript files from `node_modules` or other dependencies/libraries in your zip file.
- **Live demonstration** that clearly shows your approved variation in action.

---

## 14. Application Demo

- **All team members must present part of the app.**
- Be ready to answer questions about the design and your code.

Each group must demo their application during **Week 12**. Each team member will be required to demo one part of the application, and they should be able to answer any question about the application design and implementation.

### Demo preparation checklist

- Expect to discuss **edge cases**.
- Adhere to good user design and user experience principles.
- Each member should have **complete understanding of how the overall system works**. I.e. someone who worked delicately on the frontend must also be able to answer database questions. **It is highly recommended to follow the bus factor.**
- Following good software design principles is recommended.
- If you are using **external libraries not discussed in the tutorials**, discuss it with your tutor. Your tutor may be unfamiliar with the library you're using. Expect to answer questions about the usage of the library in your assignment, e.g. reasons for using the library and alternative solutions.

---

## 15. Group Member Contribution

If members of your group do not contribute sufficiently you should **alert your tutor as soon as possible**. The contributions of each group member will be checked from the project's GitHub repository.

> **Failure to join and use the provided GitHub organisation account (using your uni email) might result in 0% contribution.**

All group members must contribute effectively and equally to the project. The contributions will be evident by the GitHub repo and logs related to each project.

The course instructor has the discretion to scale the group's mark for each member as follows:

| Level of Contribution | Proportion of final grade received |
|-----------------------|------------------------------------|
| No contribution | 0% |
| Poor / partial contribution | 1% – 49% |
| Partial but not enough contribution | 50% – 99% |
| Major / full contribution | 100% |

---

## 16. Assessment Rubric

**Total: 100 marks (Bonus up to +5, capped at 100%)**

| # | Criterion | Marks | Description |
|---|-----------|------:|-------------|
| 1 | Backend Architecture & APIs | 25 | Clear separation, RESTful design, variation correctly integrated, consistent response envelope. |
| 2 | Frontend UI & User Experience | 25 | Use of Context/useReducer (or Zustand), React Hook Form + Zod, dark mode, intuitive flow matching approved variation. |
| 3 | Quiz Logic & Mechanics Compliance | 10 | Strict adherence to core mechanics + exact implementation of approved variation. **Generic implementations without variation: max Pass.** |
| 4 | Admin Interface & Access Control | 10 | Full CRUD + bulk import, secure enforcement. |
| 5 | Security & Validation | 10 | Hashing, rate limiting, input validation, envelope consistency. |
| 6 | Individual Technical Contribution & Reflection | 15 | Evidence of ownership via commits, diagrams, personal challenges, and variation-related decisions. **Generic reflections heavily penalised.** |
| 7 | Documentation & Process | 5 | Comprehensive README, architecture diagram, variation justification. |
| **Total** | | **100** | |
| Bonus | (See Section 12) | **+5** | Capped at 100%. |

---

## 17. Suggested Repository Skeleton

```
quiz-game/
├── backend/
│  ├── server.js
│  ├── package.json
│  ├── config/
│  │  └── db.js
│  ├── models/
│  │  ├── User.js
│  │  ├── Question.js
│  │  └── Score.js
│  ├── controllers/
│  │  ├── auth.controller.js
│  │  ├── quiz.controller.js
│  │  └── admin.controller.js
│  ├── routes/
│  │  ├── auth.routes.js
│  │  ├── quiz.routes.js
│  │  └── admin.routes.js
│  └── middleware/
│     ├── auth.middleware.js
│     └── admin.middleware.js
│
├── frontend/
│  ├── package.json
│  └── src/
│     ├── index.js
│     ├── App.js
│     ├── api/
│     │  └── api.js
│     ├── components/
│     │  ├── Quiz.js
│     │  ├── Login.js
│     │  ├── Register.js
│     │  └── Leaderboard.js
│     └── pages/
│        ├── Home.js
│        └── Admin.js
│
├── docs/
│  └── individual-reflections/
│     ├── student1.md
│     ├── student2.md
│     └── student3.md
│
├── README.md
└── Assignment 2 Group Assignment Coversheet.doc
```

> Note: the indentation/branching in the original PDF was visually inconsistent — the layout above preserves the intended hierarchy (`middleware/` items under `backend/`, `components/` and `pages/` under `frontend/src/`, reflections under `docs/individual-reflections/`).

---

## 18. Academic Integrity

You are required to take part in your education in an honest and ethical manner. Failure to comply with assessment rules and University policies could result in you being investigated and penalised by the University for an academic integrity breach: <https://www.sydney.edu.au/students/academic-integrity/breaches.html>.

We use **Turnitin** to help detect potential academic integrity breaches. In some cases, your instructor will permit multiple attempts for the assessment and will allow you to view the Turnitin report immediately, which you can use to help revise your submission and then resubmit. For help understanding the report, visit the Turnitin guide for students: <https://guides.turnitin.com/hc/en-us/articles/23713493434253-Understanding-the-similarity-score-for-students>.

### Compliance statement

In submitting this work, I (or we, in the case of a group submission) acknowledge that:

I have read and understood the Academic Integrity Policy (<https://sydney.edu.au/policies/showdoc.aspx?recnum=PDOC2012/254&RendNum=0>), and where relevant, the Research Code of Conduct…

> *Note: the Compliance statement is truncated mid-sentence at the end of the source PDF.*

---

## Appendix A — Hard Requirements Checklist (extracted)

This checklist is a re-organisation of the spec's mandatory requirements for self-audit. Every item below appears verbatim or near-verbatim somewhere above; nothing new is introduced.

### A.1 Architecture & code structure

- [ ] Backend uses Node.js + Express with separation: routes / controllers / models (or services).
- [ ] Mongoose population used where appropriate.
- [ ] React frontend uses functional components.
- [ ] State management: React Context + useReducer **or** Zustand.
- [ ] All forms use React Hook Form + Zod.

### A.2 Data model

- [ ] `User` model.
- [ ] `Question` model (with extra fields for variation if needed).
- [ ] `Score` model storing `questionId` + `selectedAnswer` + `isCorrect` per answer (full list).

### A.3 Auth & security

- [ ] JWT-protected routes.
- [ ] Basic rate limiting on login endpoint.
- [ ] Basic rate limiting on quiz submit endpoint.
- [ ] Server-side input validation.
- [ ] Protection against common injection/XSS.
- [ ] Admin access enforced on backend (middleware).
- [ ] Admin access restricted on frontend.
- [ ] Password hashing.

### A.4 API conventions

- [ ] All responses use envelope `{ success: boolean, data?: any, error?: string }`.
- [ ] Questions retrieved via RESTful API.
- [ ] Questions shuffled randomly per attempt.

### A.5 Player features

- [ ] Register.
- [ ] Log in.
- [ ] Log out.
- [ ] Take a quiz (core mechanics + approved variation).
- [ ] View immediate final score.
- [ ] View past quiz attempts (with selected answers if variation requires).
- [ ] View leaderboard (username + score, highest first, ties allowed; choice of all-attempts vs best-per-user documented).

### A.6 Admin features

- [ ] Admin login via admin interface.
- [ ] Create question.
- [ ] Edit question.
- [ ] Delete question.
- [ ] Toggle active/inactive question status.
- [ ] Bulk import questions via textarea (JSON array) with validation.

### A.7 UX mandates

- [ ] Dark mode toggle persisted in `localStorage`.
- [ ] Dark mode applies to player interface.
- [ ] Dark mode applies to admin interface.
- [ ] Quiz: 6–10 questions per attempt.
- [ ] Quiz: 4 options per question.
- [ ] Quiz: one correct answer per question.
- [ ] Quiz: answer cannot be changed once submitted.
- [ ] Scoring: +1 per correct, no other bonuses (except timer +1 max if Timed variation chosen).
- [ ] After final question: display score and persist attempt.

### A.8 Variation

- [ ] Tutor's acknowledgement obtained by end of Week 9.
- [ ] Variation implemented exactly (no deviation).
- [ ] Variation described in README.
- [ ] Variation justified in README.
- [ ] Variation demonstrated in live demo.

### A.9 Documentation

- [ ] README setup instructions (incl. env vars).
- [ ] README system overview.
- [ ] README architecture diagram (Mermaid or UML).
- [ ] README variation description + justification.
- [ ] README team role breakdown with links to key commits.
- [ ] README self-hosted API docs (Swagger/OpenAPI or Postman collection).

### A.10 Submission

- [ ] Repository on `github.sydney.edu.au`.
- [ ] Clean commit history.
- [ ] Each member: minimum 12–15 meaningful commits.
- [ ] Group assignment coversheet signed by all members.
- [ ] Individual reflection PDF per student (1–2 pages).
- [ ] Each reflection: subsystem description, technical challenge with code/commits, Mermaid/UML diagram, commit history analysis with hashes, variation design reflection.
- [ ] In a group of 4: one student designated for integration/validation/robustness.
- [ ] Submit zip on Canvas.
- [ ] Zip excludes `node_modules`.
- [ ] Live demo in Week 12 with all members presenting.
- [ ] All members able to answer questions across the full system (bus factor).

### A.11 Disallowed / out-of-scope

- ❌ Multiplayer.
- ❌ Real-time features.
- ❌ Adaptive branching.
- ❌ Alternative scoring schemes beyond approved variation.
- ❌ OAuth.
- ❌ WebSockets.
- ❌ File uploads.
- ❌ Advanced animations.

---

## ⚠️ End of Spec — Continue Reading

This file is **half of a pair**. The other half is **[`A2_Ed_Discussion_Supplement.md`](A2_Ed_Discussion_Supplement.md)**, which contains Ed Discussion staff clarifications and tutor-specific overrides that refine, constrain, and in some cases override the rules above.

**If you reached this point without reading the supplement, stop and read it now.** The two files together form the complete A2 reference.

*End of canonical spec.*
