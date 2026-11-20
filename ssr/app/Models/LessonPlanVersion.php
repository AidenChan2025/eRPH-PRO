<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonPlanVersion extends Model
{
    protected $fillable = ['lesson_plan_id', 'version', 'created_by', 'source', 'content', 'change_note'];
    protected $casts = ['content' => 'array'];
}
