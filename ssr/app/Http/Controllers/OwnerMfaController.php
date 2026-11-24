<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use App\Services\PlatformMfaService;
use Endroid\QrCode\Builder\Builder;
use Illuminate\Http\Request;

class OwnerMfaController extends Controller
{
    public function setup(Request $request, PlatformMfaService $mfa)
    {
        $user = $request->user();
        if ($user->platform_mfa_confirmed_at !== null) {
            return redirect()->route('owner.dashboard');
        }

        if (! $user->platform_mfa_secret) {
            $user->forceFill(['platform_mfa_secret' => encrypt($mfa->issueSecret())])->save();
        }

        $secret = decrypt($user->fresh()->platform_mfa_secret);
        $provisioningUri = $mfa->provisioningUri($secret, (string) $user->email);

        return view('owner.mfa.setup', [
            'secret' => $secret,
            'qrDataUri' => (new Builder(
                data: $provisioningUri,
                size: 220,
                margin: 0,
            ))
                ->build()
                ->getDataUri(),
        ]);
    }

    public function challenge(Request $request)
    {
        if ($request->user()->platform_mfa_confirmed_at === null) {
            return redirect()->route('owner.mfa.setup');
        }

        return view('owner.mfa.challenge');
    }

    public function confirm(Request $request, PlatformMfaService $mfa, AuditLogger $auditLogger)
    {
        $data = $request->validate(['code' => ['required', 'digits:6']]);
        abort_unless($mfa->verify($request->user(), $data['code']), 422, 'The authenticator code is invalid or expired.');

        $recovery = $mfa->issueRecoveryCodes();
        $request->user()->forceFill([
            'platform_mfa_confirmed_at' => now(),
            'platform_mfa_recovery_codes' => $recovery['payload'],
            'platform_mfa_recovery_codes_generated_at' => now(),
        ])->save();
        $request->session()->put('platform.mfa_verified_user_id', $request->user()->id);
        $auditLogger->record('platform.mfa_enabled', null, User::class, (string) $request->user()->id);

        return view('owner.mfa.recovery', ['codes' => $recovery['codes']]);
    }

    public function recover(Request $request, PlatformMfaService $mfa, AuditLogger $auditLogger)
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:32']]);
        $user = $request->user();
        abort_unless($mfa->consumeRecoveryCode($user, $data['code']), 422, 'The recovery code is invalid or has already been used.');

        $user->forceFill(['platform_mfa_confirmed_at' => now()])->save();
        $request->session()->put('platform.mfa_verified_user_id', $user->id);
        $request->session()->regenerate();
        $auditLogger->record('platform.mfa_recovered', null, User::class, (string) $user->id);

        return redirect()->route('owner.dashboard')->with('status', 'Platform MFA recovered.');
    }

    public function verifyChallenge(Request $request, PlatformMfaService $mfa)
    {
        $data = $request->validate(['code' => ['required', 'digits:6']]);
        abort_unless($mfa->verify($request->user(), $data['code']), 422, 'The authenticator code is invalid or expired.');

        $request->session()->put('platform.mfa_verified_user_id', $request->user()->id);
        $request->session()->regenerate();

        return redirect()->route('owner.dashboard');
    }
}
