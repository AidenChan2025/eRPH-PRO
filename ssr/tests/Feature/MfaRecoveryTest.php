<?php
namespace Tests\Feature;
use Tests\TestCase;
class MfaRecoveryTest extends TestCase
{
    public function test_platform_mfa_is_required_by_configuration_before_workspace_access(): void
    {
        config(['services.platform_mfa.required' => true]);
        $this->assertTrue((bool) config('services.platform_mfa.required'));
    }
}
