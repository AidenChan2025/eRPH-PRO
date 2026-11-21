<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class SchoolHomeController extends Controller
{
    public function __invoke(Request $request): View
    {
        $school = $request->attributes->get('school');

        if (!$school && strtolower($request->getHost()) === strtolower((string) config('app.school_base_domain', 'erphpro.com'))) {
            return view('public-home');
        }

        return view('school-home', compact('school'));
    }
}
