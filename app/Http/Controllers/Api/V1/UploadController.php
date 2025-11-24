<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use App\Models\LeadDocument;

class UploadController extends Controller
{
    public function uploadLeadDocument(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx|max:10240',
            'lead_id' => 'nullable|exists:leads,id',
        ]);


        $file = $request->file('file');
        $path = $file->store('lead_documents');


        $doc = LeadDocument::create([
            'lead_id' => $request->input('lead_id'),
            'filename' => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'storage_path' => $path,
        ]);


        return response()->json(['ok' => true, 'document' => $doc]);
    }
}
