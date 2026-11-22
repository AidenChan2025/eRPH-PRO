<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('teacher_class_assignments', function (Blueprint $table): void {
            $table->unique(['id', 'school_id'], 'teacher_class_assignments_id_school_unique');
        });
        Schema::table('lesson_plans', function (Blueprint $table): void {
            $table->unsignedBigInteger('teacher_class_assignment_id')->nullable()->after('teacher_profile_id');
            $table->index(['school_id', 'teacher_class_assignment_id'], 'lesson_plans_assignment_lookup');
        });
        Schema::table('lesson_plans', function (Blueprint $table): void {
            $table->foreign(['teacher_class_assignment_id', 'school_id'], 'lesson_plans_assignment_school_foreign')
                ->references(['id', 'school_id'])->on('teacher_class_assignments')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lesson_plans', function (Blueprint $table): void {
            if (Schema::getConnection()->getDriverName() === 'sqlite') {
                $table->dropForeign(['teacher_class_assignment_id', 'school_id']);
            } else {
                $table->dropForeign('lesson_plans_assignment_school_foreign');
            }
            $table->dropIndex('lesson_plans_assignment_lookup');
            $table->dropColumn('teacher_class_assignment_id');
        });
        Schema::table('teacher_class_assignments', function (Blueprint $table): void {
            $table->dropUnique('teacher_class_assignments_id_school_unique');
        });
    }
};
