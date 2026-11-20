# RPH format mapping

Source workbooks inspected on 2026-11-20:

- Teacher workbook: `M41 1620112026` (`MENU`, `DATA`, `DSKP`, `SUBJEK`, timetable tabs)
- School submission workbook: `Borang Penghantaran eRPH 2026` (`DASHBOARD`, `REPORT`, `SEMAK ERPH`, `guru`, `CONFIG`)

## Existing format that must be preserved

### Teacher and lesson context

| Existing label | New data location | Notes |
| --- | --- | --- |
| NAMA GURU / 教师姓名 | `users.name`, `teacher_profiles` | Identity belongs to the school membership, not a free text lesson field. |
| MINGGU / 周次 | `lesson_plan_versions.content.week_no` | School configuration controls the active academic week. |
| TARIKH / 日期 | `lesson_plans.lesson_date` | Use a real SQL date and render the existing Malay/English display format. |
| KELAS / 班级 | `lesson_plans.class_name` | Preserve class labels such as `4B`, `5U`, `6B`. |
| MASA / 时间 | `lesson_plan_versions.content.start_time`, `end_time` | Timetable can prefill these values. |
| SUBJEK / 科目 | `lesson_plans.subject` | Link to curriculum/subject master data when available. |

### RPH teaching content

The `DATA` tab demonstrates the school’s existing content vocabulary. These fields should remain available in the structured version JSON so the renderer can reproduce the current output:

- `title` / Tajuk;
- `civic_value` and `civic_topic` / Pend. Sivik;
- `objectives` / learning objectives;
- `activities` / PdPc steps;
- `materials` / BBM;
- `emk`;
- `pak21`;
- `assessment_written`, `assessment_oral`, `assessment_observation`;
- `moral_values` / NILAI-NILAI MURNI;
- `student_count` / Bil Murid;
- `enrichment` / Pengayaan;
- `remedial` / Pemulihan;
- `kbat`;
- `multiple_intelligences` / Kecergasan Pelbagai;
- `reflection` and `notes` for lesson outcome and exceptions.

The current SQL schema already stores version content as JSON. This is intentional: stable ownership, date, subject, class, status and version number are relational; the school-specific RPH field dictionary remains extensible until all existing variants are mapped.

## School administration and reporting mapping

The second workbook is not only a report. It defines the school workflow:

- `CONFIG`: academic year, first deadline, total school weeks, submission weekday, active week, school name, administrator rotation and teacher directory;
- `guru`: a submission event log keyed by timestamp, identity number and week number;
- `SEMAK ERPH`: weekly submission/audit register, including deadline and teacher identity fields;
- `REPORT`: monthly teacher-by-week status (`tepati`, `lewat`, `TB`) and total submissions;
- `DASHBOARD`: active teacher count, submitted/not submitted, on-time rate, late/leave status, rotating reviewer and reminder message.

## Implementation consequence

The next report/dashboard migration should use SQL views or query services rather than copying spreadsheet formulas. The minimum reporting tables are:

1. `school_settings` for the `CONFIG` parameters;
2. `school_memberships` and `teacher_profiles` for the master directory;
3. `lesson_plans` and `lesson_plan_versions` for official RPH content;
4. `lesson_plan_submissions` for timestamp, week, deadline comparison and submission status;
5. `lesson_plan_reviews` for reviewer decisions and comments.

The existing `lesson_plan_reviews` table covers reviewer decisions; a dedicated submission table is the next schema addition before implementing the school dashboard.

## Privacy note

The source workbook contains identity-card numbers. These should not be used as the Google login key and should not be displayed to ordinary teachers. If retained for official school records, store them encrypted or masked, restrict them to authorised management roles and include every access in the audit log.
