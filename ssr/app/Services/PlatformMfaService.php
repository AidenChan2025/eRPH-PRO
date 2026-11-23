<?php

namespace App\Services;

use App\Models\User;
class PlatformMfaService
{
    public function issueSecret(): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';
        foreach (str_split(random_bytes(20)) as $byte) {
            $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        }

        $secret = '';
        foreach (str_split($bits, 5) as $chunk) {
            $secret .= $alphabet[bindec(str_pad($chunk, 5, '0'))];
        }

        return $secret;
    }

    public function codeFor(string $secret, ?int $timestamp = null): string
    {
        $timestamp ??= time();
        $counter = intdiv($timestamp, 30);
        $binaryCounter = pack('N*', 0).pack('N*', $counter);
        $key = $this->base32Decode($secret);
        $hash = hash_hmac('sha1', $binaryCounter, $key, true);
        $offset = ord($hash[19]) & 0x0f;
        $value = ((ord($hash[$offset]) & 0x7f) << 24)
            | ((ord($hash[$offset + 1]) & 0xff) << 16)
            | ((ord($hash[$offset + 2]) & 0xff) << 8)
            | (ord($hash[$offset + 3]) & 0xff);

        return str_pad((string) ($value % 1_000_000), 6, '0', STR_PAD_LEFT);
    }

    public function verify(User $user, string $code, ?int $timestamp = null): bool
    {
        if (! $user->platform_mfa_secret || ! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $secret = decrypt($user->platform_mfa_secret);
        $timestamp ??= time();
        foreach ([-30, 0, 30] as $drift) {
            if (hash_equals($this->codeFor($secret, $timestamp + $drift), $code)) {
                return true;
            }
        }

        return false;
    }

    public function issueRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        $hashes = [];
        for ($index = 0; $index < $count; $index++) {
            $code = strtoupper(bin2hex(random_bytes(5)));
            $codes[] = substr($code, 0, 5).'-'.substr($code, 5);
            $hashes[] = $this->recoveryDigest($code);
        }

        return ['codes' => $codes, 'payload' => encrypt(json_encode($hashes, JSON_THROW_ON_ERROR))];
    }

    public function consumeRecoveryCode(User $user, string $code): bool
    {
        if (! $user->platform_mfa_recovery_codes) {
            return false;
        }

        $normalized = strtoupper(preg_replace('/[^A-Z0-9]/', '', $code) ?? '');
        if ($normalized === '') {
            return false;
        }

        try {
            $hashes = json_decode(decrypt($user->platform_mfa_recovery_codes), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return false;
        }

        if (! is_array($hashes)) {
            return false;
        }
        foreach ($hashes as $index => $hash) {
            if (! is_string($hash) || ! hash_equals($hash, $this->recoveryDigest($normalized))) {
                continue;
            }

            unset($hashes[$index]);
            $user->forceFill([
                'platform_mfa_recovery_codes' => encrypt(json_encode(array_values($hashes), JSON_THROW_ON_ERROR)),
            ])->save();

            return true;
        }

        return false;
    }

    private function recoveryDigest(string $code): string
    {
        return hash_hmac('sha256', strtoupper($code), (string) config('app.key'));
    }

    private function base32Decode(string $value): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $value = strtoupper($value);
        $bits = '';
        foreach (str_split($value) as $character) {
            $position = strpos($alphabet, $character);
            if ($position === false) {
                continue;
            }
            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }

        $decoded = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $decoded .= chr(bindec($byte));
            }
        }

        return $decoded;
    }
}
