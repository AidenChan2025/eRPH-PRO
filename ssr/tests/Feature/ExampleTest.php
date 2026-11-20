<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\LessonPlan;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $this->seed();
        $response = $this->get('http://demo.erphpro.com/');

        $response->assertOk()->assertSee('eRPH Pro Demo School')->assertSee('School workspace');
    }

    public function test_health_endpoint_reports_the_sql_connection_and_release(): void
    {
        $response = $this->get('/health');

        $response->assertOk()->assertJsonPath('status', 'ok')->assertJsonPath('database', 'ok');
    }

    public function test_a_school_member_can_open_their_workspace(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $response = $this->actingAs($user)->get('http://demo.erphpro.com/workspace');

        $response->assertOk()->assertSee('Teacher record')->assertSee('Lesson plans');
    }

    public function test_unknown_school_hosts_are_rejected(): void
    {
        $response = $this->get('http://unknown.erphpro.com/');

        $response->assertNotFound();
    }

    public function test_school_admin_can_view_school_people_but_a_teacher_cannot(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $this->actingAs($admin)->get('http://demo.erphpro.com/admin')
            ->assertOk()->assertSee('School people')->assertSee('Demo Administrator');

        $teacher = User::factory()->create(['email' => 'teacher@example.com']);
        $admin->schools()->first()->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);

        $this->actingAs($teacher)->get('http://demo.erphpro.com/admin')->assertForbidden();
    }

    public function test_a_teacher_can_save_a_versioned_rph_draft(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $response = $this->actingAs($user)->post('http://demo.erphpro.com/rph', [
            'lesson_date' => '2026-11-20', 'subject' => 'Bahasa Melayu', 'class_name' => '5 Bestari',
            'title' => 'Kata Adjektif', 'objectives' => 'Murid mengenal pasti kata adjektif.',
            'activities' => 'Perbincangan dan latihan.', 'assessment' => 'Lembaran kerja.',
        ]);

        $response->assertRedirect(route('rph.create'));
        $this->assertDatabaseHas('lesson_plans', ['school_id' => 1, 'status' => 'draft', 'current_version' => 1]);
        $this->assertDatabaseHas('lesson_plan_versions', ['version' => 1, 'source' => 'manual']);
    }

    public function test_school_management_can_view_the_sql_submission_report(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $this->actingAs($admin)->get('http://demo.erphpro.com/reports')
            ->assertOk()->assertSee('Submission overview')->assertSee('Active teachers');
    }

    public function test_permission_middleware_rejects_a_teacher_from_school_reports(): void
    {
        $this->seed();
        $teacher = User::factory()->create(['email' => 'teacher-permission@example.com']);
        $school = \App\Models\School::where('subdomain', 'demo')->firstOrFail();
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);

        $this->actingAs($teacher)->get('http://demo.erphpro.com/reports')->assertForbidden();
    }

    public function test_expired_temporary_school_access_is_rejected(): void
    {
        $this->seed();
        $visitor = User::factory()->create(['email' => 'inspector@example.com']);
        $school = \App\Models\School::where('subdomain', 'demo')->firstOrFail();
        $school->members()->attach($visitor->id, [
            'role' => 'inspector', 'status' => 'active', 'expires_at' => now()->subMinute(),
            'access_reason' => 'Annual inspection',
        ]);

        $this->actingAs($visitor)->get('http://demo.erphpro.com/workspace')->assertForbidden();
    }

    public function test_school_management_can_open_temporary_access_page(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($admin)->get('http://demo.erphpro.com/admin/access')
            ->assertOk()->assertSee('Inspection access');
    }

    public function test_school_management_can_grant_temporary_access(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/access', [
            'name' => 'Education Officer', 'email' => 'officer@example.com', 'role' => 'inspector',
            'expires_at' => now()->addDay()->format('Y-m-d\\TH:i'), 'access_reason' => 'Annual inspection',
        ])->assertRedirect(route('school.admin.access'));
        $this->actingAs($admin)->get('http://demo.erphpro.com/admin/access')->assertOk()->assertSee('Education Officer');
        $this->assertDatabaseHas('school_memberships', ['role' => 'inspector', 'access_reason' => 'Annual inspection']);
    }

    public function test_a_teacher_can_submit_a_saved_rph_for_the_configured_week(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($user)->post('http://demo.erphpro.com/rph', [
            'lesson_date' => '2026-11-20', 'subject' => 'Science', 'class_name' => '5U', 'title' => 'Matter',
        ]);
        $plan = LessonPlan::firstOrFail();

        $this->actingAs($user)->post("http://demo.erphpro.com/rph/{$plan->id}/submit")
            ->assertRedirect(route('workspace.dashboard'));
        $this->assertDatabaseHas('lesson_plans', ['id' => $plan->id, 'status' => 'submitted']);
        $this->assertDatabaseHas('lesson_plan_submissions', ['lesson_plan_id' => $plan->id, 'week_no' => 41]);
    }
}
