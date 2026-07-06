#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: pnpm sdk:link:to /path/to/your-other-product"
  exit 1
fi

TARGET="$(cd "$1" && pwd)"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIRS=(shared-types sdk-web sdk-three)

if [ ! -f "$TARGET/package.json" ]; then
  echo "package.json が見つかりません: $TARGET"
  exit 1
fi

echo "Building SDK packages..."
(cd "$ROOT" && pnpm sdk:build)

echo "Linking SDK packages into $TARGET..."
for pkg in "${DIRS[@]}"; do
  echo "  -> @ams/$pkg"
  (cd "$TARGET" && pnpm link "$ROOT/packages/$pkg")
done

node "$ROOT/scripts/sdk-link-to.mjs" "$TARGET"
