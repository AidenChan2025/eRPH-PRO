# Gate 0 baseline

- audit_candidate_id: bebac247406f54e081f16823fc704fe7aa869794+40e979f7633aad27feecd259248ab92ae6e20114b34f4763645b72dd2c6a64b4
- plan_revision: 8
- evidence_revision: gate0-initial
- branch: codex/phase0-code-candidates
- head_sha: bebac247406f54e081f16823fc704fe7aa869794
- diff_sha256: 40e979f7633aad27feecd259248ab92ae6e20114b34f4763645b72dd2c6a64b4
- working_tree: dirty; pre-existing ImportKpmCsvCommand.php and KpmCsvImportTest.php changes preserved and reviewed
- dirty_changes_decision: reviewed
- reviewer: Codex
- reviewed_at_utc: 2026-11-26T00:00:00.000000Z
- php_laravel: PHP 8.3 platform target; Laravel 12 (composer constraint; runtime verification pending)
- test_command: php artisan test --compact
- validator_command: bash scripts/validate-d1-evidence.sh <candidate-sha>
- endpoint_probes: unverified; owner QA & Release Ops; method fixed four URL probes with 15s timeout; deadline gate5; fallback block production candidate
- evidence_boundary: no credentials, personal records, or unredacted source data

## Dirty diff review

The diff was reviewed as the audit candidate input. The two pre-existing application/test changes are in scope for review and remain uncommitted. Gate 0 evidence/scripts added in this task are part of the candidate diff and are included in `diff_sha256`. No reset, stash, clean, discard, or overwrite was performed.
