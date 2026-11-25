<?php

namespace Tests\Feature;

use App\Models\CurriculumItem;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Sprint1KpmFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_profile_accepts_kpm_fields(): void
    {
        $this->seed();
        $school = \App\Models\School::where('subdomain', 'demo')->firstOrFail();
        $teacher = User::factory()->create();
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        TeacherProfile::create(['school_id' => $school->id, 'user_id' => $teacher->id, 'employment_status' => 'active']);

        $this->actingAs($teacher)->put("http://{$school->subdomain}.erphpro.com/profile", ['delima_id'=>'D-123','opsyen'=>'Bahasa Melayu','guru_kelas'=>1,'jantina'=>'Lelaki','agama'=>'Islam'])->assertRedirect();
        $this->assertDatabaseHas('teacher_profiles', ['user_id'=>$teacher->id, 'delima_id'=>'D-123', 'opsyen'=>'Bahasa Melayu', 'guru_kelas'=>1, 'jantina'=>'Lelaki', 'agama'=>'Islam']);
    }

    public function test_ai_generator_returns_structured_kpm_template(): void
    {
        $this->seed();
        $school = \App\Models\School::where('subdomain', 'demo')->firstOrFail();
        $teacher = User::factory()->create();
        $school->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);
        $item = CurriculumItem::withoutGlobalScopes()->firstOrFail();

        $response = $this->actingAs($teacher)->postJson("http://{$school->subdomain}.erphpro.com/workspace/lesson-plans/ai-generate", ['school_type'=>'SK','grade_level'=>'Tahun 5','subject'=>'Bahasa Melayu','curriculum_item_id'=>$item->id]);
        $response->assertOk()->assertJsonStructure(['data'=>['objektif','kriteria_kejayaan','aktiviti_utama','aktiviti_penutup','bbm','emk','nilai_murni','kbat','pbd','refleksi','metadata']]);
    }
}
