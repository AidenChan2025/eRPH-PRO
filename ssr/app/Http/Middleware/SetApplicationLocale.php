<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetApplicationLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->session()->get('app.locale', config('app.locale', 'en'));
        App::setLocale(in_array($locale, ['en', 'ms', 'zh'], true) ? $locale : 'en');

        return $next($request);
    }
}
