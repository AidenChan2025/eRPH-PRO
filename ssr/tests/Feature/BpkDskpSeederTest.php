<?php

namespace Tests\Feature;
use App\Models\CurriculumItem;
use App\Models\School;
use App\Models\User;
use Database\Seeders\BpkDskpSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BpkDskpSeederTest extends TestCase
{
    use RefreshDatabase;
    public function test_seeder_and_command_populate_all_five_school_types(): void
    {
        $this->seed(BpkDskpSeeder::class);
        $types = CurriculumItem::withoutGlobalScopes()->distinct()->pluck('school_type')->sort()->values()->all();
        $this->assertSame(['Prasekolah','SJKC','SJKT','SK','SMK'], $types);
        $this->artisan('dskp:import')->assertSuccessful()->expectsOutputToContain('Imported');
        $this->assertSame(278, CurriculumItem::withoutGlobalScopes()->count());
    }
    public function test_repeated_seed_and_import_are_strictly_idempotent(): void
    {
        $this->seed(BpkDskpSeeder::class); $count = CurriculumItem::withoutGlobalScopes()->count();
        $this->seed(BpkDskpSeeder::class); $this->artisan('dskp:import')->assertSuccessful();
        $this->assertSame($count, CurriculumItem::withoutGlobalScopes()->count()); $this->assertSame(278, $count);
    }
    public function test_dskp_catalog_filters_imported_bpk_records(): void
    {
        $this->seed(BpkDskpSeeder::class);
        $school = School::create(['name'=>'BPK Catalog School','slug'=>'bpk-catalog','subdomain'=>'bpk-catalog']);
        $teacher = User::factory()->create(); $school->members()->attach($teacher->id, ['role'=>'teacher','status'=>'active']);
        $this->actingAs($teacher)->get('http://bpk-catalog.erphpro.com/dskp?school_type=SMK&grade_level=Tingkatan+4&subject=Fizik')->assertOk()->assertSee('Fizik');
    }
}
