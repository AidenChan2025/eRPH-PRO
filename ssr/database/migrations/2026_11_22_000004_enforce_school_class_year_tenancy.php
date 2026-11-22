<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('academic_years', function (Blueprint $table): void {
            $table->unique(['id', 'school_id'], 'academic_years_id_school_id_unique');
        });

        Schema::table('school_classes', function (Blueprint $table): void {
            $table->dropForeign(['academic_year_id']);
            $table->foreign(['academic_year_id', 'school_id'], 'school_classes_year_school_foreign')
                ->references(['id', 'school_id'])
                ->on('academic_years')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table): void {
            if (Schema::getConnection()->getDriverName() === 'sqlite') {
                $table->dropForeign(['academic_year_id', 'school_id']);
            } else {
                $table->dropForeign('school_classes_year_school_foreign');
            }
            $table->foreign('academic_year_id')
                ->references('id')
                ->on('academic_years')
                ->restrictOnDelete();
        });

        Schema::table('academic_years', function (Blueprint $table): void {
            $table->dropUnique('academic_years_id_school_id_unique');
        });
    }
};
