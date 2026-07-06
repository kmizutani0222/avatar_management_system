#!/usr/bin/env bash
set -euo pipefail

if [ -d "$HOME/Library/pnpm" ]; then
  export PNPM_HOME="$HOME/Library/pnpm"
  export PATH="$PNPM_HOME:$PATH"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIRS=(shared-types sdk-web sdk-three)

for pkg in "${DIRS[@]}"; do
  echo "Unlinking @ams/$pkg..."
  (cd "$ROOT/packages/$pkg" && pnpm unlink --global) || true
done
