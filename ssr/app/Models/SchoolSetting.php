<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\BelongsToSchoolTenant;

class SchoolSetting extends Model
{
    use BelongsToSchoolTenant;

    protected $fillable = ['school_id', 'academic_year', 'total_weeks', 'active_week', 'submission_weekday', 'active_week_deadline', 'review_rotation', 'extra'];
    protected $casts = ['active_week_deadline' => 'date', 'review_rotation' => 'array', 'extra' => 'array'];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
