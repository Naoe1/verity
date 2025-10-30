<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ModerateController;

Route::get('/', [ModerateController::class, 'moderateContent']);
