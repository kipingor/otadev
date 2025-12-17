<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadDocumentRequest;
use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\DocumentParserService;
use App\Jobs\ProcessLeadDocument;
use App\Services\LeadDocumentService;

class LeadDocumentController extends Controller
{
    /**
     * Upload a document for a lead.
     */
    public function store(StoreLeadDocumentRequest $request): JsonResponse
    {
        $lead = Lead::findOrFail($request->input('lead_id'));

        $file = $request->file('file');

        $service = new LeadDocumentService(new DocumentParserService());
        $document = $service->store($lead, $file, $request->user());

        return response()->json([
            'message' => 'Document uploaded successfully',
            'data' => $document,
        ], 201);
    }

    /**
     * Get all documents for a lead.
     */
    public function index(Lead $lead): JsonResponse
    {
        $documents = $lead->leadDocuments()->latest()->get();

        return response()->json(['data' => $documents]);
    }

    /**
     * Delete a document.
     */
    public function destroy(LeadDocument $document, Request $request): JsonResponse
    {
        $service = new LeadDocumentService(new DocumentParserService());
        $service->delete($document, $request->user());

        return response()->json(['message' => 'Document deleted successfully']);
    }
}
