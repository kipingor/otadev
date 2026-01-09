<?php

namespace App\Listeners\Lead;

use App\Events\LeadCreated;
use App\Events\LeadUpdated;
use App\Events\LeadDeleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class LogLeadActivity implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    public function handleCreated(LeadCreated $event): void
    {
        activity()
            ->performedOn($event->lead)
            ->causedBy($event->lead->owner)
            ->log('Lead created');
    }

    public function handleUpdated(LeadUpdated $event): void
    {
        activity()
            ->performedOn($event->lead)
            ->causedBy(auth()->user())
            ->log('Lead updated');
    }

    public function handleDeleted(LeadDeleted $event): void
    {
        activity()
            ->performedOn($event->lead)
            ->causedBy(auth()->user())
            ->log('Lead deleted');
    }
}
