<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class OwnerRuntimeController extends Controller
{
    public function __invoke()
    {
        $database = 'failed';
        try {
            DB::connection()->getPdo();
            $database = 'ok';
        } catch (\Throwable) {
            // Keep the runtime page useful during a database incident without exposing details.
        }

        $cache = 'failed';
        try {
            $key = 'owner-runtime-check:'.bin2hex(random_bytes(8));
            Cache::put($key, 'ok', 10);
            $cache = Cache::get($key) === 'ok' ? 'ok' : 'failed';
        } catch (\Throwable) {
            // Keep the runtime page useful during a cache incident without exposing details.
        }

        return view('owner.runtime', [
            'database' => $database,
            'cache' => $cache,
            'release' => (string) config('app.release_version'),
            'runtimeHash' => hash_file('sha256', app_path('Http/Controllers/HealthController.php')) ?: 'unavailable',
        ]);
    }
}
