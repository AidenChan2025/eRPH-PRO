<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchoolTenant;

class CurriculumItem extends Model
{
    use BelongsToSchoolTenant;

    protected $fillable = [
        'school_id', 'code', 'subject', 'year_level', 'curriculum_version', 'school_type',
        'grade_level', 'sk_code', 'sp_code', 'title', 'description', 'content', 'metadata', 'is_active',
    ];
    protected $casts = ['metadata' => 'array', 'is_active' => 'boolean'];
}
