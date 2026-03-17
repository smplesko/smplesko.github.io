# Firebase Security Setup Guide

This guide walks you through two changes in the Firebase Console to secure your database. Both can be done in under 30 minutes.

---

## Part 1: Security Rules (15 minutes)

Security rules control **what** can be read/written and **what shape** the data must have. Right now your database is wide open — anyone with the URL can read or write anything.

These rules will:
- Block writes to paths that don't exist in your app (e.g., `/malicious/payload`)
- Enforce data types and string length limits on user-facing fields
- Keep full read/write access for all legitimate paths (so the site works exactly as before)

### Steps

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bp-games-tracker**
3. In the left sidebar, click **Build** > **Realtime Database**
4. Click the **Rules** tab at the top
5. **Replace** the entire contents with the JSON below
6. Click **Publish**

### Rules to Copy

```json
{
  "rules": {

    "players": {
      ".read": true,
      ".write": true,
      "$slot": {
        ".validate": "newData.hasChildren(['name', 'isAdmin'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length <= 30"
        },
        "isAdmin": {
          ".validate": "newData.isBoolean()"
        },
        "$other": { ".validate": false }
      }
    },

    "golfTeams": {
      ".read": true,
      ".write": true
    },

    "golfScores": {
      ".read": true,
      ".write": true,
      "$team": {
        "front9": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 200"
        },
        "back9": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 200"
        },
        "$other": { ".validate": false }
      }
    },

    "golfShotguns": {
      ".read": true,
      ".write": true,
      "$team": {
        ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 18"
      }
    },

    "golfScoringEnabled": {
      ".read": true,
      ".write": true
    },

    "golfIndividualBonuses": {
      ".read": true,
      ".write": true,
      "$bonus": {
        "player": {
          ".validate": "newData.isString() && newData.val().length <= 30"
        },
        "points": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 50"
        },
        "$other": { ".validate": false }
      }
    },

    "bonusPoints": {
      ".read": true,
      ".write": true,
      "bestFront": {
        ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 50"
      },
      "bestBack": {
        ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 50"
      },
      "overallWinner": {
        ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 50"
      },
      "shotgun": {
        ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 50"
      },
      "$other": { ".validate": false }
    },

    "triviaPoints": {
      ".read": true,
      ".write": true
    },

    "triviaGame": {
      ".read": true,
      ".write": true,
      "description": {
        ".validate": "newData.isString() && newData.val().length <= 500"
      },
      "maxQuestions": {
        ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 50"
      }
    },

    "customEvents": {
      ".read": true,
      ".write": true
    },

    "siteSettings": {
      ".read": true,
      ".write": true,
      "heroTitle": {
        ".validate": "newData.isString() && newData.val().length <= 200"
      },
      "heroSubtitle": {
        ".validate": "newData.isString() && newData.val().length <= 200"
      },
      "notesContent": {
        ".validate": "newData.isString() && newData.val().length <= 2000"
      }
    },

    "predictions": {
      ".read": true,
      ".write": true,
      "maxPredictions": {
        ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 50"
      }
    },

    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

### How to Verify

After publishing, test in your browser:
1. Open your site and use it normally — everything should work
2. Open browser DevTools (F12) > Console and try writing to a fake path:
   ```js
   firebase.database().ref('fakePath').set('test')
   ```
   This should fail with a **PERMISSION_DENIED** error

If something breaks, you can always go back to the Rules tab and temporarily set:
```json
{ "rules": { ".read": true, ".write": true } }
```
Then re-publish the full rules once the issue is identified.

---

## Part 2: App Check (10 minutes)

App Check verifies that requests to your database come from **your actual website**, not from scripts, curl commands, or someone else's app. This is the single best defense against someone finding your database URL and abusing it.

### Step 2a: Set Up reCAPTCHA

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Click **+** (Create) to register a new site
3. Fill in:
   - **Label**: `bp-games-tracker`
   - **reCAPTCHA type**: Select **reCAPTCHA v3** (invisible, no user interaction)
   - **Domains**: Add your domain (e.g., `smplesko.github.io`). Also add `localhost` if you test locally
4. Click **Submit**
5. Copy the **Site Key** (you'll need it in Step 2c)
6. Copy the **Secret Key** (you'll need it in Step 2b)

### Step 2b: Enable App Check in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) > **bp-games-tracker**
2. In the left sidebar, click **Build** > **App Check**
3. Click on your **Web app**
4. Select **reCAPTCHA v3** as the provider
5. Paste the **Secret Key** from Step 2a
6. Click **Save**

### Step 2c: Add App Check to Your Code

Open `js/firebase.js` and add this line right after the `firebase.initializeApp(...)` line:

```js
firebase.appCheck().activate('YOUR_RECAPTCHA_SITE_KEY_HERE', true);
```

Replace `YOUR_RECAPTCHA_SITE_KEY_HERE` with the **Site Key** you copied in Step 2a (keep the quotes).

The `true` parameter enables automatic token refresh.

### Step 2d: Enforce App Check

**Important**: Do this step AFTER you've confirmed the site works with App Check activated in your code. If you enforce before the code is deployed, the site will break.

1. Deploy your site with the code change from Step 2c
2. Visit your site and confirm everything still works
3. Go to Firebase Console > **App Check**
4. Click the **APIs** tab (or **Realtime Database** under the Enforce section)
5. Click **Enforce** for Realtime Database
6. Confirm

### How to Verify

After enforcement:
1. Your site should work normally in the browser
2. Try accessing the database directly in a new terminal/tool:
   ```
   curl https://bp-games-tracker-default-rtdb.firebaseio.com/players.json
   ```
   This should return a **401 Unauthorized** error instead of your data

### If Something Goes Wrong

You can **un-enforce** App Check at any time in the Firebase Console (App Check > APIs > click Unenforce). This immediately restores open access while you debug.

---

## Summary

| Step | What It Does | Time |
|------|-------------|------|
| Security Rules | Blocks unknown paths, validates data shape/length | 15 min |
| App Check | Blocks requests not from your website | 10 min |
| CSP meta tag | Already done in code — blocks injected external scripts | Done |

After completing both steps, the remaining attack surface is limited to someone who:
1. Visits your actual site in a browser (passes App Check)
2. Knows the site password (passes the gate)
3. Can only write validly-shaped data (passes security rules)

This is a strong posture for a client-side app with no backend.
