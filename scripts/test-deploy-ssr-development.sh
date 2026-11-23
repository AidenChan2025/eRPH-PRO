#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
tmp_dir="$(mktemp -d)"
real_php_bin="$(command -v php)"
trap 'rm -rf "$tmp_dir"' EXIT

make_sandbox() {
  SANDBOX="$tmp_dir/$1"
  APP_DIR="$SANDBOX/ssr"
  DOCROOT="$APP_DIR/public"
  TRACE_FILE="$SANDBOX/trace"
  mkdir -p "$DOCROOT" "$APP_DIR/bin" "$APP_DIR/bootstrap/cache"
  touch "$APP_DIR/artisan" "$APP_DIR/composer.lock"
  : > "$TRACE_FILE"
  cat > "$SANDBOX/php" <<'PHP'
#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "${1:-}" == "-r" ]]; then
  case "$2" in
    *PHP_VERSION_ID*) printf '%s' "${FAKE_PHP_VERSION_ID:-80300}" ;;
    *) printf 'unexpected php probe\n' >&2; exit 99 ;;
  esac
  exit 0
fi
if [[ "${1:-}" == */composer ]]; then
  printf 'composer %s\n' "${*:2}" >> "$TRACE_FILE"
  [[ "${COMPOSER_FAIL:-0}" == 1 ]] && exit 23
  exit 0
fi
if [[ "${1:-}" == "artisan" ]]; then
  printf 'artisan %s\n' "${*:2}" >> "$TRACE_FILE"
  [[ "${ARTISAN_FAIL:-0}" == 1 ]] && exit 24
  exit 0
fi
printf 'unexpected invocation: %s\n' "$*" >&2
exit 99
PHP
  chmod +x "$SANDBOX/php"
  cat > "$APP_DIR/bin/composer" <<'COMPOSER'
#!/usr/bin/env bash
exit 0
COMPOSER
  chmod +x "$APP_DIR/bin/composer"
}

run_hook() {
  SSR_GIT_DIR="$SANDBOX" \
  SSR_APP_DIR="$APP_DIR" \
  SSR_DOCUMENT_ROOT="$DOCROOT" \
  SSR_PHP_BIN="$SANDBOX/php" \
  SSR_COMPOSER_BIN="${COMPOSER_OVERRIDE:-$APP_DIR/bin/composer}" \
  TRACE_FILE="$TRACE_FILE" \
  FAKE_PHP_VERSION_ID="${FAKE_PHP_VERSION_ID:-80300}" \
  COMPOSER_FAIL="${COMPOSER_FAIL:-0}" \
  ARTISAN_FAIL="${ARTISAN_FAIL:-0}" \
  bash "$repo_root/scripts/deploy-ssr-development.sh"
}

make_sandbox success
run_hook >"$SANDBOX/out"
grep -q 'composer install' "$TRACE_FILE"
grep -q 'artisan config:cache' "$TRACE_FILE"
grep -q 'artisan route:cache' "$TRACE_FILE"
grep -q 'artisan view:cache' "$TRACE_FILE"

make_sandbox old_php
if FAKE_PHP_VERSION_ID=80134 run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected unsupported PHP to stop direct deployment.' >&2
  exit 1
fi
[[ ! -s "$TRACE_FILE" ]]

make_sandbox missing_composer
if COMPOSER_OVERRIDE="$SANDBOX/missing-composer" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected missing Composer to stop direct deployment.' >&2
  exit 1
fi
grep -q 'SSR_COMPOSER_BIN' "$SANDBOX/out"

make_sandbox composer_failure
if COMPOSER_FAIL=1 run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected Composer failure to stop direct deployment.' >&2
  exit 1
fi

make_sandbox artisan_failure
if ARTISAN_FAIL=1 run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected cache failure to stop direct deployment.' >&2
  exit 1
fi

make_sandbox missing_checkout
rm "$APP_DIR/artisan"
if run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected incomplete checkout to stop direct deployment.' >&2
  exit 1
fi

make_sandbox invalid_health_url
if SSR_HEALTH_URL='http://erphpro.com/health' run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected non-HTTPS health URL to stop direct deployment.' >&2
  exit 1
fi
grep -q 'SSR_HEALTH_URL must use HTTPS' "$SANDBOX/out"

echo 'Direct-development deployment hook self-check passed.'
