<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerTeamController extends Controller
{
    private const ROLES = ['owner', 'security', 'support', 'operations', 'content', 'none'];

    public function index()
    {
        $operators = User::query()->whereNotNull('platform_role')->orderBy('name')->get(['id', 'name', 'email', 'platform_role']);

        return view('owner.team.index', compact('operators'));
    }

    public function updateRole(Request $request, User $user, AuditLogger $auditLogger)
    {
        $data = $request->validate(['platform_role' => ['required', 'in:'.implode(',', self::ROLES)]]);
        $nextRole = $data['platform_role'] === 'none' ? null : $data['platform_role'];

        if ($user->is($request->user()) && $nextRole !== 'owner') {
            return back()->withErrors(['platform_role' => 'You cannot remove or reduce your own Owner access.']);
        }

        if ($user->platform_role === 'owner' && $nextRole !== 'owner' && User::query()->where('platform_role', 'owner')->count() <= 1) {
            return back()->withErrors(['platform_role' => 'The platform must retain at least one Owner.']);
        }

        DB::transaction(function () use ($user, $nextRole, $auditLogger): void {
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
