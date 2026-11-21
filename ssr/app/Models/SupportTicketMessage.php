<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicketMessage extends Model
{
    protected $fillable = ['support_ticket_id', 'user_id', 'author_name', 'author_email', 'source', 'is_internal', 'body', 'sent_at'];

    protected $casts = ['is_internal' => 'boolean', 'sent_at' => 'datetime'];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
