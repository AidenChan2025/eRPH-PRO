# Gate 3 control-plane acceptance

- candidate_sha: `bebac247406f54e081f16823fc704fe7aa869794`
- status: implemented
- scope: overview, schools, platform team, account assignment, security/audit, connected runtime health
- tests: `php artisan test --compact tests/Feature/PlatformControlPlaneTest.php tests/Feature/PlatformModuleUnlockTest.php`

The platform workspace is independent of school membership. School creation, suspend/restore, and administrator invitation validate on the server and accept idempotency keys. Unimplemented settings, support, billing and content shells are not rendered in the Gate 3 overview.
