#!/usr/bin/env bash
set -Eeuo pipefail

# Plesk Git deployment hook for the Laravel SSR application.
# Configure SSR_APP_DIR and SSR_HEALTH_URL in the server environment.
SSR_APP_DIR="${SSR_APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../ssr" && pwd)}"
SSR_HEALTH_URL="${SSR_HEALTH_URL:-}"

cd "$SSR_APP_DIR"

if [[ ! -f artisan || ! -f composer.lock ]]; then
  echo "SSR deployment aborted: artisan or composer.lock is missing in $SSR_APP_DIR" >&2
  exit 1
fi

composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

if [[ -n "$SSR_HEALTH_URL" ]]; then
  health_payload="$(curl --fail --silent --show-error --max-time 15 "$SSR_HEALTH_URL")"
  if ! grep -q '"status":"ok"' <<<"$health_payload"; then
    echo "SSR deployment health check failed: $health_payload" >&2
    exit 1
  fi
  echo "SSR deployment healthy: $health_payload"
else
  echo "SSR deployment completed; SSR_HEALTH_URL was not configured, so no HTTP health check ran."
fi
