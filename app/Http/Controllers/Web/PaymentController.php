<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $payments = Payment::with('invoice:id,number', 'invoice.client:id,name')
            ->when($request->filled('invoice_id'), fn ($q) => $q->where('invoice_id', $request->invoice_id))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters'  => $request->only(['invoice_id']),
            'totals'   => [
                'month' => Payment::whereMonth('created_at', now()->month)->sum('amount'),
                'year'  => Payment::whereYear('created_at', now()->year)->sum('amount'),
            ],
        ]);
    }

    public function show(Payment $payment): Response
    {
        $payment->load('invoice.client');
        return Inertia::render('payments/show', compact('payment'));
    }
}