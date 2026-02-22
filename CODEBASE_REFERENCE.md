# Dird Plesk Memorial — Codebase Reference

## Quick Stats
- **JS:** ~7,600 lines across 12 modules in `js/`
- **CSS:** ~2,150 lines — `css/main.css`
- **HTML pages:** 10 files
- **Firebase paths:** 12 real-time listeners
- **Layout:** `_layouts/default.html` (shared template with nav, footer, password gate, script loading)
- **Deployment:** GitHub Pages (Jekyll) at www.stephenplesko.com

---

## Architecture

- **Static site** — No build step. Plain HTML, CSS, vanilla JS served via Jekyll/GitHub Pages
- **Client-side rendering** — HTML pages are shells; JavaScript renders all content dynamically
- **Firebase Realtime Database** — All data synced in real-time via listeners
- **localStorage auth** — No Firebase Auth; password gate + player slot selection
- **Theme** — Dark/light toggle stored in localStorage (device-specific)
- **Admin** — Detected via player slot's `isAdmin: true` flag

---

## JS Module Map (`js/` directory)

Files are loaded in this order in `_layouts/default.html`:

| # | File | Lines | Depends On | Responsibility |
|---|------|-------|------------|----------------|
| 1 | `config.js` | ~20 | — | Firebase credentials, site/admin passwords |
| 2 | `utils.js` | ~343 | config.js | Validation (bounds constants), password gate, theme, page routing, UI helpers (toast, confirm, checkbox groups, table builders), date formatting |
| 3 | `firebase.js` | ~527 | config.js, utils.js | Firebase init, data cache, default data constants, real-time listeners, `writeToFirebase()`, all data accessors (getPlayers, getGolfData, getSiteSettings, etc.), golf scoring calculations |
| 4 | `auth.js` | ~115 | firebase.js | Login/logout, admin check, password modal, UI state |
| 5 | `golf.js` | ~425 | utils.js, firebase.js, auth.js | Golf admin UI, scorecard rendering, score entry, bonus inputs |
| 6 | `events.js` | ~777 | utils.js, firebase.js, auth.js | Custom events CRUD, 3 scoring modes, round management, admin config UI, player-facing events page |
| 7 | `trivia.js` | ~1,044 | utils.js, firebase.js, auth.js | Trivia game engine, CSV import, admin controls (question mgmt, game flow, response review), player view (lobby, answering, results) |
| 8 | `predictions.js` | ~449 | utils.js, firebase.js, auth.js | Predictions CRUD, voting UI, banner notifications, admin management |
| 9 | `leaderboard.js` | ~433 | firebase.js, golf.js, events.js, trivia.js, predictions.js | `calculatePlayerPoints()` (aggregates all scoring), overall/per-event leaderboards, cumulative SVG chart, podium |
| 10 | `admin.js` | ~1,008 | firebase.js, auth.js | Player name mgmt, site settings, golf settings, event locks, competition close, data export/reset, onboarding wizard (7 steps) |
| 11 | `profile.js` | ~105 | firebase.js, auth.js, leaderboard.js | Player profile page with dynamic stat cards and team assignments |
| 12 | `app.js` | ~188 | all above | Entry point: `DOMContentLoaded` handler, page routing (`isPage()` checks), initial render calls, weekend schedule |

---

## HTML Pages

| File | Purpose | Key Containers |
|------|---------|---------------|
| `index.html` | Homepage — player login grid, weekend schedule, notes | `playerGrid`, `weekendSchedule`, `notesSection` |
| `leaderboard.html` | Overall standings, per-event tables, chart | `overallLeaderboardContainer`, `cumulativeChart` |
| `golf.html` | Golf scorecard and scoring guide | `golfScorecard`, `scoringGuide` |
| `events.html` | Custom events results (player-facing) | `eventsContainer` |
| `trivia.html` | Live trivia player/admin view | `triviaPlayerView`, `triviaGameControls` |
| `predictions.html` | Predictions voting interface | `predictionsContainer` |
| `admin.html` | Admin panel (all management) | `adminContent`, `playerList`, `siteSettingsContainer`, etc. |
| `profile.html` | Player profile and name editing | `profileContent` |
| `guide.html` | User guide (static help content) | — |
| `preview-themes.html` | Theme preview utility (dev tool) | — |

---

## CSS Organization (`css/main.css` — ~2,150 lines)

| Section | What It Styles |
|---------|---------------|
| `:root` variables | Color tokens for dark/light themes |
| Layout | Nav, container, footer, footer-links |
| Components | Cards, buttons, tables, modals, toggles, toasts, confirms |
| Event-Specific | Scorecards, team cards, scoring grids |
| Trivia | Question display, option buttons, reviewing states |
| Predictions | Banner, cards, options, responses |
| Onboarding | Wizard modal, progress bar, form fields |
| Responsive | Breakpoints at 768px and 480px |
| Light Mode | `[data-theme="light"]` overrides (end of file) |

**Fonts:** Russo One (headings), Sora (body — weights 300-700)

---

## Firebase Data Paths

| Path | Description |
|------|-------------|
| `players` | 12 player slots: `{ name, isAdmin }` |
| `triviaPoints` | Legacy — position-based point values |
| `bonusPoints` | Golf bonus values: bestFront, bestBack, overallWinner, shotgun |
| `golfTeams` | Team assignments: `{ teamNum: [playerNames] }` |
| `golfScores` | Per-team scores: `{ teamNum: { front9, back9 } }` |
| `golfShotguns` | Per-team shotgun counts |
| `golfScoringEnabled` | Per-team scoring toggle |
| `golfIndividualBonuses` | Long drive + closest pin: `{ player, points }` |
| `customEvents` | All events with rounds, teams, results (see structure below) |
| `triviaGame` | Questions, responses, game state, joinedPlayers |
| `siteSettings` | Hero text, notes, event locks, golf settings, competition status |
| `predictions` | Prediction items with responses |

---

## Custom Events Data Structure

```
customEvents/[eventId]/
  id, name, description, order, locked
  scoringMode: "individual" | "team_shared" | "individual_to_team"
  scheduledDate, scheduledTime, roundCount
  rounds/[roundNum]/
    name, teamCount
    pointValues: { position: points }
    teams: { teamNum: [playerNames] }
    results: { ... }  // format depends on scoringMode
```

**Results format by scoring mode:**
- `individual`: `{ playerName: position }` — player gets points from `pointValues[position]`
- `team_shared`: `{ teamNum: score }` — each team member gets this score directly
- `individual_to_team`: `{ playerName: score }` — pooled per team, teams ranked, shared points by rank

---

## Key Function Reference

### Data Layer (`firebase.js`)
- `initData()` — Sets up Firebase listeners + theme
- `writeToFirebase(path, data)` — Write with error handling
- `getPlayers()`, `getGolfData()`, `getSiteSettings()`, `getCustomEvents()`, `getTriviaGame()`, `getPredictions()` — Data accessors with defaults
- `calculateGolfTeamTotal(teamNum)` — Full golf scoring breakdown
- `onDataChange(path)` — Routes Firebase updates to relevant render functions

### Scoring (`leaderboard.js`)
- `calculatePlayerPoints()` — Aggregates golf + custom events + trivia + predictions → `{ player: { golf, trivia, predictions, [eventId], total } }`

### UI Helpers (`utils.js`)
- `showToast(message, type, duration)` — Non-blocking notifications
- `showConfirm(message, options)` — Promise-based confirmation modal
- `validateNumber(value, min, max, default)` — Generic input validation
- `formatDateTime(date, time, options)` — Unified date/time formatting

---

## How to Describe Changes

**Template:**
> In **[file.js]**, [add/update/fix] **[specific thing]**.
> It should [behavior description].
> This affects [admin/players/both] on the [page name] page.

**Examples:**
- "In **events.js**, add a **round description** field so the admin can name each round."
- "In **leaderboard.js**, update `calculatePlayerPoints()` to weight certain events differently."
- "In **admin.js**, add a toggle for **dark mode default** so the admin can set the default theme."
- "On the **events page**, add a **standings summary** below each event showing top 3 players."

---

## Developer Tooling

- **Linter:** ESLint 8 (config in `.eslintrc.json`). Run: `npx eslint js/*.js`
- **Session Hook:** `.claude/hooks/session-start.sh` — Installs ESLint on Claude Code web sessions
- **No test framework** — Manual QA only
- **No CI/CD** — Deploy on push to master via GitHub Pages
