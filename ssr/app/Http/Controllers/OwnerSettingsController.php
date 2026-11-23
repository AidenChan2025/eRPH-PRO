<?php

namespace App\Http\Controllers;

class OwnerSettingsController extends Controller
{
    public function __invoke()
    {
        return view('owner.settings', [
            'settings' => [
                'Google OAuth' => filled(config('services.google.client_id')) && filled(config('services.google.client_secret')),
                'Mail transport' => filled(config('mail.mailers.'.config('mail.default').'.transport')),
                'DeepSeek integration' => filled(config('services.deepseek.api_key')),
                'Queue connection' => (string) config('queue.default'),
                'Session driver' => (string) config('session.driver'),
                'Session cookie domain' => config('session.domain') ?: 'host-only',
            ],
        ]);
    }
}
