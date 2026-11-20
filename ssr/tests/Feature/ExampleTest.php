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

        $response->assertOk()->assertJsonPath('status', 'ok')->assertJsonPath('database', 'ok')->assertJsonPath('cache', 'ok');
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

    public function test_teacher_can_update_their_school_profile(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($user)->put('http://demo.erphpro.com/profile', [
            'staff_no' => 'T-001', 'phone' => '0123456789', 'position' => 'Teacher', 'grade' => 'DG44',
        ])->assertRedirect(route('teacher.profile.edit'));
        $this->assertDatabaseHas('teacher_profiles', ['user_id' => $user->id, 'staff_no' => 'T-001', 'grade' => 'DG44']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'teacher.profile_updated']);
    }

    public function test_school_admin_can_configure_school_specific_lesson_times(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/settings/timetable', [
            'day_of_week' => 'Monday', 'starts_at' => '07:40', 'ends_at' => '08:10', 'label' => 'Period 1', 'sort_order' => 1,
        ])->assertRedirect(route('school.settings'));
        $this->assertDatabaseHas('school_timetable_slots', ['day_of_week' => 'Monday', 'label' => 'Period 1']);
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

    public function test_school_management_can_approve_an_rph_and_audit_the_decision(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($admin)->post('http://demo.erphpro.com/rph', [
            'lesson_date' => '2026-11-20', 'subject' => 'Science', 'class_name' => '5U', 'title' => 'Matter',
        ]);
        $plan = \App\Models\LessonPlan::firstOrFail();

        $this->actingAs($admin)->post("http://demo.erphpro.com/admin/rph/{$plan->id}/review", [
            'decision' => 'approved', 'comment' => 'Meets school format.',
        ])->assertRedirect(route('rph.review', $plan));
        $this->assertDatabaseHas('lesson_plans', ['id' => $plan->id, 'status' => 'approved']);
        $this->assertDatabaseHas('lesson_plan_reviews', ['lesson_plan_id' => $plan->id, 'decision' => 'approved']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'lesson_plan.review_decided']);
    }

    public function test_rph_edit_keeps_extended_fields_when_the_edit_form_does_not_replace_them(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($user)->post('http://demo.erphpro.com/rph', [
            'lesson_date' => '2026-11-20', 'subject' => 'BM', 'class_name' => '5U', 'title' => 'Karangan',
            'civic_value' => 'Kasih Sayang', 'emk' => 'Bahasa',
        ]);
        $plan = \App\Models\LessonPlan::firstOrFail();
        $this->actingAs($user)->put("http://demo.erphpro.com/rph/{$plan->id}", [
            'lesson_date' => '2026-11-20', 'subject' => 'BM', 'class_name' => '5U', 'title' => 'Karangan Baharu',
        ])->assertRedirect(route('rph.edit', $plan));
        $version = $plan->versions()->latest('version')->firstOrFail();
        $this->assertSame('Kasih Sayang', $version->content['civic_value']);
        $this->assertSame('Bahasa', $version->content['emk']);
    }

    public function test_only_a_platform_owner_can_open_the_owner_school_overview(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($user)->get('/owner')->assertForbidden();
        $user->update(['platform_role' => 'owner']);
        $this->actingAs($user)->get('/owner')->assertOk()->assertSee('eRPH Pro Demo School');
    }

    public function test_platform_owner_can_view_cross_school_audit_activity(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $user->update(['platform_role' => 'owner']);
        \App\Services\AuditLogger::class;
        $this->actingAs($user)->get('/owner/audit')->assertOk()->assertSee('Audit activity');
    }
}
