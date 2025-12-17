<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\StoreLeadDocumentRequest;
use App\Jobs\ProcessLeadDocument;
use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LeadDocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->getModelQuery(LeadDocument::class);
        $documents = $this->paginateDocuments($query, $request->input('per_page', 15));
        return $this->renderDocumentsView('documents.index', $documents);
    }

    public function create()
    {
        return Inertia::render('documents.create', $this->formOptions());
    }

    public function store(StoreLeadDocumentRequest $request)
    {
        $data = $request->validated();
        $document = $this->createDocument($data);
        return redirect()->route('documents.show', $document->id)
            ->with('success', 'Document created successfully');
    }

    public function show(LeadDocument $document)
    {
        return Inertia::render('documents.show', compact('document'));
    }

    public function edit(LeadDocument $document)
    {
        return Inertia::render('documents.edit', compact('document'));
    }

    public function update(UpdateLeadDocumentRequest $request, LeadDocument $document)
    {
        $data = $request->validated();
        $this->updateDocument($document, $data);
        return redirect()->route('documents.show', $document->id)
            ->with('success', 'Document updated successfully');
    }

    public function destroy(LeadDocument $document)
    {
        $this->authorize('delete', $document);

        $document->delete();

        return redirect()->route('documents.index')
            ->with('success', 'Document deleted successfully');
    }

    

    protected function formOptions(): array
    {
        return [
            'leads' => Lead::select('id', 'title')->orderByDesc('created_at')->limit(100)->get(),
        ];
    }
    protected function getModelQuery(string $modelClass): Builder
    {
        return $modelClass::query();
    }

    protected function orderByDesc(Builder $query, string $column): Builder
    {
        return $query->orderByDesc($column);
    }

    private function paginateDocuments(Builder $query, int $perPage): Collection
    {
        return $query->paginate($perPage);
    }

    private function jsonResponse(Collection $documents): JsonResponse
    {
        return response()->json($documents);
    }

    private function renderDocumentsView(string $view, Collection $documents): InertiaResponse
    {
        return Inertia::render($view, compact('documents'));
    }
}
