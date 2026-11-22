#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-https://erphpro.com}"
HEALTH_URL="${BASE_URL%/}/health"
tmp_body="$(mktemp)"
homepage_body="$(mktemp)"
trap 'rm -f "$tmp_body" "$homepage_body"' EXIT

headers="$(curl --silent --show-error --location --max-time 20 --dump-header - --output "$tmp_body" "$HEALTH_URL")"
status="$(awk 'toupper($1) ~ /^HTTP\// { code=$2; sub(/\r$/, "", code) } END { print code }' <<<"$headers")"
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
if ! command -v php >/dev/null 2>&1; then
  echo "FAIL: PHP CLI is required to validate the health JSON schema" >&2
  fail=1
else
  json_errors="$(printf '%s' "$body" | php -r '
    $health = json_decode(stream_get_contents(STDIN), true);
    if (!is_array($health) || array_is_list($health)) { fwrite(STDERR, "health JSON must be an object\n"); exit(1); }
    foreach (["status", "database", "cache", "release"] as $key) {
        if (!array_key_exists($key, $health) || !is_string($health[$key])) {
            fwrite(STDERR, "missing string field: {$key}\n"); exit(1);
        }
    }
    foreach (["status", "database", "cache"] as $key) {
        if ($health[$key] !== "ok") { fwrite(STDERR, "{$key} is not ok\n"); exit(1); }
    }
    if (preg_match("/^[0-9a-f]{40}$/", $health["release"]) !== 1) {
        fwrite(STDERR, "release is not a 40-character Git SHA\n"); exit(1);
    }
  ' 2>&1)" || {
    echo "FAIL: health JSON schema/value check failed: $json_errors" >&2
    fail=1
  }
fi
if grep -qi '<!doctype html' <<<"$body" || grep -qi 'Google Tag Manager' <<<"$body"; then
  echo "FAIL: legacy HTML shell detected; document root is not the Laravel SSR public directory" >&2
  fail=1
fi

homepage_headers="$(curl --silent --show-error --location --max-time 20 --dump-header - --output "$homepage_body" "${BASE_URL%/}/")"
homepage_status="$(awk 'toupper($1) ~ /^HTTP\// { code=$2; sub(/\r$/, "", code) } END { print code }' <<<"$homepage_headers")"
homepage_type="$(awk -F': ' 'tolower($1)=="content-type" { value=$2 } END { sub(/\r$/, "", value); print tolower(value) }' <<<"$homepage_headers")"
if [[ "$homepage_status" != "200" || "$homepage_type" != text/html* ]]; then
  echo "FAIL: homepage expected HTTP 200 text/html, received HTTP ${homepage_status:-unknown} ${homepage_type:-unknown}" >&2
  fail=1
fi
homepage_body_text="$(cat "$homepage_body")"
if grep -qi '<!doctype html' <<<"$homepage_body_text" || grep -qi 'Google Tag Manager' <<<"$homepage_body_text"; then
  echo "FAIL: legacy HTML shell detected in homepage response; document root is not the Laravel SSR public directory" >&2
  fail=1
fi

if (( fail )); then
  exit 1
fi

echo "PASS: Laravel SSR production health verified at $HEALTH_URL"
