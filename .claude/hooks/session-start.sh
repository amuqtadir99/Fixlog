#!/usr/bin/env bash
# Installs dependencies in fresh Claude Code on the web sessions so lint/tests work immediately.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
[ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null 2>&1
npx next typegen >/dev/null 2>&1 || true
