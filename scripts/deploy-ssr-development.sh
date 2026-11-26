#!/usr/bin/env bash
set -Eeuo pipefail

# Direct-development hook for the single Plesk checkout. This is intentionally
# not an atomic production release mechanism; Plesk updates the live checkout
# before this hook runs. Use deploy-ssr.sh for the isolated release contract.
GIT_SOURCE_DIR="${SSR_GIT_DIR:-$PWD}"
SSR_APP_DIR="${SSR_APP_DIR:-$GIT_SOURCE_DIR/ssr}"
SSR_DOCUMENT_ROOT="${SSR_DOCUMENT_ROOT:-$SSR_APP_DIR/public}"
SSR_PHP_BIN="${SSR_PHP_BIN:-/opt/plesk/php/8.3/bin/php}"
SSR_HEALTH_URL="${SSR_HEALTH_URL:-}"

if [[ ! -d "$GIT_SOURCE_DIR" || ! -d "$SSR_APP_DIR" || ! -f "$SSR_APP_DIR/artisan" || ! -f "$SSR_APP_DIR/composer.lock" ]]; then
  echo "SSR development deployment aborted: the Laravel checkout is incomplete." >&2
  exit 1
fi
if [[ ! -d "$SSR_DOCUMENT_ROOT" ]]; then
  echo "SSR development deployment aborted: SSR_DOCUMENT_ROOT does not exist." >&2
  exit 1
fi
if [[ ! -x "$SSR_PHP_BIN" ]]; then
  echo "SSR development deployment aborted: SSR_PHP_BIN is not executable." >&2
  exit 1
fi
if [[ -n "$SSR_HEALTH_URL" && "$SSR_HEALTH_URL" != https://* ]]; then
  echo "SSR development deployment aborted: SSR_HEALTH_URL must use HTTPS." >&2
  exit 1
fi

if [[ -n "${SSR_COMPOSER_BIN:-}" ]]; then
  COMPOSER_BIN="$SSR_COMPOSER_BIN"
elif [[ -x "$SSR_APP_DIR/bin/composer" ]]; then
  COMPOSER_BIN="$SSR_APP_DIR/bin/composer"
else
  COMPOSER_BIN="$(command -v composer || true)"
fi
if [[ -z "$COMPOSER_BIN" || ! -x "$COMPOSER_BIN" ]]; then
  echo "SSR development deployment aborted: set SSR_COMPOSER_BIN to an executable Composer path." >&2
  exit 1
fi

php_version_id="$($SSR_PHP_BIN -r 'echo PHP_VERSION_ID;')"
if [[ ! "$php_version_id" =~ ^[0-9]+$ ]] || (( php_version_id < 80300 )); then
  echo "SSR development deployment aborted: PHP 8.3 or newer is required." >&2
  exit 1
fi

cd "$SSR_APP_DIR"
"$SSR_PHP_BIN" "$COMPOSER_BIN" install --no-dev --prefer-dist --no-interaction --optimize-autoloader
"$SSR_PHP_BIN" artisan config:cache
"$SSR_PHP_BIN" artisan route:cache
"$SSR_PHP_BIN" artisan view:cache
"$SSR_PHP_BIN" artisan event:cache
if [[ -n "$SSR_HEALTH_URL" ]]; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "SSR development deployment aborted: curl is required for SSR_HEALTH_URL verification." >&2
    exit 1
  fi
  if ! health_payload="$(curl --fail --silent --show-error --max-time 15 "$SSR_HEALTH_URL")"; then
    echo "SSR development deployment aborted: health endpoint request failed." >&2
    exit 1
  fi
  if ! "$SSR_PHP_BIN" -r '
    $health = json_decode($argv[1] ?? "", true);
    if (!is_array($health) || ($health["status"] ?? null) !== "ok" || ($health["database"] ?? null) !== "ok" || ($health["cache"] ?? null) !== "ok") {
        fwrite(STDERR, "Health response is not healthy.\n");
        exit(1);
    }
  ' -- "$health_payload"; then
    echo "SSR development deployment aborted: health check failed." >&2
    exit 1
  fi
fi
echo "SSR direct-development deployment completed with PHP $php_version_id."
