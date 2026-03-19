<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    // ── Index ──────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Invoice::with('client:id,name,email', 'project:id,name')
            ->withCount('payments');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($client = $request->get('client_id')) {
            $query->where('client_id', $client);
        }
        if ($from = $request->get('from')) {
            $query->whereDate('issue_date', '>=', $from);
        }
        if ($to = $request->get('to')) {
            $query->whereDate('issue_date', '<=', $to);
        }

        $invoices = $query->orderByDesc('issue_date')->paginate(20)->withQueryString();

        // Sync overdue status
        Invoice::where('status', 'issued')
            ->whereDate('due_date', '<', now())
            ->update(['status' => 'overdue']);

        $summary = [
            'total_billed'  => Invoice::whereNotIn('status', ['draft', 'cancelled'])->sum('total'),
            'total_paid'    => Payment::sum('amount'),
            'total_overdue' => Invoice::where('status', 'overdue')->sum('total'),
            'draft_count'   => Invoice::where('status', 'draft')->count(),
        ];

        $clients = User::select('id', 'name', 'email')
            ->whereHas('invoices')
            ->orderBy('name')
            ->get();

        return Inertia::render('invoices/index', compact('invoices', 'summary', 'clients'));
    }

    // ── Create ─────────────────────────────────────────────────────────────

    public function create()
    {
        $clients  = User::select('id', 'name', 'email')->orderBy('name')->get();
        $projects = Project::select('id', 'name', 'client_id')->orderBy('name')->get();

        return Inertia::render('invoices/create', compact('clients', 'projects'));
    }

    // ── Store ──────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id'  => 'required|exists:users,id',
            'project_id' => 'nullable|exists:projects,id',
            'issue_date' => 'required|date',
            'due_date'   => 'required|date|after_or_equal:issue_date',
            'currency'   => 'required|string|size:3',
            'notes'      => 'nullable|string',
            'tax_rate'   => 'nullable|numeric|min:0|max:100',
            'lines'      => 'required|array|min:1',
            'lines.*.description' => 'required|string',
            'lines.*.quantity'    => 'required|numeric|min:0',
            'lines.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $lines    = collect($data['lines'])->map(fn ($l) => [
            'description' => $l['description'],
            'quantity'    => (float) $l['quantity'],
            'unit_price'  => (float) $l['unit_price'],
            'amount'      => round((float) $l['quantity'] * (float) $l['unit_price'], 2),
        ]);
        $subtotal = $lines->sum('amount');
        $taxRate  = (float) ($data['tax_rate'] ?? 0);
        $tax      = round($subtotal * $taxRate / 100, 2);
        $total    = $subtotal + $tax;

        $invoice = Invoice::create([
            'client_id'  => $data['client_id'],
            'project_id' => $data['project_id'] ?? null,
            'issue_date' => $data['issue_date'],
            'due_date'   => $data['due_date'],
            'currency'   => strtoupper($data['currency']),
            'notes'      => $data['notes'] ?? null,
            'status'     => 'draft',
            'lines'      => $lines->values()->toArray(),
            'subtotal'   => $subtotal,
            'tax'        => $tax,
            'total'      => $total,
        ]);

        return redirect()->route('web.invoices.show', $invoice)
            ->with('success', "Invoice {$invoice->number} created.");
    }

    // ── Show ───────────────────────────────────────────────────────────────

    public function show(Invoice $invoice)
    {
        $invoice->load('client:id,name,email', 'project:id,name', 'payments');
        

        return Inertia::render('invoices/show', [
            'invoice'    => $invoice,
            'amount_paid' => $invoice->amountPaid(),
            'amount_due'  => $invoice->amountDue(),
        ]);
    }

    // ── Edit / Update ──────────────────────────────────────────────────────

    public function edit(Invoice $invoice)
    {
        $invoice->load('client:id,name,email', 'project:id,name');
        $clients  = User::select('id', 'name', 'email')->orderBy('name')->get();
        $projects = Project::select('id', 'name', 'client_id')->orderBy('name')->get();

        return Inertia::render('invoices/edit', compact('invoice', 'clients', 'projects'));
    }

    public function update(Request $request, Invoice $invoice)
    {
        if (in_array($invoice->status, ['paid', 'cancelled'])) {
            return back()->with('error', 'Cannot edit a paid or cancelled invoice.');
        }

        $data = $request->validate([
            'client_id'  => 'required|exists:users,id',
            'project_id' => 'nullable|exists:projects,id',
            'issue_date' => 'required|date',
            'due_date'   => 'required|date|after_or_equal:issue_date',
            'currency'   => 'required|string|size:3',
            'notes'      => 'nullable|string',
            'tax_rate'   => 'nullable|numeric|min:0|max:100',
            'lines'      => 'required|array|min:1',
            'lines.*.description' => 'required|string',
            'lines.*.quantity'    => 'required|numeric|min:0',
            'lines.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $lines    = collect($data['lines'])->map(fn ($l) => [
            'description' => $l['description'],
            'quantity'    => (float) $l['quantity'],
            'unit_price'  => (float) $l['unit_price'],
            'amount'      => round((float) $l['quantity'] * (float) $l['unit_price'], 2),
        ]);
        $subtotal = $lines->sum('amount');
        $tax      = round($subtotal * (float) ($data['tax_rate'] ?? 0) / 100, 2);

        $invoice->update([
            'client_id'  => $data['client_id'],
            'project_id' => $data['project_id'] ?? null,
            'issue_date' => $data['issue_date'],
            'due_date'   => $data['due_date'],
            'currency'   => strtoupper($data['currency']),
            'notes'      => $data['notes'] ?? null,
            'lines'      => $lines->values()->toArray(),
            'subtotal'   => $subtotal,
            'tax'        => $tax,
            'total'      => $subtotal + $tax,
        ]);

        return redirect()->route('web.invoices.show', $invoice)
            ->with('success', 'Invoice updated.');
    }

    // ── Send / Mark Issued ─────────────────────────────────────────────────

    public function send(Invoice $invoice)
    {
        if (! in_array($invoice->status, ['draft', 'overdue'])) {
            return back()->with('error', 'Only draft invoices can be sent.');
        }

        $invoice->update([
            'status'  => 'issued',
            'sent_at' => now(),
        ]);

        return back()->with('success', "Invoice {$invoice->number} marked as sent.");
    }

    // ── Record Payment ─────────────────────────────────────────────────────

    public function recordPayment(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'amount'     => 'required|numeric|min:0.01',
            'method'     => 'required|string',   // mpesa|bank|cash|card|cheque
            'reference'  => 'nullable|string|max:255',
            'notes'      => 'nullable|string',
            'paid_at'    => 'required|date',
        ]);

        DB::transaction(function () use ($invoice, $data) {
            Payment::create([
                'invoice_id' => $invoice->id,
                'project_id' => $invoice->project_id,
                'amount'     => $data['amount'],
                'currency'   => $invoice->currency,
                'method'     => $data['method'],
                'reference'  => $data['reference'] ?? null,
                'notes'      => $data['notes'] ?? null,
                'paid_at'    => $data['paid_at'],
                'received_by' => Auth::id(),
            ]);

            // Mark fully paid when amount due reaches zero
            if ($invoice->fresh()->amountDue() <= 0) {
                $invoice->update(['status' => 'paid']);
            }
        });

        return back()->with('success', 'Payment recorded.');
    }

    // ── Cancel ─────────────────────────────────────────────────────────────

    public function cancel(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return back()->with('error', 'Cannot cancel a paid invoice.');
        }
        $invoice->update(['status' => 'cancelled']);
        return back()->with('success', 'Invoice cancelled.');
    }

    // ── Destroy ────────────────────────────────────────────────────────────

    public function destroy(Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return back()->with('error', 'Only draft invoices can be deleted.');
        }
        $invoice->delete();
        return redirect()->route('web.invoices.index')->with('success', 'Invoice deleted.');
    }
}
