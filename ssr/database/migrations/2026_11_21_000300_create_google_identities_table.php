<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('google_identities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('subject');
            $table->string('email');
            $table->string('email_type')->default('personal')->index();
            $table->boolean('is_primary')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('unlinked_at')->nullable()->index();
            $table->timestamps();
            $table->unique('subject');
            $table->index(['user_id', 'unlinked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_identities');
    }
};
