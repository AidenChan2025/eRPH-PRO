<?php

namespace App\Http\Controllers;

use App\Models\SupportArticle;
use App\Services\SsrCache;

class SupportArticleController extends Controller
{
    public function show(string $slug)
    {
        $article = SsrCache::remember('ssr:support:'.SsrCache::version('support').':article:'.sha1($slug), fn () => SupportArticle::query()->where('slug', $slug)->where('is_published', true)->with('category')->firstOrFail());

        return view('support.article', compact('article'));
    }
}
