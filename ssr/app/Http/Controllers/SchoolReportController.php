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
        $start = $request->date('from')?->startOfDay() ?? now()->startOfWeek();
        $end = $request->date('to')?->endOfDay() ?? now()->endOfWeek();
        if ($end->lt($start)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }
        $status = $request->string('status')->toString();
        if (! in_array($status, ['', 'on_time', 'late'], true)) {
            $status = '';
        }
        $period = fn ($query) => $query
            ->where('school_id', $school->id)
            ->whereBetween('submitted_at', [$start, $end])
            ->when($status !== '', fn ($query) => $query->where('status', $status));
        $activeTeachers = TeacherProfile::where('school_id', $school->id)->where('employment_status', 'active')->count();
        $submitted = $period(LessonPlanSubmission::query())->count();
        $onTime = $period(LessonPlanSubmission::query())->where('status', 'on_time')->count();
        $late = $period(LessonPlanSubmission::query())->where('status', 'late')->count();
        $pending = max($activeTeachers - $submitted, 0);
        $recent = LessonPlanSubmission::query()
            ->where('school_id', $school->id)
            ->whereBetween('submitted_at', [$start, $end])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->with(['teacherProfile.user'])
            ->latest('submitted_at')
            ->limit(20)
            ->get();

        return view('school-reports.dashboard', compact('school', 'activeTeachers', 'submitted', 'onTime', 'late', 'pending', 'recent', 'start', 'end', 'status'));
    }
}
