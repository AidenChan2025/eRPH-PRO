<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class SchoolHomeController extends Controller
{
    public function __invoke(Request $request): View
    {
        $school = $request->attributes->get('school');

        return view('school-home', compact('school'));
    }
}
