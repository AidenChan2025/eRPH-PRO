<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchoolTenant;

class CurriculumItem extends Model
{
    use BelongsToSchoolTenant;

    protected $fillable = ['school_id', 'code', 'subject', 'year_level', 'title', 'content', 'metadata', 'is_active'];
    protected $casts = ['metadata' => 'array', 'is_active' => 'boolean'];
}
