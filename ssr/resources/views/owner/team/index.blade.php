<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Platform team · eRPH Pro</title></head>
<body><header><strong>eRPH Pro · Platform</strong> <a href="{{ route('owner.dashboard') }}">Overview</a></header><main>
<p>Platform roles are separate from school membership. MFA is required for every operator.</p><h1>Platform team</h1>
@if(session('status'))<p>{{ session('status') }}</p>@endif @if($errors->any())<p>{{ $errors->first() }}</p>@endif
<section><h2>Current operators</h2>
@forelse($operators as $operator)<article><strong>{{ $operator->name }}</strong><span>{{ $operator->email }}</span>
<form method="post" action="{{ route('owner.team.role', $operator) }}">@csrf<select name="platform_role" aria-label="Platform role for {{ $operator->email }}">@foreach(['owner','security','support','operations','content','none'] as $role)<option value="{{ $role }}" @selected(($operator->platform_role ?: 'none') === $role)>{{ ucfirst($role) }}</option>@endforeach</select><button type="submit">Save role</button></form>
@if(!$operator->is(request()->user()))<form method="post" action="{{ route('owner.team.reset-mfa', $operator) }}">@csrf<button type="submit">Reset MFA</button></form>@endif
</article>@empty<p>No platform operators are configured.</p>@endforelse
</section>
<section><h2>Add an existing user</h2><p>Only users without a platform role are shown.</p><form method="get" action="{{ route('owner.team.index') }}"><input name="q" value="{{ $query }}" minlength="2" placeholder="Search name or email"><button type="submit">Search</button></form>
@foreach($availableUsers as $user)<article><strong>{{ $user->name }}</strong><span>{{ $user->email }}</span><form method="post" action="{{ route('owner.team.role', $user) }}">@csrf<select name="platform_role"><option value="support">Support</option><option value="security">Security</option><option value="operations">Operations</option><option value="content">Content</option><option value="owner">Owner</option></select><button type="submit">Add operator</button></form></article>@endforeach
</section></main></body></html>
