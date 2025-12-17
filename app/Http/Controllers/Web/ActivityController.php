<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Activity;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->getActivityBaseQuery();

        // Apply filters based on request parameters
        if ($request->has('user_id')) {
            $query = $this->applyUserFilter($query, $request->input('user_id'));
        }
        if ($request->has('type')) {
            $query = $this->applyTypeFilter($query, $request->input('type'));
        }
        if ($request->has('start_date') && $request->has('end_date')) {
            $query = $this->applyDateRangeFilter($query, $request->input('start_date'), $request->input('end_date'));
        }
        if ($request->has('description_keyword')) {
            $query = $this->applyDescriptionFilter($query, $request->input('description_keyword'));
        }
        if ($request->has('metadata_key') && $request->has('metadata_value')) {
            $query = $this->applyMetadataFilter($query, $request->input('metadata_key'), $request->input('metadata_value'));
        }
        if ($request->has('reviewed')) {
            $query = $this->applyReviewedFilter($query, $request->input('reviewed'));
        }

        // Paginate results
        $activities = $this->paginateActivities($query, $request->input('per_page', 20));

        // Return view or JSON response
        if ($request->wantsJson()) {
            return $this->jsonResponse($activities);
        } else {
            return Inertia::render('activities/index', [
                'activities' => $activities,
            ]);
        }
    }

    public function show(Request $request, $id)
    {
        $activity = Activity::with('user')->findOrFail($id);

        if ($request->wantsJson()) {
            return $this->jsonResponse($activity);
        } else {
            return $this->renderActivitiesView('activities.show', $activity);
        }
    }

    public function create(Request $request)
    {
        return $this->renderActivitiesView('activities.create', null);
    }

    public function edit(Request $request, $id)
    {
        $activity = Activity::with('user')->findOrFail($id);
        return $this->renderActivitiesView('activities.edit', $activity);
    }
    
    public function dashboard(Request $request)
    {
        return $this->renderActivitiesView('activities.dashboard', null);
    }

    private function paginateActivities($query, $perPage = 20)
    {
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    private function renderActivitiesView($view, $activities)
    {
        return view($view, compact('activities'));
    }

    private function jsonResponse($data)
    {
        return response()->json($data);
    }

    private function getActivityBaseQuery()
    {
        return Activity::with('user');
    }

    private function applyUserFilter($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    private function applyTypeFilter($query, $type)
    {
        return $query->where('type', $type);
    }

    private function applyDateRangeFilter($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    private function applyDescriptionFilter($query, $keyword)
    {
        return $query->where('description', 'like', '%' . $keyword . '%');
    }

    private function applyMetadataFilter($query, $key, $value)
    {
        return $query->where("metadata->{$key}", $value);
    }

    private function applyReviewedFilter($query, $reviewed = true)
    {
        if ($reviewed) {
            return $query->whereNotNull('metadata->reviewed');
        } else {
            return $query->whereNull('metadata->reviewed');
        }
    }
}
