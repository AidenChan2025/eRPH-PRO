<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('school_timetable_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->string('day_of_week', 12);
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('label', 80)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->index(['school_id', 'day_of_week', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_timetable_slots');
    }
};
