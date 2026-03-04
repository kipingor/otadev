<?php

namespace App\Services\Lead;

use App\Enums\LeadDocumentStatus;
use App\Models\LeadDocument;
use App\Models\Lead;
use App\Events\LeadDocumentUploaded;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LeadDocumentService
{
    /**
     * Upload and store a lead document
     *
     * @param Lead $lead
     * @param UploadedFile $file
     * @param array $additionalData
     * @return LeadDocument
     */
    public function upload(Lead $lead, UploadedFile $file, array $additionalData = []): LeadDocument
    {
        return DB::transaction(function () use ($lead, $file, $additionalData) {
            // Store the file
            $path = $file->store('lead-documents/' . $lead->id, 'private');

            // Create document record
            $document = LeadDocument::create([
                'lead_id' => $lead->id,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getClientOriginalExtension(),
                'file_size' => $file->getSize(),
                'processed' => false,
                'status' => LeadDocumentStatus::PENDING,
                'metadata' => $additionalData['metadata'] ?? [],
            ]);

            // Dispatch upload event
            event(new LeadDocumentUploaded($document));

            return $document;
        });
    }

    /**
     * Get document by ID
     *
     * @param int $documentId
     * @return LeadDocument
     */
    public function find(int $documentId): LeadDocument
    {
        return LeadDocument::findOrFail($documentId);
    }

    /**
     * Get all documents for a lead
     *
     * @param Lead $lead
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getByLead(Lead $lead)
    {
        return $lead->leadDocuments()->latest()->get();
    }

    /**
     * Update document metadata
     *
     * @param LeadDocument $document
     * @param array $metadata
     * @return LeadDocument
     */
    public function updateMetadata(LeadDocument $document, array $metadata): LeadDocument
    {
        $currentMetadata = $document->metadata ?? [];
        
        // Merge new metadata with existing
        $updatedMetadata = array_merge($currentMetadata, $metadata);

        $document->update([
            'metadata' => $updatedMetadata,
        ]);

        return $document->fresh();
    }

    /**
     * Mark document processing as failed
     *
     * @param LeadDocument $document
     * @param string $errorMessage
     * @return LeadDocument
     */
    public function markProcessingFailed(LeadDocument $document, string $errorMessage): LeadDocument
    {
        $metadata = $document->metadata ?? [];
        
        $metadata['processing_error'] = $errorMessage;
        $metadata['processing_failed_at'] = now()->toISOString();
        $metadata['processing_attempts'] = ($metadata['processing_attempts'] ?? 0) + 1;

        $document->update([
            'processed' => false,
            'status' => LeadDocumentStatus::FAILED,
            'metadata' => $metadata,
        ]);

        return $document->fresh();
    }

    /**
     * Mark document as successfully processed
     *
     * @param LeadDocument $document
     * @return LeadDocument
     */
    public function markProcessingSuccess(LeadDocument $document): LeadDocument
    {
        $metadata = $document->metadata ?? [];
        $metadata['processing_succeeded_at'] = now()->toISOString();
        
        // Remove error information if present
        unset($metadata['processing_error']);

        $document->update([
            'processed' => true,
            'status' => LeadDocumentStatus::SUCCEEDED,
            'metadata' => $metadata,
        ]);

        return $document->fresh();
    }

    /**
     * Delete a document
     *
     * @param LeadDocument $document
     * @return bool
     */
    public function delete(LeadDocument $document): bool
    {
        return DB::transaction(function () use ($document) {
            // Delete file from storage
            if (Storage::disk('private')->exists($document->file_path)) {
                Storage::disk('private')->delete($document->file_path);
            }

            // Delete database record
            return $document->delete();
        });
    }

    /**
     * Get document download URL
     *
     * @param LeadDocument $document
     * @param int $expirationMinutes
     * @return string
     */
    public function getDownloadUrl(LeadDocument $document, int $expirationMinutes = 60): string
    {
        return Storage::temporaryUrl(
            $document->file_path,
            now()->addMinutes($expirationMinutes)
        );
    }

    /**
     * Get document file path for reading
     *
     * @param LeadDocument $document
     * @return string
     */
    public function getFilePath(LeadDocument $document): string
    {
        return Storage::disk('private')->path($document->file_path);
    }

    /**
     * Check if document exists in storage
     *
     * @param LeadDocument $document
     * @return bool
     */
    public function fileExists(LeadDocument $document): bool
    {
        return Storage::disk('private')->exists($document->file_path);
    }

    /**
     * Get file contents
     *
     * @param LeadDocument $document
     * @return string
     */
    public function getFileContents(LeadDocument $document): string
    {
        if (!$this->fileExists($document)) {
            throw new \Exception('Document file not found');
        }

        return Storage::disk('private')->get($document->file_path);
    }

    /**
     * Update extracted text
     *
     * @param LeadDocument $document
     * @param string $text
     * @return LeadDocument
     */
    public function updateExtractedText(LeadDocument $document, string $text): LeadDocument
    {
        $document->update([
            'extracted_text' => $text,
        ]);

        return $document->fresh();
    }

    /**
     * Get documents by processing status
     *
     * @param bool $processed
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getByProcessingStatus(bool $processed)
    {
        return LeadDocument::where('processed', $processed)
            ->with('lead')
            ->latest()
            ->get();
    }

    /**
     * Get unprocessed documents
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getUnprocessed()
    {
        return $this->getByProcessingStatus(false);
    }

    /**
     * Get processed documents
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getProcessed()
    {
        return $this->getByProcessingStatus(true);
    }

    /**
     * Search documents by filename
     *
     * @param string $query
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function searchByFilename(string $query)
    {
        return LeadDocument::where('file_name', 'like', "%{$query}%")
            ->with('lead')
            ->latest()
            ->get();
    }

    /**
     * Search in extracted text
     *
     * @param string $query
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function searchInText(string $query)
    {
        return LeadDocument::whereNotNull('extracted_text')
            ->where('extracted_text', 'like', "%{$query}%")
            ->with('lead')
            ->latest()
            ->get();
    }

    /**
     * Get documents by file type
     *
     * @param string $fileType
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getByFileType(string $fileType)
    {
        return LeadDocument::where('file_type', $fileType)
            ->with('lead')
            ->latest()
            ->get();
    }

    /**
     * Get document statistics
     *
     * @return array
     */
    public function getStatistics(): array
    {
        return [
            'total' => LeadDocument::count(),
            'processed' => LeadDocument::where('processed', true)->count(),
            'unprocessed' => LeadDocument::where('processed', false)->count(),
            'total_size' => LeadDocument::sum('file_size'),
            'by_type' => LeadDocument::select('file_type', DB::raw('count(*) as count'))
                ->groupBy('file_type')
                ->get()
                ->pluck('count', 'file_type')
                ->toArray(),
        ];
    }

    /**
     * Duplicate a document to another lead
     *
     * @param LeadDocument $document
     * @param Lead $targetLead
     * @return LeadDocument
     */
    public function duplicateToLead(LeadDocument $document, Lead $targetLead): LeadDocument
    {
        return DB::transaction(function () use ($document, $targetLead) {
            // Copy file to new location
            $newPath = 'lead-documents/' . $targetLead->id . '/' . Str::random(40) . '.' . $document->file_type;
            
            Storage::disk('private')->copy(
                $document->file_path,
                $newPath
            );

            // Create new document record
            return LeadDocument::create([
                'lead_id' => $targetLead->id,
                'file_path' => $newPath,
                'file_name' => $document->file_name,
                'file_type' => $document->file_type,
                'file_size' => $document->file_size,
                'processed' => $document->processed,
                'extracted_text' => $document->extracted_text,
                'metadata' => array_merge(
                    $document->metadata ?? [],
                    ['duplicated_from' => $document->id]
                ),
            ]);
        });
    }

    /**
     * Bulk delete documents
     *
     * @param array $documentIds
     * @return int Number of documents deleted
     */
    public function bulkDelete(array $documentIds): int
    {
        $documents = LeadDocument::whereIn('id', $documentIds)->get();
        $deleted = 0;

        foreach ($documents as $document) {
            if ($this->delete($document)) {
                $deleted++;
            }
        }

        return $deleted;
    }

    /**
     * Get documents needing reprocessing (failed or old)
     *
     * @param int $daysOld
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getNeedingReprocessing(int $daysOld = 30)
    {
        return LeadDocument::where(function ($query) use ($daysOld) {
            // Failed processing
            $query->where('processed', false)
                ->whereNotNull('metadata->processing_error');
        })
        ->orWhere(function ($query) use ($daysOld) {
            // Old unprocessed documents
            $query->where('processed', false)
                ->where('created_at', '<', now()->subDays($daysOld));
        })
        ->with('lead')
        ->get();
    }

    /**
     * Validate file before upload
     *
     * @param UploadedFile $file
     * @param array $allowedTypes
     * @param int $maxSize
     * @return array Validation result
     */
    public function validateFile(
        UploadedFile $file,
        array $allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'csv'],
        int $maxSize = 10485760 // 10MB
    ): array {
        $errors = [];

        // Check file type
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $allowedTypes)) {
            $errors[] = "File type '{$extension}' is not allowed. Allowed types: " . implode(', ', $allowedTypes);
        }

        // Check file size
        if ($file->getSize() > $maxSize) {
            $maxSizeMB = round($maxSize / 1048576, 2);
            $errors[] = "File size exceeds maximum allowed size of {$maxSizeMB}MB";
        }

        // Check mime type
        $mimeType = $file->getMimeType();
        $allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv',
        ];

        if (!in_array($mimeType, $allowedMimes)) {
            $errors[] = "Invalid file mime type: {$mimeType}";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}