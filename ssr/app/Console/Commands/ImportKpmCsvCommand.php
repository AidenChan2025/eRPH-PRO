<?php
declare(strict_types=1);
namespace App\Console\Commands;
use App\Models\CurriculumItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use App\Services\SsrCache;
final class ImportKpmCsvCommand extends Command
{
    protected $signature = 'dskp:import-kpm {--dir= : Directory containing KPM CSV files} {--file= : A single KPM DSKP CSV file} {--type= : Prasekolah|SK|SMK|Tingkatan6|KAFA} {--report= : JSON report destination}';
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
        $counts = ['imported'=>0, 'refreshed'=>0, 'skipped'=>0, 'rejected'=>0]; $report = [];
        foreach ($files as $file) { try { $result = $this->importFile($file, $this->typeFor($file)); } catch (RuntimeException $e) { $this->error($e->getMessage()); return self::FAILURE; } $counts[$result['status']]++; $report[] = $result + ['file'=>basename($file), 'type'=>$this->typeFor($file)]; if ($result['status'] === 'skipped') $this->warn('Skipping non-DSKP CSV '.$file.': '.$result['reason']); if ($result['status'] === 'rejected') $this->error('Rejecting '.$file.': '.$result['reason']); }
        $destination = $this->option('report');
        if ($destination) { $parent = dirname($destination); if (! is_dir($parent)) mkdir($parent, 0775, true); file_put_contents($destination, json_encode(['generated_at'=>now()->toIso8601String(), 'counts'=>$counts, 'files'=>$report], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR).PHP_EOL); }
        $this->info('KPM import: '.json_encode($counts));
        if (($counts['imported'] + $counts['refreshed']) > 0) SsrCache::invalidate('curriculum');
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
    private function importFile(string $file, string $type): array
    {
        $handle = fopen($file, 'rb'); if ($handle === false) throw new RuntimeException("Unable to open CSV: {$file}");
        try { $header = fgetcsv($handle, 0, ',', '"', ''); if (! is_array($header)) return ['status'=>'rejected','reason'=>'missing header']; $header = array_map(fn ($v): string => $this->normalizeHeader((string) $v), $header); if (count($header) !== count(array_unique($header)) || in_array('', $header, true) && $header !== self::DSKP_HEADERS) return ['status'=>'rejected','reason'=>'duplicate or blank canonical header']; if ($header !== self::PRA_HEADERS && $header !== self::DSKP_HEADERS) return ['status'=>'skipped','reason'=>'non-DSKP CSV: required canonical header layout not recognised'];
            $chunk = []; $seen = 0; $rejectedRows = 0; $inserted = 0; $refreshed = 0; while (($row = fgetcsv($handle, 0, ',', '"', '')) !== false) { $seen++; if (count($row) !== count($header)) { $rejectedRows++; continue; } if (($record = $this->record($header, $row, $type)) !== null) $chunk[$record['code']] = $record; else $rejectedRows++; if (count($chunk) >= self::CHUNK_SIZE) { [$i, $u] = $this->persist(array_values($chunk)); $inserted += $i; $refreshed += $u; $chunk = []; } } if ($chunk !== []) { [$i, $u] = $this->persist(array_values($chunk)); $inserted += $i; $refreshed += $u; } if ($seen === 0 || ($rejectedRows > 0 && $rejectedRows === $seen)) return ['status'=>'rejected','reason'=>$seen === 0 ? 'no data rows' : 'all data rows rejected','rows'=>$seen,'rejected_rows'=>$rejectedRows]; return ['status'=>$refreshed > 0 && $inserted === 0 ? 'refreshed' : ($inserted > 0 ? 'imported' : 'skipped'),'reason'=>$rejectedRows ? 'valid rows imported; invalid rows rejected' : ($inserted || $refreshed ? 'valid rows persisted' : 'no changes'),'rows'=>$seen,'rejected_rows'=>$rejectedRows];
        } finally { fclose($handle); }
    }
    private function normalizeHeader(string $value): string
    {
        $value = ltrim($value, "\xEF\xBB\xBF");
        $value = strtoupper(trim($value));
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
        $value = trim(rtrim($value, '.:;'));

        $value = preg_replace('/[\x{00A0}\x{200B}]+/u', ' ', $value) ?? $value;
        return match ($value) {
            'SUBJEK' => 'SUBJEK',
            'TINGKATAN', 'TAHUN', 'YEAR', 'YEAR LEVEL' => 'TAHUN',
            'TSIVIK' => 'TSIVIK:',
            'SOSIOEMOSI' => 'SOSIOEMOSI:',
            'TINDAKAN' => 'TINDAKAN:',
            default => $value,
        };
    }
    private function clean(?string $value): ?string { $value = trim((string) $value); return $value === '' || in_array(strtoupper($value), self::PLACEHOLDERS, true) ? null : $value; }
    private function record(array $header, array|false $row, string $type): ?array
    {
        if (! is_array($row)) return null; $values = array_pad($row, count($header), ''); $map = []; foreach ($header as $i => $key) $map[$key] = trim((string) ($values[$i] ?? '')); $pra = $header === self::PRA_HEADERS;
        $fields = $pra ? ['subject'=>$this->clean($map['BIDANG PEMBELAJARAN'] ?? null), 'title'=>$this->clean($map['BIDANG'] ?? null), 'sk'=>$this->clean($map['KEMAHIRAN'] ?? null), 'sp'=>$this->clean($map['SP'] ?? null), 'objective'=>$this->clean($map['SUBP'] ?? null)] : ['subject'=>$this->clean($map['SUBJEK'] ?? null), 'title'=>$this->clean($map['TAJUK/KEMAHIRAN/NILAITERAS'] ?? null) ?: $this->clean($map['TAJUK2'] ?? null), 'sk'=>$this->clean($map['SK'] ?? null), 'sp'=>$this->clean($map['SP'] ?? null), 'objective'=>$this->clean($map['OB'] ?? null), 'activity'=>$this->clean($map['XTVT'] ?? null)];
        if (array_filter($fields, static fn ($v): bool => $v !== null) === []) return null; $canonical = implode('|', [$type, ...array_map(static fn ($v): string => (string) $v, $fields)]); $year = $this->clean($map['TAHUN'] ?? ($map['TINGKATAN'] ?? null)); $title = $fields['title'] ?: ($fields['sp'] ?: 'Kurikulum KPM');
        return ['school_id'=>null, 'code'=>'KPM-'.$type.'-'.substr(sha1($canonical), 0, 12), 'subject'=>$fields['subject'] ?: 'Umum', 'year_level'=>$year, 'curriculum_version'=>'KPM e-RPH 2026', 'school_type'=>$type, 'grade_level'=>$year, 'sk_code'=>$fields['sk'], 'sp_code'=>$fields['sp'], 'title'=>$title, 'description'=>$fields['objective'], 'content'=>$fields['activity'] ?? null, 'metadata'=>['tema'=>$this->clean($map['TEMA/BIDANG/TERAS'] ?? ($map['BIDANG'] ?? null)), 'tajuk'=>$title, 'objektif'=>$fields['objective'], 'aktiviti'=>$fields['activity'] ?? null, 'sivik'=>$this->clean($map['TSIVIK:'] ?? ($map['TSIVIK'] ?? null)), 'source'=>'KPM e-RPH 2026'], 'is_active'=>true];
    }
    private function persist(array $records): array
    {
        return DB::transaction(function () use ($records): array { $codes = array_column($records, 'code'); $existing = CurriculumItem::withoutGlobalScopes()->whereNull('school_id')->whereIn('code', $codes)->pluck('id', 'code'); $now = now(); $inserts = []; $updates = []; foreach ($records as $record) { $record['updated_at'] = $now; $record['metadata'] = json_encode($record['metadata'], JSON_THROW_ON_ERROR); if ($existing->has($record['code'])) $updates[] = $record; else { $record['created_at'] = $now; $inserts[] = $record; } } if ($inserts !== []) DB::table('curriculum_items')->insert($inserts); foreach ($updates as $record) { $code = $record['code']; unset($record['code'], $record['created_at']); DB::table('curriculum_items')->whereNull('school_id')->where('code', $code)->update($record); } return [count($inserts), count($updates)]; });
    }
}
