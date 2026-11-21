<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicketEvent extends Model
{
    protected $fillable = ['support_ticket_id', 'user_id', 'event', 'metadata'];

    protected $casts = ['metadata' => 'array'];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }
}
