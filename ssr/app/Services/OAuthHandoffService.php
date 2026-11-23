<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OAuthHandoffService
{
    public function issue(string $intent, ?string $schoolSubdomain = null, ?int $userId = null): string
    {
        $state = Str::random(96);

        DB::table('oauth_handoffs')->insert([
            'token_hash' => hash('sha256', $state),
            'intent' => $intent,
            'school_subdomain' => $schoolSubdomain,
            'user_id' => $userId,
            'payload' => null,
            'expires_at' => now()->addMinutes(10),
            'consumed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $state;
    }

    public function issueResult(string $intent, string $schoolSubdomain, int $userId, array $payload = []): string
    {
        $state = Str::random(96);

        DB::table('oauth_handoffs')->insert([
            'token_hash' => hash('sha256', $state),
            'intent' => $intent,
            'school_subdomain' => $schoolSubdomain,
            'user_id' => $userId,
            'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
            'expires_at' => now()->addMinutes(5),
            'consumed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $state;
    }

    public function consume(?string $state): ?object
    {
        if (! is_string($state) || $state === '') {
            return null;
        }

        return DB::transaction(function () use ($state): ?object {
            $handoff = DB::table('oauth_handoffs')
                ->where('token_hash', hash('sha256', $state))
                ->lockForUpdate()
                ->first();

            if (! $handoff || $handoff->consumed_at !== null || now()->greaterThan($handoff->expires_at)) {
                return null;
            }

            DB::table('oauth_handoffs')->where('id', $handoff->id)->update([
                'consumed_at' => now(),
                'updated_at' => now(),
            ]);

            return $handoff;
        });
    }
}
