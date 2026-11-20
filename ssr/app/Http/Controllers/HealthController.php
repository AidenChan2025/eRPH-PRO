<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
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
            return response()->json(['status' => 'degraded', 'database' => 'failed', 'release' => config('app.release_version')], 503);
        }

        return response()->json([
            'status' => 'ok',
            'database' => $database,
            'release' => config('app.release_version'),
            'app' => config('app.name'),
        ]);
    }
}
