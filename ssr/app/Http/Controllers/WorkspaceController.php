<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use App\Models\TeacherProfile;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function maklumatAm(Request $request)
    {
        return view('workspace.maklumat-am', ['school' => $request->attributes->get('school')]);
    }

    public function __invoke(Request $request)
    {
        $school = $request->attributes->get('school');
        $user = $request->user();
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $user->id)->first();
        $plans = $profile ? LessonPlan::where('school_id', $school->id)->where('teacher_profile_id', $profile->id) : LessonPlan::whereRaw('1 = 0');
        $statusCounts = collect(['draft' => 0, 'submitted' => 0, 'returned' => 0, 'approved' => 0])
            ->merge($plans->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'))
            ->all();
        $recentPlans = $profile
            ? LessonPlan::where('school_id', $school->id)->where('teacher_profile_id', $profile->id)->latest('lesson_date')->limit(6)->get()
            : collect();

        return view('workspace.dashboard', [
            'school' => $school,
            'profile' => $profile,
            'lessonPlanCount' => $profile ? LessonPlan::where('school_id', $school->id)->where('teacher_profile_id', $profile->id)->count() : 0,
            'draftCount' => $profile ? LessonPlan::where('school_id', $school->id)->where('teacher_profile_id', $profile->id)->where('status', 'draft')->count() : 0,
            'statusCounts' => $statusCounts,
            'recentPlans' => $recentPlans,
        ]);
    }
}
