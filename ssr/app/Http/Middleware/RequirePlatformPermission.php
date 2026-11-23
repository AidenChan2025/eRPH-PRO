<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePlatformPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $role = $request->user()?->platform_role;
        $permissions = config("permissions.platform_roles.{$role}", []);

        abort_unless(in_array($permission, $permissions, true), 403);

        return $next($request);
    }
}
