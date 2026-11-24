<?php

namespace Tests\Feature;

use App\Models\LessonPlan;
use App\Models\LessonPlanSubmission;
use App\Models\SupportArticle;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase5To7FullSiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_locale_switching_persists_supported_locales_and_rejects_invalid_values(): void
    {
        foreach (['en', 'ms', 'zh'] as $locale) {
            $this->from('http://support.erphpro.com/')->post('http://support.erphpro.com/locale', ['locale' => $locale])
                ->assertRedirect()->assertSessionHas('app.locale', $locale);
            $this->get('http://support.erphpro.com/')->assertSessionHas('app.locale', $locale);
        }
        $this->from('http://support.erphpro.com/')->post('http://support.erphpro.com/locale', ['locale' => 'fr'])
            ->assertSessionHasErrors('locale');
    }

    public function test_admin_csv_export_is_school_scoped_neutralized_and_not_cached_while_teacher_is_forbidden(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $school = \App\Models\School::where('subdomain', 'demo')->firstOrFail();
        $profile = TeacherProfile::withoutGlobalScopes()->where('school_id', $school->id)->where('user_id', $admin->id)->firstOrFail();
        $plan = LessonPlan::withoutGlobalScopes()->create(['school_id' => $school->id, 'teacher_profile_id' => $profile->id, 'lesson_date' => '2028-01-10', 'subject' => '=Injected', 'class_name' => '5A', 'status' => 'draft', 'current_version' => 1]);
        LessonPlanSubmission::withoutGlobalScopes()->create(['school_id' => $school->id, 'lesson_plan_id' => $plan->id, 'teacher_profile_id' => $profile->id, 'week_no' => 1, 'submitted_at' => '2028-01-10 09:00:00', 'status' => 'on_time']);
        $response = $this->actingAs($admin)->get('http://demo.erphpro.com/reports/export?from=2028-01-01&to=2028-01-31');
        $response->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->assertStringContainsString("'=Injected", $response->streamedContent());
        $plan->update(['subject' => ' =cmd']);
        $this->assertStringContainsString("' =cmd", $this->actingAs($admin)->get('http://demo.erphpro.com/reports/export?from=2028-01-01&to=2028-01-31')->streamedContent());
        $teacher = User::factory()->create();
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        $this->actingAs($teacher)->get('http://demo.erphpro.com/reports/export')->assertForbidden();
    }

    public function test_support_search_returns_only_published_matching_articles(): void
    {
        $this->seed();
        SupportArticle::create(['title' => 'Unique support phrase', 'slug' => 'unique-support-phrase', 'excerpt' => 'Useful answer', 'body' => 'Body', 'is_published' => true, 'sort_order' => 1]);
        SupportArticle::create(['title' => 'Private unique support phrase', 'slug' => 'private-unique-support-phrase', 'excerpt' => 'Hidden', 'body' => 'Hidden', 'is_published' => false, 'sort_order' => 1]);
        $this->get('http://support.erphpro.com/solutions?q=Unique%20support%20phrase')->assertOk()->assertSee('Unique support phrase')->assertDontSee('Private unique support phrase');
    }

    public function test_teacher_telegram_opt_in_and_opt_out_persist_without_cross_teacher_fields(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();
        $this->actingAs($admin)->put('http://demo.erphpro.com/profile', ['telegram_chat_id' => '12345', 'telegram_opt_in' => '1'])->assertRedirect();
        $profile = TeacherProfile::withoutGlobalScopes()->where('user_id', $admin->id)->firstOrFail();
        $this->assertSame('12345', $profile->telegram_chat_id);
        $this->assertTrue($profile->telegram_opt_in);
        $this->actingAs($admin)->put('http://demo.erphpro.com/profile', ['telegram_chat_id' => 'not-a-chat-id'])
            ->assertSessionHasErrors('telegram_chat_id');
        $this->actingAs($admin)->put('http://demo.erphpro.com/profile', ['telegram_chat_id' => '12345'])->assertRedirect();
        $profile->refresh();
        $this->assertTrue($profile->telegram_opt_in);
        $this->actingAs($admin)->put('http://demo.erphpro.com/profile', ['telegram_chat_id' => '', 'telegram_opt_in' => '0'])->assertRedirect();
        $profile->refresh();
        $this->assertFalse($profile->telegram_opt_in);
        $this->assertNull($profile->telegram_chat_id);
    }
}
