<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lesson_plan_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('lesson_plan_id')->constrained()->restrictOnDelete();
            $table->foreignId('teacher_profile_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('week_no');
            $table->date('deadline')->nullable();
            $table->timestamp('submitted_at');
            $table->string('status')->default('on_time')->index();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'week_no', 'status']);
            $table->unique(['lesson_plan_id', 'week_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_plan_submissions');
    }
};
