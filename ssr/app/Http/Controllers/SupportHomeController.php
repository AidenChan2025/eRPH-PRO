<?php

namespace App\Http\Controllers;

use App\Models\SupportArticle;
use App\Models\SupportCategory;
use Illuminate\Http\Request;

class SupportHomeController extends Controller
{
    public function __invoke(Request $request)
    {
        $categories = SupportCategory::query()->where('is_active', true)->withCount(['articles' => fn ($query) => $query->where('is_published', true)])->orderBy('sort_order')->get();
        $articles = SupportArticle::query()->where('is_published', true)->with('category')->when($request->filled('q'), function ($query) use ($request) {
            $term = '%' . addcslashes((string) $request->query('q'), '%_') . '%';
            $query->where(function ($search) use ($term) {
                $search->where('title', 'like', $term)->orWhere('excerpt', 'like', $term)->orWhere('body', 'like', $term);
            });
        })->when($request->filled('category'), function ($query) use ($request) {
            $query->whereHas('category', fn ($category) => $category->where('slug', $request->query('category')));
        })->orderBy('sort_order')->latest('id')->limit(12)->get();

        return view('support.home', compact('categories', 'articles'));
    }
}
