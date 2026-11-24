<?php

namespace Tests\Feature;

use App\Models\CurriculumItem;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DskpAndDemoSandboxTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_creates_dskp_item_and_audit_log_is_recorded(): void
    {
        $owner = User::factory()->create(['platform_role' => 'owner']);
        $this->actingAs($owner)->post('http://localhost/owner/dskp', [
            'curriculum_version' => 'KSSR Semakan 2017', 'school_type' => 'SK', 'grade_level' => 'Tahun 5',
            'subject' => 'Bahasa Melayu', 'sk_code' => 'SK 5.1', 'sp_code' => 'SP 5.1.2',
            'title' => 'Kata Adjektif', 'description' => 'Mengenal pasti kata adjektif.',
        ])->assertRedirect();

        $item = CurriculumItem::withoutGlobalScopes()->firstOrFail();
        $this->assertSame('Kata Adjektif', $item->title);
        $this->assertDatabaseHas('audit_logs', ['action' => 'platform.dskp.created', 'actor_id' => $owner->id, 'subject_id' => (string) $item->id]);
    }

    public function test_non_owner_cannot_create_dskp_item(): void
    {
        $operator = User::factory()->create(['platform_role' => 'security']);
        $this->actingAs($operator)->post('http://localhost/owner/dskp', [
            'curriculum_version' => 'KP2027', 'school_type' => 'SK', 'grade_level' => 'Tahun 1', 'subject' => 'Sains', 'title' => 'Nope',
        ])->assertForbidden();
        $this->assertDatabaseCount('curriculum_items', 0);
    }

    public function test_school_teacher_searches_and_filters_shared_dskp_catalog_safely(): void
    {
        $school = School::create(['name' => 'Catalog School', 'slug' => 'catalog-school', 'subdomain' => 'catalog-school']);
        $teacher = User::factory()->create();
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        CurriculumItem::withoutGlobalScopes()->create(['school_id' => null, 'curriculum_version' => 'KSSR Semakan 2017', 'school_type' => 'SK', 'grade_level' => 'Tahun 5', 'subject' => 'Bahasa Melayu', 'sk_code' => 'SK 5.1', 'title' => 'Kata Adjektif', 'description' => 'Safe catalog', 'is_active' => true]);

        $this->actingAs($teacher)->get('http://catalog-school.erphpro.com/dskp?school_type=SK&grade_level=Tahun+5&subject=Bahasa+Melayu&q=SK+5.1')
            ->assertOk()->assertSee('Kata Adjektif')->assertSee('Safe catalog');
    }

    public function test_demo_school_is_blocked_from_real_stripe_checkout_when_configured(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        config()->set('services.stripe.key', 'pk_test_123');
        config()->set('services.stripe.secret', 'sk_test_123');
        Http::fake();

        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/billing/checkout', ['plan_code' => 'monthly'])
            ->assertRedirect()->assertSessionHasErrors('stripe');
        Http::assertNothingSent();
    }
}
