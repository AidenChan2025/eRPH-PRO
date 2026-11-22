<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->string('recovery_code_hash', 255)->nullable();
            $table->timestamp('recovery_code_expires_at')->nullable();
            $table->timestamp('recovery_code_sent_at')->nullable();
            $table->unsignedTinyInteger('recovery_code_attempts')->default(0);
            $table->timestamp('recovery_code_last_attempt_at')->nullable();
            $table->timestamp('recovery_code_window_started_at')->nullable();
            $table->unsignedTinyInteger('recovery_code_sent_count')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn(['recovery_code_hash', 'recovery_code_expires_at', 'recovery_code_sent_at', 'recovery_code_attempts', 'recovery_code_last_attempt_at', 'recovery_code_window_started_at', 'recovery_code_sent_count']);
        });
    }
};
