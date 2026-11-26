<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    protected $fillable = ['name', 'slug', 'subdomain', 'workspace_domain', 'idempotency_key', 'is_active', 'is_demo', 'archived_at'];

    protected $casts = ['is_active' => 'boolean', 'is_demo' => 'boolean', 'archived_at' => 'datetime'];

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'school_memberships')
            ->withPivot(['role', 'status', 'joined_at', 'left_at', 'expires_at', 'access_reason'])
            ->withTimestamps();
    }

    public function academicYears(): HasMany
    {
        return $this->hasMany(AcademicYear::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }
}
