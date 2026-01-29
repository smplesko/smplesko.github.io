# Dird Plesk Memorial — Codebase Reference Cheat Sheet

## Quick Stats
- **Total lines:** ~6,050
- **JS:** 3,368 lines (128 KB) — `js/app.js`
- **CSS:** 1,393 lines (26 KB) — `css/main.css`
- **HTML pages:** 11 files
- **Functions:** 130
- **Firebase paths:** 15 real-time listeners

---

## js/app.js Segments (in order)

| Segment | ~Lines | Description |
|---------|--------|-------------|
| Firebase Config | 1-18 | API keys, initialization |
| Data Cache | 20-37 | Local mirror of all Firebase data |
| Constants/Defaults | 39-118 | Player names, scoring tables, default settings |
| Firebase Sync | 120-250 | Listeners, cleanup, `writeToFirebase`, error handling, `initData` |
| Data Helpers | 252-350 | Getters/setters: `getPlayers()`, `getSiteSettings()`, etc. |
| Auth & Login | 352-510 | Password modal, player login, admin detection |
| Player Management | 512-635 | Admin player name editing |
| Site Settings | 637-790 | Hero text, notes, event locks, competition close |
| Golf System | 792-1030 | Teams, scorecards, hole-by-hole scoring, bonuses |
| Beer Olympics | 1032-1230 | 5-game team scoring |
| Go-Kart System | 1232-1320 | Individual race results |
| Trivia System | 1322-1850 | Questions, CSV upload, live game, response review |
| Points Calculation | 1852-1940 | `calculatePlayerPoints()` — aggregates all events |
| Leaderboard | 1942-2220 | Podium, overall table, per-event breakdowns |
| Profile System | 2222-2830 | Player profiles, stat cards |
| Predictions System | 2832-3200 | Predictions CRUD, voting, banner |
| Data Management | 3202-3260 | Export/reset |
| UI Bootstrap | 3262-3420 | `DOMContentLoaded`, theme toggle, password gate |

---

## HTML Pages

| File | Purpose |
|------|---------|
| `index.html` | Homepage — login, events grid, notes |
| `leaderboard.html` | Overall standings, per-event tables |
| `golf.html` | Golf scorecard |
| `beer.html` | Beer Olympics scoring |
| `gokart.html` | Go-kart results |
| `trivia.html` | Live trivia player view |
| `predictions.html` | Predictions voting |
| `admin.html` | Admin panel |
| `guide.html` | User guide |
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
| **render function** | JS function that generates HTML (e.g., `renderTriviaPage()`) |
| **data helper** | Getter/setter for Firebase data (e.g., `getSiteSettings()`) |
| **admin section** | Gold-bordered UI block only visible to admin |
| **event lock** | Toggle that freezes an event's data |
| **banner** | Notification bar (e.g., predictions banner) |
| **section card** | Main content container (`.section-card`) |
| **data path** | Firebase key (e.g., `triviaGame`, `siteSettings`) |
| **player view** | What non-admin users see |
| **review state** | Trivia state where admin approves/denies answers |
| **segment** | Logical section of `app.js` by feature |

---

## Firebase Data Paths

| Path | Type | Description |
|------|------|-------------|
| `players` | Object | 12 player slots with names and admin flag |
| `gokartPoints` | Object | Point values by finishing position |
| `triviaPoints` | Object | Point values by finishing position |
| `bonusPoints` | Object | Golf bonus point values |
| `golfTeams` | Object | Team assignments |
| `golfHoleScores` | Object | Hole-by-hole scores per team |
| `golfShotguns` | Object | Shotgun bonus data |
| `golfBonuses` | Object | Best front/back/overall winners |
| `golfScoringEnabled` | Object | Which teams have scoring open |
| `beerTeams` | Object | Teams per game (5 games) |
| `beerScores` | Object | Scores per game (5 games) |
| `gokartResults` | Object | Player finishing positions |
| `triviaGame` | Object | Questions, responses, game state |
| `siteSettings` | Object | Hero text, notes, locks, competition status |
| `predictions` | Object | Prediction items, responses |

---

## How to Describe Changes

**Template:**
> In the **[Segment Name]**, [add/update/fix] **[specific thing]**.
> It should [behavior description].
> This affects [admin/players/both] on the [page name] page.

**Examples:**
- "In the **Trivia System**, update the **player view render function** to show a timer countdown during active questions."
- "In the **Points Calculation** segment, update `calculatePlayerPoints()` to include a new bonus category."
- "In the **Site Settings** segment, add a toggle for **dark mode default** so the admin can set the default theme."
- "On the **admin page**, in the **Beer Olympics** section, add a dropdown for **Best Player** bonus per game."

---

## Architecture Notes

- Single-page dynamic rendering: HTML pages are shells, JS renders content
- All data synced via Firebase Realtime Database
- No build step — plain JS, CSS, HTML served via Jekyll/GitHub Pages
- Theme stored in localStorage (device-specific, not synced)
- Auth is localStorage-based (not Firebase Auth)
- Admin detection via player slot 1 `isAdmin: true`
