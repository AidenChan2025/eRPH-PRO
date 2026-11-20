<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $this->seed();
        $response = $this->get('http://demo.erphpro.com/');

        $response->assertOk()->assertSee('eRPH Pro Demo School')->assertSee('School workspace');
    }

    public function test_a_school_member_can_open_their_workspace(): void
    {
        $this->seed();
        $user = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $response = $this->actingAs($user)->get('http://demo.erphpro.com/workspace');

        $response->assertOk()->assertSee('Teacher record')->assertSee('Lesson plans');
    }

    public function test_unknown_school_hosts_are_rejected(): void
    {
        $response = $this->get('http://unknown.erphpro.com/');

        $response->assertNotFound();
    }

    public function test_school_admin_can_view_school_people_but_a_teacher_cannot(): void
    {
        $this->seed();
        $admin = User::where('email', 'demo@erphpro.com')->firstOrFail();

        $this->actingAs($admin)->get('http://demo.erphpro.com/admin')
            ->assertOk()->assertSee('School people')->assertSee('Demo Administrator');

        $teacher = User::factory()->create(['email' => 'teacher@example.com']);
        $admin->schools()->first()->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);

        $this->actingAs($teacher)->get('http://demo.erphpro.com/admin')->assertForbidden();
    }
}
