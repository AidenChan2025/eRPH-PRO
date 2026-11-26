<?php
namespace Tests\Feature;
use App\Models\User; use Illuminate\Foundation\Testing\RefreshDatabase; use Tests\TestCase;
class PlatformModuleUnlockTest extends TestCase { use RefreshDatabase;
 public function test_gate_three_modules_have_explicit_allow_and_deny_conditions(): void { $this->seed(); $owner=User::factory()->create(['platform_role'=>'owner']); $security=User::factory()->create(['platform_role'=>'security']); $this->actingAs($owner)->get('/owner')->assertOk()->assertSee('Schools')->assertSee('Team')->assertSee('Accounts')->assertSee('Runtime')->assertSee('Audit')->assertDontSee('Settings'); $this->actingAs($security)->get('/owner/team')->assertForbidden(); $this->actingAs($security)->get('/owner/audit')->assertOk(); }
}
