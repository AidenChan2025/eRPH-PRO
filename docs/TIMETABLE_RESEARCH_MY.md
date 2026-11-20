# Malaysia school timetable research and future extension boundary

Research date: 2026-11-20

This document records the research only. It does not activate timetable generation in the current production scope.

## Executive recommendation

Keep the main product as PHP/Laravel SSR + SQL. Treat timetable generation as a future solver service behind an internal boundary:

```text
Laravel SSR / SQL
  ├─ school calendar, bell schedules, teachers, subjects, classes, rooms
  ├─ manual timetable editor and approval
  └─ /internal/timetable/solve contract
          ↓
    future Python OR-Tools CP-SAT worker
          ↓
    candidate timetable + hard/soft score + violations
```

The solver must never write directly to production tables. Laravel creates a versioned solve job, sends a normalized snapshot, receives a candidate, validates it again, and requires school-admin approval before publication.

## Reference comparison

### FET

FET is the best reference for a mature school-timetabling vocabulary and import/export shape. Its model is activity-centred: teachers, student groups, subjects, rooms, activities, activity splits and time/space constraints. It supports XML input/output and generated timetable views, and includes multilingual output including Malay and Chinese in its CLI options.

Use FET as a reference for:

- activity and split-activity concepts;
- hard versus soft time/space restrictions;
- explicit unavailable/break slots;
- an eventual FET XML import/export adapter.

Do not embed the FET desktop process into the PHP web request. It is better treated as an interoperability/reference path.

### OR-Tools CP-SAT

OR-Tools is the preferred future engine for this product because a Python worker can model school-specific constraints directly and remain separate from Laravel. Google's school scheduling example already models levels, sections, subjects, curriculum demand, teacher capacity/specialties and configurable time slots.

Use CP-SAT for:

- feasibility-first generation;
- hard constraints such as teacher/class/room conflicts;
- soft objective scoring such as gaps, workload balance and preferred times;
- partial re-solving after a teacher, room or period changes.

The worker should expose a narrow JSON contract, not a public unauthenticated API.

### Timefold / OptaPlanner

Timefold is a strong alternative when the organization wants a Java service and constraint streams. Its school example separates hard constraints (room, teacher and student-group conflicts) from soft constraints (room stability, fewer gaps and subject variety). It is technically sound, but adds a Java runtime to a PHP-centric Plesk deployment.

Decision: keep Timefold as a documented alternative, not the first implementation.

## Malaysia-specific constraints to model

### Calendar and working days

Do not hard-code Monday-Friday. School settings need a weekly pattern such as Monday-Friday or Sunday-Thursday, academic year, term dates, holidays, school week number and exceptional days. KPM groups Kedah, Kelantan and Terengganu as Sunday-Thursday schools; other listed states and federal territories follow Monday-Friday in the 2026 calendar reference.

Friday must be an ordinary configurable day whose periods can be shorter, not a special hard-coded rule. Ramadan, state calendars, school events and Friday prayer arrangements should be represented as date/session overrides.

### Single and dual sessions

Model `session` explicitly (`morning`, `afternoon`, or a school-defined value). A bell schedule belongs to a school and can optionally be scoped to a session, year level or class group. Shared rooms and cross-session teachers still need conflict constraints.

### Split and combined classes

Use a `teaching_activity` parent with one or more `activity_parts`. Each part can target a different student set, teacher and room while sharing a common time assignment. This supports Pendidikan Islam/Moral splits, language groups and merged elective groups without duplicating the business activity.

### Double periods and breaks

Represent duration as a number of contiguous slots plus a `must_be_contiguous` flag. Break/recess periods are explicit non-teaching slots. A double period may not cross a break boundary. This is a hard constraint, not a UI hint.

### Teacher workload and blocks

Store weekly maximum/minimum periods, daily maximum, maximum consecutive periods, unavailable periods, fixed blocks and preferences. Administrative roles and Ketua Panitia require their own workload profile rather than being treated as ordinary teachers.

### Guru Ganti / relief

Relief is a separate daily assignment problem over the published timetable. The first recommendation is a deterministic ranked candidate list, not an automatic final assignment:

1. teacher is free in the affected slot;
2. teacher is available in the correct session and location;
3. same subject or same year-level capability;
4. lowest relief count for the day/week;
5. no conflict with fixed duty, meeting or activity block;
6. administrator confirms and publishes the notice.

Every recommendation and final override must be auditable.

## Future SQL extension boundary

The current system already has school-scoped timetable slots for RPH time selection. The full timetable module should later add these tables without changing current teacher/RPH ownership:

- `school_calendars` and `school_calendar_exceptions`;
- `bell_schedules` and `bell_schedule_slots`;
- `sessions`;
- `subjects` and `subject_capabilities`;
- `student_groups` / class sets;
- `rooms` and room capabilities;
- `teaching_activities` and `teaching_activity_parts`;
- `teacher_workload_rules` and `teacher_unavailability`;
- `timetable_versions` and `timetable_entries`;
- `timetable_solve_jobs` and `timetable_solve_violations`;
- `relief_requests` and `relief_assignments`.

All future tables must have `school_id`, lifecycle status, timestamps and audit coverage. Published timetable versions are immutable; corrections create a new version.

## Internal API port

Reserve the following non-public contract namespace:

- `POST /internal/timetable/solve-jobs`
- `GET /internal/timetable/solve-jobs/{job}`
- `POST /internal/timetable/solve-jobs/{job}/approve`
- `GET /internal/timetable/versions/{version}`
- `POST /internal/relief/recommendations`

These routes must remain disabled until the timetable schema, permissions, rate limits, worker authentication and approval workflow exist. Current Phase 1/2 work only prepares the school-specific time configuration and extension point.

## Technology decision

1. Build manual timetable data and editor in Laravel SSR first.
2. Add a small Python CP-SAT worker only after representative school data is available.
3. Use FET XML as an import/export compatibility format where useful.
4. Keep all authority, tenant isolation, audit logs and publication approval in Laravel SQL.
5. Do not add React/Next.js or a Java solver runtime solely for the future timetable feature.
