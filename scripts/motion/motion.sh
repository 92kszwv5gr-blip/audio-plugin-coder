#!/usr/bin/env bash
# Motion pipeline wrapper: check | render | artifact | all
# Usage: bash scripts/motion/motion.sh <cmd> motion/<name>/index.html [extra args]
set -euo pipefail
cmd="${1:-all}"; file="${2:-motion/velloway-m84/index.html}"; shift $(( $# > 2 ? 2 : $# )) || true
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
name="$(basename "$(dirname "$file")")"
out="build/motion/$name"
# Find Playwright: local node_modules first, then the global install.
export NODE_PATH="${NODE_PATH:-}:$(pwd)/node_modules:$(npm root -g 2>/dev/null || true)"
node -e "require('playwright')" 2>/dev/null || { echo "Playwright not found: npm i -D playwright && npx playwright install chromium"; exit 1; }

case "$cmd" in
  check)    node "$here/check-frames.cjs" "$file" "$out/qa" "$@" ;;
  render)   command -v ffmpeg >/dev/null || { echo "ffmpeg not found"; exit 1; }
            node "$here/render-video.cjs" "$file" "$out/$name.mp4" "$@" ;;
  artifact) node "$here/to-artifact.cjs" "$file" "$out/artifact.html" ;;
  all)      node "$here/check-frames.cjs" "$file" "$out/qa"
            node "$here/render-video.cjs" "$file" "$out/$name.mp4"
            node "$here/to-artifact.cjs" "$file" "$out/artifact.html" ;;
  *) echo "usage: motion.sh <check|render|artifact|all> <index.html>"; exit 1 ;;
esac
