# Gate 0 traceability matrix

| claim_id | gate | requirement | route/controller/service | model/table/migration | policy/middleware | view | test/evidence | status | owner/method/deadline/fallback |
|---|---|---|---|---|---|---|---|---|---|
| D1-001 | gate0 | baseline identity and dirty review | N/A | git | N/A | N/A | validator + baseline.md | implemented | Lead Architect / recompute identity / gate0 / revalidate |
| D1-002 | gate1 | DSKP/KPM import compatibility | import command | CurriculumItem / curriculum migrations | permission middleware | owner DSKP views | KpmCsvImportTest.php | implemented | Backend/Security / feature tests / gate1 / reject file |
| D1-003 | gate2 | school tenant isolation | school workspace controllers | school-scoped models | ResolveTenantContext, membership | school Blade views | planned security matrix | unverified | Backend/Security / negative matrix / gate2 / disable feature |
| D1-004 | gate2 | platform identity/MFA/OAuth | owner auth controllers/services | users, google identities, oauth handoffs | platform/MFA/session middleware | owner auth views | planned security tests | unverified | Backend/Security / test matrix / gate2 / block access |
| D1-005 | gate3 | platform control plane | Owner controllers | schools, memberships, audit | platform permission middleware | owner dashboard views | planned acceptance matrix | unverified | Platform Owner / browser acceptance / gate3 / hide module |
| D1-006 | gate4 | RPH workflow and immutable versions | LessonPlan controllers | lesson plans, submissions, versions, reviews | permission and tenant middleware | RPH views | planned workflow tests | unverified | Lead Architect / feature/state tests / gate4 / retain current workflow |
| D1-007 | gate4 | teacher records and transfer boundaries | TeacherProfileController | teacher profiles, assignments | tenant/permission middleware | teacher record views | planned portability tests | unverified | Data/Content Owner / field coverage / gate4 / no migration |
| D1-008 | gate5 | health and runtime parity | HealthController | runtime/config | host middleware | health response | planned parity script | unverified | QA & Release Ops / endpoint and fingerprint probes / gate5 / retain prior release |
| D1-009 | gate5 | backup/recovery RTO/RPO | recovery tooling | recovery probe | operational controls | N/A | planned recovery validator | unverified | QA & Release Ops / isolated rehearsal / gate5 / no expansion |
| D1-010 | gate0 | source rights and dependencies registered | N/A | N/A | N/A | N/A | three registers | implemented | Lead Architect / schema + validator / gate0 / block dependent gate |
