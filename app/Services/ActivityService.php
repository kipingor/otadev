<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityService
{
    public static function log(
        string $event,
        string $description,
        mixed $subject,
        array $changes = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => Auth::id(),
            'event' => $event,
            'description' => $description,
            'subject_id' => $subject->id,
            'subject_type' => get_class($subject),
            'changes' => $changes,
        ]);
    }
}
