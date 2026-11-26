<?php
namespace Tests\Feature;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class PlatformControlPlaneTest extends TestCase { use RefreshDatabase;
 public function test_owner_can_onboard_and_lifecycle_is_idempotent(): void { $this->seed(); $owner=User::factory()->create(['platform_role'=>'owner']); $h=['Idempotency-Key'=>'school-1']; $data=$this->schoolData()+['workspace_domain'=>'alpha.example']; $r=$this->actingAs($owner)->post('/owner/schools',$data, $h); $r->assertRedirect(); $this->actingAs($owner)->post('/owner/schools',$data, $h); $this->assertSame(1,School::where('subdomain','alpha')->count()); $school=School::where('subdomain','alpha')->first(); $this->assertSame('alpha.example',$school->workspace_domain); $this->assertSame('school-1',$school->idempotency_key); $this->actingAs($owner)->post("/owner/schools/{$school->id}/archive")->assertRedirect(); $this->assertFalse($school->fresh()->is_active); $this->actingAs($owner)->post("/owner/schools/{$school->id}/restore")->assertRedirect(); $this->assertTrue($school->fresh()->is_active); }
 public function test_owner_without_school_membership_can_use_platform_and_non_platform_is_denied(): void { $this->seed(); $owner=User::factory()->create(['platform_role'=>'owner']); $this->actingAs($owner)->get('/owner')->assertOk()->assertSee('Overview'); $user=User::factory()->create(); $this->actingAs($user)->get('/owner')->assertForbidden(); }
 public function test_invitation_is_server_validated_and_idempotent(): void { $this->seed(); $owner=User::factory()->create(['platform_role'=>'owner']); $school=School::where('subdomain','demo')->first(); $data=['email'=>'Admin@Example.com','name'=>'Admin','role'=>'school_admin']; $this->actingAs($owner)->post("/owner/schools/{$school->id}/invite",$data,['headers'=>['Idempotency-Key'=>'invite-1']])->assertRedirect(); $this->actingAs($owner)->post("/owner/schools/{$school->id}/invite",$data,['headers'=>['Idempotency-Key'=>'invite-1']])->assertRedirect(); $this->assertSame(1,$school->members()->where('email','admin@example.com')->count()); }
 private function schoolData(): array { return ['name'=>'Alpha School','subdomain'=>'alpha']; }
}
