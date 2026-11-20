<?php

namespace App\Http\Controllers;

use App\Models\TeacherProfile;
use Illuminate\Http\Request;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SchoolAdminController extends Controller
{
    public function __invoke(Request $request)
    {
        $school = $request->attributes->get('school');
        $teachers = TeacherProfile::query()
            ->where('school_id', $school->id)
            ->with('user')
            ->orderBy('employment_status')
            ->orderBy('staff_no')
            ->get();

        return view('school-admin.dashboard', compact('school', 'teachers'));
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190'],
            'role' => ['required', 'in:teacher,school_admin,principal,vice_principal'],
            'staff_no' => ['nullable', 'string', 'max:40'],
            'position' => ['nullable', 'string', 'max:120'],
        ]);

        $email = strtolower($data['email']);
        $user = User::firstOrCreate(['email' => $email], ['name' => $data['name'], 'password' => Hash::make(Str::random(48))]);
        $user->forceFill(['name' => $data['name']])->save();
        $school->members()->syncWithoutDetaching([$user->id => [
            'role' => $data['role'], 'status' => 'active', 'joined_at' => now(),
        ]]);

        $profile = TeacherProfile::withTrashed()->updateOrCreate(
            ['school_id' => $school->id, 'user_id' => $user->id],
            ['staff_no' => $data['staff_no'] ?? null, 'position' => $data['position'] ?? null, 'employment_status' => 'active', 'deleted_at' => null]
        );
        $auditLogger->record('school.teacher_profile_upserted', $school, TeacherProfile::class, (string) $profile->id, ['email' => $email, 'role' => $data['role']]);

        return redirect()->route('school.admin')->with('status', 'School account saved.');
    }

    public function access(Request $request)
    {
        $school = $request->attributes->get('school');
        $temporary = $school->members()
            ->wherePivot('expires_at', '!=', null)
            ->wherePivot('status', 'active')
            ->orderByPivot('expires_at')
            ->get();

        return view('school-admin.access', compact('school', 'temporary'));
    }

    public function grantAccess(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190'],
            'role' => ['required', 'in:inspector,school_admin,principal,vice_principal'],
            'expires_at' => ['required', 'date', 'after:now'],
            'access_reason' => ['required', 'string', 'max:500'],
        ]);
        $email = strtolower($data['email']);
        $user = User::firstOrCreate(['email' => $email], ['name' => $data['name'], 'password' => Hash::make(Str::random(48))]);
        $user->forceFill(['name' => $data['name']])->save();
        $school->members()->syncWithoutDetaching([$user->id => [
            'role' => $data['role'], 'status' => 'active', 'expires_at' => $data['expires_at'], 'access_reason' => $data['access_reason'],
        ]]);
        $auditLogger->record('school.temporary_access_granted', $school, User::class, (string) $user->id, ['email' => $email, 'role' => $data['role'], 'expires_at' => $data['expires_at'], 'reason' => $data['access_reason']]);

        return redirect()->route('school.admin.access')->with('status', 'Temporary access granted.');
    }
}
