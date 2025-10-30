<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class ModerateController extends Controller
{
    public function moderateContent(Request $request)
    {
        return response()->json(['message' => 'Content moderated successfully']);

        // $user = User::where('api_token', $apiKey)->first();

        // if (!$user) {
        //     return response()->json(['error' => 'Invalid API key'], 401);
        // }

        // return response()->json($user);

        // return response()->json(['message' => 'Content moderated successfully']);
    }
}
