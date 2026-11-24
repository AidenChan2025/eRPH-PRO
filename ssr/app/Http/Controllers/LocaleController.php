<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class LocaleController extends Controller
{
    public function update(Request $request)
    {
        $locale = $request->validate(['locale' => ['required', 'in:en,ms,zh']])['locale'];
        $request->session()->put('app.locale', $locale);
        App::setLocale($locale);

        return back()->with('status', 'Language updated.');
    }
}
