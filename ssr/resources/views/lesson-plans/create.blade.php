<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>New RPH · {{ $school->name }}</title>
<link rel="stylesheet" href="{{ asset('css/erph-design-system.css') }}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc}*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font:15px "DM Sans",sans-serif}.top{height:72px;padding:0 34px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:11px;font-weight:800}.mark{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;color:#fff;background:var(--blue)}.top a{color:var(--muted);text-decoration:none;font-size:13px}.main{width:clamp(80vw,90vw,1800px);max-width:none;margin-inline:auto;padding:42px 24px 70px}.eyebrow{color:var(--blue);font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}.heading h1{margin:9px 0 8px;font:800 36px/1.1 Manrope,sans-serif;letter-spacing:-.055em}.heading p,.hint{color:var(--muted)}.notice{padding:12px 15px;margin:22px 0;border-radius:10px;background:#ecfdf5;color:#16704b;font-size:13px}.card{margin-top:22px;padding:26px;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 10px 28px #1e315308}.card h2{margin:0 0 18px;font:800 20px Manrope,sans-serif;letter-spacing:-.04em}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}label{display:block;color:#435067;font-size:12px;font-weight:700}input,select,textarea{display:block;width:100%;margin-top:7px;padding:11px 12px;border:1px solid #d9e0eb;border-radius:9px;color:var(--ink);background:#fff;font:14px "DM Sans",sans-serif}textarea{min-height:104px;resize:vertical}label.full{grid-column:1/-1}input:focus,select:focus,textarea:focus{outline:3px solid #2563eb2b;border-color:var(--blue)}.actions{display:flex;align-items:center;gap:15px;margin-top:24px}.button{border:0;border-radius:10px;min-height:44px;padding:0 17px;color:#fff;background:var(--blue);font-weight:700;cursor:pointer}.back{color:var(--muted);text-decoration:none;font-size:13px}@media(max-width:680px){.top{padding:0 18px}.main{padding:30px 16px}.grid{grid-template-columns:1fr}label.full{grid-column:auto}}
</style>
</head>
<body>
<header class="top"><div class="brand"><span class="mark" aria-hidden="true">✦</span><span>eRPH Pro</span></div><a href="{{ route('workspace.dashboard') }}">Back to workspace</a></header>
<main class="main"><div class="heading"><span class="eyebrow">{{ $school->subdomain }} / daily lesson plan</span><h1>Create your RPH</h1><p>Use this school’s timetable and preserve the familiar teaching record.</p></div>
@if(session('status'))<div class="notice">{{ session('status') }}</div>@endif
@if($errors->any())<div class="notice" style="background:#fff7ed;color:#9a4d0b">Please check the required fields and try again.</div>@endif
<form method="post" action="{{ route('rph.store') }}">@csrf
<section class="card"><h2>Lesson details</h2><div class="grid">
<label>Date<input type="date" name="lesson_date" value="{{ old('lesson_date', now()->format('Y-m-d')) }}" required></label><label>Teaching week<input type="number" name="week_no" min="1" max="53" value="{{ old('week_no') }}"></label>
@if($assignments->isNotEmpty())<label>Class and subject assignment<select name="assignment_id" required><option value="">Choose your assignment</option>@foreach($assignments as $assignment)<option value="{{ $assignment->id }}" @selected(old('assignment_id') == $assignment->id)>{{ $assignment->subject }} · {{ $assignment->schoolClass->name }} · {{ $assignment->academicYear->year }}</option>@endforeach</select><span class="hint">Your school administrator controls these assignments.</span></label>@else<label>Subject<input name="subject" value="{{ old('subject') }}" required></label>
<label>Class / year<input name="class_name" value="{{ old('class_name') }}" required></label>@endif
<label>Lesson title<input name="title" value="{{ old('title') }}" required></label><label>Subtitle<input name="subtitle" value="{{ old('subtitle') }}"></label><label><input type="checkbox" name="is_relief" value="1" @checked(old('is_relief'))> Hari Gantian / Relief Class</label><label>Relief reason<input name="relief_reason" value="{{ old('relief_reason') }}"></label>
<label>School time slot<select id="slot_id" name="slot_id"><option value="">Manual time / not selected</option>@foreach($slots as $slot)<option value="{{ $slot->id }}" data-start="{{ substr($slot->starts_at,0,5) }}" data-end="{{ substr($slot->ends_at,0,5) }}">{{ $slot->day_of_week }} · {{ $slot->label ?: 'Lesson period' }} ({{ substr($slot->starts_at,0,5) }}–{{ substr($slot->ends_at,0,5) }})</option>@endforeach</select><span class="hint">Configured by your school administrator.</span></label>
<label>Start time<input id="start_time" type="time" name="start_time" value="{{ old('start_time') }}"></label>
<label>End time<input id="end_time" type="time" name="end_time" value="{{ old('end_time') }}"></label>
<label>Civic value / Nilai Sivik<input name="civic_value" value="{{ old('civic_value') }}"></label>
<label>Civic topic / Tajuk Sivik<input name="civic_topic" value="{{ old('civic_topic') }}"></label>
<label>Topic / Tema<input name="topic" value="{{ old('topic') }}"></label>
<label>Semester<input name="semester" value="{{ old('semester') }}"></label>
<label>Textbook reference<input name="textbook_reference" value="{{ old('textbook_reference') }}"></label>
<label>Skills / Kemahiran<textarea name="skills">{{ old('skills') }}</textarea></label>
<label class="full">Standards / SK · SP · TP<textarea name="standards">{{ old('standards') }}</textarea></label>
<label class="full">Content / standard description<textarea name="content_standard">{{ old('content_standard') }}</textarea></label>
<label>Content 1<textarea name="content_1">{{ old('content_1') }}</textarea></label><label>Content 2<textarea name="content_2">{{ old('content_2') }}</textarea></label>
</div></section>
<section class="card"><h2>Teaching record</h2><div class="grid">
<label class="full">Learning outcomes<textarea name="learning_outcomes">{{ old('learning_outcomes') }}</textarea></label><label class="full">Learning objectives<textarea name="objectives">{{ old('objectives') }}</textarea></label><button class="button" type="button" id="ai-generate">Jana AI e-RPH</button>
<label class="full">Activities / steps<textarea name="activities">{{ old('activities') }}</textarea></label><label>Activity / main<textarea name="activity_main">{{ old('activity_main') }}</textarea></label><label>Activity / closing<textarea name="activity_closing">{{ old('activity_closing') }}</textarea></label>
<label>Assessment<textarea name="assessment">{{ old('assessment') }}</textarea></label><label>Reflection<textarea name="reflection">{{ old('reflection') }}</textarea></label>
<label>Homework<textarea name="homework">{{ old('homework') }}</textarea></label><label>Materials / resources<textarea name="materials">{{ old('materials') }}</textarea></label>
<label>EMK<textarea name="emk">{{ old('emk') }}</textarea></label><label>PAK21<textarea name="pak21">{{ old('pak21') }}</textarea></label>
<label>Written assessment<textarea name="assessment_written">{{ old('assessment_written') }}</textarea></label><label>Oral assessment<textarea name="assessment_oral">{{ old('assessment_oral') }}</textarea></label>
<label>Observation assessment<textarea name="assessment_observation">{{ old('assessment_observation') }}</textarea></label><label>Nilai-nilai murni<textarea name="moral_values">{{ old('moral_values') }}</textarea></label>
<label>Student count<input type="number" name="student_count" min="0" value="{{ old('student_count') }}"></label><label>Present<input type="number" name="attendance_present" min="0" value="{{ old('attendance_present') }}"></label><label>Total enrolled<input type="number" name="attendance_total" min="0" value="{{ old('attendance_total') }}"></label><label>KBAT<input name="kbat" value="{{ old('kbat') }}"></label>
<label>Pengayaan<textarea name="enrichment">{{ old('enrichment') }}</textarea></label><label>Pemulihan<textarea name="remedial">{{ old('remedial') }}</textarea></label>
<label class="full">Intervention / reason not implemented<textarea name="intervention_reason">{{ old('intervention_reason') }}</textarea></label>
<label>Multiple intelligences<textarea name="multiple_intelligences">{{ old('multiple_intelligences') }}</textarea></label><label>Notes<textarea name="notes">{{ old('notes') }}</textarea></label>
</div><div class="actions"><button class="button" type="submit">Save draft</button><a class="back" href="{{ route('workspace.dashboard') }}">Cancel</a></div></section></form></main>
<script>document.getElementById('slot_id')?.addEventListener('change',function(){const option=this.selectedOptions[0];if(option?.dataset.start){document.getElementById('start_time').value=option.dataset.start;document.getElementById('end_time').value=option.dataset.end;}});</script>
</body></html>
