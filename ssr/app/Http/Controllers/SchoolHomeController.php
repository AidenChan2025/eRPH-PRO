<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\View\View;

class SchoolHomeController extends Controller
{
    public function __invoke(School $school): View
    {
        return view('school-home', compact('school'));
    }
}
