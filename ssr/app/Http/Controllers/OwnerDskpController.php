<?php

namespace App\Http\Controllers;

use App\Models\CurriculumItem;
use App\Models\School;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class OwnerDskpController extends Controller
{
    public function store(Request $request, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'curriculum_version' => ['required', 'string', 'max:120'],
            'school_type' => ['required', 'in:SK,SJKC,SJKT,Prasekolah,KAFA'],
            'grade_level' => ['required', 'string', 'max:80'],
            'subject' => ['required', 'string', 'max:120'],
            'sk_code' => ['nullable', 'string', 'max:80'],
            'sp_code' => ['nullable', 'string', 'max:80'],
            'title' => ['required', 'string', 'max:240'],
            'description' => ['nullable', 'string', 'max:10000'],
        ]);

        $item = CurriculumItem::withoutGlobalScopes()->create($data + ['is_active' => true]);
        $school = isset($data['school_id']) ? School::find($data['school_id']) : null;
        $auditLogger->record('platform.dskp.created', $school, CurriculumItem::class, (string) $item->id, [
            'curriculum_version' => $item->curriculum_version,
            'school_type' => $item->school_type,
            'title' => $item->title,
        ]);

        return back()->with('status', 'DSKP item created.');
    }
}
