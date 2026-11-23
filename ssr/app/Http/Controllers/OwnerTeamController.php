<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OwnerTeamController extends Controller
{
    private const ROLES = ['owner', 'security', 'support', 'operations', 'content', 'none'];

    public function index(Request $request)
    {
        $operators = User::query()->whereNotNull('platform_role')->orderBy('name')->get(['id', 'name', 'email', 'platform_role']);
        $query = trim((string) $request->query('q', ''));
        $availableUsers = $query === '' || mb_strlen($query) < 2
            ? collect()
            : User::query()
                ->whereNull('platform_role')
                ->where(fn ($builder) => $builder->where('name', 'like', "%{$query}%")->orWhere('email', 'like', "%{$query}%"))
                ->orderBy('name')->limit(20)->get(['id', 'name', 'email']);

        return view('owner.team.index', compact('operators', 'availableUsers', 'query'));
    }

    public function updateRole(Request $request, User $user, AuditLogger $auditLogger)
    {
        $data = $request->validate(['platform_role' => ['required', 'in:'.implode(',', self::ROLES)]]);
        $nextRole = $data['platform_role'] === 'none' ? null : $data['platform_role'];

        if ($user->is($request->user()) && $nextRole !== 'owner') {
            return back()->withErrors(['platform_role' => 'You cannot remove or reduce your own Owner access.']);
        }

        DB::transaction(function () use ($user, $nextRole, $auditLogger): void {
            if ($user->platform_role === 'owner' && $nextRole !== 'owner') {
                $owners = User::query()->where('platform_role', 'owner')->orderBy('id')->lockForUpdate()->get(['id']);
                if ($owners->count() <= 1) {
                    throw ValidationException::withMessages(['platform_role' => 'The platform must retain at least one Owner.']);
                }
            }

            $previousRole = $user->platform_role;
            $user->forceFill(['platform_role' => $nextRole])->save();
            $auditLogger->record('platform.operator_role_updated', null, User::class, (string) $user->id, [
                'previous_role' => $previousRole,
                'platform_role' => $nextRole,
            ]);
        });

        return redirect()->route('owner.team.index')->with('status', 'Platform role updated.');
    }

    public function resetMfa(Request $request, User $user, AuditLogger $auditLogger)
    {
        abort_if($user->is($request->user()), 422, 'Use the personal MFA recovery flow to reset your own MFA.');

        DB::transaction(function () use ($user, $auditLogger): void {
            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            abort_unless($lockedUser->platform_role !== null, 422, 'Only platform operators can have platform MFA reset.');
            $lockedUser->forceFill([
                'platform_mfa_secret' => null,
                'platform_mfa_confirmed_at' => null,
                'platform_mfa_recovery_codes' => null,
                'platform_mfa_recovery_codes_generated_at' => null,
            ])->save();
            $auditLogger->record('platform.operator_mfa_reset', null, User::class, (string) $lockedUser->id, ['platform_role' => $lockedUser->platform_role]);
        });

        return redirect()->route('owner.team.index')->with('status', 'Operator MFA reset. The operator must enroll again before using the platform console.');
    }
}
