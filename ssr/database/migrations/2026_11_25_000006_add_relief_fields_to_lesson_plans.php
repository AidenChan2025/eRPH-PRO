<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lesson_plans', function (Blueprint $table): void {
            $table->boolean('is_relief')->default(false)->after('class_name');
            $table->string('relief_reason')->nullable()->after('is_relief');
        });
    }

    public function down(): void
    {
        Schema::table('lesson_plans', function (Blueprint $table): void {
            $table->dropColumn(['is_relief', 'relief_reason']);
        });
    }
};
