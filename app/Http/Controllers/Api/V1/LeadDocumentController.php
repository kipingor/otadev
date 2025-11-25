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

class LeadDocumentController extends Controller
{
    /**
     * Upload a document for a lead.
     */
    public function store(StoreLeadDocumentRequest $request): JsonResponse
    {
        $lead = Lead::findOrFail($request->input('lead_id'));

        $file = $request->file('file');
        $filename = $file->hashName();
        $path = $file->storeAs('lead_documents', $filename, 'private');

        $document = LeadDocument::create([
            'lead_id' => $lead->id,
            'filename' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'storage_path' => $path,
            'status' => LeadDocument::STATUS_QUEUED,
        ]);

        // Attempt to extract text quickly and persist it (best-effort),
        // then dispatch a job to run AI summarization in background.
        try {
            $disk = Storage::disk('private');
            $absolutePath = method_exists($disk, 'path') ? $disk->path($path) : storage_path('app/' . $path);
            $parser = new DocumentParserService();
            $text = $parser->extractText($absolutePath, $file->getMimeType());
            if (!empty($text)) {
                $document->extracted_text = ['text' => $text];
                $document->save();
            }
        } catch (\Throwable $e) {
            report($e);
        }

        // Dispatch background job to generate AI summary (non-blocking).
        try {
            // Dispatch to the database queue explicitly so jobs are processed by the
            // configured queue worker (run `php artisan queue:work` to process jobs).
            ProcessLeadDocument::dispatch($document->id)->onConnection('database');
        } catch (\Throwable $e) {
            report($e);
        }

        activity()
            ->performedOn($lead)
            ->causedBy($request->user())
            ->log("Document uploaded: {$file->getClientOriginalName()}");

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
        Storage::disk('private')->delete($document->storage_path);
        
        $document->delete();

        activity()
            ->performedOn($document->lead)
            ->causedBy($request->user())
            ->log("Document deleted: {$document->original_name}");

        return response()->json(['message' => 'Document deleted successfully']);
    }
}
