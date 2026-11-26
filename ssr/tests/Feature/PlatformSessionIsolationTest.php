<?php
namespace Tests\Feature;
use Tests\TestCase;
class PlatformSessionIsolationTest extends TestCase
{
    public function test_platform_and_school_cookie_names_are_distinct_and_host_bound(): void
    {
        $this->assertNotSame(config('session.platform_cookie'), config('session.school_cookie'));
        $this->assertTrue(in_array(config('session.domain'), [null, ''], true));
        $this->assertSame('/', config('session.path'));
    }
}
