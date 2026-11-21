<?php

namespace App\Http\Controllers;

use App\Models\SupportArticle;

class SupportArticleController extends Controller
{
    public function show(string $slug)
    {
        $article = SupportArticle::query()->where('slug', $slug)->where('is_published', true)->with('category')->firstOrFail();

        return view('support.article', compact('article'));
    }
}
