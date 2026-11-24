<?php

namespace App\Console\Commands;
use App\Models\CurriculumItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ImportBpkDskpCommand extends Command
{
    protected $signature = 'dskp:import {--file= : JSON dataset path, relative to the Laravel base path or absolute}';
    protected $description = 'Import the official Malaysian MOE BPK DSKP catalog';
    public function handle(): int
    {
        $file = $this->option('file') ?: database_path('data/bpk_dskp_official.json');
        $file = str_starts_with($file, DIRECTORY_SEPARATOR) ? $file : base_path($file);
        if (! is_file($file)) { $this->error('Dataset not found: '.$file); return self::FAILURE; }
        try { $records = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR); }
        catch (\JsonException $exception) { $this->error('Invalid JSON dataset: '.$exception->getMessage()); return self::FAILURE; }
        if (! is_array($records)) { $this->error('Dataset must contain a JSON array.'); return self::FAILURE; }
        $rules = ['code'=>['required','string','max:255'],'curriculum_version'=>['required','string','max:255'],'school_type'=>['required','in:Prasekolah,SK,SJKC,SJKT,SMK'],'grade_level'=>['required','string','max:255'],'year_level'=>['required','string','max:255'],'subject'=>['required','string','max:255'],'sk_code'=>['required','string','max:255'],'sp_code'=>['required','string','max:255'],'title'=>['required','string'],'description'=>['required','string'],'content'=>['required','string'],'metadata'=>['required','array'],'metadata.source'=>['required','in:BPK KPM'],'metadata.source_url'=>['required','url']];
        $counts = []; $codes = [];
        foreach ($records as $index => $record) {
            $validator = Validator::make(is_array($record) ? $record : [], $rules);
            if ($validator->fails()) { throw ValidationException::withMessages(["record {$index}" => $validator->errors()->all()]); }
            if (isset($codes[$record['code']])) { $this->error('Duplicate code in dataset: '.$record['code']); return self::FAILURE; }
            $codes[$record['code']] = true;
            CurriculumItem::withoutGlobalScopes()->updateOrCreate(['school_id'=>null,'code'=>$record['code']], $record + ['school_id'=>null,'is_active'=>true]);
            $counts[$record['school_type']] = ($counts[$record['school_type']] ?? 0) + 1;
        }
        $this->info('Imported '.count($records).' BPK DSKP records.');
        foreach ($counts as $type => $count) { $this->line(sprintf('%-12s %d', $type, $count)); }
        return self::SUCCESS;
    }
}
