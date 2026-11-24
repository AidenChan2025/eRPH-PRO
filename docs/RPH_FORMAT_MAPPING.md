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
| TIMETABLE SLOT / 课表节次 | `lesson_plan_versions.content.slot_id` | Candidate create/edit flow validates the slot belongs to the current school and is active; a cross-school slot is rejected by a feature test. |
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

The current SQL schema already stores version content as JSON. This is intentional: stable ownership, date, subject, class, status and version number are relational; the school-specific RPH field dictionary remains extensible until all existing variants are mapped. The current candidate now captures additional workbook-observed fields in the version JSON and create/edit forms: semester, textbook reference, content/standard description, `content_1`/`content_2`, subtitle, learning outcomes, main/closing activity sections, topic, skills, SK/SP/TP standards, intervention reason, attendance present/total, teaching week and a tenant-checked timetable slot reference. These are implementation increments, not proof that every source condition, enum, repeated content column, report/print path or school-stage variant is complete.

### Additional read-only daily template observed (2026-11-21)

The view-only workbook `01. e-RPH TING6 17/10/2026` exposes nine tabs: `MENU`, five weekday sheets (`AHAD`, `ISNIN`, `SELASA`, `RABU`, `KHAMIS`), `RPT`, `DSKP`, and `DATA`. In the visible `AHAD` sample, the daily form has repeating class blocks and shows these distinct headings: date/day/week; class; semester; time; reference textbook; subject/form; `CONTENT 1`, `CONTENT 2` and further content columns; title and subtitle; learning outcomes; learning objective; activity, main activities and closing activities; reflection; intervention. The template also visibly links back to a menu and class/subject schedule.

The same sample's `RPT` sheet visibly carries subject, class, Tingkatan, week number, start/end date, Standard Kandungan (`SK`) and Standard Pembelajaran (`SP`). Its `DSKP` sheet reports a filtered region from A1 to Q10379 (17 columns and 10,379 sheet rows including the header). The visible raw column headings are `SUBJEK`, `TINGKATAN`, `TEMA/BIDANG/TERAS`, `tema2`, `TAJUK/KEMAHIRAN/NILAITERAS`, `tajuk2`, `SK`, `SP`, `NTERAS`, `TSIVIK:`, `OB`, `Pengetahuan`, `Sosioemosi:`, `Tindakan:`, a visually blank O column, `XTVT`, and `XTVT2`. Preserve raw source headers during later mapping; abbreviations/typos, blank/merged columns, semantic definitions, formulas, and data coverage need owner verification before normalization. Visible rows confirm the sheet contains curriculum entries, but row count is not a verified count of valid or unique curriculum records.

The sample `DATA` sheet reports 1,001 rows and 89 columns. Its visible merged header groups are `KELAS`, `MASA`, `TARIKH` (spanning the date columns), `MINGGU`, and `M.SIVIK` (spanning repeated weekly-theme columns). This indicates the source workbook combines class timetable/date/week context with civic-theme lookup values. Merged-column formulas, row-level validation, holiday/week calculation, and the relationship from this sheet into each weekday RPH were not audited; do not infer them from the header layout alone.

The current `LessonPlanController` and candidate create/edit views now expose a first increment of this structure, including semester, textbook reference, content/standard description, subtitle, learning outcomes, intervention, attendance, week number and separate main/closing activity fields. The legacy source still contains additional repeated content columns, subject/form and class-block context, richer validation/display conditions and stage-specific variants that remain unverified. A JSON version column and these new inputs do not by themselves prove field completeness, report/print fidelity or correct source conditions; those remain Phase 2 gates.

Scope limits: this observation is one read-only Tingkatan 6 workbook sample, not a complete audit of all school templates. The tab names and visible layout were observed; formulas, validation rules, hidden ranges, every class block, and AppSheet field/display conditions remain unaudited. The sample contains personal/official visual assets; they are not copied into this mapping or approved for product reuse.

### AppSheet navigation observed in the internal browser (2026-11-21)

The app's top-level menu separates `e-RPH`, `MODUL ADMIN`, and `MODUL GURU`. The `e-RPH` section lists workbook destinations for Tingkatan 6, Tingkatan 1–6, Tahun 1–6, PraSekolah, and KAFA, plus `Maklumat e-RPH` and AI/user-guide video links. This confirms that school type and level determine which RPH template is used; these variants must not be collapsed into one assumed field set.

The visible Admin menu includes `PENTADBIR E-RPH`, `SEMAKAN PENGHANTARAN e-RPH`, `ARKIB BILIK DARJAH`, setting up Google Classroom topics/assignments, submission schedules, submission review/record printing, teacher transfer/retirement handling, and JPN/PPD review. The visible Guru menu includes RPH submission, submitting e-RPH information, preparation and writing of daily RPH, replacement-day RPH, and user guides. Several entries are labelled `Open Url` and describe Google Classroom flow material; the menu alone does not prove a native AppSheet form or database write for those steps.

This pass verified navigation labels only. It did not open every linked form, source sheet, video, or destination; required fields, show-if expressions, valid-if rules, actions, formulas, and per-school role access remain unverified. Preserve this distinction in the Phase 0 traceability matrix.

### Source Sheet structure recheck (2026-11-22, Google Drive read-only)

The owner-provided native Google Sheet `M41 1620112026` was rechecked through Drive metadata and bounded header-cell reads. Its spreadsheet locale is `en_US` and its time zone is `Asia/Kuala_Lumpur`. Metadata lists 16 tabs: visible `MENU`, `MON`, `TUE`, `WED`, `THU`, `FRI`, and `DATA`; hidden `DAY 6`, six `Indirect D1`–`D6` lookup tabs, `DSKP`, and `SUBJEK`. The weekday sheets' first-row cells include formulas linking back to `MENU`; this is not a full formula or timetable audit. Source URLs and file IDs are intentionally kept out of this public repository.

The `DATA` first row includes these raw labels: `KELAS`, `Masa`, `Tarikh`, `MINGGU`, `Pend.Sivik`, `Darjah`, `Pengesahan`, `Nilai Teras Sivik`, `Tajuk Sivik`, `Catatan`, `BBM`, `EMK`, `PAK21`, `Bertulis`, `Lisan`, `Pemerhatian`, `NILAINILAI MURNI`, `Bil Murid`, `Pengayaan`, `Pemulihan`, `KBAT`, and `Kecergasan Pelbagai` (with blank columns between some labels). The `DSKP` first row visibly labels columns B/C `内容标准 sk` and `学习标准 sp`; its other columns and content were not read in this pass.

The hidden `SUBJEK` tab's first row spans 60 columns, with 55 non-empty cells. In column order, the complete non-empty raw sequence is: `SUBJEK`, `TARIKH`, `HARI`, `MINGGU`, `DISAHKAN OLEH`, `KELAS`, `MASA`, `HINGGA`, `SUBJEK`, `TINGKATAN`, `TEMA/BIDANG`, `TAJUK`, `STANDARD KANDUNGAN`, `STANDARD PEMBELAJARAN`, `Pada akhir pengajaran dan pembelajaran,muridmurid dapat:`, `AKTIVITI P&P`, `STRATEGI P&P`, `KAEDAH P&P`, `BAHAN BANTU MENGAJAR`, `AKTIVITI PAK21`, `TAHAP PENGUASAAN`, `EMK:`, `PENGAYAAN`, `NILAINILAI MURNI`, `[blank column 25]`, `KEMAHIRAN BERFIKIR`, `KECERDASAN PELBAGAI`, `PENILAIAN/ PENTAKSIRAN`, `Penilaian dan pentaksiran untuk standard pembelajaran di atas telah dilakukan kepada semua pelajar dengan memberikan:`, `Latihan  bertulis / Lembaran kerja`, `Pemerhatian`, `Amali`, `Soal jawab / kuiz`, `REFLEKSI & IMPAK`, `murid berjaya dan dapat:`, `PEMULIHAN`, `murid berjaya dan dapat`, `daripada`, `OBJEKTIF PEMBELAJARAN`, `AKTIVITI`, `Bertulis`, `Lisan`, `Pemerhatian`, `NTERAS`, `TSIVIK`, `Catatan`, `Pengetahuan:`, `Sosioemosi:`, `Tindakan:`, `murid`, `PSIKOMETRI`, `KOGNITIF:`, `AFEKTIF:`, `RBT`, `KELAS`, followed by blank columns through column 60. Repeated headings, explanatory text, blank positions, and apparent truncations are source evidence; preserve these in the full mapping and do not normalize their meaning from labels alone. A visible validation cell in `MENU` uses `ONE_OF_RANGE` with the named range `=pengesahan`; this confirms one dropdown source only, not the complete validation or show-if rules.

Only sheet metadata, the first five menu rows, and bounded first-row/header cells were read in this pass; no teacher or student record rows, sharing controls, or permissions were changed. Validation-only metadata was subsequently inspected across the bounded `MENU`, `DATA`, and `SUBJEK` grids, as recorded below. The full Phase 0 source audit remains open: lower-row formulas, lookup values and named-range definitions, actions, AppSheet form conditions, roles, and cross-sheet lookup behavior remain unverified. Some raw source headings appear truncated or inconsistent (for example `NTERAS` and `TSIVIK`); their intended meanings need source-owner confirmation.

Validation metadata was then read across the bounded `MENU`, `DATA`, and `SUBJEK` grids with a field mask that returned validation rules only, not cell values. `MENU` contains 151 validated cells: 36 strict dropdowns referencing `DATA!A2:A31`, 72 strict dropdowns referencing `DATA!B2:B15`, 36 strict dropdowns referencing `SUBJEK!A3:A92`, one dropdown referencing named range `pengesahan`, and six `DATE_IS_VALID` rules. `DATA` contains 61 `DATE_IS_VALID` rules; no validation rules were present in the inspected `SUBJEK` grid. These counts describe validation cells, not the number of unique or populated options. The range references connect the `MENU` form to class, timetable and subject lookup areas, but the lookup values, date formulas, named-range definition, conditions that reveal fields, and server-side equivalents remain unverified. Do not expose or reproduce individual class/subject options in the product specification; model them as school-scoped reference data and enforce equivalent validation server-side.

### KPM 2026 workbook metadata comparison (2026-11-22, Google Drive read-only)

Drive search and spreadsheet metadata identified three relevant files:

- `02. e-RPH SR KPM 08/01/2026 v2` (copy): Drive search reports last modified `2026-01-09T03:47:02Z`. It has `MENU`, five Malay weekday tabs (`ISNIN`–`JUMAAT`), `RPT`, `DSKP`, and `DATA`; locale `en_MY`, time zone `Asia/Kuala_Lumpur`. The weekday grids declare 166 columns each; `RPT` declares 74 columns; `DSKP` 56,813 rows × 17 columns; `DATA` 1,001 rows × 89 columns. These are grid dimensions, not counts of populated or valid records.
- A second same-title v2 copy was later found. Drive search reports last modified `2026-01-09T03:49:39.369Z` and `shared=true`; that is 2 minutes 36 seconds later than the first copy, but does not identify its recipients or prove it is the AppSheet-connected source. Metadata confirms the same nine tabs, all visible, and identical declared grid dimensions. In bounded formula/validation-only reads of `RPT!A1:BV30` and `DATA!A1:CK100`, both copies have identical formula coordinates/content and identical validation metadata: RPT has 107 formulas and 92 validation cells; DATA has one formula and 97 validation cells. This establishes parity only in those sampled ranges, not full workbook equivalence, source ownership, AppSheet linkage, or curriculum licensing.
- `00. Maklumat e-RPH KPM 2026` (copy): Drive search reports last modified `2026-01-09T03:47:33Z`; it has five tabs (`Menu`, `1`–`4`), but spreadsheet time zone is `Asia/Hong_Kong`. Do not use this copied workbook's timezone as the product's school-calendar setting; school and production time zones must be explicit and validated.
- `Borang Penghantaran eRPH 2026`: Drive search reports last modified `2026-11-22T00:44:18Z`. It has `DASHBOARD`, `REPORT`, `SEMAK ERPH`, `SEMAK ERPH (DRIVE)`, `guru`, `CONFIG`, and hidden `guru_clean`; locale `en_US`, time zone `Asia/Kuala_Lumpur`. Its presence confirms a separate 2026 submission/review workbook structure; metadata alone does not prove the formulas, access rules, or current operational use.

- `02. e-RPH SR KPM 06/01/2026（副本）`: Drive search reports a copy created on 2026-01-06; it is not shared according to the returned metadata. It has `MENU`, five Malay weekday tabs (`ISNIN`–`JUMAAT`), `RPT`, `DSKP`, and `DATA`; locale `en_MY`, time zone `Asia/Kuala_Lumpur`. Declared grid sizes are 3,184 × 166 for each weekday, 4,063 × 74 for `RPT`, 56,813 × 17 for `DSKP`, and 1,001 × 89 for `DATA`. These are allocated grid dimensions, not counts of populated or valid records. This separately titled copy must not be treated as the AppSheet-connected or authoritative KPM workbook without a verified source link.
- `e-RPH v7.1 - 2026`: Drive search reports last modified `2026-10-05T01:07:05Z`. It has 16 tabs: visible `MENU`, `MON`–`FRI`; hidden `DAY 6`, `DSKP`, `SUBJEK`, `DATA`, and six `Indirect D1`–`D6` lookup tabs. `DSKP` declares 6,819 × 26 cells; hidden `SUBJEK` declares 92 × 60 and `DATA` 1,000 × 24. Its time zone is `Asia/Kuala_Lumpur`. Metadata confirms a richer hidden lookup and six-day structure than the KPM copy, but does not prove it is the current workflow or establish equivalence with KPM curriculum data.

For both newly inventoried workbooks, only Drive search metadata and spreadsheet properties/tab names/grid dimensions were read. No cell values, personal records, sharing controls, or permissions were accessed or changed. Do not merge their schemas or treat either as the canonical import source until the AppSheet data-source connection and source-owner/version relationship are verified.

Google Drive URLs and native file IDs are excluded from this public mapping; retain source references in the owner's Drive/AppSheet records.

The KPM 2026 `DSKP` header shape and blank column are recorded in the later **KPM 2026 DSKP field-header inventory**; preserve that raw schema and source/version identity. A bounded attempt to read the `DATA` header at row 2 returned one template-content row because the actual header layout was not established; its values were not retained or used for requirements. No person-identifying information was sought, and no workbook cell, share setting, or permission was changed.

The `DATA` row 1 header was then read explicitly to resolve the lookup references. Its lookup/configuration labels, preserving column positions, are: `A KELAS`, `B MASA`, `D BBM`, `E EMK`, `F NILAI-NILAI MURNI`, `G xx`, `H T-THINK`, `I KECERDASAN PELBAGAI`, `J KAEDAH `, `K KBKK`, `M STRATEGI`, `N BIL MURID`, `O PENGESAHAN`, `P ALAT PEMIKIRAN`, `Q Bertulis`, `R Lisan`, `S Pemerhatian`, `T PENGAYAAN`, `U PEMULIHAN`, `V XPNP`, `W TARIKH`, `X MINGGU`, and `Y M.SIVIK`; columns C and L are blank in this header region.

The same row defines a detailed submission/RPH header block from `AB` through `CG`: `AB BIL`, `AC SUBJEK`, `AD TARIKH`, `AE HARI`, `AF MINGGU`, `AG MINGGU PEND. SIVIK:`, `AH KELAS`, `AI MASA`, `AJ HINGGA`, `AK SUBJEK`, `AL TAHUN`, `AM TEMA/BIDANG/ TAJUK`, `AN TAJUK`, `AO STANDARD KANDUNGAN`, `AP STANDARD PEMBELAJARAN`, `AQ Pada akhir pengajaran dan pembelajaran,murid-murid dapat:`, `AR AKTIVITI P&P`, `AS STRATEGI P&P`, `AT KAEDAH P&P`, `AU BAHAN BANTU MENGAJAR`, `AV ALAT PEMIKIRAN`, `AW TAHAP PENGUASAAN`, `AX EMK:`, `AY PENGAYAAN`, `AZ NILAI-NILAI MURNI`, `BA KRETERIA KEJAYAAN`, `BB KEMAHIRAN BERFIKIR`, `BC KECERDASAN PELBAGAI`, `BD PENILAIAN/ PENTAKSIRAN`, `BE Penilaian dan pentaksiran untuk standard pembelajaran di atas telah dilakukan kepada semua murid dengan memberikan:`, `BF Latihan  bertulis / Lembaran kerja`, `BG Pemerhatian`, `BH Amali`, `BI Soal jawab / kuiz`, `BJ REFLEKSI`, `BK murid berjaya dan dapat:`, `BL Intervensi:`, `BM murid berjaya dan dapat`, `BN daripada`, `BO OBJEKTIF PEMBELAJARAN`, `BP AKTIVITI`, `BQ Bertulis`, `BR Lisan`, `BS Pemerhatian`, `BT NTERAS`, `BU TSIVIK`, `BV MINGGU`, `BW Pengetahuan:`, `BX Sosioemosi:`, `BY Tindakan:`, `BZ KELAS`, `CA PSIKOMETRI`, `CB KOGNITIF:`, `CC AFEKTIF:`, `CD ASPEK`, `CE AKTIVITI UTAMA`, `CF AKTIVITI PENUTUP`, and `CG CATATAN`. Columns `Z`–`AA` and `CH`–`CK` are blank in this row. Preserve the raw spelling, repeated columns and explanatory text; this is header evidence, not proof that every field is displayed or required in every form.

A keyword-filtered scan of `MENU!A1:AY60` retained only form headings: `J1 Minggu/ MP SIVIK`; row 5 has `C KELAS`, `D MASA`, `F SUBJEK`, `G TAHUN`; row 35 has `C KELAS`, `F SUBJEK`, `G TAHUN`; and row 45 repeats the row-5 set. A school-identifying title cell was excluded from the mapping. These headings corroborate the class/time/subject/year lookup structure but do not explain the blank/merged cells, the difference between repeated sections, or conditional visibility.

In the `ISNIN` daily template's frozen/header region, cells `H1`/`H2`/`H3`/`H4` and `J1`/`J2`/`J3`/`J4` label eight class blocks (`KELAS 01`–`KELAS 08`). Row 5 repeats the trio `SUBJEK/TINGKATAN`, `TEMA/ BIDANG PEMBELAJARAN`, and `TAJUK` across eight blocks. In `RPT`, row 6 includes repeated `SUBJEK/TINGKATAN` and `SP` headings across the annual/weekly grid. This establishes a multi-class daily layout and repeated curriculum-alignment columns in the visible structure; it does not establish every lesson field, slot assignment, formula, validation, or relationship to the RPH body. The read was limited to rows 1–6 of `ISNIN` and rows 1–7 of `RPT`, and only matched field headings were retained.

Validation-only metadata was then sampled from `MENU!A1:AY60`, each weekday tab `ISNIN`–`JUMAAT` in `A1:FJ40`, `RPT!A1:BV30`, and `DATA!A1:CK100` (no entered/effective cell values in these reads). The sampled areas contain respectively 200 MENU, 44 per weekday, 92 RPT, and 97 DATA validation cells. In `MENU`, class/time lists refer to `DATA!A2:A` and `DATA!B2:B`, subject choices refer to `DSKP!A3:A`, and 40 additional dropdowns refer to per-column lookup lists in the `MENU` grid. Daily-sheet rules link fields to same-sheet columns and to `DATA` lookups; `RPT` rules link to `DSKP` and its `O`/`P`/`Q` lookup columns, alongside seven literal-list rules; sampled `DATA` rules link to `DSKP!A3:A`. The five daily sheets have the same count of 44 rules in the sampled rectangle, but their references are not identical: for example, `KHAMIS!B31` points to `ISNIN!AG6:AG`, while the corresponding `B31` rules on the other four days point to their own `AG` columns. This may be intentional, but the source owner should confirm it before implementation. These are rule-cell counts inside the specified sample rectangles, not full-sheet totals. Literal choice values were intentionally omitted. This evidence supports a dependent lookup/validation layer in the KPM spreadsheet; it does not identify AppSheet `Show_If` conditions, prove how the app writes to these sheets, or define each referenced list's meaning. Those must be confirmed separately before translating the rules into server-side validators.

A formula-free follow-up of the same validation metadata recorded the exact range-reference families without retrieving dropdown values. Within the bounded samples:

| KPM sheet/range | Rule-cell counts | Referenced range families observed |
| --- | ---: | --- |
| `MENU!A1:AY60` | 200 `ONE_OF_RANGE` | `DATA!A2:A` ×25; `DATA!A2:A230` ×15; `DATA!B2:B` ×65; `DATA!B2:B230` ×15; `DSKP!A3:A` ×40; 40 per-column local `MENU` helper ranges across `L:AY` |
| Each of `ISNIN`–`JUMAAT` in `A1:FJ40` | 44 `ONE_OF_RANGE` | 31 per-day local helper-range rules and 13 `DATA` lookup rules (`N2:N` ×10, `U2:U` ×1, `V2:V` ×2). The `KHAMIS` `B31` rule is the one cross-day exception: it points to `ISNIN!AG6:AG`; the other four point to their own `AG` columns. |
| `RPT!A1:BV30` | 85 `ONE_OF_RANGE`; 7 `ONE_OF_LIST` | `DSKP!A3:A` ×1; local helper ranges `O7:O` ×1, `P7:P` ×42, `Q7:Q` ×41. Literal list entries were not read. |
| `DATA!A1:CK100` | 97 `ONE_OF_RANGE` | `DSKP!A3:A` ×97 |

No `CUSTOM_FORMULA` validation rule appeared in these bounded areas. Several daily-sheet helper-range endpoints differ (including open-ended and row-bounded ranges); preserve the exact source range per field rather than normalizing them by assumption. This is Google Sheets data-validation metadata only; it is not a complete audit of formulas, named-range definitions, AppSheet `Valid_If`/`Show_If`, role visibility, or submit-time server rules. The metadata API did not return named-range definitions, so those remain unverified.

KPM 2026 SR workbook metadata lists nine tabs—`MENU`, `ISNIN`, `SELASA`, `RABU`, `KHAMIS`, `JUMAAT`, `RPT`, `DSKP`, and `DATA`—but this metadata response omits each sheet's `hidden` property, so tab visibility (including `DSKP`) is unverified for this copy. This is a different workbook from the separately sampled Tingkatan 6 file, whose daily tabs run Sunday–Thursday (`AHAD`–`KHAMIS`). Treat these as edition/stage-specific calendar shapes, not contradictory universal rules; school calendar/session settings must select the applicable working days and holidays.

The files' “copy” labels and provider modification times do not establish which is the authoritative KPM source or the latest approved edition. The Drive listing reported `M41 1620112026` modified at `2026-11-22T00:44:08Z`, shortly before the 2026 submission workbook, while the KPM RPH copy was last modified in January. Modification dates describe Drive files, not substantive KPM approval or which file the owner currently uses. For now, use the KPM 2026 copy as a primary format reference, `M41 1620112026` as the owner's current working-format reference, and the 2026 submission workbook as an Admin/reporting reference. Keep their differences visible until the source owner confirms canonical versions, rights, formula/condition behavior, and update responsibility; do not merge or overwrite one schema with another based only on tab names or row/column counts.

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

## Official KPM guidance observed in the internal browser

The Google Sites page `e-RPH KPM > Garis Panduan` embeds **Garis Panduan Penyediaan Rancangan Pengajaran Harian Secara Dalam Talian (e-RPH), Kementerian Pendidikan Malaysia**. The visible page-12 flowchart distinguishes:

- annual planning (`Sheet RPT`): subject, class, year/level, date, Standard Kandungan and Standard Pembelajaran;
- daily planning (`Sheet harian`): Tema/Bidang/Tajuk, Standard Kandungan, Objektif, Aktiviti, Refleksi and Intervensi.

This is an additional official-format completeness check; it does not replace mapping every field and condition from the supplied teacher/admin workbooks and AppSheet forms. The source site's notice says its content is for official use, protected by KPM copyright, and may not be copied, modified or distributed without permission. Therefore this guidance is used as a requirements reference only; do not republish its PDF, graphics or copied text in the product without documented rights. Full 15-page text and all appendices have not yet been transcribed or audited.

### AppSheet 管理模块流程样本（2026-11-21，内部浏览器只读）

AppSheet `MODUL ADMIN` 实际菜单包含 e-RPH 管理、提交审查、班级归档、Google Classroom 教师/Topic/Assignment 管理、周提交排程、提交记录审查/打印、教师转校或离职处理、JPN/PPD 检查等入口。逐项观察到的内容多为 `Open Url`，因此菜单只能作为功能范围证据，不能当作 AppSheet 内部数据表单或持久化行为证据。

已打开“建立 e-RPH 提交排程”对应的只读 Google Slides 操作说明。该流程在 Google Classroom 以周次任务为单位设定适用班级、开放时间、截止时间和提交 Topic，并允许把设置复制到多个班级。此确认了学校 Admin 侧提交窗口配置与 Google Classroom 任务的耦合，尚未核实实际 Classroom 配置、AppSheet 表达式、跨周复制边界或异常/补交规则。后续 SSR 需保留这些业务条件并记录学校时区、班级范围、开放/截止时点、覆盖既有规则时的确认与审计；集成未授权/不可用时应提供可追踪的手动操作路径。

对该 Slides 的可见逐页文字再核验补充：管理员先创建周次 Assignment，填写如 `MINGGU 38 (7-11/1/2024)` 的标题、提交说明、`02. Penghantaran e-RPH` Topic、截止日期与按钮开放/激活日期；随后选择所有适用班级，并选择立即 Assign 或 Schedule；排程页再次设置 activate date/time、due date、Topic，使用 `Copy settings to all` 把相同配置应用至各班后 Schedule。日期示例为培训材料样本，不是平台默认政策。此证据补足了“两种时间字段 + Topic + 班级范围 + 跨班复制”的操作顺序；仍未证明 AppSheet 直接持久化这些字段，实际 Classroom 任务配置、失败/部分复制处理、时区和跨周/假期例外尚未取证。

仍待核验：实际表单目标、各角色显示条件、必填和枚举、数据源表与公式，以及管理员其余流程材料。未以菜单名称推断这些规则已存在。

### AppSheet 提交审核操作样本（2026-11-21，内部浏览器只读）

只读打开 `3.1 Modul Semakan Penghantaran` 流程说明：审核员先通过 DELIMa 认证并进入 Google Classroom 的 Classwork/Assignment；已提交教师出现在已交列表，截止后仍未提交者通过 `Assigned` 名单识别为 `Missing`。说明给出逐份审核和批量审核两种路径：为已提交作业设置 1/1 分数、填写审核评语并执行 Return；批量路径对已提交项一起评分/Return。材料同时要求创建 Assignment 时配置满分为 1。该流程要求区分“已分配但缺交”与“已提交待审核”，并保留评分、评语、审核人、Return 时间及单份/批次处理结果；批量失败须能逐条显示并重试，不能把部分成功伪装成全批成功。当前材料没有说明退回修改、迟交补交、重新提交、取消任务、申诉或复核规则，也未证明所有学校采用 1 分评分；这些须通过学校政策配置并以未核验状态保留，不能把教学资料的建议分值硬编码为平台规则。

### RPT 周报告样本增量（2026-11-21，内部浏览器只读）

只读工作簿中的 `RPT` 标签已实际打开。可见页面包含教育部/学校/学年上下文、学科字段，以及按周排列的周次、日期区间和 `STANDARD KANDUNGAN` 等内容区；每周块使用多行与合并单元格组织。表格提供 7 天 × 每周的记录视图，实际显示范围为 2,967 行、74 列。该视图证实周报告不仅是汇总数字，还保留周次和日期上下文并承载标准内容。当前仅核对页面可见结构，尚未逐字段核验隐藏列、公式、数据验证、各班/学科重复区块和打印分页；不能把 2,967 × 74 当作业务记录数。个人识别照片与姓名未复制进产品映射。SSR 周报告需以规范字段和可打印版式复现必要业务字段，而非照搬原工作簿的视觉网格。

`RPT` 日期公式抽样：合并单元格 `B10:B12` 是人工输入的周起始日期，单元格注释要求仅在此处输入日期；对应合并单元格 `C10:C12` 的可见公式为 `=B10+4`，生成周结束日期。该样本的范围为周一至周五，结束日期依赖起始日期而非单独编辑。此为一个报告周的直接公式证据；下一步仍需抽样后续周、节假日/Group A 周日开课等日历边界，不能将简单 `+4` 推广到所有学校日历。SSR 应以学校周组别和日历配置计算日期，并避免与实际授课日历冲突。

连续周日期公式抽样：第二个周起始日期的合并区 `B13:B15` 使用 `=C10+3`，即以前一周结束日为基准加 3 天，形成下周周一；结合 `C10=B10+4`，该模板通过公式递推普通周一至周五周次。该逻辑没有在此公式中处理假期、校历差异或 Group A 日历，后续仍需核对学校日历规则与例外处理。

### e-RPH 模板入口与只读边界（2026-11-21，内部浏览器）

AppSheet `e-RPH` 菜单显示 Tingkatan 6、Tingkatan 1–6、Tahun 1–6、PraSekolah、KAFA 五类入口，并另列 e-RPH 信息、Gemini AI 使用指南和用户指南；这些条目标示 `Open Url`，菜单中的 “Siap” 状态只说明入口标记，不证明对应 SSR 结构或数据导入已完成。打开 Tingkatan 6 与 Tingkatan 1–6 入口后，Google Sheets 均要求先创建个人副本，并提示随副本一并复制附加 Apps Script。该副本步骤会写入 Drive 并复制脚本，未执行；前述两个入口对应工作簿的完整字段/公式因此保持未核验。仅用已可只读打开的 Tingkatan 6 样本作有限字段映射，不能代表所有年级、学段或 KAFA 模板。

### 教师转校与班级归档操作材料（2026-11-21，内部浏览器只读）

只读查看 AppSheet `MODUL ADMIN` 菜单所链接的 `4.1 Modul Guru-Berpindah, Bertukar Classroom, Bersara dan lain-lain` Google Slides。材料要求转校教师在 Drive 的 Classroom 文件夹内建个人 e-RPH 文件夹，将旧校 e-RPH 资料移入；之后加入新校 Classroom 并从新周次继续提交。旧校管理员移除教师账号前应先确认资料已迁移，材料建议记录保留至当前学年结束，并提示移除会影响教师记录的显示。以上是培训材料的建议步骤，不是经验证的 Google Classroom 删除/保留契约。SSR 应结束旧校 membership、保存旧校教案/审核历史及审计关联，再独立建立新校 membership；人员转校不得级联删除历史内容，归档须可恢复并有明确保留期限、授权导出及操作记录。

同一菜单的 `ARKIB BILIK DARJAH` 链接在本次只读打开时返回 Google Docs `Access denied`。因此班级归档的具体字段、操作步骤、恢复能力和保留期限尚未核验；需取得可查看的权限材料或检查对应 AppSheet 表单/数据源后再映射，不依据菜单标签补造规则。该源材料缺口保留在 Phase 0。

### e-RPH Tingkatan 6 工作簿表结构取证（2026-11-21，内部浏览器，只读）

在账号已有的只读 Google Sheets 标签页中检查 `01. e-RPH TING6 17/10/2026`，确认工作簿含 9 个标签：`MENU`、`AHAD`、`ISNIN`、`SELASA`、`RABU`、`KHAMIS`、`RPT`、`DSKP`、`DATA`。Google Sheets 显示 `MENU` 为 3,624 行 × 51 列，`AHAD` 为 3,184 行 × 166 列，`DSKP` 为 10,379 行 × 17 列；这些是工作表尺寸，不是业务记录数。未读取或导出课程记录/教师个人资料，也未创建副本、请求权限或编辑工作簿。该样本中 DSKP 可见 17 个标题位置：`SUBJEK`、`TINGKATAN`、`TEMA/BIDANG/TERAS`、`tema2`、`TAJUK/KEMAHIRAN/NILAITERAS`、`tajuk2`、`SK`、`SP`、`NTERAS`、`TSIVIK:`、`OB`、`Pengetahuan`、`Sosioemosi:`、`Tindakan:`、一个空标题列、`XTVT`、`XTVT2`。它补充了 Tingkatan 6 单一工作簿的数据结构证据，不证明完整语义、条件、参考枚举、其它年级/学段兼容、生产 `dskp_standards` 已完整导入，或字段可公开分发。原工作簿 AHAD 页可见个人身份内容迹象，已停止探索正文单元格；后续须用合成/脱敏样本、表单配置只读检查或获权利审核的结构导出完成字段/公式矩阵。

AppSheet `MODUL ADMIN` 顶层实际视图只读可见管理/审核/归档主入口及 Classroom 建立/邀请、Topic/Assignment、周排程、提交审核/打印、教师转校/离职、JPN/PPD 检查等材料链接；这些主要是 `Open Url` 教学资源，不是可验证的 AppSheet 写表单。`e-RPH` 顶层目录链接 Tingkatan 6、Tingkatan 1–6、Tahun 1–6、PraSekolah、KAFA 模板及操作指南；菜单显示“Siap”仅为来源应用的状态标签，不证明 SSR 字段实现或数据迁移完成。实际 Admin/Guru 表单的显隐条件、必填、枚举、Valid_If/Initial value/App formula、动作及落库位置继续标为未验证。

只读查看同一工作簿 `DATA` 页（2026-11-21）：页面显示 1,001 行 × 89 列；因合并单元格，键盘从 B1 右移跳至 W1。可见表头 `A1=KELAS`、`B1=MASA`、`W1=TARIKH`、`X1=MINGGU`；`W1` 注释为“SETTING TARIKH MINGGU DI SINI”。该结构支持班级、时段和每周日期配置这一待建模方向，但不是完整课表/配置字段清单；未读取数据行、注释之外的公式、验证规则或 AppSheet 显示条件，因此日期边界、每周 5 天约束及教学日历逻辑仍待取证。

### 用户长期使用版与 KPM 较新完整样本的差异对照（2026-11-21，内部浏览器只读）

Owner 提供的长期使用工作簿 `M41 1620112026` 与 KPM 样本 `01. e-RPH TING6 17/10/2026` 是两个不同版本，不能把前者当作仅有旧视觉的副本。

| 项目 | 长期使用版 `M41 1620112026` | KPM Tingkatan 6 样本 | 对产品的约束 |
|---|---|---|---|
| 可见日页 | `MON`–`FRI` | `AHAD`–`KHAMIS` | 两种马来西亚校历组都须支持；不能统一写死周一至周五或周日至周四。 |
| 工作簿页数 | 7 个可见页，另有 9 个隐藏页 | All Sheets 显示 9 页，未见隐藏页 | 隐藏页是旧版独有实现线索，未展开/取消隐藏；其公式、依赖和有效条件仍须在获准的脱敏副本中审查。 |
| 隐藏辅助页 | `indirect D1`–`indirect D6`、`DAY 6`、`DSKP`、`SUBJEK` | DSKP 与 RPT 为显式独立页；5 个周日/工作日 RPH 页 | 旧版存在第六日和间接引用/查找结构的线索；须核实是否为有效选项以及使用条件，不可在迁移时删除。KPM 样本的 DSKP/RPT 作为较完整的课程/年度计划基线。 |
| DATA 配置宽度 | 1,000 行 × 24 列；表头 `KELAS`、`Masa`、`Tarikh`、`MINGGU`、`Pend.Sivik` | 1,001 行 × 89 列；包括按日历日期跨度与重复周主题区 | 旧版 `Pend.Sivik` 与 KPM `M.SIVIK` 的字段粒度/语义须映射；不以同名近似字段直接合并。 |
| 日页尺寸样本 | `MON` 251 行 × 12 列 | `AHAD` 3,184 行 × 166 列 | 尺寸仅代表表格布局/范围，不能当作业务记录或字段覆盖度；须抽取两版的标签/验证/打印条件后对照。 |

Google Sheets 对旧版显示“Anyone with the link can access. No sign-in required.”；共享权限具体角色未核实，不能据此认定其为只读。该表标题相同于前述源工作簿名，但本次直接链接结构不同，故以用户提供链接的当前现场为准，并保留早前版本证据作待核差异。工作簿内可能有个人/学校信息；未查看数据行、未创建副本、未请求修改权限、未调整分享设置。Owner/数据负责人应先确认公开链接的预期范围；在确认/授权并准备脱敏只读副本前，不导出或迁移正文。KPM 较新完整样本作为规范字段与来源参照，长期使用版的隐藏字段/规则作为不得丢失的兼容需求；只有逐项完成双向映射并经人工确认后才可归并。完整 AppSheet 条件、隐藏页公式、Day 6 使用条件、两种版本独有字段与打印行为仍是 Phase 0 未完成证据。

### Guru 模块菜单与流程链接访问情况（2026-11-21，内部浏览器只读）

从 AppSheet 顶层菜单打开 `MODUL GURU`，实际菜单可见五项核心任务：`PENGHANTARAN e-RPH`、`PENGHANTARAN MAKLUMAT e-RPH`、`PENYEDIAAN e-RPH`、`PENULISAN RANCANGAN PENGAJARAN HARIAN`、`PENULISAN RANCANGAN PENGAJARAN HARIAN UNTUK HARI GANTIAN`；另有 Guru-as-Students 视频和模块说明。打开前五项对应流程链接后，目标均为 Google Docs；当前账号 `[redacted Google account]` 对页面显示 `You need access`。未发出 Request access、未更换账号或操作用户数据。故菜单可作为任务范围证据，但提交、资料字段、显示条件、RPH准备/保存/提交及代课任课人/原任教师/原课表关联规则均不能从这些受限文档确认。Phase 0 需由资料所有者授予最小只读权限或提供等价可审阅导出；不要把这些访问失败解释为文档不存在，也不要用单本 TING6 workbook 猜测缺失流程。

### Owner 补充的长期校本工作簿结构核验（2026-11-21，Google Drive 连接器只读）

Owner 另提供 `M41 1620112026` Google Sheets 链接。只读读取文件元数据与有限结构范围，确认 16 个工作表：`MENU`、`MON`–`FRI`、`DAY 6`、`DSKP`、`SUBJEK`、`DATA` 及 `indirect D1`–`D6` 辅助页；其中 `DAY 6`、`DSKP`、`SUBJEK` 与间接引用页为隐藏标签。该工作簿的页签元数据记录 `MENU` 71×26、工作日页约 249–251×12（`WED` 20 列）、`DSKP` 6,819×26、`SUBJEK` 92×60、`DATA` 1,000×24；均为网格尺寸，不代表有内容的记录数或覆盖完整度。

`SUBJEK` 前 15 个字段含序号、日期、星期、周次、审核者、班级、起止时间、科目/年级/主题、SK、SP 与学习目标；周一样本可见日程、科目和“提交 eRPH”入口。`DSKP` 的前三列为年级/科目、内容标准（SK）和学习标准（SP），可见中文低年级华语内容。`MENU` 顶部可见提交入口与教师/周次信息。数据正文只抽取上述少量范围；发现其中含可识别的学校/人员信息后停止扩大读取，未读取教师/学生数据行、未修改表格、未复制或导出文件。

该来源补强了 Owner 实际工作流、字段标签、Day 6 兼容线索，以及校本 DSKP/SK/SP 数据形状；它不是完整 KPM 标准目录的权威替代。实施映射顺序应为：以最新最完整 KPM 版本作为课程标准内容基线，以此长期校本版核对操作习惯、额外字段/条件和兼容需求，再通过获权利审核的脱敏结构样本核实隐藏公式、数据验证、打印行为和不同学校适用边界。该只读抽样不关闭完整条件表达式、公式依赖、权限/权利或 DSKP 覆盖范围等 Phase 0 闸门。

### Owner 本轮再次提供的工作簿链接确认（2026-11-21，只读元数据）

本轮用户再次提供同一长期使用版工作簿。只读元数据核验显示标题仍为 `M41 1620112026`，16 个标签及网格尺寸与上节记录相符（包括 `DSKP` 6,819×26、`SUBJEK` 92×60、隐藏 `DAY 6` 和 `indirect D1`–`D6`）。这确认的是已纳入差异分析的 Owner 长期版，并非新的 KPM 标准版本；课程内容基线仍按前述较完整 KPM 样本处理，Owner 表作为操作兼容与字段条件来源。

本轮又在 Codex 内部浏览器直接打开同一链接核对可见工作表：UI 显示 7 个可见标签（`MENU`、`MON`–`FRI`、`DATA`），`DATA` 网格显示 1,000 行 × 24 列；`MON` 显示 251 行 × 12 列。首页为按班级、起止时间、科目和日期/周次组织的周计划入口；日页可见每节课独立的 `WAKTU` 块及内容、内容标准、学习标准、全年教学计划、学习目标、教学资源等结构，数据页可见班级、时间、日期、周次、公民教育与多类教学资源/评估/策略参考列。日页下方还存在多元智能等区块。该次 UI 核对没有展开隐藏标签或复制单元格正文；画面带有学校/教师身份与真实教学内容，因此只记录字段族，不保留身份值或正文。此现场与此前 Drive 元数据记录的 16 个标签并不冲突：浏览器 UI 报告的是可见标签数，之前记录另包含隐藏页；总标签、网格和引用关系仍以之前的结构读取为准。该次检查只是重复链接的呈现层交叉核验，不是新 KPM 版本或新的完整字段映射，也不改变尚待核实的权限、完整公式/验证、DSKP 来源授权与覆盖范围。

### Owner 再次发送的同一链接：来源与字段族复核（2026-11-21，只读）

本轮对用户再次发送的 Google Sheets 链接重新读取文件元数据和受限结构单元格。文件仍为 `M41 1620112026`，Drive `modifiedTime` 为 `2026-11-20T13:14:28.912Z`；16 个标签/隐藏状态/网格尺寸与前述记录一致。`MON`–`FRI`、隐藏 `DAY 6`、`DSKP`、`SUBJEK`、`DATA` 及六张 `indirect D1`–`D6` 辅助页均在此工作簿中。只核对了日页身份字段位置（未抄录值）、`SUBJEK` 表头、`DATA` 表头、DSKP 的 SK/SP 字段形状和少数间接页表头；工具响应含可识别人员/学校值及真实教案正文，未将其写入此报告，也没有读取或摘录数据记录、修改、分享或导出原表。

这次是对 Owner 长期使用版的来源/字段族复核，不是一个新 KPM 版本。它再次支持“保留长期版操作习惯与字段约束、以最新且经权利核验的 KPM 版本作为课程内容基线”的既定治理顺序；不证明两版字段语义等价、DSKP 全量覆盖或授权、隐藏公式/验证/AppSheet 条件完整，也不关闭 Phase 0 对应闸门。

#### 本轮有限单元格结构核对补记

通过已连接的 Google Drive/Sheets 只读接口，检查了 `MENU!A1:J71`、`MON`–`FRI` 日页网格、`DSKP!A1:Z4`、`SUBJEK!A1:BH5`、`DATA!A1:X40` 与隐藏 `indirect D1!A1:L8` 的结构与验证元数据。没有修改原表。检查响应中可见学校/教职员及真实教案正文，因此不把这些内容、姓名或学校信息复制到工程文档；下列结论只记录字段名、结构和校验类型。

- 五个可见工作日页各有重复的 `WAKTU` 教案块：周一、周二、周四、周五样本各 4 节，周三样本 5 节（共 21 个已填时间块）；这是该工作簿当前网格样本，不是所有学校每天固定节数。产品须从学校课表生成该周实际日期与节次，支持每周至少五个教学日、不同日的不同节数及各州 Group A/B 校历，不能硬编码为每日五节。
- 日页字段/分区可见日期、日、周次、审核者、班级、起止时间、科目、备注，以及内容、内容标准、学习标准、全年教学计划、评估类型、学习目标、教学资源、导入、教学和学习活动、跨课程元素、多元智能、高层次思维技能、21 世纪教学、反思等。多个区块在模板中重复；必须保留每节课独立字段及顺序语义，不能扁平化时丢失重复活动/目标/标准。
- `MENU` 中抽样网格可见班级、开始/结束时间、科目和日期的数据验证，引用 `DATA`、`SUBJEK` 与审核者枚举命名范围；五个日页分别观察到约 169–184 个带数据验证的单元格。公式与下拉范围把科目/年级选择连接至命名范围及 `indirect D1` 等辅助表。此处仅确认存在且有引用关系；没有重建所有命名范围、`Valid_If`/公式条件、空值分支、覆盖/复制行为或所有隐藏页依赖，不能直接把表格校验等同于最终业务规则。
- 隐藏 `DSKP` 栅格为 6,819×26，有限范围可见年级/科目加内容标准（SK）与学习标准（SP）的布局；隐藏 `SUBJEK` 为 92×60，标题行并列呈现双语/本地化 RPH 字段，包括主题/技能、SK/SP、目标、活动、策略/方法、教具、PAK21、TP、EMK、延伸/补救、道德价值、i-Think、评估类型与反思等，也有全年计划、学生程度和公民教育字段。`DATA` 表头包含课室、时段、日期、周次及多类教学/公民教育参考值。以上用于补足必须逐项映射的字段族，不代表已核验其全部行、值、定义或权限。

本轮对结构的核对提高了长期版的字段和验证证据，但不关闭整表公式/命名范围解析、AppSheet 条件矩阵、隐藏 `DAY 6` 的真实启用条件、完整打印比对、KPM 各学段覆盖及课程内容权利审查。尤其应保持两个源版本的治理顺序：最新、最完整且经权利核验的 KPM 资料作为课程内容基线；此 Owner 长期使用版用于核对实际操作习惯与兼容字段。旧版本出现而 KPM 样本未出现的字段仍须列差异，不可据单一模板删除或覆盖。

该有限结构增量已交由 Gemini 在内部浏览器独立复核（2026-11-21 批次六）：Gemini 同意将“长期版有限字段族与级联校验结构框架核对”记为局部只读子项完成；评分维度“核心业务与外部依赖映射”由 8.0 调至 8.5，Phase 0 六维精确加权总分 6.75/10（约 6.8/10）。它确认 KPM 课程内容基线未被替代，并维持全字段规则审计未完成及 Phase 1 HOLD。完整评分和阻断清单以 `docs/ERPH_COMPREHENSIVE_ARCHITECTURE_PLAN.md` 的 Phase 0 最新 Gemini 复核记录为准。

### Owner workbook and KPM AppSheet current-view cross-check (2026-11-22, internal browser, read-only)

Reopened the user-provided `M41 1620112026` workbook in the internal browser. The visible `MENU` sheet presents a Monday–Friday weekly timetable with up to six numbered class/period rows per day, class, start/end times, subject, date, weekday, week number, approval field and a notes area. The `MON` sheet displays a repeated `RANCANGAN PENGAJARAN HARIAN TS25 (CUP)` block with school/teacher header, date/day/week and approval context, then period/class/time/subject/note, content, content standard, learning standard plus annual teaching plan, learning objectives, and teaching/learning activities. The current UI reports 251 rows and 12 columns for `MON`; lower sections are partly collapsed and were not expanded in this pass. This reconfirms a real template shape only; it is the Owner's long-term workbook and does not replace the newest KPM curriculum source or prove complete field/condition coverage.

The Google Sheets share control explicitly displayed **“Anyone with the link”** and **“No sign-in required.”** The workbook visibly contains teacher identity fields, school context, current timetable and real lesson-plan content. This is link-holder access, not evidence that the document is publicly indexed. The exact audience list, downstream AppSheet connector permissions and whether this sharing scope is still required were not inspected. During the hidden-sheet list inspection, the `DSKP` tab was inadvertently unhidden by a click; this was immediately undone. The UI then confirmed `DSKP hidden` and `Saved to Drive`. No cell content, formula or permission was changed, and the workbook tab visibility was restored to its prior hidden state. No personal names or lesson text are copied here. Treat source access/privacy governance as open before duplicating its data or relying on it as a production import source.

The KPM AppSheet home menu lists three top-level destinations (`e-RPH`, `MODUL ADMIN`, `MODUL GURU`). The visible `e-RPH` view lists linked variants for Tingkatan 6, Tingkatan 1–6, Tahun 1–6, PraSekolah and KAFA, plus e-RPH information and guides. `MODUL ADMIN` presents linked process material for administration, submission review, classroom archive, Classroom setup, weekly schedule, review/printing, teacher transfers/retirement and JPN/PPD checks; `MODUL GURU` presents linked teacher guides for e-RPH submission/preparation, replacement-day RPH and training. The observed rows are predominantly `Open Url` actions; this navigation establishes product/process scope but does not prove that those screens themselves persist data or expose the underlying AppSheet expressions. No external training link was followed in this pass and no AppSheet data was edited.

Owner direction (2026-11-22): temporarily keep the workbook's existing link-sharing setting. No sharing permissions were changed. This records the current choice only; AppSheet connector access and the effective audience remain unverified.

#### KPM Tingkatan 6 workbook structure spot check (2026-11-22, internal browser, read-only)

The `01. e-RPH TING6 17/10/2026` Google Sheet, opened from the KPM AppSheet link, was in **View only** mode. This was a read-only workbook view, not an audit of AppSheet configuration or connector permissions. Its visible tabs are `MENU`, `AHAD`, `ISNIN`, `SELASA`, `RABU`, `KHAMIS`, `RPT`, `DSKP`, and `DATA`. Google Sheets reports 3,624 rows × 51 columns for `MENU`, 3,184 rows × 166 columns for each of the five daily sheets, and 1,001 rows × 89 columns for `DATA`. The five daily sheets therefore use a Sunday–Thursday shape in this workbook; this is evidence for this specific KPM Tingkatan 6 source, not a universal calendar default. The visible daily template contains merged/formula-driven areas and a repeated tabular lesson-plan layout. The UI rendered some workbook contents, including an individual formula reference and personal/school context; these were not transcribed or retained in this report. No cells, formula, validation rule, or sharing setting was changed. Hidden-sheet contents and formula/validation logic were not systematically inspected. Per the owner's direction, existing link sharing remains unchanged; no sharing permissions were changed. The effective audience and AppSheet connector access remain unverified. This structural check does not establish the complete field inventory, conditions, enums, source-rights matrix, or coverage of other KPM stages and subjects. Preserve the existing source verbatim pending the full field/condition and source-rights matrix. Phase 0 remains **7.08/10 HOLD** and Phase 1 remains **HOLD**.

Gemini reviewed the exact English and Chinese additions in the Codex internal browser. Its first score was **8/10** due to four bilingual/evidence-scope mismatches; after the corrections reflected above, it scored the revised text **10/10**, with no material revisions. Gemini stated that it could not access GitHub or the local worktree, so this was a text-based review of the supplied increment, not repository or source-workbook verification.

#### KPM Admin/Guru Classroom process-guide cross-check (2026-11-22, internal browser, read-only)

The KPM AppSheet `MODUL ADMIN` and `MODUL GURU` entries opened in this session are guide/index rows with `Open Url` actions to Google Classroom process presentations; they are not themselves operational submission/review forms. Read-only inspection of the linked presentations showed the legacy school workflow: school admins create Google Classroom classes/topics, place school copies of the e-RPH information/template sheets in Drive, configure class-wide assignments with an activation date and due date, and may copy schedule settings across classes. The guide directs teachers to personalize their lesson-plan file and teachers submit through Classroom assignments configured to make a copy per student. Reviewers use the school Delima account, inspect turned-in and missing work, open a submitted file, provide a mark and comment, and can return work individually or in bulk. This is evidence about the documented Google Classroom process, not a verified live Classroom configuration or API integration.

The teacher-transfer guide says a teacher should move e-RPH records to a personal Drive folder before the old school admin removes the teacher from the old Classroom, because removal may make those records disappear from the class view. It mentions retention through the end of school year 2024/2025; this is a dated guide instruction, not a current retention policy. Product requirements should preserve the teacher's authored record and school submission/archive history across membership changes, make export/transfer explicit and auditable, and separate teacher membership removal from lesson-record deletion. No Classroom classes, assignments, membership, files, or sheet contents were changed. No personal names, school names, or lesson text from the examples were copied into this report. This review did not cover all AppSheet form conditions, validation formulas, permission policies, live submission data/API behavior, email/reminders, file permissions, or current retention policy; these remain Phase 0 blockers. Phase 0 remains **7.08/10 HOLD** and Phase 1 remains **HOLD**.

Gemini reviewed the exact bilingual increment in the Codex internal browser and scored it **10/10**, with no material revisions. Gemini could not access GitHub or the local worktree; this was a review of supplied text only.

#### Follow-up hidden `SUBJEK` tab visibility correction (2026-11-22, internal browser)

In a later internal-browser inspection, opening the workbook's **All Sheets** list and selecting the hidden `SUBJEK` entry caused Google Sheets to unhide that tab. The change was immediately reversed using the tab's **Hide sheet** action. Google Sheets then showed the tab as hidden and **Saved to Drive**; the visible tab strip returned to the prior `MENU`, `MON`–`FRI`, `DATA` set. The visibility toggle and its reversal may both remain in Drive revision history; they cannot be erased from this record. No cell values, formulas, sharing permissions or business data were edited. The grid rendered the header row `SUBJEK`, `TARIKH`, `HARI`, `MINGGU`, `DISAHKAN OLEH`, `KELAS`, `MASA`; non-header rows were not transcribed or retained. The temporary visibility change is distinct from the earlier DSKP-tab incident already recorded above; final tab visibility has been restored.

#### KPM 2026 report/data formula dependency spot check (2026-11-22, Google Drive read-only)

Read only the formula field (not calculated values) in `RPT!A1:BV30` and `DATA!A1:CK100` of the KPM 2026 workbook. The bounded `RPT` range contains 107 formula cells: 60 `FILTER` formulas that cascade `FTAHUN`, `FSK`, and `FSP` options from a selected subject/year, 21 `IF` formulas, 7 `IFERROR` formulas, one `UPPER` formula, and 18 direct-reference/concatenation formulas. This establishes a report-sheet dependency on named ranges and the selected subject/year context within the inspected range; it does not verify all 4,063 report rows, named-range definitions, calculated outputs, or every conditional branch.

The same `RPT!A1:BV30` range contains 92 data-validation cells: 85 `ONE_OF_RANGE` rules and 7 `ONE_OF_LIST` rules. The range rules reference `DSKP!A3:A` once and the report's own helper ranges `O7:O` once, `P7:P` 42 times, and `Q7:Q` 41 times. Fixed-list option values were not read or recorded. This confirms that the report form's choices depend on both the DSKP sheet and local helper columns, but does not identify all source values or prove the helper formulas' full-range behavior.

The inspected `DATA` range contains one formula, at `CH1`: an `IMPORTRANGE` for `DATASK!CH:CK` from the separate spreadsheet `00. Nota/Link eRPH KPM` (ID `1BuqPByLOjLsotu3JB22mEbwnfHwrPUbDtCABprjTM-w`); its result is intended to spill across columns `CH:CK`. A subsequent header-only read of `DATASK!CH1:CK1` identifies those four imported columns as `RUJUKAN`, `LINK`, `BUKU TEKS`, and `LINK`. This clarifies that the dependency supplies reference/textbook labels and links; no data rows, destination formula results, link targets, sharing/authorization behavior, or rights were inspected. Do not treat the copy as self-contained: verify owner-approved access, actual link availability, field mapping, and rights before implementing/importing curriculum resources. No other upstream cells were read, and no spreadsheet content, formulas, permissions, or sharing settings were changed.

This remains a bounded formula-structure observation, not a complete formula/named-range/validation/AppSheet condition audit. Phase 0 remains **7.08/10 HOLD** and Phase 1 remains **HOLD**.

#### KPM 2026 bounded formula dependency inventory (2026-11-22, formulas only)

Read `userEnteredValue(formulaValue)` only in `MENU!A1:AY60`, each weekday tab `ISNIN`–`JUMAAT!A1:FJ40`, `RPT!A1:BV30`, and `DATA!A1:CK100`. This returned 61 formula cells in `MENU`; 258 each in `ISNIN`, `RABU`, `KHAMIS`, and `JUMAAT`; 290 in `SELASA`; 107 in `RPT`; and one in `DATA`. No calculated values or lesson text were returned. The daily formulas repeatedly depend on `MENU` (45 formula references per day sample) and `DATA` (69 per day sample) and use cascading lookup families including `FSUBJEK`, `FTAHUN`, `FBIDANG`, `FTAJUK`, `FSK`, `FSP`, `FNTERAS`, and `FTSIVIK`.

The 32-formula difference in `SELASA` is localized to row 38: its sample has 41 formulas there, while each of the other four days has 9. The additional 32 are all `FILTER` formulas in columns `U`, `V`, `W`, `AB`, `AN`, `AO`, `AP`, `AU`, `BG`, `BH`, `BI`, `BN`, `BZ`, `CA`, `CB`, `CG`, `CS`, `CT`, `CU`, `DA`, `DL`, `DM`, `DN`, `DS`, `EE`, `EF`, `EG`, `EL`, `EX`, `EY`, `EZ`, and `FE`. This is a real source-template variance; its purpose is not established. Preserve it and ask the source owner before normalizing or omitting it.

The copy has two cross-workbook imports into the same external workbook: `MENU!J3` imports `MENUSK!J3:J52`, and `DATA!CH1` imports `DATASK!CH:CK`. The upstream spreadsheet metadata/title and tab names were observed, and only `DATASK!CH1:CK1` headers were read. Imported menu values, link targets, rights, formula outputs, named-range definitions, and effective IMPORTRANGE authorization remain unverified. This inventory does not audit full-sheet formulas, hidden/merged regions, AppSheet conditions, or submit-time rules.

#### KPM 2026 DSKP field-header inventory (2026-11-22, header row only)

Read `DSKP!A1:Q1` formatted headers only. The grid extent is 56,813 rows × 17 columns; this is a sheet grid size, not a populated-row count. The raw non-empty header sequence is: A `SUBJEK`; B `TAHUN`; C `TEMA/BIDANG/TERAS`; D `tema2`; E `TAJUK/KEMAHIRAN/NILAITERAS`; F `tajuk2`; G `SK`; H `SP`; I `NTERAS`; J `TSIVIK:`; K `OB`; L `Pengetahuan`; M `Sosioemosi:`; N `Tindakan:`; O blank; P `XTVT`; Q `XTVT2`. Preserve the exact labels and blank column in source mapping. In particular, labels such as `tema2`, `tajuk2`, `OB`, `XTVT`, and `XTVT2` need owner/source documentation before the normalized curriculum schema assigns meaning. No body rows, standards, codes, or curricular prose were read. Header structure alone does not establish data coverage, version, rights, or import readiness.

#### Candidate RPH persistence and tenant-boundary verification (2026-11-24)

The current uncommitted candidate extends the manual RPH create/edit flow with semester, textbook reference, content-standard and two content blocks, subtitle, learning outcomes, main/closing activities, week number, topic, skills, SK/SP/TP standards, intervention reason, attendance present/total, and a school-scoped timetable-slot reference. The edit view exposes the same field family and retains prior version content through the existing versioned JSON contract. Attendance validation rejects present counts above total; active timetable slots are checked against the authenticated school on both create and edit, with a regression test rejecting a foreign-school slot in each path.

Local verification for this candidate is **99 tests / 726 assertions**; the RPH-specific regression is **1 test / 28 assertions**. This closes only the listed persistence and tenant-boundary increment. It does not establish full source-workbook parity, all stage-specific conditions/enums, report/print behavior, or production deployment of this uncommitted worktree.
