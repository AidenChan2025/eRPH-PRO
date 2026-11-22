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
  if [[ "$previous" == "--output" ]]; then
    output="$argument"
  fi
  previous="$argument"
  url="$argument"
done
if [[ "$url" == */health ]]; then
  printf 'HTTP/1.1 %s\r\nContent-Type: application/json\r\n\r\n' "${FAKE_HEALTH_STATUS:-200}"
  if [[ "$output" != /dev/null ]]; then
    printf '%s' "${FAKE_HEALTH_BODY:-}" > "$output"
  fi
else
  printf 'HTTP/1.1 %s\r\nContent-Type: %s\r\n\r\n' "${FAKE_HOME_STATUS:-200}" "${FAKE_HOME_TYPE:-text/html; charset=UTF-8}"
  if [[ "$output" != /dev/null && -n "$output" ]]; then
    printf '%s' "${FAKE_HOME_BODY:-<!doctype html><html><body>Laravel SSR</body></html>}" > "$output"
  fi
fi
CURL
chmod +x "$tmp_dir/bin/curl"

run_verifier() {
  env PATH="$tmp_dir/bin:$PATH" \
    FAKE_HEALTH_STATUS="${FAKE_HEALTH_STATUS:-200}" \
    FAKE_HEALTH_BODY="${FAKE_HEALTH_BODY:-{\"status\":\"ok\",\"database\":\"ok\",\"cache\":\"ok\",\"release\":\"0123456789abcdef0123456789abcdef01234567\"}}" \
    FAKE_HOME_STATUS="${FAKE_HOME_STATUS:-200}" \
    FAKE_HOME_TYPE="${FAKE_HOME_TYPE:-text/html; charset=UTF-8}" \
    FAKE_HOME_BODY="${FAKE_HOME_BODY:-<!doctype html><html><body>Laravel SSR</body></html>}" \
    bash "$repo_root/scripts/verify-ssr-production.sh" https://example.test
}

if ! run_verifier >/dev/null; then
  echo 'A valid health/homepage response was rejected.' >&2
  exit 1
fi

if FAKE_HEALTH_BODY='not-json' run_verifier >/dev/null 2>&1; then
  echo 'Malformed health JSON was accepted.' >&2
  exit 1
fi

if FAKE_HEALTH_BODY='[]' run_verifier >/dev/null 2>&1; then
  echo 'A list-valued health JSON response was accepted.' >&2
  exit 1
fi

if FAKE_HEALTH_BODY='{"status":"ok","database":"ok","cache":"ok","release":"test"}' run_verifier >/dev/null 2>&1; then
  echo 'A non-SHA release label was accepted.' >&2
  exit 1
fi

if FAKE_HOME_STATUS=503 run_verifier >/dev/null 2>&1; then
  echo 'A homepage 503 was accepted.' >&2
  exit 1
fi

if FAKE_HOME_TYPE='application/json' run_verifier >/dev/null 2>&1; then
  echo 'A non-HTML homepage response was accepted.' >&2
  exit 1
fi

if FAKE_HOME_BODY='<!doctype html><html><head><!-- Google Tag Manager --></head><body><div id="root"></div><script type="module" src="./index.tsx"></script></body></html>' run_verifier >/dev/null 2>&1; then
  echo 'A legacy homepage shell was accepted.' >&2
  exit 1
fi

echo 'Production verifier self-check passed.'
