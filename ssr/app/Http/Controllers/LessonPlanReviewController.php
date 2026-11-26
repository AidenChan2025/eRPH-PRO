<?php

namespace App\Http\Controllers;

use App\Models\LessonPlan;
use App\Models\LessonPlanReview;
use App\Services\AuditLogger;
use App\Services\RphStateMachine;
use Illuminate\Http\Request;

class LessonPlanReviewController extends Controller
{
    public function show(Request $request, LessonPlan $lessonPlan)
    {
        $school = $request->attributes->get('school');
        abort_unless($lessonPlan->school_id === $school->id, 404);
        $lessonPlan->load(['versions' => fn ($query) => $query->latest('version'), 'versions']);

        return view('lesson-plans.review', compact('school', 'lessonPlan'));
    }

    public function decide(Request $request, LessonPlan $lessonPlan, AuditLogger $auditLogger, RphStateMachine $stateMachine)
    {
        $school = $request->attributes->get('school');
        abort_unless($lessonPlan->school_id === $school->id, 404);
        abort_if(in_array($lessonPlan->status, ['approved', 'archived'], true), 422, 'Approved and archived RPH are read-only.');
        $data = $request->validate([
            'decision' => ['required', 'in:approved,returned'],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);
        LessonPlanReview::create([
            'school_id' => $school->id, 'lesson_plan_id' => $lessonPlan->id,
            'reviewer_id' => $request->user()->id, 'decision' => $data['decision'], 'comment' => $data['comment'] ?? null,
        ]);
        $lessonPlan->update([
            'status' => $data['decision'],
            'approved_at' => $data['decision'] === 'approved' ? now() : null,
            'approved_by' => $data['decision'] === 'approved' ? $request->user()->id : null,
        ]);
        $stateMachine->sync($lessonPlan->fresh());
        $auditLogger->record('lesson_plan.review_decided', $school, LessonPlan::class, (string) $lessonPlan->id, ['decision' => $data['decision']]);

        return redirect()->route('rph.review', $lessonPlan)->with('status', 'Review decision saved.');
    }

    public function archive(Request $request, LessonPlan $lessonPlan, AuditLogger $auditLogger, RphStateMachine $stateMachine)
    {
        $school = $request->attributes->get('school');
        abort_unless($lessonPlan->school_id === $school->id, 404);
        abort_unless(in_array($lessonPlan->status, ['approved', 'archived'], true), 422, 'Only approved RPH can be archived.');
        $lessonPlan->update(['status' => 'archived']);
        $auditLogger->record('lesson_plan.archived', $school, LessonPlan::class, (string) $lessonPlan->id);
        $stateMachine->sync($lessonPlan->fresh());
        return redirect()->route('rph.review', $lessonPlan)->with('status', 'RPH archived.');
    }
}
