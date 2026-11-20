<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
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

    public function redirect()
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret'), 503, 'Google Workspace login is not configured yet.');

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

        $school = $request->attributes->get('school');
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

        $membership = $school?->members()->whereKey($user->getKey())->first();
        if (! $membership) {
            return response()->view('auth.not-member', compact('school', 'email'), 403);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();
        $auditLogger->record('auth.google_login', $school, User::class, (string) $user->getKey(), ['email' => $email]);

        return redirect()->route('workspace.dashboard');
    }
}
