<?php

namespace App\Http\Controllers;

use App\Models\CurriculumItem;
use Illuminate\Http\Request;
use App\Services\SsrCache;

class DskpController extends Controller
{
    public function index(Request $request)
    {
        $school = $request->attributes->get('school');
        $filters = $request->only(['school_type', 'grade_level', 'subject', 'q', 'page']);
        ksort($filters);
        $cacheKey = 'ssr:dskp:'.SsrCache::version('curriculum').':school:'.$school->id.':'.sha1((string) json_encode($filters));
        $items = SsrCache::remember($cacheKey, fn () => CurriculumItem::withoutGlobalScopes()
            ->where(fn ($query) => $query->where('school_id', $school->id)->orWhereNull('school_id'))
            ->when($request->filled('school_type'), fn ($q) => $q->where('school_type', $request->string('school_type')))
            ->when($request->filled('grade_level'), fn ($q) => $q->where('grade_level', $request->string('grade_level')))
            ->when($request->filled('subject'), fn ($q) => $q->where('subject', $request->string('subject')))
            ->when($request->filled('q'), function ($q) use ($request): void {
                $term = $request->string('q')->toString();
                $q->where(fn ($search) => $search->where('title', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhere('sk_code', 'like', "%{$term}%")
                    ->orWhere('sp_code', 'like', "%{$term}%"));
            })
            ->where('is_active', true)
            ->orderBy('school_type')->orderBy('grade_level')->orderBy('subject')->orderBy('title')
            ->paginate(25)->withQueryString());

        return view('dskp.index', compact('school', 'items'));
    }
}
