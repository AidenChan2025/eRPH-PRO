#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
tmp_dir="$(mktemp -d)"
real_php_bin="$(command -v php)"
real_readlink_bin="$(command -v readlink)"
trap 'rm -rf "$tmp_dir"' EXIT

mkdir -p "$tmp_dir/bin"
touch "$tmp_dir/bin/composer"
cat > "$tmp_dir/bin/php" <<'PHP'
#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "${1:-}" == "-r" ]]; then
  case "$2" in
    *'PHP_VERSION_ID'*) printf '%s' "${FAKE_PHP_VERSION_ID:-80300}" ;;
    *'stat($argv[1])'*) exec "$REAL_PHP_BIN" "$@" ;;
    *'rename($argv[1], $argv[2])'*) exec "$REAL_PHP_BIN" "$@" ;;
    *'json_decode($payload'*) exec "$REAL_PHP_BIN" "$@" ;;
    *'json_decode(file_get_contents'*) exec "$REAL_PHP_BIN" "$@" ;;
    *) printf 'Unexpected PHP probe: %s\n' "$2" >&2; exit 99 ;;
  esac
  exit 0
fi
if [[ "${1:-}" == "-m" ]]; then
  tr ' ' '\n' <<<"${FAKE_PHP_MODULES:-ctype fileinfo mbstring openssl PDO pdo_mysql tokenizer xml}"
  exit 0
fi
if [[ "${1:-}" == */composer ]]; then
  printf 'composer %s\n' "${*:2}" >> "$TRACE_FILE"
  if [[ "${2:-}" == "install" ]]; then
    mkdir -p vendor
    touch vendor/autoload.php
  fi
  exit "${COMPOSER_FAIL:-0}"
fi
if [[ "${1:-}" == "artisan" && "${2:-}" == "migrate:status" ]]; then
  printf 'migrate:status\n' >> "$TRACE_FILE"
  exit "${MIGRATION_PENDING:-0}"
fi
if [[ "${1:-}" == "artisan" ]]; then
  printf 'artisan %s\n' "${*:2}" >> "$TRACE_FILE"
  if [[ "${ARTISAN_FAIL:-}" == "${2:-}" ]]; then
    exit 23
  fi
  if [[ "${2:-}" == "config:cache" ]]; then
    mkdir -p bootstrap/cache
    printf '%s\n' "$PWD" > bootstrap/cache/config.php
  fi
  exit 0
fi
printf 'Unexpected PHP invocation: %s\n' "$*" >&2
exit 99
PHP

cat > "$tmp_dir/bin/curl" <<'CURL'
#!/usr/bin/env bash
set -Eeuo pipefail
printf 'curl %s\n' "$*" >> "$TRACE_FILE"
if [[ "${CURL_FAIL:-0}" == 1 ]]; then exit 22; fi
if [[ "${PARITY_HTTP_INTEGRATION:-0}" == 1 && "$*" == *"--write-out"* ]]; then
  output_file=""
  request_url=""
  previous=""
  for arg in "$@"; do
    if [[ "$previous" == "--output" ]]; then output_file="$arg"; fi
    previous="$arg"
    if [[ "$arg" == https://* ]]; then request_url="$arg"; fi
  done
  host="${request_url#https://}"
  host="${host%%/*}"
  active_sha="$(basename "$(readlink "$TEST_CURRENT_LINK")")"
  response_sha="$active_sha"
  response_status=200
  if [[ "$active_sha" == "$PARITY_NEW_SHA" && "$host" == "support.erphpro.com" ]]; then
    response_status=500
  fi
  runtime_hash="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  printf '{"status":"ok","database":"ok","cache":"ok","release":"%s","runtime_file_sha256":"%s"}' "$response_sha" "$runtime_hash" > "$output_file"
  if [[ "$response_status" != 200 ]]; then
    printf '%s\t%s\t' "$response_status" "$request_url"
    exit 0
  fi
  printf '200\t%s\t' "$request_url"
  exit 0
fi
if [[ -n "${CURL_SEQUENCE_FILE:-}" ]]; then
  sequence_index_file="${CURL_SEQUENCE_INDEX_FILE:-$CURL_SEQUENCE_FILE.index}"
  if [[ -f "$sequence_index_file" ]]; then
    sequence_index="$(sed -n '1p' "$sequence_index_file")"
  else
    sequence_index=1
  fi
  response="$(sed -n "${sequence_index}p" "$CURL_SEQUENCE_FILE")"
  printf '%s' "$((sequence_index + 1))" > "$sequence_index_file"
  printf '%s' "$response"
  exit 0
fi
printf '%s' "${FAKE_HEALTH_RESPONSE:-}"
CURL

cat > "$tmp_dir/bin/readlink" <<'READLINK'
#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "${FAIL_READLINK:-0}" == 1 ]]; then exit 1; fi
exec "$REAL_READLINK_BIN" "$@"
READLINK

chmod +x "$tmp_dir/bin/composer" "$tmp_dir/bin/php" "$tmp_dir/bin/curl" "$tmp_dir/bin/readlink"

cat > "$tmp_dir/bin/parity-success" <<'PARITY'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "$PARITY_TRACE"
exit 0
PARITY
cat > "$tmp_dir/bin/parity-fail" <<'PARITY'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "$PARITY_TRACE"
exit 1
PARITY
cat > "$tmp_dir/bin/parity-flaky" <<'PARITY'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "$PARITY_TRACE"
count="$(wc -l < "$PARITY_TRACE" | tr -d ' ')"
if [[ "$count" == 1 ]]; then exit 1; fi
exit 0
PARITY
chmod +x "$tmp_dir/bin/parity-success" "$tmp_dir/bin/parity-fail" "$tmp_dir/bin/parity-flaky"

new_sandbox() {
  local name="$1"
  SANDBOX="$tmp_dir/$name"
  RELEASES="$SANDBOX/releases"
  SHARED="$SANDBOX/shared"
  CURRENT="$SANDBOX/current"
  OLD_SHA=1111111111111111111111111111111111111111
  OLD_RELEASE="$RELEASES/$OLD_SHA"
  mkdir -p "$RELEASES" "$SHARED/storage" "$OLD_RELEASE/public" "$SANDBOX/bin"
  printf 'APP_KEY=test-only\n' > "$SHARED/.env"
  ln -s "$OLD_RELEASE" "$CURRENT"
  TRACE="$SANDBOX/trace"
  : > "$TRACE"
  PARITY_TRACE="$SANDBOX/parity-trace"
  : > "$PARITY_TRACE"
}

run_hook() {
  env PATH="$tmp_dir/bin:$PATH" \
    REAL_PHP_BIN="$real_php_bin" \
    REAL_READLINK_BIN="$real_readlink_bin" \
    SSR_GIT_DIR="$repo_root" \
    SSR_APP_DIR="$repo_root/ssr" \
    SSR_RELEASES_DIR="${OVERRIDE_RELEASES_DIR-$RELEASES}" \
    SSR_CURRENT_LINK="${OVERRIDE_CURRENT_LINK-$CURRENT}" \
    SSR_SHARED_DIR="${OVERRIDE_SHARED_DIR-$SHARED}" \
    SSR_DOCUMENT_ROOT="${DOCUMENT_ROOT:-$CURRENT/public}" \
    SSR_HEALTH_URL="${HEALTH_URL:-https://example.test/health}" \
    SSR_BRANCH="${DEPLOY_BRANCH:-}" \
    SSR_EXPECTED_SHA="${EXPECTED_SHA:-}" \
    SSR_PARITY_REQUIRED="${PARITY_REQUIRED:-0}" \
    SSR_PARITY_URLS="${PARITY_URLS:-}" \
    SSR_PARITY_SCRIPT="${PARITY_SCRIPT_OVERRIDE:-$repo_root/scripts/verify-ssr-host-parity.sh}" \
    SSR_PHP_BIN="$tmp_dir/bin/php" \
    SSR_COMPOSER_BIN="${COMPOSER_BIN_OVERRIDE:-$tmp_dir/bin/composer}" \
    TRACE_FILE="$TRACE" \
    FAKE_HEALTH_RESPONSE="${FAKE_HEALTH_RESPONSE:-}" \
    FAKE_PHP_MODULES="${FAKE_PHP_MODULES:-ctype fileinfo mbstring openssl PDO pdo_mysql tokenizer xml}" \
    FAKE_PHP_VERSION_ID="${FAKE_PHP_VERSION_ID:-80300}" \
    MIGRATION_PENDING="${MIGRATION_PENDING:-0}" \
    COMPOSER_FAIL="${COMPOSER_FAIL:-0}" \
    CURL_FAIL="${CURL_FAIL:-0}" \
    FAIL_READLINK="${FAIL_READLINK:-0}" \
    ARTISAN_FAIL="${ARTISAN_FAIL:-}" \
    CURL_SEQUENCE_FILE="${CURL_SEQUENCE_FILE:-}" \
    CURL_SEQUENCE_INDEX_FILE="${CURL_SEQUENCE_INDEX_FILE:-$SANDBOX/curl-sequence.index}" \
    PARITY_TRACE="$PARITY_TRACE" \
    TEST_CURRENT_LINK="$CURRENT" \
    PARITY_HTTP_INTEGRATION="${PARITY_HTTP_INTEGRATION:-0}" \
    PARITY_NEW_SHA="${PARITY_NEW_SHA:-}" \
    bash "$repo_root/scripts/deploy-ssr.sh"
}

expected_sha="$(git -C "$repo_root" rev-parse HEAD)"

new_sandbox old_php
if FAKE_PHP_VERSION_ID=80134 run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected an unsupported PHP CLI version to stop deployment.' >&2
  exit 1
fi
if [[ -s "$TRACE" || "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'Unsupported PHP reached build commands or changed the live release.' >&2
  exit 1
fi

new_sandbox insecure_health_url
if HEALTH_URL=http://example.test/health run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected an HTTP health URL to stop deployment.' >&2
  exit 1
fi
if [[ -s "$TRACE" || "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'An HTTP health URL reached build commands or changed the live release.' >&2
  exit 1
fi

new_sandbox missing_branch
if DEPLOY_BRANCH=does-not-exist run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected a missing SSR_BRANCH to fail closed.' >&2
  exit 1
fi
if ! grep -q 'refusing to fall back to HEAD' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'Missing SSR_BRANCH did not produce the fail-closed diagnostic.' >&2
  exit 1
fi
if [[ -s "$TRACE" || "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'Missing SSR_BRANCH reached build commands or changed the live release.' >&2
  exit 1
fi

new_sandbox wrong_expected_sha
if EXPECTED_SHA=0000000000000000000000000000000000000000 run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected SSR_EXPECTED_SHA mismatch to stop deployment.' >&2
  exit 1
fi
if ! grep -q 'does not match SSR_EXPECTED_SHA' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'SSR_EXPECTED_SHA mismatch did not produce the expected diagnostic.' >&2
  exit 1
fi

new_sandbox required_parity_missing
if PARITY_REQUIRED=1 FAKE_HEALTH_RESPONSE="{\"status\":\"ok\",\"database\":\"ok\",\"cache\":\"ok\",\"release\":\"$expected_sha\"}" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected required production parity without URLs to stop deployment.' >&2
  exit 1
fi
if ! grep -q 'SSR_PARITY_URLS is required' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'Missing required parity configuration did not produce the expected diagnostic.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" || -e "$RELEASES/.deploy.lock" ]]; then
  echo 'Missing required parity configuration changed the live release.' >&2
  exit 1
fi

new_sandbox missing_support_host
if PARITY_REQUIRED=1 PARITY_URLS='https://erphpro.com https://other.example.test' run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected missing support host parity configuration to stop deployment.' >&2
  exit 1
fi
if ! grep -q 'must include both required hosts' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'Missing support host did not produce the expected parity diagnostic.' >&2
  exit 1
fi

new_sandbox normalized_duplicate_host
if PARITY_REQUIRED=1 PARITY_URLS='https://erphpro.com https://erphpro.com/ https://support.erphpro.com' run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected normalized duplicate parity hosts to stop deployment.' >&2
  exit 1
fi
if ! grep -q 'invalid or duplicate production parity host' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'Normalized duplicate host did not produce the expected parity diagnostic.' >&2
  exit 1
fi

new_sandbox missing_atomic_path
if OVERRIDE_RELEASES_DIR= run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected a missing atomic-release path to stop deployment.' >&2
  exit 1
fi
if ! grep -q 'SSR_RELEASES_DIR must be configured' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'The missing atomic-release path test failed for an unexpected reason.' >&2
  exit 1
fi
if [[ -s "$TRACE" || "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'A missing atomic-release path reached build commands or changed the live release.' >&2
  exit 1
fi

new_sandbox source_overlaps_document_root
if DOCUMENT_ROOT="$repo_root/ssr/public" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected a Git source checkout overlapping the active document root to stop deployment.' >&2
  exit 1
fi
if ! grep -q 'source public directory and active document root overlap' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'The overlap test failed for a reason other than the overlap guard.' >&2
  exit 1
fi
if [[ -s "$TRACE" || "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'An overlapping source checkout reached build commands or changed the live release.' >&2
  exit 1
fi
new_sandbox missing_extension
if FAKE_PHP_MODULES='ctype fileinfo mbstring openssl PDO tokenizer xml' run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected a missing PHP extension to stop deployment.' >&2
  exit 1
fi
if [[ -s "$TRACE" || "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'Missing PHP extension reached build commands or changed the live release.' >&2
  exit 1
fi

new_sandbox current_link_read_failure
if FAIL_READLINK=1 run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected a failed current-link read to stop deployment.' >&2
  exit 1
fi
if [[ -e "$RELEASES/.deploy.lock" || "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'A failed current-link read left a stale lock or changed the live release.' >&2
  exit 1
fi

new_sandbox current_outside_releases
OUTSIDE_RELEASE="$SANDBOX/outside-release"
mkdir -p "$OUTSIDE_RELEASE/public"
rm "$CURRENT"
ln -s "$OUTSIDE_RELEASE" "$CURRENT"
if run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected a current symlink outside releases to stop deployment.' >&2
  exit 1
fi
if ! grep -q 'current must resolve inside SSR_RELEASES_DIR' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'The outside-current test failed for an unexpected reason.' >&2
  exit 1
fi
new_sandbox pending
if MIGRATION_PENDING=1 FAKE_HEALTH_RESPONSE="{\"status\":\"ok\",\"database\":\"ok\",\"cache\":\"ok\",\"release\":\"$expected_sha\"}" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected pending migrations to stop deployment.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]] || grep -q 'artisan config:cache' "$TRACE"; then
  echo 'Pending migrations changed the live release or built production caches.' >&2
  exit 1
fi

new_sandbox composer_failure
if COMPOSER_FAIL=1 run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected Composer failure to stop deployment.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" || -e "$RELEASES/.deploy.lock" ]]; then
  echo 'Composer failure changed the live release.' >&2
  exit 1
fi

new_sandbox composer_missing
if COMPOSER_BIN_OVERRIDE="$SANDBOX/bin/missing-composer" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected a missing Composer executable to stop deployment.' >&2
  exit 1
fi
if ! grep -q 'SSR_COMPOSER_BIN' "$SANDBOX/out"; then
  echo 'Missing Composer failure did not explain how to configure SSR_COMPOSER_BIN.' >&2
  exit 1
fi

new_sandbox health_failure
if CURL_FAIL=1 run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected an HTTP health failure to stop deployment.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" || -e "$RELEASES/.deploy.lock" ]]; then
  echo 'Health failure did not restore the previous release symlink.' >&2
  exit 1
fi
if [[ ! -d "$RELEASES/$expected_sha" ]]; then
  cat "$SANDBOX/out" >&2
  find "$RELEASES" -maxdepth 2 -mindepth 1 -print >&2
  echo 'Failed release was not preserved for diagnosis.' >&2
  exit 1
fi
FAKE_HEALTH_RESPONSE="{\"status\":\"ok\",\"database\":\"ok\",\"cache\":\"ok\",\"release\":\"$expected_sha\"}" run_hook >"$SANDBOX/retry.out" 2>&1
if [[ "$(readlink "$CURRENT")" != "$RELEASES/$expected_sha" ]] || ! grep -q 'migrate:status' "$TRACE"; then
  echo 'Retry did not reuse and promote the previously built release.' >&2
  exit 1
fi

for failed_cache in config:cache route:cache view:cache; do
  new_sandbox "${failed_cache//:/-}_failure"
  if ARTISAN_FAIL="$failed_cache" run_hook >"$SANDBOX/out" 2>&1; then
    echo "Expected $failed_cache failure to stop deployment." >&2
    exit 1
  fi
  if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" || -e "$RELEASES/$expected_sha" || -e "$RELEASES/.deploy.lock" ]]; then
    echo "$failed_cache failure did not clean the new release and lock safely." >&2
    exit 1
  fi
done

new_sandbox wrong_release
if FAKE_HEALTH_RESPONSE='{"status":"ok","database":"ok","cache":"ok","release":"wrong"}' run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected a mismatched release health response to stop deployment.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'Mismatched release health did not restore the previous release.' >&2
  exit 1
fi

new_sandbox malformed_health
if FAKE_HEALTH_RESPONSE='not-json' run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected malformed JSON health response to stop deployment.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'Malformed JSON health response changed the live release.' >&2
  exit 1
fi

new_sandbox non_string_health
if FAKE_HEALTH_RESPONSE="{\"status\":true,\"database\":\"ok\",\"cache\":\"ok\",\"release\":\"$expected_sha\"}" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected non-string health fields to stop deployment.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'Non-string health fields changed the live release.' >&2
  exit 1
fi

new_sandbox rollback_recovery
ROLLBACK_SEQUENCE="$SANDBOX/health-sequence"
printf '{"status":"ok","database":"ok","cache":"ok","release":"%s"}\n{"status":"ok","database":"ok","cache":"ok","release":"%s"}\n' "$expected_sha" "$OLD_SHA" > "$ROLLBACK_SEQUENCE"
if PARITY_REQUIRED=1 PARITY_URLS='https://erphpro.com https://support.erphpro.com' PARITY_SCRIPT_OVERRIDE="$tmp_dir/bin/parity-flaky" CURL_SEQUENCE_FILE="$ROLLBACK_SEQUENCE" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected the promoted release to fail support-host parity and return nonzero.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'Rollback did not restore the distinct old SHA release.' >&2
  exit 1
fi
if ! grep -q 'restored and re-verified previous release' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'Successful rollback verification diagnostic was missing.' >&2
  exit 1
fi
if ! grep -q "$OLD_SHA" "$PARITY_TRACE" || [[ "$(wc -l < "$PARITY_TRACE")" -lt 2 ]]; then
  echo 'Rollback did not verify both hosts using the old release SHA.' >&2
  exit 1
fi
if [[ -e "$RELEASES/.deploy.lock" ]]; then
  echo 'Successful rollback left a deployment lock.' >&2
  exit 1
fi

new_sandbox rollback_real_parity
REAL_PARITY_SEQUENCE="$SANDBOX/health-sequence"
printf '{"status":"ok","database":"ok","cache":"ok","release":"%s"}\n{"status":"ok","database":"ok","cache":"ok","release":"%s"}\n' "$expected_sha" "$OLD_SHA" > "$REAL_PARITY_SEQUENCE"
if PARITY_REQUIRED=1 PARITY_URLS='https://erphpro.com https://support.erphpro.com' \
  PARITY_HTTP_INTEGRATION=1 PARITY_NEW_SHA="$expected_sha" \
  CURL_SEQUENCE_FILE="$REAL_PARITY_SEQUENCE" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected the actual parity verifier to reject the unhealthy new support host.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" ]]; then
  echo 'Actual parity verifier rollback did not restore the old SHA release.' >&2
  exit 1
fi
if ! grep -q 'restored and re-verified previous release' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'Actual parity rollback success diagnostic was missing.' >&2
  exit 1
fi
if ! grep -q 'https://erphpro.com/health' "$TRACE" || ! grep -q 'https://support.erphpro.com/health' "$TRACE"; then
  echo 'Actual parity verifier did not request both production hosts.' >&2
  exit 1
fi
if ! grep -q "$OLD_SHA" "$SANDBOX/out" || [[ -e "$RELEASES/.deploy.lock" ]]; then
  echo 'Actual parity rollback did not verify the old SHA or release the lock.' >&2
  exit 1
fi

new_sandbox rollback_critical
CRITICAL_SEQUENCE="$SANDBOX/health-sequence"
printf '{"status":"ok","database":"ok","cache":"ok","release":"%s"}\n{"status":"ok","database":"ok","cache":"ok","release":"%s"}\n' "$expected_sha" "$OLD_SHA" > "$CRITICAL_SEQUENCE"
if PARITY_REQUIRED=1 PARITY_URLS='https://erphpro.com https://support.erphpro.com' PARITY_SCRIPT_OVERRIDE="$tmp_dir/bin/parity-fail" CURL_SEQUENCE_FILE="$CRITICAL_SEQUENCE" run_hook >"$SANDBOX/out" 2>&1; then
  echo 'Expected post-rollback parity failure to return nonzero.' >&2
  exit 1
fi
if ! grep -q 'CRITICAL: previous release was restored' "$SANDBOX/out"; then
  cat "$SANDBOX/out" >&2
  echo 'CRITICAL post-rollback diagnostic was missing.' >&2
  exit 1
fi
if [[ "$(readlink "$CURRENT")" != "$OLD_RELEASE" || -e "$RELEASES/.deploy.lock" ]]; then
  echo 'CRITICAL rollback case changed current or left a deployment lock.' >&2
  exit 1
fi

new_sandbox healthy
FAKE_HEALTH_RESPONSE="{\"status\":\"ok\",\"database\":\"ok\",\"cache\":\"ok\",\"release\":\"$expected_sha\"}" run_hook >"$SANDBOX/out" 2>&1
if [[ "$(readlink "$CURRENT")" != "$RELEASES/$expected_sha" ]]; then
  echo 'Healthy release was not promoted to current.' >&2
  exit 1
fi
FAKE_HEALTH_RESPONSE="{\"status\":\"ok\",\"database\":\"ok\",\"cache\":\"ok\",\"release\":\"$expected_sha\"}" run_hook >"$SANDBOX/repeat.out" 2>&1
if ! grep -q 'already active and healthy' "$SANDBOX/repeat.out"; then
  echo 'A repeat deployment of the current healthy SHA was not idempotent.' >&2
  exit 1
fi
if [[ ! -L "$RELEASES/$expected_sha/.env" || ! -L "$RELEASES/$expected_sha/storage" ]]; then
  echo 'The release did not use the shared environment and persistent storage.' >&2
  exit 1
fi
if grep -q '/\.build-' "$RELEASES/$expected_sha/bootstrap/cache/config.php"; then
  echo 'The cached Laravel config still points at the removed temporary build directory.' >&2
  exit 1
fi
if [[ "$(cat "$RELEASES/$expected_sha/bootstrap/cache/config.php")" != "$RELEASES/$expected_sha" ]]; then
  echo 'The cached Laravel config was not generated from the fixed SHA release directory.' >&2
  exit 1
fi
if ! grep -q 'migrate:status' "$TRACE" || grep -Eq 'artisan migrate($| )|artisan db:seed' "$TRACE"; then
  echo 'The release check wrote to the database or skipped the read-only migration check.' >&2
  exit 1
fi

echo 'Atomic deployment hook self-check passed.'
