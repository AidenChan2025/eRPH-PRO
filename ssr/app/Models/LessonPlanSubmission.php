<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\BelongsToSchoolTenant;

class LessonPlanSubmission extends Model
{
    use BelongsToSchoolTenant;

    protected $fillable = ['school_id', 'lesson_plan_id', 'teacher_profile_id', 'week_no', 'deadline', 'submitted_at', 'status', 'note'];
    protected $casts = ['deadline' => 'date', 'submitted_at' => 'datetime'];

    protected static function booted(): void
    {
        static::addGlobalScope('school_parent_tenant', function ($builder): void {
            $request = app('request');
            if (! $request->attributes->has('tenant_school_id')) {
                $builder->whereRaw('1 = 0');
                return;
            }

            $schoolId = $request->attributes->get('tenant_school_id');
            if (is_int($schoolId) && $schoolId > 0) {
                $builder->whereHas('lessonPlan', fn ($query) => $query->where('school_id', $schoolId));
            } else {
                $builder->whereRaw('1 = 0');
            }
        });
    }

    public function lessonPlan(): BelongsTo
    {
        return $this->belongsTo(LessonPlan::class);
    }

    public function teacherProfile(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class);
    }
}
