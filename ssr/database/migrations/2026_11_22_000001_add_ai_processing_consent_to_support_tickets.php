<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->timestamp('ai_processing_consent_at')->nullable()->after('ai_state');
            $table->string('ai_processing_consent_version', 64)->nullable()->after('ai_processing_consent_at');
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn(['ai_processing_consent_at', 'ai_processing_consent_version']);
        });
    }
};
