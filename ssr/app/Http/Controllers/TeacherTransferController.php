<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use App\Models\LessonPlanReview;
use App\Models\School;
use App\Models\TeacherEmploymentHistory;
use App\Models\TeacherProfile;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherTransferController extends Controller
{
    public function export(Request $request)
    {
        $school = $request->attributes->get('school');
        $profile = TeacherProfile::query()->where('school_id', $school->id)
            ->where('user_id', $request->user()->id)->firstOrFail();

        // Portability never crosses the current tenant and never carries mutable
        // draft/return discussions from a former school.
        $plans = LessonPlan::query()->where('school_id', $school->id)
            ->where('teacher_profile_id', $profile->id)
            ->whereIn('status', ['approved', 'archived'])
            ->with(['versions' => fn ($query) => $query->latest('version')])
            ->orderBy('lesson_date')->get();

        $payload = [
            'format' => 'erph-teacher-export-v1',
            'school' => ['id' => $school->id, 'name' => $school->name, 'subdomain' => $school->subdomain],
            'teacher' => ['id' => $profile->user_id, 'name' => $request->user()->name, 'email' => $request->user()->email, 'staff_no' => $profile->staff_no, 'position' => $profile->position],
            'records' => $plans->map(function (LessonPlan $plan): array {
                return [
                    'id' => $plan->id, 'lesson_date' => $plan->lesson_date?->toDateString(),
                    'subject' => $plan->subject, 'class_name' => $plan->class_name,
                    'status' => $plan->status, 'current_version' => $plan->current_version,
                    'version' => $plan->versions->firstWhere('version', $plan->current_version)?->toArray(),
                    // Review comments are intentionally not portable.
                ];
            })->values()->all(),
        ];

        return response()->streamDownload(function () use ($payload): void {
            echo json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        }, 'erph-teacher-export.json', [
            'Content-Type' => 'application/json; charset=UTF-8',
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function transfer(Request $request, TeacherProfile $teacherProfile, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        abort_unless($teacherProfile->school_id === $school->id, 404);
        $data = $request->validate([
            'target_school_id' => ['required', 'integer', 'exists:schools,id'],
            'effective_date' => ['required', 'date'],
        ]);
        $target = School::query()->whereKey($data['target_school_id'])->where('is_active', true)->firstOrFail();
        abort_if($target->id === $school->id, 422, 'The target school must be different.');

        DB::transaction(function () use ($teacherProfile, $school, $target, $data, $request): void {
            $date = $data['effective_date'];
            $teacherProfile->update(['employment_status' => 'inactive', 'left_school_on' => $date]);
            DB::table('school_memberships')->where('school_id', $school->id)->where('user_id', $teacherProfile->user_id)
                ->where('status', 'active')->update(['status' => 'inactive', 'left_at' => now(), 'updated_at' => now()]);
            TeacherEmploymentHistory::query()->create([
                'user_id' => $teacherProfile->user_id, 'school_id' => $school->id,
                'role' => 'teacher', 'started_on' => $teacherProfile->joined_school_on ?? $date, 'ended_on' => $date,
            ]);
            $targetProfile = TeacherProfile::query()->withoutGlobalScopes()->firstOrCreate(
                ['school_id' => $target->id, 'user_id' => $teacherProfile->user_id],
                ['employment_status' => 'active', 'joined_school_on' => $date, 'position' => $teacherProfile->position, 'profile_data' => $teacherProfile->profile_data]
            );
            $targetProfile->update(['employment_status' => 'active', 'left_school_on' => null]);
            DB::table('school_memberships')->updateOrInsert(
                ['school_id' => $target->id, 'user_id' => $teacherProfile->user_id],
                ['role' => 'teacher', 'status' => 'active', 'joined_at' => now(), 'left_at' => null, 'updated_at' => now(), 'created_at' => now()]
            );
            TeacherEmploymentHistory::query()->create([
                'user_id' => $teacherProfile->user_id, 'school_id' => $target->id,
                'role' => 'teacher', 'started_on' => $date,
            ]);
        });

        $auditLogger->record('teacher.transferred', $school, TeacherProfile::class, (string) $teacherProfile->id, [
            'target_school_id' => (int) $target->id, 'effective_date' => $data['effective_date'],
        ]);

        return back()->with('status', 'Teacher transferred. Original-school drafts and return comments remain isolated.');
    }
}
