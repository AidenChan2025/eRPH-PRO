<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireSchoolMembership
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $school = $request->attributes->get('school');
        $user = $request->user();

        if (!$school || !$user) {
            abort(401);
        }

        $membership = $school->members()->whereKey($user->getKey())->wherePivot('status', 'active')->first();

        if (!$membership || ($roles && !in_array($membership->pivot->role, $roles, true))) {
            abort(403);
        }

        $request->attributes->set('membership', $membership->pivot);

        return $next($request);
    }
}
