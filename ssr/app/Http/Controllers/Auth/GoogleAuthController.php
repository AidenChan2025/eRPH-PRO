<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\School;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function show(Request $request)
    {
        return view('auth.login', [
            'school' => $request->attributes->get('school'),
        ]);
    }

    public function showOwner()
    {
        return view('auth.owner-login');
    }

    public function redirect(Request $request)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');
        $request->session()->put('auth.school_subdomain', $request->attributes->get('school')?->subdomain);

        return Socialite::driver('google')->scopes(['openid', 'email', 'profile'])->redirect();
    }

    public function redirectOwner(Request $request)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');
        $request->session()->put('auth.school_subdomain', null);

        return Socialite::driver('google')->scopes(['openid', 'email', 'profile'])->redirect();
    }

    public function callback(Request $request, AuditLogger $auditLogger)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');

        $googleUser = Socialite::driver('google')->user();
        $email = strtolower((string) $googleUser->getEmail());
        $workspaceDomain = strtolower(trim((string) config('services.google.workspace_domain')));

        if ($workspaceDomain !== '' && ! str_ends_with($email, '@'.$workspaceDomain)) {
            return response()->view('auth.error', [
                'title' => 'Workspace account required',
                'message' => 'Please use the Google Workspace account issued by your school.',
            ], 403);
        }

        $school = $request->attributes->get('school') ?: $this->schoolFromHost($request);
        if (! $school && $request->session()->has('auth.school_subdomain')) {
            $school = School::query()
                ->where('subdomain', $request->session()->pull('auth.school_subdomain'))
                ->where('is_active', true)
                ->first();
        }
        $user = User::where('google_subject', $googleUser->getId())->first();

        if (! $user) {
            $user = User::where('email', $email)->first();
        }

        if (! $user) {
            $user = User::create([
                'name' => $googleUser->getName() ?: $email,
                'email' => $email,
                'google_subject' => $googleUser->getId(),
                'email_verified_at' => now(),
            ]);
        } else {
            $user->forceFill([
                'name' => $googleUser->getName() ?: $user->name,
                'google_subject' => $googleUser->getId(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
        }

        if (! $school && $user->platform_role !== 'owner') {
            return response()->view('auth.error', [
                'title' => 'School workspace required',
                'message' => 'Please start from your school workspace URL, or use an approved platform owner account.',
            ], 403);
        }

        $membership = $school?->members()->whereKey($user->getKey())->first();
        if (! $membership) {
            if (! $school && $user->platform_role === 'owner') {
                Auth::login($user, remember: true);
                $request->session()->regenerate();
                $auditLogger->record('auth.google_owner_login', null, User::class, (string) $user->getKey(), ['email' => $email]);

                return redirect()->route('owner.dashboard');
            }

            return response()->view('auth.not-member', compact('school', 'email'), 403);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();
        $auditLogger->record('auth.google_login', $school, User::class, (string) $user->getKey(), ['email' => $email]);

        return redirect()->route('workspace.dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('school.home');
    }

    private function schoolFromHost(Request $request): ?School
    {
        $host = strtolower($request->getHost());
        $base = strtolower((string) config('app.school_base_domain', 'erphpro.com'));
        $suffix = '.'.$base;
        $subdomain = str_ends_with($host, $suffix) ? substr($host, 0, -strlen($suffix)) : null;

        if (! $subdomain || str_contains($subdomain, '.')) {
            return null;
        }

        return School::query()->where('subdomain', $subdomain)->where('is_active', true)->first();
    }
}
