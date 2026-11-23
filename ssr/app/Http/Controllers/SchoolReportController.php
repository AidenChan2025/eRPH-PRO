<?php

namespace App\Http\Controllers;

use App\Models\LessonPlanSubmission;
use App\Models\TeacherProfile;
use Illuminate\Http\Request;

class SchoolReportController extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'status' => ['nullable', 'in:on_time,late'],
        ]);
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
            ->whereBetween('submitted_at', [$start, $end]);
        $filtered = fn ($query) => $period($query)
            ->when($status !== '', fn ($query) => $query->where('status', $status));
        $activeTeachers = TeacherProfile::where('school_id', $school->id)->where('employment_status', 'active')->count();
        $submittedRecords = $period(LessonPlanSubmission::query())->count();
        $submittedTeachers = $period(LessonPlanSubmission::query())
            ->whereHas('teacherProfile', fn ($query) => $query->where('employment_status', 'active'))
            ->distinct('teacher_profile_id')
            ->count('teacher_profile_id');
        $onTime = $period(LessonPlanSubmission::query())->where('status', 'on_time')->count();
        $late = $period(LessonPlanSubmission::query())->where('status', 'late')->count();
        $pendingTeachers = max($activeTeachers - $submittedTeachers, 0);
        $completionRate = $activeTeachers > 0 ? round(($submittedTeachers / $activeTeachers) * 100) : 0;
        $matchedRecords = $filtered(LessonPlanSubmission::query())->count();
        $recent = $filtered(LessonPlanSubmission::query())
            ->with(['teacherProfile.user'])
            ->latest('submitted_at')
            ->limit(20)
            ->get();

        return view('school-reports.dashboard', compact('school', 'activeTeachers', 'submittedRecords', 'submittedTeachers', 'onTime', 'late', 'pendingTeachers', 'completionRate', 'matchedRecords', 'recent', 'start', 'end', 'status'));
    }
}
