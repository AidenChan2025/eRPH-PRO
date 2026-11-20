<?php

namespace App\Http\Controllers;

use App\Models\LessonPlanSubmission;
use App\Models\TeacherProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolReportController extends Controller
{
    public function __invoke(Request $request)
    {
        $school = $request->attributes->get('school');
        $activeTeachers = TeacherProfile::where('school_id', $school->id)->where('employment_status', 'active')->count();
        $submitted = LessonPlanSubmission::where('school_id', $school->id)->whereDate('submitted_at', '>=', now()->startOfWeek())->count();
        $onTime = LessonPlanSubmission::where('school_id', $school->id)->whereDate('submitted_at', '>=', now()->startOfWeek())->where('status', 'on_time')->count();
        $late = LessonPlanSubmission::where('school_id', $school->id)->whereDate('submitted_at', '>=', now()->startOfWeek())->where('status', 'late')->count();
        $pending = max($activeTeachers - $submitted, 0);
        $recent = LessonPlanSubmission::query()
            ->where('school_id', $school->id)
            ->whereDate('submitted_at', '>=', now()->startOfWeek())
            ->with(['teacherProfile.user'])
            ->latest('submitted_at')
            ->limit(20)
            ->get();

        return view('school-reports.dashboard', compact('school', 'activeTeachers', 'submitted', 'onTime', 'late', 'pending', 'recent'));
    }
}
