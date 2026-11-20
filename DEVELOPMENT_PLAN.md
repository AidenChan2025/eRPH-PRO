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
