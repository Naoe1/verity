<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\RequestHistoryController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('requests', [RequestHistoryController::class, 'index'])->name('requests.index');
    Route::get('requests/{id}', [RequestHistoryController::class, 'show'])->name('requests.show');
});

require __DIR__ . '/settings.php';
