<?php
namespace Tests\Feature;
use App\Services\OAuthHandoffService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class OAuthStateReplayTest extends TestCase
{
    use RefreshDatabase;
    public function test_oauth_state_is_single_use(): void
    {
        $state = app(OAuthHandoffService::class)->issue('school_login', 'alpha');
        $this->assertNotNull(app(OAuthHandoffService::class)->consume($state));
        $this->assertNull(app(OAuthHandoffService::class)->consume($state));
    }
}
