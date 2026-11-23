<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class BindAuthenticatedSessionToHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $platformAuthenticated = Auth::guard('platform')->check();
        if (Auth::check() || $platformAuthenticated) {
            $host = strtolower($request->getHost());
            $boundHost = $request->session()->get('auth.host_binding');

            if (is_string($boundHost) && ! hash_equals($boundHost, $host)) {
                Auth::logout();
                Auth::guard('platform')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                abort(403, 'This authenticated session is bound to another host.');
            }

            if (! is_string($boundHost)) {
                $request->session()->put('auth.host_binding', $host);
            }
        }

        return $next($request);
    }
}
