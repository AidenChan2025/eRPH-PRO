<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function actingAs($user, $guard = null)
    {
        if ($guard === null && $user?->platform_role !== null) {
            $guard = 'platform';
        }

        $result = parent::actingAs($user, $guard);
        if ($guard === 'platform') {
            $this->withSession(['platform.mfa_verified_user_id' => $user->id]);
        }

        return $result;
    }
}
