<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Platform overview · eRPH Pro</title></head>
<body>
<header><strong>eRPH Pro · Platform Owner</strong><nav aria-label="Platform navigation">
@if(in_array('platform.schools.view', $permissions, true)) <a href="{{ route('owner.schools.index') }}">Schools</a> @endif
@if(in_array('platform.accounts.manage', $permissions, true)) <a href="{{ route('owner.accounts.index') }}">Accounts</a> @endif
@if(in_array('platform.team.manage', $permissions, true)) <a href="{{ route('owner.team.index') }}">Team</a> @endif
@if(in_array('platform.runtime.view', $permissions, true)) <a href="{{ route('owner.runtime') }}">Runtime</a> @endif
@if(in_array('platform.audit.view', $permissions, true)) <a href="{{ route('owner.audit') }}">Audit</a> @endif
@if(in_array('platform.settings.manage', $permissions, true)) <a href="{{ route('owner.settings') }}">Settings</a> @endif
<form method="post" action="{{ route('owner.logout') }}">@csrf<button type="submit">Sign out</button></form>
</nav></header>
<main>
<p>Platform overview · outside a school tenant</p><h1>Overview</h1>
<p>Metrics are limited to the platform permissions granted to this operator.</p>
<section aria-label="Platform metrics"><dl><dt>Total schools</dt><dd>{{ $metrics['schools'] }}</dd><dt>Active schools</dt><dd>{{ $metrics['active_schools'] }}</dd>
@if($metrics['pending_invitations'] !== null)<dt>Pending invitations</dt><dd>{{ $metrics['pending_invitations'] }}</dd>@endif
@if($metrics['platform_operators'] !== null)<dt>Platform operators</dt><dd>{{ $metrics['platform_operators'] }}</dd>@endif</dl></section>
@if(in_array('platform.schools.view', $permissions, true))<section><h2>Schools</h2>@forelse($schools as $school)<article><strong>{{ $school->name }}</strong><span>{{ $school->subdomain }}.{{ config('app.school_base_domain', 'erphpro.com') }} · {{ $school->members_count }} members · {{ $school->is_active ? 'Active' : 'Inactive' }}</span></article>@empty<p>No schools registered.</p>@endforelse</section>@else<p>School directory unavailable for this role.</p>@endif
@if(in_array('platform.audit.view', $permissions, true))<section><h2>Recent audit activity</h2>@forelse($recentAudits as $audit)<p><code>{{ $audit->action }}</code> · {{ $audit->created_at }}</p>@empty<p>No audit activity recorded.</p>@endforelse</section>@endif
</main>
</body>
</html>
<link rel="stylesheet" href="{{ asset('css/erph-design-system.css') }}">
