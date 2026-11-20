<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class School extends Model
{
    protected $fillable = ['name', 'slug', 'subdomain', 'workspace_domain', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'school_memberships')
            ->withPivot(['role', 'status', 'joined_at', 'left_at'])
            ->withTimestamps();
    }
}
