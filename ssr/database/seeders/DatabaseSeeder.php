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

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
