#!/usr/bin/env bash
set -euo pipefail

ensure_pnpm_home() {
  if [ -n "${PNPM_HOME:-}" ] && pnpm bin --global >/dev/null 2>&1; then
    export PATH="$PNPM_HOME:$PATH"
    return 0
  fi

  if [ -d "$HOME/Library/pnpm" ]; then
    export PNPM_HOME="$HOME/Library/pnpm"
    export PATH="$PNPM_HOME:$PATH"
    return 0
  fi

  echo "pnpm の global 設定が未完了です。次を実行してください:"
  echo ""
  echo "  pnpm setup"
  echo "  source ~/.zshrc"
  echo ""
  echo "その後、もう一度 pnpm sdk:link を実行してください。"
  echo ""
  echo "global link を使わない場合は、こちらが簡単です:"
  echo ""
  echo "  pnpm sdk:link:to /path/to/your-other-product"
  exit 1
}

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAMES=("@ams/shared-types" "@ams/sdk-web" "@ams/sdk-three")
DIRS=(shared-types sdk-web sdk-three)

ensure_pnpm_home

for i in "${!DIRS[@]}"; do
  echo "Linking ${NAMES[$i]}..."
  (cd "$ROOT/packages/${DIRS[$i]}" && pnpm link --global)
done
