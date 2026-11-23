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
}
