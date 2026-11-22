@extends('support.layout')

@section('title', 'Restore ticket access')
@section('content')
<main class="shell"><section class="ticket-shell"><span class="eyebrow">Private ticket access</span><h1>Restore access to your ticket</h1><p class="muted">This browser session no longer has access. Enter the email address used for the ticket and we will send a one-time verification code that expires in 15 minutes. Requests are limited to once per minute and five per hour. If the code does not arrive, check your spam folder before trying again.</p>@if(session('status'))<div class="notice">{{ session('status') }}</div>@endif
@if($errors->any())<div class="error"><ul>@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>@endif
<div class="form-panel"><form method="post" action="{{ route('support.ticket.recovery.send', $ticket->public_id) }}"><div class="field"><label for="email">Ticket email</label><input id="email" name="email" type="email" required autocomplete="email"></div><button class="button" type="submit">Send verification code</button>@csrf</form></div>
<div class="form-panel" style="margin-top:16px"><form method="post" action="{{ route('support.ticket.recovery.verify', $ticket->public_id) }}"><div class="field"><label for="code">Six-digit verification code</label><input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div><button class="button" type="submit">Verify and open ticket</button>@csrf</form></div></section></main>
@endsection
