<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ModerateController;
use App\Http\Middleware\AuthenticateApiToken;

Route::middleware([AuthenticateApiToken::class, 'throttle:api'])->group(function () {
    Route::post('/text', [ModerateController::class, 'moderateContentText']);
    Route::post('/image', [ModerateController::class, 'moderateContentImage']);
});
