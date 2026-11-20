# eRPH Pro Development Plan

**Status:** Architecture and product scope locked for the rebuild
**Date:** 2026-11-20
**Primary architecture:** PHP SSR + SQL + progressive-enhancement JavaScript

## 1. Product direction

eRPH Pro will be a multi-school education administration SaaS platform. A school is the tenant and management boundary. Teachers are platform users who may belong to more than one school and may move between schools without creating a new account.

The first release focuses on school administration, teacher records and eRPH lesson planning. Student records, discipline, co-curricular activities and Panitia management are reserved for later modules.

The platform provides the software and infrastructure. School data and teacher data must remain separated by ownership, access policy and audit history.

## 2. Non-negotiable architecture rules

- Core application routes must be server-side rendered.
- PHP is the application runtime; Laravel is the recommended framework.
- MySQL or MariaDB is the primary relational database.
- JavaScript is progressive enhancement only, not the source of truth for security or permissions.
- Authentication, authorization, tenant isolation, billing, AI calls, exports, document generation and audit logging are enforced server-side.
- The browser must never receive or call the DeepSeek API key.
- Every school-owned record must be scoped by `school_id` on the server.
- School-to-school data access is forbidden unless an explicit transfer or sharing workflow authorizes it.
- All sensitive access, changes, downloads, exports and transfers must be logged.

## 3. Tenant and URL model

Each school has a unique school identifier and subdomain, for example:

```text
https://cbc7075.erphpro.com/
```

The subdomain provides the school landing page and the authenticated school workspace. The main domain may provide general login; after authentication, users are redirected to the appropriate school subdomain. Users belonging to several schools must choose the active school workspace.

The server resolves the host to a school tenant. It must not trust a client-supplied `school_id` without independently verifying the host, session, membership and permission.

## 4. Identity, membership and roles

Do not bind a user permanently to one school. Use:

```text
users
schools
school_memberships
```

One user can have different roles in different schools.

### Google Workspace sign-in

The default sign-in method should be Google OAuth/OIDC using the teacher's existing Google Workspace account. eRPH Pro should not ask teachers to create or remember a second password unless a controlled fallback is later required.

Google authentication proves the identity and returns the stable Google subject identifier, email and basic profile. It does not decide school permissions. After sign-in, the server resolves the user's `school_memberships`, active school subdomain and role. A teacher who changes schools keeps the same platform identity and receives a new membership at the new school.

Required controls:

- validate the OAuth issuer, audience and token signature server-side;
- store the provider subject identifier, not only the email address;
- treat email changes as account updates, not as a new person;
- allow school administrators to invite or approve Workspace accounts;
- optionally restrict a school to its approved Workspace domain;
- provide a safe account-recovery and support procedure without exposing passwords;
- revoke sessions and memberships independently of Google account status;
- log sign-in, sign-out, failed sign-in, account linking and membership changes.

Google Workspace access is an authentication convenience. The eRPH Pro account, school membership and records remain separate so that a teacher can move to another participating school without losing the platform identity or exposing the former school's records.

Initial roles:

- Platform Owner: global technical/support access, always audited.
- School Owner / School Administrator: manages the school workspace and its users.
- Principal: full access to the school records and reports.
- Vice Principal / Management: full or delegated school management access.
- Coordinator: access to assigned administrative areas.
- Teacher: personal profile, assigned school work and lesson plans.
- Temporary Inspector: time-limited, read-only or explicitly scoped access.

Use permission policies in addition to role names. A role must not be the only security check.

## 5. Teacher record cabinet

The teacher area is a structured electronic record cabinet, not only a profile page.

Initial categories:

- Personal profile and biodata.
- Employment and appointment records.
- Current duties and school responsibilities.
- Training, courses, meetings and briefings.
- Timetable and teaching assignments.
- Relief-teacher records.
- Textbook records.
- Examination records.
- Supervision and discussion records.
- Daily lesson plans and eRPH history.
- Personal templates and teaching resources.
- Export and transfer history.

School administrators, principals and authorized management users may view all records within their school. Platform Owner support access is permitted but must record the actor, school, object, reason, time and outcome.

## 6. Data ownership and portability

Separate records into:

- School records: school templates, school curriculum libraries, official submissions, approvals, school reports and school administrative records.
- Personal records: teacher profile, personal templates, personal drafts and teacher-owned resources.
- Employment records: records created during a teacher's membership in a school; the school retains the official historical copy.
- Shared/external records: Google Drive files and linked resources with recorded source and permissions.

When a teacher leaves:

1. The membership becomes inactive; the platform account is not deleted.
2. Official school records remain archived and read-only to the former teacher.
3. Personal records may be exported or transferred after teacher confirmation.
4. A new school can invite the same platform user without copying the account.
5. The new school cannot automatically see records from the former school.

Export formats should include PDF, DOCX, XLSX/CSV and ZIP. Google Drive export should create an organized folder structure in the teacher's authorized Drive.

## 7. Temporary inspection access

Schools must be able to create temporary accounts for inspectors or education officers with:

- identity and organization;
- start and expiry time;
- read/write scope;
- permitted modules;
- download permission;
- reason for access;
- approving school administrator.

Expired accounts must stop working automatically. Temporary sessions should be visibly labelled and fully audited.

## 8. eRPH first-release scope

The first product release must support:

- teacher, class, subject and timetable data;
- DSKP/content standards and learning standards;
- reusable school and personal templates;
- current bilingual/multilingual output formats;
- learning objectives, activities, resources, assessment and reflection;
- draft, submission, review, revision, approval and archive states;
- version history;
- PDF/DOCX generation;
- Google Drive export;
- teacher dashboard;
- management dashboard;
- submission, approval and completeness reports;
- audit logs.

The existing Google Sheets formats are reference formats. Data storage must be normalized; final output must preserve the familiar school format.

## 9. DeepSeek integration

DeepSeek is a server-side assisted authoring service, not an automatic approval authority.

Flow:

```text
Teacher enters lesson context
  -> server checks login, school, role and AI quota
  -> server reads permitted curriculum data
  -> server calls DeepSeek
  -> server stores an AI draft and usage record
  -> teacher reviews and edits
  -> teacher submits the final lesson plan
```

AI usage must have monthly counters, daily limits, maximum input/output sizes, abuse controls and an audit trail. Free and paid plans can use the same service with different quotas.

## 10. Reports and dashboard

School dashboards should include:

- expected versus submitted lesson plans;
- pending, approved and revision-required counts;
- teacher and department submission rates;
- overdue submissions;
- review turnaround;
- completeness checks;
- AI usage and quota status;
- teacher records and school activity summaries.

The reporting layer must query the normalized database rather than scrape presentation templates.

## 11. Extensibility reserved for later

The platform core must support future modules without replacing identity, school, permission, files or audit systems.

Reserved modules:

- student profiles and enrolment;
- attendance;
- discipline records;
- achievement records;
- student documents;
- co-curricular activities;
- Panitia management;
- school events;
- student affairs;
- inspection management.

Future student data requires stricter field-level permissions, download controls, retention rules, transfer workflows and audit coverage.

## 12. Recommended database domains

```text
users
schools
school_domains
school_memberships
roles
permissions
role_permissions

teacher_profiles
employment_records
teacher_documents
teacher_training_records
teacher_duties
teacher_timetables
relief_records
textbook_records
exam_records
supervision_records

curriculum_items
school_curriculum_overrides
lesson_plan_templates
lesson_plans
lesson_plan_versions
lesson_plan_reviews

temporary_access_accounts
temporary_access_scopes
files
file_permissions
exports
transfers
drive_connections

audit_logs
notifications
subscriptions
ai_usage_logs
```

## 13. Delivery phases

### Phase 0: specification and migration design

- confirm the field dictionary and ownership rules;
- map the current Google Sheets formats;
- inventory current React/Firebase features;
- define migration and rollback plans;
- decide the final PHP hosting/runtime.

### Phase 1: platform core

- Laravel SSR foundation;
- SQL schema and migrations;
- authentication;
- schools and subdomains;
- memberships and permissions;
- school landing pages;
- audit logging;
- file abstraction;
- temporary access accounts.

### Phase 2: teacher records and school administration

- teacher profile and record cabinet;
- management roles;
- timetable and basic school records;
- school settings and templates;
- reports and dashboard foundations.

### Phase 3: eRPH

- curriculum library;
- lesson-plan editor;
- versioning;
- submission and approval;
- preserved output formats;
- PDF/DOCX and Google Drive export.

### Phase 4: migration and acceptance

- import selected existing data;
- validate records and permissions;
- run school-level acceptance tests;
- preserve old system as read-only fallback;
- switch production gradually.

### Phase 5: AI and subscription

- DeepSeek server-side integration;
- AI draft and review workflow;
- quota accounting;
- free/pro entitlements;
- payment integration after usage is validated.

### Phase 6: future education modules

- student records;
- discipline;
- co-curricular activities;
- Panitia;
- additional school administration modules.

## 14. Current repository transition

The current React/Vite/Firebase application is treated as a functional prototype and reference implementation. It should not receive major new AI, billing or student-data features before the SSR foundation and ownership model are approved.

Existing DSKP, language, template, PDF, dashboard and workflow knowledge should be migrated deliberately into the new PHP application.

## 15. Acceptance gates

No production release should be considered complete until:

- school-to-school data isolation is tested;
- every role has tested permissions;
- Owner support access is audited;
- temporary accounts expire correctly;
- teacher departure preserves official school records;
- personal export and transfer are tested;
- SSR works without required client-side JavaScript;
- DeepSeek keys are server-only;
- backups and restore are tested;
- current required output formats are visually accepted.

## 16. Executable technical baseline

### 16.1 Application stack

- Laravel 12 on the Plesk server's supported PHP 8.3 runtime.
- Blade templates for server-rendered HTML; Alpine.js or small vanilla modules only for progressive enhancement.
- MySQL or MariaDB using Laravel migrations, factories and seeders.
- Vite may remain as an asset compiler, but JavaScript must not become the application runtime or security boundary.
- Laravel queues and the Plesk scheduler are reserved for exports, notifications, AI jobs and maintenance tasks.

### 16.2 Request and tenant resolution

Every request passes through this server-side order:

```text
trusted proxy / HTTPS
  -> host normalization
  -> school subdomain resolution
  -> authenticated user session
  -> active school membership
  -> policy and permission check
  -> controller/service
  -> Blade SSR response
```

The application must reject unknown school hosts, inactive memberships and mismatched school context. Controllers must receive a resolved `School` object rather than accepting arbitrary `school_id` input.

### 16.3 Initial database constraints

- UUID or ULID primary keys for externally referenced entities.
- `school_id` on every school-owned table, with indexes for school and lifecycle status.
- Foreign keys and restrictive deletes for official records.
- Soft deletion only where retention policy permits it; official records are archived rather than silently deleted.
- Unique membership constraint on `(school_id, user_id)`.
- Unique school slug/subdomain and normalized Google provider subject.
- Timestamps, actor IDs and version numbers on records that can be reviewed or approved.

The first migrations must cover users, schools, school domains, memberships, roles, permissions, teacher profiles, curriculum items, lesson plans, lesson plan versions, reviews and audit logs before document or AI features are added.

### 16.4 Authentication and authorization baseline

Google Workspace OAuth/OIDC is implemented with a server-side callback, state/nonce validation and provider-subject matching. Email alone is never the account key. Session rotation occurs after login, and school membership is rechecked on every request.

Authorization uses policies and explicit permission names such as `school.users.view`, `teacher.records.view`, `lesson_plans.review`, `reports.export` and `support.access`. Platform Owner impersonation/support access requires a reason and creates an audit event before access is granted.

### 16.5 Deployment contract

The GitHub `main` branch deploys to Plesk through the configured GitHub push webhook. Deployment must run a controlled script with:

1. dependency installation from the lock file;
2. safe environment validation;
3. database migrations with a maintenance/compatibility strategy;
4. cache/config/route refresh;
5. queue restart when applicable;
6. a health check and deployment log;
7. a documented rollback target.

Secrets remain in Plesk environment/configuration and are never committed to GitHub. The first Laravel deployment must be staged under a non-production path or protected preview host before the domain is switched to the new document root.

### 16.6 Development order

The implementation order is deliberately strict:

1. framework skeleton and environment checks;
2. tenant host resolution and database migrations;
3. Google login, sessions and membership policies;
4. audit log and support-access controls;
5. school and teacher record cabinet;
6. lesson-plan workflow and preserved formats;
7. reports/dashboard queries;
8. export, Drive integration and AI quotas;
9. migration tooling and school acceptance.

No DeepSeek integration, billing flow or student module should be built before the first five items pass isolation and authorization tests.

### 16.7 Required automated checks

The new application must include tests for tenant isolation, host resolution, Google callback failure cases, role policies, temporary-account expiry, audit coverage, lesson-plan versioning and SSR responses without JavaScript. A deployment health endpoint must verify database connectivity, cache readiness and the active application release.

## 17. Implemented SSR baseline (2026-11-20)

The first executable baseline is now present under `ssr/`:

- Laravel 12 + Blade SSR application with school subdomain resolution;
- Google Socialite callback, Google stable subject binding, Workspace-domain check and membership check;
- school membership and audit-log foundation;
- polished SSR school landing page, sign-in page and authenticated teacher workspace;
- teacher profile cabinet foundation with employment lifecycle fields and extensible profile JSON;
- school-owned curriculum items;
- lesson-plan records with status, current version, version content, review decisions and approval fields;
- SQLite local test database, seed data and automated SSR/tenant/workspace tests.

The current demo workspace is intentionally a foundation, not a production migration. Real Google OAuth credentials, school-admin CRUD, role policies, existing RPH field mapping, export formats and Plesk document-root cutover remain acceptance gates before production switching.

Firebase is explicitly out of the new system scope. Laravel SQL is the sole production data source, authentication boundary and reporting source. The old Firebase project is not connected, migrated automatically or used for dual writes; its code remains only as historical reference.

The exact workbook field and workflow mapping is documented in `docs/RPH_FORMAT_MAPPING.md`, based on the supplied teacher and school-level Google Sheets. The current RPH version JSON remains extensible until all school-specific fields are migrated into the UI and renderer.

The SSR baseline now exposes `/health` with database status and `RELEASE_VERSION`; Plesk deployment checks must call this endpoint after migrations and cache refresh before any domain cutover.

The repository includes `scripts/deploy-ssr.sh` as the controlled Plesk hook. It installs locked production dependencies, runs migrations, refreshes Laravel caches and optionally fails the deployment when the configured `/health` response is not healthy.

Explicit role-to-permission mappings now live in `ssr/config/permissions.php`, with a `permission` middleware alias. New features should add a permission name first, then protect routes with that permission; role labels alone are not the long-term authorization contract.
