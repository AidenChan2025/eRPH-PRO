<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\LessonPlan;
use App\Models\LessonPlanVersion;
use App\Models\LessonPlanReview;
use App\Models\LessonPlanSubmission;
use App\Models\School;
use App\Models\SupportTicket;
use App\Models\SupportArticle;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherProfile;
use Database\Seeders\SupportContentSeeder;
use App\Services\SupportAIService;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use App\Services\AuditLogger;
use App\Notifications\SchoolInvitationNotification;
use Mockery;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException;
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

    public function test_support_content_seeding_does_not_overwrite_operator_edits(): void
    {
        $this->seed(SupportContentSeeder::class);
        $article = SupportArticle::query()->where('slug', 'human-support')->firstOrFail();
        $article->update([
            'title' => 'Operator-edited support title',
            'body' => 'Operator-edited support guidance.',
            'is_published' => false,
        ]);

        $this->seed(SupportContentSeeder::class);

        $this->assertDatabaseHas('support_articles', [
            'id' => $article->id,
            'title' => 'Operator-edited support title',
            'body' => 'Operator-edited support guidance.',
            'is_published' => 0,
        ]);
    }

    public function test_academic_years_and_classes_are_scoped_to_the_current_school(): void
    {
        $this->seed();
        $school = School::where('subdomain', 'demo')->firstOrFail();
        $otherSchool = School::create(['name' => 'Other School', 'slug' => 'other-school', 'subdomain' => 'other-school']);

        $demoYear = AcademicYear::create(['school_id' => $school->id, 'year' => 2027, 'name' => 'School year 2027', 'status' => 'active']);
        $otherYear = AcademicYear::create(['school_id' => $otherSchool->id, 'year' => 2027, 'name' => 'Other year 2027', 'status' => 'active']);
        SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $demoYear->id, 'code' => '5B', 'name' => '5 Bestari', 'level' => 'Year 5']);
        SchoolClass::create(['school_id' => $otherSchool->id, 'academic_year_id' => $otherYear->id, 'code' => '5B', 'name' => 'Other 5 Bestari', 'level' => 'Year 5']);

        try {
            SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $otherYear->id, 'code' => '6X', 'name' => 'Cross-school class']);
            $this->fail('A class must not reference an academic year owned by another school.');
        } catch (QueryException) {
            $this->assertTrue(true);
        }

        $this->get('http://demo.erphpro.com/')->assertOk();

        $this->assertSame(['5 Bestari'], SchoolClass::query()->pluck('name')->all());
        $this->assertSame(['School year 2027'], AcademicYear::query()->pluck('name')->all());
    }

    public function test_school_admin_can_copy_active_assignments_between_years_without_copying_rph(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $school = School::where('subdomain', 'demo')->firstOrFail();
        $sourceYear = AcademicYear::create(['school_id' => $school->id, 'year' => 2030, 'name' => 'Source 2030', 'status' => 'closed']);
        $targetYear = AcademicYear::create(['school_id' => $school->id, 'year' => 2031, 'name' => 'Target 2031', 'status' => 'draft']);
        $sourceClass = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'code' => '4A', 'name' => '4 Amanah']);
        $targetClass = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $targetYear->id, 'code' => '4A', 'name' => '4 Amanah next']);
        $teacher = User::factory()->create(['email' => 'year-copy-teacher@example.com']);
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        $profile = TeacherProfile::create(['school_id' => $school->id, 'user_id' => $teacher->id, 'employment_status' => 'active']);
        $assignment = TeacherClassAssignment::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'school_class_id' => $sourceClass->id, 'teacher_profile_id' => $profile->id, 'subject' => 'Science', 'role' => 'head', 'metadata' => ['from' => '2030']]);
        $plan = LessonPlan::create(['school_id' => $school->id, 'teacher_profile_id' => $profile->id, 'teacher_class_assignment_id' => $assignment->id, 'lesson_date' => '2030-02-01', 'subject' => 'Science', 'class_name' => '4 Amanah', 'status' => 'draft', 'current_version' => 1]);
        $missingSourceClass = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'code' => '4B', 'name' => '4 Bina']);
        TeacherClassAssignment::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'school_class_id' => $missingSourceClass->id, 'teacher_profile_id' => $profile->id, 'subject' => 'History', 'role' => 'teacher']);
        $inactiveTargetClass = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $targetYear->id, 'code' => '4C', 'name' => '4 Cekal', 'is_active' => false]);
        $inactiveSourceClass = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'code' => '4C', 'name' => '4 Cekal']);
        TeacherClassAssignment::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'school_class_id' => $inactiveSourceClass->id, 'teacher_profile_id' => $profile->id, 'subject' => 'Art', 'role' => 'teacher']);
        $inactiveTeacher = User::factory()->create(['email' => 'year-copy-inactive@example.com']);
        $school->members()->attach($inactiveTeacher->id, ['role' => 'teacher', 'status' => 'inactive']);
        $inactiveProfile = TeacherProfile::create(['school_id' => $school->id, 'user_id' => $inactiveTeacher->id, 'employment_status' => 'inactive']);
        TeacherClassAssignment::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'school_class_id' => $sourceClass->id, 'teacher_profile_id' => $inactiveProfile->id, 'subject' => 'Music', 'role' => 'teacher']);
        $status = 'Copied 1 assignments; 0 existing, 1 missing classes, 1 inactive classes, 1 inactive teachers skipped.';
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-assignments', ['source_academic_year_id' => $sourceYear->id, 'target_academic_year_id' => $targetYear->id])->assertRedirect()->assertSessionHas('status', $status);
        $copied = TeacherClassAssignment::withoutGlobalScopes()->where('academic_year_id', $targetYear->id)->firstOrFail();
        $this->assertSame($targetClass->id, $copied->school_class_id);
        $this->assertSame($assignment->metadata, $copied->metadata);
        $this->assertDatabaseHas('lesson_plans', ['id' => $plan->id, 'teacher_class_assignment_id' => $assignment->id]);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-assignments', ['source_academic_year_id' => $sourceYear->id, 'target_academic_year_id' => $targetYear->id])->assertRedirect()->assertSessionHas('status', 'Copied 0 assignments; 1 existing, 1 missing classes, 1 inactive classes, 1 inactive teachers skipped.');
        $this->assertDatabaseCount('teacher_class_assignments', 5);
        $audit = DB::table('audit_logs')->where('action', 'school.academic_year_assignments_copied')->latest('id')->firstOrFail();
        $this->assertSame($targetYear->id, (int) $audit->subject_id);
        $context = json_decode($audit->context, true);
        $this->assertSame(['created' => 0, 'skipped' => 1, 'missing_class' => 1, 'inactive_class' => 1, 'inactive_teacher' => 1], array_intersect_key($context, array_flip(['created', 'skipped', 'missing_class', 'inactive_class', 'inactive_teacher'])));
    }

    public function test_assignment_copy_rejects_cross_school_years_and_rolls_back_when_audit_fails(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $school = School::where('subdomain', 'demo')->firstOrFail();
        $otherSchool = School::create(['name' => 'Other School', 'slug' => 'copy-other-school', 'subdomain' => 'copy-other-school']);
        $sourceYear = AcademicYear::create(['school_id' => $school->id, 'year' => 2032, 'name' => 'Source 2032', 'status' => 'closed']);
        $targetYear = AcademicYear::create(['school_id' => $school->id, 'year' => 2033, 'name' => 'Target 2033', 'status' => 'draft']);
        $otherYear = AcademicYear::create(['school_id' => $otherSchool->id, 'year' => 2033, 'name' => 'Other 2033', 'status' => 'draft']);
        $sourceClass = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'code' => '5A', 'name' => '5 Amanah']);
        SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $targetYear->id, 'code' => '5A', 'name' => '5 Amanah next']);
        $teacher = User::factory()->create(['email' => 'copy-rollback-teacher@example.com']);
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        $profile = TeacherProfile::create(['school_id' => $school->id, 'user_id' => $teacher->id, 'employment_status' => 'active']);
        TeacherClassAssignment::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'school_class_id' => $sourceClass->id, 'teacher_profile_id' => $profile->id, 'subject' => 'Science', 'role' => 'teacher']);

        $beforeAssignments = TeacherClassAssignment::withoutGlobalScopes()->count();
        $beforeAudits = DB::table('audit_logs')->where('action', 'school.academic_year_assignments_copied')->count();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-assignments', [
            'source_academic_year_id' => $sourceYear->id,
            'target_academic_year_id' => $otherYear->id,
        ])->assertNotFound();
        $this->assertSame($beforeAssignments, TeacherClassAssignment::withoutGlobalScopes()->count());
        $this->assertSame($beforeAudits, DB::table('audit_logs')->where('action', 'school.academic_year_assignments_copied')->count());

        $this->app->instance(AuditLogger::class, Mockery::mock(AuditLogger::class, function ($mock): void {
            $mock->shouldReceive('record')->once()->andThrow(new \RuntimeException('audit unavailable'));
        }));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-assignments', [
                'source_academic_year_id' => $sourceYear->id,
                'target_academic_year_id' => $targetYear->id,
            ]);
            $this->fail('The audit failure must be propagated.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('audit unavailable', $exception->getMessage());
        } finally {
            $this->app->instance(AuditLogger::class, new AuditLogger());
            $this->withExceptionHandling();
        }
        $this->assertSame($beforeAssignments, TeacherClassAssignment::withoutGlobalScopes()->count());
        $this->assertSame($beforeAudits, DB::table('audit_logs')->where('action', 'school.academic_year_assignments_copied')->count());
    }

    public function test_assignment_copy_rolls_back_when_insert_fails_for_a_non_duplicate_reason(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $school = School::where('subdomain', 'demo')->firstOrFail();
        $sourceYear = AcademicYear::create(['school_id' => $school->id, 'year' => 2034, 'name' => 'Source 2034', 'status' => 'closed']);
        $targetYear = AcademicYear::create(['school_id' => $school->id, 'year' => 2035, 'name' => 'Target 2035', 'status' => 'draft']);
        $sourceClass = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'code' => '6A', 'name' => '6 Amanah']);
        SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $targetYear->id, 'code' => '6A', 'name' => '6 Amanah next']);
        $teacher = User::factory()->create(['email' => 'copy-insert-failure@example.com']);
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        $profile = TeacherProfile::create(['school_id' => $school->id, 'user_id' => $teacher->id, 'employment_status' => 'active']);
        TeacherClassAssignment::create(['school_id' => $school->id, 'academic_year_id' => $sourceYear->id, 'school_class_id' => $sourceClass->id, 'teacher_profile_id' => $profile->id, 'subject' => 'Broken', 'role' => 'teacher']);

        DB::statement("CREATE TRIGGER fail_assignment_copy BEFORE INSERT ON teacher_class_assignments WHEN NEW.subject = 'Broken' BEGIN SELECT RAISE(ABORT, 'forced assignment insert failure'); END");
        try {
            $this->withoutExceptionHandling();
            $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-assignments', [
                'source_academic_year_id' => $sourceYear->id,
                'target_academic_year_id' => $targetYear->id,
            ]);
            $this->fail('A non-duplicate insert failure must abort the copy.');
        } catch (\Throwable $exception) {
            $this->assertStringContainsString('forced assignment insert failure', $exception->getMessage());
        } finally {
            DB::statement('DROP TRIGGER IF EXISTS fail_assignment_copy');
            $this->withExceptionHandling();
        }

        $this->assertDatabaseMissing('teacher_class_assignments', ['academic_year_id' => $targetYear->id, 'subject' => 'Broken']);
        $this->assertDatabaseMissing('audit_logs', ['action' => 'school.academic_year_assignments_copied', 'subject_id' => $targetYear->id]);
    }

    public function test_school_admin_can_manage_academic_years_and_classes(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $this->actingAs($admin)->get('http://demo.erphpro.com/admin/academic-data')
            ->assertOk()->assertSee('Academic years')->assertSee('classes')
            ->assertSee('Copy active teacher assignments')
            ->assertSee('/admin/academic-years/copy-assignments', false);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years', [
            'year' => 2028, 'name' => 'School year 2028', 'starts_on' => '2028-01-01', 'ends_on' => '2028-12-31',
        ])->assertRedirect()->assertSessionHas('status', 'Academic year created.');
        $schoolId = School::where('subdomain', 'demo')->value('id');
        $year = AcademicYear::where('school_id', $schoolId)->where('year', 2028)->firstOrFail();

        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/'.$year->id.'/activate')
            ->assertRedirect()->assertSessionHas('status', 'Academic year activated.');
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/classes', [
            'academic_year_id' => $year->id, 'code' => '6A', 'name' => '6 Amanah', 'level' => 'Year 6', 'capacity' => 35,
        ])->assertRedirect()->assertSessionHas('status', 'Class created.');

        $targetYear = AcademicYear::create(['school_id' => $schoolId, 'year' => 2029, 'name' => 'School year 2029', 'status' => 'draft']);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-classes', [
            'source_academic_year_id' => $year->id, 'target_academic_year_id' => $targetYear->id,
        ])->assertRedirect()->assertSessionHas('status', 'Copied 1 classes; 0 existing classes skipped.');
        $this->assertDatabaseHas('school_classes', ['school_id' => $schoolId, 'academic_year_id' => $targetYear->id, 'code' => '6A']);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-classes', [
            'source_academic_year_id' => $year->id, 'target_academic_year_id' => $targetYear->id,
        ])->assertRedirect()->assertSessionHas('status', 'Copied 0 classes; 1 existing classes skipped.');
        $this->assertDatabaseHas('audit_logs', ['action' => 'school.academic_year_classes_copied']);
        $otherSchool = School::create(['name' => 'Other copy school', 'slug' => 'other-copy-school', 'subdomain' => 'other-copy-school']);
        $otherYear = AcademicYear::create(['school_id' => $otherSchool->id, 'year' => 2029, 'name' => 'Other year', 'status' => 'draft']);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-classes', [
            'source_academic_year_id' => $otherYear->id, 'target_academic_year_id' => $targetYear->id,
        ])->assertStatus(404);

        $this->assertDatabaseHas('school_classes', ['school_id' => $schoolId, 'academic_year_id' => $year->id, 'code' => '6A']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'school.academic_year_created']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'school.class_created']);

        $teacher = User::factory()->create(['email' => 'assigned-teacher@example.com']);
        School::whereKey($schoolId)->firstOrFail()->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        $profile = TeacherProfile::create(['school_id' => $schoolId, 'user_id' => $teacher->id, 'employment_status' => 'active']);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/teacher-assignments', [
            'academic_year_id' => $year->id, 'school_class_id' => SchoolClass::where('code', '6A')->value('id'),
            'teacher_profile_id' => $profile->id, 'subject' => 'Mathematics', 'role' => 'teacher',
        ])->assertRedirect()->assertSessionHas('status', 'Teacher assignment created.');
        $assignment = TeacherClassAssignment::where('teacher_profile_id', $profile->id)->firstOrFail();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/teacher-assignments/'.$assignment->id.'/remove')
            ->assertRedirect()->assertSessionHas('status', 'Teacher assignment removed.');
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $assignment->id, 'is_active' => 0]);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/teacher-assignments', [
            'academic_year_id' => $year->id, 'school_class_id' => SchoolClass::where('code', '6A')->value('id'),
            'teacher_profile_id' => $profile->id, 'subject' => 'Mathematics', 'role' => 'head',
        ])->assertRedirect();
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $assignment->id, 'is_active' => 1, 'role' => 'head']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'school.teacher_class_assignment_reactivated']);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/teacher-assignments', [
            'academic_year_id' => $year->id, 'school_class_id' => SchoolClass::where('code', '6A')->value('id'),
            'teacher_profile_id' => $profile->id, 'subject' => 'Mathematics', 'role' => 'teacher',
        ])->assertStatus(422);
        $transferClass = SchoolClass::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'code' => '6B', 'name' => '6 Bestari',
            'level' => 'Year 6', 'capacity' => 30,
        ]);
        $transferAssignment = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => SchoolClass::where('code', '6A')->value('id'),
            'teacher_profile_id' => $profile->id, 'subject' => 'English', 'role' => 'head', 'metadata' => ['source' => 'timetable'],
        ]);
        $transferPlan = LessonPlan::create([
            'school_id' => $schoolId, 'teacher_profile_id' => $profile->id,
            'teacher_class_assignment_id' => $transferAssignment->id, 'lesson_date' => '2029-01-15',
            'subject' => 'English', 'class_name' => '6 Amanah', 'status' => 'draft', 'current_version' => 1,
        ]);
        $targetTeacher = User::factory()->create(['email' => 'transfer-target@example.com']);
        School::whereKey($schoolId)->firstOrFail()->members()->attach($targetTeacher->id, ['role' => 'teacher', 'status' => 'active']);
        $targetProfile = TeacherProfile::create(['school_id' => $schoolId, 'user_id' => $targetTeacher->id, 'employment_status' => 'active']);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$transferAssignment->id.'/transfer', [
            'school_class_id' => $transferClass->id, 'teacher_profile_id' => $targetProfile->id,
        ])->assertRedirect()->assertSessionHas('status', 'Teacher assignment transferred.');
        $transferred = TeacherClassAssignment::withoutGlobalScopes()->where('school_class_id', $transferClass->id)->where('subject', 'English')->firstOrFail();
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $transferAssignment->id, 'is_active' => 0]);
        $this->assertTrue($transferred->is_active);
        $this->assertSame($transferAssignment->id, $transferPlan->fresh()->teacher_class_assignment_id);
        $transferAudit = DB::table('audit_logs')->where('action', 'school.teacher_class_assignment_transferred')->latest('id')->firstOrFail();
        $transferContext = json_decode($transferAudit->context, true);
        $this->assertSame($schoolId, $transferAudit->school_id);
        $this->assertSame($transferred->id, (int) $transferAudit->subject_id);
        $this->assertSame($transferAssignment->id, $transferContext['from_assignment_id']);
        $this->assertSame($transferred->id, $transferContext['to_assignment_id']);
        $this->assertSame($assignment->school_class_id, $transferContext['from_school_class_id']);
        $this->assertSame($transferClass->id, $transferContext['to_school_class_id']);
        $this->assertSame($profile->id, $transferContext['from_teacher_profile_id']);
        $this->assertSame($targetProfile->id, $transferContext['to_teacher_profile_id']);
        $this->assertSame('English', $transferContext['subject']);
        $sourceClass = SchoolClass::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'code' => '7A', 'name' => '7 Arif',
            'level' => 'Year 7', 'stream' => 'STEM', 'capacity' => 32, 'metadata' => ['homeroom' => 'B-12'],
        ]);
        $sourceAssignment = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => $sourceClass->id,
            'teacher_profile_id' => $profile->id, 'subject' => 'Science', 'role' => 'teacher',
        ]);
        $targetProfile->update(['employment_status' => 'inactive']);
        DB::table('school_memberships')->where('school_id', $schoolId)->where('user_id', $targetTeacher->id)->update(['status' => 'inactive']);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$sourceAssignment->id.'/transfer', [
            'school_class_id' => $transferClass->id, 'teacher_profile_id' => $targetProfile->id,
        ])->assertStatus(422);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $sourceAssignment->id, 'is_active' => 1]);
        $targetProfile->update(['employment_status' => 'active']);
        DB::table('school_memberships')->where('school_id', $schoolId)->where('user_id', $targetTeacher->id)->update(['status' => 'active']);
        $conflictingTarget = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => $transferClass->id,
            'teacher_profile_id' => $targetProfile->id, 'subject' => 'Science', 'role' => 'teacher',
        ]);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$sourceAssignment->id.'/transfer', [
            'school_class_id' => $transferClass->id, 'teacher_profile_id' => $targetProfile->id,
        ])->assertStatus(422);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $sourceAssignment->id, 'is_active' => 1]);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $conflictingTarget->id, 'is_active' => 1]);
        $conflictingTarget->update(['is_active' => false]);
        $restoreSource = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => SchoolClass::where('code', '6A')->value('id'),
            'teacher_profile_id' => $profile->id, 'subject' => 'Geography', 'role' => 'teacher',
        ]);
        $restoreTarget = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => $transferClass->id,
            'teacher_profile_id' => $targetProfile->id, 'subject' => 'Geography', 'role' => 'head', 'is_active' => false,
        ]);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$restoreSource->id.'/transfer', [
            'school_class_id' => $transferClass->id, 'teacher_profile_id' => $targetProfile->id,
        ])->assertRedirect()->assertSessionHas('status', 'Teacher assignment transferred.');
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $restoreSource->id, 'is_active' => 0]);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $restoreTarget->id, 'is_active' => 1, 'role' => 'teacher']);
        $restoreFailureSource = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => SchoolClass::where('code', '6A')->value('id'),
            'teacher_profile_id' => $profile->id, 'subject' => 'Music', 'role' => 'teacher',
        ]);
        $restoreFailureTarget = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => $transferClass->id,
            'teacher_profile_id' => $targetProfile->id, 'subject' => 'Music', 'role' => 'head', 'is_active' => false,
        ]);
        $this->app->instance(AuditLogger::class, Mockery::mock(AuditLogger::class, function ($mock): void {
            $mock->shouldReceive('record')->once()->andThrow(new \RuntimeException('restore audit unavailable'));
        }));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$restoreFailureSource->id.'/transfer', [
                'school_class_id' => $transferClass->id, 'teacher_profile_id' => $targetProfile->id,
            ]);
            $this->fail('A restore audit failure should roll back the inactive target restoration.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('restore audit unavailable', $exception->getMessage());
        }
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $restoreFailureSource->id, 'is_active' => 1]);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $restoreFailureTarget->id, 'is_active' => 0]);
        $this->app->instance(AuditLogger::class, new AuditLogger());
        $this->withExceptionHandling();
        $rollbackSource = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => SchoolClass::where('code', '6A')->value('id'),
            'teacher_profile_id' => $profile->id, 'subject' => 'Art', 'role' => 'teacher',
        ]);
        $this->app->instance(AuditLogger::class, Mockery::mock(AuditLogger::class, function ($mock): void {
            $mock->shouldReceive('record')->once()->andThrow(new \RuntimeException('transfer audit unavailable'));
        }));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$rollbackSource->id.'/transfer', [
                'school_class_id' => $transferClass->id, 'teacher_profile_id' => $targetProfile->id,
            ]);
            $this->fail('A transfer audit failure should roll back both assignment states.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('transfer audit unavailable', $exception->getMessage());
        }
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $rollbackSource->id, 'is_active' => 1]);
        $this->assertDatabaseMissing('teacher_class_assignments', ['school_class_id' => $transferClass->id, 'teacher_profile_id' => $targetProfile->id, 'subject' => 'Art']);
        $this->app->instance(AuditLogger::class, new AuditLogger());
        $this->withExceptionHandling();
        $otherClass = SchoolClass::create(['school_id' => $otherSchool->id, 'academic_year_id' => $otherYear->id, 'code' => 'X1', 'name' => 'Other class']);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$rollbackSource->id.'/transfer', [
            'school_class_id' => $otherClass->id, 'teacher_profile_id' => $targetProfile->id,
        ])->assertStatus(404);
        $inactiveClass = SchoolClass::create(['school_id' => $schoolId, 'academic_year_id' => $year->id, 'code' => '6C', 'name' => '6 Cemerlang', 'is_active' => false]);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$rollbackSource->id.'/transfer', [
            'school_class_id' => $inactiveClass->id, 'teacher_profile_id' => $targetProfile->id,
        ])->assertStatus(422);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $rollbackSource->id, 'is_active' => 1]);
        $crossTeacher = User::factory()->create(['email' => 'cross-school-transfer@example.com']);
        $otherSchool->members()->attach($crossTeacher->id, ['role' => 'teacher', 'status' => 'active']);
        $crossProfile = TeacherProfile::create(['school_id' => $otherSchool->id, 'user_id' => $crossTeacher->id, 'employment_status' => 'active']);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/teacher-assignments/'.$rollbackSource->id.'/transfer', [
            'school_class_id' => $transferClass->id, 'teacher_profile_id' => $crossProfile->id,
        ])->assertStatus(404);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $rollbackSource->id, 'is_active' => 1]);
        LessonPlan::create([
            'school_id' => $schoolId, 'teacher_profile_id' => $profile->id,
            'teacher_class_assignment_id' => $sourceAssignment->id, 'lesson_date' => '2029-02-01',
            'subject' => 'Science', 'class_name' => '7 Arif', 'status' => 'draft', 'current_version' => 1,
        ]);
        $assignmentCount = TeacherClassAssignment::withoutGlobalScopes()->count();
        $lessonPlanCount = LessonPlan::withoutGlobalScopes()->count();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-classes', [
            'source_academic_year_id' => $year->id, 'target_academic_year_id' => $targetYear->id,
        ])->assertRedirect()->assertSessionHas('status', 'Copied 3 classes; 1 existing classes skipped.');
        $this->assertDatabaseHas('school_classes', [
            'school_id' => $schoolId, 'academic_year_id' => $targetYear->id, 'code' => '7A', 'name' => '7 Arif',
            'level' => 'Year 7', 'stream' => 'STEM', 'capacity' => 32,
        ]);
        $copiedClass = SchoolClass::query()->where('academic_year_id', $targetYear->id)->where('code', '7A')->firstOrFail();
        $this->assertSame($sourceClass->metadata, $copiedClass->metadata);
        $this->assertSame($assignmentCount, TeacherClassAssignment::withoutGlobalScopes()->count());
        $this->assertSame($lessonPlanCount, LessonPlan::withoutGlobalScopes()->count());
        $this->assertDatabaseMissing('teacher_class_assignments', ['academic_year_id' => $targetYear->id, 'subject' => 'Science']);
        $this->actingAs($teacher)->post('http://demo.erphpro.com/admin/academic-years/copy-classes', [
            'source_academic_year_id' => $year->id, 'target_academic_year_id' => $targetYear->id,
        ])->assertStatus(403);
        $auditCount = DB::table('audit_logs')->where('action', 'school.academic_year_classes_copied')->count();
        $targetClassCount = SchoolClass::withoutGlobalScopes()->where('academic_year_id', $otherYear->id)->count();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-classes', [
            'source_academic_year_id' => $year->id, 'target_academic_year_id' => $otherYear->id,
        ])->assertStatus(404);
        $this->assertSame($targetClassCount, SchoolClass::withoutGlobalScopes()->where('academic_year_id', $otherYear->id)->count());
        $this->assertSame($auditCount, DB::table('audit_logs')->where('action', 'school.academic_year_classes_copied')->count());
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/copy-classes', [
            'source_academic_year_id' => $year->id, 'target_academic_year_id' => $year->id,
        ])->assertStatus(404);
        $this->assertSame($auditCount, DB::table('audit_logs')->where('action', 'school.academic_year_classes_copied')->count());
        $this->assertDatabaseCount('teacher_class_assignments', 10);
        $this->assertDatabaseHas('audit_logs', ['action' => 'school.teacher_class_assignment_created']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'school.teacher_class_assignment_removed']);
        $activeAssignmentIds = TeacherClassAssignment::withoutGlobalScopes()->where('teacher_profile_id', $profile->id)->where('is_active', true)->pluck('id')->all();
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/people/'.$teacher->id, [
            'role' => 'teacher', 'status' => 'inactive',
        ])->assertRedirect()->assertSessionHas('status', 'School account updated.');
        $this->assertDatabaseHas('teacher_profiles', ['id' => $profile->id, 'employment_status' => 'inactive']);
        $this->assertSame(0, TeacherClassAssignment::withoutGlobalScopes()->where('teacher_profile_id', $profile->id)->where('is_active', true)->count());
        foreach ($activeAssignmentIds as $activeAssignmentId) {
            $this->assertDatabaseHas('teacher_class_assignments', ['id' => $activeAssignmentId, 'is_active' => 0]);
        }
        $this->assertDatabaseHas('audit_logs', ['action' => 'school.teacher_assignments_deactivated_with_member']);
        $assignmentAudit = DB::table('audit_logs')->where('action', 'school.teacher_assignments_deactivated_with_member')->latest('id')->first();
        $assignmentAuditContext = json_decode($assignmentAudit->context, true);
        $this->assertSame($schoolId, $assignmentAudit->school_id);
        $this->assertSame($profile->id, (int) $assignmentAudit->subject_id);
        $this->assertSame(4, $assignmentAuditContext['assignment_count']);
        $this->assertSame('member_inactive', $assignmentAuditContext['reason']);
        $historyPlan = LessonPlan::create([
            'school_id' => $schoolId, 'teacher_profile_id' => $profile->id,
            'teacher_class_assignment_id' => $assignment->id, 'lesson_date' => '2029-03-01',
            'subject' => 'Mathematics', 'class_name' => '6 Amanah', 'status' => 'draft', 'current_version' => 1,
        ]);
        $otherTeacher = User::factory()->create(['email' => 'other-assignment-teacher@example.com']);
        $otherSchool->members()->attach($otherTeacher->id, ['role' => 'teacher', 'status' => 'active']);
        $otherProfile = TeacherProfile::create(['school_id' => $otherSchool->id, 'user_id' => $otherTeacher->id, 'employment_status' => 'active']);
        $otherClass = SchoolClass::create(['school_id' => $otherSchool->id, 'academic_year_id' => $otherYear->id, 'code' => 'O1', 'name' => 'Other class']);
        $otherAssignment = TeacherClassAssignment::create([
            'school_id' => $otherSchool->id, 'academic_year_id' => $otherYear->id, 'school_class_id' => $otherClass->id,
            'teacher_profile_id' => $otherProfile->id, 'subject' => 'Other subject', 'role' => 'teacher',
        ]);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/people/'.$teacher->id, [
            'role' => 'teacher', 'status' => 'active',
        ])->assertRedirect()->assertSessionHas('status', 'School account updated.');
        $this->assertDatabaseHas('teacher_profiles', ['id' => $profile->id, 'employment_status' => 'active']);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $assignment->id, 'is_active' => 0]);
        $this->assertDatabaseHas('lesson_plans', ['id' => $historyPlan->id, 'teacher_class_assignment_id' => $assignment->id]);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $otherAssignment->id, 'is_active' => 1]);

        $newAssignment = TeacherClassAssignment::create([
            'school_id' => $schoolId, 'academic_year_id' => $year->id, 'school_class_id' => SchoolClass::where('code', '6A')->value('id'),
            'teacher_profile_id' => $profile->id, 'subject' => 'History', 'role' => 'teacher',
        ]);
        $this->app->instance(AuditLogger::class, Mockery::mock(AuditLogger::class, function ($mock): void {
            $mock->shouldReceive('record')->once()->andThrow(new \RuntimeException('audit unavailable'));
        }));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($admin)->put('http://demo.erphpro.com/admin/people/'.$teacher->id, [
                'role' => 'teacher', 'status' => 'inactive',
            ]);
            $this->fail('An audit failure should roll back member lifecycle changes.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('audit unavailable', $exception->getMessage());
        }
        $this->assertDatabaseHas('school_memberships', ['school_id' => $schoolId, 'user_id' => $teacher->id, 'status' => 'active']);
        $this->assertDatabaseHas('teacher_profiles', ['id' => $profile->id, 'employment_status' => 'active']);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $newAssignment->id, 'is_active' => 1]);
        $this->app->instance(AuditLogger::class, new AuditLogger());
        $recordCalls = 0;
        $this->app->instance(AuditLogger::class, Mockery::mock(AuditLogger::class, function ($mock) use (&$recordCalls): void {
            $mock->shouldReceive('record')->twice()->ordered()->andReturnUsing(function () use (&$recordCalls): void {
                $recordCalls++;
                if ($recordCalls === 2) {
                    throw new \RuntimeException('audit unavailable on member record');
                }
            });
        }));
        try {
            $this->actingAs($admin)->put('http://demo.erphpro.com/admin/people/'.$teacher->id, [
                'role' => 'teacher', 'status' => 'inactive',
            ]);
            $this->fail('A later audit failure should roll back the complete lifecycle transaction.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('audit unavailable on member record', $exception->getMessage());
        }
        $this->assertDatabaseHas('school_memberships', ['school_id' => $schoolId, 'user_id' => $teacher->id, 'status' => 'active']);
        $this->assertDatabaseHas('teacher_profiles', ['id' => $profile->id, 'employment_status' => 'active']);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $newAssignment->id, 'is_active' => 1]);
        $this->app->instance(AuditLogger::class, new AuditLogger());
    }

    public function test_academic_data_management_rejects_non_admin_and_cross_school_resources(): void
    {
        $this->seed();
        $school = School::where('subdomain', 'demo')->firstOrFail();
        $otherSchool = School::create(['name' => 'Other School', 'slug' => 'other-school', 'subdomain' => 'other-school']);
        $otherYear = AcademicYear::create(['school_id' => $otherSchool->id, 'year' => 2028, 'name' => 'Other year', 'status' => 'active']);
        $otherClass = SchoolClass::create(['school_id' => $otherSchool->id, 'academic_year_id' => $otherYear->id, 'code' => 'O1', 'name' => 'Other class']);
        $otherTeacher = User::factory()->create(['email' => 'other-teacher@example.com']);
        $otherSchool->members()->attach($otherTeacher->id, ['role' => 'teacher', 'status' => 'active']);
        $otherProfile = TeacherProfile::create(['school_id' => $otherSchool->id, 'user_id' => $otherTeacher->id, 'employment_status' => 'active']);
        $teacher = User::factory()->create(['email' => 'teacher@example.com']);
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);

        $this->actingAs($teacher)->get('http://demo.erphpro.com/admin/academic-data')->assertForbidden();
        $this->actingAs($teacher)->post('http://demo.erphpro.com/admin/academic-years', [
            'year' => 2030, 'name' => 'Forbidden year',
        ])->assertForbidden();
        $this->actingAs($teacher)->post('http://demo.erphpro.com/admin/academic-years/1/activate')->assertNotFound();
        $this->actingAs($teacher)->post('http://demo.erphpro.com/admin/classes', [
            'academic_year_id' => 1, 'code' => 'T1', 'name' => 'Forbidden class',
        ])->assertForbidden();
        $this->actingAs($teacher)->put('http://demo.erphpro.com/admin/classes/1', [
            'name' => 'Forbidden update', 'is_active' => 0,
        ])->assertNotFound();
        $this->actingAs($teacher)->post('http://demo.erphpro.com/admin/teacher-assignments', [
            'academic_year_id' => 1, 'school_class_id' => 1, 'teacher_profile_id' => 1, 'subject' => 'Science', 'role' => 'teacher',
        ])->assertForbidden();
        $this->actingAs($teacher)->post('http://demo.erphpro.com/admin/teacher-assignments/1/remove')->assertNotFound();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/classes', [
            'academic_year_id' => $otherYear->id, 'code' => 'X1', 'name' => 'Cross school',
        ])->assertNotFound();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/'.$otherYear->id.'/activate')->assertNotFound();
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/classes/'.$otherClass->id, [
            'name' => 'Tampered', 'is_active' => 0,
        ])->assertNotFound();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/teacher-assignments', [
            'academic_year_id' => $otherYear->id, 'school_class_id' => $otherClass->id,
            'teacher_profile_id' => $otherProfile->id, 'subject' => 'Science', 'role' => 'teacher',
        ])->assertNotFound();
        $otherAssignment = TeacherClassAssignment::create([
            'school_id' => $otherSchool->id, 'academic_year_id' => $otherYear->id, 'school_class_id' => $otherClass->id,
            'teacher_profile_id' => $otherProfile->id, 'subject' => 'History', 'role' => 'teacher', 'is_active' => true,
        ]);
        $auditBefore = DB::table('audit_logs')->where('action', 'school.teacher_class_assignment_removed')->count();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/teacher-assignments/'.$otherAssignment->id.'/remove')->assertNotFound();

        $this->assertDatabaseMissing('school_classes', ['school_id' => $school->id, 'code' => 'X1']);
        $this->assertDatabaseHas('school_classes', ['id' => $otherClass->id, 'name' => 'Other class', 'is_active' => 1]);
        $this->assertDatabaseHas('academic_years', ['id' => $otherYear->id, 'status' => 'active']);
        $this->assertDatabaseCount('teacher_class_assignments', 1);
        $this->assertDatabaseHas('teacher_class_assignments', ['id' => $otherAssignment->id, 'is_active' => 1]);
        $this->assertSame($auditBefore, DB::table('audit_logs')->where('action', 'school.teacher_class_assignment_removed')->count());

        $demoYear = AcademicYear::create(['school_id' => $school->id, 'year' => 2029, 'name' => 'Demo year', 'status' => 'active']);
        $demoClass = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $demoYear->id, 'code' => 'D1', 'name' => 'Demo class']);
        $demoYear2 = AcademicYear::create(['school_id' => $school->id, 'year' => 2030, 'name' => 'Demo year 2', 'status' => 'draft']);
        $demoProfile = TeacherProfile::create(['school_id' => $school->id, 'user_id' => $teacher->id, 'employment_status' => 'active']);
        try {
            TeacherClassAssignment::create([
                'school_id' => $school->id, 'academic_year_id' => $demoYear2->id, 'school_class_id' => $demoClass->id,
                'teacher_profile_id' => $demoProfile->id, 'subject' => 'Invalid', 'role' => 'teacher',
            ]);
            $this->fail('A teacher assignment must reference the class academic year.');
        } catch (QueryException) {
            $this->assertTrue(true);
        }
    }

    public function test_academic_data_state_and_audit_transactions_are_atomic(): void
    {
        $this->seed();
        $school = School::where('subdomain', 'demo')->firstOrFail();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $active = AcademicYear::create(['school_id' => $school->id, 'year' => 2026, 'name' => 'Active year', 'status' => 'active']);
        $draft = AcademicYear::create(['school_id' => $school->id, 'year' => 2027, 'name' => 'Draft year', 'status' => 'draft']);
        $target = AcademicYear::create(['school_id' => $school->id, 'year' => 2028, 'name' => 'Target year', 'status' => 'draft']);

        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years/'.$target->id.'/activate')->assertRedirect();
        $this->assertDatabaseHas('academic_years', ['id' => $active->id, 'status' => 'closed']);
        $this->assertDatabaseHas('academic_years', ['id' => $draft->id, 'status' => 'draft']);
        $this->assertDatabaseHas('academic_years', ['id' => $target->id, 'status' => 'active']);

        $class = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $target->id, 'code' => '6A', 'name' => 'Original name']);
        $this->actingAs($admin)->put('http://demo.erphpro.com/admin/classes/'.$class->id, [
            'name' => 'Updated name', 'is_active' => 0,
        ])->assertRedirect();
        $audit = DB::table('audit_logs')->where('action', 'school.class_updated')->latest('id')->first();
        $context = json_decode($audit->context, true);
        $this->assertSame('Original name', $context['before']['name']);
        $this->assertSame('Updated name', $context['after']['name']);

        $this->app->instance(AuditLogger::class, Mockery::mock(AuditLogger::class, function ($mock): void {
            $mock->shouldReceive('record')->once()->andThrow(new \RuntimeException('audit unavailable'));
        }));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($admin)->post('http://demo.erphpro.com/admin/academic-years', [
                'year' => 2029, 'name' => 'Should roll back',
            ]);
            $this->fail('An audit failure should abort the request.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('audit unavailable', $exception->getMessage());
        }
        $this->assertDatabaseMissing('academic_years', ['school_id' => $school->id, 'year' => 2029]);
    }

    public function test_support_centre_is_available_on_its_own_host(): void
    {
        $this->get('http://support.erphpro.com/')
            ->assertOk()
            ->assertSee('Find a clear answer, fast.')
            ->assertSee('Submit a ticket');
    }

    public function test_ticket_form_discloses_optional_ai_processing_in_three_languages(): void
    {
        Config::set('support.ai_enabled', true);

        $this->get('http://support.erphpro.com/tickets/new')
            ->assertOk()
            ->assertSee('name="ai_processing_consent"', false)
            ->assertSee('lang="en"', false)
            ->assertSee('lang="ms"', false)
            ->assertSee('lang="zh-Hans"', false)
            ->assertSee('aria-describedby="ai-consent-description"', false)
            ->assertSee('human-only handling');
    }

    public function test_ticket_form_hides_ai_consent_when_ai_is_not_enabled(): void
    {
        Config::set('support.ai_enabled', false);

        $this->get('http://support.erphpro.com/tickets/new')
            ->assertOk()
            ->assertDontSee('name="ai_processing_consent"', false)
            ->assertDontSee('DeepSeek');
    }

    public function test_support_ticket_access_stays_in_the_current_session(): void
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
        $this->assertStringNotContainsString('token=', $location);
        $this->assertDatabaseHas('support_tickets', ['requester_email' => 'support-user@example.com', 'status' => 'open']);
        $this->assertDatabaseHas('support_ticket_messages', ['source' => 'requester', 'author_email' => 'support-user@example.com']);

        $this->get($location)
            ->assertOk()
            ->assertSee('Add a reply')
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('Referrer-Policy', 'no-referrer');
    }

    public function test_ticket_bearer_tokens_in_query_are_removed_and_do_not_grant_access(): void
    {
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(),
            'access_token_hash' => hash('sha256', 'legacy-token'),
            'requester_name' => 'Support User',
            'requester_email' => 'support-user@example.com',
            'subject' => 'Cannot open a lesson plan',
            'category' => 'lesson_plans',
            'priority' => 'normal',
            'status' => 'open',
        ]);

        $response = $this->get("http://support.erphpro.com/tickets/{$ticket->public_id}?token=legacy-token");
        $response->assertRedirect("http://support.erphpro.com/tickets/{$ticket->public_id}")
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('Referrer-Policy', 'no-referrer');

        $this->get($response->headers->get('Location'))->assertForbidden();
    }

    public function test_multiple_tickets_remain_available_in_the_same_session(): void
    {
        $payload = [
            'name' => 'Support User', 'email' => 'support-user@example.com', 'subject' => 'A question',
            'category' => 'general', 'message' => 'This is a sufficiently long support question.',
        ];

        $first = $this->post('http://support.erphpro.com/tickets', $payload)->assertRedirect();
        $second = $this->post('http://support.erphpro.com/tickets', array_merge($payload, ['subject' => 'Another question']))->assertRedirect();

        $this->get($first->headers->get('Location'))->assertOk();
        $this->get($second->headers->get('Location'))->assertOk();
    }

    public function test_deepseek_processing_requires_ticket_specific_opt_in(): void
    {
        Config::set('support.ai_enabled', true);
        Config::set('services.deepseek.api_key', 'test-key');
        Http::fake();
        Mail::fake();

        $this->post('http://support.erphpro.com/tickets', [
            'name' => 'Support User', 'email' => 'support-user@example.com', 'subject' => 'General question',
            'category' => 'general', 'message' => 'Please explain how the support process works.',
        ])->assertRedirect();

        $ticket = SupportTicket::query()->where('subject', 'General question')->firstOrFail();
        $this->assertNull($ticket->ai_processing_consent_at);
        $this->assertSame('not_consented', $ticket->ai_state);
        Http::assertNothingSent();
    }

    public function test_consent_is_not_recorded_while_ai_feature_is_disabled(): void
    {
        Config::set('support.ai_enabled', false);
        Http::fake();
        Mail::fake();

        $this->post('http://support.erphpro.com/tickets', [
            'name' => 'Support User', 'email' => 'support-user@example.com', 'subject' => 'General question',
            'category' => 'general', 'message' => 'Please explain how the support process works.',
            'ai_processing_consent' => '1',
        ])->assertRedirect();

        $ticket = SupportTicket::query()->where('subject', 'General question')->firstOrFail();
        $this->assertNull($ticket->ai_processing_consent_at);
        $this->assertNull($ticket->ai_processing_consent_version);
        $this->assertSame('not_consented', $ticket->ai_state);
        Http::assertNothingSent();
    }

    public function test_sensitive_ticket_categories_stay_human_only_even_with_ai_consent(): void
    {
        Config::set('support.ai_enabled', true);
        Config::set('services.deepseek.api_key', 'test-key');
        Http::fake();
        Mail::fake();

        $this->post('http://support.erphpro.com/tickets', [
            'name' => 'Security Reporter', 'email' => 'security@example.com', 'subject' => 'Suspicious access',
            'category' => 'security', 'message' => 'I saw suspicious access in the school workspace.',
            'ai_processing_consent' => '1',
        ])->assertRedirect();

        $ticket = SupportTicket::query()->where('subject', 'Suspicious access')->firstOrFail();
        $this->assertNotNull($ticket->ai_processing_consent_at);
        $this->assertSame(SupportAIService::CONSENT_VERSION, $ticket->ai_processing_consent_version);
        $this->assertSame('human_review', $ticket->ai_state);
        Http::assertNothingSent();
    }

    public function test_deepseek_requires_the_current_consent_disclosure_version(): void
    {
        Config::set('support.ai_enabled', true);
        Config::set('services.deepseek.api_key', 'test-key');
        Http::fake();

        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'token'),
            'requester_name' => 'Support User', 'requester_email' => 'support-user@example.com',
            'subject' => 'General question', 'category' => 'general', 'priority' => 'normal', 'status' => 'open',
            'ai_processing_consent_at' => now(), 'ai_processing_consent_version' => 'retired-consent-v0',
        ]);

        $this->assertSame('not_consented', app(SupportAIService::class)->analyse($ticket)['state']);
        Http::assertNothingSent();
    }

    public function test_deepseek_payload_redacts_common_contact_and_identity_patterns(): void
    {
        Config::set('support.ai_enabled', true);
        Config::set('services.deepseek.api_key', 'test-key');
        Http::fake([
            'api.deepseek.com/chat/completions' => Http::response([
                'choices' => [[
                    'message' => ['content' => json_encode([
                        'category' => 'general', 'priority' => 'normal', 'confidence' => 0.92,
                        'summary' => 'General help request', 'reply_draft' => 'A team member will assist.', 'needs_human' => false,
                    ], JSON_THROW_ON_ERROR)],
                ]],
            ]),
        ]);

        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'token'),
            'requester_name' => 'Support User', 'requester_email' => 'support-user@example.com',
            'subject' => 'Contact teacher@example.com about this issue', 'category' => 'general',
            'priority' => 'normal', 'status' => 'open', 'ai_processing_consent_at' => now(),
            'ai_processing_consent_version' => SupportAIService::CONSENT_VERSION,
        ]);
        $ticket->messages()->create([
            'author_name' => 'Support User', 'author_email' => 'support-user@example.com',
            'source' => 'requester', 'body' => 'Email teacher@example.com or call +6012 345 6789. IC 900101-14-1234. Card 4111 1111 1111 1111.',
        ]);

        $result = app(SupportAIService::class)->analyse($ticket);

        $this->assertSame('draft_ready', $result['state']);
        Http::assertSent(function (ClientRequest $request): bool {
            $payload = json_decode($request['messages'][1]['content'], true, 512, JSON_THROW_ON_ERROR);

            return ! str_contains($payload['subject'], 'teacher@example.com')
                && ! str_contains($payload['message'], 'teacher@example.com')
                && ! str_contains($payload['message'], '+6012 345 6789')
                && ! str_contains($payload['message'], '900101-14-1234')
                && ! str_contains($payload['message'], '4111 1111 1111 1111')
                && str_contains($payload['message'], '[redacted email]')
                && str_contains($payload['message'], '[redacted phone number]')
                && str_contains($payload['message'], '[redacted identity number]')
                && str_contains($payload['message'], '[redacted payment number]');
        });
    }

    public function test_ticket_access_recovery_does_not_render_private_messages_before_verification(): void
    {
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(),
            'access_token_hash' => hash('sha256', 'session-token'),
            'requester_name' => 'Support User',
            'requester_email' => 'support-user@example.com',
            'subject' => 'Private ticket subject',
            'category' => 'general',
            'priority' => 'normal',
            'status' => 'open',
        ]);
        $ticket->messages()->create([
            'author_name' => 'Support User', 'author_email' => 'support-user@example.com',
            'source' => 'requester', 'body' => 'Private message body', 'sent_at' => now(),
        ]);

        $this->get("http://support.erphpro.com/tickets/{$ticket->public_id}")
            ->assertForbidden()
            ->assertSee('Restore access to your ticket')
            ->assertDontSee('Private message body');
    }

    public function test_ticket_owner_can_recover_access_with_a_single_use_email_code(): void
    {
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(),
            'access_token_hash' => hash('sha256', 'expired-session-token'),
            'requester_name' => 'Support User',
            'requester_email' => 'support-user@example.com',
            'subject' => 'Recover access',
            'category' => 'general',
            'priority' => 'normal',
            'status' => 'open',
        ]);
        $this->get("http://support.erphpro.com/tickets/{$ticket->public_id}")->assertForbidden();

        $code = null;
        Mail::shouldReceive('raw')->once()->withArgs(function (string $body) use (&$code): bool {
            preg_match('/code is (\d{6})/', $body, $matches);
            $code = $matches[1] ?? null;

            return $code !== null;
        });

        $this->from("http://support.erphpro.com/tickets/{$ticket->public_id}")
            ->post("http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-code", ['email' => 'support-user@example.com'])
            ->assertRedirect();
        $ticket->refresh();
        $this->assertNotNull($ticket->recovery_code_hash);
        $this->assertSame(0, $ticket->recovery_code_attempts);

        $this->post("http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-verify", ['code' => $code])
            ->assertRedirect("http://support.erphpro.com/tickets/{$ticket->public_id}");
        $this->get("http://support.erphpro.com/tickets/{$ticket->public_id}")->assertOk();

        $this->post("http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-verify", ['code' => $code])
            ->assertSessionHasErrors('code');
    }

    public function test_recovery_code_attempts_require_the_session_that_requested_the_email(): void
    {
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'token'),
            'requester_name' => 'Support User', 'requester_email' => 'support-user@example.com',
            'subject' => 'Recover access', 'category' => 'general', 'priority' => 'normal', 'status' => 'open',
        ]);
        Mail::shouldReceive('raw')->once();

        $this->post("http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-code", ['email' => 'support-user@example.com']);
        $this->flushSession();

        $this->post("http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-verify", ['code' => '000000'])
            ->assertSessionHasErrors('code');
        $this->assertSame(0, $ticket->fresh()->recovery_code_attempts);
    }

    public function test_recovery_code_is_rate_limited_per_ticket_and_invalidated_after_five_failures(): void
    {
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'token'),
            'requester_name' => 'Support User', 'requester_email' => 'support-user@example.com',
            'subject' => 'Recover access', 'category' => 'general', 'priority' => 'normal', 'status' => 'open',
        ]);
        Mail::shouldReceive('raw')->once();

        $send = "http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-code";
        $this->post($send, ['email' => 'support-user@example.com'])->assertSessionHasNoErrors();
        $hash = $ticket->fresh()->recovery_code_hash;
        $this->post($send, ['email' => 'support-user@example.com'])->assertSessionHasNoErrors();
        $this->assertSame($hash, $ticket->fresh()->recovery_code_hash);

        $verify = "http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-verify";
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.'.($attempt + 1)])
                ->post($verify, ['code' => '000000'])
                ->assertSessionHasErrors('code');
        }

        $this->assertNull($ticket->fresh()->recovery_code_hash);
        $this->assertSame(5, $ticket->fresh()->recovery_code_attempts);
    }

    public function test_recovery_attempt_budget_persists_across_code_resends_and_expires_after_lockout_window(): void
    {
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'token'),
            'requester_name' => 'Support User', 'requester_email' => 'support-user@example.com',
            'subject' => 'Recover access', 'category' => 'general', 'priority' => 'normal', 'status' => 'open',
        ]);
        Mail::shouldReceive('raw')->times(3);

        $send = "http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-code";
        $verify = "http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-verify";
        $this->post($send, ['email' => 'support-user@example.com']);
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->post($verify, ['code' => '000000'])->assertSessionHasErrors('code');
        }
        $this->assertSame(3, $ticket->fresh()->recovery_code_attempts);

        $this->travel(61)->seconds();
        $this->post($send, ['email' => 'support-user@example.com']);
        $this->assertSame(3, $ticket->fresh()->recovery_code_attempts);
        for ($attempt = 0; $attempt < 2; $attempt++) {
            $this->post($verify, ['code' => '000000'])->assertSessionHasErrors('code');
        }
        $this->assertSame(5, $ticket->fresh()->recovery_code_attempts);
        $this->assertNull($ticket->fresh()->recovery_code_hash);

        $this->travel(61)->seconds();
        $this->post($send, ['email' => 'support-user@example.com']);
        $this->assertSame(5, $ticket->fresh()->recovery_code_attempts);
        $this->assertNull($ticket->fresh()->recovery_code_hash);

        $this->travel(15)->minutes();
        $this->post($send, ['email' => 'support-user@example.com']);
        $this->assertSame(0, $ticket->fresh()->recovery_code_attempts);
        $this->assertNotNull($ticket->fresh()->recovery_code_hash);
    }

    public function test_ticket_recovery_email_is_limited_to_five_requests_per_hour(): void
    {
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'token'),
            'requester_name' => 'Support User', 'requester_email' => 'support-user@example.com',
            'subject' => 'Recover access', 'category' => 'general', 'priority' => 'normal', 'status' => 'open',
        ]);
        Mail::shouldReceive('raw')->times(5);

        $send = "http://support.erphpro.com/tickets/{$ticket->public_id}/recovery-code";
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->post($send, ['email' => 'support-user@example.com'])->assertSessionHasNoErrors();
            $this->travel(61)->seconds();
        }

        $this->post($send, ['email' => 'support-user@example.com'])->assertSessionHasNoErrors();
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

        $response->assertOk()->assertJsonPath('status', 'ok')->assertJsonPath('database', 'ok')->assertJsonPath('cache', 'ok')->assertJsonPath('runtime_file_sha256', hash_file('sha256', app_path('Http/Controllers/HealthController.php')));
    }

    public function test_owner_login_entrypoint_is_available_on_the_base_domain(): void
    {
        $this->get('/owner/login')->assertOk()->assertSee('Platform owner');
    }

    public function test_platform_owner_routes_are_not_available_on_school_subdomains(): void
    {
        $owner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $ticketId = (string) Str::uuid();

        $this->get('http://demo.erphpro.com/owner/login')->assertNotFound();
        $this->get('http://demo.erphpro.com/owner/auth/google/redirect')->assertNotFound();
        $this->actingAs($owner)->get('http://demo.erphpro.com/owner')->assertNotFound();
        $this->actingAs($owner)->get('http://demo.erphpro.com/owner/audit')->assertNotFound();
        $this->actingAs($owner)->get("http://demo.erphpro.com/owner/support/{$ticketId}")->assertNotFound();
        $this->actingAs($owner)->put("http://demo.erphpro.com/owner/support/{$ticketId}", [
            'status' => 'closed',
        ])->assertNotFound();
        $this->actingAs($owner)->post("http://demo.erphpro.com/owner/support/{$ticketId}/reply", [
            'message' => 'cross-host attempt',
        ])->assertNotFound();
    }

    public function test_school_host_google_callback_cannot_turn_owner_intent_into_platform_access(): void
    {
        Config::set([
            'services.google.client_id' => 'test-client',
            'services.google.client_secret' => 'test-secret',
            'services.google.owner_email' => 'owner@example.com',
        ]);

        $this->withSession(['auth.owner_login' => true])
            ->get('http://demo.erphpro.com/auth/google/callback')
            ->assertForbidden()
            ->assertSeeText('Platform sign-in must use the main domain');
        $this->assertGuest();
    }

    public function test_google_redirect_fails_clearly_when_credentials_are_not_configured(): void
    {
        $this->seed();
        $this->get('http://demo.erphpro.com/auth/google/redirect')
            ->assertStatus(503);
    }

    public function test_google_one_tap_rejects_missing_or_mismatched_double_submit_csrf(): void
    {
        Config::set([
            'services.google.client_id' => 'test-client',
            'services.google.client_secret' => 'test-secret',
        ]);

        $this->post('http://demo.erphpro.com/auth/google/one-tap', ['credential' => ''])
            ->assertForbidden()
            ->assertSeeText('Google sign-in request could not be verified');

        $this->withCookie('g_csrf_token', 'cookie-token')
            ->post('http://demo.erphpro.com/auth/google/one-tap', [
                'credential' => '',
                'g_csrf_token' => 'body-token',
            ])
            ->assertForbidden()
            ->assertSeeText('Google sign-in request could not be verified');
    }

    public function test_google_one_tap_checks_matching_csrf_before_rejecting_an_empty_credential(): void
    {
        Config::set([
            'services.google.client_id' => 'test-client',
            'services.google.client_secret' => 'test-secret',
        ]);

        $this->withCookie('g_csrf_token', 'matching-token')
            ->post('http://demo.erphpro.com/auth/google/one-tap', [
                'credential' => '',
                'g_csrf_token' => 'matching-token',
            ])
            ->assertForbidden()
            ->assertSeeText('Google sign-in failed')
            ->assertDontSeeText('Google sign-in request could not be verified');
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

        $response->assertRedirect(route('owner.dashboard'))
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('Referrer-Policy', 'no-referrer');
        $owner = User::where('email', 'owner@example.com')->firstOrFail();
        $this->assertSame($owner->id, Auth::guard('platform')->id());
        $this->assertNull(Auth::guard('web')->id());
        $this->assertDatabaseHas('users', ['email' => 'owner@example.com', 'platform_role' => 'owner']);
    }

    public function test_oauth_handoff_is_single_use_and_expires_server_side(): void
    {
        $service = app(\App\Services\OAuthHandoffService::class);
        $state = $service->issue('school_login', 'demo');

        $handoff = $service->consume($state);
        $this->assertSame('school_login', $handoff?->intent);
        $this->assertSame('demo', $handoff?->school_subdomain);
        $this->assertNull($service->consume($state));
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

    public function test_school_tenant_scope_blocks_cross_school_lesson_plan_binding_and_versions(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $otherSchool = School::create([
            'name' => 'Other School', 'slug' => 'other-school', 'subdomain' => 'other', 'is_active' => true,
        ]);
        $profile = TeacherProfile::create([
            'school_id' => $otherSchool->id,
            'user_id' => $user->id,
            'staff_no' => 'OTHER-1',
            'employment_status' => 'active',
        ]);
        $plan = LessonPlan::create([
            'school_id' => $otherSchool->id,
            'teacher_profile_id' => $profile->id,
            'lesson_date' => '2026-11-23',
            'subject' => 'Mathematics',
            'class_name' => 'Year 1',
            'status' => 'draft',
            'current_version' => 1,
        ]);
        $version = $plan->versions()->create([
            'version' => 1,
            'created_by' => $user->id,
            'source' => 'manual',
            'content' => ['title' => 'Private other-school plan'],
        ]);
        $demoSchool = School::where('subdomain', 'demo')->firstOrFail();
        $demoProfile = TeacherProfile::withoutGlobalScopes()
            ->where('school_id', $demoSchool->id)
            ->where('user_id', $user->id)
            ->firstOrFail();
        $review = LessonPlanReview::create([
            'school_id' => $demoSchool->id,
            'lesson_plan_id' => $plan->id,
            'reviewer_id' => $user->id,
            'decision' => 'approved',
        ]);
        $submission = LessonPlanSubmission::create([
            'school_id' => $demoSchool->id,
            'lesson_plan_id' => $plan->id,
            'teacher_profile_id' => $demoProfile->id,
            'week_no' => 41,
            'submitted_at' => now(),
            'status' => 'on_time',
        ]);

        $this->actingAs($user)
            ->get("http://demo.erphpro.com/rph/{$plan->id}/edit")
            ->assertNotFound();

        $this->get('http://demo.erphpro.com/login')->assertOk();
        $this->assertFalse(LessonPlanVersion::query()->whereKey($version->id)->exists());
        $this->assertFalse(LessonPlanReview::query()->whereKey($review->id)->exists());
        $this->assertFalse(LessonPlanSubmission::query()->whereKey($submission->id)->exists());
    }

    public function test_school_owned_models_fail_closed_on_non_school_hosts(): void
    {
        $this->seed();
        $this->assertFalse(TeacherProfile::query()->exists(), 'CLI/database work without explicit tenant context must fail closed.');

        $this->get('http://erphpro.com/')->assertOk();
        $this->assertFalse(TeacherProfile::query()->exists());
        $this->assertFalse(LessonPlan::query()->exists());

        $this->get('http://support.erphpro.com/')->assertOk();
        $this->assertFalse(TeacherProfile::query()->exists());
        $this->assertFalse(LessonPlan::query()->exists());
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

    public function test_rph_creation_uses_the_teacher_class_subject_assignment(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $school = School::where('subdomain', 'demo')->firstOrFail();
        $year = AcademicYear::create(['school_id' => $school->id, 'year' => 2028, 'name' => 'RPH year', 'status' => 'active']);
        $class = SchoolClass::create(['school_id' => $school->id, 'academic_year_id' => $year->id, 'code' => '5B', 'name' => '5 Bestari']);
        $profile = TeacherProfile::withoutGlobalScopes()->where('school_id', $school->id)->where('user_id', $admin->id)->firstOrFail();
        $assignment = TeacherClassAssignment::create([
            'school_id' => $school->id, 'academic_year_id' => $year->id, 'school_class_id' => $class->id,
            'teacher_profile_id' => $profile->id, 'subject' => 'Bahasa Melayu', 'role' => 'teacher',
        ]);

        $this->actingAs($admin)->get('http://demo.erphpro.com/rph/create')->assertOk()->assertSee('Choose your assignment');
        $this->actingAs($admin)->post('http://demo.erphpro.com/rph', [
            'lesson_date' => '2028-02-01', 'assignment_id' => $assignment->id, 'title' => 'Assigned RPH',
        ])->assertRedirect(route('rph.create'));
        $this->assertDatabaseHas('lesson_plans', [
            'teacher_profile_id' => $profile->id, 'teacher_class_assignment_id' => $assignment->id,
            'subject' => 'Bahasa Melayu', 'class_name' => '5 Bestari',
        ]);
        $plan = LessonPlan::where('teacher_profile_id', $profile->id)->latest('id')->firstOrFail();
        $this->actingAs($admin)->get('http://demo.erphpro.com/rph/'.$plan->id.'/edit')->assertOk()->assertSee('Class and subject assignment');
        $this->actingAs($admin)->put('http://demo.erphpro.com/rph/'.$plan->id, [
            'lesson_date' => '2028-02-03', 'assignment_id' => $assignment->id, 'subject' => 'Forged subject', 'class_name' => 'Forged class',
            'title' => 'Updated assigned RPH',
        ])->assertRedirect();
        $this->assertDatabaseHas('lesson_plans', [
            'id' => $plan->id, 'teacher_class_assignment_id' => $assignment->id,
            'subject' => 'Bahasa Melayu', 'class_name' => '5 Bestari',
        ]);
        $stoppedAssignment = TeacherClassAssignment::create([
            'school_id' => $school->id, 'academic_year_id' => $year->id, 'school_class_id' => $class->id,
            'teacher_profile_id' => $profile->id, 'subject' => 'Science', 'role' => 'teacher', 'is_active' => false,
        ]);
        $otherSchool = School::create(['name' => 'Other RPH School', 'slug' => 'other-rph-school', 'subdomain' => 'other-rph-school']);
        $otherYear = AcademicYear::create(['school_id' => $otherSchool->id, 'year' => 2028, 'name' => 'Other RPH year', 'status' => 'active']);
        $otherClass = SchoolClass::create(['school_id' => $otherSchool->id, 'academic_year_id' => $otherYear->id, 'code' => 'O1', 'name' => 'Other class']);
        $otherProfile = TeacherProfile::create(['school_id' => $otherSchool->id, 'user_id' => User::factory()->create()->id, 'employment_status' => 'active']);
        $otherAssignment = TeacherClassAssignment::create([
            'school_id' => $otherSchool->id, 'academic_year_id' => $otherYear->id, 'school_class_id' => $otherClass->id,
            'teacher_profile_id' => $otherProfile->id, 'subject' => 'Other subject', 'role' => 'teacher',
        ]);
        try {
            DB::table('lesson_plans')->insert([
                'school_id' => $school->id, 'teacher_profile_id' => $profile->id,
                'teacher_class_assignment_id' => $otherAssignment->id,
                'lesson_date' => '2028-02-03', 'subject' => 'Other subject',
                'class_name' => 'Other class', 'status' => 'draft', 'current_version' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $this->fail('A lesson plan must not reference an assignment from another school.');
        } catch (QueryException) {
            $this->assertTrue(true);
        }
        $versionCount = LessonPlanVersion::where('lesson_plan_id', $plan->id)->count();
        foreach ([$stoppedAssignment->id, $otherAssignment->id, $otherAssignment->id + 99999] as $invalidAssignmentId) {
            $this->actingAs($admin)->post('http://demo.erphpro.com/rph', [
                'lesson_date' => '2028-02-05', 'assignment_id' => $invalidAssignmentId, 'title' => 'Invalid assignment RPH',
            ])->assertStatus(422);
            $this->actingAs($admin)->put('http://demo.erphpro.com/rph/'.$plan->id, [
                'lesson_date' => '2028-02-05', 'assignment_id' => $invalidAssignmentId, 'title' => 'Invalid assignment edit',
            ])->assertStatus(422);
        }
        $this->assertSame($versionCount, LessonPlanVersion::where('lesson_plan_id', $plan->id)->count());
        $this->actingAs($admin)->put('http://demo.erphpro.com/rph/'.$plan->id, [
            'lesson_date' => '2028-02-04', 'subject' => 'Unauthorised', 'class_name' => 'Other class', 'title' => 'Invalid edit',
        ])->assertStatus(422);
        $this->actingAs($admin)->post('http://demo.erphpro.com/rph', [
            'lesson_date' => '2028-02-02', 'subject' => 'Unauthorised', 'class_name' => 'Other class', 'title' => 'Invalid RPH',
        ])->assertStatus(422);
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
        $plan = \App\Models\LessonPlan::firstOrFail();

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
        $user->update(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $this->actingAs($user)->get('/owner')->assertOk()
            ->assertSee('eRPH Pro Demo School')->assertSee('Total schools')->assertSee('Recent audit activity')
            ->assertSee('Schools')->assertSee('Accounts')->assertSee('Team')->assertSee('Runtime')->assertSee('Audit')->assertSee('Sign out');
    }

    public function test_platform_owner_can_view_cross_school_audit_activity(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $user->update(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        \App\Services\AuditLogger::class;
        $this->actingAs($user)->get('/owner/audit')->assertOk()->assertSee('Audit activity');
    }

    public function test_platform_owner_cannot_read_school_ticket_without_explicit_jit_grant(): void
    {
        $this->seed();
        $owner = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $owner->update(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $school = School::firstOrFail();
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'secret'),
            'school_id' => $school->id, 'requester_name' => 'Teacher Private',
            'requester_email' => 'teacher@example.com', 'subject' => 'Sensitive issue',
            'category' => 'general', 'priority' => 'normal', 'status' => 'open',
        ]);

        $this->actingAs($owner)->get(route('owner.support.show', $ticket->public_id))->assertNotFound();
        $this->actingAs($owner)->get(route('owner.support.index'))->assertOk()->assertDontSee('Sensitive issue');
    }

    public function test_school_admin_can_issue_bounded_read_only_support_access_and_owner_read_is_audited(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $owner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $school = School::firstOrFail();
        $school->members()->updateExistingPivot($admin->id, ['role' => 'school_admin']);
        $otherSchool = School::create(['name' => 'Other Test School', 'slug' => 'other-test', 'subdomain' => 'other-test']);
        $ticket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'secret'),
            'school_id' => $school->id, 'requester_name' => 'Teacher Private',
            'requester_email' => 'teacher@example.com', 'subject' => 'Approved support issue',
            'category' => 'general', 'priority' => 'normal', 'status' => 'open',
            'ai_summary' => 'Private internal AI summary', 'ai_reply_draft' => 'Private unsent draft',
        ]);
        \App\Models\SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id, 'author_name' => 'Teacher Private', 'author_email' => 'teacher@example.com',
            'source' => 'requester', 'is_internal' => false, 'body' => 'Public ticket details.',
        ]);
        \App\Models\SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id, 'author_name' => 'School agent', 'source' => 'agent',
            'is_internal' => true, 'body' => 'Private internal note.',
        ]);
        $unapprovedTicket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'other'),
            'school_id' => $school->id, 'requester_name' => 'Other Teacher',
            'requester_email' => 'other@example.com', 'subject' => 'Unapproved confidential subject',
            'category' => 'general', 'priority' => 'high', 'status' => 'open',
        ]);
        $foreignTicket = SupportTicket::create([
            'public_id' => (string) Str::uuid(), 'access_token_hash' => hash('sha256', 'foreign'),
            'school_id' => $otherSchool->id, 'requester_name' => 'Other Teacher',
            'requester_email' => 'other@example.com', 'subject' => 'Foreign school ticket',
            'category' => 'general', 'priority' => 'normal', 'status' => 'open',
        ]);

        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/support-access', [
            'ticket_public_id' => $ticket->public_id, 'owner_id' => $admin->id,
            'purpose' => 'Attempted self authorization request', 'duration_minutes' => 30,
        ])->assertSessionHasErrors('owner_id');
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/support-access', [
            'ticket_public_id' => $foreignTicket->public_id, 'owner_id' => $owner->id,
            'purpose' => 'Attempted foreign ticket request', 'duration_minutes' => 30,
        ])->assertNotFound();
        $this->assertDatabaseMissing('platform_support_access_grants', ['support_ticket_id' => $foreignTicket->id]);
        $this->assertDatabaseHas('audit_logs', [
            'school_id' => $school->id, 'actor_id' => $admin->id, 'action' => 'school_support_access.denied',
            'subject_id' => hash('sha256', $foreignTicket->public_id),
        ]);

        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/support-access', [
            'ticket_public_id' => $ticket->public_id, 'owner_id' => $owner->id,
            'purpose' => 'Investigate ticket reported by our school', 'duration_minutes' => 60,
        ])->assertSessionHasNoErrors();
        $this->actingAs($admin)->get('http://demo.erphpro.com/admin')
            ->assertOk()->assertDontSee($owner->email);

        $this->assertDatabaseHas('audit_logs', [
            'school_id' => $school->id, 'actor_id' => $admin->id,
            'action' => 'school_support_access.granted',
        ]);

        $this->flushSession();
        $this->actingAs($owner)->get('http://erphpro.com/owner/support/'.$ticket->public_id)
            ->assertOk()->assertSee('Approved support issue')->assertSee('Read-only school-approved access')
            ->assertDontSee('teacher@example.com')
            ->assertSee('Public ticket details.')->assertDontSee('Private internal note.')
            ->assertDontSee('Private internal AI summary')->assertDontSee('Private unsent draft')
            ->assertDontSee('Send reply')->assertDontSee('Save controls');
        $this->actingAs($owner)->get('http://erphpro.com/owner/support')
            ->assertOk()->assertSee($ticket->public_id)->assertDontSee($unapprovedTicket->subject);
        $this->assertDatabaseHas('audit_logs', [
            'school_id' => $school->id, 'actor_id' => $owner->id,
            'action' => 'platform_support.ticket_viewed', 'subject_id' => (string) $ticket->id,
        ]);
        $grant = \App\Models\PlatformSupportAccessGrant::query()->firstOrFail();
        $otherAdmin = User::factory()->create();
        $otherSchool->members()->attach($otherAdmin->id, ['role' => 'school_admin', 'status' => 'active', 'joined_at' => now()]);
        $this->flushSession();
        $this->actingAs($otherAdmin)->post("http://other-test.erphpro.com/admin/support-access/{$grant->id}/revoke")
            ->assertNotFound();
        $this->assertNull($grant->fresh()->revoked_at);
        $this->flushSession();
        $this->actingAs($admin)->post("http://demo.erphpro.com/admin/support-access/{$grant->id}/revoke")
            ->assertSessionHasNoErrors();
        $this->assertNotNull($grant->fresh()->revoked_at);
        $this->assertNull($grant->fresh()->grant_slot_key);
        $this->actingAs($owner)->get(route('owner.support.show', $ticket->public_id))->assertNotFound();
        $this->assertDatabaseHas('audit_logs', [
            'school_id' => $school->id, 'actor_id' => $admin->id,
            'action' => 'school_support_access.revoked', 'subject_id' => (string) $grant->id,
        ]);
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/support-access', [
            'ticket_public_id' => $ticket->public_id, 'owner_id' => $owner->id,
            'purpose' => 'Continue investigation of the same school ticket', 'duration_minutes' => 30,
        ])->assertSessionHasNoErrors();
        $this->assertNotNull($grant->fresh()->revoked_at);
        $this->assertNull($grant->fresh()->grant_slot_key);
        $this->assertSame(1, \App\Models\PlatformSupportAccessGrant::query()->whereNotNull('grant_slot_key')->count());
        $this->flushSession();
        $this->actingAs($owner)->put('http://erphpro.com/owner/support/'.$ticket->public_id, [
            'status' => 'closed', 'priority' => 'urgent',
        ])->assertForbidden();
        $this->assertDatabaseHas('audit_logs', [
            'school_id' => $school->id, 'actor_id' => $owner->id, 'action' => 'platform_support.write_denied',
            'subject_id' => hash('sha256', $ticket->public_id),
        ]);
        $this->travel(31)->minutes();
        $this->actingAs($owner)->get('http://erphpro.com/owner/support/'.$ticket->public_id)->assertNotFound();
        $this->actingAs($owner)->post('http://erphpro.com/owner/support/'.$ticket->public_id.'/reply', ['message' => 'reply'])
            ->assertNotFound();
        $expiredGrant = \App\Models\PlatformSupportAccessGrant::query()->whereNotNull('grant_slot_key')->firstOrFail();
        $this->flushSession();
        $this->actingAs($admin)->post('http://demo.erphpro.com/admin/support-access', [
            'ticket_public_id' => $ticket->public_id, 'owner_id' => $owner->id,
            'purpose' => 'Renew expired school support access', 'duration_minutes' => 15,
        ])->assertSessionHasNoErrors();
        $this->assertNotNull($expiredGrant->fresh()->revoked_at);
        $this->assertSame(1, \App\Models\PlatformSupportAccessGrant::query()->whereNotNull('grant_slot_key')->count());
        $this->assertDatabaseHas('audit_logs', [
            'school_id' => $school->id, 'actor_id' => $owner->id, 'action' => 'platform_support.ticket_access_denied',
            'subject_id' => hash('sha256', $ticket->public_id),
        ]);
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
            'user_id' => $user->id, 'subject' => 'backup-subject', 'email' => 'recovery-user@example.com',
            'email_type' => 'personal', 'is_primary' => false, 'verified_at' => now(),
        ]);

        $this->actingAs($user)->delete("http://demo.erphpro.com/account/identities/{$primary->id}")
            ->assertRedirect('https://demo.erphpro.com/account/identities');
        $this->assertDatabaseHas('google_identities', ['id' => $primary->id, 'is_primary' => false]);
        $this->assertDatabaseHas('google_identities', ['id' => $backup->id, 'is_primary' => true, 'unlinked_at' => null]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.google_identity_unlinked', 'actor_id' => $user->id]);
    }

    public function test_platform_owner_records_pending_school_invitation_and_rejects_duplicate(): void
    {
        Notification::fake();
        $owner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $school = \App\Models\School::create([
            'name' => 'Invitation School', 'slug' => 'invitation-school', 'subdomain' => 'invitation-school', 'is_active' => true,
        ]);

        $this->actingAs($owner)->post(route('owner.schools.invite', $school), [
            'name' => 'Invited Admin', 'email' => 'invited-admin@example.com', 'role' => 'school_admin',
        ])->assertRedirect(route('owner.schools.index'));

        $user = User::where('email', 'invited-admin@example.com')->firstOrFail();
        $this->assertDatabaseHas('school_memberships', [
            'school_id' => $school->id, 'user_id' => $user->id, 'role' => 'school_admin', 'status' => 'pending',
        ]);
        $this->actingAs($user)->get('http://invitation-school.erphpro.com/workspace')->assertForbidden();
        $this->assertDatabaseHas('audit_logs', ['action' => 'platform.school_admin_invited', 'actor_id' => $owner->id]);
        Notification::assertSentOnDemand(SchoolInvitationNotification::class, function ($notification, $channels, $notifiable): bool {
            return $notifiable->routes['mail'] === 'invited-admin@example.com' && $notification->via($notifiable) === ['mail'];
        });
        $this->actingAs($owner)->post('http://erphpro.com'.route('owner.schools.invite.resend', [$school, $user], false))
            ->assertRedirect('http://erphpro.com'.route('owner.schools.index', [], false));
        $this->assertDatabaseHas('audit_logs', ['action' => 'platform.school_invitation_resent', 'actor_id' => $owner->id]);

        $revoke = $this->actingAs($owner)->post('http://erphpro.com'.route('owner.schools.invite.revoke', [$school, $user], false));
        $revoke->assertRedirect('http://erphpro.com'.route('owner.schools.index', [], false));
        $this->assertDatabaseHas('school_memberships', [
            'school_id' => $school->id, 'user_id' => $user->id, 'status' => 'revoked',
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'platform.school_invitation_revoked', 'actor_id' => $owner->id]);
        $this->actingAs($user)->get('http://invitation-school.erphpro.com/workspace')->assertForbidden();
        $this->actingAs($owner)->post('http://erphpro.com'.route('owner.schools.invite.resend', [$school, $user], false))
            ->assertNotFound();

        $operator = User::factory()->create(['platform_role' => 'security', 'platform_mfa_confirmed_at' => now()]);
        $this->actingAs($owner)->post('http://erphpro.com'.route('owner.schools.invite', $school, false), [
            'name' => $operator->name, 'email' => $operator->email, 'role' => 'school_admin',
        ])->assertSessionHasErrors('email');
    }

    public function test_platform_owner_can_create_and_suspend_a_school_with_audit_trail(): void
    {
        $owner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);

        $this->actingAs($owner)->post('http://erphpro.com/owner/schools', [
            'name' => 'North Star School',
            'subdomain' => 'north-star',
            'workspace_domain' => 'northstar.edu.my',
        ])->assertRedirect(route('owner.schools.index'));

        $school = \App\Models\School::where('subdomain', 'north-star')->firstOrFail();
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $owner->id,
            'action' => 'platform.school_created',
            'subject_id' => (string) $school->id,
        ]);
        $this->actingAs($owner)->post('http://erphpro.com/owner/schools', [
            'name' => 'North-Star School', 'subdomain' => 'north-star-duplicate',
        ])->assertSessionHasErrors('name');
        $this->assertDatabaseMissing('schools', ['subdomain' => 'north-star-duplicate']);

        $this->actingAs($owner)->post(route('owner.schools.toggle', $school))
            ->assertRedirect(route('owner.schools.index'));
        $this->assertFalse($school->fresh()->is_active);
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $owner->id,
            'action' => 'platform.school_suspended',
            'subject_id' => (string) $school->id,
        ]);

        $this->actingAs($owner)->post('http://erphpro.com'.route('owner.schools.archive', $school, false))
            ->assertRedirect('http://erphpro.com'.route('owner.schools.index', [], false));
        $this->assertNotNull($school->fresh()->archived_at);
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $owner->id,
            'action' => 'platform.school_archived',
            'subject_id' => (string) $school->id,
        ]);
        $teacher = User::factory()->create();
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active', 'joined_at' => now()]);
        $this->flushSession();
        $this->actingAs($teacher)->get('http://north-star.erphpro.com/workspace')->assertNotFound();
        $this->flushSession();
        $this->actingAs($owner)->post('http://erphpro.com'.route('owner.schools.invite', $school, false), [
            'name' => 'Archived Invite', 'email' => 'archived-invite@example.com', 'role' => 'school_admin',
        ])->assertStatus(422);
        $this->flushSession();
        $this->actingAs($owner)->post('http://erphpro.com'.route('owner.schools.toggle', $school, false))
            ->assertStatus(422);
        $this->flushSession();
        $this->actingAs($owner)->post('http://erphpro.com'.route('owner.schools.restore', $school, false))
            ->assertRedirect('http://erphpro.com'.route('owner.schools.index', [], false));
        $this->assertNull($school->fresh()->archived_at);
        $this->assertTrue($school->fresh()->is_active);
        $this->assertDatabaseHas('audit_logs', ['actor_id' => $owner->id, 'action' => 'platform.school_restored']);
        $this->flushSession();
        $this->actingAs($teacher)->get('http://north-star.erphpro.com/workspace')->assertOk();
    }

    public function test_platform_school_lifecycle_rejects_reserved_subdomains_and_rolls_back_audit_failures(): void
    {
        $owner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);

        $this->actingAs($owner)->post('http://erphpro.com/owner/schools', [
            'name' => 'Reserved School', 'subdomain' => 'support',
        ])->assertSessionHasErrors('subdomain');
        $this->assertDatabaseMissing('schools', ['subdomain' => 'support']);

        $this->app->instance(AuditLogger::class, Mockery::mock(AuditLogger::class, function ($mock): void {
            $mock->shouldReceive('record')->once()->andThrow(new \RuntimeException('audit unavailable'));
        }));
        $this->withoutExceptionHandling();
        try {
            $this->actingAs($owner)->post('http://erphpro.com/owner/schools', [
                'name' => 'Rolled Back School', 'subdomain' => 'rolled-back',
            ]);
            $this->fail('The audit failure must roll back school creation.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('audit unavailable', $exception->getMessage());
        } finally {
            $this->app->instance(AuditLogger::class, new AuditLogger());
            $this->withExceptionHandling();
        }
        $this->assertDatabaseMissing('schools', ['subdomain' => 'rolled-back']);
    }

    public function test_non_owner_platform_roles_cannot_mutate_school_lifecycle(): void
    {
        $security = User::factory()->create(['platform_role' => 'security', 'platform_mfa_confirmed_at' => now()]);

        $this->actingAs($security)->get('http://erphpro.com/owner/schools/create')->assertForbidden();
        $this->actingAs($security)->post('http://erphpro.com/owner/schools', [
            'name' => 'Not Allowed School', 'subdomain' => 'not-allowed',
        ])->assertForbidden();
    }

    public function test_platform_owner_can_manage_operator_roles_but_cannot_remove_the_last_owner(): void
    {
        $owner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $operator = User::factory()->create(['platform_role' => null]);

        $this->actingAs($owner)->post(route('owner.team.role', $operator), [
            'platform_role' => 'operations',
        ])->assertRedirect(route('owner.team.index'));
        $this->assertSame('operations', $operator->fresh()->platform_role);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'platform.operator_role_updated',
            'actor_id' => $owner->id,
            'subject_id' => (string) $operator->id,
        ]);

        $operator->forceFill([
            'platform_mfa_secret' => encrypt('test-secret'),
            'platform_mfa_confirmed_at' => now(),
            'platform_mfa_recovery_codes' => encrypt('["digest"]'),
            'platform_mfa_recovery_codes_generated_at' => now(),
        ])->save();
        $this->flushSession();
        $this->actingAs($owner)->post('http://erphpro.com'.route('owner.team.reset-mfa', $operator, false))
            ->assertRedirect('http://erphpro.com'.route('owner.team.index', [], false));
        $this->assertNull($operator->fresh()->platform_mfa_secret);
        $this->assertNull($operator->fresh()->platform_mfa_confirmed_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'platform.operator_mfa_reset', 'actor_id' => $owner->id]);

        $secondOwner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $this->actingAs($owner)->post(route('owner.team.role', $secondOwner), [
            'platform_role' => 'content',
        ])->assertRedirect(route('owner.team.index'));
        $this->assertSame('content', $secondOwner->fresh()->platform_role);

        $this->actingAs($owner)->post(route('owner.team.role', $owner), [
            'platform_role' => 'none',
        ])->assertSessionHasErrors('platform_role');
        $this->assertSame('owner', $owner->fresh()->platform_role);

        $this->actingAs($owner)->get(route('owner.team.index', ['q' => $operator->email]))
            ->assertOk()->assertSee($operator->email);
    }

    public function test_non_owner_platform_roles_cannot_manage_platform_team(): void
    {
        $security = User::factory()->create(['platform_role' => 'security', 'platform_mfa_confirmed_at' => now()]);
        $operator = User::factory()->create(['platform_role' => 'support']);

        $this->actingAs($security)->get(route('owner.team.index'))->assertForbidden();
        $this->actingAs($security)->post(route('owner.team.role', $operator), [
            'platform_role' => 'content',
        ])->assertForbidden();
        $this->actingAs($security)->post('http://erphpro.com'.route('owner.team.reset-mfa', $operator, false))
            ->assertForbidden();
    }

    public function test_platform_permissions_are_explicit_and_default_deny(): void
    {
        $security = User::factory()->create(['platform_role' => 'security', 'platform_mfa_confirmed_at' => now()]);
        $support = User::factory()->create(['platform_role' => 'support', 'platform_mfa_confirmed_at' => now()]);
        $schoolUser = User::factory()->create(['platform_role' => null]);
        $content = User::factory()->create(['platform_role' => 'content', 'platform_mfa_confirmed_at' => now()]);

        $this->actingAs($security)->get('http://erphpro.com/owner')->assertOk()
            ->assertSee('Schools')->assertSee('Runtime')->assertSee('Audit')
            ->assertDontSee('Accounts')->assertDontSee('Team');
        $this->actingAs($security)->get('http://erphpro.com/owner/audit')->assertOk();
        $this->actingAs($security)->get('http://erphpro.com/owner/support')->assertForbidden();
        $this->actingAs($support)->get('http://erphpro.com/owner')->assertOk();
        $this->actingAs($support)->get('http://erphpro.com/owner/audit')->assertForbidden();
        $this->actingAs($schoolUser)->get('http://erphpro.com/owner')->assertForbidden();
        $this->actingAs($content)->get('http://erphpro.com/owner')->assertOk()->assertSee('School directory unavailable for this role.')->assertDontSee('eRPH Pro Demo School');
    }

    public function test_platform_support_writes_require_a_separate_write_permission(): void
    {
        $support = User::factory()->create(['platform_role' => 'support', 'platform_mfa_confirmed_at' => now()]);

        $this->actingAs($support)->put('http://erphpro.com/owner/support/missing-ticket', [
            'status' => 'closed',
        ])->assertForbidden();
    }

    public function test_unenrolled_platform_operator_is_required_to_set_up_totp_mfa(): void
    {
        $operator = User::factory()->create(['platform_role' => 'security']);

        $this->actingAs($operator)->get('http://erphpro.com/owner')
            ->assertRedirect(route('owner.mfa.setup'));
        $this->actingAs($operator)->get(route('owner.mfa.setup'))
            ->assertOk()->assertSee('Manual setup key')->assertSee('Use a recovery code instead');

        $operator->refresh();
        $secret = decrypt($operator->platform_mfa_secret);
        $code = app(\App\Services\PlatformMfaService::class)->codeFor($secret);
        $this->actingAs($operator)->post(route('owner.mfa.confirm'), ['code' => $code])
            ->assertOk()->assertSee('Save your recovery codes');
        $this->assertNotNull($operator->fresh()->platform_mfa_confirmed_at);
        $this->assertNotNull($operator->fresh()->platform_mfa_recovery_codes);
        $this->assertDatabaseHas('audit_logs', ['action' => 'platform.mfa_enabled', 'actor_id' => $operator->id]);
    }

    public function test_platform_mfa_recovery_code_is_single_use_and_audited(): void
    {
        $mfa = app(\App\Services\PlatformMfaService::class);
        $recovery = $mfa->issueRecoveryCodes();
        $operator = User::factory()->create([
            'platform_role' => 'security',
            'platform_mfa_secret' => encrypt($mfa->issueSecret()),
            'platform_mfa_recovery_codes' => $recovery['payload'],
        ]);

        $plainCode = $recovery['codes'][0];
        $this->actingAs($operator)->get(route('owner.mfa.recover'))->assertOk()->assertSee('Recover platform MFA');
        $this->actingAs($operator)->post(route('owner.mfa.recover.submit'), ['code' => $plainCode])
            ->assertRedirect(route('owner.dashboard'));
        $this->assertNotNull($operator->fresh()->platform_mfa_confirmed_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'platform.mfa_recovered', 'actor_id' => $operator->id]);

        $this->actingAs($operator)->post(route('owner.mfa.recover.submit'), ['code' => $plainCode])
            ->assertStatus(422);
    }

    public function test_corrupted_platform_mfa_recovery_payload_fails_closed(): void
    {
        $operator = User::factory()->create([
            'platform_role' => 'security',
            'platform_mfa_recovery_codes' => encrypt('not-json-recovery-payload'),
        ]);

        $this->assertFalse(app(\App\Services\PlatformMfaService::class)->consumeRecoveryCode($operator, 'ABCDE-12345'));
    }

    public function test_platform_logout_only_ends_the_platform_session(): void
    {
        $operator = User::factory()->create([
            'platform_role' => 'security',
            'platform_mfa_confirmed_at' => now(),
        ]);

        $this->actingAs($operator)->get('http://erphpro.com/owner')->assertOk();
        $this->actingAs($operator)->post(route('owner.logout'))->assertRedirect(route('owner.login'));
        $this->assertNull(\Illuminate\Support\Facades\Auth::guard('platform')->id());
        $this->assertNull(\Illuminate\Support\Facades\Auth::guard('web')->id());
    }

    public function test_runtime_page_exposes_only_connected_health_signals_by_permission(): void
    {
        $security = User::factory()->create([
            'platform_role' => 'security',
            'platform_mfa_confirmed_at' => now(),
        ]);
        $support = User::factory()->create([
            'platform_role' => 'support',
            'platform_mfa_confirmed_at' => now(),
        ]);

        $this->actingAs($security)->get(route('owner.runtime'))
            ->assertOk()->assertSee('System runtime')->assertSee('Database connectivity')->assertDontSee('QUEUE_CONNECTION');
        $this->actingAs($support)->get(route('owner.runtime'))->assertForbidden();
    }

    public function test_global_settings_is_owner_only_and_does_not_expose_secret_values(): void
    {
        config([
            'services.google.client_id' => 'client-id-for-test',
            'services.google.client_secret' => 'secret-value-for-test',
            'services.deepseek.api_key' => 'deepseek-secret-for-test',
        ]);
        $owner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $security = User::factory()->create(['platform_role' => 'security', 'platform_mfa_confirmed_at' => now()]);

        $this->actingAs($owner)->get(route('owner.settings'))
            ->assertOk()
            ->assertSee('Global settings')
            ->assertSee('Configured')
            ->assertDontSee('secret-value-for-test')
            ->assertDontSee('deepseek-secret-for-test');
        $this->actingAs($security)->get(route('owner.settings'))->assertForbidden();
    }

    public function test_platform_owner_can_assign_an_unmatched_account_once(): void
    {
        $this->seed();
        $owner = User::factory()->create(['platform_role' => 'owner', 'platform_mfa_confirmed_at' => now()]);
        $user = User::factory()->create(['platform_role' => null]);
        $school = School::firstOrFail();

        $this->actingAs($owner)->get(route('owner.accounts.index'))
            ->assertOk()->assertSee($user->email)->assertSee('Account assignment');
        $this->actingAs($owner)->post(route('owner.accounts.assign', $user), [
            'school_id' => $school->id,
            'role' => 'teacher',
        ])->assertRedirect(route('owner.accounts.index'));

        $this->assertDatabaseHas('school_memberships', [
            'school_id' => $school->id,
            'user_id' => $user->id,
            'role' => 'teacher',
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'platform.account_assigned', 'actor_id' => $owner->id]);

        $this->actingAs($owner)->post(route('owner.accounts.assign', $user), [
            'school_id' => $school->id,
            'role' => 'teacher',
        ])->assertSessionHasErrors('user');
    }

    public function test_platform_mfa_matches_the_rfc6238_sha1_reference_vector(): void
    {
        $service = app(\App\Services\PlatformMfaService::class);

        $this->assertSame('287082', $service->codeFor('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59));
    }

    public function test_confirmed_platform_operator_cannot_reopen_mfa_secret_setup(): void
    {
        $secret = app(\App\Services\PlatformMfaService::class)->issueSecret();
        $operator = User::factory()->create([
            'platform_role' => 'security',
            'platform_mfa_secret' => encrypt($secret),
            'platform_mfa_confirmed_at' => now(),
        ]);

        $this->actingAs($operator)->get(route('owner.mfa.setup'))
            ->assertRedirect(route('owner.dashboard'));

        $this->assertSame($secret, decrypt($operator->fresh()->platform_mfa_secret));
    }

    public function test_confirmed_platform_operator_must_verify_mfa_in_each_new_session(): void
    {
        $mfa = app(\App\Services\PlatformMfaService::class);
        $secret = $mfa->issueSecret();
        $operator = User::factory()->create([
            'platform_role' => 'security',
            'platform_mfa_secret' => encrypt($secret),
            'platform_mfa_confirmed_at' => now(),
        ]);

        $this->actingAs($operator, 'platform')
            ->withSession(['platform.mfa_verified_user_id' => null])
            ->get('http://erphpro.com/owner')
            ->assertRedirect(route('owner.mfa.challenge'));
        $this->actingAs($operator, 'platform')
            ->withSession(['platform.mfa_verified_user_id' => null])
            ->get(route('owner.mfa.challenge'))->assertOk()->assertSee('Verify platform MFA');

        $this->actingAs($operator, 'platform')
            ->withSession(['platform.mfa_verified_user_id' => null])
            ->post(route('owner.mfa.challenge.verify'), ['code' => $mfa->codeFor($secret)])
            ->assertRedirect(route('owner.dashboard'));
    }

    public function test_authenticated_session_cannot_cross_from_platform_host_to_school_host(): void
    {
        $operator = User::factory()->create([
            'platform_role' => 'owner',
            'platform_mfa_confirmed_at' => now(),
        ]);

        $this->actingAs($operator)->get('http://erphpro.com/owner')->assertOk();

        $this->get('http://demo.erphpro.com/workspace')->assertForbidden();
        $this->assertGuest();
    }

    public function test_authenticated_school_session_cannot_cross_to_another_school_host(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();
        School::create([
            'name' => 'Second Test School',
            'slug' => 'second-test-school',
            'subdomain' => 'second-test-school',
        ]);

        $this->actingAs($user)->get('http://demo.erphpro.com/workspace')->assertOk();

        $this->get('http://second-test-school.erphpro.com/workspace')->assertForbidden();
        $this->assertGuest();
    }
}
