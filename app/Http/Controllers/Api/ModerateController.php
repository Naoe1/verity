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
    public function moderateContentImage(Request $request)
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
            'image' => 'required|image|max:10240',
            'categories' => 'nullable|array',
            'categories.*' => 'in:Hate,SelfHarm,Sexual,Violence',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('image');
        if (! $file->isValid()) {
            return response()->json(['error' => 'Invalid uploaded file'], 422);
        }

        $categories = $request->input('categories', ['Hate', 'SelfHarm', 'Sexual', 'Violence']);
        $outputType = $request->input('outputType', 'FourSeverityLevels');
        $originalFilename = $file->getClientOriginalName();

        $apiKey = env('AZURE_CONTENT_API_KEY');
        $endpoint = rtrim(env('AZURE_CONTENT_ENDPOINT', ''), '/');
        $apiVersion = env('AZURE_CONTENT_API_VERSION', '2024-09-01');

        $bytes = file_get_contents($file->getRealPath());

        $base64 = base64_encode($bytes);

        $requestMetadata = [
            'image' => ['type' => 'upload', 'original_filename' => $originalFilename],
            'categories' => $categories,
            'outputType' => $outputType,
            'api_version' => $apiVersion,
        ];

        $user->incrementRequestsUsed();


        try {
            $analysisUrl = $endpoint . '/contentsafety/image:analyze?api-version=' . $apiVersion;
            $payload = [
                'image' => ['content' => $base64],
                'categories' => $categories,
                'outputType' => $outputType,
            ];

            $httpResponse = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->post($analysisUrl, $payload);

            $status = $httpResponse->status();
            $analysisBody = $httpResponse->json();

            //Handle Analysis Failure
            if (! $httpResponse->successful()) {
                $modReq = ModRequests::create([
                    'user_id' => $user->id,
                    'content_type' => 'image',
                    'content' => $originalFilename . ' (analysis failed)',
                    'request_metadata' => $requestMetadata,
                    'moderation_result' => $analysisBody,
                ]);
                return response()->json([
                    'error' => 'Azure Content Safety error',
                    'status' => $status,
                    'details' => $analysisBody,
                    'request_id' => $modReq->id,
                ], 502);
            }

            //UPLOAD
            $contentType = $file->getMimeType() ?: 'application/octet-stream';
            $ext = $file->getClientOriginalExtension() ?: $file->guessExtension();
            if (strtolower($ext) === 'jpeg') {
                $ext = 'jpg';
            }
            if (! $ext) {
                $ext = 'bin';
            }

            $path = 'users/' . $user->id . '/uploads-' . date('Ymd-His') . '.' . strtolower($ext);
            $ok = Storage::disk('azure')->put($path, $bytes, [
                'mimetype' => $contentType,
            ]);

            if (! $ok) {
                // Analysis OK, Upload FAILED
                $modReq = ModRequests::create([
                    'user_id' => $user->id,
                    'content_type' => 'image',
                    'content' => $originalFilename . ' (upload failed)',
                    'request_metadata' => $requestMetadata,
                    'moderation_result' => $analysisBody,
                ]);
                return response()->json([
                    'error' => 'Upload failed after successful analysis',
                    'request_id' => $modReq->id,
                    'analysis' => $analysisBody,
                ], 500);
            }

            $exists = Storage::disk('azure')->exists($path);

            //SUCCESS
            $modReq = ModRequests::create([
                'user_id' => $user->id,
                'content_type' => 'image',
                'content' => $path,
                'request_metadata' => array_merge($requestMetadata, ['image' => [
                    'type' => 'upload',
                    'original' => $originalFilename,
                    'path' => $path
                ]]),
                'moderation_result' => $analysisBody,
            ]);

            return response()->json([
                'message' => 'Analyzed and uploaded successfully',
                'request_id' => $modReq->id,
                'analysis' => $analysisBody,
                'upload' => [
                    'path' => $path,
                    'original_filename' => $originalFilename,
                    'content_type' => $contentType,
                    'bytes' => strlen($bytes),
                    'exists' => $exists,
                ]
            ]);
        } catch (\Throwable $e) {
            $modReq = ModRequests::create([
                'user_id' => $user->id,
                'content_type' => 'image',
                'content' => $originalFilename . ' (exception thrown)',
                'request_metadata' => $requestMetadata,
                'moderation_result' => [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'error' => 'Moderation or upload failed unexpectedly',
                'message' => $e->getMessage(),
                'request_id' => $modReq->id,
            ], 500);
        }
    }
}
