<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reports · {{ $school->name }}</title>
    <style>
        :root { --ink:#172033; --muted:#687386; --blue:#2563eb; --line:#e5eaf2; --canvas:#f7f9fc; --green:#16845a; --orange:#c55c0a; }
        * { box-sizing:border-box; } body { margin:0; background:var(--canvas); color:var(--ink); font:15px system-ui,sans-serif; }
        .top { min-height:72px; padding:0 34px; display:flex; align-items:center; justify-content:space-between; background:#fff; border-bottom:1px solid var(--line); }
        .brand { font-weight:800; } .top span:last-child,.muted { color:var(--muted); font-size:13px; }
        .main { max-width:1180px; margin:auto; padding:44px 30px; } .eyebrow { color:var(--blue); font-size:11px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; }
        h1 { margin:8px 0; font-size:36px; letter-spacing:-.05em; } h2 { margin:0 0 18px; font-size:20px; }
        .card { padding:21px; border:1px solid var(--line); border-radius:16px; background:#fff; box-shadow:0 10px 28px #1e315308; }
        .filters { display:flex; gap:14px; align-items:end; flex-wrap:wrap; margin:24px 0; } label { display:grid; gap:6px; color:var(--muted); font-size:12px; }
        input,select { min-height:38px; padding:7px 10px; border:1px solid var(--line); border-radius:8px; color:var(--ink); background:#fff; } button { min-height:38px; padding:0 15px; border:0; border-radius:8px; color:#fff; background:var(--blue); font-weight:700; }
        .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:15px; margin:30px 0 18px; } .stat span { color:var(--muted); font-size:12px; } .stat strong { display:block; margin-top:9px; font-size:30px; } .good { color:var(--green); } .warn { color:var(--orange); }
        .grid { display:grid; grid-template-columns:1.1fr .9fr; gap:18px; } .progress { height:10px; overflow:hidden; border-radius:99px; background:#edf0f5; } .progress i { display:block; height:100%; background:var(--blue); }
        .legend { display:flex; justify-content:space-between; margin-top:12px; color:var(--muted); font-size:12px; } .table-wrap { overflow:auto; } table { width:100%; border-collapse:collapse; min-width:500px; } th,td { text-align:left; padding:13px; border-bottom:1px solid var(--line); } th { color:var(--muted); font-size:11px; text-transform:uppercase; } td { font-size:13px; }
        .pill { display:inline-flex; padding:5px 9px; border-radius:99px; font-size:11px; font-weight:700; background:#ecfdf5; } .pill.warn { background:#fff7ed; } .empty { color:var(--muted); padding:12px 0; }
        @media (max-width:760px) { .top { padding:0 18px; } .main { padding:30px 16px; } .stats,.grid { grid-template-columns:1fr 1fr; } .grid { display:block; } .grid .card + .card { margin-top:18px; } }
        @media (max-width:480px) { .stats { grid-template-columns:1fr 1fr; } }
    </style>
</head>
<body>
    <header class="top"><div class="brand">eRPH Pro</div><span>{{ $school->name }} · Report filters</span></header>
    <main class="main">
        <span class="eyebrow">{{ $school->subdomain }} / reports</span>
        <h1>Submission overview</h1>
        <p class="muted">School-wide RPH activity for the selected period.</p>
        <form class="card filters" method="get">
            <label>From<input type="date" name="from" value="{{ $start->toDateString() }}"></label>
            <label>To<input type="date" name="to" value="{{ $end->toDateString() }}"></label>
            <label>Status<select name="status"><option value="">All statuses</option><option value="on_time" @selected($status === 'on_time')>On time</option><option value="late" @selected($status === 'late')>Late</option></select></label>
            <button type="submit">Apply filters</button>
        </form>
        <section class="stats">
            <div class="card stat"><span>Active teachers</span><strong>{{ $activeTeachers }}</strong></div>
            <div class="card stat"><span>Teachers submitted</span><strong class="good">{{ $submittedTeachers }}</strong></div>
            <div class="card stat"><span>Pending teachers</span><strong class="warn">{{ $pendingTeachers }}</strong></div>
            <div class="card stat"><span>On time</span><strong>{{ $onTime }}</strong></div>
        </section>
        <div class="grid">
            <section class="card"><h2>Selected period</h2><div class="progress"><i style="width:{{ $completionRate }}%"></i></div><div class="legend"><span>{{ $submittedTeachers }} of {{ $activeTeachers }} teachers submitted</span><span>{{ $completionRate }}%</span></div><p class="empty">{{ $submittedRecords }} total submission records; {{ $matchedRecords }} match the selected status filter. Late records in this period: <strong>{{ $late }}</strong>.</p></section>
            <section class="card"><h2>Audit interpretation</h2><p class="empty">This report is computed from school-owned submission records and can be filtered by period and status.</p></section>
        </div>
        <section class="card" style="margin-top:18px"><h2>Recent submissions</h2><div class="table-wrap"><table><thead><tr><th>Teacher</th><th>Week</th><th>Submitted</th><th>Status</th></tr></thead><tbody>@forelse($recent as $item)<tr><td>{{ $item->teacherProfile->user->name }}</td><td>M{{ $item->week_no }}</td><td>{{ $item->submitted_at->format('d M Y H:i') }}</td><td><span class="pill {{ $item->status === 'on_time' ? 'good' : 'warn' }}">{{ $item->status === 'on_time' ? 'On time' : 'Late' }}</span></td></tr>@empty<tr><td colspan="4" class="empty">No submissions recorded in this period.</td></tr>@endforelse</tbody></table></div></section>
    </main>
</body>
</html>
