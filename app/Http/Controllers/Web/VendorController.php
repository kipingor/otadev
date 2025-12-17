<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Vendor;
class VendorController extends Controller
{
    public function index(Request $request)
    {
        $vendors = Vendor::all();
        return Inertia::render("vendors/index", [
            "vendors"=> $vendors,
        ]);
        
    }

    public function create()
    {
        return Inertia::render('vendors/create', $this->formOptions());
    }

    public function store(Request $request)
    {
        $data = $this->validateRequest($request, $this->rules());
        $vendor = $this->createVendor($data);
        return redirect()->route('vendors.show', $vendor->id);
    }

    public function show(Vendor $vendor)
    {
        return Inertia::render('vendors/show', compact('vendor'));
    }

    public function edit(Vendor $vendor)
    {
        return Inertia::render('vendors/edit', compact('vendor'));
    }

    public function update(Request $request, Vendor $vendor)
    {
        $data = $this->validateRequest($request, $this->rules());
        $this->updateVendor($vendor, $data);
        return redirect()->route('vendors.show', $vendor->id);
    }

    public function destroy(Vendor $vendor)
    {
        $this->deleteVendor($vendor);
        return redirect()->route('vendors.index');
    }

    protected function getModelQuery(string $modelClass): Builder
    {
        return $modelClass::query();
    }

    protected function orderByDesc(Builder $query, string $column): Builder
    {
        return $query->orderByDesc($column);
    }
    
    private function paginateVendors(Builder $query, int $perPage): Collection
    {
        return $query->paginate($perPage);
    }

    private function renderVendorsView(string $view, Collection $vendors): InertiaResponse
    {
        return Inertia::render($view, compact('vendors'));
    }

    private function validateRequest(Request $request, array $rules): array
    {
        return $request->validate($rules);
    }

    private function formOptions(): array
    {
        return [
            'statuses' => Status::all(),
            'categories' => Category::all(),
            'subcategories' => Subcategory::all(),
            'subsubcategories' => Subsubcategory::all(),
        ];
    }

    private function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:255',
        ];
    }

    private function createVendor(array $data): Vendor
    {
        return Vendor::create($data);
    }

    private function updateVendor(Vendor $vendor, array $data): Vendor
    {
        $vendor->update($data);
        return $vendor;
    }

    private function deleteVendor(Vendor $vendor): void
    {
        $vendor->delete();
    }
}
