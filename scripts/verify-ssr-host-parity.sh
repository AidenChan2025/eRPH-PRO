#!/usr/bin/env bash
set -Eeuo pipefail

expected_release=""
if [[ "${1:-}" =~ ^[0-9a-f]{40}$ ]]; then
  expected_release="$1"
  shift
fi
hosts=("$@")
if [[ ${#hosts[@]} -eq 0 ]]; then
  hosts=("https://erphpro.com" "https://support.erphpro.com")
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf -- "$tmp_dir"' EXIT

declare -a releases=()
declare -a runtime_hashes=()
for base_url in "${hosts[@]}"; do
  if [[ "$base_url" != https://* ]]; then
    echo "FAIL: host ${base_url} must use HTTPS" >&2
    exit 1
  fi
  health_url="${base_url%/}/health"
  expected_host="${base_url#https://}"
  expected_host="${expected_host%%/*}"
  body_file="$tmp_dir/$(printf '%s' "$expected_host" | tr -c '[:alnum:].-' '_').json"
  curl_meta="$(curl --silent --show-error --fail --max-time 20 --proto '=https' --proto-redir '=https' \
    --output "$body_file" --write-out '%{http_code}\t%{url_effective}\t%{redirect_url}' "$health_url")" || {
    echo "FAIL: ${health_url} request failed" >&2
    exit 1
  }
  IFS=$'\t' read -r http_code effective_url redirect_url <<<"$curl_meta"
  if [[ "$http_code" != 200 || -n "$redirect_url" || "$effective_url" != "$health_url" ]]; then
    echo "FAIL: ${health_url} did not return HTTP 200 without redirect (status=${http_code:-unknown}, effective=${effective_url:-unknown}, redirect=${redirect_url:-none})" >&2
    exit 1
  fi
  parsed="$(php -r '
    $health = json_decode(file_get_contents($argv[1]), true);
    if (!is_array($health) || !isset($health["status"], $health["database"], $health["cache"], $health["release"], $health["runtime_file_sha256"])) { exit(2); }
    if ($health["status"] !== "ok" || $health["database"] !== "ok" || $health["cache"] !== "ok") { exit(3); }
    if (!is_string($health["release"]) || preg_match("/^[0-9a-f]{40}$/", $health["release"]) !== 1) { exit(4); }
    if (!is_string($health["runtime_file_sha256"]) || preg_match("/^[0-9a-f]{64}$/", $health["runtime_file_sha256"]) !== 1) { exit(5); }
    echo $health["release"]."|".$health["runtime_file_sha256"];
  ' "$body_file" 2>/dev/null)" || {
    echo "FAIL: ${health_url} returned invalid or unhealthy JSON" >&2
    exit 1
  }
  release="${parsed%%|*}"
  runtime_hash="${parsed#*|}"
  echo "${base_url}: ${release} (${runtime_hash})"
  releases+=("$release")
  runtime_hashes+=("$runtime_hash")
done

reference="${expected_release:-${releases[0]}}"
for index in "${!releases[@]}"; do
  if [[ "${releases[$index]}" != "$reference" ]]; then
    echo "FAIL: host ${hosts[$index]} is on ${releases[$index]}, expected ${reference}" >&2
    exit 1
  fi
done

runtime_reference="${runtime_hashes[0]}"
for index in "${!runtime_hashes[@]}"; do
  if [[ "${runtime_hashes[$index]}" != "$runtime_reference" ]]; then
    echo "FAIL: host ${hosts[$index]} has runtime hash ${runtime_hashes[$index]}, expected ${runtime_reference}" >&2
    exit 1
  fi
done

echo "PASS: all SSR hosts match release ${reference} and runtime ${runtime_reference}"
