<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;

class OwnerController extends Controller
{
    public function __invoke(Request $request)
    {
        $permissions = config('permissions.platform_roles.'.$request->user()?->platform_role, []);
        $schools = in_array('platform.schools.view', $permissions, true)
            ? School::query()->withCount('members')->orderBy('name')->get()
            : collect();

        return view('owner.dashboard', compact('schools'));
    }
}
