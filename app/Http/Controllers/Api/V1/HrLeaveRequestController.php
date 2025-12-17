<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\HrLeaveRequest;
use App\Http\Resources\HrLeaveRequestResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HrLeaveRequestController extends Controller
{
    public function index()
    {
        return HrLeaveRequestResource::collection(
            HrLeaveRequest::with('staffProfile', 'approver')->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'staff_profile_id' => 'required|exists:staff_profiles,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date',
            'type' => 'required|string',
            'reason' => 'nullable|string',
        ]);

        $leave = HrLeaveRequest::create($data);

        return new HrLeaveRequestResource($leave);
    }

    public function show(HrLeaveRequest $leave)
    {
        return new HrLeaveRequestResource(
            $leave->load('staffProfile', 'approver')
        );
    }

    public function update(Request $request, HrLeaveRequest $leave)
    {
        $leave->update($request->all());

        return new HrLeaveRequestResource($leave);
    }

    public function destroy(HrLeaveRequest $leave)
    {
        $leave->delete();

        return response()->noContent();
    }
}
