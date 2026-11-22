<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class OwnerSupportController extends Controller
{
    public function index(Request $request, AuditLogger $audit)
    {
        $query = SupportTicket::query()->whereHas('platformAccessGrants', fn ($grant) => $grant
            ->where('platform_owner_id', $request->user()->id)
            ->whereColumn('platform_support_access_grants.school_id', 'support_tickets.school_id')
            ->where('expires_at', '>', now())
            ->whereNull('revoked_at'))
            ->select([
                'support_tickets.id', 'support_tickets.public_id', 'support_tickets.school_id',
                'support_tickets.status', 'support_tickets.priority', 'support_tickets.last_activity_at',
            ])
            ->latest('last_activity_at');
        if ($request->filled('status') && in_array($request->string('status')->toString(), ['open', 'pending', 'resolved', 'closed'], true)) {
            $query->where('status', $request->string('status')->toString());
        }
        $tickets = $query->paginate(25)->withQueryString();
        $audit->record('platform_support.inbox_viewed', null, 'SupportTicketIndex', null, [
            'status_filter' => $request->string('status')->toString(),
            'mode' => 'read_only',
        ]);

        return view('owner.support.index', compact('tickets'));
    }

    public function show(Request $request, string $publicId, AuditLogger $audit)
    {
        $ticket = SupportTicket::query()->where('public_id', $publicId)->firstOrFail();
        $activeGrant = $ticket->platformAccessGrants()->where('platform_owner_id', $request->user()->id)
            ->where('school_id', $ticket->school_id)
            ->where('expires_at', '>', now())->whereNull('revoked_at')->latest('id')->first();
        if (! $activeGrant) {
            $audit->record('platform_support.ticket_access_denied', $ticket->school, SupportTicket::class, hash('sha256', $ticket->public_id), ['reason' => 'no_active_scoped_grant']);
            abort(404);
        }
        /*
         * Load messages only after the school-scoped grant has been verified.
         * This view does not expose requester profile fields or internal events.
         */
        $ticket->load(['messages' => fn ($query) => $query->where('is_internal', false)->orderBy('id')]);
        $audit->record('platform_support.ticket_viewed', $ticket->school, SupportTicket::class, (string) $ticket->id, [
            'grant_id' => $activeGrant->id,
            'mode' => 'read_only',
        ]);

        return view('owner.support.show', compact('ticket', 'activeGrant'));
    }

    public function update(Request $request, string $publicId, AuditLogger $audit)
    {
        $this->denyWrite($request, $publicId, 'status_update', $audit);
    }

    public function reply(Request $request, string $publicId, AuditLogger $audit)
    {
        $this->denyWrite($request, $publicId, 'reply', $audit);
    }

    private function denyWrite(Request $request, string $publicId, string $operation, AuditLogger $audit): never
    {
        $ticket = SupportTicket::query()->where('public_id', $publicId)->first(['id', 'school_id']);
        abort_unless($ticket, 404);
        $grant = $ticket->platformAccessGrants()->where('platform_owner_id', $request->user()->id)
            ->where('school_id', $ticket->school_id)
            ->where('expires_at', '>', now())->whereNull('revoked_at')->latest('id')->first();
        if (! $grant) {
            $audit->record('platform_support.ticket_access_denied', $ticket->school, SupportTicket::class, hash('sha256', $publicId), [
                'operation' => $operation,
                'reason' => 'no_active_scoped_grant',
            ]);
            abort(404);
        }
        $audit->record('platform_support.write_denied', $ticket->school, SupportTicket::class, hash('sha256', $publicId), [
            'operation' => $operation,
            'reason' => 'school_approval_is_read_only',
            'grant_id' => $grant->id,
        ]);
        abort(403, 'School approval currently grants read-only support access.');
    }
}
