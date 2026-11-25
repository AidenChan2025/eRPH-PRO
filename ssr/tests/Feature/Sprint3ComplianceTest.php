<?php

namespace Tests\Feature;

use Tests\TestCase;

class Sprint3ComplianceTest extends TestCase
{
    public function test_sprint_three_routes_are_registered(): void
    {
        $this->assertTrue(route('workspace.maklumat-am', [], false) === '/workspace/maklumat-am');
        $this->assertTrue(route('school.inspector-view', [], false) === '/school-admin/inspector-view');
        $this->assertTrue(route('school.academic-years.archive', ['academicYear' => 1], false) === '/admin/academic-years/1/archive');
    }

    public function test_sprint_three_views_include_required_read_only_and_print_copy(): void
    {
        $this->assertStringContainsString('Kalendar Akademik 2026', file_get_contents(resource_path('views/workspace/maklumat-am.blade.php')));
        $inspector = file_get_contents(resource_path('views/school-admin/inspector-view.blade.php'));
        $this->assertStringContainsString('No lesson-plan content or editing controls are exposed.', $inspector);
        $this->assertStringContainsString('window.print()', $inspector);
    }
}
