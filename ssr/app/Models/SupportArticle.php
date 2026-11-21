<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportArticle extends Model
{
    protected $fillable = ['support_category_id', 'title', 'slug', 'excerpt', 'body', 'is_published', 'sort_order'];

    protected $casts = ['is_published' => 'boolean'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(SupportCategory::class, 'support_category_id');
    }
}
