<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

final class SsrCache
{
    public const TTL_SECONDS = 30;

    public static function remember(string $key, \Closure $callback, int $ttl = self::TTL_SECONDS): mixed
    {
        return Cache::remember($key, now()->addSeconds($ttl), $callback);
    }

    public static function version(string $scope): int
    {
        return (int) Cache::get("ssr:version:{$scope}", 1);
    }

    public static function invalidate(string $scope): void
    {
        $key = "ssr:version:{$scope}";
        if (! Cache::add($key, 1, now()->addYears(10))) {
            Cache::increment($key);
        }
    }
}
