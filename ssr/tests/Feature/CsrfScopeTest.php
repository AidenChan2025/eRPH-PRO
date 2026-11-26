<?php
namespace Tests\Feature;
use Tests\TestCase;
class CsrfScopeTest extends TestCase
{
    public function test_host_scoped_sessions_use_independent_cookie_names(): void
    {
        $this->assertSame('erph-platform-session', config('session.platform_cookie'));
        $this->assertSame('erph-school-session', config('session.school_cookie'));
        $this->assertNotSame(config('session.platform_cookie'), config('session.school_cookie'));
    }
}
