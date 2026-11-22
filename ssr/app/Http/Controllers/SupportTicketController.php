<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Services\SupportAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
            'ai_processing_consent' => ['sometimes', 'accepted'],
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
                'ai_processing_consent_at' => config('support.ai_enabled') && isset($data['ai_processing_consent']) ? now() : null,
                'ai_processing_consent_version' => config('support.ai_enabled') && isset($data['ai_processing_consent']) ? SupportAIService::CONSENT_VERSION : null,
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

        $request->session()->put("support.ticket_tokens.{$ticket->public_id}", $token);
        $this->trimSessionTicketTokens($request);

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

        return redirect()->route('support.ticket.show', $ticket->public_id);
    }

    public function show(Request $request, string $publicId)
    {
        $ticket = SupportTicket::query()->where('public_id', $publicId)->firstOrFail();

        if ($request->query->has('token')) {
            return redirect()->route('support.ticket.show', $ticket->public_id)->withHeaders([
                'Referrer-Policy' => 'no-referrer',
                'Cache-Control' => 'no-store, private',
            ]);
        }

        if (! $this->canAccessTicket($request, $ticket)) {
            return response()->view('support.ticket-recovery', compact('ticket'), 403)
                ->header('Referrer-Policy', 'no-referrer')
                ->header('Cache-Control', 'no-store, private');
        }

        $ticket->load(['messages' => fn ($query) => $query->where('is_internal', false)->orderBy('id')]);

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

    public function sendRecoveryCode(Request $request, string $publicId)
    {
        $data = $request->validate(['email' => ['required', 'email:rfc', 'max:190']]);
        $ticket = SupportTicket::query()->where('public_id', $publicId)->firstOrFail();

        $code = null;
        $submittedEmail = strtolower(trim($data['email']));
        $storedEmail = strtolower(trim((string) $ticket->requester_email));
        if (hash_equals($storedEmail, $submittedEmail)) {
            $code = (string) random_int(100000, 999999);
            $issued = DB::transaction(function () use ($ticket, $code): bool {
                $locked = SupportTicket::query()->whereKey($ticket->id)->lockForUpdate()->firstOrFail();
                if ($locked->recovery_code_sent_at?->gt(now()->subMinute())) {
                    return false;
                }

                if (! $locked->recovery_code_window_started_at?->gt(now()->subHour())) {
                    $locked->recovery_code_window_started_at = now();
                    $locked->recovery_code_sent_count = 0;
                }
                if ($locked->recovery_code_sent_count >= 5) {
                    return false;
                }

                if ($locked->recovery_code_attempts >= 5 && $locked->recovery_code_last_attempt_at?->gt(now()->subMinutes(15))) {
                    return false;
                }

                if ($locked->recovery_code_attempts >= 5) {
                    $locked->recovery_code_attempts = 0;
                    $locked->recovery_code_last_attempt_at = null;
                }

                $locked->forceFill([
                    'recovery_code_hash' => Hash::make($code),
                    'recovery_code_expires_at' => now()->addMinutes(15),
                    'recovery_code_sent_at' => now(),
                    'recovery_code_sent_count' => $locked->recovery_code_sent_count + 1,
                ])->save();

                return true;
            });

            if ($issued) {
                $request->session()->put("support.ticket_recovery_pending.{$ticket->public_id}", true);

                try {
                    Mail::raw("Your eRPH Pro ticket verification code is {$code}. It expires in 15 minutes. If you did not request it, ignore this email.", function ($mail) use ($ticket) {
                        $mail->to($ticket->requester_email)
                            ->subject('eRPH Pro ticket verification code');
                    });
                } catch (\Throwable $exception) {
                    report($exception);
                }
            }
        }

        return back()->with('status', 'If the email matches this ticket, a one-time code will be sent. If it does not arrive, wait one minute before requesting another.');
    }

    public function verifyRecoveryCode(Request $request, string $publicId)
    {
        $data = $request->validate(['code' => ['required', 'digits:6']]);
        if ($request->session()->get("support.ticket_recovery_pending.{$publicId}") !== true) {
            return back()->withErrors(['code' => 'The code is invalid, expired, or has reached its attempt limit.']);
        }

        $valid = DB::transaction(function () use ($publicId, $data): bool {
            $ticket = SupportTicket::query()->where('public_id', $publicId)->lockForUpdate()->firstOrFail();
            if (! $ticket->recovery_code_last_attempt_at?->gt(now()->subMinutes(15))) {
                $ticket->recovery_code_attempts = 0;
                $ticket->recovery_code_last_attempt_at = null;
            }

            $valid = is_string($ticket->recovery_code_hash)
                && $ticket->recovery_code_hash !== ''
                && $ticket->recovery_code_expires_at?->isFuture()
                && $ticket->recovery_code_attempts < 5
                && Hash::check($data['code'], $ticket->recovery_code_hash);

            if (! $valid) {
                if ($ticket->recovery_code_hash) {
                    $attempts = min(5, $ticket->recovery_code_attempts + 1);
                    $ticket->forceFill($attempts >= 5
                        ? ['recovery_code_hash' => null, 'recovery_code_expires_at' => null, 'recovery_code_attempts' => 5, 'recovery_code_last_attempt_at' => now()]
                        : ['recovery_code_attempts' => $attempts, 'recovery_code_last_attempt_at' => now()])->save();
                }

                return false;
            }

            $ticket->forceFill([
                'recovery_code_hash' => null,
                'recovery_code_expires_at' => null,
                'recovery_code_attempts' => 0,
                'recovery_code_last_attempt_at' => null,
            ])->save();

            return true;
        });

        if (! $valid) {
            return back()->withErrors(['code' => 'The code is invalid, expired, or has reached its attempt limit.']);
        }

        $request->session()->forget("support.ticket_recovery_pending.{$publicId}");
        $request->session()->put("support.ticket_recovered.{$publicId}", true);
        $request->session()->regenerate();

        return redirect()->route('support.ticket.show', $publicId);
    }

    private function canAccessTicket(Request $request, SupportTicket $ticket): bool
    {
        if ($request->user() && $ticket->requester_user_id === $request->user()->id) {
            return true;
        }

        if ($request->session()->get("support.ticket_recovered.{$ticket->public_id}") === true) {
            return true;
        }

        $token = $request->session()->get("support.ticket_tokens.{$ticket->public_id}");

        return is_string($token)
            && $token !== ''
            && is_string($ticket->access_token_hash)
            && $ticket->access_token_hash !== ''
            && hash_equals($ticket->access_token_hash, hash('sha256', $token));
    }

    private function authoriseTicket(Request $request, SupportTicket $ticket): void
    {
        abort_unless($this->canAccessTicket($request, $ticket), 403);
    }

    private function trimSessionTicketTokens(Request $request): void
    {
        $tokens = $request->session()->get('support.ticket_tokens', []);
        if (! is_array($tokens) || count($tokens) <= 10) {
            return;
        }

        $request->session()->put('support.ticket_tokens', array_slice($tokens, -10, null, true));
    }
}
