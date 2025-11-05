<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Services\ModerationService;

class ModerateController extends Controller
{
    public function __construct(private readonly ModerationService $moderationService) {}
    public function moderateContentText(Request $request)
    {
        $user = $request->attributes->get('user');

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
        $result = $this->moderationService->analyzeText($user, $content, $categories, $outputType);

        return response()->json($result['payload'], $result['http_status']);
    }
    public function moderateContentImage(Request $request)
    {
        $user = $request->attributes->get('user');

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
        $result = $this->moderationService->analyzeImageUpload($user, $file, $categories, $outputType);

        return response()->json($result['payload'], $result['http_status']);
    }
}
