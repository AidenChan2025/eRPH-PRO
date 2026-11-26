#!/usr/bin/env bash
set -euo pipefail

candidate=${1:-}
if [[ ! "$candidate" =~ ^[0-9a-f]{40}\+[0-9a-f]{64}$ ]]; then
  echo "invalid candidate identity" >&2; exit 40
fi
root=$(cd "$(dirname "$0")/.." && pwd)
repo=$(cd "$root/.." && pwd)
evidence="$repo/docs/evidence/gate0/$candidate"
[[ -d "$evidence" ]] || { echo "missing evidence root: $evidence" >&2; exit 41; }

head=$(git -C "$root" rev-parse HEAD)
diff_sha=$(git -C "$root" diff --binary | sha256sum | awk '{print $1}')
[[ "$candidate" == "$head+$diff_sha" ]] || { echo "candidate identity mismatch" >&2; exit 45; }
grep -Fq "audit_candidate_id: $candidate" "$evidence/baseline.md" || { echo "baseline identity mismatch" >&2; exit 45; }

for f in baseline.md traceability.md blockers.json source-rights.json dependency-register.json rto-rpo.json roles.json resources.json operations.json planned-deliverables.json env-allowlist.json; do
  [[ -s "$evidence/$f" ]] || { echo "missing Gate 0 artifact: $f" >&2; exit 41; }
done
[[ -s "$root/schemas/evidence/registry.json" ]] || { echo "missing registry" >&2; exit 40; }

php -r 'foreach (array_slice($argv,1) as $f) { $d=json_decode(file_get_contents($f), true); if (!is_array($d)) { fwrite(STDERR, "invalid JSON: $f\n"); exit(1); } }' \
  "$evidence/blockers.json" "$evidence/source-rights.json" "$evidence/dependency-register.json" \
  "$evidence/rto-rpo.json" "$evidence/roles.json" "$evidence/resources.json" "$evidence/operations.json" \
  "$evidence/planned-deliverables.json" "$evidence/env-allowlist.json"

jq -e '.source_owner and .sanitized_source_acceptance and .verification_method and .deadline_gate and .blocked_fallback' "$evidence/source-rights.json" >/dev/null
jq -e 'type == "array" and all(.[]; .dependency and .version and .access_owner and .verification_method and .deadline_gate and .failure_impact and .fallback)' "$evidence/dependency-register.json" >/dev/null
jq -e '.rto_hours == 4 and .rpo_hours == 24 and .approving_role' "$evidence/rto-rpo.json" >/dev/null
jq -e 'all(.[]; .name and .responsibilities)' "$evidence/roles.json" >/dev/null
jq -e 'all(.[]; .name and .enumeration)' "$evidence/resources.json" >/dev/null
jq -e 'all(.[]; .name and .enumeration)' "$evidence/operations.json" >/dev/null
jq -e 'all(.[]; .path and .deadline_gate and .status and .owner)' "$evidence/planned-deliverables.json" >/dev/null
jq -e '.allowed_keys and .disabled_integrations' "$evidence/env-allowlist.json" >/dev/null
for gate in gate0 gate1 gate2 gate3 gate4 gate5; do grep -q "$gate" "$root/schemas/evidence/registry.json"; done
echo "D1 Gate 0 evidence valid: $candidate"
