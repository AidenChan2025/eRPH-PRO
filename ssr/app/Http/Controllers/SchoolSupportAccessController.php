<?php

namespace App\Http\Controllers;

use App\Models\PlatformSupportAccessGrant;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SchoolSupportAccessController extends Controller
{
    public function store(Request $request, AuditLogger $audit)
    {
        $data = $request->validate([
            'ticket_public_id' => ['required', 'uuid'],
            'owner_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([$request->user()->id])],
            'purpose' => ['required', 'string', 'min:12', 'max:500'],
            'duration_minutes' => ['required', 'integer', Rule::in([15, 30, 60, 120])],
        ]);
        $schoolId = $request->attributes->get('school')->id;
        $ticket = SupportTicket::query()
            ->where('school_id', $schoolId)
            ->where('public_id', $data['ticket_public_id'])
            ->first();
        if (! $ticket) {
            if (SupportTicket::query()->where('public_id', $data['ticket_public_id'])->exists()) {
                $audit->record('school_support_access.denied', $request->attributes->get('school'), SupportTicket::class, hash('sha256', $data['ticket_public_id']), [
                    'reason' => 'ticket_not_in_current_school',
                ]);
            }
            abort_unless($ticket, 404);
        }
        $owner = User::query()->whereKey($data['owner_id'])
            ->where('platform_role', 'owner')->firstOrFail();

        DB::transaction(function () use ($schoolId, $ticket, $owner, $request, $data, $audit): void {
            // Serialize grant replacement for this ticket so concurrent admin
            // submissions cannot leave overlapping active grants for one owner.
            SupportTicket::query()->whereKey($ticket->id)->lockForUpdate()->firstOrFail();
            $previousGrants = PlatformSupportAccessGrant::query()
                ->where('school_id', $schoolId)->where('support_ticket_id', $ticket->id)
                ->where('platform_owner_id', $owner->id)->whereNull('revoked_at')
                ->lockForUpdate()->get();
            foreach ($previousGrants as $previousGrant) {
                $previousGrant->update(['revoked_at' => now(), 'grant_slot_key' => null]);
                $audit->record('school_support_access.revoked', $request->attributes->get('school'), PlatformSupportAccessGrant::class, (string) $previousGrant->id, [
                    'reason' => 'replaced_by_new_grant', 'mode' => 'read_only',
                ]);
            }
            $grant = PlatformSupportAccessGrant::query()->create([
                'school_id' => $schoolId,
                'support_ticket_id' => $ticket->id,
                'platform_owner_id' => $owner->id,
                'approved_by' => $request->user()->id,
                'purpose' => $data['purpose'],
                'grant_slot_key' => implode(':', [$schoolId, $ticket->id, $owner->id]),
                'expires_at' => now()->addMinutes((int) $data['duration_minutes']),
            ]);
            $audit->record('school_support_access.granted', $request->attributes->get('school'), PlatformSupportAccessGrant::class, (string) $grant->id, [
                'ticket_id' => $ticket->id,
                'platform_owner_id' => $owner->id,
                'expires_at' => $grant->expires_at->toIso8601String(),
                'mode' => 'read_only',
            ]);
        });

        return back()->with('status', 'Time-limited read-only support access granted.');
    }
}
