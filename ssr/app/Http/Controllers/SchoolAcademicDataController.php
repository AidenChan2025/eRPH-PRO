<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolAcademicDataController extends Controller
{
    public function index(Request $request)
    {
        $school = $request->attributes->get('school');

        return view('school-admin.academic-data', [
            'school' => $school,
            'academicYears' => AcademicYear::query()->withCount('classes')->orderByDesc('year')->get(),
            'classes' => SchoolClass::query()->with('academicYear')->orderBy('academic_year_id')->orderBy('name')->get(),
        ]);
    }

    public function storeYear(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $data = $request->validate([
            'year' => ['required', 'integer', 'between:2000,2100'],
            'name' => ['required', 'string', 'max:120'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
        ]);

        $year = AcademicYear::create(['school_id' => $school->id, ...$data, 'status' => 'draft']);
        $auditLogger->record('school.academic_year_created', $school, AcademicYear::class, (string) $year->id, ['year' => $year->year]);

        return back()->with('status', 'Academic year created.');
    }

    public function activateYear(Request $request, AcademicYear $academicYear, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        abort_unless($academicYear->school_id === $school->id, 404);

        DB::transaction(function () use ($school, $academicYear, $auditLogger): void {
            AcademicYear::query()->where('school_id', $school->id)->where('id', '!=', $academicYear->id)->update(['status' => 'closed']);
            $academicYear->update(['status' => 'active']);
            $auditLogger->record('school.academic_year_activated', $school, AcademicYear::class, (string) $academicYear->id, ['year' => $academicYear->year]);
        });

        return back()->with('status', 'Academic year activated.');
    }

    public function storeClass(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $data = $request->validate([
            'academic_year_id' => ['required', 'integer'],
            'code' => ['required', 'string', 'max:80'],
            'name' => ['required', 'string', 'max:120'],
            'level' => ['nullable', 'string', 'max:80'],
            'stream' => ['nullable', 'string', 'max:120'],
            'capacity' => ['nullable', 'integer', 'between:1,300'],
        ]);

        $academicYear = AcademicYear::query()->findOrFail($data['academic_year_id']);
        abort_unless($academicYear->school_id === $school->id, 404);
        $class = SchoolClass::create([...$data, 'school_id' => $school->id]);
        $auditLogger->record('school.class_created', $school, SchoolClass::class, (string) $class->id, ['academic_year_id' => $academicYear->id, 'code' => $class->code]);

        return back()->with('status', 'Class created.');
    }

    public function updateClass(Request $request, SchoolClass $schoolClass, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        abort_unless($schoolClass->school_id === $school->id, 404);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'level' => ['nullable', 'string', 'max:80'],
            'stream' => ['nullable', 'string', 'max:120'],
            'capacity' => ['nullable', 'integer', 'between:1,300'],
            'is_active' => ['required', 'boolean'],
        ]);
        $schoolClass->update($data);
        $auditLogger->record('school.class_updated', $school, SchoolClass::class, (string) $schoolClass->id, ['is_active' => $schoolClass->is_active]);

        return back()->with('status', 'Class updated.');
    }
}
