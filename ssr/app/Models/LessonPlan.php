<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LessonPlan extends Model
{
    use SoftDeletes;

    protected $fillable = ['school_id', 'teacher_profile_id', 'curriculum_item_id', 'lesson_date', 'subject', 'class_name', 'status', 'current_version'];
    protected $casts = ['lesson_date' => 'date', 'submitted_at' => 'datetime', 'approved_at' => 'datetime'];

    public function versions(): HasMany
    {
        return $this->hasMany(LessonPlanVersion::class);
    }
}
