<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use App\Models\TeacherProfile;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function __invoke(Request $request)
    {
        $school = $request->attributes->get('school');
        $user = $request->user();
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $user->id)->first();

        return view('workspace.dashboard', [
            'school' => $school,
            'profile' => $profile,
            'lessonPlanCount' => $profile ? LessonPlan::where('school_id', $school->id)->where('teacher_profile_id', $profile->id)->count() : 0,
            'draftCount' => $profile ? LessonPlan::where('school_id', $school->id)->where('teacher_profile_id', $profile->id)->where('status', 'draft')->count() : 0,
        ]);
    }
}
