<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('school_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->unique()->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('academic_year')->default(2026);
            $table->unsignedSmallInteger('total_weeks')->default(48);
            $table->unsignedSmallInteger('active_week')->default(1);
            $table->string('submission_weekday')->default('Friday');
            $table->date('active_week_deadline')->nullable();
            $table->json('review_rotation')->nullable();
            $table->json('extra')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_settings');
    }
};
