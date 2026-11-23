<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Schools · Platform · eRPH Pro</title></head>
<body>
<main>
<p><a href="{{ route('owner.dashboard') }}">Overview</a></p>
<h1>Schools</h1>
<p>Create and manage school tenants. Every lifecycle change and invitation is audited.</p>
<p><a href="{{ route('owner.schools.create') }}">New school</a></p>
@if(session('status'))<p>{{ session('status') }}</p>@endif
@if($errors->any())<p>{{ $errors->first() }}</p>@endif
<section>
@forelse($schools as $school)
<article>
<h2>{{ $school->name }}</h2>
<p>{{ $school->subdomain }}.{{ config('app.school_base_domain', 'erphpro.com') }} · {{ $school->members_count }} members · {{ $school->is_active ? 'Active' : 'Suspended' }}</p>
<p><a href="{{ route('owner.schools.edit', $school) }}">Edit</a>
@if($school->archived_at)<form method="post" action="{{ route('owner.schools.restore', $school) }}" style="display:inline">@csrf<button type="submit">Restore</button></form>@else<form method="post" action="{{ route('owner.schools.toggle', $school) }}" style="display:inline">@csrf<button type="submit">{{ $school->is_active ? 'Suspend' : 'Activate' }}</button></form>@endif</p>
@if(!$school->archived_at)<form method="post" action="{{ route('owner.schools.archive', $school) }}">@csrf<button type="submit">Archive</button></form>@else<p>Archived {{ $school->archived_at }}</p>@endif
@if($school->is_active)
<details><summary>Invite administrator</summary>
<form method="post" action="{{ route('owner.schools.invite', $school) }}">@csrf
<label>Name <input name="name" required></label>
<label>Email <input type="email" name="email" required></label>
<label>Role <select name="role"><option value="school_admin">School Admin</option><option value="principal">Principal</option><option value="vice_principal">Vice Principal</option><option value="teacher">Teacher</option></select></label>
<button type="submit">Record invitation</button>
</form>
<p>The invitation is pending until this email signs in from the school workspace. No email is sent by this page.</p>
</details>
@endif
@foreach($pendingInvitations->get($school->id, collect()) as $invitation)
<p>Pending: {{ $invitation->name }} ({{ $invitation->email }}) · {{ $invitation->role }}
<form method="post" action="{{ route('owner.schools.invite.resend', [$school, $invitation->id]) }}" style="display:inline">@csrf<button type="submit">Resend</button></form>
<form method="post" action="{{ route('owner.schools.invite.revoke', [$school, $invitation->id]) }}" style="display:inline">@csrf<button type="submit">Revoke</button></form></p>
@endforeach
</article>
@empty
<p>No schools registered yet.</p>
@endforelse
</section>
</main>
</body>
</html>
