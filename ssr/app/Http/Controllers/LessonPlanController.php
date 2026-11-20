<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use App\Models\TeacherProfile;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LessonPlanController extends Controller
{
    public function create(Request $request)
    {
        return view('lesson-plans.create', [
            'school' => $request->attributes->get('school'),
        ]);
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $request->user()->id)->first();
        abort_unless($profile, 422, 'A teacher profile is required before creating a lesson plan.');

        $data = $request->validate([
            'lesson_date' => ['required', 'date'],
            'subject' => ['required', 'string', 'max:120'],
            'class_name' => ['required', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:240'],
            'objectives' => ['nullable', 'string', 'max:10000'],
            'activities' => ['nullable', 'string', 'max:20000'],
            'assessment' => ['nullable', 'string', 'max:10000'],
            'reflection' => ['nullable', 'string', 'max:10000'],
            'homework' => ['nullable', 'string', 'max:10000'],
            'materials' => ['nullable', 'string', 'max:10000'],
        ]);

        $plan = DB::transaction(function () use ($data, $school, $profile, $request) {
            $plan = LessonPlan::create([
                'school_id' => $school->id,
                'teacher_profile_id' => $profile->id,
                'lesson_date' => $data['lesson_date'],
                'subject' => $data['subject'],
                'class_name' => $data['class_name'],
                'status' => 'draft',
                'current_version' => 1,
            ]);
            $content = collect($data)->only(['title', 'objectives', 'activities', 'assessment', 'reflection', 'homework', 'materials'])->toArray();
            $plan->versions()->create(['version' => 1, 'created_by' => $request->user()->id, 'source' => 'manual', 'content' => $content]);
            return $plan;
        });

        $auditLogger->record('lesson_plan.created', $school, LessonPlan::class, (string) $plan->id, ['version' => 1]);

        return redirect()->route('rph.create')->with('status', 'Draft lesson plan saved.');
    }
}
