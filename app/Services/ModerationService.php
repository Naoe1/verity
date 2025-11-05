<?php

namespace App\Services;

use App\Models\ModRequests;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ModerationService
{
    private string $apiKey;
    private string $endpoint;
    private string $apiVersion;

    public function __construct()
    {
        $this->apiKey = (string) config('services.azure_content.key');
        $this->endpoint = rtrim((string) config('services.azure_content.endpoint', ''), '/');
        $this->apiVersion = (string) config('services.azure_content.api_version', '2024-09-01');
    }

    public function analyzeText(User $user, string $content, array $categories, string $outputType = 'FourSeverityLevels'): array
    {
        $user->incrementRequestsUsed();

        $url = $this->endpoint . '/contentsafety/text:analyze?api-version=' . $this->apiVersion;

        try {
            $payload = [
                'text' => $content,
                'categories' => $categories,
                'outputType' => $outputType,
            ];

            $httpResponse = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $this->apiKey,
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
                    'api_version' => $this->apiVersion,
                ],
                'moderation_result' => $body,
                'status' => $httpResponse->successful() ? 'success' : 'fail',
            ]);

            if (! $httpResponse->successful()) {
                return [
                    'ok' => false,
                    'http_status' => 502,
                    'payload' => [
                        'error' => 'Azure Content Safety error',
                        'status' => $status,
                        'details' => $body,
                        'request_id' => $modReq->id,
                    ],
                ];
            }

            return [
                'ok' => true,
                'http_status' => 200,
                'payload' => [
                    'request_id' => $modReq->id,
                    'result' => $body,
                ],
            ];
        } catch (\Throwable $e) {
            $modReq = ModRequests::create([
                'user_id' => $user->id,
                'content_type' => 'text',
                'content' => $content ?? '',
                'request_metadata' => [
                    'categories' => $categories,
                    'outputType' => $outputType,
                    'api_version' => $this->apiVersion,
                ],
                'moderation_result' => [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                ],
                'status' => 'fail',
            ]);

            return [
                'ok' => false,
                'http_status' => 500,
                'payload' => [
                    'error' => 'Moderation failed',
                    'message' => $e->getMessage(),
                    'request_id' => $modReq->id,
                ],
            ];
        }
    }

    public function analyzeImageUpload(User $user, UploadedFile $file, array $categories, string $outputType = 'FourSeverityLevels'): array
    {
        $originalFilename = $file->getClientOriginalName();

        $bytes = file_get_contents($file->getRealPath());
        $base64 = base64_encode($bytes);

        $requestMetadata = [
            'image' => ['type' => 'upload', 'original_filename' => $originalFilename],
            'categories' => $categories,
            'outputType' => $outputType,
            'api_version' => $this->apiVersion,
        ];

        $user->incrementRequestsUsed();

        try {
            $analysisUrl = $this->endpoint . '/contentsafety/image:analyze?api-version=' . $this->apiVersion;
            $payload = [
                'image' => ['content' => $base64],
                'categories' => $categories,
                'outputType' => $outputType,
            ];

            $httpResponse = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($analysisUrl, $payload);

            $status = $httpResponse->status();
            $analysisBody = $httpResponse->json();

            if (! $httpResponse->successful()) {
                $modReq = ModRequests::create([
                    'user_id' => $user->id,
                    'content_type' => 'image',
                    'content' => $originalFilename . ' (analysis failed)',
                    'request_metadata' => $requestMetadata,
                    'moderation_result' => $analysisBody,
                    'status' => 'fail',
                ]);

                return [
                    'ok' => false,
                    'http_status' => 502,
                    'payload' => [
                        'error' => 'Azure Content Safety error',
                        'status' => $status,
                        'details' => $analysisBody,
                        'request_id' => $modReq->id,
                    ],
                ];
            }

            // Upload original bytes to Azure Storage
            $contentType = $file->getMimeType() ?: 'application/octet-stream';
            $ext = $file->getClientOriginalExtension() ?: $file->guessExtension();
            if (strtolower((string) $ext) === 'jpeg') {
                $ext = 'jpg';
            }
            if (! $ext) {
                $ext = 'bin';
            }

            $path = 'users/' . $user->id . '/uploads-' . date('Ymd-His') . '.' . strtolower((string) $ext);
            $ok = Storage::disk('azure')->put($path, $bytes, [
                'mimetype' => $contentType,
            ]);

            if (! $ok) {
                $modReq = ModRequests::create([
                    'user_id' => $user->id,
                    'content_type' => 'image',
                    'content' => $originalFilename . ' (upload failed)',
                    'request_metadata' => $requestMetadata,
                    'moderation_result' => $analysisBody,
                    'status' => 'fail',
                ]);

                return [
                    'ok' => false,
                    'http_status' => 500,
                    'payload' => [
                        'error' => 'Upload failed after successful analysis',
                        'request_id' => $modReq->id,
                        'analysis' => $analysisBody,
                    ],
                ];
            }

            $exists = Storage::disk('azure')->exists($path);

            $modReq = ModRequests::create([
                'user_id' => $user->id,
                'content_type' => 'image',
                'content' => $path,
                'request_metadata' => array_merge($requestMetadata, ['image' => [
                    'type' => 'upload',
                    'original' => $originalFilename,
                    'path' => $path,
                ]]),
                'moderation_result' => $analysisBody,
                'status' => 'success',
            ]);

            return [
                'ok' => true,
                'http_status' => 200,
                'payload' => [
                    'message' => 'Analyzed and uploaded successfully',
                    'request_id' => $modReq->id,
                    'analysis' => $analysisBody,
                    'upload' => [
                        'path' => $path,
                        'original_filename' => $originalFilename,
                        'content_type' => $contentType,
                        'bytes' => strlen($bytes),
                        'exists' => $exists,
                    ],
                ],
            ];
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
                'status' => 'fail',
            ]);

            return [
                'ok' => false,
                'http_status' => 500,
                'payload' => [
                    'error' => 'Moderation or upload failed unexpectedly',
                    'message' => $e->getMessage(),
                    'request_id' => $modReq->id,
                ],
            ];
        }
    }
}
