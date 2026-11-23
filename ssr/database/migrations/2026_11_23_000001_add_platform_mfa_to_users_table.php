<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->text('platform_mfa_secret')->nullable()->after('platform_role');
            $table->timestamp('platform_mfa_confirmed_at')->nullable()->after('platform_mfa_secret');
            $table->text('platform_mfa_recovery_codes')->nullable()->after('platform_mfa_confirmed_at');
            $table->timestamp('platform_mfa_recovery_codes_generated_at')->nullable()->after('platform_mfa_recovery_codes');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'platform_mfa_secret',
                'platform_mfa_confirmed_at',
                'platform_mfa_recovery_codes',
                'platform_mfa_recovery_codes_generated_at',
            ]);
        });
    }
};
