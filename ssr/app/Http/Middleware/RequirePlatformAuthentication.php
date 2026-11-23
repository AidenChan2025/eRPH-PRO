<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RequirePlatformAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        Auth::shouldUse('platform');

        if (Auth::guard('platform')->check()) {
            return $next($request);
        }

        if (Auth::guard('web')->check()) {
            abort(403);
        }

        return redirect()->route('owner.login');
    }
}
