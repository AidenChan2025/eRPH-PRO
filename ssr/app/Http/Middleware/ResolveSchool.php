<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\SsrCache;

class ResolveSchool
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = strtolower($request->getHost());
        $base = strtolower((string) config('app.school_base_domain', 'erphpro.com'));
        $suffix = '.' . $base;
        $subdomain = str_ends_with($host, $suffix) ? substr($host, 0, -strlen($suffix)) : null;

        if ($host === $base && $request->is('/')) {
            return $next($request);
        }

        if (!$subdomain || str_contains($subdomain, '.')) {
            return response()->view('school-not-found', [], 404);
        }

        $tenantId = $request->attributes->get('tenant_school_id');
        $school = is_int($tenantId)
            ? SsrCache::remember('ssr:school:'.SsrCache::version('school-hosts').':'.$tenantId, static fn () => School::query()->whereKey($tenantId)->where('is_active', true)->first())
            : null;

        if (!$school) {
            return response()->view('school-not-found', [], 404);
        }

        app()->instance(School::class, $school);
        $request->attributes->set('school', $school);

        return $next($request);
    }
}
