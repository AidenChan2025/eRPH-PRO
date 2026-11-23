<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class OwnerSchoolController extends Controller
{
    public function index()
    {
        $schools = School::query()->withCount('members')->orderBy('name')->get();

        return view('owner.schools.index', compact('schools'));
    }

    public function create()
    {
        return view('owner.schools.form', ['school' => new School(), 'mode' => 'create']);
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $data = $this->validated($request);
        $school = School::create([
            ...$data,
            'slug' => Str::slug($data['name']),
            'is_active' => true,
        ]);
        $auditLogger->record('platform.school_created', null, School::class, (string) $school->id, [
            'subdomain' => $school->subdomain,
        ]);

        return redirect()->route('owner.schools.index')->with('status', 'School created.');
    }

    public function edit(School $school)
    {
        return view('owner.schools.form', ['school' => $school, 'mode' => 'edit']);
    }

    public function update(Request $request, School $school, AuditLogger $auditLogger)
    {
        $data = $this->validated($request, $school);
        $school->update([
            ...$data,
            'slug' => Str::slug($data['name']),
        ]);
        $auditLogger->record('platform.school_updated', null, School::class, (string) $school->id, [
            'subdomain' => $school->subdomain,
        ]);

        return redirect()->route('owner.schools.index')->with('status', 'School updated.');
    }

    public function toggle(School $school, AuditLogger $auditLogger)
    {
        $school->update(['is_active' => ! $school->is_active]);
        $auditLogger->record($school->is_active ? 'platform.school_activated' : 'platform.school_suspended', null, School::class, (string) $school->id);

        return redirect()->route('owner.schools.index')->with('status', $school->is_active ? 'School activated.' : 'School suspended.');
    }

    private function validated(Request $request, ?School $school = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'subdomain' => [
                'required', 'string', 'max:63', 'regex:/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/',
                Rule::unique('schools', 'subdomain')->ignore($school?->id),
            ],
            'workspace_domain' => ['nullable', 'string', 'max:190'],
        ]);
    }
}
