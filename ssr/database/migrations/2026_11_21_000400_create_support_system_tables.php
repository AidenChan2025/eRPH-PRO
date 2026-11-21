<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('support_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('support_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_category_id')->nullable()->constrained('support_categories')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('excerpt')->nullable();
            $table->longText('body');
            $table->boolean('is_published')->default(true)->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('access_token_hash', 64)->index();
            $table->foreignId('requester_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->string('requester_name');
            $table->string('requester_email')->index();
            $table->string('subject');
            $table->string('category')->default('general')->index();
            $table->string('priority')->default('normal')->index();
            $table->string('status')->default('open')->index();
            $table->string('ai_state')->default('not_run')->index();
            $table->decimal('ai_confidence', 5, 4)->nullable();
            $table->text('ai_summary')->nullable();
            $table->text('ai_reply_draft')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('support_ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name');
            $table->string('author_email')->nullable();
            $table->string('source')->default('requester')->index();
            $table->boolean('is_internal')->default(false)->index();
            $table->longText('body');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('support_ticket_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_ticket_events');
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('support_articles');
        Schema::dropIfExists('support_categories');
    }
};
