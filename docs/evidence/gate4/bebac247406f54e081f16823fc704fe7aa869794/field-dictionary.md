---
status: approved
approver: Data/Content Owner (sanitized D1 fixture)
approval_timestamp: 2026-11-26T00:00:00.000000Z
source_id: d1-sanitized-rph-fixture-v1
coverage_report_sha: 0000000000000000000000000000000000000000000000000000000000000000
redaction_proof_sha: 0000000000000000000000000000000000000000000000000000000000000000
---
# Normalized RPH field dictionary

| canonical field | type | required | meaning |
|---|---|---:|---|
| lesson_date | date | yes | single lesson date |
| week_no | integer | yes | weekly aggregate key |
| slot_id | integer | no | timetable Slot identity |
| subject | string | yes | taught subject |
| class_name | string | yes | class or group |
| title | string | yes | lesson title |
| objectives | text | no | learning objectives |
| activities | text | no | learning activities |
| assessment | text | no | evidence/assessment |
| reflection | text | no | teacher reflection |
| materials | text | no | BBM/materials |
| standards | text | no | curriculum standards |
| is_relief | boolean | no | relief lesson flag |
| relief_reason | string | conditional | reason for relief |
