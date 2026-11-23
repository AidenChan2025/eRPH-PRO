<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

class HealthController extends Controller
{
    private function releaseVersion(): string
    {
        $marker = base_path('.deploy-release-sha');

        if (is_file($marker)) {
            $release = trim((string) file_get_contents($marker));

            if (preg_match('/\A[0-9a-f]{40}\z/', $release) === 1) {
                return $release;
            }
        }

        return (string) config('app.release_version');
    }

    private function runtimeFileSha256(): string
    {
        return hash_file('sha256', __FILE__) ?: 'unavailable';
    }

    public function __invoke()
    {
        $runtimeFileSha256 = $this->runtimeFileSha256();

        try {
            DB::connection()->getPdo();
            $database = 'ok';
        } catch (\Throwable $exception) {
            report($exception);
            return response()->json(['status' => 'degraded', 'database' => 'failed', 'cache' => 'unknown', 'release' => $this->releaseVersion(), 'runtime_file_sha256' => $runtimeFileSha256], 503);
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
                'release' => $this->releaseVersion(),
                'runtime_file_sha256' => $runtimeFileSha256,
            ], 503);
        }

        return response()->json([
            'status' => 'ok',
            'database' => $database,
            'cache' => $cache,
            'release' => $this->releaseVersion(),
            'runtime_file_sha256' => $runtimeFileSha256,
            'app' => config('app.name'),
        ]);
    }
}
