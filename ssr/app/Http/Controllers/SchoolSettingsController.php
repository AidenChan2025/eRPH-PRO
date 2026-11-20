<?php

namespace App\Http\Controllers;

use App\Models\SchoolSetting;
use App\Models\SchoolTimetableSlot;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class SchoolSettingsController extends Controller
{
    public function edit(Request $request)
    {
        $school = $request->attributes->get('school');
        $settings = SchoolSetting::firstOrCreate(['school_id' => $school->id]);
        $slots = SchoolTimetableSlot::where('school_id', $school->id)->orderBy('day_of_week')->orderBy('sort_order')->get();

        return view('school-admin.settings', compact('school', 'settings', 'slots'));
    }

    public function update(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $data = $request->validate([
            'academic_year' => ['required', 'integer', 'between:2000,2100'],
            'total_weeks' => ['required', 'integer', 'between:1,60'],
            'active_week' => ['required', 'integer', 'between:1,60'],
            'submission_weekday' => ['required', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'active_week_deadline' => ['nullable', 'date'],
        ]);
        $settings = SchoolSetting::updateOrCreate(['school_id' => $school->id], $data);
        $auditLogger->record('school.settings_updated', $school, SchoolSetting::class, (string) $settings->id, ['fields' => array_keys($data)]);

        return redirect()->route('school.settings')->with('status', 'School settings updated.');
    }

    public function addSlot(Request $request, AuditLogger $auditLogger)
    {
        $school = $request->attributes->get('school');
        $data = $request->validate([
            'day_of_week' => ['required', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'starts_at' => ['required', 'date_format:H:i'], 'ends_at' => ['required', 'date_format:H:i', 'after:starts_at'],
            'label' => ['nullable', 'string', 'max:80'], 'sort_order' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);
        $slot = SchoolTimetableSlot::create(['school_id' => $school->id, ...$data, 'sort_order' => $data['sort_order'] ?? 0]);
        $auditLogger->record('school.timetable_slot_created', $school, SchoolTimetableSlot::class, (string) $slot->id, $data);

        return redirect()->route('school.settings')->with('status', 'Timetable slot added.');
    }
}
