<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table): void {
            $table->id(); $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->nullOnDelete();
            $table->string('student_no', 80); $table->string('name', 160); $table->date('date_of_birth')->nullable();
            $table->string('gender', 24)->nullable(); $table->string('status', 24)->default('active'); $table->json('metadata')->nullable(); $table->timestamps();
            $table->unique(['school_id', 'student_no'], 'students_school_student_no_uq');
            $table->index(['school_id', 'school_class_id'], 'students_school_class_idx');
        });
        Schema::create('student_attendance', function (Blueprint $table): void {
            $table->id(); $table->foreignId('school_id')->constrained()->cascadeOnDelete(); $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->date('attendance_date'); $table->string('status', 24); $table->string('reason', 255)->nullable(); $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps();
            $table->unique(['school_id', 'student_id', 'attendance_date'], 'attendance_school_student_date_uq');
        });
        Schema::create('student_discipline', function (Blueprint $table): void {
            $table->id(); $table->foreignId('school_id')->constrained()->cascadeOnDelete(); $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->date('incident_date'); $table->string('category', 80); $table->text('description'); $table->string('action_taken', 255)->nullable(); $table->string('status', 24)->default('open'); $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps();
            $table->index(['school_id', 'student_id'], 'discipline_school_student_idx');
        });
        Schema::create('pbd_assessments', function (Blueprint $table): void {
            $table->id(); $table->foreignId('school_id')->constrained()->cascadeOnDelete(); $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('subject', 120); $table->string('standard', 120)->nullable(); $table->unsignedTinyInteger('band'); $table->text('evidence')->nullable(); $table->date('assessed_on'); $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps();
            $table->index(['school_id', 'student_id', 'subject'], 'pbd_school_student_subject_idx');
        });
    }
    public function down(): void { foreach (['pbd_assessments', 'student_discipline', 'student_attendance', 'students'] as $table) Schema::dropIfExists($table); }
};
