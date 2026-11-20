<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $membership = $request->attributes->get('membership');
        $role = $membership?->role;
        $permissions = config("permissions.roles.{$role}", []);

        abort_unless(in_array($permission, $permissions, true), 403);

        return $next($request);
    }
}
