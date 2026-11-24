<?php

namespace Database\Seeders;
use App\Models\CurriculumItem;
use Illuminate\Database\Seeder;

class BpkDskpSeeder extends Seeder
{
    public function run(): void
    {
        $records = json_decode(file_get_contents(database_path('data/bpk_dskp_official.json')), true, 512, JSON_THROW_ON_ERROR);
        foreach ($records as $record) {
            CurriculumItem::withoutGlobalScopes()->updateOrCreate(['school_id' => null, 'code' => $record['code']], $record + ['school_id' => null, 'is_active' => true]);
        }
    }
}
