<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use App\Models\TeacherProfile;
use App\Models\SchoolSetting;
use App\Models\LessonPlanSubmission;
use App\Models\SchoolTimetableSlot;
use App\Models\TeacherClassAssignment;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LessonPlanController extends Controller
{
    public function create(Request $request)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $request->user()->id)->first();
        $assignments = $profile ? TeacherClassAssignment::query()->with(['schoolClass', 'academicYear'])->where('teacher_profile_id', $profile->id)->where('is_active', true)->orderBy('subject')->get() : collect();
        return view('lesson-plans.create', [
            'school' => $school,
            'assignments' => $assignments,
            'slots' => SchoolTimetableSlot::where('school_id', $school->id)->where('is_active', true)->orderBy('day_of_week')->orderBy('sort_order')->get(),
        ]);
    }

    public function edit(Request $request, LessonPlan $lessonPlan)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $request->user()->id)->firstOrFail();
        abort_unless($lessonPlan->school_id === $school->id && $lessonPlan->teacher_profile_id === $profile->id, 403);
        $version = $lessonPlan->versions()->latest('version')->firstOrFail();
        $assignments = TeacherClassAssignment::query()->with(['schoolClass', 'academicYear'])->where('teacher_profile_id', $profile->id)->where('is_active', true)->orderBy('subject')->get();

        return view('lesson-plans.edit', compact('school', 'lessonPlan', 'version', 'assignments'));
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::where('school_id', $school->id)->where('user_id', $request->user()->id)->first();
        abort_unless($profile, 422, 'A teacher profile is required before creating a lesson plan.');

        $data = $request->validate([
            'lesson_date' => ['required', 'date'],
            'assignment_id' => ['nullable', 'integer'],
            'subject' => ['required_without:assignment_id', 'string', 'max:120'],
            'class_name' => ['required_without:assignment_id', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:240'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'civic_value' => ['nullable', 'string', 'max:160'], 'civic_topic' => ['nullable', 'string', 'max:240'],
            'objectives' => ['nullable', 'string', 'max:10000'],
            'activities' => ['nullable', 'string', 'max:20000'],
            'assessment' => ['nullable', 'string', 'max:10000'],
            'reflection' => ['nullable', 'string', 'max:10000'],
            'homework' => ['nullable', 'string', 'max:10000'],
            'materials' => ['nullable', 'string', 'max:10000'],
            'emk' => ['nullable', 'string', 'max:5000'], 'pak21' => ['nullable', 'string', 'max:5000'],
            'assessment_written' => ['nullable', 'string', 'max:3000'], 'assessment_oral' => ['nullable', 'string', 'max:3000'],
            'assessment_observation' => ['nullable', 'string', 'max:3000'], 'moral_values' => ['nullable', 'string', 'max:3000'],
            'student_count' => ['nullable', 'integer', 'min:0', 'max:500'], 'enrichment' => ['nullable', 'string', 'max:5000'],
            'remedial' => ['nullable', 'string', 'max:5000'], 'kbat' => ['nullable', 'string', 'max:1000'],
            'multiple_intelligences' => ['nullable', 'string', 'max:2000'], 'notes' => ['nullable', 'string', 'max:5000'],
        ]);
        $assignment = $this->assignmentForTeacher($data['assignment_id'] ?? null, $school, $profile);
        if (!$assignment && TeacherClassAssignment::query()->where('teacher_profile_id', $profile->id)->where('is_active', true)->exists()) {
            abort(422, 'Choose one of your active class and subject assignments.');
        }
        if ($assignment) {
            $data['subject'] = $assignment->subject;
            $data['class_name'] = $assignment->schoolClass->name;
        }

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
            $content = collect($data)->only(['title', 'start_time', 'end_time', 'civic_value', 'civic_topic', 'objectives', 'activities', 'assessment', 'reflection', 'homework', 'materials', 'emk', 'pak21', 'assessment_written', 'assessment_oral', 'assessment_observation', 'moral_values', 'student_count', 'enrichment', 'remedial', 'kbat', 'multiple_intelligences', 'notes'])->toArray();
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
            'lesson_date' => ['required', 'date'], 'subject' => ['required_without:assignment_id', 'string', 'max:120'],
            'assignment_id' => ['nullable', 'integer'],
            'class_name' => ['required_without:assignment_id', 'string', 'max:120'], 'title' => ['required', 'string', 'max:240'],
            'start_time' => ['nullable', 'date_format:H:i'], 'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'civic_value' => ['nullable', 'string', 'max:160'], 'civic_topic' => ['nullable', 'string', 'max:240'],
            'objectives' => ['nullable', 'string', 'max:10000'], 'activities' => ['nullable', 'string', 'max:20000'],
            'assessment' => ['nullable', 'string', 'max:10000'], 'reflection' => ['nullable', 'string', 'max:10000'],
            'homework' => ['nullable', 'string', 'max:10000'], 'materials' => ['nullable', 'string', 'max:10000'],
            'emk' => ['nullable', 'string', 'max:5000'], 'pak21' => ['nullable', 'string', 'max:5000'],
            'assessment_written' => ['nullable', 'string', 'max:3000'], 'assessment_oral' => ['nullable', 'string', 'max:3000'],
            'assessment_observation' => ['nullable', 'string', 'max:3000'], 'moral_values' => ['nullable', 'string', 'max:3000'],
            'student_count' => ['nullable', 'integer', 'min:0', 'max:500'], 'enrichment' => ['nullable', 'string', 'max:5000'],
            'remedial' => ['nullable', 'string', 'max:5000'], 'kbat' => ['nullable', 'string', 'max:1000'],
            'multiple_intelligences' => ['nullable', 'string', 'max:2000'], 'notes' => ['nullable', 'string', 'max:5000'],
            'change_note' => ['nullable', 'string', 'max:500'],
        ]);
        $assignment = $this->assignmentForTeacher($data['assignment_id'] ?? null, $school, $profile);
        if (!$assignment && TeacherClassAssignment::query()->where('teacher_profile_id', $profile->id)->where('is_active', true)->exists()) {
            $assignment = TeacherClassAssignment::query()->with('schoolClass')->where('teacher_profile_id', $profile->id)->where('school_id', $school->id)->where('is_active', true)->where('subject', $data['subject'])->whereHas('schoolClass', fn ($query) => $query->where('name', $data['class_name']))->first();
            abort_unless($assignment, 422, 'Choose one of your active class and subject assignments.');
        }
        if ($assignment) {
            $data['subject'] = $assignment->subject;
            $data['class_name'] = $assignment->schoolClass->name;
        }
        $nextVersion = $lessonPlan->current_version + 1;
        $previousContent = (array) ($lessonPlan->versions()->latest('version')->value('content') ?? []);
        DB::transaction(function () use ($data, $lessonPlan, $nextVersion, $request, $previousContent) {
            $lessonPlan->update(['lesson_date' => $data['lesson_date'], 'subject' => $data['subject'], 'class_name' => $data['class_name'], 'current_version' => $nextVersion, 'status' => 'draft']);
            $lessonPlan->versions()->create([
                'version' => $nextVersion, 'created_by' => $request->user()->id, 'source' => 'manual',
                'change_note' => $data['change_note'] ?? null,
                'content' => array_replace($previousContent, collect($data)->only(['title', 'start_time', 'end_time', 'civic_value', 'civic_topic', 'objectives', 'activities', 'assessment', 'reflection', 'homework', 'materials', 'emk', 'pak21', 'assessment_written', 'assessment_oral', 'assessment_observation', 'moral_values', 'student_count', 'enrichment', 'remedial', 'kbat', 'multiple_intelligences', 'notes'])->toArray()),
            ]);
        });
        $auditLogger->record('lesson_plan.version_created', $school, LessonPlan::class, (string) $lessonPlan->id, ['version' => $nextVersion]);

        return redirect()->route('rph.edit', $lessonPlan)->with('status', "Version {$nextVersion} saved.");
    }

    private function assignmentForTeacher(?int $assignmentId, $school, TeacherProfile $profile): ?TeacherClassAssignment
    {
        if (!$assignmentId) {
            return null;
        }
        $assignment = TeacherClassAssignment::query()->with('schoolClass')->whereKey($assignmentId)->where('teacher_profile_id', $profile->id)->where('school_id', $school->id)->where('is_active', true)->first();
        abort_unless($assignment, 422, 'That class and subject assignment is not available to you.');
        return $assignment;
    }
}
