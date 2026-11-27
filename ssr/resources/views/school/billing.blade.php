<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>School Billing · {{ $school->name }}</title>
    <style>
        :root{--ink:#172033;--muted:#687386;--blue:#2563eb;--line:#e5eaf2;--canvas:#f7f9fc;--surface:#fff;--green:#16845a;--amber:#9a6500}
        *{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font:15px Arial,sans-serif;line-height:1.5}
        .shell{width:clamp(80vw,90vw,1800px);max-width:none;margin-inline:auto;padding:clamp(24px,6vw,64px) 18px}.eyebrow{color:var(--blue);font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}.heading{margin-bottom:26px}.heading h1{margin:8px 0 0;font-size:clamp(28px,5vw,40px);letter-spacing:-.055em;line-height:1.1}.heading p{color:var(--muted)}
        .panel{padding:clamp(22px,4vw,34px);border:1px solid var(--line);border-radius:16px;background:var(--surface);box-shadow:0 10px 28px #1e315308}.summary{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:22px}.summary div{padding:16px;border:1px solid var(--line);border-radius:12px;background:#fbfcfe}.label{display:block;color:var(--muted);font-size:12px}.value{display:block;margin-top:4px;font-weight:800;font-size:20px}.notice{margin:0 0 18px;padding:13px 15px;border-radius:10px;background:#eef4ff;color:#214fae}.error{background:#fff3ed;color:#a33f12}.form-row{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-top:20px}label{display:grid;gap:6px;color:var(--muted);font-size:12px;font-weight:700}select,button{min-height:42px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);font:inherit;padding:0 13px}select{min-width:180px}button{border-color:var(--blue);background:var(--blue);color:#fff;font-weight:700;cursor:pointer}button:hover{background:#1d4ed8}button:focus-visible,select:focus-visible{outline:3px solid #bfdbfe;outline-offset:2px}
        @media(max-width:560px){.summary{grid-template-columns:1fr}.form-row{align-items:stretch;display:grid}.form-row select,.form-row button{width:100%}}
    </style>
</head>
<body>
<main class="shell">
    <div class="heading"><span class="eyebrow">School workspace</span><h1>{{ $school->name }} — Subscription &amp; Billing</h1><p>Manage the plan attached to this school workspace.</p></div>
    <section class="card"><h2>Invoices</h2><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Issued</th><th>Due</th><th>Status</th><th>Total</th></tr></thead><tbody>@forelse($invoices as $invoice)<tr><td>{{ $invoice->invoice_number }}</td><td>{{ $invoice->issued_on->format('d M Y') }}</td><td>{{ $invoice->due_on?->format('d M Y') ?: '—' }}</td><td>{{ ucfirst($invoice->status) }}</td><td>{{ $invoice->currency }} {{ number_format($invoice->amount_minor / 100, 2) }}</td></tr>@empty<tr><td colspan="5">No invoices yet.</td></tr>@endforelse</tbody></table></div></section>
    <section class="panel">
    @if(request('checkout') === 'success')
        <p class="notice" role="status">Stripe checkout completed. Your subscription will activate after Stripe confirms the billing period.</p>
    @elseif(request('checkout') === 'canceled')
        <p class="notice" role="status">Stripe checkout was canceled. No subscription changes were made.</p>
    @endif
    <div class="summary"><div><span class="label">Current Plan</span><strong class="value">{{ $subscription?->plan_code ?? 'trial' }}</strong></div><div><span class="label">Status</span><strong class="value">{{ $subscription?->status ?? 'trialing' }}</strong></div></div>
    @if($errors->any())<p class="notice error" role="alert">{{ $errors->first() }}</p>@endif
    @if($stripeConfigured)
        <form class="form-row" method="post" action="{{ route('school.billing.checkout') }}">
            @csrf
            <label>Plan<select name="plan_code">
                <option value="monthly">Monthly Plan</option>
                <option value="yearly">Yearly Plan</option>
            </select></label>
            <button type="submit">Subscribe with Stripe</button>
        </form>
    @else
        <p class="notice">Stripe billing is pending platform configuration.</p>
    @endif
    </section>
</main>
</body>
</html>
<link rel="stylesheet" href="{{ asset('css/erph-design-system.css') }}">
