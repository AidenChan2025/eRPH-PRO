<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('curriculum_items', function (Blueprint $table): void {
            $table->unsignedBigInteger('school_id')->nullable()->change();
            $table->string('curriculum_version')->nullable();
            $table->string('school_type')->nullable();
            $table->string('grade_level')->nullable();
            $table->string('sk_code')->nullable();
            $table->string('sp_code')->nullable();
            $table->text('description')->nullable();
            $table->index(['school_id', 'school_type', 'grade_level', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::table('curriculum_items', function (Blueprint $table): void {
            $table->dropIndex(['curriculum_items_school_id_school_type_grade_level_subject_index']);
            $table->dropColumn(['curriculum_version', 'school_type', 'grade_level', 'sk_code', 'sp_code', 'description']);
        });
    }
};
