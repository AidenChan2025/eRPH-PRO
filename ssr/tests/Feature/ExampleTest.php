<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\LessonPlan;
use App\Services\SupportAIService;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
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

    public function test_the_base_domain_has_a_public_homepage(): void
    {
        $this->get('http://erphpro.com/')
            ->assertOk()
            ->assertSee('One calm place for better teaching.')
            ->assertSee('Platform owner sign in');
    }

    public function test_support_centre_is_available_on_its_own_host(): void
    {
        $this->get('http://support.erphpro.com/')
            ->assertOk()
            ->assertSee('Find a clear answer, fast.')
            ->assertSee('Submit a ticket');
    }

    public function test_support_ticket_creates_a_private_access_link(): void
    {
        $response = $this->post('http://support.erphpro.com/tickets', [
            'name' => 'Support User',
            'email' => 'support-user@example.com',
            'subject' => 'Cannot open a lesson plan',
            'category' => 'lesson_plans',
            'message' => 'The lesson plan page does not open after I sign in.',
        ]);

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        $this->assertStringContainsString('/tickets/', $location);
        $this->assertStringContainsString('?token=', $location);
        $this->assertDatabaseHas('support_tickets', ['requester_email' => 'support-user@example.com', 'status' => 'open']);
        $this->assertDatabaseHas('support_ticket_messages', ['source' => 'requester', 'author_email' => 'support-user@example.com']);

        $this->get($location)->assertRedirect();
        $this->get(Str::before($location, '?'))->assertOk()->assertSee('Add a reply');
    }

    public function test_public_ticket_creation_is_rate_limited(): void
    {
        $payload = [
            'name' => 'Support User', 'email' => 'support-user@example.com', 'subject' => 'A question',
            'category' => 'general', 'message' => 'This is a sufficiently long support question.',
        ];

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->post('http://support.erphpro.com/tickets', $payload)->assertRedirect();
        }

        $this->post('http://support.erphpro.com/tickets', $payload)->assertTooManyRequests();
    }

    public function test_ai_cannot_downgrade_a_security_ticket(): void
    {
        $this->mock(SupportAIService::class, function ($mock): void {
            $mock->shouldReceive('analyse')->once()->andReturn([
                'state' => 'human_review', 'category' => 'general', 'priority' => 'low',
                'confidence' => 0.99, 'summary' => 'Security report', 'reply_draft' => 'A human will review this.',
            ]);
        });

        $this->post('http://support.erphpro.com/tickets', [
            'name' => 'Security Reporter', 'email' => 'security@example.com', 'subject' => 'Suspicious access',
            'category' => 'security', 'message' => 'I saw suspicious access in the school workspace.',
        ])->assertRedirect();

        $this->assertDatabaseHas('support_tickets', [
            'requester_email' => 'security@example.com', 'category' => 'security',
            'priority' => 'high', 'ai_state' => 'human_review',
        ]);
    }

    public function test_mail_failure_does_not_lose_a_created_ticket(): void
    {
        Mail::shouldReceive('raw')->once()->andThrow(new \RuntimeException('mail transport unavailable'));

        $this->post('http://support.erphpro.com/tickets', [
            'name' => 'Support User', 'email' => 'support-user@example.com', 'subject' => 'Mail outage',
            'category' => 'general', 'message' => 'The support email notification is not arriving.',
        ])->assertRedirect();

        $this->assertDatabaseHas('support_tickets', ['subject' => 'Mail outage']);
    }

    public function test_health_endpoint_reports_the_sql_connection_and_release(): void
    {
        $response = $this->get('/health');

        $response->assertOk()->assertJsonPath('status', 'ok')->assertJsonPath('database', 'ok')->assertJsonPath('cache', 'ok');
    }

    public function test_owner_login_entrypoint_is_available_on_the_base_domain(): void
    {
        $this->get('/owner/login')->assertOk()->assertSee('Platform owner');
    }

    public function test_google_redirect_fails_clearly_when_credentials_are_not_configured(): void
    {
        $this->seed();
        $this->get('http://demo.erphpro.com/auth/google/redirect')
            ->assertStatus(503);
    }

    public function test_owner_google_callback_can_create_an_owner_without_a_plaintext_password(): void
    {
        Config::set([
            'services.google.client_id' => 'test-client',
            'services.google.client_secret' => 'test-secret',
            'services.google.owner_email' => 'owner@example.com',
        ]);

        $driver = \Mockery::mock();
        $driver->shouldReceive('user')->once()->andReturn(SocialiteUser::fake([
            'id' => 'owner-google-subject',
            'name' => 'Platform Owner',
            'email' => 'owner@example.com',
        ]));
        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($driver);

        $response = $this->withSession(['auth.owner_login' => true])->get('/auth/google/callback');

        $response->assertRedirect(route('owner.dashboard'));
        $this->assertDatabaseHas('users', ['email' => 'owner@example.com', 'platform_role' => 'owner']);
    }

    public function test_authenticated_school_user_can_log_out_and_invalidate_session(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($user)->post('http://demo.erphpro.com/logout')
            ->assertRedirect(route('school.home'));
        $this->assertGuest();
    }

    public function test_a_school_member_can_open_their_workspace(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $response = $this->actingAs($user)->get('http://demo.erphpro.com/workspace');

        $response->assertOk()->assertSee('Teacher record')->assertSee('Lesson plans')->assertSee('Submitted')->assertSee('Approved');
    }

    public function test_unknown_school_hosts_are_rejected(): void
    {
        $response = $this->get('http://unknown.erphpro.com/');

        $response->assertNotFound();
    }

    public function test_a_school_member_cannot_open_another_school_workspace(): void
    {
        $this->seed();
        \App\Models\School::create([
            'name' => 'Other School', 'slug' => 'other-school', 'subdomain' => 'other',
            'is_active' => true,
        ]);
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $this->actingAs($admin)->get('http://other.erphpro.com/workspace')->assertForbidden();
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

    public function test_school_admin_can_update_member_role_and_status_with_audit(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $teacher = User::factory()->create(['email' => 'managed-teacher@example.com']);
        $school = \App\Models\School::where('subdomain', 'demo')->firstOrFail();
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        \App\Models\TeacherProfile::create([
            'school_id' => $school->id, 'user_id' => $teacher->id, 'employment_status' => 'active',
        ]);

        $this->actingAs($admin)->put("http://demo.erphpro.com/admin/people/{$teacher->id}", [
            'role' => 'vice_principal', 'status' => 'inactive',
        ])->assertRedirect(route('school.admin'));

        $this->assertDatabaseHas('school_memberships', [
            'school_id' => $school->id, 'user_id' => $teacher->id,
            'role' => 'vice_principal', 'status' => 'inactive',
        ]);
        $this->assertDatabaseHas('teacher_profiles', ['user_id' => $teacher->id, 'employment_status' => 'inactive']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'school.member_updated']);
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

    public function test_teacher_can_view_google_identity_settings_but_cannot_unlink_the_only_identity(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $identity = \App\Models\GoogleIdentity::create([
            'user_id' => $user->id, 'subject' => 'demo-subject', 'email' => $user->email,
            'email_type' => 'workspace', 'is_primary' => true, 'verified_at' => now(),
        ]);

        $this->actingAs($user)->get('http://demo.erphpro.com/account/identities')->assertOk()->assertSee($user->email);
        $this->actingAs($user)->delete("http://demo.erphpro.com/account/identities/{$identity->id}")
            ->assertSessionHasErrors('identity');
        $this->assertDatabaseHas('google_identities', ['id' => $identity->id, 'unlinked_at' => null]);
    }

    public function test_unlinking_primary_google_identity_promotes_the_remaining_identity_and_audits(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $primary = \App\Models\GoogleIdentity::create([
            'user_id' => $user->id, 'subject' => 'primary-subject', 'email' => $user->email,
            'email_type' => 'workspace', 'is_primary' => true, 'verified_at' => now(),
        ]);
        $backup = \App\Models\GoogleIdentity::create([
            'user_id' => $user->id, 'subject' => 'backup-subject', 'email' => 'backup@gmail.com',
            'email_type' => 'personal', 'is_primary' => false, 'verified_at' => now(),
        ]);

        $this->actingAs($user)->delete("http://demo.erphpro.com/account/identities/{$primary->id}")
            ->assertRedirect('https://demo.erphpro.com/account/identities');
        $this->assertDatabaseHas('google_identities', ['id' => $primary->id, 'is_primary' => false]);
        $this->assertDatabaseHas('google_identities', ['id' => $backup->id, 'is_primary' => true, 'unlinked_at' => null]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.google_identity_unlinked', 'actor_id' => $user->id]);
    }
}
