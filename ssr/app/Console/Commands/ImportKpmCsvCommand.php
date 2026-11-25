<?php
declare(strict_types=1);
namespace App\Console\Commands;
use App\Models\CurriculumItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;
final class ImportKpmCsvCommand extends Command
{
    protected $signature = 'dskp:import-kpm {--dir= : Directory containing KPM CSV files} {--file= : A single KPM DSKP CSV file} {--type= : Prasekolah|SK|SMK|Tingkatan6|KAFA}';
    protected $description = 'Stream and idempotently import official KPM DSKP/DPK CSV files';
    private const CHUNK_SIZE = 500;
    private const PRA_HEADERS = ['BIDANG PEMBELAJARAN', 'BIDANG', 'KEMAHIRAN', 'SP', 'SUBP'];
    private const DSKP_HEADERS = ['SUBJEK', 'TAHUN', 'TEMA/BIDANG/TERAS', 'TEMA2', 'TAJUK/KEMAHIRAN/NILAITERAS', 'TAJUK2', 'SK', 'SP', 'NTERAS', 'TSIVIK:', 'OB', 'PENGETAHUAN', 'SOSIOEMOSI:', 'TINDAKAN:', '', 'XTVT', 'XTVT2'];
    private const PLACEHOLDERS = ['-', 'TIADA', 'SILA TAIP OBJEKTIF SENDIRI', 'SILA TAIP AKTIVITI SENDIRI'];
    public function handle(): int
    {
        if ($this->option('file') && $this->option('dir')) { $this->error('Pass either --file or --dir, not both.'); return self::FAILURE; }
        try { $files = $this->files(); } catch (RuntimeException $e) { $this->error($e->getMessage()); return self::FAILURE; }
        if ($files === []) { $this->error('No KPM DSKP/DPK CSV files found.'); return self::FAILURE; }
        $counts = [];
        foreach ($files as $file) { try { $count = $this->importFile($file, $this->typeFor($file)); } catch (RuntimeException $e) { $this->error($e->getMessage()); return self::FAILURE; } if ($count !== null) { $type = $this->typeFor($file); $counts[$type] = ($counts[$type] ?? 0) + $count; } }
        $this->info('Imported or refreshed '.array_sum($counts).' KPM curriculum rows.');
        foreach ($counts as $type => $count) $this->line(sprintf('%-14s %d', $type, $count));
        return self::SUCCESS;
    }
    private function files(): array
    {
        if ($this->option('file')) { $path = realpath((string) $this->option('file')); if ($path === false || ! is_file($path)) throw new RuntimeException('CSV file does not exist: '.$this->option('file')); return [$path]; }
        $dir = realpath((string) ($this->option('dir') ?: database_path('data'))); if ($dir === false || ! is_dir($dir)) throw new RuntimeException('CSV directory does not exist: '.($this->option('dir') ?: database_path('data')));
        return array_values(array_filter(glob($dir.DIRECTORY_SEPARATOR.'*.csv') ?: [], 'is_file'));
    }
    private function typeFor(string $file): string
    {
        $requested = $this->option('type'); if ($requested && in_array($requested, ['Prasekolah', 'SK', 'SMK', 'Tingkatan6', 'KAFA'], true)) return $requested;
        $name = strtolower(basename($file)); return str_contains($name, 'pra') ? 'Prasekolah' : (str_contains($name, 'ting6') || str_contains($name, 'tingkatan6') ? 'Tingkatan6' : (str_contains($name, 'kafa') ? 'KAFA' : (preg_match('/(^|[^a-z])sm([^a-z]|$)/', $name) ? 'SMK' : 'SK')));
    }
    private function importFile(string $file, string $type): ?int
    {
        $handle = fopen($file, 'rb'); if ($handle === false) throw new RuntimeException("Unable to open CSV: {$file}");
        try { $header = fgetcsv($handle, 0, ',', '"', ''); if (! is_array($header)) throw new RuntimeException("CSV has no header: {$file}"); $header = array_map(static fn ($v): string => strtoupper(trim(ltrim((string) $v, "\xEF\xBB\xBF"))), $header); if ($header !== self::PRA_HEADERS && $header !== self::DSKP_HEADERS) { $this->warn("Skipping non-DSKP CSV: {$file} (header does not match official 5- or 17-column layout)"); return null; }
            $chunk = []; $count = 0; while (($row = fgetcsv($handle, 0, ',', '"', '')) !== false) { if (($record = $this->record($header, $row, $type)) !== null) $chunk[$record['code']] = $record; if (count($chunk) >= self::CHUNK_SIZE) { $this->persist(array_values($chunk)); $count += count($chunk); $chunk = []; } } if ($chunk !== []) { $this->persist(array_values($chunk)); $count += count($chunk); } return $count;
        } finally { fclose($handle); }
    }
    private function clean(?string $value): ?string { $value = trim((string) $value); return $value === '' || in_array(strtoupper($value), self::PLACEHOLDERS, true) ? null : $value; }
    private function record(array $header, array|false $row, string $type): ?array
    {
        if (! is_array($row)) return null; $values = array_pad($row, count($header), ''); $map = []; foreach ($header as $i => $key) $map[$key] = trim((string) ($values[$i] ?? '')); $pra = $header === self::PRA_HEADERS;
        $fields = $pra ? ['subject'=>$this->clean($map['BIDANG PEMBELAJARAN'] ?? null), 'title'=>$this->clean($map['BIDANG'] ?? null), 'sk'=>$this->clean($map['KEMAHIRAN'] ?? null), 'sp'=>$this->clean($map['SP'] ?? null), 'objective'=>$this->clean($map['SUBP'] ?? null)] : ['subject'=>$this->clean($map['SUBJEK'] ?? null), 'title'=>$this->clean($map['TAJUK/KEMAHIRAN/NILAITERAS'] ?? null) ?: $this->clean($map['TAJUK2'] ?? null), 'sk'=>$this->clean($map['SK'] ?? null), 'sp'=>$this->clean($map['SP'] ?? null), 'objective'=>$this->clean($map['OB'] ?? null), 'activity'=>$this->clean($map['XTVT'] ?? null)];
        if (array_filter($fields, static fn ($v): bool => $v !== null) === []) return null; $canonical = implode('|', [$type, ...array_map(static fn ($v): string => (string) $v, $fields)]); $year = $this->clean($map['TAHUN'] ?? ($map['TINGKATAN'] ?? null)); $title = $fields['title'] ?: ($fields['sp'] ?: 'Kurikulum KPM');
        return ['school_id'=>null, 'code'=>'KPM-'.$type.'-'.substr(sha1($canonical), 0, 12), 'subject'=>$fields['subject'] ?: 'Umum', 'year_level'=>$year, 'curriculum_version'=>'KPM e-RPH 2026', 'school_type'=>$type, 'grade_level'=>$year, 'sk_code'=>$fields['sk'], 'sp_code'=>$fields['sp'], 'title'=>$title, 'description'=>$fields['objective'], 'content'=>$fields['activity'] ?? null, 'metadata'=>['tema'=>$this->clean($map['TEMA/BIDANG/TERAS'] ?? ($map['BIDANG'] ?? null)), 'tajuk'=>$title, 'objektif'=>$fields['objective'], 'aktiviti'=>$fields['activity'] ?? null, 'sivik'=>$this->clean($map['TSIVIK:'] ?? ($map['TSIVIK'] ?? null)), 'source'=>'KPM e-RPH 2026'], 'is_active'=>true];
    }
    private function persist(array $records): void
    {
        DB::transaction(function () use ($records): void { $codes = array_column($records, 'code'); $existing = CurriculumItem::withoutGlobalScopes()->whereNull('school_id')->whereIn('code', $codes)->pluck('id', 'code'); $now = now(); $inserts = []; $updates = []; foreach ($records as $record) { $record['updated_at'] = $now; $record['metadata'] = json_encode($record['metadata'], JSON_THROW_ON_ERROR); if ($existing->has($record['code'])) $updates[] = $record; else { $record['created_at'] = $now; $inserts[] = $record; } } if ($inserts !== []) DB::table('curriculum_items')->insert($inserts); foreach ($updates as $record) { $code = $record['code']; unset($record['code'], $record['created_at']); DB::table('curriculum_items')->whereNull('school_id')->where('code', $code)->update($record); } });
    }
}
