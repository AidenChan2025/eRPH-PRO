<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use JsonException;

final class KpmDictionaryService
{
    private ?array $validated = null;
    /** @return array<string, list<string>> */
    public function all(): array
    {
        if ($this->validated !== null) return $this->validated;
        $path = database_path('data/kpm_rph_dictionaries.json');
        if (! File::exists($path)) {
            return $this->validated = [];
        }
        try { $data = json_decode((string) File::get($path), true, 512, JSON_THROW_ON_ERROR); }
        catch (JsonException $e) { Log::warning('Malformed KPM dictionary JSON.', ['path' => $path, 'error' => $e->getMessage()]); return $this->validated = []; }
        if (! is_array($data)) { Log::warning('KPM dictionary JSON must contain an object.', ['path' => $path]); return $this->validated = []; }
        $this->validated = [];
        foreach ($data as $key => $values) if (is_string($key) && is_array($values) && array_is_list($values)) $this->validated[strtolower(trim($key))] = array_values(array_filter($values, 'is_string'));
        return $this->validated;
    }

    /** @return list<string> */
    public function get(string $name): array
    {
        $values = $this->all()[strtolower(trim($name))] ?? [];
        return is_array($values) ? array_values(array_filter($values, 'is_string')) : [];
    }
}
