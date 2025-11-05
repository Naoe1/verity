<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class AuthenticateApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiToken = $request->bearerToken();

        if (empty($apiToken)) {
            return response()->json(['error' => 'Missing API token. Provide it as Authorization: Bearer'], 401);
        }

        $user = User::where('api_token', $apiToken)->first();

        if (!$user) {
            return response()->json(['error' => 'Invalid API token'], 401);
        }

        if (!$user->canMakeRequest()) {
            return response()->json(['error' => 'Request limit exceeded'], 429);
        }

        $request->attributes->set('user', $user);

        return $next($request);
    }
}
