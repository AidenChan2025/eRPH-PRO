<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('teacher_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('staff_no')->nullable();
            $table->string('identity_no')->nullable();
            $table->string('phone')->nullable();
            $table->string('position')->nullable();
            $table->string('grade')->nullable();
            $table->string('employment_status')->default('active')->index();
            $table->date('joined_school_on')->nullable();
            $table->date('left_school_on')->nullable();
            $table->json('profile_data')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['school_id', 'user_id']);
            $table->index(['school_id', 'employment_status']);
        });

        Schema::create('curriculum_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->string('code')->nullable();
            $table->string('subject');
            $table->string('year_level')->nullable();
            $table->string('title');
            $table->text('content')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->index(['school_id', 'subject', 'year_level']);
        });

        Schema::create('lesson_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('teacher_profile_id')->constrained()->restrictOnDelete();
            $table->foreignId('curriculum_item_id')->nullable()->constrained()->nullOnDelete();
            $table->date('lesson_date')->index();
            $table->string('subject');
            $table->string('class_name');
            $table->string('status')->default('draft')->index();
            $table->unsignedInteger('current_version')->default(1);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['school_id', 'teacher_profile_id', 'lesson_date']);
        });

        Schema::create('lesson_plan_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_plan_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('version');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('source')->default('manual');
            $table->json('content');
            $table->text('change_note')->nullable();
            $table->timestamps();
            $table->unique(['lesson_plan_id', 'version']);
        });

        Schema::create('lesson_plan_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('lesson_plan_id')->constrained()->restrictOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->restrictOnDelete();
            $table->string('decision')->index();
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'lesson_plan_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_plan_reviews');
        Schema::dropIfExists('lesson_plan_versions');
        Schema::dropIfExists('lesson_plans');
        Schema::dropIfExists('curriculum_items');
        Schema::dropIfExists('teacher_profiles');
    }
};
