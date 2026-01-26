# Firebase Security Rules Reference

This document outlines how to configure Firebase Realtime Database security rules for different phases of the BP Games Tracker application.

## How to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **bp-games-tracker**
3. Navigate to: **Realtime Database** → **Rules** tab
4. Paste the appropriate rules below
5. Click **Publish**

---

## Phase 1: Development / Building the Site

Use these rules when actively developing and testing the application. This allows full read/write access for easy testing.

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**When to use:** While you're actively building features or making changes to the site.

**Security level:** Open (anyone can read/write)

---

## Phase 2: Sandbox / Testing Mode

Use these rules when you want to test the app functionality with realistic conditions but want some basic protection. This validates that data being written has the expected structure.

```json
{
  "rules": {
    ".read": true,
    "players": {
      ".write": true,
      ".validate": "newData.isString() || newData.hasChildren()"
    },
    "golfTeams": {
      ".write": true
    },
    "golfHoleScores": {
      ".write": true
    },
    "golfShotguns": {
      ".write": true
    },
    "golfBonuses": {
      ".write": true
    },
    "golfScoringEnabled": {
      ".write": true
    },
    "beerTeams": {
      ".write": true
    },
    "beerScores": {
      ".write": true
    },
    "gokartResults": {
      ".write": true
    },
    "gokartPoints": {
      ".write": true
    },
    "triviaPoints": {
      ".write": true
    },
    "bonusPoints": {
      ".write": true
    },
    "triviaGame": {
      ".write": true
    },
    "siteSettings": {
      ".write": true
    }
  }
}
```

**When to use:** When testing the full application flow before the actual event.

**Security level:** Moderate (anyone can read, writes are limited to known data paths)

---

## Phase 3: BP Weekend (Live Event)

Use these rules during the actual bachelor party weekend. This provides the same access as sandbox mode but explicitly defines all paths to prevent any accidental data corruption.

```json
{
  "rules": {
    ".read": true,
    "players": {
      ".write": true
    },
    "golfTeams": {
      ".write": true
    },
    "golfHoleScores": {
      ".write": true
    },
    "golfShotguns": {
      ".write": true
    },
    "golfBonuses": {
      ".write": true
    },
    "golfScoringEnabled": {
      ".write": true
    },
    "beerTeams": {
      ".write": true
    },
    "beerScores": {
      ".write": true
    },
    "gokartResults": {
      ".write": true
    },
    "gokartPoints": {
      ".write": true
    },
    "triviaPoints": {
      ".write": true
    },
    "bonusPoints": {
      ".write": true
    },
    "triviaGame": {
      ".write": true
    },
    "siteSettings": {
      ".write": true
    }
  }
}
```

**When to use:** During the actual BP weekend event.

**Security level:** Moderate (same as sandbox - everyone needs to interact with the app)

**Note:** Since this is a trusted group app for a bachelor party, authentication isn't needed. All participants are known and trusted.

---

## Phase 4: Inactive / Not in Use

Use these rules when the site is not actively being used or after the event is complete. This locks down the database to prevent any changes while preserving the data for viewing.

```json
{
  "rules": {
    ".read": true,
    ".write": false
  }
}
```

**When to use:**
- After finishing development and before testing begins
- After the BP weekend is over
- Any time the app isn't actively being used

**Security level:** Read-only (anyone can view, no one can modify)

---

## Quick Reference Table

| Phase | When | Read | Write |
|-------|------|------|-------|
| Development | Building/coding | All | All |
| Sandbox | Testing | All | Specific paths |
| BP Weekend | Live event | All | Specific paths |
| Inactive | Not in use | All | None |

---

## Resetting Data for BP Weekend

Before the actual event, you may want to clear all test data. You can do this from the Firebase Console:

1. Go to **Realtime Database** → **Data** tab
2. Hover over the root node
3. Click the **X** to delete all data
4. The app will recreate default empty structures when first accessed

Or selectively clear specific sections (triviaGame, golfHoleScores, etc.) while keeping players.

---

## Monitoring Usage

During the BP weekend, you can monitor database activity:

1. Go to **Realtime Database** → **Usage** tab
2. View real-time connections and bandwidth
3. Free tier allows 100 simultaneous connections (plenty for a bachelor party!)

---

## Emergency Lockdown

If something goes wrong during the event, immediately apply these rules:

```json
{
  "rules": {
    ".read": true,
    ".write": false
  }
}
```

This preserves all current data and prevents further changes until you can investigate.
