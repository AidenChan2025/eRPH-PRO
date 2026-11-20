<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>School administration · {{ $school->name }}</title>
    <style>
        :root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc}
        *{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font:15px Arial,sans-serif}
        .top{height:72px;padding:0 34px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid var(--line)}
        .brand{display:flex;align-items:center;gap:11px;font-weight:800}.mark{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;color:#fff;background:var(--blue)}
        .top span:last-child{color:var(--muted);font-size:13px}.main{max-width:1180px;margin:auto;padding:44px 30px}
        .eyebrow{color:var(--blue);font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
        .heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:28px}.heading h1{margin:8px 0 0;font:800 36px/1.1 Arial,sans-serif;letter-spacing:-.055em}.heading p{color:var(--muted)}
        .card{overflow:hidden;margin-bottom:24px;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 10px 28px #1e315308}
        .card h2{margin:0;padding:22px 24px 0;font-size:19px}.subtext{padding:0 24px;color:var(--muted);font-size:13px}
        .fields{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:12px 24px 18px}label{display:grid;gap:6px;color:var(--muted);font-size:12px;font-weight:700}
        input,select{min-height:38px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink);font:inherit}
        button{min-height:36px;padding:0 13px;border:0;border-radius:8px;color:#fff;background:var(--blue);font-weight:700;cursor:pointer}.button{margin:0 24px 24px}
        .success{margin-bottom:18px;padding:12px 14px;border-radius:9px;color:#17603a;background:#e8f8ef;font-size:13px}.error{margin:0 24px 18px;color:#b42318;font-size:13px}
        .table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:900px}th,td{text-align:left;padding:16px 18px;border-bottom:1px solid var(--line);vertical-align:top}
        th{color:var(--muted);font-size:11px;letter-spacing:.08em;text-transform:uppercase;background:#fbfcfe}td{font-size:14px}.person{font-weight:700}
        .sub{display:block;margin-top:3px;color:var(--muted);font-size:12px}.pill{display:inline-flex;padding:5px 9px;border-radius:99px;color:#2563eb;background:#eef4ff;font-size:12px;font-weight:700}.pill.inactive{color:#687386;background:#f0f2f5}
        td form{display:flex;align-items:center;gap:6px}td form select{min-height:32px;padding:5px 7px;font-size:12px}td form button{min-height:32px;padding:0 9px;font-size:12px}
        @media(max-width:700px){.top{padding:0 18px}.main{padding:30px 16px}.heading{display:block}.fields{grid-template-columns:1fr}}
    </style>
</head>
<body>
<header class="top"><div class="brand"><span class="mark" aria-hidden="true">✦</span><span>eRPH Pro</span></div><span>{{ $school->name }} · School administration</span></header>
<main class="main">
    <div class="heading"><div><span class="eyebrow">{{ $school->subdomain }} / administration</span><h1>School people</h1><p>Manage the people and official records belonging to this school.</p></div></div>
    @if(session('status'))<div class="success">{{ session('status') }}</div>@endif
    @if($errors->any())<div class="error">{{ $errors->first() }}</div>@endif
    <section class="card"><h2>Add school account</h2><p class="subtext">Use the school Google Workspace email. The person will be linked when they sign in.</p>
        <form method="post" action="{{ route('school.admin.people.store') }}">@csrf
            <div class="fields"><label>Name<input name="name" value="{{ old('name') }}" required></label><label>Workspace email<input type="email" name="email" value="{{ old('email') }}" required></label><label>Role<select name="role"><option value="teacher">Teacher</option><option value="school_admin">School administrator</option><option value="principal">Principal</option><option value="vice_principal">Vice principal</option></select></label><label>Staff no.<input name="staff_no" value="{{ old('staff_no') }}"></label><label>Position<input name="position" value="{{ old('position') }}"></label></div>
            <button class="button" type="submit">Save school account</button>
        </form>
    </section>
    <section class="card"><div class="table-wrap"><table><thead><tr><th>Teacher</th><th>Staff no.</th><th>Position</th><th>Status</th><th>Joined</th><th>Access</th></tr></thead><tbody>
        @forelse($teachers as $teacher)
            @php($member = $memberRoles[$teacher->user_id] ?? null)
            <tr><td><span class="person">{{ $teacher->user->name }}</span><span class="sub">{{ $teacher->user->email }}</span></td><td>{{ $teacher->staff_no ?: '—' }}</td><td>{{ $teacher->position ?: 'Teacher' }}</td><td><span class="pill {{ $teacher->employment_status !== 'active' ? 'inactive' : '' }}">{{ ucfirst($teacher->employment_status) }}</span></td><td>{{ $teacher->joined_school_on?->format('d M Y') ?: '—' }}</td><td><form method="post" action="{{ route('school.admin.people.update', $teacher->user) }}">@csrf @method('PUT')<select name="role"><option value="teacher" @selected($member?->pivot->role === 'teacher')>Teacher</option><option value="school_admin" @selected($member?->pivot->role === 'school_admin')>School admin</option><option value="principal" @selected($member?->pivot->role === 'principal')>Principal</option><option value="vice_principal" @selected($member?->pivot->role === 'vice_principal')>Vice principal</option></select><select name="status"><option value="active" @selected($member?->pivot->status === 'active')>Active</option><option value="inactive" @selected($member?->pivot->status === 'inactive')>Inactive</option></select><button type="submit">Update</button></form></td></tr>
        @empty<tr><td colspan="6">No teacher profiles have been added yet.</td></tr>@endforelse
    </tbody></table></div></section>
</main>
</body>
</html>
