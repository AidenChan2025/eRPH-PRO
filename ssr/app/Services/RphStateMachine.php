<?php
namespace App\Services;
use App\Models\LessonPlan;
use App\Models\RphWeeklyAggregate;
class RphStateMachine {
 public const SLOT=['draft','submitted','returned','approved','archived'];
 public function weekly(LessonPlan $plan): string {
  $week=(int)($plan->versions()->withoutGlobalScopes()->latest('version')->value('content->week_no') ?: $plan->lesson_date->weekOfYear);
  $states=LessonPlan::withoutGlobalScopes()->where('school_id',$plan->school_id)->where('teacher_profile_id',$plan->teacher_profile_id)->get()->filter(fn($p) => (int)($p->versions()->withoutGlobalScopes()->latest('version')->value('content->week_no') ?: $p->lesson_date->weekOfYear)===$week)->pluck('status');
  if($states->isEmpty() || $states->every(fn($s)=>$s==='draft')) return 'draft';
  if($states->every(fn($s)=>$s==='returned')) return 'returned';
  if($states->contains('returned') && $states->contains(fn($s)=>in_array($s,['submitted','approved'],true))) return 'partially_returned';
  if($states->every(fn($s)=>$s==='approved' || $s==='archived')) return 'approved';
  return $states->contains('submitted') ? 'submitted' : 'draft';
 }
 public function sync(LessonPlan $plan): RphWeeklyAggregate { $profile=$plan->teacher_profile_id; $week=(int)($plan->versions()->withoutGlobalScopes()->latest('version')->value('content->week_no') ?: $plan->lesson_date->weekOfYear); return RphWeeklyAggregate::updateOrCreate(['school_id'=>$plan->school_id,'teacher_profile_id'=>$profile,'week_no'=>$week],['status'=>$this->weekly($plan)]); }
}
