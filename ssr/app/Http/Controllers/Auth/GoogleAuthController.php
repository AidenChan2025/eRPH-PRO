<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\School;
use App\Services\AuditLogger;
use App\Services\OAuthHandoffService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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

    public function redirect(Request $request, OAuthHandoffService $handoffs)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');
        $state = $handoffs->issue('school_login', $request->attributes->get('school')?->subdomain);

        return Socialite::driver('google')->with(['state' => $state])->scopes(['openid', 'email', 'profile'])->redirect();
    }

    public function redirectOwner(Request $request, OAuthHandoffService $handoffs)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');
        $state = $handoffs->issue('owner_login');

        return Socialite::driver('google')->with(['state' => $state])->scopes(['openid', 'email', 'profile'])->redirect();
    }

    public function identities(Request $request)
    {
        return view('auth.identities', ['school' => $request->attributes->get('school'), 'identities' => $request->user()->googleIdentities()->latest()->get()]);
    }

    public function unlinkIdentity(Request $request, GoogleIdentity $identity, AuditLogger $auditLogger)
    {
        abort_unless($identity->user_id === $request->user()->id && is_null($identity->unlinked_at), 404);
        $active = $request->user()->googleIdentities()->get();
        if ($active->count() < 2) {
            return back()->withErrors(['identity' => 'You must keep at least one verified Google account linked.']);
        }

        $wasPrimary = $identity->is_primary;
        $identity->forceFill(['unlinked_at' => now(), 'is_primary' => false])->save();
        if ($wasPrimary) {
            $active->where('id', '!=', $identity->id)->first()?->forceFill(['is_primary' => true])->save();
        }
        $auditLogger->record('auth.google_identity_unlinked', $request->attributes->get('school'), User::class, (string) $request->user()->id, ['email' => $identity->email]);

        $school = $request->attributes->get('school');
        $url = $school ? 'https://'.$school->subdomain.'.'.config('app.school_base_domain', 'erphpro.com').'/account/identities' : route('account.identities');

        return redirect()->to($url)->with('status', 'Google account unlinked.');
    }

    public function redirectLink(Request $request, OAuthHandoffService $handoffs)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');
        abort_unless($request->user() && $request->attributes->get('school'), 403);
        $state = $handoffs->issue('link_identity', $request->attributes->get('school')->subdomain, $request->user()->getKey());

        return Socialite::driver('google')->with(['state' => $state])->scopes(['openid', 'email', 'profile'])->redirect();
    }

    public function callback(Request $request, AuditLogger $auditLogger, OAuthHandoffService $handoffs)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');

        $handoff = $handoffs->consume($request->query('state'));
        if (! $handoff && ! app()->environment('testing')) {
            return response()->view('auth.error', ['title' => 'Google sign-in request expired', 'message' => 'Please return to the sign-in page and try again.'], 403);
        }

        $platformHost = strtolower((string) config('app.school_base_domain', 'erphpro.com'));
        $requestHost = strtolower($request->getHost());
        $testHost = app()->environment('testing') && in_array($requestHost, ['localhost', '127.0.0.1'], true);
        $ownerIntent = $handoff?->intent === 'owner_login' || $request->session()->get('auth.owner_login') === true;
        if ($ownerIntent
            && $requestHost !== $platformHost
            && ! $testHost) {
            $request->session()->forget('auth.owner_login');

            return response()->view('auth.error', [
                'title' => 'Platform sign-in must use the main domain',
                'message' => 'Please start platform owner sign-in from the main eRPH Pro domain.',
            ], 403);
        }

        try {
            $driver = Socialite::driver('google');
            $googleUser = $handoff ? $driver->stateless()->user() : $driver->user();
        } catch (\Throwable $exception) {
            report($exception);

            return response()->view('auth.error', ['title' => 'Google sign-in failed', 'message' => 'Google could not complete the sign-in response. Please return to the sign-in page and try again.'], 502);
        }

        $email = strtolower((string) $googleUser->getEmail());
        $workspaceDomain = strtolower(trim((string) config('services.google.workspace_domain')));
        $isOwnerLogin = $handoff?->intent === 'owner_login' || $request->session()->pull('auth.owner_login') === true;
        $ownerEmail = strtolower(trim((string) config('services.google.owner_email')));
        $existingPlatformUser = User::query()->where('email', $email)->whereNotNull('platform_role')->first();

        if ($isOwnerLogin && $ownerEmail === '') {
            return response()->view('auth.error', ['title' => 'Owner sign-in is not configured', 'message' => 'The platform owner email must be configured before owner access can be granted.'], 503);
        }

        if ($isOwnerLogin && ! hash_equals($ownerEmail, $email) && ! $existingPlatformUser) {
            return response()->view('auth.error', ['title' => 'Owner account required', 'message' => 'Please use the authorised platform owner Google account.'], 403);
        }

        $linkedIdentity = GoogleIdentity::query()->where('subject', $googleUser->getId())->whereNull('unlinked_at')->first();

        $linkUser = $handoff?->intent === 'link_identity' && $handoff->user_id
            ? User::find($handoff->user_id)
            : $request->user();
        if (($handoff?->intent === 'link_identity' || $request->session()->pull('auth.link_identity') === true) && $linkUser) {
            if ($linkedIdentity && $linkedIdentity->user_id !== $linkUser->id) {
                return response()->view('auth.error', ['title' => 'Google account already linked', 'message' => 'This Google account belongs to another eRPH Pro user. Ask the platform owner for help.'], 409);
            }
            $school = $request->attributes->get('school') ?: $this->schoolFromHost($request);
            $schoolSubdomain = $handoff?->school_subdomain ?: $school?->subdomain;
            if (! $schoolSubdomain) {
                return response()->view('auth.error', ['title' => 'School workspace required', 'message' => 'Please start linking from your school workspace.'], 403);
            }
            $result = $handoffs->issueResult('link_identity_result', $schoolSubdomain, $linkUser->id, [
                'subject' => (string) $googleUser->getId(),
                'email' => $email,
                'email_type' => $workspaceDomain !== '' && str_ends_with($email, '@'.$workspaceDomain) ? 'workspace' : 'personal',
            ]);

            return redirect()->to($this->schoolUrl($schoolSubdomain, '/auth/google/complete?handoff='.urlencode($result)));
        }

        if ($workspaceDomain !== '' && ! str_ends_with($email, '@'.$workspaceDomain) && ! $linkedIdentity) {
            return response()->view('auth.error', [
                'title' => 'Workspace account required',
                'message' => 'Please use the Google Workspace account issued by your school.',
            ], 403);
        }

        $school = $request->attributes->get('school') ?: $this->schoolFromHost($request);
        $handoffSchool = $handoff?->school_subdomain;
        if (! $school && ($handoffSchool || $request->session()->has('auth.school_subdomain'))) {
            $school = School::query()
                ->where('subdomain', $handoffSchool ?: $request->session()->pull('auth.school_subdomain'))
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
                'platform_role' => $isOwnerLogin ? 'owner' : null,
                'email_verified_at' => now(),
                'password' => Str::random(64),
            ]);
        } else {
            $user->forceFill([
                'name' => $googleUser->getName() ?: $user->name,
                'google_subject' => $googleUser->getId(),
                'email_verified_at' => $user->email_verified_at ?: now(),
                'platform_role' => $isOwnerLogin ? 'owner' : $user->platform_role,
            ])->save();
        }

        if (! $school && $user->platform_role === null) {
            return response()->view('auth.error', [
                'title' => 'School workspace required',
                'message' => 'Please start from your school workspace URL, or use an approved platform owner account.',
            ], 403);
        }

        if (! $school) {
            if (! $school && $user->platform_role !== null) {
                Auth::guard('platform')->login($user, remember: true);
                $request->session()->regenerate();
                $auditLogger->record('auth.google_owner_login', null, User::class, (string) $user->getKey(), ['email' => $email]);

                return redirect()->route('owner.dashboard');
            }

            return response()->view('auth.not-member', compact('school', 'email'), 403);
        }

        if (! $this->activateMembership($school, $user, $email, $auditLogger)) {
            return response()->view('auth.not-member', compact('school', 'email'), 403);
        }

        $result = $handoffs->issueResult('school_login_result', $school->subdomain, $user->getKey());

        return redirect()->to($this->schoolUrl($school->subdomain, '/auth/google/complete?handoff='.urlencode($result)));
    }

    public function complete(Request $request, AuditLogger $auditLogger, OAuthHandoffService $handoffs)
    {
        $handoff = $handoffs->consume($request->query('handoff'));
        $school = $request->attributes->get('school') ?: $this->schoolFromHost($request);

        if (! $handoff || ! $school || $handoff->school_subdomain !== $school->subdomain) {
            return response()->view('auth.error', ['title' => 'Google sign-in handoff expired', 'message' => 'Please return to your school sign-in page and try again.'], 403);
        }

        $user = User::find($handoff->user_id);
        $membership = $user ? $school->members()->whereKey($user->getKey())->wherePivot('status', 'active')->first() : null;
        if (! $user || ! $membership) {
            return response()->view('auth.not-member', ['school' => $school, 'email' => $user?->email ?? ''], 403);
        }

        if ($handoff->intent === 'link_identity_result') {
            if (! Auth::guard('web')->check() || Auth::guard('web')->id() !== $user->getKey()) {
                return response()->view('auth.error', ['title' => 'Original school session required', 'message' => 'Return to the same signed-in school browser to complete Google account linking.'], 403);
            }

            $payload = json_decode((string) $handoff->payload, true);
            if (! is_array($payload) || empty($payload['subject']) || empty($payload['email'])) {
                return response()->view('auth.error', ['title' => 'Google link handoff invalid', 'message' => 'Please restart Google account linking.'], 403);
            }
            $existing = GoogleIdentity::query()->where('subject', $payload['subject'])->whereNull('unlinked_at')->first();
            if ($existing && $existing->user_id !== $user->getKey()) {
                return response()->view('auth.error', ['title' => 'Google account already linked', 'message' => 'This Google account belongs to another eRPH Pro user.'], 409);
            }
            GoogleIdentity::updateOrCreate(['subject' => $payload['subject']], [
                'user_id' => $user->getKey(), 'email' => $payload['email'], 'email_type' => $payload['email_type'] ?? 'personal',
                'is_primary' => false, 'verified_at' => now(), 'unlinked_at' => null,
            ]);
            $auditLogger->record('auth.google_identity_linked', $school, User::class, (string) $user->getKey(), ['email' => $payload['email']]);

            return redirect()->route('account.identities')->with('status', 'Google account linked.');
        }

        Auth::guard('web')->login($user, remember: true);
        $request->session()->regenerate();
        $auditLogger->record('auth.google_login', $school, User::class, (string) $user->getKey(), ['email' => $user->email]);

        return redirect()->route('workspace.dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('school.home');
    }

    public function logoutPlatform(Request $request)
    {
        Auth::guard('platform')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('owner.login');
    }

    public function oneTap(Request $request, AuditLogger $auditLogger)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');

        $csrfCookie = $request->cookie('g_csrf_token');
        $csrfBody = $request->input('g_csrf_token');
        if (! is_string($csrfCookie) || $csrfCookie === '' || ! is_string($csrfBody) || ! hash_equals($csrfCookie, $csrfBody)) {
            return response()->view('auth.error', ['title' => 'Google sign-in request could not be verified', 'message' => 'Please return to the sign-in page and try again.'], 403);
        }

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
            $user = User::create(['name' => $claims['name'] ?? $email, 'email' => $email, 'google_subject' => $claims['sub'], 'email_verified_at' => now(), 'password' => Str::random(64)]);
        }
        GoogleIdentity::updateOrCreate(['subject' => $claims['sub']], ['user_id' => $user->id, 'email' => $email, 'email_type' => $workspaceDomain !== '' && str_ends_with($email, '@'.$workspaceDomain) ? 'workspace' : 'personal', 'is_primary' => true, 'verified_at' => now(), 'unlinked_at' => null]);

        if (! $school || ! $this->activateMembership($school, $user, $email, $auditLogger)) {
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

    private function schoolUrl(string $subdomain, string $path): string
    {
        return 'https://'.$subdomain.'.'.config('app.school_base_domain', 'erphpro.com').$path;
    }

    private function activateMembership(School $school, User $user, string $email, AuditLogger $auditLogger): bool
    {
        return DB::transaction(function () use ($school, $user, $email, $auditLogger): bool {
            $membership = DB::table('school_memberships')
                ->where('school_id', $school->getKey())
                ->where('user_id', $user->getKey())
                ->lockForUpdate()
                ->first();

            if (! $membership || ! in_array($membership->status, ['active', 'pending'], true)) {
                return false;
            }

            if ($membership->status === 'pending') {
                DB::table('school_memberships')
                    ->where('school_id', $school->getKey())
                    ->where('user_id', $user->getKey())
                    ->update(['status' => 'active', 'joined_at' => now(), 'left_at' => null]);

                $auditLogger->record('auth.school_invitation_accepted', $school, User::class, (string) $user->getKey(), [
                    'email' => $email,
                    'role' => $membership->role,
                ]);
            }

            return true;
        });
    }
}
