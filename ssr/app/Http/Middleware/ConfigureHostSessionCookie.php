<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConfigureHostSessionCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = strtolower($request->getHost());
        $platformHost = strtolower((string) config('app.school_base_domain', 'erphpro.com'));
        $supportHost = strtolower((string) config('support.host', 'support.erphpro.com'));
        $schoolSuffix = '.'.$platformHost;

        $cookie = match (true) {
            $host === $supportHost => config('session.support_cookie', 'erph-support-session'),
            str_ends_with($host, $schoolSuffix) && $host !== $platformHost => config('session.school_cookie', 'erph-school-session'),
            default => config('session.platform_cookie', 'erph-platform-session'),
        };

        config([
            'session.cookie' => $cookie,
            'session.domain' => null,
            'session.path' => '/',
        ]);

        return $next($request);
    }
}
