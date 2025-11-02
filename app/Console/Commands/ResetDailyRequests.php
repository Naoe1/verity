<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class ResetDailyRequests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:reset-daily-requests';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset daily API request usage for all users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = User::query()->update(['requests_used' => 0]);

        $this->info("✅ Successfully reset request count for {$count} users.");

        return Command::SUCCESS;
    }
}
