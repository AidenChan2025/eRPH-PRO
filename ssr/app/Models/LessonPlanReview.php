<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonPlanReview extends Model
{
    protected $fillable = ['school_id', 'lesson_plan_id', 'reviewer_id', 'decision', 'comment'];
}
