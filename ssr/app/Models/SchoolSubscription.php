<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolSubscription extends Model
{
    protected $fillable = [
        'school_id',
        'stripe_customer_id',
        'stripe_subscription_id',
        'plan_code',
        'status',
        'current_period_end',
        'last_stripe_event_created',
        'last_stripe_event_id',
        'cancel_at_period_end',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'current_period_end' => 'datetime',
            'last_stripe_event_created' => 'integer',
            'cancel_at_period_end' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function isActive(): bool
    {
        if (! in_array($this->status, ['active', 'trialing'], true)) {
            return false;
        }

        return $this->current_period_end !== null && $this->current_period_end->isFuture();
    }
}
