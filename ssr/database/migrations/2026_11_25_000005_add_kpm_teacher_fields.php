<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table): void {
            $table->string('delima_id')->nullable()->after('identity_no');
            $table->string('opsyen')->nullable()->after('position');
            $table->boolean('guru_kelas')->default(false)->after('opsyen');
            $table->string('jantina', 30)->nullable()->after('guru_kelas');
            $table->string('agama', 80)->nullable()->after('jantina');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table): void {
            $table->dropColumn(['delima_id', 'opsyen', 'guru_kelas', 'jantina', 'agama']);
        });
    }
};
