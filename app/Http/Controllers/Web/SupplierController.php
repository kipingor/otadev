<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $suppliers = Supplier::all();
        return Inertia::render('suppliers/index', ['suppliers'=> $suppliers]);
    }

    public function show(Request $request, Supplier $supplier)
    {
        return Inertia::render('suppliers/show', ['supplier' => $supplier]);
    }

    public function create(Request $request)
    {
        return Inertia::render('suppliers/create');
    }

    public function edit(Request $request, Supplier $supplier)
    {
        return Inertia::render('suppliers/edit', ['supplier' => $supplier]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $data = $this->validateRequest($request, $this->rules());
        $this->updateSupplier($supplier, $data);
        return redirect()
            ->route('suppliers.show', $supplier->id)
            ->with('success','Suppliers Updated');
    }

    public function orders(Request $request, $id)
    {
        return Inertia::render('suppliers/orders', ['id' => $id]);
    }

    public function invoices(Request $request, $id)
    {
        return Inertia::render('suppliers/invoices', ['id' => $id]);
    }

    public function payments(Request $request, $id)
    {
        return Inertia::render('suppliers/payments', ['id' => $id]);
    }

    public function contacts(Request $request, $id)
    {
        return Inertia::render('suppliers/contacts', ['id' => $id]);
    }

    public function documents(Request $request, $id)
    {
        return Inertia::render('suppliers/documents', ['id' => $id]);
    }

    public function settings(Request $request, $id)
    {
        return Inertia::render('suppliers/settings', ['id' => $id]);
    }

    public function dashboard(Request $request, $id)
    {
        return Inertia::render('suppliers/dashboard', ['id' => $id]);
    }

    public function activities(Request $request, $id)
    {
        return Inertia::render('suppliers/activities', ['id' => $id]);
    }

    public function notes(Request $request, $id)
    {
        return Inertia::render('suppliers/notes', ['id' => $id]);
    }

    public function quotations(Request $request, $id)
    {
        return Inertia::render('suppliers/quotations', ['id' => $id]);
    }

    public function purchases(Request $request, $id)
    {
        return Inertia::render('suppliers/purchases', ['id' => $id]);
    }

    public function reports(Request $request, $id)
    {
        return Inertia::render('suppliers/reports', ['id' => $id]);
    }

    public function analytics(Request $request, $id)
    {
        return Inertia::render('suppliers/analytics', ['id' => $id]);
    }

    public function history(Request $request, $id)
    {
        return Inertia::render('suppliers/history', ['id' => $id]);
    }

    public function overview(Request $request, $id)
    {
        return Inertia::render('suppliers/overview', ['id' => $id]);
    }

    public function finance(Request $request, $id)
    {
        return Inertia::render('suppliers/finance', ['id' => $id]);
    }

    public function performance(Request $request, $id)
    {
        return Inertia::render('suppliers/performance', ['id' => $id]);
    }

    public function collaboration(Request $request, $id)
    {
        return Inertia::render('suppliers/collaboration', ['id' => $id]);
    }

    public function communication(Request $request, $id)
    {
        return Inertia::render('suppliers/communication', ['id' => $id]);
    }

    public function management(Request $request, $id)
    {
        return Inertia::render('suppliers/management', ['id' => $id]);
    }

    public function support(Request $request, $id)
    {
        return Inertia::render('suppliers/support', ['id' => $id]);
    }

    public function feedback(Request $request, $id)
    {
        return Inertia::render('suppliers/feedback', ['id' => $id]);
    }

    public function settingsGeneral(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-general', ['id' => $id]);
    }

    public function settingsPrivacy(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-privacy', ['id' => $id]);
    }

    public function settingsNotifications(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-notifications', ['id' => $id]);
    }

    public function settingsBilling(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-billing', ['id' => $id]);
    }

    public function settingsSecurity(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-security', ['id' => $id]);
    }

    public function settingsIntegrations(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-integrations', ['id' => $id]);
    }

    public function settingsAPI(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-api', ['id' => $id]);
    }

    public function settingsUsers(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-users', ['id' => $id]);
    }

    public function settingsRoles(Request $request, $id)
    {
        return Inertia::render('suppliers/settings-roles', ['id' => $id]);
    }    

    private function validateRequest(Request $request, array $rules)
    {
        return $request->validate($rules);
    }

    private function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'email|max:255',
            'phone' => 'string|max:255',
        ];
    }

    private function updateSupplier(Supplier $supplier, array $data)
    {
        $supplier->update($data);
        return $supplier;
    }
}
