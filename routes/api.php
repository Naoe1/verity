<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ModerateController;

Route::post('/text', [ModerateController::class, 'moderateContentText']);
