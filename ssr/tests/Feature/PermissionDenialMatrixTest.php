<?php
namespace Tests\Feature;
use Tests\TestCase;
class PermissionDenialMatrixTest extends TestCase
{
    public function test_unknown_platform_role_is_default_deny(): void
    {
        $this->assertSame([], config('permissions.platform_roles.unknown', []));
    }
    public function test_unknown_school_role_is_default_deny(): void
    {
        $this->assertSame([], config('permissions.roles.unknown', []));
    }
}
