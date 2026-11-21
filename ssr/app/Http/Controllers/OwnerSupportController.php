<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OwnerSupportController extends Controller
{
    public function index(Request $request)
    {
        $query = SupportTicket::query()->withCount('messages')->latest('last_activity_at');
        if ($request->filled('status') && in_array($request->string('status')->toString(), ['open', 'pending', 'resolved', 'closed'], true)) {
            $query->where('status', $request->string('status')->toString());
        }
        $tickets = $query->paginate(25)->withQueryString();

        return view('owner.support.index', compact('tickets'));
    }

    public function show(string $publicId)
    {
        $ticket = SupportTicket::query()->with(['messages' => fn ($query) => $query->orderBy('id'), 'events'])->where('public_id', $publicId)->firstOrFail();

        return view('owner.support.show', compact('ticket'));
    }

    public function update(Request $request, string $publicId)
    {
        $ticket = SupportTicket::query()->where('public_id', $publicId)->firstOrFail();
        $data = $request->validate([
            'status' => ['required', 'in:open,pending,resolved,closed'],
            'priority' => ['required', 'in:low,normal,high,urgent'],
        ]);
        $ticket->update($data + ['last_activity_at' => now()]);
        $ticket->events()->create(['user_id' => $request->user()->id, 'event' => 'ticket.updated', 'metadata' => $data]);

        return back()->with('status', 'Ticket updated.');
    }

    public function reply(Request $request, string $publicId)
    {
        $ticket = SupportTicket::query()->where('public_id', $publicId)->firstOrFail();
        $data = $request->validate(['message' => ['required', 'string', 'min:2', 'max:12000']]);
        $ticket->messages()->create([
            'user_id' => $request->user()->id,
            'author_name' => $request->user()->name,
            'author_email' => $request->user()->email,
            'source' => 'agent',
            'body' => $data['message'],
            'sent_at' => now(),
        ]);
        $ticket->update(['status' => 'pending', 'last_activity_at' => now()]);
        $ticket->events()->create(['user_id' => $request->user()->id, 'event' => 'ticket.replied_by_agent']);
        try {
            Mail::raw($data['message'], function ($mail) use ($ticket) {
                $mail->to($ticket->requester_email)
                    ->replyTo(config('support.admin_email'))
                    ->subject('eRPH Pro support update: ' . $ticket->subject);
            });
        } catch (\Throwable $exception) {
            report($exception);
        }

        return back()->with('status', 'Reply sent to the requester.');
    }
}
