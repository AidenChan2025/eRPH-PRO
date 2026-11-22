<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonPlanVersion extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope('school_tenant', function ($builder): void {
            $request = app('request');
            if (! $request->attributes->has('tenant_school_id')) {
                $builder->whereRaw('1 = 0');
                return;
            }

            $schoolId = $request->attributes->get('tenant_school_id');
            if (! is_int($schoolId) || $schoolId < 1) {
                $builder->whereRaw('1 = 0');
                return;
            }

            $builder->whereHas('lessonPlan', fn ($query) => $query->where('school_id', $schoolId));
        });
    }

    protected $fillable = ['lesson_plan_id', 'version', 'created_by', 'source', 'content', 'change_note'];
    protected $casts = ['content' => 'array'];

    public function lessonPlan(): BelongsTo
    {
        return $this->belongsTo(LessonPlan::class);
    }
}
