<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('year');
            $table->string('name', 120);
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->string('status', 24)->default('draft')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['school_id', 'year']);
        });

        Schema::create('school_classes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->string('code', 80);
            $table->string('name', 120);
            $table->string('level', 80)->nullable();
            $table->string('stream', 120)->nullable();
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['school_id', 'academic_year_id', 'code']);
            $table->index(['school_id', 'academic_year_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_classes');
        Schema::dropIfExists('academic_years');
    }
};
