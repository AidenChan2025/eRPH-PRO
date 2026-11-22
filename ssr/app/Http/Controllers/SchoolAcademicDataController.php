<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherProfile;
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
            'teachers' => TeacherProfile::query()->with('user')->where('employment_status', 'active')->orderBy('staff_no')->get(),
            'assignments' => TeacherClassAssignment::query()->with(['teacherProfile.user', 'schoolClass', 'academicYear'])->where('is_active', true)->orderBy('subject')->get(),
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

        DB::transaction(function () use ($school, $data, $auditLogger, &$year): void {
            $year = AcademicYear::create(['school_id' => $school->id, ...$data, 'status' => 'draft']);
            $auditLogger->record('school.academic_year_created', $school, AcademicYear::class, (string) $year->id, ['year' => $year->year]);
        });

        return back()->with('status', 'Academic year created.');
    }

    public function activateYear(Request $request, AcademicYear $academicYear, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        abort_unless($academicYear->school_id === $school->id, 404);

        DB::transaction(function () use ($school, $academicYear, $auditLogger): void {
            AcademicYear::query()->where('school_id', $school->id)->where('id', '!=', $academicYear->id)->where('status', 'active')->update(['status' => 'closed']);
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
        DB::transaction(function () use ($school, $data, $academicYear, $auditLogger, &$class): void {
            $class = SchoolClass::create([...$data, 'school_id' => $school->id]);
            $auditLogger->record('school.class_created', $school, SchoolClass::class, (string) $class->id, ['academic_year_id' => $academicYear->id, 'code' => $class->code]);
        });

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
        $before = ['name' => $schoolClass->name, 'level' => $schoolClass->level, 'stream' => $schoolClass->stream, 'capacity' => $schoolClass->capacity, 'is_active' => $schoolClass->is_active];
        DB::transaction(function () use ($school, $schoolClass, $data, $auditLogger, $before): void {
            $schoolClass->update($data);
            $auditLogger->record('school.class_updated', $school, SchoolClass::class, (string) $schoolClass->id, ['before' => $before, 'after' => $schoolClass->only(array_keys($before))]);
        });

        return back()->with('status', 'Class updated.');
    }

    public function storeAssignment(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $data = $request->validate([
            'academic_year_id' => ['required', 'integer'],
            'school_class_id' => ['required', 'integer'],
            'teacher_profile_id' => ['required', 'integer'],
            'subject' => ['required', 'string', 'max:120'],
            'role' => ['required', 'in:teacher,head'],
        ]);
        $year = AcademicYear::query()->findOrFail($data['academic_year_id']);
        $class = SchoolClass::query()->findOrFail($data['school_class_id']);
        $teacher = TeacherProfile::query()->findOrFail($data['teacher_profile_id']);
        abort_unless($year->school_id === $school->id && $class->school_id === $school->id && $teacher->school_id === $school->id && $class->academic_year_id === $year->id, 404);

        DB::transaction(function () use ($school, $data, $auditLogger, &$assignment): void {
            $assignment = TeacherClassAssignment::create([...$data, 'school_id' => $school->id]);
            $auditLogger->record('school.teacher_class_assignment_created', $school, TeacherClassAssignment::class, (string) $assignment->id, [
                'teacher_profile_id' => $assignment->teacher_profile_id, 'school_class_id' => $assignment->school_class_id, 'subject' => $assignment->subject,
            ]);
        });

        return back()->with('status', 'Teacher assignment created.');
    }

    public function removeAssignment(Request $request, TeacherClassAssignment $assignment, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        abort_unless($assignment->school_id === $school->id, 404);
        DB::transaction(function () use ($school, $assignment, $auditLogger): void {
            $assignment->update(['is_active' => false]);
            $auditLogger->record('school.teacher_class_assignment_removed', $school, TeacherClassAssignment::class, (string) $assignment->id, []);
        });

        return back()->with('status', 'Teacher assignment removed.');
    }
}
