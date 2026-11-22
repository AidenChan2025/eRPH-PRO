<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePlatformHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $platformHost = strtolower((string) config('app.school_base_domain', 'erphpro.com'));

        $requestHost = strtolower($request->getHost());
        $testHost = app()->environment('testing') && in_array($requestHost, ['localhost', '127.0.0.1'], true);

        abort_unless($requestHost === $platformHost || $testHost, 404);

        return $next($request);
    }
}
