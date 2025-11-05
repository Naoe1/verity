<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ModRequests;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ensure a known test user exists
        $test = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        // Create a few additional users
        $users = User::factory()->count(3)->create();
        $allUsers = $users->concat([$test]);

        // Seed moderation requests per user
        foreach ($allUsers as $u) {
            // Mixed text/image, mostly success with some fails
            ModRequests::factory()
                ->count(20)
                ->state(fn() => ['user_id' => $u->id])
                ->create();

            // A few guaranteed failures
            ModRequests::factory()
                ->count(5)
                ->state(fn() => ['user_id' => $u->id])
                ->fail()
                ->create();
        }
    }
}
