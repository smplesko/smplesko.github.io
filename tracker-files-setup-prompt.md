# Prompt: Set Up Project Tracker Files

Give this entire prompt to a Claude chat. Replace the placeholder sections in brackets with your own project details.

---

## The Prompt

I'm building a software project using Claude Code in my terminal for all implementation work. I use this chat for design decisions and generating prompts to give Claude Code.

**My project:** [Describe your project in 2-3 sentences — what it does, what tech stack you're using, what stage it's at]

I want to set up a system of **tracker files** that live in my project root. These are markdown files that Claude Code updates after every session so that future sessions can orient themselves without re-exploring the whole codebase. They serve as shared memory between sessions.

Please help me create the following five tracker files, customized to my project:

### 1. BUILD_PROGRESS.md
**Purpose:** Shows what's done, what's in progress, and what's next at a glance.

It should include:
- A summary table with every major phase/milestone, its status (Not Started / In Progress / Complete), and completion percentage
- Below the table, a detailed breakdown of each phase listing individual tasks, their status, relevant files, and any notes
- A "Last Updated" date at the top

This is the file someone (human or AI) reads first to understand where the project stands.

### 2. PROJECT_MAP.md
**Purpose:** Maps every file in the project to what it does, which phase it belongs to, and what part of the system it connects to.

It should include:
- A quick status summary at the top (same phase table as BUILD_PROGRESS but with test/file counts)
- A section for each phase or module, with a table listing: file path, what the file does, what system/feature it belongs to, and its corresponding test file (if any)
- Database tables listed if applicable
- A note at the top saying "Use this file to orient yourself at the start of any session"

This is the file Claude Code reads to find where things live without searching the codebase.

### 3. DESIGN_DECISIONS.md
**Purpose:** Tracks every design question that comes up during development — open ones that need my input, and resolved ones with the reasoning preserved.

It should include three sections:
- **Open Questions** — Things that need my decision before work can continue. Each entry gets: a source (what triggered it), the question, why it matters, any current assumption being used, and a status marker
- **Decided** — Resolved questions with: the decision number (e.g., AD-1, AD-2), the question, the ruling, and the reasoning. These are numbered sequentially and never reused.
- **Manual/Spec Update Candidates** — Things discovered during development that might need the design doc or spec updated

The critical rule: decision numbers (AD-XXX) are assigned sequentially. Before assigning a new one, always check what the current highest number is to avoid collisions.

### 4. TEST_LOG.md
**Purpose:** Records every test file, its pass/fail status, assertion count, and last run date.

It should include:
- A table per phase/module listing: test name, test file path, status (Pass/Fail/Skipped), last run date, and assertion count
- A known issues section for any flaky or problematic tests
- A total count at the bottom (X test files, Y assertions, Z failures)

The critical rule: **zero failures is the gate.** The full test suite must pass before any phase is considered complete. This file is the proof.

### 5. DEBUG_LOG.md
**Purpose:** Tracks bugs and fix attempts so future sessions don't repeat failed approaches.

It should include:
- A format template showing the standard entry structure: bug ID, affected files, symptom description, and a checklist of attempts (each marked as FAILED with reason, or marked as the Resolution)
- A "Known Persistent Issues" section for things that won't be fixed
- An "Active Debug Entries" section for in-progress bugs
- A "Resolved Debug Entries" section for fixed bugs

The critical rule: **consult this file BEFORE attempting any fix.** Update it AFTER every attempt, successful or not. This prevents the AI from trying the same broken approach across sessions.

---

### Rules for Claude Code to Follow

Once you've created the files, also give me a block of text I can add to my Claude Code session prompt (the instructions I paste at the start of each Claude Code session) that tells Claude Code how to maintain these files. The rules should include:

1. **Update after every session.** Before committing, update all affected tracker files.
2. **Trust the tracker files.** Read them at the start of a session instead of re-exploring the codebase or re-running the full test suite to figure out what state things are in.
3. **Never skip the debug log.** Before fixing any bug, check DEBUG_LOG.md for prior attempts. After any fix attempt (success or failure), log it.
4. **Decision numbers are sequential.** Always check the current highest AD number in DESIGN_DECISIONS.md before assigning a new one.
5. **Zero-failure gate.** Never mark a phase complete in BUILD_PROGRESS.md unless TEST_LOG.md shows all tests passing.
6. **Last Updated date.** Update the date and a short note at the top of every file you modify.

Please generate all five files with the structure described above, populated with whatever I've told you about my project so far. Use placeholder entries where you don't have specific information yet — I'd rather have the structure in place and fill it in than wait until everything is known.
