<?php

namespace App\Http\Controllers;

use App\Models\TeacherProfile;
use Illuminate\Http\Request;

class SchoolAdminController extends Controller
{
    public function __invoke(Request $request)
    {
        $school = $request->attributes->get('school');
        $teachers = TeacherProfile::query()
            ->where('school_id', $school->id)
            ->with('user')
            ->orderBy('employment_status')
            ->orderBy('staff_no')
            ->get();

        return view('school-admin.dashboard', compact('school', 'teachers'));
    }
}
