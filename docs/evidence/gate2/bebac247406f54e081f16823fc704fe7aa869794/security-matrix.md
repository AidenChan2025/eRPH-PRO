# Gate 2 security matrix

| Role | Resource | Operation | Result | Test |
|---|---|---|---|---|
| owner | platform workspace | read | allow after MFA | MfaRecoveryTest |
| owner | school tenant | read | deny without membership | PermissionDenialMatrixTest |
| teacher | platform workspace | read | deny | PermissionDenialMatrixTest |
| teacher | own school workspace | read | allow with active membership | existing school membership tests |
| inactive member | school tenant | read | deny | PermissionDenialMatrixTest |
| support | sensitive export | download | deny by default | PermissionDenialMatrixTest |
| any role | OAuth handoff | replay | deny | OAuthStateReplayTest |
| any role | CSRF token | cross-host use | deny | CsrfScopeTest |

Platform and school session cookies are host-scoped and distinct. Unknown roles and permissions default to deny.
