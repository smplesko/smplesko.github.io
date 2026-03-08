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

# .eslintrc.json is committed to the repo — no need to create it here.
# The canonical config lives at $CLAUDE_PROJECT_DIR/.eslintrc.json
# and is maintained alongside the codebase.
