<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use App\Models\LeadDocument;
use App\Services\DocumentParserService;
use App\Jobs\ProcessLeadDocument;

class UploadController extends Controller
{
    public function uploadLeadDocument(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx|max:10240',
            'lead_id' => 'nullable|exists:leads,id',
        ]);


        $file = $request->file('file');
        $path = $file->storeAs('lead_documents', $file->hashName(), 'private');

        $doc = LeadDocument::create([
            'lead_id' => $request->input('lead_id'),
            'filename' => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'storage_path' => $path,
            'status' => LeadDocument::STATUS_QUEUED,
        ]);

        // best-effort extract
        try {
            $disk = Storage::disk('private');
            $absolutePath = method_exists($disk, 'path') ? $disk->path($path) : storage_path('app/' . $path);
            $parser = new DocumentParserService();
            $text = $parser->extractText($absolutePath, $file->getClientMimeType());
            if (!empty($text)) {
                $doc->extracted_text = ['text' => $text];
                $doc->save();
            }
        } catch (\Throwable $e) {
            report($e);
        }

        // dispatch background job
        try {
            ProcessLeadDocument::dispatch($doc->id)->onConnection('database');
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['ok' => true, 'document' => $doc]);
    }
}
