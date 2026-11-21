<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(SupportContentSeeder::class);

        $school = \App\Models\School::query()->updateOrCreate(
            ['subdomain' => 'demo'],
            ['name' => 'eRPH Pro Demo School', 'slug' => 'demo-school', 'workspace_domain' => null, 'is_active' => true]
        );

        $user = \App\Models\User::query()->updateOrCreate(
            ['email' => 'demo@erphpro.com'],
            ['name' => 'Demo Administrator', 'password' => 'demo-only-password']
        );

        $school->members()->syncWithoutDetaching([$user->id => ['role' => 'school_admin', 'status' => 'active']]);

        \App\Models\TeacherProfile::query()->updateOrCreate(
            ['school_id' => $school->id, 'user_id' => $user->id],
            ['position' => 'School Administrator', 'employment_status' => 'active']
        );

        \App\Models\SchoolSetting::query()->updateOrCreate(
            ['school_id' => $school->id],
            ['academic_year' => 2026, 'total_weeks' => 48, 'active_week' => 41, 'submission_weekday' => 'Friday']
        );

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
