<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Department;
use App\Http\Resources\DepartmentResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return DepartmentResource::collection(
            Department::with('head')->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'head_id' => 'nullable|exists:users,id',
        ]);

        return new DepartmentResource(Department::create($data));
    }

    public function show(Department $department)
    {
        return new DepartmentResource($department->load('head'));
    }

    public function update(Request $request, Department $department)
    {
        $department->update($request->all());

        return new DepartmentResource($department);
    }

    public function destroy(Department $department)
    {
        $department->delete();

        return response()->noContent();
    }
}
