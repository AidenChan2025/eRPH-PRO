<?php

namespace Tests\Feature;

use App\Models\LessonPlan;
use App\Models\LessonPlanReview;
use App\Models\TeacherEmploymentHistory;
use App\Models\School;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RphWorkflowAndExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_print_own_rph_with_core_fields_and_no_store_headers(): void
    {
        $this->seed();
        [$school, $teacher, $plan] = $this->planFixture();
        $response = $this->actingAs($teacher)->get("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/print");

        $response->assertOk()->assertHeader('Cache-Control', 'no-store, private')
            ->assertSee($school->name)->assertSee('Kata Sifat')->assertSee('SK 5.1 · SP 5.1.2 · TP 3')
            ->assertSee('Murid dapat mengenal pasti kata adjektif.')->assertSee('Aktiviti berkumpulan.')
            ->assertSee('BBM')->assertSee('EMK')->assertSee('PAK21')->assertSee('KBAT')->assertSee('Nilai');
    }

    public function test_cross_school_print_fails_closed(): void
    {
        $this->seed();
        [$school, $teacher, $plan] = $this->planFixture();
        $other = School::create(['name' => 'Other School', 'slug' => 'other-school', 'subdomain' => 'other-school']);
        $other->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        $this->actingAs($teacher)->get("http://{$other->subdomain}.erphpro.com/rph/{$plan->id}/print")->assertNotFound();
    }

    public function test_teacher_cannot_print_another_teachers_rph_but_school_admin_can(): void
    {
        $this->seed();
        [$school, $teacher, $plan] = $this->planFixture();
        $other = User::factory()->create();
        $school->members()->attach($other->id, ['role' => 'teacher', 'status' => 'active']);
        TeacherProfile::create(['school_id' => $school->id, 'user_id' => $other->id, 'employment_status' => 'active']);
        $this->actingAs($other)->get("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/print")->assertForbidden();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($admin)->get("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/print")->assertOk();
    }

    public function test_returned_rph_can_be_revised_and_resubmitted_as_a_new_version(): void
    {
        $this->seed();
        [$school, $teacher, $plan] = $this->planFixture('returned');
        $this->actingAs($teacher)->put("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}", [
            'lesson_date' => '2026-11-25', 'subject' => 'Bahasa Melayu', 'class_name' => '5 Bestari',
            'title' => 'Versi semakan', 'objectives' => 'Objektif baharu', 'change_note' => 'Pembetulan guru',
        ])->assertRedirect();
        $this->assertSame(2, $plan->fresh()->current_version);
        $this->actingAs($teacher)->post("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/submit")->assertRedirect();
        $this->assertSame('submitted', $plan->fresh()->status);
    }

    public function test_approved_rph_cannot_be_mutated(): void
    {
        $this->seed();
        [$school, $teacher, $plan] = $this->planFixture('approved');
        $this->actingAs($teacher)->get("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/edit")->assertStatus(422);
        $this->actingAs($teacher)->put("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}", [
            'lesson_date' => '2026-11-25', 'subject' => 'Bahasa Melayu', 'class_name' => '5 Bestari', 'title' => 'Tidak boleh',
        ])->assertStatus(422);
        $this->actingAs($teacher)->post("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/submit")
            ->assertStatus(422)->assertSee('Approved RPH cannot be resubmitted.');
        $this->actingAs($teacher)->get("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/print")
            ->assertOk();
        $this->assertSame(1, $plan->fresh()->current_version);
    }

    public function test_teacher_transfer_is_transactional_and_isolates_original_school_drafts_and_comments(): void
    {
        $this->seed();
        [$school, $teacher, $plan] = $this->planFixture('returned');
        LessonPlanReview::create(['school_id' => $school->id, 'lesson_plan_id' => $plan->id, 'reviewer_id' => User::where('email', 'demo@erphpro.com')->value('id'), 'decision' => 'returned', 'comment' => 'PRIVATE ORIGINAL SCHOOL COMMENT']);
        $target = School::create(['name' => 'Target School', 'slug' => 'target-school', 'subdomain' => 'target-school', 'is_active' => true]);
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $this->actingAs($admin)->put("http://{$school->subdomain}.erphpro.com/admin/teachers/{$plan->teacher_profile_id}/transfer", [
            'target_school_id' => $target->id, 'effective_date' => '2026-11-26',
        ])->assertRedirect()->assertSessionHas('status');

        $this->assertSame('2026-11-26', $plan->teacherProfile()->withoutGlobalScopes()->firstOrFail()->fresh()->left_school_on->toDateString());
        $this->assertDatabaseHas('teacher_profiles', ['school_id' => $target->id, 'user_id' => $teacher->id, 'employment_status' => 'active']);
        $this->assertSame('2026-11-26', TeacherEmploymentHistory::query()->where('school_id', $school->id)->where('user_id', $teacher->id)->firstOrFail()->ended_on->toDateString());

        $this->actingAs($teacher)->get("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/print")->assertForbidden();
        $export = $this->withSession(['auth.host_binding' => "{$target->subdomain}.erphpro.com"])->actingAs($teacher)->get("http://{$target->subdomain}.erphpro.com/teacher/rph/export")->assertOk();
        $this->assertStringNotContainsString('PRIVATE ORIGINAL SCHOOL COMMENT', $export->streamedContent());
        $this->assertStringNotContainsString('returned', $export->streamedContent());
    }

    public function test_archived_rph_is_read_only_and_exportable_without_review_comments(): void
    {
        $this->seed();
        [$school, $teacher, $plan] = $this->planFixture('archived');
        LessonPlanReview::create(['school_id' => $school->id, 'lesson_plan_id' => $plan->id, 'reviewer_id' => User::where('email', 'demo@erphpro.com')->value('id'), 'decision' => 'approved', 'comment' => 'INTERNAL REVIEW COMMENT']);
        $this->actingAs($teacher)->get("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}/edit")->assertStatus(422);
        $this->actingAs($teacher)->put("http://{$school->subdomain}.erphpro.com/rph/{$plan->id}", ['lesson_date' => '2026-11-25', 'subject' => 'BM', 'class_name' => '5 Bestari', 'title' => 'Nope'])->assertStatus(422);
        $export = $this->actingAs($teacher)->get("http://{$school->subdomain}.erphpro.com/teacher/rph/export")->assertOk();
        $this->assertStringContainsString('archived', $export->streamedContent());
        $this->assertStringNotContainsString('INTERNAL REVIEW COMMENT', $export->streamedContent());
    }

    private function planFixture(string $status = 'draft'): array
    {
        $school = School::where('subdomain', 'demo')->firstOrFail();
        $teacher = User::factory()->create();
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        $profile = TeacherProfile::create(['school_id' => $school->id, 'user_id' => $teacher->id, 'employment_status' => 'active']);
        $plan = LessonPlan::create(['school_id' => $school->id, 'teacher_profile_id' => $profile->id, 'lesson_date' => '2026-11-24', 'subject' => 'Bahasa Melayu', 'class_name' => '5 Bestari', 'status' => $status, 'current_version' => 1]);
        $plan->versions()->create(['version' => 1, 'created_by' => $teacher->id, 'source' => 'manual', 'content' => ['title' => 'Kata Sifat', 'topic' => 'Kata Sifat', 'standards' => 'SK 5.1 · SP 5.1.2 · TP 3', 'objectives' => 'Murid dapat mengenal pasti kata adjektif.', 'activities' => 'Aktiviti berkumpulan.', 'materials' => 'Buku teks', 'emk' => 'Bahasa', 'pak21' => 'Kolaboratif', 'kbat' => 'Menganalisis', 'moral_values' => 'Kerjasama', 'week_no' => 47]]);
        return [$school, $teacher, $plan];
    }
}
