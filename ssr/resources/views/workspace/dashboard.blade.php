<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Workspace · {{ $school->name }}</title>
    <link rel="stylesheet" href="{{ asset('css/erph-design-system.css') }}">
    <style>
        :root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc;--surface:#fff;--orange:#f97316}
        *{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--canvas);font:15px Arial,sans-serif}
        .top{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 34px;background:#fff;border-bottom:1px solid var(--line)}
        .brand{display:flex;align-items:center;gap:11px;font-weight:800}.mark{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;color:#fff;background:var(--blue)}.user{color:var(--muted);font-size:13px}
        .layout{display:grid;grid-template-columns:230px 1fr;min-height:calc(100vh - 72px)}aside{padding:28px 18px;background:#fff;border-right:1px solid var(--line)}
        .nav{display:block;padding:11px 13px;margin:4px 0;border-radius:9px;color:var(--muted);text-decoration:none;font-weight:600}.nav.active,.nav:hover{color:var(--blue);background:#eef4ff}
        .main{max-width:1180px;width:100%;padding:44px 42px}.eyebrow{color:var(--blue);font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
        .heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:32px}.heading h1{margin:8px 0 0;font:800 36px/1.1 Arial,sans-serif;letter-spacing:-.055em}.heading p{margin:8px 0 0;color:var(--muted)}
        .button{display:inline-flex;align-items:center;min-height:42px;padding:0 16px;border-radius:10px;background:var(--blue);color:#fff;text-decoration:none;font-weight:700}
        .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.stat,.panel{padding:20px;border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 10px 28px #1e315308}.stat span{color:var(--muted);font-size:12px}.stat strong{display:block;margin-top:9px;font-size:28px;letter-spacing:-.06em}.stat.orange{border-top:3px solid var(--orange)}
        .grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-top:18px}.panel h2{margin:0;font-size:20px;letter-spacing:-.04em}.panel p{color:var(--muted);line-height:1.6}
        table{width:100%;margin-top:16px;border-collapse:collapse}th,td{text-align:left;padding:11px 8px;border-bottom:1px solid var(--line);font-size:13px}th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.status{font-weight:700}.status.draft{color:#9a6500}.status.submitted{color:#2563eb}.status.returned{color:#c2410c}.status.approved{color:#16845a}
        .profile{display:flex;align-items:center;gap:14px;margin-top:20px}.avatar{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;color:var(--blue);background:#eaf1ff;font-weight:800}.profile strong{display:block}.profile span{color:var(--muted);font-size:12px}
        .empty{color:var(--muted);font-size:13px}.logout{margin-top:30px;padding:0 13px;border:0;background:none;color:var(--muted);font:inherit;cursor:pointer}
        @media(max-width:900px){.stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.layout{display:block}aside{display:flex;gap:4px;overflow:auto;padding:10px}.nav{white-space:nowrap}.main{padding:28px 18px}.heading{display:block}.button{margin-top:18px}.stats,.grid{grid-template-columns:1fr}.top{padding:0 18px}}
    </style>
</head>
<body>
<header class="top"><div class="brand"><span class="mark" aria-hidden="true">✦</span><span>eRPH Pro</span></div><div class="user">{{ auth()->user()->name }} · {{ $school->name }}</div></header>
<div class="layout">
    <aside>
        <a class="nav active" href="{{ route('workspace.dashboard') }}">Overview</a><a class="nav" href="{{ route('teacher.profile.edit') }}">Teacher record</a><a class="nav" href="{{ route('account.identities') }}">Google accounts</a><a class="nav" href="#lesson-plans">Lesson plans</a>
        <form method="post" action="{{ route('logout') }}" class="logout">@csrf<button class="logout" type="submit">Sign out</button></form>
    </aside>
    <main class="main">
        <div class="heading"><div><span class="eyebrow">{{ $school->subdomain }} workspace</span><h1>Good to see you, {{ Str::of(auth()->user()->name)->before(' ') }}.</h1><p>Your teaching workspace, kept clear and ready for the day.</p></div><a class="button" href="{{ route('rph.create') }}">Create lesson plan</a></div>
        <section class="stats">
            <div class="stat"><span>All plans</span><strong>{{ $lessonPlanCount }}</strong></div><div class="stat orange"><span>Drafts</span><strong>{{ $statusCounts['draft'] }}</strong></div><div class="stat"><span>Submitted</span><strong>{{ $statusCounts['submitted'] }}</strong></div><div class="stat"><span>Returned</span><strong>{{ $statusCounts['returned'] }}</strong></div><div class="stat"><span>Approved</span><strong>{{ $statusCounts['approved'] }}</strong></div>
        </section>
        <div class="grid">
            <section class="panel" id="lesson-plans"><span class="eyebrow">RPH workflow</span><h2>My lesson plans</h2><p>See the current state of every plan without opening separate files.</p>
                @if($recentPlans->isEmpty())<p class="empty">No lesson plans yet. Create your first plan to begin.</p>@else<table><thead><tr><th>Date</th><th>Subject / class</th><th>Status</th></tr></thead><tbody>@foreach($recentPlans as $plan)<tr><td>{{ $plan->lesson_date->format('d M Y') }}</td><td>{{ $plan->subject }}<br><span class="empty">{{ $plan->class_name }}</span></td><td class="status {{ $plan->status }}">{{ ucfirst($plan->status) }}</td></tr>@endforeach</tbody></table>@endif
            </section>
            <section class="panel" id="teacher-record"><span class="eyebrow">Teacher record</span><h2>One profile, ready for every module.</h2><p>Your school record is the foundation for lesson plans, timetable, reports and future education modules.</p><div class="profile"><div class="avatar">{{ Str::substr(auth()->user()->name, 0, 1) }}</div><div><strong>{{ auth()->user()->name }}</strong><span>{{ $profile?->position ?? 'Teacher profile pending' }}</span></div></div><p><a class="button" href="{{ route('teacher.profile.edit') }}">Open profile</a></p></section>
        </div>
    </main>
</div>
</body>
</html>
