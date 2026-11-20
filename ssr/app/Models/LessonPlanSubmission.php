<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonPlanSubmission extends Model
{
    protected $fillable = ['school_id', 'lesson_plan_id', 'teacher_profile_id', 'week_no', 'deadline', 'submitted_at', 'status', 'note'];
    protected $casts = ['deadline' => 'date', 'submitted_at' => 'datetime'];
}
