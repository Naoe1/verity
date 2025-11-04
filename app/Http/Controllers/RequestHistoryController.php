<?php

namespace App\Http\Controllers;

use App\Models\ModRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class RequestHistoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $search = trim((string) $request->query('search', ''));

        $requests = ModRequests::query()
            ->where('user_id', $user->id)
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $search) . '%';
                    $qq->where('content', 'like', $like)
                        ->orWhere('content_type', 'like', $like)
                        ->orWhere('request_metadata->image->original_filename', 'like', $like);
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(function (ModRequests $r) {
                return [
                    'id' => $r->id,
                    'content_type' => $r->content_type,
                    'content' => $r->content,
                    'request_metadata' => $r->request_metadata,
                    'moderation_result' => $r->moderation_result,
                    'status' => $r->status,
                    'created_at' => $r->created_at?->toIso8601String(),
                ];
            });

        return Inertia::render('requests/index', [
            'requests' => $requests,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $userId = $request->user()->id;
        $record = ModRequests::where('id', $id)->where('user_id', $userId)->firstOrFail();
        $temporaryUrl = null;
        if ($record->content_type === 'image') {
            $temporaryUrl = Storage::disk('azure')->temporaryUrl(
                $record->content,
                now()->addMinutes(5)
            );;
        }
        return Inertia::render('requests/show', [
            'request' => [
                'id' => $record->id,
                'content_type' => $record->content_type,
                'content' => $record->content,
                'request_metadata' => $record->request_metadata,
                'moderation_result' => $record->moderation_result,
                'status' => $record->status,
                'created_at' => $record->created_at?->toIso8601String(),
                'updated_at' => $record->updated_at?->toIso8601String(),
                'image_url' => $temporaryUrl,
            ],
        ]);
    }
}
