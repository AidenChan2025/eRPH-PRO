<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSchoolTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherClassAssignment extends Model
{
    use BelongsToSchoolTenant;

    protected $fillable = ['school_id', 'academic_year_id', 'school_class_id', 'teacher_profile_id', 'subject', 'role', 'is_active', 'metadata'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'metadata' => 'array'];
    }

    public function academicYear(): BelongsTo { return $this->belongsTo(AcademicYear::class); }
    public function schoolClass(): BelongsTo { return $this->belongsTo(SchoolClass::class); }
    public function teacherProfile(): BelongsTo { return $this->belongsTo(TeacherProfile::class); }
}
