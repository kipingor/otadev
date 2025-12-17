<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ActivityLog;
use App\Http\Resources\ActivityLogResource;
use App\Http\Controllers\Controller;

class ActivityLogController extends Controller
{
    public function index()
    {
        return ActivityLogResource::collection(
            ActivityLog::with('user')->latest()->paginate(20)
        );
    }

    public function show(ActivityLog $activityLog)
    {
        return new ActivityLogResource($activityLog->load('user'));
    }
}
