#!/usr/bin/env bash
# Builds the site and publishes dist/ to the gh-pages branch (GitHub Pages).
# Only needed for code/design changes: menu and dates are edited live in /admin.
set -euo pipefail
cd "$(dirname "$0")/.."
remote=$(git remote get-url origin)
npm run build
cd dist
touch .nojekyll   # let GitHub Pages serve the _astro/ folder
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f "$remote" gh-pages
rm -rf .git
echo "Deployed. Live in a minute or two at https://harryw-developer.github.io/kes-crust-co/"
