# Dird Plesk Memorial — Codebase Reference Cheat Sheet

## Quick Stats
- **Total lines:** ~6,500
- **JS:** ~3,874 lines — `js/app.js`
- **CSS:** ~1,393 lines — `css/main.css`
- **HTML pages:** 10 files
- **Firebase paths:** 12 real-time listeners

---

## js/app.js Segments (in order)

| Segment | Description |
|---------|-------------|
| Firebase Config | API keys, initialization |
| Data Cache | Local mirror of all Firebase data |
| Constants/Defaults | Player names, scoring tables, default settings, golf settings |
| Firebase Sync | Listeners, cleanup, `writeToFirebase`, error handling, `initData` |
| Data Helpers | Getters/setters: `getPlayers()`, `getSiteSettings()`, `getCustomEvents()`, etc. |
| Completed Events | `getCompletedEvents()` — checks golf, custom events, trivia for data |
| Auth & Login | Password modal, player login, admin detection |
| Player Management | Admin player name editing |
| Site Settings | Hero text, notes, event locks, competition close |
| Golf System | Teams, scorecards, hole-by-hole scoring, bonuses, format settings |
| **Custom Events System** | CRUD operations, round management, 3 scoring modes, admin UI, player-facing Events page |
| Trivia System | Questions, CSV upload, live game, response review, description field |
| Points Calculation | `calculatePlayerPoints()` — aggregates golf + custom events + trivia + predictions |
| Leaderboard Columns | `getLeaderboardColumns()` — dynamic columns based on created events |
| Leaderboard | Podium, dynamic overall table, cumulative chart, per-event breakdowns |
| Profile System | Player profiles with dynamic event stat cards |
| Predictions System | Predictions CRUD, voting, banner |
| Data Management | Export/reset |
| UI Bootstrap | `DOMContentLoaded`, theme toggle, password gate |

---

## HTML Pages

| File | Purpose |
|------|---------|
| `index.html` | Homepage — login, events grid, notes |
| `leaderboard.html` | Overall standings, dynamic per-event tables |
| `golf.html` | Golf scorecard |
| `events.html` | Custom events — rounds, teams, results |
| `trivia.html` | Live trivia player view |
| `predictions.html` | Predictions voting |
| `admin.html` | Admin panel (site settings, players, custom events, trivia, predictions) |
| `guide.html` | User guide |
| `profile.html` | Player profile |
| `_layouts/default.html` | Shared template (nav, footer, scripts) |

---

## CSS Organization (css/main.css)

| Section | What It Styles |
|---------|---------------|
| Variables (`:root`) | Color tokens for dark/light themes |
| Layout | Nav, container, footer, footer-links |
| Components | Cards, buttons, tables, modals, toggles |
| Event-Specific | Scorecards, hole grids, team cards |
| Predictions | Banner, cards, options, responses |
| Responsive | 3 breakpoints (768px, 480px) |
| Light Mode | `[data-theme="light"]` overrides at end |

---

## Key Vocabulary

| Term | Meaning |
|------|---------|
| **custom event** | Admin-created competition event with rounds and scoring mode |
| **scoring mode** | How points are calculated: `individual`, `team_shared`, `individual_to_team` |
| **round** | A sub-unit of a custom event with its own teams and results |
| **render function** | JS function that generates HTML (e.g., `renderEventsPage()`) |
| **data helper** | Getter/setter for Firebase data (e.g., `getCustomEvents()`) |
| **admin section** | Gold-bordered UI block only visible to admin |
| **event lock** | Toggle that freezes an event's data |
| **banner** | Notification bar (e.g., predictions banner) |
| **section card** | Main content container (`.section-card`) |
| **data path** | Firebase key (e.g., `customEvents`, `siteSettings`) |
| **player view** | What non-admin users see |
| **segment** | Logical section of `app.js` by feature |

---

## Firebase Data Paths

| Path | Type | Description |
|------|------|-------------|
| `players` | Object | 12 player slots with names and admin flag |
| `triviaPoints` | Object | Point values by finishing position (legacy) |
| `bonusPoints` | Object | Golf bonus point values |
| `golfTeams` | Object | Team assignments |
| `golfHoleScores` | Object | Hole-by-hole scores per team |
| `golfShotguns` | Object | Shotgun bonus data |
| `golfBonuses` | Object | Best front/back/overall winners |
| `golfScoringEnabled` | Object | Which teams have scoring open |
| `customEvents` | Object | All custom events with rounds, teams, results |
| `triviaGame` | Object | Questions, responses, game state, description |
| `siteSettings` | Object | Hero text, notes, locks, competition status, golf settings |
| `predictions` | Object | Prediction items, responses |

---

## Custom Events Data Structure

```
customEvents/
  [eventId]/
    id, name, description, order
    scoringMode: "individual" | "team_shared" | "individual_to_team"
    roundCount, locked
    rounds/
      [roundNum]/
        name, teamCount
        pointValues: { 1: N, 2: N, ... }  (position → points)
        teams: { 1: [players], 2: [players], ... }
        results: { ... }  (format depends on scoring mode)
```

**Results format by scoring mode:**
- `individual`: `{ playerName: position }` (e.g., `{ "Alex": 1, "Brad": 2 }`)
- `team_shared`: `{ teamNum: score }` (e.g., `{ "1": 10, "2": 8 }`)
- `individual_to_team`: `{ playerName: score }` — pooled per team, ranked, shared points

---

## How to Describe Changes

**Template:**
> In the **[Segment Name]**, [add/update/fix] **[specific thing]**.
> It should [behavior description].
> This affects [admin/players/both] on the [page name] page.

**Examples:**
- "In the **Custom Events System**, add a **round description** field so the admin can name each round."
- "In the **Points Calculation** segment, update `calculatePlayerPoints()` to weight certain events differently."
- "In the **Site Settings** segment, add a toggle for **dark mode default** so the admin can set the default theme."
- "On the **events page**, add a **standings summary** below each event showing top 3 players."

---

## Architecture Notes

- Single-page dynamic rendering: HTML pages are shells, JS renders content
- All data synced via Firebase Realtime Database
- No build step — plain JS, CSS, HTML served via Jekyll/GitHub Pages
- Theme stored in localStorage (device-specific, not synced)
- Auth is localStorage-based (not Firebase Auth)
- Admin detection via player slot 1 `isAdmin: true`
- Custom events are fully dynamic — leaderboard columns, profile stats, and charts adapt automatically
- Golf and Trivia are standalone systems with their own dedicated logic
- Predictions are always the last column in the leaderboard
