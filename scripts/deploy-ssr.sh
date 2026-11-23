#!/usr/bin/env bash
set -Eeuo pipefail

# Build an immutable release away from the live document root, then switch the
# preconfigured `current` symlink only after all local checks pass.
HOOK_WORKING_DIR="$PWD"
GIT_SOURCE_DIR="${SSR_GIT_DIR:-$HOOK_WORKING_DIR}"
SSR_REPOSITORY_DIR="${SSR_REPOSITORY_DIR:-}"
SSR_APP_DIR="${SSR_APP_DIR:-$GIT_SOURCE_DIR/ssr}"
SSR_RELEASES_DIR="${SSR_RELEASES_DIR:-}"
SSR_CURRENT_LINK="${SSR_CURRENT_LINK:-}"
SSR_SHARED_DIR="${SSR_SHARED_DIR:-}"
SSR_HEALTH_URL="${SSR_HEALTH_URL:-}"
SSR_DOCUMENT_ROOT="${SSR_DOCUMENT_ROOT:-}"

for required in SSR_RELEASES_DIR SSR_CURRENT_LINK SSR_SHARED_DIR SSR_HEALTH_URL SSR_DOCUMENT_ROOT; do
  if [[ -z "${!required}" ]]; then
    echo "SSR deployment aborted: $required must be configured for an atomic release." >&2
    exit 1
  fi
done

if [[ "$SSR_HEALTH_URL" != https://* ]]; then
  echo "SSR deployment aborted: SSR_HEALTH_URL must use HTTPS." >&2
  exit 1
fi

for path_name in SSR_RELEASES_DIR SSR_CURRENT_LINK SSR_SHARED_DIR SSR_DOCUMENT_ROOT; do
  if [[ "${!path_name}" != /* ]]; then
    echo "SSR deployment aborted: $path_name must be an absolute path." >&2
    exit 1
  fi
done

if [[ ! -d "$GIT_SOURCE_DIR" || ! -d "$SSR_APP_DIR" ]]; then
  echo "SSR deployment aborted: deployed source or Laravel source directory is missing." >&2
  exit 1
fi
GIT_SOURCE_DIR="$(cd "$GIT_SOURCE_DIR" && pwd -P)"
SSR_APP_DIR="$(cd "$SSR_APP_DIR" && pwd -P)"
if [[ -n "$SSR_REPOSITORY_DIR" ]]; then
  if [[ ! -d "$SSR_REPOSITORY_DIR" ]]; then
    echo "SSR deployment aborted: SSR_REPOSITORY_DIR does not exist." >&2
    exit 1
  fi
  SSR_REPOSITORY_DIR="$(cd "$SSR_REPOSITORY_DIR" && pwd -P)"
fi
if [[ ! -d "$SSR_DOCUMENT_ROOT" ]]; then
  echo "SSR deployment aborted: SSR_DOCUMENT_ROOT must resolve to the active document-root directory." >&2
  exit 1
fi
SSR_DOCUMENT_ROOT="$(cd "$SSR_DOCUMENT_ROOT" && pwd -P)"
paths_overlap() {
  local left="${1%/}" right="${2%/}"
  [[ "$left" == "$right" || "$left" == "$right/"* || "$right" == "$left/"* ]]
}
path_within() {
  local child="${1%/}" parent="${2%/}"
  [[ "$child" == "$parent" || "$child" == "$parent/"* ]]
}
for source_path in "$SSR_APP_DIR" "$GIT_SOURCE_DIR"; do
  if [[ -d "$source_path/public" ]]; then
    source_public="$(cd "$source_path/public" && pwd -P)"
    if paths_overlap "$source_public" "$SSR_DOCUMENT_ROOT"; then
      echo "SSR deployment aborted: Git source public directory and active document root overlap ($source_public)." >&2
      exit 1
    fi
  fi
  if paths_overlap "$source_path" "$SSR_DOCUMENT_ROOT"; then
    echo "SSR deployment aborted: Git source checkout and active document root overlap; Plesk pull may write live files before this hook." >&2
    exit 1
  fi
done
if [[ ! -f "$SSR_APP_DIR/artisan" || ! -f "$SSR_APP_DIR/composer.lock" ]]; then
  echo "SSR deployment aborted: Laravel source is missing in $SSR_APP_DIR" >&2
  exit 1
fi
if [[ ! -d "$SSR_RELEASES_DIR" || ! -d "$SSR_SHARED_DIR" ]]; then
  echo "SSR deployment aborted: releases and shared directories must be prepared before deployment." >&2
  exit 1
fi
if [[ ! -f "$SSR_SHARED_DIR/.env" || ! -d "$SSR_SHARED_DIR/storage" ]]; then
  echo "SSR deployment aborted: shared .env and storage must exist before deployment." >&2
  exit 1
fi
if [[ ! -L "$SSR_CURRENT_LINK" || ! -d "$SSR_CURRENT_LINK" ]]; then
  echo "SSR deployment aborted: current must be a symlink to an existing, working release." >&2
  exit 1
fi
if [[ ! -d "$(dirname "$SSR_CURRENT_LINK")" ]]; then
  echo "SSR deployment aborted: current symlink parent directory does not exist." >&2
  exit 1
fi

if [[ -n "${SSR_PHP_BIN:-}" ]]; then
  PHP_BIN="$SSR_PHP_BIN"
elif [[ -x /opt/plesk/php/8.3/bin/php ]]; then
  PHP_BIN=/opt/plesk/php/8.3/bin/php
else
  PHP_BIN="$(command -v php || true)"
fi
if [[ -z "$PHP_BIN" || ! -x "$PHP_BIN" ]]; then
  echo "SSR deployment aborted: a PHP 8.3+ CLI binary was not found." >&2
  exit 1
fi

if [[ -n "${SSR_COMPOSER_BIN:-}" ]]; then
  COMPOSER_BIN="$SSR_COMPOSER_BIN"
elif [[ -f "$SSR_APP_DIR/bin/composer" ]]; then
  COMPOSER_BIN="$SSR_APP_DIR/bin/composer"
else
  COMPOSER_BIN="$(command -v composer || true)"
fi
if [[ -z "$COMPOSER_BIN" || ! -x "$COMPOSER_BIN" ]]; then
  echo "SSR deployment aborted: Composer executable was not found or is not executable; set SSR_COMPOSER_BIN to its absolute path for the non-interactive Plesk hook." >&2
  exit 1
fi

php_version_id="$("$PHP_BIN" -r 'echo PHP_VERSION_ID;')"
if [[ ! "$php_version_id" =~ ^[0-9]+$ ]] || (( php_version_id < 80300 )); then
  echo "SSR deployment aborted: PHP 8.3 or newer is required (CLI reports ${php_version_id:-unknown})." >&2
  exit 1
fi
php_modules="$("$PHP_BIN" -m)"
for extension in ctype fileinfo mbstring openssl pdo pdo_mysql tokenizer xml; do
  if ! grep -Fxqi "$extension" <<<"$php_modules"; then
    echo "SSR deployment aborted: PHP extension $extension is missing." >&2
    exit 1
  fi
done

if [[ -n "$SSR_REPOSITORY_DIR" ]]; then
  release_version="$(git --git-dir="$SSR_REPOSITORY_DIR" rev-parse --verify 'refs/heads/main^{commit}' 2>/dev/null || git --git-dir="$SSR_REPOSITORY_DIR" rev-parse --verify 'HEAD^{commit}' 2>/dev/null || true)"
else
  release_version="$(git -C "$GIT_SOURCE_DIR" rev-parse --verify 'HEAD^{commit}' 2>/dev/null || true)"
fi
if [[ ! "$release_version" =~ ^[0-9a-f]{40}$ ]]; then
  echo "SSR deployment aborted: unable to resolve a 40-character commit SHA from the configured Git source." >&2
  exit 1
fi
if [[ -z "$SSR_REPOSITORY_DIR" && ! -d "$GIT_SOURCE_DIR/.git" && ! -f "$GIT_SOURCE_DIR/.git" ]]; then
  echo "SSR deployment aborted: $GIT_SOURCE_DIR is not a Git checkout." >&2
  exit 1
fi
if [[ -n "$SSR_REPOSITORY_DIR" && ! -f "$SSR_REPOSITORY_DIR/HEAD" ]]; then
  echo "SSR deployment aborted: SSR_REPOSITORY_DIR is not a Git repository." >&2
  exit 1
fi

release_dir="$SSR_RELEASES_DIR/$release_version"
lock_dir="$SSR_RELEASES_DIR/.deploy.lock"
if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "SSR deployment aborted: another deployment holds $lock_dir (inspect stale locks manually)." >&2
  exit 1
fi

build_dir=""
previous_target=""
switched=0
healthy=0
reuse_release=0

replace_current_link() {
  local target="$1"
  local temporary_link="${SSR_CURRENT_LINK}.next.$$"
  rm -f -- "$temporary_link"
  ln -s "$target" "$temporary_link"
  if ! "$PHP_BIN" -r 'if (! rename($argv[1], $argv[2])) { fwrite(STDERR, "Atomic symlink replacement failed.\\n"); exit(1); }' "$temporary_link" "$SSR_CURRENT_LINK"; then
    rm -f -- "$temporary_link"
    return 1
  fi
}

check_health_payload() {
  local payload="$1"
  if ! "$PHP_BIN" -r '
    $payload = $argv[1] ?? "";
    $expectedRelease = $argv[2] ?? "";
    try {
        $health = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable $exception) {
        fwrite(STDERR, "Health response is not valid JSON.\n");
        exit(1);
    }
    foreach (["status", "database", "cache", "release"] as $key) {
        if (!array_key_exists($key, $health) || !is_string($health[$key])) {
            fwrite(STDERR, "Health response is missing a string field: {$key}.\n");
            exit(1);
        }
    }
    if ($health["status"] !== "ok" || $health["database"] !== "ok" || $health["cache"] !== "ok" || $health["release"] !== $expectedRelease) {
        fwrite(STDERR, "Health response fields do not match the expected release.\n");
        exit(1);
    }
  ' -- "$payload" "$release_version"; then
    echo "SSR deployment health check failed: expected strict JSON status/database/cache/release for $release_version." >&2
    return 1
  fi
}

finish_deployment() {
  local result=$?
  trap - EXIT
  if (( switched == 1 && healthy == 0 )); then
    if replace_current_link "$previous_target"; then
      echo "SSR deployment failed; restored previous release $previous_target." >&2
    else
      echo "CRITICAL: deployment failed and previous release could not be restored; current may still target $release_dir." >&2
      result=1
    fi
  fi
  if [[ -n "$build_dir" && -d "$build_dir" && "$build_dir" == "$SSR_RELEASES_DIR/.build-${release_version}."* ]]; then
    rm -rf -- "$build_dir"
  fi
  rmdir "$lock_dir" 2>/dev/null || true
  exit "$result"
}
trap finish_deployment EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

previous_target="$(readlink "$SSR_CURRENT_LINK")"
current_target="$(cd -P "$SSR_CURRENT_LINK" && pwd -P)"
releases_root="$(cd -P "$SSR_RELEASES_DIR" && pwd -P)"
if ! path_within "$current_target" "$releases_root"; then
  echo "SSR deployment aborted: current must resolve inside SSR_RELEASES_DIR for safe rollback." >&2
  exit 1
fi

if ! "$PHP_BIN" -r 'exit(stat($argv[1])["dev"] === stat($argv[2])["dev"] ? 0 : 1);' "$SSR_RELEASES_DIR" "$(dirname "$SSR_CURRENT_LINK")"; then
  echo "SSR deployment aborted: releases and current must share a filesystem for atomic symlink replacement." >&2
  exit 1
fi

if ! command -v tar >/dev/null 2>&1; then
  echo "SSR deployment aborted: tar is required to extract the exact Git release." >&2
  exit 1
fi

if [[ -e "$release_dir" || -L "$release_dir" ]]; then
  if [[ ! -d "$release_dir" || ! -f "$release_dir/.deploy-release-sha" \
    || "$(<"$release_dir/.deploy-release-sha")" != "$release_version" \
    || ! -f "$release_dir/vendor/autoload.php" \
    || ! -f "$release_dir/bootstrap/cache/config.php" \
    || ! -L "$release_dir/.env" \
    || "$(readlink "$release_dir/.env")" != "$SSR_SHARED_DIR/.env" \
    || ! -L "$release_dir/storage" \
    || "$(readlink "$release_dir/storage")" != "$SSR_SHARED_DIR/storage" ]]; then
    echo "SSR deployment aborted: existing release $release_dir is incomplete or does not match its SHA marker." >&2
    exit 1
  fi
  if [[ "$(cd -P "$SSR_CURRENT_LINK" && pwd -P)" == "$(cd -P "$release_dir" && pwd -P)" ]]; then
    health_payload="$(curl --fail --silent --show-error --max-time 15 "$SSR_HEALTH_URL")"
    check_health_payload "$health_payload"
    healthy=1
    echo "SSR release already active and healthy: $health_payload"
    exit 0
  fi
  reuse_release=1
  cd "$release_dir"
else
  build_dir="$(mktemp -d "$SSR_RELEASES_DIR/.build-${release_version}.XXXXXX")"
  mkdir -p "$SSR_SHARED_DIR/storage/framework/cache/data" \
    "$SSR_SHARED_DIR/storage/framework/sessions" \
    "$SSR_SHARED_DIR/storage/framework/views" \
    "$SSR_SHARED_DIR/storage/logs" \
    "$SSR_SHARED_DIR/storage/app/public"

  if [[ -n "$SSR_REPOSITORY_DIR" ]]; then
    git --git-dir="$SSR_REPOSITORY_DIR" archive --format=tar "$release_version" ssr \
      | tar -xf - --strip-components=1 -C "$build_dir"
  else
    git -C "$GIT_SOURCE_DIR" archive --format=tar "$release_version" ssr \
      | tar -xf - --strip-components=1 -C "$build_dir"
  fi
  if [[ ! -f "$build_dir/artisan" || ! -f "$build_dir/composer.lock" ]]; then
    echo "SSR deployment aborted: the selected Git commit does not contain the Laravel SSR application." >&2
    exit 1
  fi

  rm -rf -- "$build_dir/storage"
  ln -s "$SSR_SHARED_DIR/.env" "$build_dir/.env"
  ln -s "$SSR_SHARED_DIR/storage" "$build_dir/storage"
  mkdir -p "$build_dir/bootstrap/cache"

  cd "$build_dir"
  "$PHP_BIN" "$COMPOSER_BIN" install --no-dev --prefer-dist --no-interaction --optimize-autoloader
fi

"$PHP_BIN" "$COMPOSER_BIN" check-platform-reqs --no-dev
if ! "$PHP_BIN" artisan migrate:status --pending=1 --no-ansi; then
  echo "SSR deployment aborted: pending or uninspectable migrations require a separately approved migration operation with a verified recovery point." >&2
  exit 1
fi

if (( reuse_release == 0 )); then
  RELEASE_VERSION="$release_version" "$PHP_BIN" artisan config:cache
  "$PHP_BIN" artisan route:cache
  "$PHP_BIN" artisan view:cache
  printf '%s\n' "$release_version" > "$build_dir/.deploy-release-sha"
  # mktemp creates the build root as 0700; the web server must be able to
  # traverse the immutable release while secrets remain in shared/.env.
  chmod 755 "$build_dir"
  mv "$build_dir" "$release_dir"
  build_dir=""
fi
replace_current_link "$release_dir"
switched=1

health_payload="$(curl --fail --silent --show-error --max-time 15 "$SSR_HEALTH_URL")"
check_health_payload "$health_payload"

healthy=1
echo "SSR deployment healthy: $health_payload"
