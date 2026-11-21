<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Services\SupportAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SupportTicketController extends Controller
{
    public function create()
    {
        return view('support.ticket-create');
    }

    public function store(Request $request, SupportAIService $ai)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190'],
            'subject' => ['required', 'string', 'max:240'],
            'category' => ['required', 'in:account,login,lesson_plans,school_admin,email,billing,security,bug,feature,general'],
            'message' => ['required', 'string', 'min:10', 'max:12000'],
        ]);

        [$ticket, $token] = DB::transaction(function () use ($request, $data): array {
            $token = Str::random(64);
            $ticket = SupportTicket::create([
                'public_id' => (string) Str::uuid(),
                'access_token_hash' => hash('sha256', $token),
                'requester_user_id' => $request->user()?->id,
                'requester_name' => $data['name'],
                'requester_email' => strtolower($data['email']),
                'subject' => $data['subject'],
                'category' => $data['category'],
                'priority' => $data['category'] === 'security' ? 'high' : 'normal',
                'status' => 'open',
                'last_activity_at' => now(),
            ]);
            $ticket->messages()->create([
                'user_id' => $request->user()?->id,
                'author_name' => $data['name'],
                'author_email' => strtolower($data['email']),
                'source' => 'requester',
                'body' => $data['message'],
                'sent_at' => now(),
            ]);
            $ticket->events()->create(['event' => 'ticket.created', 'metadata' => ['category' => $data['category']]]);

            return [$ticket, $token];
        });

        $analysis = $ai->analyse($ticket);
        $priorityRank = ['low' => 0, 'normal' => 1, 'high' => 2, 'urgent' => 3];
        $aiPriority = $analysis['priority'] ?? null;
        $priority = isset($priorityRank[$aiPriority], $priorityRank[$ticket->priority])
            && $priorityRank[$aiPriority] > $priorityRank[$ticket->priority]
            ? $aiPriority
            : $ticket->priority;
        $ticket->update([
            'ai_state' => $analysis['state'] ?? 'failed',
            'ai_confidence' => $analysis['confidence'] ?? null,
            'ai_summary' => $analysis['summary'] ?? null,
            'ai_reply_draft' => $analysis['reply_draft'] ?? null,
            'priority' => $priority,
        ]);

        try {
            Mail::raw("New eRPH Pro support ticket {$ticket->public_id}: {$ticket->subject}", function ($mail) use ($ticket) {
                $mail->to(config('support.admin_email'))
                    ->replyTo($ticket->requester_email, $ticket->requester_name)
                    ->subject('New eRPH Pro support ticket');
            });
        } catch (\Throwable $exception) {
            report($exception);
        }

        return redirect()->route('support.ticket.show', ['publicId' => $ticket->public_id, 'token' => $token]);
    }

    public function show(Request $request, string $publicId)
    {
        $ticket = SupportTicket::query()->with(['messages' => fn ($query) => $query->where('is_internal', false)->orderBy('id')])->where('public_id', $publicId)->firstOrFail();
        $this->authoriseTicket($request, $ticket);

        if ($request->filled('token')) {
            return redirect()->route('support.ticket.show', $ticket->public_id);
        }

        return view('support.ticket-show', compact('ticket'));
    }

    public function reply(Request $request, string $publicId)
    {
        $ticket = SupportTicket::query()->where('public_id', $publicId)->firstOrFail();
        $this->authoriseTicket($request, $ticket);
        $data = $request->validate(['message' => ['required', 'string', 'min:2', 'max:12000']]);
        $ticket->messages()->create([
            'author_name' => $ticket->requester_name,
            'author_email' => $ticket->requester_email,
            'source' => 'requester',
            'body' => $data['message'],
            'sent_at' => now(),
        ]);
        $ticket->update(['status' => 'open', 'last_activity_at' => now()]);
        $ticket->events()->create(['event' => 'ticket.replied_by_requester']);

        return back()->with('status', 'Your reply has been added.');
    }

    private function authoriseTicket(Request $request, SupportTicket $ticket): void
    {
        $providedToken = (string) $request->query('token');
        $token = $providedToken !== '' ? $providedToken : (string) $request->session()->get("support.ticket_tokens.{$ticket->public_id}");
        abort_unless($token !== '' && hash_equals($ticket->access_token_hash, hash('sha256', $token)), 403);

        if ($providedToken !== '') {
            $request->session()->put("support.ticket_tokens.{$ticket->public_id}", $providedToken);
        }
    }
}
