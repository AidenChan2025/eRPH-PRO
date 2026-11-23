<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePlatformOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(in_array($request->user()?->platform_role, array_keys(config('permissions.platform_roles', [])), true), 403);

        return $next($request);
    }
}
