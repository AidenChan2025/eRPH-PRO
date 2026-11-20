<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use App\Models\TeacherProfile;
use App\Models\SchoolSetting;
use App\Models\LessonPlanSubmission;
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

    public function edit(Request $request, LessonPlan $lessonPlan)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $request->user()->id)->firstOrFail();
        abort_unless($lessonPlan->school_id === $school->id && $lessonPlan->teacher_profile_id === $profile->id, 403);
        $version = $lessonPlan->versions()->latest('version')->firstOrFail();

        return view('lesson-plans.edit', compact('school', 'lessonPlan', 'version'));
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

    public function submit(Request $request, LessonPlan $lessonPlan, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        abort_unless($lessonPlan->school_id === $school->id, 404);
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $request->user()->id)->firstOrFail();
        abort_unless($lessonPlan->teacher_profile_id === $profile->id, 403);

        $settings = SchoolSetting::firstOrCreate(['school_id' => $school->id]);
        $deadline = $settings->active_week_deadline;
        $submittedAt = now();
        $status = $deadline && $submittedAt->startOfDay()->gt($deadline->startOfDay()) ? 'late' : 'on_time';

        LessonPlanSubmission::updateOrCreate(
            ['lesson_plan_id' => $lessonPlan->id, 'week_no' => $settings->active_week],
            ['school_id' => $school->id, 'teacher_profile_id' => $profile->id, 'deadline' => $deadline, 'submitted_at' => $submittedAt, 'status' => $status]
        );
        $lessonPlan->update(['status' => 'submitted', 'submitted_at' => $submittedAt]);
        $auditLogger->record('lesson_plan.submitted', $school, LessonPlan::class, (string) $lessonPlan->id, ['week_no' => $settings->active_week, 'status' => $status]);

        return redirect()->route('workspace.dashboard')->with('status', 'Lesson plan submitted for review.');
    }

    public function update(Request $request, LessonPlan $lessonPlan, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $request->user()->id)->firstOrFail();
        abort_unless($lessonPlan->school_id === $school->id && $lessonPlan->teacher_profile_id === $profile->id, 403);
        abort_if($lessonPlan->status === 'approved', 422, 'Approved lesson plans cannot be edited.');
        $data = $request->validate([
            'lesson_date' => ['required', 'date'], 'subject' => ['required', 'string', 'max:120'],
            'class_name' => ['required', 'string', 'max:120'], 'title' => ['required', 'string', 'max:240'],
            'objectives' => ['nullable', 'string', 'max:10000'], 'activities' => ['nullable', 'string', 'max:20000'],
            'assessment' => ['nullable', 'string', 'max:10000'], 'reflection' => ['nullable', 'string', 'max:10000'],
            'homework' => ['nullable', 'string', 'max:10000'], 'materials' => ['nullable', 'string', 'max:10000'],
            'change_note' => ['nullable', 'string', 'max:500'],
        ]);
        $nextVersion = $lessonPlan->current_version + 1;
        DB::transaction(function () use ($data, $lessonPlan, $nextVersion, $request) {
            $lessonPlan->update(['lesson_date' => $data['lesson_date'], 'subject' => $data['subject'], 'class_name' => $data['class_name'], 'current_version' => $nextVersion, 'status' => 'draft']);
            $lessonPlan->versions()->create([
                'version' => $nextVersion, 'created_by' => $request->user()->id, 'source' => 'manual',
                'change_note' => $data['change_note'] ?? null,
                'content' => collect($data)->only(['title', 'objectives', 'activities', 'assessment', 'reflection', 'homework', 'materials'])->toArray(),
            ]);
        });
        $auditLogger->record('lesson_plan.version_created', $school, LessonPlan::class, (string) $lessonPlan->id, ['version' => $nextVersion]);

        return redirect()->route('rph.edit', $lessonPlan)->with('status', "Version {$nextVersion} saved.");
    }
}
