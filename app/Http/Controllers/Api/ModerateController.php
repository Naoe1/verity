<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ModerateContentImageRequest;
use App\Http\Requests\ModerateContentTextRequest;
use App\Services\ModerationService;

class ModerateController extends Controller
{
    public function __construct(private readonly ModerationService $moderationService) {}
    public function moderateContentText(ModerateContentTextRequest $request)
    {
        $user = $request->attributes->get('user');

        $validated = $request->validated();
        $content = $validated['content'];
        $categories = $validated['categories'] ?? ['Hate', 'SelfHarm', 'Sexual', 'Violence'];
        $outputType = $request->input('outputType', 'FourSeverityLevels');
        $result = $this->moderationService->analyzeText($user, $content, $categories, $outputType);

        return response()->json($result['payload'], $result['http_status']);
    }
    public function moderateContentImage(ModerateContentImageRequest $request)
    {
        $user = $request->attributes->get('user');
        $validated = $request->validated();
        $file = $request->file('image');
        if (! $file->isValid()) {
            return response()->json(['error' => 'Invalid uploaded file'], 422);
        }

        $categories = $validated['categories'] ?? ['Hate', 'SelfHarm', 'Sexual', 'Violence'];
        $outputType = $request->input('outputType', 'FourSeverityLevels');
        $result = $this->moderationService->analyzeImageUpload($user, $file, $categories, $outputType);

        return response()->json($result['payload'], $result['http_status']);
    }
}
