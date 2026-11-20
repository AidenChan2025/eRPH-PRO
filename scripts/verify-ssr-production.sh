#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-https://erphpro.com}"
HEALTH_URL="${BASE_URL%/}/health"
tmp_body="$(mktemp)"
trap 'rm -f "$tmp_body"' EXIT

headers="$(curl --silent --show-error --location --max-time 20 --dump-header - --output "$tmp_body" "$HEALTH_URL")"
status="$(awk 'toupper($1) ~ /^HTTP\// { code=$2 } END { print code }' <<<"$headers")"
content_type="$(awk -F': ' 'tolower($1)=="content-type" { value=$2 } END { sub(/\r$/, "", value); print tolower(value) }' <<<"$headers")"
body="$(cat "$tmp_body")"

fail=0
if [[ "$status" != "200" ]]; then
  echo "FAIL: $HEALTH_URL returned HTTP ${status:-unknown}" >&2
  fail=1
fi
if [[ "$content_type" != application/json* ]]; then
  echo "FAIL: expected application/json, received ${content_type:-unknown}" >&2
  fail=1
fi
for field in '"status":"ok"' '"database":"ok"' '"cache":"ok"'; do
  if ! grep -Fq "$field" <<<"$body"; then
    echo "FAIL: health response is missing $field" >&2
    fail=1
  fi
done
if grep -qi '<!doctype html' <<<"$body" || grep -qi 'Google Tag Manager' <<<"$body"; then
  echo "FAIL: legacy HTML shell detected; document root is not the Laravel SSR public directory" >&2
  fail=1
fi

if (( fail )); then
  exit 1
fi

echo "PASS: Laravel SSR production health verified at $HEALTH_URL"
