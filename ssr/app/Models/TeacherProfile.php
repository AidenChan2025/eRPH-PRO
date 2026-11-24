<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\BelongsToSchoolTenant;

class TeacherProfile extends Model
{
    use SoftDeletes;
    use BelongsToSchoolTenant;

    protected $fillable = ['school_id', 'user_id', 'staff_no', 'identity_no', 'phone', 'position', 'grade', 'employment_status', 'joined_school_on', 'left_school_on', 'profile_data', 'telegram_chat_id', 'telegram_opt_in'];
    protected $casts = ['joined_school_on' => 'date', 'left_school_on' => 'date', 'profile_data' => 'array', 'telegram_opt_in' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classAssignments(): HasMany
    {
        return $this->hasMany(TeacherClassAssignment::class);
    }
}
