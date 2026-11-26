<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\CurriculumItem;
use App\Models\School;
use App\Models\SupportArticle;
use App\Services\SsrCache;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        School::saved(static fn () => SsrCache::invalidate('school-hosts'));
        School::deleted(static fn () => SsrCache::invalidate('school-hosts'));
        CurriculumItem::saved(static fn () => SsrCache::invalidate('curriculum'));
        CurriculumItem::deleted(static fn () => SsrCache::invalidate('curriculum'));
        SupportArticle::saved(static fn () => SsrCache::invalidate('support'));
        SupportArticle::deleted(static fn () => SsrCache::invalidate('support'));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
