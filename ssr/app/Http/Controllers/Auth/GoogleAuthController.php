<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\School;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Google\Client as GoogleClient;
use App\Models\GoogleIdentity;

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

    public function identities(Request $request)
    {
        return view('auth.identities', ['school' => $request->attributes->get('school'), 'identities' => $request->user()->googleIdentities()->latest()->get()]);
    }

    public function redirectLink(Request $request)
    {
        abort_unless($request->user() && $request->attributes->get('school'), 403);
        $request->session()->put('auth.link_identity', true);
        $request->session()->put('auth.school_subdomain', $request->attributes->get('school')->subdomain);

        return Socialite::driver('google')->scopes(['openid', 'email', 'profile'])->redirect();
    }

    public function callback(Request $request, AuditLogger $auditLogger)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');

        $googleUser = Socialite::driver('google')->user();
        $email = strtolower((string) $googleUser->getEmail());
        $workspaceDomain = strtolower(trim((string) config('services.google.workspace_domain')));
        $linkedIdentity = GoogleIdentity::query()->where('subject', $googleUser->getId())->whereNull('unlinked_at')->first();

        if ($request->session()->pull('auth.link_identity') === true && Auth::check()) {
            if ($linkedIdentity && $linkedIdentity->user_id !== $request->user()->id) {
                return response()->view('auth.error', ['title' => 'Google account already linked', 'message' => 'This Google account belongs to another eRPH Pro user. Ask the platform owner for help.'], 409);
            }
            GoogleIdentity::updateOrCreate(['subject' => $googleUser->getId()], ['user_id' => $request->user()->id, 'email' => $email, 'email_type' => $workspaceDomain !== '' && str_ends_with($email, '@'.$workspaceDomain) ? 'workspace' : 'personal', 'is_primary' => false, 'verified_at' => now(), 'unlinked_at' => null]);
            $auditLogger->record('auth.google_identity_linked', $request->attributes->get('school'), User::class, (string) $request->user()->id, ['email' => $email]);
            $school = $request->attributes->get('school') ?: $this->schoolFromHost($request);
            $url = $school ? 'https://'.$school->subdomain.'.'.config('app.school_base_domain', 'erphpro.com').'/account/identities' : route('account.identities');
            return redirect()->to($url)->with('status', 'Google account linked.');
        }

        if ($workspaceDomain !== '' && ! str_ends_with($email, '@'.$workspaceDomain) && ! $linkedIdentity) {
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
        $user = $linkedIdentity?->user ?: User::where('google_subject', $googleUser->getId())->first();

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

    public function oneTap(Request $request, AuditLogger $auditLogger)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');

        $client = new GoogleClient(['client_id' => config('services.google.client_id')]);
        $credential = (string) $request->input('credential');
        $claims = $credential !== '' ? $client->verifyIdToken($credential) : false;
        if (! is_array($claims) || empty($claims['sub']) || empty($claims['email']) || ($claims['email_verified'] ?? false) !== true) {
            return response()->view('auth.error', ['title' => 'Google sign-in failed', 'message' => 'The Google sign-in response could not be verified. Please use the sign-in button instead.'], 403);
        }

        $email = strtolower((string) $claims['email']);
        $workspaceDomain = strtolower(trim((string) config('services.google.workspace_domain')));
        if ($workspaceDomain !== '' && ! str_ends_with($email, '@'.$workspaceDomain)) {
            return response()->view('auth.error', ['title' => 'Workspace account required', 'message' => 'Please use the Google Workspace account issued by your school.'], 403);
        }

        $school = $this->schoolFromHost($request);
        if (! $school && $request->session()->has('auth.school_subdomain')) {
            $school = School::query()->where('subdomain', $request->session()->pull('auth.school_subdomain'))->where('is_active', true)->first();
        }

        $identity = GoogleIdentity::query()->where('subject', $claims['sub'])->whereNull('unlinked_at')->first();
        $user = $identity?->user ?: User::where('google_subject', $claims['sub'])->first() ?: User::where('email', $email)->first();
        if (! $user) {
            $user = User::create(['name' => $claims['name'] ?? $email, 'email' => $email, 'google_subject' => $claims['sub'], 'email_verified_at' => now()]);
        }
        GoogleIdentity::updateOrCreate(['subject' => $claims['sub']], ['user_id' => $user->id, 'email' => $email, 'email_type' => $workspaceDomain !== '' && str_ends_with($email, '@'.$workspaceDomain) ? 'workspace' : 'personal', 'is_primary' => true, 'verified_at' => now(), 'unlinked_at' => null]);

        if (! $school || ! $school->members()->whereKey($user->id)->exists()) {
            return response()->view('auth.not-member', ['school' => $school, 'email' => $email], 403);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();
        $auditLogger->record('auth.google_one_tap_login', $school, User::class, (string) $user->id, ['email' => $email]);

        return redirect()->route('workspace.dashboard');
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
