<?php

namespace App\Http\Controllers;

use App\Models\TeacherProfile;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class TeacherProfileController extends Controller
{
    public function edit(Request $request)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::firstOrCreate(
            ['school_id' => $school->id, 'user_id' => $request->user()->id],
            ['employment_status' => 'active']
        );

        return view('teacher-profile.edit', compact('school', 'profile'));
    }

    public function update(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $request->user()->id)->firstOrFail();
        $data = $request->validate([
            'staff_no' => ['nullable', 'string', 'max:40'],
            'identity_no' => ['nullable', 'string', 'max:40'],
            'phone' => ['nullable', 'string', 'max:40'],
            'position' => ['nullable', 'string', 'max:120'],
            'grade' => ['nullable', 'string', 'max:80'],
            'profile_data' => ['nullable', 'array'],
            'telegram_chat_id' => ['nullable', 'string', 'max:80'],
            'telegram_opt_in' => ['sometimes', 'boolean'],
        ]);
        $data['telegram_opt_in'] = $request->boolean('telegram_opt_in');
        $profile->update($data);
        $auditLogger->record('teacher.profile_updated', $school, TeacherProfile::class, (string) $profile->id, ['fields' => array_keys($data)]);

        return redirect()->route('teacher.profile.edit')->with('status', 'Teacher profile updated.');
    }
}
