<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeacherProfile extends Model
{
    use SoftDeletes;

    protected $fillable = ['school_id', 'user_id', 'staff_no', 'identity_no', 'phone', 'position', 'grade', 'employment_status', 'joined_school_on', 'left_school_on', 'profile_data'];
    protected $casts = ['joined_school_on' => 'date', 'left_school_on' => 'date', 'profile_data' => 'array'];
}
