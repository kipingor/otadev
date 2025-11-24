<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OpportunityController extends Controller
{
    public function index(Request $request)
    {
        $opportunities = Opportunity::with('lead:id,title', 'owner:id,name')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('opportunities/index', compact('opportunities'));
    }

    public function create()
    {
        return Inertia::render('opportunities/create', $this->formOptions());
    }

    public function store(Request $request)
    {
        $data = $this->validate($request, $this->rules());
        $data['owner_id'] = $data['owner_id'] ?? $request->user()->id;

        $opportunity = Opportunity::create($data);

        return redirect()
            ->route('opportunities.show', $opportunity->id)
            ->with('success', 'Opportunity created.');
    }

    public function show(Opportunity $opportunity)
    {
        $opportunity->load('lead:id,title', 'owner:id,name', 'project:id,opportunity_id,name,status');

        return Inertia::render('opportunities/show', compact('opportunity'));
    }

    public function edit(Opportunity $opportunity)
    {
        $opportunity->load('lead:id,title', 'owner:id,name');

        return Inertia::render('opportunities/edit', array_merge(
            ['opportunity' => $opportunity],
            $this->formOptions()
        ));
    }

    public function update(Request $request, Opportunity $opportunity)
    {
        $data = $this->validate($request, $this->rules());
        $data['owner_id'] = $data['owner_id'] ?? $opportunity->owner_id ?? $request->user()->id;

        $opportunity->update($data);

        return redirect()
            ->route('opportunities.show', $opportunity->id)
            ->with('success', 'Opportunity updated.');
    }

    public function destroy(Opportunity $opportunity)
    {
        $opportunity->delete();

        return redirect()
            ->route('opportunities.index')
            ->with('success', 'Opportunity deleted.');
    }

    protected function formOptions(): array
    {
        return [
            'leads' => Lead::select('id', 'title')->orderByDesc('created_at')->limit(100)->get(),
            'owners' => User::select('id', 'name')->orderBy('name')->get(),
            'stageOptions' => Opportunity::STAGES,
            'currencyOptions' => config('app.supported_currencies', ['USD', 'EUR', 'GBP']),
        ];
    }

    protected function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'lead_id' => ['nullable', Rule::exists('leads', 'id')],
            'estimated_value' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'stage' => ['required', Rule::in(Opportunity::STAGES)],
            'owner_id' => ['nullable', Rule::exists('users', 'id')],
            'expected_close_date' => ['nullable', 'date'],
            'ai_suggestions' => ['nullable', 'array'],
        ];
    }
}

