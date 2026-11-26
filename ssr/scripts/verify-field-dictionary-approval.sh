#!/usr/bin/env bash
set -euo pipefail
sha=${1:-}
file="$(cd "$(dirname "$0")/.." && pwd)/../docs/evidence/gate4/$sha/field-dictionary.md"
[[ -f "$file" ]] || exit 43
awk 'BEGIN{ok=0} /^status: approved$/{ok=1} END{exit ok?0:41}' "$file"
