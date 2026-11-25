<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use Illuminate\Http\Request;

class SchoolInspectorController extends Controller
{
    public function __invoke(Request $request)
    {
        $school = $request->attributes->get('school');
        $rows = LessonPlan::query()->with(['teacherProfile.user'])
            ->where('school_id', $school->id)
            ->selectRaw("teacher_profile_id, YEARWEEK(lesson_date, 3) as week_key, MIN(lesson_date) as week_start, COUNT(*) as total, SUM(status IN ('submitted', 'approved')) as compliant, SUM(status = 'draft') as drafts, SUM(status = 'returned') as returned")
            ->groupBy('teacher_profile_id', 'week_key')->orderByDesc('week_start')->get();

        return view('school-admin.inspector-view', compact('school', 'rows'));
    }
}
