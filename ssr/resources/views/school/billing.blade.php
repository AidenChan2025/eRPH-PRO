<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>School Billing · {{ $school->name }}</title>
</head>
<body>
<main>
    <h1>{{ $school->name }} — Subscription &amp; Billing</h1>
    @if(request('checkout') === 'success')
        <p role="status">Stripe checkout completed. Your subscription will activate after Stripe confirms the billing period.</p>
    @elseif(request('checkout') === 'canceled')
        <p role="status">Stripe checkout was canceled. No subscription changes were made.</p>
    @endif
    <p>Current Plan: {{ $subscription?->plan_code ?? 'trial' }}</p>
    <p>Status: {{ $subscription?->status ?? 'trialing' }}</p>
    @if($errors->any())<p>{{ $errors->first() }}</p>@endif
    @if($stripeConfigured)
        <form method="post" action="{{ route('school.billing.checkout') }}">
            @csrf
            <select name="plan_code">
                <option value="monthly">Monthly Plan</option>
                <option value="yearly">Yearly Plan</option>
            </select>
            <button type="submit">Subscribe with Stripe</button>
        </form>
    @else
        <p>Stripe billing is pending platform configuration.</p>
    @endif
</main>
</body>
</html>
