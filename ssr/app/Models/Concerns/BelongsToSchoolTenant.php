<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToSchoolTenant
{
    protected static function bootBelongsToSchoolTenant(): void
    {
        static::addGlobalScope('school_tenant', function (Builder $builder): void {
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

            $builder->where($builder->getModel()->qualifyColumn('school_id'), $schoolId);
        });
    }
}
