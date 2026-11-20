<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

class HealthController extends Controller
{
    public function __invoke()
    {
        try {
            DB::connection()->getPdo();
            $database = 'ok';
        } catch (\Throwable $exception) {
            report($exception);
            return response()->json(['status' => 'degraded', 'database' => 'failed', 'cache' => 'unknown', 'release' => config('app.release_version')], 503);
        }

        try {
            $key = 'healthcheck:'.bin2hex(random_bytes(8));
            Cache::put($key, 'ok', 10);
            $cache = Cache::get($key) === 'ok' ? 'ok' : 'failed';
        } catch (\Throwable $exception) {
            report($exception);
            $cache = 'failed';
        }

        if ($cache !== 'ok') {
            return response()->json([
                'status' => 'degraded',
                'database' => $database,
                'cache' => $cache,
                'release' => config('app.release_version'),
            ], 503);
        }

        return response()->json([
            'status' => 'ok',
            'database' => $database,
            'cache' => $cache,
            'release' => config('app.release_version'),
            'app' => config('app.name'),
        ]);
    }
}
