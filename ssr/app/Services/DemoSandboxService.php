<?php

namespace App\Services;

use App\Models\School;

class DemoSandboxService
{
    public function isDemoSchool(?School $school): bool
    {
        return $school !== null && ($school->subdomain === 'demo' || (bool) $school->is_demo);
    }

    public function assertExternalSideEffectsAllowed(?School $school): void
    {
        abort_if($this->isDemoSchool($school), 403, 'Demo schools cannot initiate real external actions.');
    }
}
