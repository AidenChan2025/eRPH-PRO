<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Billing &amp; Subscriptions · eRPH Pro</title>
    <link rel="stylesheet" href="{{ asset('css/erph-design-system.css') }}">
    <style>
        :root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc;--surface:#fff}
        *{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font:15px Arial,sans-serif;line-height:1.5}.shell{max-width:1240px;margin:0 auto;padding:clamp(24px,5vw,56px) 18px}.eyebrow{color:var(--blue);font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}.heading{margin-bottom:24px}.heading h1{margin:8px 0;font-size:clamp(28px,5vw,40px);letter-spacing:-.055em;line-height:1.1}.muted{color:var(--muted)}.panel{padding:clamp(18px,3vw,28px);border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 10px 28px #1e315308}.status-line{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 22px}.chip{padding:7px 10px;border-radius:999px;background:#eef4ff;color:#214fae;font-size:13px;font-weight:700}.table-wrap{overflow-x:auto}table{width:100%;min-width:780px;border-collapse:collapse}th,td{text-align:left;padding:14px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}tbody tr:hover{background:#fbfcfe}form{display:grid;grid-template-columns:130px 130px minmax(150px,1fr) auto;gap:8px;align-items:end}label{display:grid;gap:5px;color:var(--muted);font-size:11px;font-weight:700}select,input,button{min-height:40px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--ink);font:inherit;padding:0 10px}button{border-color:var(--blue);background:var(--blue);color:#fff;font-weight:700;cursor:pointer}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #bfdbfe;outline-offset:2px}
        @media(max-width:820px){form{grid-template-columns:1fr 1fr}.reason{grid-column:1/-1}form button{grid-column:1/-1}}@media(max-width:560px){form{grid-template-columns:1fr}}
    </style>
</head>
<body>
<main class="shell">
    <div class="heading"><span class="eyebrow">Platform operations</span><h1>Platform Billing &amp; Subscriptions</h1><p class="muted">Review school plans and keep subscription state current.</p></div>
    <section class="panel">
    <div class="status-line"><span class="chip">Stripe API: {{ $stripeConfigured ? 'Connected' : 'Pending API Keys' }}</span><span class="chip">Webhook: {{ $webhookConfigured ? 'Configured' : 'Pending Secret' }}</span></div>
    @if(session('status'))<p class="chip" role="status">{{ session('status') }}</p>@endif
    <div class="table-wrap"><table>
        <thead>
            <tr><th>School</th><th>Plan</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
        @foreach($schools as $school)
            @php($sub = $subscriptions->get($school->id))
            <tr>
                <td>{{ $school->name }}</td>
                <td>{{ $sub?->plan_code ?? 'trial' }}</td>
                <td>{{ $sub?->status ?? 'trialing' }}</td>
                <td>
                    <form method="post" action="{{ route('owner.billing.update', $school) }}">
                        @csrf
                        @method('PUT')
                        <select name="plan_code">
                            <option value="trial" @selected(($sub?->plan_code ?? 'trial') === 'trial')>Trial</option>
                            <option value="monthly" @selected(($sub?->plan_code ?? '') === 'monthly')>Monthly</option>
                            <option value="yearly" @selected(($sub?->plan_code ?? '') === 'yearly')>Yearly</option>
                        </select>
                        <select name="status">
                            <option value="trialing" @selected(($sub?->status ?? 'trialing') === 'trialing')>Trialing</option>
                            <option value="active" @selected(($sub?->status ?? '') === 'active')>Active</option>
                            <option value="past_due" @selected(($sub?->status ?? '') === 'past_due')>Past Due</option>
                            <option value="canceled" @selected(($sub?->status ?? '') === 'canceled')>Canceled</option>
                        </select>
                        <label class="reason">
                            Reason
                            <input type="text" name="reason" value="{{ old('reason') }}" minlength="3" maxlength="255" required>
                        </label>
                        <button type="submit">Save</button>
                    </form>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table></div>
    </section>
</main>
</body>
</html>
