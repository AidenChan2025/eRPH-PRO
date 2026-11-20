<?php

namespace App\Http\Controllers;

use App\Models\TeacherProfile;
use Illuminate\Http\Request;
use App\Models\User;
use App\Services\AuditLogger;

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
        $user = User::firstOrCreate(['email' => $email], ['name' => $data['name']]);
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
}
