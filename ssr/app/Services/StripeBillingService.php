<?php

namespace App\Services;

class StripeBillingService
{
    public function isConfigured(): bool
    {
        return filled(config('services.stripe.key'))
            && filled(config('services.stripe.secret'));
    }

    public function isWebhookConfigured(): bool
    {
        return filled(config('services.stripe.webhook_secret'));
    }

    /**
     * Verify Stripe-Signature header using HMAC-SHA256 and timestamp replay protection.
     */
    public function verifyWebhookSignature(string $payload, string $signatureHeader, ?int $now = null, int $toleranceSeconds = 300): bool
    {
        $secret = (string) config('services.stripe.webhook_secret', '');
        if ($secret === '' || $signatureHeader === '') {
            return false;
        }

        $timestamp = null;
        $signatures = [];
        foreach (explode(',', $signatureHeader) as $part) {
            $kv = explode('=', trim($part), 2);
            if (count($kv) !== 2) {
                continue;
            }
            if ($kv[0] === 't' && ctype_digit($kv[1]) && (int) $kv[1] > 0) {
                $timestamp = (int) $kv[1];
            } elseif ($kv[0] === 'v1' && $kv[1] !== '' && count($signatures) < 10) {
                $signatures[] = $kv[1];
            }
        }

        if ($timestamp === null || $signatures === []) {
            return false;
        }

        $currentTime = $now ?? time();
        if (abs($currentTime - $timestamp) > $toleranceSeconds) {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);
        foreach ($signatures as $candidate) {
            if (hash_equals($expected, $candidate)) {
                return true;
            }
        }

        return false;
    }
}
