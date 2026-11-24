<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Billing &amp; Subscriptions · eRPH Pro</title>
</head>
<body>
<main>
    <h1>Platform Billing &amp; Subscriptions</h1>
    <p>Stripe API: {{ $stripeConfigured ? 'Connected' : 'Pending API Keys' }} | Webhook: {{ $webhookConfigured ? 'Configured' : 'Pending Secret' }}</p>
    @if(session('status'))<p>{{ session('status') }}</p>@endif
    <table>
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
                        <label>
                            Reason
                            <input type="text" name="reason" value="{{ old('reason') }}" minlength="3" maxlength="255" required>
                        </label>
                        <button type="submit">Save</button>
                    </form>
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
</main>
</body>
</html>
