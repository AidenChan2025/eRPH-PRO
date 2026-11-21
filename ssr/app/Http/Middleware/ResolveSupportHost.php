<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveSupportHost
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(strtolower($request->getHost()) === strtolower((string) config('support.host')), 404);

        return $next($request);
    }
}
