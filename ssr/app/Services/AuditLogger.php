<?php

namespace App\Services;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogger
{
    public function record(string $action, ?School $school = null, ?string $subjectType = null, ?string $subjectId = null, array $context = []): void
    {
        $request = app()->bound('request') ? app(Request::class) : null;

        DB::table('audit_logs')->insert([
            'school_id' => $school?->getKey(),
            'actor_id' => auth()->id(),
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'context' => $context ? json_encode($context, JSON_THROW_ON_ERROR) : null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
