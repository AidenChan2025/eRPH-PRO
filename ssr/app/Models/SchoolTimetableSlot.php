<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchoolTenant;

class SchoolTimetableSlot extends Model
{
    use BelongsToSchoolTenant;

    protected $fillable = ['school_id', 'day_of_week', 'starts_at', 'ends_at', 'label', 'sort_order', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
}
