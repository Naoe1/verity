<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModRequests extends Model
{
    use HasFactory;
    protected $fillable = [
        'id',
        'user_id',
        'content_type',
        'content',
        'request_metadata',
        'moderation_result',
    ];

    protected $casts = [
        'moderation_result' => 'array',
        'request_metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
