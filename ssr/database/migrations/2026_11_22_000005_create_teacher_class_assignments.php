<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table): void {
            $table->unique(['id', 'school_id'], 'school_classes_id_school_id_unique');
        });
        Schema::table('teacher_profiles', function (Blueprint $table): void {
            $table->unique(['id', 'school_id'], 'teacher_profiles_id_school_id_unique');
        });

        Schema::create('teacher_class_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->restrictOnDelete();
            $table->foreignId('teacher_profile_id')->constrained()->restrictOnDelete();
            $table->string('subject', 120);
            $table->string('role', 40)->default('teacher');
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['school_id', 'academic_year_id', 'school_class_id', 'teacher_profile_id', 'subject'], 'teacher_class_assignments_unique');
            $table->index(['school_id', 'academic_year_id', 'school_class_id', 'is_active'], 'teacher_class_assignments_lookup');
            $table->foreign(['academic_year_id', 'school_id'], 'assignments_year_school_foreign')
                ->references(['id', 'school_id'])->on('academic_years')->restrictOnDelete();
            $table->foreign(['school_class_id', 'school_id'], 'assignments_class_school_foreign')
                ->references(['id', 'school_id'])->on('school_classes')->restrictOnDelete();
            $table->foreign(['teacher_profile_id', 'school_id'], 'assignments_teacher_school_foreign')
                ->references(['id', 'school_id'])->on('teacher_profiles')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_class_assignments');
        Schema::table('teacher_profiles', function (Blueprint $table): void {
            $table->dropUnique('teacher_profiles_id_school_id_unique');
        });
        Schema::table('school_classes', function (Blueprint $table): void {
            $table->dropUnique('school_classes_id_school_id_unique');
        });
    }
};
