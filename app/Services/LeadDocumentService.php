<?php

namespace App\Services;

use App\Jobs\ProcessLeadDocument;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Services\DocumentParserService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LeadDocumentService
{
    protected DocumentParserService $parser;

    public function __construct(DocumentParserService $parser)
    {
        $this->parser = $parser;
    }

    public function store(Lead $lead, UploadedFile $file, $user): LeadDocument
    {
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

        // Best-effort synchronous parsing
        try {
            $disk = Storage::disk('private');
            $absolutePath = method_exists($disk, 'path') ? $disk->path($path) : storage_path('app/' . $path);
            $text = $this->parser->extractText($absolutePath, $file->getMimeType());
            if (!empty($text)) {
                $document->extracted_text = ['text' => $text];
                $document->save();
            }
        } catch (\Throwable $e) {
            report($e);
        }

        // Dispatch background processing job (non-blocking)
        try {
            ProcessLeadDocument::dispatch($document->id)->onConnection('database');
        } catch (\Throwable $e) {
            report($e);
        }

        try {
            activity()
                ->performedOn($lead)
                ->causedBy($user)
                ->log("Document uploaded: {$file->getClientOriginalName()}");
        } catch (\Throwable $e) {
            // ignore activity failures
        }

        return $document;
    }

    public function delete(LeadDocument $document, $user): void
    {
        try {
            Storage::disk('private')->delete($document->storage_path);
        } catch (\Throwable $e) {
            report($e);
        }

        try {
            $document->delete();
        } catch (\Throwable $e) {
            report($e);
            return;
        }

        try {
            activity()
                ->performedOn($document->lead)
                ->causedBy($user)
                ->log("Document deleted: {$document->original_name}");
        } catch (\Throwable $e) {
            // ignore
        }
    }
}
