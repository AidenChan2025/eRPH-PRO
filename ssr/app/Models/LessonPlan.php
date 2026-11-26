<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\BelongsToSchoolTenant;

class LessonPlan extends Model
{
    use SoftDeletes;
    use BelongsToSchoolTenant;

    protected $fillable = ['school_id', 'teacher_profile_id', 'teacher_class_assignment_id', 'curriculum_item_id', 'lesson_date', 'subject', 'class_name', 'is_relief', 'relief_reason', 'status', 'current_version'];
    protected $casts = ['lesson_date' => 'date', 'is_relief' => 'boolean', 'submitted_at' => 'datetime', 'approved_at' => 'datetime'];

    public function versions(): HasMany
    {
        return $this->hasMany(LessonPlanVersion::class);
    }

    public function teacherClassAssignment(): BelongsTo
    {
        return $this->belongsTo(TeacherClassAssignment::class);
    }

    public function teacherProfile(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class);
    }
}
