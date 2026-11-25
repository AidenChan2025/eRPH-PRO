<?php

namespace Tests\Feature;

use App\Models\CurriculumItem;
use App\Services\KpmDictionaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KpmCsvImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_pra_csv_is_streamed_and_is_idempotent(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'kpm-pra-');
        file_put_contents($path, "BIDANG PEMBELAJARAN,BIDANG,KEMAHIRAN,SP,SUBP\nAKTIVITI FIZIKAL,Pergerakan,,,\n" );
        $this->artisan('dskp:import-kpm', ['--file' => $path, '--type' => 'Prasekolah'])->assertSuccessful();
        $this->artisan('dskp:import-kpm', ['--file' => $path, '--type' => 'Prasekolah'])->assertSuccessful();
        $this->assertDatabaseCount('curriculum_items', 1);
        $this->assertDatabaseHas('curriculum_items', ['school_id' => null, 'school_type' => 'Prasekolah', 'code' => 'KPM-Prasekolah-'.substr(sha1('Prasekolah|AKTIVITI FIZIKAL|Pergerakan|||'), 0, 12)]);
        unlink($path);
    }

    public function test_dskp_csv_maps_metadata_and_dictionary_service_loads(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'kpm-sr-');
        file_put_contents($path, "SUBJEK,TAHUN,TEMA/BIDANG/TERAS,tema2,TAJUK/KEMAHIRAN/NILAITERAS,tajuk2,SK,SP,NTERAS,TSIVIK:,OB,Pengetahuan,Sosioemosi:,Tindakan:,,XTVT,XTVT2\nBahasa Melayu,1,Bahasa,,,Tajuk,1.1,1.1.1,,,Objektif,,,,,Aktiviti,\n");
        $this->artisan('dskp:import-kpm', ['--file' => $path, '--type' => 'SK'])->assertSuccessful();
        $item = CurriculumItem::withoutGlobalScopes()->firstOrFail();
        $this->assertSame('KPM e-RPH 2026', $item->metadata['source']);
        $this->assertContains('Kreatif', app(KpmDictionaryService::class)->get('kbkk'));
        unlink($path);
    }

    public function test_bom_and_placeholders_are_normalized(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'kpm-bom-');
        file_put_contents($path, "\xEF\xBB\xBFBIDANG PEMBELAJARAN,BIDANG,KEMAHIRAN,SP,SUBP\nFizik,Topik,-,SILA TAIP OBJEKTIF SENDIRI,SILA TAIP AKTIVITI SENDIRI\n");
        $this->artisan('dskp:import-kpm', ['--file' => $path])->assertSuccessful();
        $item = CurriculumItem::withoutGlobalScopes()->firstOrFail();
        $this->assertNull($item->sk_code);
        $this->assertNull($item->sp_code);
        $this->assertNull($item->description);
        unlink($path);
    }

    public function test_non_dskp_csv_is_skipped_with_warning(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'AHAD-');
        file_put_contents($path, "AHAD,DATA\nfoo,bar\n");
        $this->artisan('dskp:import-kpm', ['--file' => $path])->expectsOutputToContain('Skipping non-DSKP CSV')->assertSuccessful();
        $this->assertDatabaseCount('curriculum_items', 0);
        unlink($path);
    }

    public function test_file_and_dir_cannot_be_used_together(): void
    {
        $this->artisan('dskp:import-kpm', ['--file' => __FILE__, '--dir' => dirname(__FILE__)])->expectsOutputToContain('either --file or --dir')->assertFailed();
    }

    public function test_dictionary_lookup_trims_and_lowercases_key(): void
    {
        $this->assertContains('Kreatif', app(KpmDictionaryService::class)->get('  KBKK '));
    }
}
