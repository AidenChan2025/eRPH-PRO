@extends('support.layout')

@section('title', 'Ticket '.$ticket->public_id)
@section('content')
@php($token = request('token'))
<main class="shell"><section class="ticket-shell"><span class="eyebrow">Support ticket</span><h1>{{ $ticket->subject }}</h1><p class="muted">Ticket {{ $ticket->public_id }} · {{ ucfirst($ticket->status) }} · {{ ucfirst($ticket->priority) }} priority</p>@if(session('status'))<div class="notice">{{ session('status') }}</div>@endif<div class="messages">@foreach($ticket->messages as $message)<article class="message {{ $message->source === 'agent' ? 'agent' : '' }}"><small>{{ $message->author_name }} · {{ $message->created_at?->format('d M Y, H:i') }}</small><p>{{ $message->body }}</p></article>@endforeach</div><div class="form-panel"><form method="post" action="{{ request()->getScheme() }}://{{ config('support.host') }}/tickets/{{ $ticket->public_id }}/reply?token={{ urlencode($token) }}"><div class="field"><label for="message">Add a reply</label><textarea id="message" name="message" required minlength="2" maxlength="12000"></textarea></div><div style="display:flex;justify-content:flex-end;margin-top:15px"><button class="button" type="submit">Send reply</button></div>@csrf</form></div></section></main>
@endsection
