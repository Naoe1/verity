<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\ModRequests;
use Illuminate\Support\Facades\Storage;

class ModerateController extends Controller
{
    public function moderateContentText(Request $request)
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

        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'categories' => 'nullable|array',
            'categories.*' => 'in:Hate,SelfHarm,Sexual,Violence',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $content = $request->input('content');
        $categories = $request->input('categories', ['Hate', 'SelfHarm', 'Sexual', 'Violence']);
        $outputType = $request->input('outputType', 'FourSeverityLevels');

        $apiKey = env('AZURE_CONTENT_API_KEY');
        $endpoint = rtrim(env('AZURE_CONTENT_ENDPOINT', ''), '/');
        $apiVersion = env('AZURE_CONTENT_API_VERSION', '2024-09-01');

        $user->incrementRequestsUsed();

        try {
            $url = $endpoint . '/contentsafety/text:analyze?api-version=' . $apiVersion;

            $payload = [
                'text' => $content,
                'categories' => $categories,
                'outputType' => $outputType,
            ];

            $httpResponse = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            $status = $httpResponse->status();
            $body = $httpResponse->json();

            $modReq = ModRequests::create([
                'user_id' => $user->id,
                'content' => $content,
                'request_metadata' => [
                    'categories' => $categories,
                    'outputType' => $outputType,
                    'api_version' => $apiVersion,
                ],
                'moderation_result' => $body,
            ]);

            if (!$httpResponse->successful()) {
                return response()->json([
                    'error' => 'Azure Content Safety error',
                    'status' => $status,
                    'details' => $body,
                    'request_id' => $modReq->id,
                ], 502);
            }

            return response()->json([
                'request_id' => $modReq->id,
                'result' => $body,
            ]);
        } catch (\Throwable $e) {
            $modReq = ModRequests::create([
                'user_id' => $user->id,
                'content_type' => 'text',
                'content' => $content ?? '',
                'request_metadata' => [
                    'categories' => $categories,
                    'outputType' => $outputType,
                    'api_version' => $apiVersion,
                ],
                'moderation_result' => [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'error' => 'Moderation failed',
                'message' => $e->getMessage(),
                'request_id' => $modReq->id,
            ], 500);
        }
    }
}
