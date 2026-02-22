#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Initialize npm project if needed (idempotent)
cd "$CLAUDE_PROJECT_DIR"
if [ ! -f package.json ]; then
  npm init -y --silent > /dev/null 2>&1
fi

# Install ESLint for JS linting (idempotent - npm install skips if already present)
npm install --save-dev eslint@8 > /dev/null 2>&1

# Create ESLint config if it doesn't exist
if [ ! -f .eslintrc.json ]; then
  cat > .eslintrc.json << 'ESLINTEOF'
{
  "env": {
    "browser": true,
    "es6": true
  },
  "globals": {
    "firebase": "readonly",
    "APP_CONFIG": "readonly",
    "db": "readonly",
    "dataCache": "writable",
    "firebaseListenerPaths": "readonly",
    "MAX_PLAYERS": "readonly",
    "MAX_TRIVIA_QUESTIONS": "readonly",
    "MAX_PREDICTIONS": "readonly",
    "DEFAULT_GOLF_BASE_POINTS": "readonly",
    "DEFAULT_PLAYERS": "readonly",
    "DEFAULT_TRIVIA_POINTS": "readonly",
    "DEFAULT_BONUS_POINTS": "readonly",
    "DEFAULT_SITE_SETTINGS": "readonly",
    "DEFAULT_TRIVIA_GAME": "readonly",
    "DEFAULT_PREDICTIONS": "readonly",
    "VALIDATION_BOUNDS": "readonly",
    "SCORING_LABELS": "readonly",
    "expandedEventConfigs": "readonly",
    "onboardingStep": "writable",
    "onboardingData": "writable",
    "ONBOARDING_TOTAL_STEPS": "readonly"
  },
  "rules": {
    "no-undef": "error",
    "no-unused-vars": ["warn", { "args": "none", "varsIgnorePattern": "^(render|save|handle|toggle|update|delete|create|open|close|login|logout|submit|check|apply|export|confirm|reset|fresh|skip|complete|join|select|add|remove|copy|load|trivia|golf|onboarding)" }],
    "no-redeclare": "error",
    "eqeqeq": ["warn", "smart"],
    "no-duplicate-case": "error",
    "no-empty": "warn",
    "no-unreachable": "error"
  },
  "parserOptions": {
    "ecmaVersion": 2020
  }
}
ESLINTEOF
fi
