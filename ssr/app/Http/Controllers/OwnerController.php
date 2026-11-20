<?php

namespace App\Http\Controllers;

use App\Models\School;

class OwnerController extends Controller
{
    public function __invoke()
    {
        $schools = School::query()->withCount('members')->orderBy('name')->get();

        return view('owner.dashboard', compact('schools'));
    }
}
