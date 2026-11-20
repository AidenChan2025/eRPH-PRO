<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('school_memberships', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->after('left_at')->index();
            $table->string('access_reason')->nullable()->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('school_memberships', function (Blueprint $table) {
            $table->dropColumn(['expires_at', 'access_reason']);
        });
    }
};
