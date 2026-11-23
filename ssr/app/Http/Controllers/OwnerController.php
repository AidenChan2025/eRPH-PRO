<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerController extends Controller
{
    public function __invoke(Request $request)
    {
        $permissions = config('permissions.platform_roles.'.$request->user()?->platform_role, []);
        $schools = in_array('platform.schools.view', $permissions, true)
            ? School::query()->withCount('members')->orderBy('name')->get()
            : collect();
        $metrics = [
            'schools' => $schools->count(),
            'active_schools' => $schools->where('is_active', true)->count(),
            'pending_invitations' => in_array('platform.schools.view', $permissions, true) ? DB::table('school_memberships')->where('status', 'pending')->count() : null,
            'platform_operators' => in_array('platform.team.manage', $permissions, true) ? DB::table('users')->whereNotNull('platform_role')->count() : null,
        ];
        $recentAudits = in_array('platform.audit.view', $permissions, true)
            ? DB::table('audit_logs')->latest('id')->limit(8)->get(['action', 'created_at', 'school_id', 'actor_id'])
            : collect();

        return view('owner.dashboard', compact('schools', 'permissions', 'metrics', 'recentAudits'));
    }
}
