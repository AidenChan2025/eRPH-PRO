<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = strtolower($request->getHost());
        $baseDomain = strtolower((string) config('app.school_base_domain', 'erphpro.com'));
        $suffix = '.'.$baseDomain;
        $schoolId = null;

        if (str_ends_with($host, $suffix)) {
            $subdomain = substr($host, 0, -strlen($suffix));
            if ($subdomain !== '' && ! str_contains($subdomain, '.') && $subdomain !== 'support') {
                $schoolId = DB::table('schools')
                    ->where('subdomain', $subdomain)
                    ->where('is_active', true)
                    ->value('id');
            }
        }

        $request->attributes->set('tenant_school_id', $schoolId === null ? null : (int) $schoolId);

        return $next($request);
    }
}
