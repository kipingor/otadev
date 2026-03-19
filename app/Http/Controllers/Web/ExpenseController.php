<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $expenses = Expense::with('project:id,name')
            ->when($request->filled('project_id'), fn ($q) => $q->where('project_id', $request->project_id))
            ->when($request->filled('search'),     fn ($q) => $q->where('description', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('expenses/index', [
            'expenses' => $expenses,
            'filters'  => $request->only(['project_id', 'search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('expenses/create', [
            'projects' => \App\Models\Project::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id'  => ['nullable', 'exists:projects,id'],
            'description' => ['required', 'string', 'max:255'],
            'amount'      => ['required', 'numeric', 'min:0'],
            'currency'    => ['required', 'string', 'max:10'],
            'date'        => ['required', 'date'],
            'category'    => ['nullable', 'string', 'max:100'],
            'notes'       => ['nullable', 'string'],
            'receipt_url' => ['nullable', 'url'],
        ]);

        $data['created_by'] = Auth::id();
        Expense::create($data);

        return redirect()->route('web.expenses.index')->with('success', 'Expense recorded.');
    }

    public function edit(Expense $expense): Response
    {
        return Inertia::render('expenses/edit', [
            'expense'  => $expense,
            'projects' => \App\Models\Project::select(['id', 'name'])->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Expense $expense)
    {
        $data = $request->validate([
            'project_id'  => ['nullable', 'exists:projects,id'],
            'description' => ['required', 'string', 'max:255'],
            'amount'      => ['required', 'numeric', 'min:0'],
            'currency'    => ['required', 'string', 'max:10'],
            'date'        => ['required', 'date'],
            'category'    => ['nullable', 'string', 'max:100'],
            'notes'       => ['nullable', 'string'],
        ]);

        $expense->update($data);
        return redirect()->route('web.expenses.index')->with('success', 'Expense updated.');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return redirect()->route('web.expenses.index')->with('success', 'Expense deleted.');
    }
}