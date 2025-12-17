<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('accounting/index');
    }

    public function show(Request $request, $id)
    {
        return Inertia::render('accounting/show', ['id' => $id]);
    }

    public function create(Request $request)
    {
        return Inertia::render('accounting/create');
    }

    public function edit(Request $request, $id)
    {
        return Inertia::render('accounting/edit', ['id' => $id]);
    }

    public function report(Request $request)
    {
        return Inertia::render('accounting/report');
    }

    public function settings(Request $request)
    {
        return Inertia::render('accounting/settings');
    }

    public function dashboard(Request $request)
    {
        return Inertia::render('accounting/dashboard');
    }

    public function transactions(Request $request)
    {
        return Inertia::render('accounting/transactions');
    }

    public function invoices(Request $request)
    {
        return Inertia::render('accounting/invoices');
    }

    public function expenses(Request $request)
    {
        return Inertia::render('accounting/expenses');
    }

    public function payments(Request $request)
    {
        return Inertia::render('accounting/payments');
    }

    public function vendors(Request $request)
    {
        return Inertia::render('accounting/vendors');
    }

    public function accounts(Request $request)
    {
        return Inertia::render('accounting/accounts');
    }

    public function budgets(Request $request)
    {
        return Inertia::render('accounting/budgets');
    }

    public function taxes(Request $request)
    {
        return Inertia::render('accounting/taxes');
    }

    public function reports(Request $request)
    {
        return Inertia::render('accounting/reports');
    }

    public function ledgers(Request $request)
    {
        return Inertia::render('accounting/ledgers');
    }

    public function reconciliations(Request $request)
    {
        return Inertia::render('accounting/reconciliations');
    }

    public function audits(Request $request)
    {
        return Inertia::render('accounting/audits');
    }

    public function forecasts(Request $request)
    {
        return Inertia::render('accounting/forecasts');
    }

    public function statements(Request $request)
    {
        return Inertia::render('accounting/statements');
    }

    public function journals(Request $request)
    {
        return Inertia::render('accounting/journals');
    }

    public function categories(Request $request)
    {
        return Inertia::render('accounting/categories');
    }

    public function currencies(Request $request)
    {
        return Inertia::render('accounting/currencies');
    }

    public function paymentMethods(Request $request)
    {
        return Inertia::render('accounting/payment-methods');
    }

    public function fiscalYears(Request $request)
    {
        return Inertia::render('accounting/fiscal-years');
    }

    public function costCenters(Request $request)
    {
        return Inertia::render('accounting/cost-centers');
    }

    public function projects(Request $request)
    {
        return Inertia::render('accounting/projects');
    }

    public function assets(Request $request)
    {
        return Inertia::render('accounting/assets');
    }

    public function liabilities(Request $request)
    {
        return Inertia::render('accounting/liabilities');
    }

    public function equity(Request $request)
    {
        return Inertia::render('accounting/equity');
    }

    public function dividends(Request $request)
    {
        return Inertia::render('accounting/dividends');
    }

    public function payroll(Request $request)
    {
        return Inertia::render('accounting/payroll');
    }

    public function taxesPayable(Request $request)
    {
        return Inertia::render('accounting/taxes-payable');
    }

    public function taxesReceivable(Request $request)
    {
        return Inertia::render('accounting/taxes-receivable');
    }

    public function bankAccounts(Request $request)
    {
        return Inertia::render('accounting/bank-accounts');
    }

    public function creditCards(Request $request)
    {
        return Inertia::render('accounting/credit-cards');
    }

    public function loans(Request $request)
    {
        return Inertia::render('accounting/loans');
    }

    public function investments(Request $request)
    {
        return Inertia::render('accounting/investments');
    }

    public function shareholders(Request $request)
    {
        return Inertia::render('accounting/shareholders');
    }

    public function dividendsPayments(Request $request)
    {
        return Inertia::render('accounting/dividends-payments');
    }

    public function retainedEarnings(Request $request)
    {
        return Inertia::render('accounting/retained-earnings');
    }

    public function trialBalance(Request $request)
    {
        return Inertia::render('accounting/trial-balance');
    }

    public function balanceSheet(Request $request)
    {
        return Inertia::render('accounting/balance-sheet');
    }

    public function incomeStatement(Request $request)
    {
        return Inertia::render('accounting/income-statement');
    }

    public function cashFlowStatement(Request $request)
    {
        return Inertia::render('accounting/cash-flow-statement');
    }

    public function equityStatement(Request $request)
    {
        return Inertia::render('accounting/equity-statement');
    }

    public function notesToFinancials(Request $request)
    {
        return Inertia::render('accounting/notes-to-financials');
    }

    public function managementDiscussion(Request $request)
    {
        return Inertia::render('accounting/management-discussion');
    }

    public function auditorReport(Request $request)
    {
        return Inertia::render('accounting/auditor-report');
    }
}

