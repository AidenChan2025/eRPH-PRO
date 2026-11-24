<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePlatformMfa
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('services.platform_mfa.required', false)) {
            return $next($request);
        }

        $user = $request->user();
        if ($user?->platform_mfa_confirmed_at === null) {
            return redirect()->route('owner.mfa.setup');
        }

        if ((int) $request->session()->get('platform.mfa_verified_user_id') !== (int) $user->id) {
            return redirect()->route('owner.mfa.challenge');
        }

        return $next($request);
    }
}
