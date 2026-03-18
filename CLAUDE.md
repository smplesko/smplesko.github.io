# Claude Code — Project Instructions

## What This Project Is

**Dird Plesk Memorial** — A bachelor party games tracker built as a static site deployed to GitHub Pages at www.stephenplesko.com. Players join by selecting a slot; an admin manages all game settings and scoring in real-time via Firebase.

---

## Reference Documents (Read These)

- **`CODEBASE_REFERENCE.md`** — Full architecture: JS module map, HTML pages, Firebase paths, key functions, data structures, and best practices. Read this before making any changes.
- **`FIREBASE_SECURITY.md`** — Firebase rules for each phase (development, sandbox, live event, inactive). Consult before touching Firebase config.

---

## Keeping Reference Docs Current

**After any PR that introduces structural changes, update `CODEBASE_REFERENCE.md` immediately.** Structural changes include:

- New or removed JS files/modules
- New or removed Firebase data paths
- New HTML pages or major container IDs
- New utility functions added to `utils.js` or `firebase.js`
- New CSS sections, design patterns, or theming conventions
- Changes to how scoring is calculated
- New tooling, linters, or hooks

The reference doc should always reflect the current state of the codebase, not a historical snapshot.

---

## Tech Stack

- **No build step** — Plain HTML, CSS, vanilla JS served via Jekyll/GitHub Pages
- **Firebase Realtime Database** — All live data; 12 real-time listeners
- **localStorage** — Auth (password gate + player slot), theme preference
- **Admin detection** — `isAdmin: true` flag on player slot in Firebase, not a separate auth system
- **Fonts** — Russo One (headings), Sora (body)
- **Linter** — ESLint 8 (`npx eslint js/*.js`). Run before committing JS changes.

---

## Development Workflow

1. **Branch:** Always work on a `claude/...` branch. Never push directly to `master`.
2. **Lint:** Run `npx eslint js/*.js` before committing any JS changes.
3. **No tests** — Manual QA only. Be explicit about what to test when finishing a PR.
4. **Deploy** — Automatic on merge to `master` via GitHub Pages. No manual deploy step.
5. **PR titles** — Keep short and descriptive. Use the PR body to detail what changed and what to test.

---

## Task Tracking

Three files in `tasks/` persist across sessions:

- **`tasks/todo.md`** — In Progress / Up Next / Recently Completed. Persistent across sessions — don't clear completed items, move them to Recently Completed.
- **`tasks/lessons.md`** — Lessons learned + bug tracker. Review at the start of each session.
- **`tasks/design-decisions.md`** — Open questions and resolved code decisions (CD-1, CD-2...).

**After any user correction:** add a concise entry to `tasks/lessons.md` describing what went wrong and the right approach.

**Before fixing any bug:** check `tasks/lessons.md` for prior attempts on the same issue. After every fix attempt (success or failure), log it. This prevents retrying failed approaches across sessions.

**Design decisions:** When a design question comes up (especially during plan mode), log it in `tasks/design-decisions.md`. CD numbers are sequential — always check the current highest before assigning a new one. Include reasoning on resolved decisions.

---

## Planning

Use plan mode for architectural decisions, new features that touch multiple files, or anything with unclear requirements. Skip it for routine tasks (adding a field, fixing a known bug, tweaking styles) — the overhead isn't worth it on a small static site.

If something goes sideways mid-task, stop and re-plan rather than patching forward.

---

## Verification Before Done

Never mark a task complete without confirming it works:

1. Run `npx eslint js/*.js` if any JS was changed
2. Manually verify the behavior in a browser (no automated tests exist — manual QA is the only gate)
3. Diff your changes against `master` behavior when the change touches scoring, Firebase paths, or auth logic
4. Check that no unrelated files were modified

---

## Subagent Use

Reserve subagents for deep codebase exploration or parallel analysis of multiple independent files. For routine lookups (find a function, read a file, search for a selector), use Glob/Grep/Read directly — it's faster and cheaper. This is a small codebase; subagents are rarely the right default.

---

## Autonomous Bug Fixing

When a bug is clearly identified, fix it without asking for step-by-step guidance. Minimize context switching for the user. If the fix requires a decision with meaningful trade-offs, flag the options briefly rather than asking how to proceed on implementation details.

---

## Code Conventions

- All Firebase writes go through `writeToFirebase(path, data)` — never write directly to Firebase refs
- Use `showToast(message, type)` for non-blocking user feedback
- Use `showConfirm(message, options)` (Promise-based) for destructive confirmations
- Use `isPage('pagename')` for page routing in `app.js`
- CSS changes must use CSS variables (`var(--color-name)`) — no hardcoded colors
- New CSS selectors should be scoped tightly (e.g. `.scorecard .score-input`, not just `.score-input`)
- Avoid duplicate utility class definitions — check `main.css` before adding new ones
- All new `<script>` tags in `_layouts/default.html` must include `defer`
- New interactive elements need ARIA labels/roles and visible focus indicators
- Animations must respect `prefers-reduced-motion` via the existing media query in `main.css`
