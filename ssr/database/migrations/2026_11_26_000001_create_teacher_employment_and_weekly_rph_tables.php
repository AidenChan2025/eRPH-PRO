<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('teacher_employment_histories', function(Blueprint $t){$t->id();$t->foreignId('user_id')->constrained()->restrictOnDelete();$t->foreignId('school_id')->constrained()->restrictOnDelete();$t->string('role')->default('teacher');$t->date('started_on');$t->date('ended_on')->nullable();$t->timestamps();$t->index(['user_id','school_id']);});
  Schema::create('rph_weekly_aggregates', function(Blueprint $t){$t->id();$t->foreignId('school_id')->constrained()->restrictOnDelete();$t->foreignId('teacher_profile_id')->constrained()->restrictOnDelete();$t->unsignedSmallInteger('week_no');$t->string('status')->default('draft');$t->timestamps();$t->unique(['school_id','teacher_profile_id','week_no'], 'rph_weekly_aggregates_school_teacher_week_uq');});
 }
 public function down(): void { Schema::dropIfExists('rph_weekly_aggregates'); Schema::dropIfExists('teacher_employment_histories'); }
};
