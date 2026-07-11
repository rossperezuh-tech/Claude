#!/usr/bin/env bash
# Render marketing one-pager HTML files to PDF with headless Chromium.
# Usage: CHROME=/path/to/chromium bash marketing/build-pdfs.sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="${CHROME:-/opt/pw-browsers/chromium}"

node "$DIR/generate.mjs"
node "$DIR/portfolio.mjs"
mkdir -p "$DIR/pdf"

for html in "$DIR"/html/*.html; do
  slug="$(basename "$html" .html)"
  "$CHROME" --headless --disable-gpu --no-sandbox \
    --no-pdf-header-footer --print-to-pdf="$DIR/pdf/$slug.pdf" \
    "file://$html" 2>/dev/null
  echo "pdf/$slug.pdf"
done
