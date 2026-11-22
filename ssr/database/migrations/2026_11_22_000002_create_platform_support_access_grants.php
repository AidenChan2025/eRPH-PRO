<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->unique(['id', 'school_id'], 'support_tickets_id_school_unique');
        });

        Schema::create('platform_support_access_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('support_ticket_id');
            $table->foreignId('platform_owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->constrained('users')->restrictOnDelete();
            $table->string('purpose', 500);
            $table->string('grant_slot_key')->nullable()->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('revoked_at')->nullable()->index();
            $table->timestamps();
            $table->index(['school_id', 'support_ticket_id', 'platform_owner_id', 'revoked_at'], 'platform_support_grants_scope_idx');
            $table->foreign(['support_ticket_id', 'school_id'], 'platform_support_grants_ticket_school_fk')
                ->references(['id', 'school_id'])->on('support_tickets')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_support_access_grants');
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropUnique('support_tickets_id_school_unique');
        });
    }
};
