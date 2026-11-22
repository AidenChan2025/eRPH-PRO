<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $fillable = [
        'public_id', 'access_token_hash', 'requester_user_id', 'school_id', 'requester_name',
        'requester_email', 'subject', 'category', 'priority', 'status', 'ai_state',
        'ai_confidence', 'ai_summary', 'ai_reply_draft', 'ai_processing_consent_at',
        'ai_processing_consent_version', 'assigned_to', 'last_activity_at',
    ];

    public function platformAccessGrants(): HasMany
    {
        return $this->hasMany(PlatformSupportAccessGrant::class);
    }

    protected $casts = [
        'ai_confidence' => 'float',
        'last_activity_at' => 'datetime',
        'ai_processing_consent_at' => 'datetime',
        'recovery_code_expires_at' => 'datetime',
        'recovery_code_sent_at' => 'datetime',
        'recovery_code_last_attempt_at' => 'datetime',
        'recovery_code_window_started_at' => 'datetime',
        'recovery_code_sent_count' => 'integer',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_user_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(SupportTicketEvent::class);
    }
}
