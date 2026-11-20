<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolTimetableSlot extends Model
{
    protected $fillable = ['school_id', 'day_of_week', 'starts_at', 'ends_at', 'label', 'sort_order', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
}
