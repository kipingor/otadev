<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use App\Models\PipelineStage;
use App\Services\Lead\LeadService;
use App\Enums\LeadStatus;
use App\Services\Lead\LeadStatusService;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Response;
use Inertia\Inertia;
use Carbon\Carbon;

class LeadController extends Controller
{
    public function __construct(
        protected LeadService $leadService,
        protected LeadStatusService $leadStatusService
    ) {
    }

    public function index()
    {
        $this->authorize('viewAny', Lead::class);

        $leads = $this->leadService->list(
            request()->only(['owner_id', 'pipeline_stage_id', 'status', 'search']),
            perPage: request()->integer('per_page', 5)
        );
        
        return Inertia::render('leads/index', [
            'leads' => $leads,
            'filters' => request()->only(['owner_id', 'pipeline_stage_id', 'status', 'search', 'per_page']),
            'pipelineStages' => PipelineStage::orderBy('order', 'asc')->get(),
            'users' => User::select('id', 'name')->get(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Lead::class);

        return Inertia::render('leads/create', [
            'pipelineStages' => PipelineStage::orderBy('order', 'asc')->get(),
            'users' => User::select(['id', 'name', 'email'])->get(),
        ]);
    }


    public function store(StoreLeadRequest $request): RedirectResponse
    {
        $lead = $this->leadService->create($request->validated());

        return redirect()
            ->route('leads.show', $lead)
            ->with('success', 'Lead created successfully.');
    }

    public function show(Lead $lead)
    {
        $this->authorize('view', $lead);

        $lead->load([
            'owner',
            'user',
            'pipelineStage',
            'questions',
            'leadDocuments',
            'opportunity',
            'proposals',
            'activities' => fn ($q) => $q->latest()->limit(10),
        ]);

        return Inertia::render('leads/show', [
            'lead' => $lead,
            'availableTransitions' => $this->leadStatusService->getAvailableTransitions($lead),
            'statusHistory' => $this->leadStatusService->getStatusHistory($lead),
        ]);
    }

    public function edit(Lead $lead): Response
    {
        $this->authorize('update', $lead);

        return Inertia::render('leads/edit', [
            'lead' => $lead->load(['owner', 'pipelineStage']),
            'pipelineStages' => PipelineStage::orderBy('order', 'asc')->get(),
            'users' => User::select('id', 'name', 'email')->get(),
        ]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead)
    {
        $this->leadService->update($lead, $request->validated());

        return back()->with('success', 'Lead updated.');
    }

    public function destroy(Lead $lead)
    {
        $this->authorize('delete', $lead);

        $this->leadService->delete($lead);

        return redirect()
            ->route('leads.index')
            ->with('success', 'Lead deleted.');
    }

    /**
     * Restore a soft-deleted lead
     */
    public function restore(int $id): RedirectResponse
    {
        $lead = Lead::withTrashed()->findOrFail($id);
        
        $this->authorize('restore', $lead);

        $this->leadService->restore($lead);

        return redirect()
            ->route('leads.show', $lead)
            ->with('success', 'Lead restored successfully.');
    }

    /**
     * Bulk delete leads
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'lead_ids' => 'required|array',
            'lead_ids.*' => 'required|integer|exists:leads,id',
        ]);

        try {
            DB::beginTransaction();

            $leadIds = $request->input('lead_ids');
            
            // Get leads with authorization check
            $leads = Lead::whereIn('id', $leadIds)
                ->where(function ($query) use ($request) {
                    // Only allow deletion if user owns the lead or is admin
                    if (!$request->user()->isAdmin()) {
                        $query->where('owner_id', $request->user()->id);
                    }
                })
                ->get();

            $successCount = 0;
            $failedCount = 0;
            $errors = [];

            foreach ($leads as $lead) {
                try {
                    $lead->delete();
                    $successCount++;
                } catch (\Exception $e) {
                    $failedCount++;
                    $errors[] = "Failed to delete lead #{$lead->id}: {$e->getMessage()}";
                    Log::error("Bulk delete failed for lead #{$lead->id}", [
                        'error' => $e->getMessage(),
                        'user_id' => $request->user()->id,
                    ]);
                }
            }

            DB::commit();

            return redirect()->back()->with('flash', [
                'bulkResult' => [
                    'success' => $failedCount === 0,
                    'successCount' => $successCount,
                    'failedCount' => $failedCount,
                    'errors' => $errors,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk delete operation failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return redirect()->back()->withErrors([
                'bulk_operation' => 'Failed to delete leads. Please try again.',
            ]);
        }
    }

    /**
     * Bulk export leads
     *
     * @param Request $request
     * @return StreamedResponse
     */
    public function bulkExport(Request $request)
    {
        $request->validate([
            'lead_ids' => 'required|array',
            'lead_ids.*' => 'required|integer|exists:leads,id',
            'format' => 'sometimes|in:csv,xlsx',
        ]);

        $leadIds = $request->input('lead_ids');
        $format = $request->input('format', 'csv');

        // Get leads with relationships
        $leads = Lead::with(['owner', 'pipelineStage'])
            ->whereIn('id', $leadIds)
            ->where(function ($query) use ($request) {
                if (!$request->user()->isAdmin()) {
                    $query->where('owner_id', $request->user()->id);
                }
            })
            ->get();

        if ($format === 'csv') {
            return $this->exportAsCSV($leads);
        } else {
            return $this->exportAsExcel($leads);
        }
    }

    /**
     * Export leads as CSV
     *
     * @param \Illuminate\Support\Collection $leads
     * @return StreamedResponse
     */
    private function exportAsCSV($leads)
    {
        $filename = 'leads_export_' . date('Y-m-d_His') . '.csv';

        return response()->stream(function () use ($leads) {
            $handle = fopen('php://output', 'w');

            // CSV Headers
            fputcsv($handle, [
                'ID',
                'Title',
                'Description',
                'Status',
                'Type',
                'Owner',
                'Pipeline Stage',
                'Created At',
                'Updated At',
            ]);

            // CSV Rows
            foreach ($leads as $lead) {
                fputcsv($handle, [
                    $lead->id,
                    $lead->title,
                    $lead->description,
                    $lead->status,
                    $lead->type,
                    $lead->owner?->name ?? 'Unassigned',
                    $lead->pipelineStage?->name ?? 'No Stage',
                    $lead->created_at?->format('Y-m-d H:i:s'),
                    $lead->updated_at?->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Export leads as Excel (requires maatwebsite/excel package)
     *
     * @param \Illuminate\Support\Collection $leads
     * @return StreamedResponse
     */
    private function exportAsExcel($leads)
    {
        // Note: You'll need to install maatwebsite/excel package
        // composer require maatwebsite/excel
        
        // For now, we'll export as CSV with .xlsx extension
        // Replace this with proper Excel export using maatwebsite/excel
        $filename = 'leads_export_' . date('Y-m-d_His') . '.xlsx';

        return response()->stream(function () use ($leads) {
            $handle = fopen('php://output', 'w');

            // CSV Headers
            fputcsv($handle, [
                'ID',
                'Title',
                'Description',
                'Status',
                'Type',
                'Owner',
                'Pipeline Stage',
                'Created At',
                'Updated At',
            ]);

            // CSV Rows
            foreach ($leads as $lead) {
                fputcsv($handle, [
                    $lead->id,
                    $lead->title,
                    $lead->description,
                    $lead->status,
                    $lead->type,
                    $lead->owner?->name ?? 'Unassigned',
                    $lead->pipelineStage?->name ?? 'No Stage',
                    $lead->created_at?->format('Y-m-d H:i:s'),
                    $lead->updated_at?->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Bulk update lead status
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'lead_ids' => 'required|array',
            'lead_ids.*' => 'required|integer|exists:leads,id',
            'status' => 'required|in:new,contacted,qualified,proposal_sent,negotiation,won,lost,archived',
        ]);

        try {
            DB::beginTransaction();

            $leadIds = $request->input('lead_ids');
            $status = LeadStatus::from($request->string('status'));

            $successCount = Lead::whereIn('id', $leadIds)
                ->where(function ($query) use ($request) {
                    if (!$request->user()->isAdmin()) {
                        $query->where('owner_id', $request->user()->id);
                    }
                })
                ->update(['status' => $status]);

            DB::commit();

            return redirect()->back()->with('flash', [
                'bulkResult' => [
                    'success' => true,
                    'successCount' => $successCount,
                    'failedCount' => 0,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk status update failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return redirect()->back()->withErrors([
                'bulk_operation' => 'Failed to update lead status. Please try again.',
            ]);
        }
    }

    /**
     * Bulk assign leads to owner
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function bulkAssign(Request $request)
    {
        $request->validate([
            'lead_ids' => 'required|array',
            'lead_ids.*' => 'required|integer|exists:leads,id',
            'owner_id' => 'required|integer|exists:users,id',
        ]);

        try {
            DB::beginTransaction();

            $leadIds = $request->input('lead_ids');
            $ownerId = $request->input('owner_id');

            $successCount = Lead::whereIn('id', $leadIds)
                ->where(function ($query) use ($request) {
                    if (!$request->user()->isAdmin()) {
                        $query->where('owner_id', $request->user()->id);
                    }
                })
                ->update(['owner_id' => $ownerId]);

            DB::commit();

            return redirect()->back()->with('flash', [
                'bulkResult' => [
                    'success' => true,
                    'successCount' => $successCount,
                    'failedCount' => 0,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk assignment failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return redirect()->back()->withErrors([
                'bulk_operation' => 'Failed to assign leads. Please try again.',
            ]);
        }
    }

    /**
     * Bulk update pipeline stage
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function bulkUpdateStage(Request $request)
    {
        $request->validate([
            'lead_ids' => 'required|array',
            'lead_ids.*' => 'required|integer|exists:leads,id',
            'pipeline_stage_id' => 'required|integer|exists:pipeline_stages,id',
        ]);

        try {
            DB::beginTransaction();

            $leadIds = $request->input('lead_ids');
            $stageId = $request->input('pipeline_stage_id');

            $successCount = Lead::whereIn('id', $leadIds)
                ->where(function ($query) use ($request) {
                    if (!$request->user()->isAdmin()) {
                        $query->where('owner_id', $request->user()->id);
                    }
                })
                ->update(['pipeline_stage_id' => $stageId]);

            DB::commit();

            return redirect()->back()->with('flash', [
                'bulkResult' => [
                    'success' => true,
                    'successCount' => $successCount,
                    'failedCount' => 0,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk stage update failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return redirect()->back()->withErrors([
                'bulk_operation' => 'Failed to update pipeline stage. Please try again.',
            ]);
        }
    }

    /**
     * Import leads from CSV/Excel file
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:10240', // Max 10MB
        ]);

        try {
            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension();

            // Parse file based on extension
            if ($extension === 'csv') {
                $leads = $this->parseCSV($file);
            } else {
                $leads = $this->parseExcel($file);
            }

            // Validate and import leads
            $result = $this->importLeads($leads, $request->user());

            return redirect()->back()->with('flash', [
                'importResult' => $result,
            ]);

        } catch (\Exception $e) {
            Log::error('Lead import failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return redirect()->back()->withErrors([
                'import' => 'Failed to import leads. Please check your file format.',
            ]);
        }
    }

    /**
     * Parse CSV file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return array
     */
    private function parseCSV($file)
    {
        $leads = [];
        $handle = fopen($file->getRealPath(), 'r');
        
        // Read header row
        $header = fgetcsv($handle);
        
        if (!$header) {
            throw new \Exception('Invalid CSV format - no header row found.');
        }

        // Normalize headers (trim, lowercase)
        $header = array_map(function ($h) {
            return strtolower(trim($h));
        }, $header);

        // Read data rows
        $rowNumber = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            
            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            // Combine header with row data
            $leadData = array_combine($header, $row);
            $leadData['_row'] = $rowNumber; // Track row number for error reporting
            
            $leads[] = $leadData;
        }

        fclose($handle);

        return $leads;
    }

    /**
     * Parse Excel file
     * Requires: composer require phpoffice/phpspreadsheet
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return array
     */
    private function parseExcel($file)
    {
        // Note: Install phpoffice/phpspreadsheet for Excel support
        // composer require phpoffice/phpspreadsheet

        if (!class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
            throw new \Exception('PhpSpreadsheet not installed. Please run: composer require phpoffice/phpspreadsheet');
        }

        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        if (empty($rows)) {
            throw new \Exception('Excel file is empty.');
        }

        // First row is header
        $header = array_map(function ($h) {
            return strtolower(trim($h));
        }, array_shift($rows));

        $leads = [];
        foreach ($rows as $index => $row) {
            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            $leadData = array_combine($header, $row);
            $leadData['_row'] = $index + 2; // +2 because: 0-indexed + header row
            
            $leads[] = $leadData;
        }

        return $leads;
    }

    /**
     * Validate and import leads
     *
     * @param array $leads
     * @param \App\Models\User $user
     * @return array
     */
    private function importLeads(array $leads, User $user)
    {
        $imported = 0;
        $failed = 0;
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($leads as $leadData) {
                $rowNumber = $leadData['_row'] ?? 0;
                unset($leadData['_row']);

                // Validate lead data
                $validator = Validator::make($leadData, [
                    'title' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'type' => 'nullable|in:business,individual',
                    'status' => 'nullable|in:new,contacted,qualified,proposal_sent,negotiation,won,lost,archived',
                    'owner_email' => 'nullable|email|exists:users,email',
                ]);

                if ($validator->fails()) {
                    $failed++;
                    foreach ($validator->errors()->all() as $error) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'field' => '',
                            'message' => $error,
                        ];
                    }
                    continue;
                }

                try {
                    // Find owner by email or use current user
                    $owner = null;
                    if (!empty($leadData['owner_email'])) {
                        $owner = User::where('email', $leadData['owner_email'])->first();
                    }
                    $ownerId = $owner ? $owner->id : $user->id;

                    // Create lead
                    Lead::create([
                        'title' => $leadData['title'],
                        'description' => $leadData['description'] ?? null,
                        'type' => $leadData['type'] ?? 'business',
                        'status' => $leadData['status'] ?? 'new',
                        'owner_id' => $ownerId,
                    ]);

                    $imported++;

                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = [
                        'row' => $rowNumber,
                        'field' => '',
                        'message' => 'Failed to create lead: ' . $e->getMessage(),
                    ];
                    
                    Log::error('Failed to import lead', [
                        'row' => $rowNumber,
                        'data' => $leadData,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            return [
                'success' => $failed === 0,
                'imported' => $imported,
                'failed' => $failed,
                'errors' => $errors,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Lead import transaction failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            throw $e;
        }
    }

    /**
     * Download import template
     *
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function downloadTemplate()
    {
        $filename = 'leads_import_template.csv';

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');

            // CSV Headers
            fputcsv($handle, [
                'title',
                'description',
                'type',
                'status',
                'owner_email',
            ]);

            // Example rows
            fputcsv($handle, [
                'Example Lead 1',
                'A potential customer interested in our services',
                'business',
                'new',
                'sales@example.com',
            ]);

            fputcsv($handle, [
                'Example Lead 2',
                'Individual looking for consultation',
                'individual',
                'contacted',
                'manager@example.com',
            ]);

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
