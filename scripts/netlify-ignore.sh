#!/usr/bin/env bash
set -Eeo pipefail

# The root React/Firebase prototype is a legacy Netlify site. SSR work lives
# under ssr/ and must not spend Netlify build credits.
cached_commit="$CACHED_COMMIT_REF"
current_commit="$COMMIT_REF"

if [[ -z "$cached_commit" ]]; then
  # No previous commit means Netlify should perform the first/explicit build.
  exit 1
fi

if git diff --quiet "$cached_commit" "$current_commit" -- \
  . \
  ':(exclude)ssr' \
  ':(exclude)docs' \
  ':(exclude)scripts' \
  ':(exclude).github' \
  ':(exclude)DEVELOPMENT_PLAN.md'; then
  # Exit 0 tells Netlify to skip this build.
  exit 0
fi

# A legacy root-application change still warrants a Netlify build.
exit 1
