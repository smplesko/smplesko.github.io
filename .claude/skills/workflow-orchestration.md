# Workflow Orchestration & Task Management

This skill defines how Claude should approach, plan, execute, and verify tasks across any project.

## Core Workflow: Research → Plan → Implement → Verify

Every non-trivial task follows this four-phase cycle. Do not skip phases — even "simple" changes benefit from a quick research pass.

### Phase 1: Research

- Read all relevant files before proposing any changes
- Search for related patterns, utilities, and conventions already in the codebase
- Identify dependencies, side effects, and potential conflicts
- Check for existing tests, documentation, and configuration that may be affected
- Look for prior solutions — the codebase may already handle a similar concern

### Phase 2: Plan

- Use `TodoWrite` to create an ordered, atomic task list
- Each task should be independently verifiable
- Identify risks and ambiguities — ask the user using `AskUserQuestion` when needed
- For large or ambiguous scope, get explicit approval before implementing
- Group related changes together but keep each todo focused on one concern

### Phase 3: Implement

- Work through todos sequentially (only ONE `in_progress` at a time)
- Make minimal, focused changes — one concern per edit
- Follow existing code conventions and patterns exactly
- Mark each todo `completed` immediately upon finishing
- If a task reveals new work, add it as a new todo rather than expanding the current one

### Phase 4: Verify

- Run available tests, linters, and builds
- Review the full diff (`git diff`) for unintended changes
- Confirm all todos are completed
- Summarize what was accomplished and flag remaining concerns
- If verification fails, create new todos for the fixes — do not silently patch

## Task Management Rules

- Use `TodoWrite` for any task with 3+ steps
- Break complex tasks into small, atomic sub-tasks
- Never mark incomplete work as `completed`
- Track discoveries and new work as additional todos
- Remove or update todos that become irrelevant
- When blocked, mark the blocking issue as a new todo and ask the user

## Code Change Standards

- NEVER modify code you haven't read first
- Prefer editing existing files over creating new ones
- Match existing style, naming, and patterns exactly
- Make the minimum change necessary — no unrelated "improvements"
- Don't add comments, types, or docs to unchanged code
- When removing code, remove it completely — no commented-out remnants or compatibility shims

## Communication Standards

- Summarize findings at each phase transition
- Use `file:line` references when discussing code
- Be direct about uncertainties and risks
- Lead with the most important information
- When presenting options, describe trade-offs — not time estimates

## Git Discipline

- Commit at logical checkpoints, not just at the end
- Write commit messages that describe *why*, not just *what*
- Review your own diff before committing — catch stray changes, debug logs, and leftover comments
- Never commit sensitive configuration (API keys, passwords, credentials)
- If the project has a `.gitignore`, respect it and suggest additions when new sensitive patterns appear

## Sensitive Configuration Handling

- Identify config files that contain secrets (API keys, database URLs, passwords)
- Never echo, log, or display sensitive values in output
- If secrets are found committed in the repo, flag it to the user immediately
- Use example/template config files (e.g., `config.example.js`) so collaborators know the expected shape without exposing real values

## When No Formal Tests Exist

- Validate changes manually by checking related functionality
- Use the browser console, network tab, or application logs as a verification tool when applicable
- For data-layer changes, verify by reading back the written data
- Suggest lightweight test additions when a pattern is error-prone, but don't force a test framework onto a project that doesn't use one

## Lessons Learned Integration

- When you discover a non-obvious pattern, convention, or gotcha in the codebase, note it in your summary
- If a `tasks/lessons.md` or similar file exists, append new learnings to it
- Before starting work, check for any lessons file — past learnings prevent repeated mistakes
- Common learnings worth capturing: naming conventions, data structure quirks, deployment steps, browser compatibility issues, and integration gotchas
