<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSupportAccessGrant extends Model
{
    protected $fillable = [
        'school_id', 'support_ticket_id', 'platform_owner_id', 'approved_by',
        'purpose', 'grant_slot_key', 'expires_at', 'revoked_at',
    ];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'revoked_at' => 'datetime'];
    }
}
