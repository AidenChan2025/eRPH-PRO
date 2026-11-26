<?php

namespace Tests\Feature;

use App\Models\{School, Student, StudentAttendance, User};
use App\Services\RphAiAssistant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentAffairsAndAiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_affairs_records_are_tenant_isolated(): void
    {
        $first = School::create(['name'=>'First School','slug'=>'first-school','subdomain'=>'first-school']);
        $second = School::create(['name'=>'Second School','slug'=>'second-school','subdomain'=>'second-school']);
        $this->withRequestTenant($first->id);
        $student = Student::create(['school_id'=>$first->id,'student_no'=>'S-001','name'=>'Aina']);
        StudentAttendance::create(['school_id'=>$first->id,'student_id'=>$student->id,'attendance_date'=>'2026-11-27','status'=>'present']);
        $this->withRequestTenant($second->id);
        $this->assertCount(0, Student::query()->get());
        $this->assertCount(0, StudentAttendance::query()->get());
    }

    public function test_ai_assistant_has_deterministic_no_network_fallback(): void
    {
        config()->set('services.deepseek.api_key', null);
        $draft = app(RphAiAssistant::class)->draft(['topic'=>'Pecahan']);
        $this->assertSame('deterministic-fallback', $draft['source']);
        $this->assertArrayHasKey('pentaksiran', $draft);
    }

    private function withRequestTenant(int $schoolId): void
    {
        request()->attributes->set('tenant_school_id', $schoolId);
    }
}
