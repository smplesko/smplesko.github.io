# Slot-Based Player Identity Refactor

**Date:** 2026-04-13
**Status:** Approved
**Scope:** All scoring, team assignment, and player action data structures

## Problem

All scoring data (golf teams, custom event results, trivia responses, predictions) uses player names as object keys. Renaming a player orphans all their score data — the leaderboard looks up the new name, finds nothing, and shows zero.

## Solution

Player slot IDs (1-12) become the stable identity throughout all Firebase data and scoring logic. Names become display-only, resolved via `getPlayerName(slot)` at render time. Renaming a player has zero impact on scoring.

## Design Principles

1. **Backend/Firebase:** Everything keyed by slot ID
2. **Frontend/UI:** Always resolve slot IDs to display names via `getPlayerName(slot)`
3. **Empty slots:** Excluded from leaderboards, scoring, team assignment
4. **Name changes:** Zero impact on scoring — just a display update
5. **Name ownership:** Admin sets initial names, players can change their own
6. **Login required:** All interactions require login; `getCurrentUserSlot()` is the universal identity
7. **MAX_PLAYERS:** Stays at 12 for now; design should not hardcode assumptions preventing future increase

## Data Layer Changes (`firebase.js`)

### New Helper Functions

- `getActiveSlots()` — Returns array of slot numbers with non-empty names, e.g. `[1, 2, 3, ..., 12]`. Replaces `getPlayerList()` as the primary iteration function for scoring/data.
- `getPlayerName(slot)` — Returns display name for a slot. Single source of truth for name resolution.
- `getPlayerSlotByName(name)` — Reverse lookup for edge cases (localStorage sync).

`getPlayerList()` is kept but used only in display contexts (dropdown labels, UI text). Never used as a data key.

### Firebase Data Structure Changes

| Path | Current Format | New Format |
|------|---------------|------------|
| `players` | `{ "1": { name, isAdmin } }` | No change |
| `golfTeams` | `{ "1": ["Stephen", "Alex"] }` | `{ "1": [1, 2] }` |
| `golfIndividualBonuses` | `{ longDrive: { player: "Stephen", points: 5 } }` | `{ longDrive: { slot: 1, points: 5 } }` |
| `golfScores` | `{ teamNum: { front9, back9 } }` | No change (already team-keyed) |
| `golfShotguns` | `{ teamNum: count }` | No change |
| `golfScoringEnabled` | `{ teamNum: bool }` | No change |
| `customEvents/.../results` (individual) | `{ "Stephen": 1 }` | `{ "1": 1 }` (slot → position) |
| `customEvents/.../results` (individual_to_team) | `{ "Stephen": 50 }` | `{ "1": 50 }` (slot → score) |
| `customEvents/.../results` (team_shared) | `{ teamNum: score }` | No change (already team-keyed) |
| `customEvents/.../teams` | `{ "1": ["Stephen", "Alex"] }` | `{ "1": [1, 2] }` |
| `triviaGame/responses` | `{ "1": { "Stephen": {...} } }` | `{ "1": { "1": {...} } }` (qNum → slot → response) |
| `triviaGame/joinedPlayers` | `{ "Stephen": {...} }` | `{ "1": {...} }` |
| `predictions/items[].responses` | `{ "Stephen": "Paris" }` | `{ "1": "Paris" }` |

## Scoring Functions

All scoring calculators return `{ slot: points }` instead of `{ name: points }`.

### `calculatePlayerPoints()` (`leaderboard.js`)

- Iterates `getActiveSlots()` instead of `getPlayerList()`
- Returns `{ "1": { golf: 22, trivia: 3, ... }, "2": { ... } }`
- Golf team lookup: teams contain slot IDs, matching is direct
- Individual bonuses: checks `indBonuses.longDrive.slot` instead of `.player`

### `calculateCustomEventPlayerPoints()` (`events.js`)

- Individual mode: `results[slot]` = position
- Team shared: teams contain slot arrays, points distributed to slots
- Individual-to-team: `results[slot]` = raw score, pooled by team slots

### `calculateTriviaPlayerPoints()` (`trivia.js`)

- Iterates `getActiveSlots()`, looks up `responses[qNum][slot]`
- Returns `{ "1": 10, "2": 5, ... }`

### `calculatePredictionPoints()` (`predictions.js`)

- Iterates active slots, looks up `responses[slot]`
- Returns `{ "1": 3, "2": 0, ... }`

## UI & Rendering

Users never see slot IDs. Every place text hits the screen goes through `getPlayerName(slot)`.

### Leaderboard (`leaderboard.js`)

- `renderOverallLeaderboard()` — `getPlayerName(slot)` for Player column
- `renderPodium()` — `getPlayerName(slot)` for medal display
- `renderCumulativeChart()` — chart labels use `getPlayerName(slot)`
- `renderGolfLeaderboard()` — team player lists: `slots.map(s => getPlayerName(s)).join(', ')`
- All sub-leaderboards follow the same pattern

### Profile (`profile.js`)

- Uses `getCurrentUserSlot()` for score lookup: `playerPoints[userSlot]`
- Golf/event team lookup: slot-based `.includes(parseInt(userSlot))`
- Team member display: resolve names from slot arrays

### Admin (`admin.js`)

- Player list: no change (already slot-based)
- Golf individual bonus dropdowns: values are slot IDs, labels are names

### Golf (`golf.js`)

- Team assignment checkboxes: values are slot IDs, labels are names
- Individual bonus dropdowns: `<option value="1">Stephen</option>`
- Scorecard team member display: resolve names from slot arrays

### Events (`events.js`)

- Team assignment checkboxes: slot-based values
- Individual result dropdowns: slot ID values, name labels
- Result display tables: resolve names at render

### Trivia (`trivia.js`)

- `submitTriviaAnswer()` — keys response by `getCurrentUserSlot()`
- `joinTriviaLobby()` — keys by slot
- Admin response review: resolves names for display
- Waiting room: resolves names for player list

### Predictions (`predictions.js`)

- `submitPredictionAnswer()` — keys by slot
- `getUnansweredPredictions()` — checks by slot
- Response display: resolves names

## Player Actions & Auth

### Login (`auth.js`)

- No change needed — already stores `currentUserSlot` in localStorage
- `getCurrentUserSlot()` is the primary identity function
- `getCurrentUser()` still works for display (header)

### Name Changes (`profile.js`, `admin.js`)

- Update `players[slot].name` in Firebase and localStorage. That's it.
- No cascading through scoring data because scoring data references slots, not names.

### Checkbox/Team Helpers (`utils.js`)

- `createCheckboxGroup()` — checkbox values become slot IDs, labels show names
- `getSelectedFromCheckboxGroup()` — returns array of slot IDs (as numbers)

## Files Modified

| File | Change Scope |
|------|-------------|
| `firebase.js` | Add `getActiveSlots()`, `getPlayerName()`, `getPlayerSlotByName()`. Update `getGolfIndividualBonuses()` default. |
| `leaderboard.js` | `calculatePlayerPoints()` + all render functions: slot-keyed |
| `events.js` | `calculateCustomEventPlayerPoints()`, `saveEventRoundResults()`, team assignment, all render functions |
| `trivia.js` | `calculateTriviaPlayerPoints()`, submit/join functions, admin review, render functions |
| `predictions.js` | `calculatePredictionPoints()`, submit/unanswered functions, render functions |
| `golf.js` | Individual bonus dropdowns, team checkboxes, scorecard display |
| `profile.js` | Score lookup by slot, team membership checks |
| `admin.js` | Individual bonus save, minimal changes |
| `utils.js` | `createCheckboxGroup()`, `getSelectedFromCheckboxGroup()` — slot-based values |
| `.eslintrc.json` | Add new global functions |

## Data Reset

All existing Firebase test data will be incompatible. A full data reset via the admin panel is required after deploying this change. This is acceptable per user confirmation.

## Testing Plan

After implementation, manually verify:
1. Login as admin, set up player names
2. Create golf teams, enter scores — leaderboard shows correct points
3. Create custom event, assign teams, enter results — points correct
4. Rename a player — all scores persist, leaderboard updates name only
5. Run trivia flow — responses keyed correctly
6. Submit predictions — responses keyed correctly
7. Check profile page — shows correct scores and team assignments
