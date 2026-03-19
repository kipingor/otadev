<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\DeliveryDocument;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    public function index(Request $request)
    {
        $query = Delivery::with(
            'purchaseOrder:id,number,supplier_id',
            'purchaseOrder.supplier:id,name',
            'client:id,name,company'
        );

        if ($status = $request->get('status')) $query->where('status', $status);

        $deliveries = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        $counts = Delivery::selectRaw('status, count(*) as cnt')->groupBy('status')->pluck('cnt', 'status');

        return Inertia::render('deliveries/index', compact('deliveries', 'counts'));
    }

    public function show(Delivery $delivery)
    {
        $delivery->load(
            'purchaseOrder.supplier:id,name,email,phone',
            'client:id,name,company,email,phone,address',
            'receiver:id,name',
            'documents.uploader:id,name',
            'documents.approver:id,name'
        );

        return Inertia::render('deliveries/show', compact('delivery'));
    }

    // ── Mark in transit ────────────────────────────────────────────────────

    public function dispatch(Delivery $delivery)
    {
        $delivery->update(['status' => 'in_transit']);
        return back()->with('success', 'Delivery marked as in transit.');
    }

    // ── Mark delivered + client sign-off ──────────────────────────────────

    public function deliver(Request $request, Delivery $delivery)
    {
        $data = $request->validate([
            'signed_by'      => 'required|string|max:255',
            'client_notes'   => 'nullable|string',
            'delivered_date' => 'required|date',
            'items'          => 'nullable|array',
        ]);

        $delivery->update(array_merge($data, [
            'status'    => 'delivered',
            'signed_at' => now(),
            'received_by' => Auth::id(),
        ]));

        // Update PO status
        $po = $delivery->purchaseOrder;
        $allDelivered = $po->deliveries()->where('status', '!=', 'delivered')->doesntExist();
        $po->update(['status' => $allDelivered ? 'delivered' : 'partially_delivered']);

        // Auto-create GRN document
        DeliveryDocument::create([
            'delivery_id'       => $delivery->id,
            'purchase_order_id' => $delivery->purchase_order_id,
            'supplier_id'       => $po->supplier_id,
            'uploaded_by'       => Auth::id(),
            'type'              => 'grn',
            'title'             => "GRN – {$delivery->number}",
            'status'            => 'approved',
            'approved_by'       => Auth::id(),
            'approved_at'       => now(),
            'notes'             => "Auto-generated on delivery sign-off by {$data['signed_by']}.",
        ]);

        return back()->with('success', 'Delivery completed and GRN generated.');
    }

    // ── Reject delivery ────────────────────────────────────────────────────

    public function reject(Request $request, Delivery $delivery)
    {
        $data = $request->validate([
            'client_notes' => 'required|string',
            'signed_by'    => 'nullable|string',
        ]);

        $delivery->update(array_merge($data, ['status' => 'rejected', 'signed_at' => now()]));
        return back()->with('success', 'Delivery rejection recorded.');
    }

    // ── Upload document against delivery ──────────────────────────────────

    public function uploadDocument(Request $request, Delivery $delivery)
    {
        $data = $request->validate([
            'type'  => 'required|in:grn,delivery_note,contract,invoice,other',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        DeliveryDocument::create(array_merge($data, [
            'delivery_id'       => $delivery->id,
            'purchase_order_id' => $delivery->purchase_order_id,
            'supplier_id'       => $delivery->purchaseOrder->supplier_id ?? null,
            'uploaded_by'       => Auth::id(),
            'status'            => 'pending',
        ]));

        return back()->with('success', 'Document uploaded.');
    }

    // ── Approve / reject document ─────────────────────────────────────────

    public function approveDocument(Request $request, DeliveryDocument $document)
    {
        $data = $request->validate([
            'action' => 'required|in:approved,rejected',
            'notes'  => 'nullable|string',
        ]);

        $document->update([
            'status'      => $data['action'],
            'notes'       => $data['notes'] ?? $document->notes,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Document ' . $data['action'] . '.');
    }
}