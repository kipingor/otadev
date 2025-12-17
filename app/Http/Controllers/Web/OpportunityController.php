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
        $query = $this->getModelQuery(Opportunity::class);

        $query = $this->orderByDesc($query, 'created_at');

        $opportunities = $this->paginateOpportunities($query, 15);

        if ($this->wantsJson($request)) {
            return $this->jsonResponse($opportunities);
        }

        return $this->renderInertia('opportunities/index', [
            'opportunities' => $opportunities,
        ]);
    }

    public function show(Request $request, $id)
    {
        $opportunity = $this->getModelWith(Opportunity::class, ['lead', 'owner'])->findOrFail($id);

        if ($this->wantsJson($request)) {
            return $this->jsonResponse($opportunity);
        }

        return $this->renderInertia('opportunities/show', [
            'opportunity' => $opportunity,
        ]);
    }

    public function create(Request $request)
    {
        $formOptions = $this->formOptions();

        return $this->renderInertia('opportunities/create', $formOptions);
    }

    public function edit(Request $request, Opportunity $opportunity)
    {
        $opportunity = $this->findModelById(Opportunity::class, $opportunity->id);
        $leads = Lead::select('id', 'title')->orderByDesc('created_at')->limit(100)->get();
        $owners = User::select('id', 'name')->orderBy('name')->get();
        $stageOptions = Opportunity::STAGES;
        $currencyOptions = config('app.supported_currencies', ['USD', 'EUR', 'GBP']);
        return Inertia::render('opportunities/edit', [
            'opportunity' => $opportunity,
            'leads' => $leads,
            'owners' => $owners,
            'stageOptions' => $stageOptions,
            'currencyOptions' => $currencyOptions,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateRequest($request, $this->rules());

        $opportunity = $this->createOpportunity($data);

        $this->flashSession('success', 'Opportunity created successfully.');

        return $this->redirectToRoute('opportunities.show', ['opportunity' => $opportunity->id]);
    }

    public function update(Request $request, $id)
    {
        $opportunity = $this->findModelById(Opportunity::class, $id);

        $data = $this->validateRequest($request, $this->rules());

        $this->updateOpportunity($opportunity, $data);

        $this->flashSession('success', 'Opportunity updated successfully.');

        return $this->redirectToRoute('opportunities.show', ['opportunity' => $opportunity->id]);
    }

    public function destroy(Request $request, $id)
    {
        $opportunity = $this->findModelById(Opportunity::class, $id);

        $this->deleteOpportunity($opportunity);

        $this->flashSession('success', 'Opportunity deleted successfully.');

        return $this->redirectToRoute('opportunities.index');
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

    private function createOpportunity(array $data)
    {
        return Opportunity::create($data);
    }

    private function updateOpportunity(Opportunity $opportunity, array $data)
    {
        return $opportunity->update($data);
    }

    private function deleteOpportunity(Opportunity $opportunity)
    {
        return $opportunity->delete();
    }

    private function paginateOpportunities($query, $perPage = 15)
    {
        return $query->paginate($perPage)->withQueryString();
    }

    private function orderByDesc($query, $column)
    {
        return $query->orderByDesc($column);
    }

    private function wantsJson(Request $request)
    {
        return $request->wantsJson();
    }

    private function jsonResponse($data)
    {
        return response()->json($data);
    }

    private function renderInertia(string $component, array $props = [])
    {
        return Inertia::render($component, $props);
    }

    private function getModelWith($model, array $relations)
    {
        return $model::with($relations);
    }

    private function findModelById($model, $id)
    {
        return $model::findOrFail($id);
    }

    private function arrayMerge(array $array1, array $array2)
    {
        return array_merge($array1, $array2);
    }

    private function compact(array $variables)
    {
        return compact($variables);
    }

    private function validateRequest(Request $request, array $rules): array
    {
        return $request->validate($rules);
    }

    private function flashSession(string $key, $value)
    {
        session()->flash($key, $value);
    }

    private function redirectToRoute(string $name, $parameters = [])
    {
        return redirect()->route($name, $parameters);
    }

    private function getModelQuery($model)
    {
        return $model::query();
    }
}
