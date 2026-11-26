# eRPH Pro Development 1 implementation plan — review candidate

**Plan revision:** 8. This revision closes the latest DeepSeek review findings; it remains a candidate until both independent reviewers return 10.0/10.0.

**Purpose:** close the current Development 1 goal in controlled slices without starting D2–D9, the commercial automation backlog, student affairs, billing, or production AI.

**Review gate:** this document is a candidate plan only. Gemini and DeepSeek must independently review it. A phase is not approved by a score alone: both reviewers must explicitly give 10.0/10.0, identify zero unresolved major issues, and agree that the acceptance evidence is reproducible. `unverified` facts are allowed in the plan only when they have a named verification owner, method, deadline gate, failure impact and fallback; they are not treated as implementation evidence. The Owner then decides whether to create a Goal.

## Scope boundary

In scope: Phase 0 evidence closure, Phase 1 platform core, the RPH/teacher-record parts of Development 1, DSKP import compatibility, controlled Plesk verification, and synthetic/demo acceptance.

Out of scope until the current goal is accepted: D2–D9 modules, student records/discipline/attendance, commercial automation, real billing/refunds/commission payments, production DeepSeek calls, real Drive writes, and irreversible production data migration.

## Delivery sequence

## Execution control matrix

Every gate uses this metadata and must fill it before execution begins:

| Field | Required value |
|---|---|
| Baseline status | `implemented`, `observed`, `inferred`, or `unverified` per claim |
| Responsible role | Lead Architect, Backend/Security Engineer, QA & Release Ops, Data/Content Owner, or Platform Owner |
| Decision owner/SLA | Platform Owner; blocker decision within 2 business days, security/production blocker immediately |
| Artifact root | `docs/evidence/<gate>/<candidate-sha>/` for reviewable text/JSON; no secrets or personal data |
| Test binding | Exact command, test class/file, expected result and timeout |
| Dependency | Prior gate, external system, required access, or `none` |
| Failure impact/fallback | What is disabled, isolated, or postponed if the evidence fails |

Gate 0 must create and approve three registers before any later gate starts:

- `source-rights.json`: source owner, sanitized-source acceptance criteria (field coverage plus redaction proof), verification method, deadline gate, and blocked fallback.
- `dependency-register.json`: dependency/version, access owner, verification method, registration deadline gate, failure impact and fallback. If a dependency is not registered by its deadline, the dependent gate is blocked and cannot pass as `inferred`.
- `rto-rpo.json`: fixed targets and approving role. For this plan the initial targets are RTO ≤ 4 hours and RPO ≤ 24 hours; Gate 5 may only measure them, never lower them.

The three registers must validate against versioned schemas in `schemas/evidence/` using `jq` (or an equivalent pinned validator). Completeness means: schema validation succeeds, every required key is non-null, and every `deadline_gate` references an existing gate ID. The Gate 0 command is `bash scripts/validate-d1-evidence.sh <candidate-sha>` (expected exit 0, timeout 30s).

Gate 0 also freezes `roles.json`, `resources.json`, and `operations.json` under `docs/evidence/gate0/<candidate-sha>/`. Gate 2's security matrix must equal the Cartesian product of those enumerations minus explicitly declared `na_cells`; every remaining cell has exactly one allow/deny result and test ID, and each role must have at least one deny cell. The matrix completeness command is part of `validate-d1-evidence.sh`.

The first evidence index is `docs/evidence/D1_EVIDENCE_INDEX.md`; each gate adds a SHA-bound entry and records the reviewer revision. Evidence is retained with the candidate branch and never contains credentials or unredacted personal records.

Any command, schema, fixture, or test path named in this plan that does not yet exist is a planned deliverable, not a current capability. Gate 0 fails closed if a referenced validator or test binding is missing; the plan never treats a missing command as a pass.

Gate 0 also creates `planned-deliverables.json`, listing every command, schema, fixture, test path and evidence path named by this plan with `path`, `deadline_gate`, `status` and `owner`. `validate-d1-evidence.sh` must fail if a required current deliverable is absent, or if a planned item has no deadline/owner. The validator itself is a bootstrap exception: it is registered as `implemented` only after its first self-check passes; before that, Gate 0 preflight fails closed. It also validates the schemas for the evidence index, threat model, unlock matrix and security matrix. Dirty-file review is recorded as reviewer name, UTC timestamp, diff SHA-256 and `dirty_changes_decision: reviewed|rejected`.

`planned-deliverables.json` uses `status: planned|implemented|verified`. `implemented` means the path exists and its self-check/implementation is present; `verified` means that condition plus a matching evidence-index row, the owning gate's exit test passed, and reviewer/revision fields are present. `verified` is required when the owning gate closes and remains required through final acceptance; any later diff demotes the affected item to `implemented` and requires re-verification before the next gate. Gate IDs are the fixed enum `gate0` through `gate5`; a deliverable is due when its `deadline_gate` ordinal is less than or equal to the current gate ordinal. A due item must be at least `implemented` before test execution and `verified` at gate close; a planned item past its deadline fails. The validator recomputes the candidate identity and compares it to `baseline.md`. The candidate identity is `git rev-parse HEAD + "+" + sha256(git diff --binary)`, recorded in `baseline.md`.

Gate 0 freezes `env-allowlist.json` and schemas for field-dictionary approval, approvals, evidence index, threat model, unlock matrix and security matrix. Gate 4 field-dictionary front matter must contain `status: draft|approved`, `approver`, `approval_timestamp`, `source_id`, `coverage_report_sha`, and `redaction_proof_sha`; the Gate 4 test and Gate 5 preflight validate these fields and referenced artifact hashes. Human sign-off is not sufficient without this machine-readable record.

The approval validator is `scripts/verify-field-dictionary-approval.sh <sha>` (expected exit 0, timeout 30s), where `<sha>` is the committed candidate SHA and the input is `docs/evidence/gate4/<sha>/field-dictionary.md`. It parses front matter with the pinned parser specified by the Gate 0 schema; the hash of each referenced artifact is SHA-256 over its exact raw bytes, including its final newline, with front matter excluded only from the field-dictionary document itself. A missing referenced artifact or schema/hash mismatch exits 43; draft or missing approval exits 41; approved and valid exits 0. The evidence index records `plan_revision` and a separate `evidence_revision`, so neither is overloaded as an implementation version.

`na-approvals.json` is a hash-chained append-only ledger. The first record is the fixed genesis record with `approval_id: "genesis"`, `previous_approval_sha: "0000000000000000000000000000000000000000000000000000000000000000"`, and the remaining required fields set to the Gate 0 registration values. Each subsequent record contains `approval_id`, `previous_approval_sha`, `cell`, `justification`, `approver`, `approved_at`, and optional `supersedes`; its hash is SHA-256 over RFC 8785 JCS of exactly those fields, omitting `supersedes` when absent. The validator recomputes every record hash, checks the chain from genesis, and exits 44 on a missing, reordered or broken link. Removal is allowed only through a new superseding approval.

### Roles and external dependency register

- **Platform Owner:** scope decisions, release authorization, unresolved cross-review conflict.
- **Lead Architect:** traceability, schema/state-machine decisions and implementation handoff.
- **Backend/Security Engineer:** tenant/session/MFA/OAuth controls and threat-model tests.
- **QA & Release Ops:** test execution, Plesk parity, backup/recovery and rollback evidence.
- **Data/Content Owner:** sanitized RPH/DSKP field approval and source-rights evidence.

External dependencies are registered before the gate that needs them: Plesk/PHP-FPM, MariaDB, queue/Cron worker, Google OAuth, AppSheet/Sheets read-only evidence, backup storage, and approved sanitized curriculum sources. Each entry records version, access owner, verification method, failure impact and fallback. Missing access blocks only the dependent gate; it never becomes an inferred pass.

### Quantitative common exit rules

- New automated tests: 100% pass; no skipped test may be used as a pass.
- Security negative cases: 0 unauthorized reads/writes/downloads in the declared matrix.
- Evidence: every gate claim has one artifact, one command or observation procedure, and one reviewer reference.
- Production candidate: HTTP 200 health with `status/database/cache=ok`, candidate SHA and runtime fingerprint matching exactly; any mismatch is a failed gate.
- Recovery: restored schema and representative synthetic records checksum-match 100%; RTO is `health_ok_timestamp - declared_failure_injection_timestamp`. RPO is authoritatively `source_probe_commit_ts - restored_probe_commit_ts`, where both values come from `SELECT MAX(commit_ts) FROM d1_recovery_probe;`; the MariaDB `SHOW BINARY LOGS;` position is corroborating durability evidence only and never substitutes for the timestamp formula. Each output must be exactly one non-empty UTC microsecond timestamp; missing table, NULL, empty output or an unparseable value exits 42 and is recorded verbatim. All event timestamps are recorded on the recovery host's UTC clock after applying the recorded chrony System time offset to source-host events; the recovery host is the named authoritative clock. Source and recovery hosts record host ID, `System time` and `chronyc tracking`; each absolute offset and the inter-host offset delta must be ≤ 1 second. Negative, missing or uncomputable RPO exits 42 and is never clamped. If actual RTO/RPO is better than target, the fixed Gate 0 target remains unchanged and the measured result is recorded. A missed fixed target fails the gate.

### Rollback and exception rule

Any gate stops on a failed invariant, security negative case, candidate/served SHA mismatch, unhealthy health response, or evidence contamination. Gate 5 rollback means: stop expansion, disable the candidate feature flag, keep the previous verified release, restore only in the isolated recovery database, run health/parity/core smoke checks, and record the decision. No irreversible migration is accepted without an expand/observe/contract plan and a forward-fix path. Partial queue/Cron failure degrades to disabled background features and a visible operational blocker; it does not silently proceed.

### Gate 0 — baseline and evidence lock

- Freeze the candidate SHA and record branch, working-tree state, PHP/Laravel versions, test commands and public endpoint results.
- Produce a code traceability matrix: requirement → route → controller/service → model/table/migration → policy/middleware → Blade view → test/evidence.
- Record every unknown as `unverified`; do not infer Plesk, AppSheet, source rights, backups, queue/Cron or OAuth facts from code alone.
- Keep the existing candidate changes uncommitted until the Owner chooses the review/merge boundary.

**Owner:** Lead Architect + QA & Release Ops. **Artifact:** `docs/evidence/gate0/<candidate-sha>/baseline.md`, `traceability.md`, `blockers.json`, `source-rights.json`, `dependency-register.json`, `rto-rpo.json`. **Test:** `php artisan test --compact` (expected exit 0, timeout 120s, `.env.testing` and SQLite test DB); `git status --short --branch` plus a `git diff` snapshot reviewed and signed in `baseline.md`; endpoint probes with 15-second timeout. **Exit:** 100% of in-scope requirements have a row; every unverified row has owner/method/deadline/fallback; the three registers are complete; dirty changes are either diff-reviewed or explicitly rejected.

### Gate 1 — DSKP and curriculum import contract

- Normalize BOM, whitespace, punctuation and known aliases (`SUBJEK .`, `TINGKATAN`, `TSIVIK`, `SOSIOEMOSI`, `TINDAKAN`).
- Add fixtures for Prasekolah, SK/SMK, Tingkatan 6 and malformed/non-DSKP CSVs.
- Report imported, refreshed, skipped and rejected files with a reason; preserve idempotency and school-independent curriculum ownership.
- Validate row shape, required canonical headers, duplicate canonical headers and blank/placeholder values.

**Owner:** Backend/Security Engineer + Data/Content Owner. **Artifact:** `docs/evidence/gate1/<candidate-sha>/dskp-import-report.json` and sanitized fixtures under `tests/Fixtures/Kpm/`. **Test:** `php artisan test --compact tests/Feature/KpmCsvImportTest.php`; at least 4 format fixtures, 1 malformed fixture, repeat-import delta exactly zero, and every skipped/rejected file has a non-empty reason. Row-level rejection is explicit; header/schema failure may reject the file.

### Gate 2 — platform identity and tenant security

- Separate platform Owner access from school membership.
- Enforce platform MFA before platform workspace access.
- Use host/path-scoped platform and school sessions, independent CSRF/state handling, and a single-use OAuth handoff where required.
- Enforce school host resolution, active membership, explicit permissions and default deny.
- Audit Owner actions, support access, membership changes and sensitive exports.

**Owner:** Backend/Security Engineer. **Artifact:** `docs/evidence/gate2/<candidate-sha>/security-matrix.md`, `threat-model.json` and append-only `na-approvals.json`. **Test binding:** `php artisan test --compact tests/Feature/PlatformSessionIsolationTest.php tests/Feature/OAuthStateReplayTest.php tests/Feature/CsrfScopeTest.php tests/Feature/MfaRecoveryTest.php tests/Feature/PermissionDenialMatrixTest.php` (expected exit 0, timeout 300s, `.env.testing`). The security matrix must be a complete role × resource × operation table; every deny cell has a test ID and must return denial. `na_cells` require role/resource/operation, justification and Platform Owner approval; their count is capped at `floor(0.10 * CartesianProductSize)`. If that floor is zero, Gate 0 must adjust the frozen resource/operation enumeration or record that no NA exception is permitted; a legitimate exception may never be silently added later. Approved `na_cells` are append-only; removal requires a new approval and re-runs the deny-per-resource-family assertion. Every role must have at least one deny per resource family it can touch. “0 unauthorized” means all deny cells are covered and all deny assertions pass. `threat-model.json` maps each STRIDE category to test ID and assertion. Platform and tenant cookies/CSRF keys are distinct and scoped explicitly.

### Gate 3 — platform control plane

- Implement only the first usable modules: overview, schools, platform team, account assignment, security/audit and connected runtime health.
- Support school create/suspend/restore and administrator invitation with server-side validation and idempotency.
- Hide modules not yet implemented; do not display empty operational shells.

**Owner:** Platform Owner + Lead Architect. **Artifact:** `docs/evidence/gate3/<candidate-sha>/control-plane-acceptance.md` and `unlock-matrix.json`. **Test:** `php artisan test --compact tests/Feature/PlatformControlPlaneTest.php tests/Feature/PlatformModuleUnlockTest.php` (expected exit 0, timeout 120s, `.env.testing`); zero-school onboarding (expected empty state plus permitted create-first-school action), Owner-without-membership, non-platform denial and lifecycle idempotency scenarios; all listed module unlock conditions have one allow and one deny test. No unimplemented module is rendered.

### Gate 4 — RPH fidelity and teacher records

- Complete the normalized field dictionary for the approved/sanitized RPH formats.
- Implement draft → submit → review → return/revise → approve/archive with immutable versions and reviewer audit.
- Keep Slot states separate from weekly aggregate states, including `partially_returned`; a week with every Slot returned is `returned`, and draft/empty weeks never use `partially_returned`.
- Implement teacher record ownership, school employment history, transfer/export boundaries, relief RPH and required single-lesson/weekly outputs.

**Owner:** Lead Architect + Data/Content Owner. **Artifact:** `docs/evidence/gate4/<candidate-sha>/field-dictionary.md`, `state-machine.md`, `format-snapshots/`. The field dictionary must first be approved against the Gate 0 registered sanitized source; if absent or failing redaction/coverage criteria, the artifact must begin with `status: draft`, Gate 4 tests must fail (not skip), and Gate 5 is blocked. Approval requires named Data/Content Owner sign-off, source identifier, field coverage report and redaction proof. **Test:** `php artisan test --compact tests/Feature/RphWorkflowAndExportTest.php tests/Feature/RphFieldCoverageTest.php tests/Feature/RphStateMachineTest.php` (expected exit 0, timeout 120s, `.env.testing`); field coverage, immutable-version, tenant/role, return/revise, relief, transfer/export and print/PDF tests, including negative cases for all-returned, all-approved and mixed-without-return weeks. `partially_returned` is a weekly aggregate only: at least one Slot is `returned` and at least one Slot is `submitted` or `approved`; original-school drafts/return comments remain inaccessible after transfer, while approved/archived records remain read-only per policy. Employment history and transfer are explicitly D1 teacher-record portability, not student affairs.

### Gate 5 — controlled production candidate

- Verify Plesk source SHA, served release SHA and runtime fingerprint agree.
- Verify root/support host parity, `/health`, database/cache, queue/Cron configuration, logs, and deployment hook behavior.
- Confirm encrypted backup readability and perform a safe recovery rehearsal in an isolated environment.
- Use synthetic/demo data only; keep real email, Drive, paid AI and production exports disabled.

**Owner:** QA & Release Ops + Platform Owner. **Artifact:** `docs/evidence/gate5/<candidate-sha>/deployment.md`, `parity.json`, `recovery.md`, `rollback.md`. **Test:** `bash scripts/verify-ssr-host-parity.sh <candidate-sha> https://erphpro.com https://support.erphpro.com` (expected exit 0, timeout 300s; mismatch exits 45) plus `bash scripts/verify-d1-recovery.sh docs/evidence/gate5/<candidate-sha>/recovery.md` (expected exit 0, timeout 600s; negative/uncomputable RPO exits 42; orchestration timeout exits 46 and is not the RTO target). Any timeout is a gate failure and triggers rollback smoke in this order: stop expansion, disable candidate flag, retain previous verified release, restore isolated recovery database, then run health/parity/core smoke checks. The parity validator parses the Gate 4 front-matter schema and exits non-zero unless `status: approved`, approval hashes are valid, the frozen env allowlist hash matches, and `release_sha` equals the candidate HEAD SHA. Runtime fingerprint is SHA-256 over RFC 8785 JCS canonical JSON containing `php_version`, `laravel_version`, sorted `extensions`, frozen env-allowlist SHA, `release_sha`, and `config_cache_sha = sha256(bootstrap/cache/config.php)`. Recovery uses an independent staging database/sandbox directory only; hard-disabled mail, Drive, DeepSeek and billing; `recovery.md` records failure-injection time, health-ok time, durable-source commit time, recoverable-commit time, `chronyc tracking` output and clock source. Recovery checksum is 100% and fixed Gate 0 RTO ≤ 4 hours / RPO ≤ 24 hours targets must be met.

Gate 5 operates only on a committed candidate: before deployment, the working-tree diff must be empty and `release_sha` must equal `git rev-parse HEAD`; otherwise Gate 5 is blocked. The earlier `HEAD+diff` candidate identity remains the Gate 0 audit identity. Before Gate 5, that exact diff must be committed by a named commit and the evidence index must add a `candidate-rebound` row containing `precommit_candidate_id`, `diff_sha`, `commit_sha` and UTC commit timestamp; Gate 5 `release_sha` must equal that `commit_sha`. Any unrelated commit or post-Gate-0 diff requires Gate 0 revalidation.

### Unified artifact contract (machine-verifiable)

Gate 0 creates `schemas/evidence/registry.json` and freezes it with SHA-256. This registry is the single contract for every artifact named by this plan. Each entry has `path_pattern`, `format: json|markdown|directory`, `required_keys_or_headings`, `allowed_enums`, `candidate_binding: audit|release|none`, `validator`, `success_exit: 0`, `failure_exit`, and `owner`. The registry itself is validated by `bash scripts/validate-d1-evidence.sh <candidate-sha>`; the validator exits 40 for missing/invalid registry or any artifact without a registry entry, and exits 41 for a missing artifact due at the current gate. No prose requirement creates an unregistered artifact.

The registry includes, at minimum: `baseline.md`, `traceability.md`, `blockers.json`, `source-rights.json`, `dependency-register.json`, `rto-rpo.json`, `planned-deliverables.json`, `env-allowlist.json`, `roles.json`, `resources.json`, `operations.json`, `threat-model.json`, `unlock-matrix.json`, `security-matrix.md`, `na-approvals.json`, Gate 4 field-dictionary front matter, `D1_EVIDENCE_INDEX.md`, dirty-review records, `dskp-import-report.json`, `control-plane-acceptance.md`, `state-machine.md`, `format-snapshots/`, `deployment.md`, `parity.json`, `recovery.md`, `rollback.md`, and the `candidate-rebound` evidence row. The `candidate-rebound` entry explicitly requires `precommit_candidate_id`, `diff_sha`, `commit_sha`, `parent_sha`, `commit_timestamp`, and `candidate_binding: audit-to-release`; it is validated by `validate-d1-evidence.sh` and mismatch exits 45. JSON entries use the pinned JSON Schema Draft 2020-12 validator `ajv-cli 5.0.0`; Markdown entries use the pinned heading/table checker `scripts/validate-d1-markdown.sh`; directory entries require the registered manifest and SHA-256 file list. `jq 1.7` is used only for extraction, never as the schema validator.

All timestamps are RFC 3339 UTC with microseconds; all SHA fields are lowercase 64-hex SHA-256; all candidate-bound paths are resolved beneath the registered evidence root with symlinks rejected. Test output is captured as raw UTF-8 plus SHA-256 in the evidence index; any skipped test is a failure. Endpoint probes are the four fixed URLs `/`, `/features`, `/owner/login`, and `https://support.erphpro.com/solutions`, each requiring HTTP 200 and a captured status/headers/body hash. `baseline.md` records the audit candidate tuple and its exact `git status --short --branch`, `git diff --binary` hash, branch, HEAD, runtime versions and probe hashes.

The canonical identity chain is: `audit_candidate_id = HEAD_SHA + "+" + DIFF_SHA`; `precommit_candidate_id` must equal that exact value; `candidate-rebound` contains the same `diff_sha`, the commit SHA created from that exact diff, and its parent SHA; `release_sha` must equal the rebound `commit_sha` and `git rev-parse HEAD`. The registry validator recomputes and compares all three links; mismatch exits 45. Gate 0 revalidation is required for any change after the recorded diff, regardless of whether a commit is called related or unrelated.

The registry also fixes the operational checks: `mysql --batch --skip-column-names -e "SHOW BINARY LOGS;"` records the durable source position; `date -u '+%Y-%m-%dT%H:%M:%S.%6NZ'` captures each event timestamp; `hostname` and `chronyc tracking` record host and clock data; `sha256sum` computes recovery checksums; `php artisan about --json` and `php -m` supply runtime fields; `sha256sum bootstrap/cache/config.php` supplies `config_cache_sha` and a missing file fails 43. `verify-d1-recovery.sh` exits 42 for missing/invalid timestamps, negative or over-target RPO, checksum/clock failure, and 46 only for its orchestration timeout. `verify-ssr-host-parity.sh` compares status, redirect chain, selected security headers, health JSON keys and runtime/candidate SHA; network/input/schema failures exit 43 and mismatch exits 45. Queue/Cron, logs, hooks, backup readability and disabled integrations are recorded as registered commands with expected zero exit and evidence hashes; absent commands are planned deliverables and fail closed.

## Review protocol

For each reviewer, submit the same candidate plan plus the current evidence register. Ask for:

1. a score out of 10 for requirements, architecture, security, testability, deployment safety, scope control and operational feasibility;
2. every major, minor and ambiguous issue with exact section references;
3. a proposed correction for every issue;
4. an explicit statement of whether the plan is executable without hidden assumptions;
5. a final 10.0/10.0 decision only when no major issue remains.

Apply corrections to a new numbered revision. Re-submit the complete revised plan to both reviewers. Stop only when both independently return 10.0/10.0 with zero unresolved major issues and matching scope/exit criteria.

If Gemini and DeepSeek disagree, the disagreement is recorded verbatim, the stricter safety requirement is applied, and the Platform Owner decides only after a third review by the pre-registered `Independent Release Reviewer` role in `roles.json` (not Platform Owner, Lead Architect, Backend/Security Engineer, QA & Release Ops or Data/Content Owner), with an independence statement recorded, or after a new evidence artifact resolves the conflict. A score cannot override a major issue.

## Definition of plan approval

Plan approval is not implementation approval. The plan is ready for Owner consideration only when:

- Gemini: 10.0/10.0, zero major issues;
- DeepSeek: 10.0/10.0, zero major issues;
- all claims are tagged as implemented, observed, inferred, or unverified, using `claim_id, gate, claim, status, artifact_path, command, reviewer, revision` columns in `docs/evidence/D1_EVIDENCE_INDEX.md`;
- every gate has an owner, artifact and reproducible test;
- no phase depends on an unverified production or data-rights claim;
- no Goal is created automatically.
