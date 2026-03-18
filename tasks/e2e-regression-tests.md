# E2E Regression Test Plan — Dird Plesk Memorial

**Created:** 2026-03-18
**Method:** Manual browser testing (Chrome recommended)
**Setup:** Open DevTools console throughout. Use 2 tabs for real-time sync tests.

---

## Pre-Test Setup

1. Open Chrome DevTools console
2. Run `localStorage.clear()` for fresh state
3. Refresh the page
4. Keep console open — any JS errors during testing are bugs

---

## Phase 1: Fresh State & First-Time Setup

- [x] **1.1** Visit site → password overlay appears, content hidden behind it — **PASS**
- [x] **1.2** Enter wrong password → error feedback, overlay stays — **PASS**
- [x] **1.3** Enter "austin" → overlay disappears, site content reveals — **PASS**
- [x] **1.4** Refresh page → no password prompt (localStorage persists) — **PASS**
- [x] **1.5** Homepage shows 12 player slots with default names — **PASS**
- [x] **1.6** Click a non-admin slot (e.g., slot 2) → immediately logged in, name in header, logout button visible — **PASS**
- [ ] **1.7** Logout → header clears, player grid reappears — **NOT TESTED** (skipped, tested admin login instead)
- [x] **1.8** Click slot 1 (admin) → password modal appears — **PASS** (Stephen's slot prompts for admin password)
- [ ] **1.9** Enter wrong admin password → error toast, input cleared — **NOT TESTED**
- [x] **1.10** Enter "1816" → logged in as admin, `is-admin` class on body (check DevTools) — **PASS**
- [x] **1.11** Setup wizard auto-appears after Fresh Start with "Step 1 of 7" + progress bar — **PASS**

### Setup Wizard — Main Flow (via Fresh Start)
- [x] **1.8a** Title & subtitle inputs visible — **PASS**
- [x] **1.8b** Enter title "Test Tournament 2026" + subtitle → click Next — **PASS**
- [x] **1.8c** Wizard advances to Step 2 — **PASS**
- [x] **1.9a** Player count dropdown + name inputs visible — **PASS**
- [x] **1.9b** Change count to 6 → only 6 inputs shown — **PASS**
- [x] **1.9c** Enter Alice/Bob/Charlie → click Next — **PASS**
- [x] **1.10a** "Include Golf Event" toggle visible — **PASS** (defaulted to ON)
- [x] **1.10b** Toggle ON → date/time/format/scoring/par fields appear — **PASS**
- [x] **1.10c** Set date, "Best Ball", par 35/37 → click Next — **PASS**
- [x] **1.11a** "Include Custom Events" toggle visible — **PASS** (defaulted to OFF)
- [x] **1.11b** Toggle ON → Add "Cornhole" / Individual — **PASS**
- [x] **1.11c** Add "Relay Race" / Team Shared → click Next — **PASS**
- [x] **1.12a** "Include Trivia" toggle visible — **PASS** (defaulted to OFF)
- [x] **1.12b** Toggle ON → date/time appear → set date → Next — **PASS**
- [x] **1.13a** "Include Predictions" toggle visible — **PASS** (defaulted to OFF)
- [x] **1.13b** Toggle ON → click Next — **PASS** ⚠️ Label click didn't toggle; had to click checkbox directly (accessibility bug)
- [x] **1.14a** Summary shows correct data (title, players, admin, golf, 2 events, trivia, predictions) — **PASS**
- [x] **1.14b** Click "Finish Setup" → wizard closes — **PASS**
- [x] **1.14c** Toast "Setup complete!" appears — **SOFT PASS** ⚠️ Toast disappeared too quickly to visually confirm exact message
- [x] **1.14d** Refresh → wizard does NOT reappear — **PASS**
- [x] **1.14e** Homepage shows "Test Tournament 2026" / "May the best player win" — **PASS**
- [x] **1.14f** Player grid shows Alice, Bob, Charlie + 3 unnamed slots — **PASS**
- [x] **1.14g** Weekend schedule shows golf with "Best Ball" format + Cornhole + Relay Race — **PASS**

### Setup Wizard — Back Button
- [x] **1.Back1** Step 3 → Back → Step 2 values preserved (Alice/Bob/Charlie, 6 players) — **PASS**
- [x] **1.Back2** Step 2 → Back → Step 1 values preserved (title/subtitle) — **PASS**

### Setup Wizard — Skip Flow
- [x] **1.15a** Wizard visible after Fresh Start — **PASS**
- [ ] **1.15b** Click "Skip Setup" → confirmation dialog appears — **FAIL** ❌ No confirmation dialog; skip fires immediately
- [x] **1.15c** Skip → wizard closes, site functional — **PASS** (despite no confirmation)
- [x] **1.15d** Refresh → wizard does NOT reappear — **PASS**
- [x] **1.15e** "Run Setup Wizard" button re-opens wizard — **PASS**

**Notes:**
```
Phase 1 Auth Tests — Tested 2026-03-18. 6/6 applicable tests PASSED. Zero JS console errors.
- Stephen's slot has a yellow border and requires admin password (1816) before login.
- localStorage after admin login: currentUser:"Stephen", isAdmin:"true", currentUserSlot:"1", siteAccessGranted:"true"
- Still need to test: 1.7 (logout flow), 1.9 (wrong admin password).

Setup Wizard Tests — Tested 2026-03-18 via Claude Chrome. 29/30 PASSED, 1 FAIL. Zero JS console errors.
```

---

## Phase 2: Admin Settings Management

### Site Settings
- [ ] **2.1** Navigate to Admin page → all settings sections load
- [ ] **2.2** Change hero title → Save → toast appears → verify on homepage
- [ ] **2.3** Change subtitle → Save → verify on homepage
- [ ] **2.4** Toggle "Show Notes" off → Save → homepage hides notes → toggle on → Save → notes visible
- [ ] **2.5** Edit notes with HTML (`<a href="...">link</a>`) → Save → verify link renders on homepage
- [ ] **2.6** Refresh admin page → all saved values persisted in form inputs

### Golf Settings
- [ ] **2.7** Change golf format dropdown → Save → refresh → value persisted
- [ ] **2.8** Set front9 par=35, back9 par=37 → Save → values stick on refresh
- [ ] **2.9** Enter par=20 (below min 27) → should clamp to 27 on save
- [ ] **2.10** Set golf date + time → Save → appears in weekend schedule on homepage
- [ ] **2.11** Change base points per 9 to 15 → Save → golf scoring recalculates

### Event Locks
- [ ] **2.12** Toggle golf lock ON → toast confirms → golf page shows read-only scores
- [ ] **2.13** Toggle trivia lock ON → trivia controls disabled
- [ ] **2.14** Toggle predictions lock ON → no new submissions allowed
- [ ] **2.15** Toggle all locks OFF → everything editable again

### REGRESSION: Collapse/Save Bug (HIGH PRIORITY)
- [ ] **2.16** Toggle golf lock → settings section does NOT visually collapse/flash
- [ ] **2.17** Toggle lock → check that OTHER form inputs (hero title, notes, etc.) retain their current values
- [ ] **2.18** Type a new hero title (DON'T save) → toggle an event lock → check if typed title is still in the input field (EXPECTED BUG: innerHTML rebuild destroys unsaved values)
- [ ] **2.19** Rapidly toggle 3 locks on/off → all changes saved correctly, no UI freeze
- [ ] **2.20** Save site settings → wait 2 sec → save golf settings → no conflict between saves

### Competition Status
- [ ] **2.21** Click "Close Competition" → confirmation dialog → confirm → banner shows "Competition CLOSED"
- [ ] **2.22** Visit leaderboard → podium with top 3 displayed
- [ ] **2.23** Click "Reopen Competition" → confirmation → podium hidden

### Feature Toggles
- [ ] **2.24** Disable golf → golf page reflects disabled state
- [ ] **2.25** Disable trivia → trivia page reflects disabled state
- [ ] **2.26** Disable predictions → predictions page reflects disabled state
- [ ] **2.27** Re-enable all → pages restore to normal

**Bugs Found:**
```
```

---

## Phase 3: Player Management

- [ ] **3.1** On admin page, edit a player name → saves to Firebase
- [ ] **3.2** Check homepage → renamed player shows new name in grid
- [ ] **3.3** Refresh → name persists
- [ ] **3.4** Logout → login as renamed player → header shows correct name
- [ ] **3.5** Try to save empty player name → should reject or use default
- [ ] **3.6** Enter name with `<script>alert(1)</script>` → should be escaped, no XSS

**Bugs Found:**
```
```

---

## Phase 4: Golf Setup & Scoring

### Team Setup
- [ ] **4.1** Set team count to 3 on admin → team assignment UI shows 3 teams
- [ ] **4.2** Assign players to teams via checkboxes → save → persisted
- [ ] **4.3** Visit golf page → team cards show correct player assignments

### Score Entry
- [ ] **4.4** Enter front9=35, back9=38 for team 1 → saves
- [ ] **4.5** Verify points calculation: basePoints - (score - par) per 9
- [ ] **4.6** Toggle scoring enabled/disabled per team → disabled team inputs locked

### Shotgun Counter
- [ ] **4.7** Add 2 shotguns for team 1 → counter shows 2, bonus calculated
- [ ] **4.8** Try setting shotguns to 20 (max should be 18) → clamped

### Individual Bonuses
- [ ] **4.9** Assign "Long Drive" to a player → bonus points added to their total
- [ ] **4.10** Assign "Closest to Pin" → bonus points added
- [ ] **4.11** Verify auto-bonuses (best front 9, best back 9) detect correct teams

### Bonus Point Values
- [ ] **4.12** Edit bonus point values → save → calculations update on leaderboard

### Integration
- [ ] **4.13** Visit leaderboard → golf column shows correct points per player
- [ ] **4.14** Lock golf → score inputs on golf page become read-only

**Bugs Found:**
```
```

---

## Phase 5: Custom Events

### Individual Scoring Mode
- [ ] **5.1** Create event "Cornhole" → individual scoring, 1 round
- [ ] **5.2** Event appears in admin events section + events page
- [ ] **5.3** Expand point values → defaults (25, 20, 16...) shown, editable
- [ ] **5.4** Enter player rankings → save → points assigned correctly
- [ ] **5.5** Visit events page as player → results table visible
- [ ] **5.6** Leaderboard shows event column with correct points

### Team Shared Scoring Mode
- [ ] **5.7** Create "Relay Race" → team_shared, 2 teams
- [ ] **5.8** Assign players to teams → save
- [ ] **5.9** Enter team results → each team member gets same points
- [ ] **5.10** Add round 2 → "Copy Previous Teams" auto-fills teams

### Individual-to-Team Scoring Mode
- [ ] **5.11** Create "Beer Pong" → individual_to_team
- [ ] **5.12** Enter individual scores → pooled per team → teams ranked
- [ ] **5.13** Team ranking determines shared points for members

### Event Management
- [ ] **5.14** Add rounds 2, 3 → UI expands correctly
- [ ] **5.15** Remove a round → confirmation → round deleted
- [ ] **5.16** Delete entire event → confirmation → event removed from everywhere
- [ ] **5.17** Lock a custom event → results become read-only
- [ ] **5.18** Create 3+ events → all display correctly

### REGRESSION: Config Collapse Tests
- [ ] **5.19** Expand event config → save results → config stays expanded (not collapsed)
- [ ] **5.20** Type in result fields → open another tab and trigger Firebase update → return to tab → typed values preserved
- [ ] **5.21** Open a `<details>` section (point values) → save → details stays open

**Bugs Found:**
```
```

---

## Phase 6: Trivia Engine

### Setup
- [ ] **6.1** Ensure trivia is enabled in feature toggles
- [ ] **6.2** Add 3 questions manually: 1 multiple choice, 1 freeform, 1 with category
- [ ] **6.3** MC question has 4 options + correct answer selector; freeform has text only
- [ ] **6.4** Import CSV with questions → questions populate correctly
- [ ] **6.5** Test malformed CSV → graceful error (no crash)
- [ ] **6.6** Edit an existing question → changes save

### Game Flow (2 TABS: admin + player)
- [ ] **6.7** Player tab: visit trivia → click "Join" → admin tab shows player in joined list
- [ ] **6.8** Admin: click "Start Trivia" → player tab sees Q1 appear
- [ ] **6.9** Player: select MC answer → submit → can't change → admin sees response
- [ ] **6.10** Player: type freeform answer → submit → admin sees it for review
- [ ] **6.11** Admin: click "Reveal Responses" → MC auto-graded, freeform shown for manual review
- [ ] **6.12** Admin: approve correct freeform → points awarded
- [ ] **6.13** Admin: toggle 2x bonus on a response → double points applied
- [ ] **6.14** Admin: advance to Q2 → player sees Q2
- [ ] **6.15** After all questions → admin clicks "Finish" → status = complete
- [ ] **6.16** Trivia results shown, points reflected on leaderboard
- [ ] **6.17** Lock trivia → game controls disabled

### Edge Cases
- [ ] **6.18** Player joins mid-game → can answer current question
- [ ] **6.19** Admin reveals before all players answer → works, unanswered shown blank
- [ ] **6.20** Refresh player tab mid-game → state restored from Firebase

**Bugs Found:**
```
```

---

## Phase 7: Predictions

- [ ] **7.1** Admin creates prediction with 3-4 answer options
- [ ] **7.2** Player sees "unanswered predictions" banner somewhere on site
- [ ] **7.3** Player visits predictions → selects option → confirms → submitted
- [ ] **7.4** After submitting → option locked, can't change vote
- [ ] **7.5** Banner updates (disappears or count decreases)
- [ ] **7.6** Lock predictions → no new submissions allowed
- [ ] **7.7** Admin finalizes with correct answer → points awarded to correct voters
- [ ] **7.8** Points appear on leaderboard
- [ ] **7.9** Create 3+ predictions → all function independently
- [ ] **7.10** Check prediction point values (1-10 range) → correct amount awarded

**Bugs Found:**
```
```

---

## Phase 8: Leaderboard & Scoring

- [ ] **8.1** Overall leaderboard shows all players ranked by total points
- [ ] **8.2** Expandable sections for golf, each custom event, trivia, predictions
- [ ] **8.3** Manually calculate expected points for 1-2 players → verify they match
- [ ] **8.4** SVG chart renders with player point progression
- [ ] **8.5** Top 3 rows highlighted (gold, silver, bronze styling)
- [ ] **8.6** Logged-in player's row shows "(You)" or similar indicator
- [ ] **8.7** With competition closed → podium with top 3 and medals
- [ ] **8.8** Change a score in another tab → leaderboard updates in real-time

**Bugs Found:**
```
```

---

## Phase 9: Profile Page

- [ ] **9.1** Login → visit profile → player stats displayed
- [ ] **9.2** Visit profile without login → redirected to home
- [ ] **9.3** Point breakdown by event source shown
- [ ] **9.4** Current rank among all players displayed
- [ ] **9.5** Team assignments for each event listed

**Bugs Found:**
```
```

---

## Phase 10: Cross-Cutting Concerns

### Theme
- [ ] **10.1** Site loads in dark mode by default
- [ ] **10.2** Click theme toggle → light mode applies across all elements
- [ ] **10.3** Refresh → theme persists (localStorage)
- [ ] **10.4** Navigate to every page → theme consistent

### Navigation
- [ ] **10.5** Click every nav link → correct page loads, no 404s
- [ ] **10.6** Current page highlighted in nav
- [ ] **10.7** Admin link visible and accessible

### Real-Time Sync (2 TABS)
- [ ] **10.8** Tab 1 (admin) renames player → Tab 2 homepage grid updates without refresh
- [ ] **10.9** Tab 1 enters golf score → Tab 2 leaderboard updates
- [ ] **10.10** Tab 1 changes hero title + saves → Tab 2 homepage updates

### Mobile Responsiveness (DevTools responsive mode)
- [ ] **10.11** 375px width → all pages usable, no horizontal overflow
- [ ] **10.12** 768px width → layout adapts, no overlapping elements
- [ ] **10.13** Player grid wraps properly on small screens
- [ ] **10.14** Data tables have horizontal scroll, not page overflow

### Edge Cases
- [ ] **10.15** Login as admin in tab 1, as player in tab 2 → localStorage conflict (last login wins — document this behavior)
- [ ] **10.16** Disable network in DevTools → try to save → error toast appears
- [ ] **10.17** Refresh mid-trivia → state restored from Firebase
- [ ] **10.18** Visit leaderboard with zero scores → no errors, shows empty/placeholder state

**Bugs Found:**
```
```

---

## Phase 11: Data Management

- [ ] **11.1** Admin exports data → valid JSON file downloads with all paths
- [ ] **11.2** Admin resets data → confirmation required → all data reset to defaults
- [ ] **11.3** After reset, site functions as fresh state

**Bugs Found:**
```
```

---

## Known Risk Areas (Test These First)

| Priority | Area | Why |
|----------|------|-----|
| **P0** | Admin settings collapse bug (2.16-2.20) | `renderSiteSettings()` does full innerHTML rebuild on every Firebase change. Event lock toggles trigger this. |
| **P0** | Custom events collapse (5.19-5.21) | Has mitigations but needs stress testing |
| **P1** | Trivia game flow (6.7-6.17) | Complex state machine with real-time sync |
| **P1** | Point calculation accuracy (8.3) | Aggregates from 4+ sources — any bug compounds |
| **P2** | localStorage/Firebase divergence (10.15-10.16) | Name changes don't auto-update localStorage |

---

## Bug Tracking Template

```
### Bug #X: [Short description]
**Phase:** X.X
**Severity:** blocker / major / minor / cosmetic
**Steps to reproduce:**
1. ...
2. ...
3. ...
**Expected:** ...
**Actual:** ...
**Console errors:** (paste any)
```

---

## Bugs Found During Regression Testing

### Bug #1: Skip Setup has no confirmation dialog
**Phase:** 1.15b
**Severity:** minor
**Steps to reproduce:**
1. Admin does Fresh Start
2. Wizard appears
3. Click "Skip Setup"
**Expected:** Confirmation dialog ("Are you sure?") before closing
**Actual:** Wizard immediately closes with no confirmation
**Console errors:** None

### Bug #2: Predictions toggle label not wired to checkbox
**Phase:** 1.13b
**Severity:** minor (accessibility)
**Steps to reproduce:**
1. In setup wizard, reach Step 6 (Predictions)
2. Click the "Include Predictions" text label
**Expected:** Checkbox toggles
**Actual:** Nothing happens; must click the checkbox input directly
**Note:** Golf, Custom Events, and Trivia toggle labels all work correctly — only Predictions is broken. Likely missing `for` attribute or mismatched ID.
**Console errors:** None

### Bug #3: "Setup complete!" toast disappears too quickly
**Phase:** 1.14c
**Severity:** cosmetic
**Steps to reproduce:**
1. Complete full wizard → click "Finish Setup"
**Expected:** Toast visible for 2-3 seconds
**Actual:** Toast appeared and vanished in < 1 second
**Console errors:** None

### Bug #4: Stale events persist after Fresh Start
**Phase:** Post-wizard observation
**Severity:** minor
**Steps to reproduce:**
1. Create events, then do Fresh Start
2. Check Manage Events on admin page
**Expected:** All events cleared
**Actual:** Old events ("asdas", "dsadsa") still present
**Note:** May be hardcoded defaults or Fresh Start not clearing the events Firebase path
**Console errors:** None

---

## Post-Testing

After completing all tests:
1. Record all bugs in `tasks/todo.md` with severity
2. Fix blockers and majors first
3. Re-test fixed areas (regression of the regression test)
