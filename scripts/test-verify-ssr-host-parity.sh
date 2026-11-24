#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
mkdir -p "$tmp_dir/bin"

cat > "$tmp_dir/bin/curl" <<'CURL'
#!/usr/bin/env bash
set -Eeuo pipefail
output=""
url=""
previous=""
for argument in "$@"; do
  if [[ "$previous" == --output ]]; then output="$argument"; fi
  url="$argument"
  previous="$argument"
done
body=""
case "$*" in
  *first.test*) body='{"status":"ok","database":"ok","cache":"ok","release":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","runtime_file_sha256":"1111111111111111111111111111111111111111111111111111111111111111"}' ;;
  *second.test*) body='{"status":"ok","database":"ok","cache":"ok","release":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","runtime_file_sha256":"1111111111111111111111111111111111111111111111111111111111111111"}' ;;
  *drift.test*) body='{"status":"ok","database":"ok","cache":"ok","release":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","runtime_file_sha256":"1111111111111111111111111111111111111111111111111111111111111111"}' ;;
  *runtime-drift.test*) body='{"status":"ok","database":"ok","cache":"ok","release":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","runtime_file_sha256":"2222222222222222222222222222222222222222222222222222222222222222"}' ;;
  *redirect.test*) body='{"status":"ok","database":"ok","cache":"ok","release":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","runtime_file_sha256":"1111111111111111111111111111111111111111111111111111111111111111"}' ; printf '%s' "$body" > "$output"; printf '302\thttps://redirect.test/health\thttps://redirect.test/health'; exit 0 ;;
  *server-error.test*) body='{"status":"ok","database":"ok","cache":"ok","release":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","runtime_file_sha256":"1111111111111111111111111111111111111111111111111111111111111111"}' ; printf '%s' "$body" > "$output"; printf '500\thttps://server-error.test/health\t'; exit 0 ;;
  *invalid-json.test*) body='not-json' ;;
  *) exit 22 ;;
esac
printf '%s' "$body" > "$output"
printf '200\t%s\t' "$url"
CURL
chmod +x "$tmp_dir/bin/curl"

if PATH="$tmp_dir/bin:$PATH" bash "$repo_root/scripts/verify-ssr-host-parity.sh" "https://first.test" "https://second.test" >/dev/null; then
  :
else
  echo 'Expected matching hosts to pass.' >&2
  exit 1
fi

if PATH="$tmp_dir/bin:$PATH" bash "$repo_root/scripts/verify-ssr-host-parity.sh" "https://first.test" "https://drift.test" >/dev/null 2>&1; then
  echo 'Expected release drift to fail.' >&2
  exit 1
fi

if PATH="$tmp_dir/bin:$PATH" bash "$repo_root/scripts/verify-ssr-host-parity.sh" "https://first.test" "https://runtime-drift.test" >/dev/null 2>&1; then
  echo 'Expected runtime fingerprint drift to fail.' >&2
  exit 1
fi

if PATH="$tmp_dir/bin:$PATH" bash "$repo_root/scripts/verify-ssr-host-parity.sh" "http://first.test" "https://second.test" >/dev/null 2>&1; then
  echo 'Expected an insecure host to fail.' >&2
  exit 1
fi

if PATH="$tmp_dir/bin:$PATH" bash "$repo_root/scripts/verify-ssr-host-parity.sh" "https://redirect.test" "https://second.test" >/dev/null 2>&1; then
  echo 'Expected an HTTP redirect to fail.' >&2
  exit 1
fi

if PATH="$tmp_dir/bin:$PATH" bash "$repo_root/scripts/verify-ssr-host-parity.sh" "https://server-error.test" "https://second.test" >/dev/null 2>&1; then
  echo 'Expected an HTTP 500 response to fail.' >&2
  exit 1
fi

if PATH="$tmp_dir/bin:$PATH" bash "$repo_root/scripts/verify-ssr-host-parity.sh" "https://invalid-json.test" "https://second.test" >/dev/null 2>&1; then
  echo 'Expected malformed JSON to fail.' >&2
  exit 1
fi

echo 'SSR host parity self-check passed.'
