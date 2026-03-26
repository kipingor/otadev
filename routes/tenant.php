<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\LeadController;
use App\Http\Controllers\Web\LeadDocumentController;
use App\Http\Controllers\Web\PipelineController;
use App\Http\Controllers\Web\OpportunityController;
use App\Http\Controllers\Web\ClientController;
use App\Http\Controllers\Web\ContactController;
use App\Http\Controllers\Web\ProjectController;
use App\Http\Controllers\Web\TenderController;
use App\Http\Controllers\Web\ProjectRiskController;
use App\Http\Controllers\Web\ProjectIssueController;
use App\Http\Controllers\Web\ProjectChangeController;
use App\Http\Controllers\Web\ProjectStakeholderController;
use App\Http\Controllers\Web\ProjectLessonController;
use App\Http\Controllers\Web\AccountingController;
use App\Http\Controllers\Web\InvoiceController;
use App\Http\Controllers\Web\PaymentController;
use App\Http\Controllers\Web\ExpenseController;
use App\Http\Controllers\Web\ClientFollowUpController;
use App\Http\Controllers\Web\ClientReportController;
use App\Http\Controllers\Web\SupplierController;
use App\Http\Controllers\Web\ProductController;
use App\Http\Controllers\Web\PurchaseOrderController;
use App\Http\Controllers\Web\DeliveryController;
use App\Http\Controllers\Web\HRController;
use App\Http\Controllers\Web\TimeLogController;
use App\Http\Controllers\Web\ReportsController;
use App\Http\Controllers\Web\LeadAnalyticsController;
use App\Http\Controllers\Web\ActivityController;
use App\Http\Controllers\Web\ConversationController;
use App\Http\Controllers\Web\EmailController;
use App\Http\Controllers\Web\AuditLogController;
use App\Http\Controllers\Web\MailgunWebhookController;

/*
|--------------------------------------------------------------------------
| Tenant Routes  (routes/tenant.php)
|--------------------------------------------------------------------------
| All authenticated application routes. Every group is protected by:
|   'auth'   — user must be logged in (Fortify)
|   'verified' — email must be verified
|   'tenant'  — EnsureActiveTenant middleware (resolves + validates tenant)
|
| Module gates:  middleware('module:key')
|   Prevents access if the tenant hasn't enabled that module.
|   Returns 403 JSON for Inertia/API calls, redirect for standard requests.
|
| In the current single-file web.php, these already exist in the
| main ['auth','verified'] group. To migrate:
|   1. Add 'tenant' to that group's middleware array
|   2. Wrap each section with the appropriate 'module:key' middleware
|
| Or: keep web.php as-is and add the middleware incrementally per section.
*/

// ── Mailgun inbound webhook (no auth — posted directly by Mailgun) ────────────
// Route::post('/webhooks/mailgun/inbound', [MailgunWebhookController::class, 'inbound'])
//     ->name('webhooks.mailgun.inbound')
//     ->withoutMiddleware(['web', 'auth', 'verified', 'tenant']);

// ══════════════════════════════════════════════════════════════════════════════
// All tenant-scoped authenticated routes
// ══════════════════════════════════════════════════════════════════════════════
// Route::middleware(['auth', 'verified', 'tenant'])->name('web.')->group(function () {

//     // ── Dashboard (always accessible — not behind a module gate) ──────────────
//     Route::get('/dashboard',              [DashboardController::class, 'index'])->name('dashboard');
//     Route::get('/api/dashboard/metrics',  [DashboardController::class, 'metrics'])->name('dashboard.metrics');
//     Route::post('/api/dashboard/clear-cache', [DashboardController::class, 'clearCache'])->name('dashboard.clear-cache');

//     // ── MODULE: leads ─────────────────────────────────────────────────────────
//     Route::middleware('module:leads')->prefix('leads')->name('leads.')->group(function () {
//         Route::get('/',           [LeadController::class, 'index'])->name('index');
//         Route::get('/create',     [LeadController::class, 'create'])->name('create');
//         Route::post('/',          [LeadController::class, 'store'])->name('store');
//         Route::get('/{lead}',     [LeadController::class, 'show'])->name('show');
//         Route::get('/{lead}/edit',[LeadController::class, 'edit'])->name('edit');
//         Route::put('/{lead}',     [LeadController::class, 'update'])->name('update');
//         Route::delete('/{lead}',  [LeadController::class, 'destroy'])->name('destroy');
//         Route::post('/{lead}/restore',    [LeadController::class, 'restore'])->name('restore');
//         Route::post('/{lead}/transition', [LeadController::class, 'transition'])->name('transition');

//         // Bulk ops
//         Route::delete('/bulk-delete',       [LeadController::class, 'bulkDelete'])->name('bulk-delete');
//         Route::post('/bulk-export',         [LeadController::class, 'bulkExport'])->name('bulk-export');
//         Route::patch('/bulk-update-status', [LeadController::class, 'bulkUpdateStatus'])->name('bulk-update-status');
//         Route::patch('/bulk-assign',        [LeadController::class, 'bulkAssign'])->name('bulk-assign');
//         Route::patch('/bulk-update-stage',  [LeadController::class, 'bulkUpdateStage'])->name('bulk-update-stage');

//         // Documents (nested under lead)
//         Route::prefix('{lead}/documents')->name('documents.')->group(function () {
//             Route::get('/',       [LeadDocumentController::class, 'index'])->name('index');
//             Route::get('/create', [LeadDocumentController::class, 'create'])->name('create');
//             Route::post('/',      [LeadDocumentController::class, 'store'])->name('store');
//         });
//     });

//     Route::middleware('module:leads')->prefix('lead-documents')->name('lead-documents.')->group(function () {
//         Route::get('/{document}',          [LeadDocumentController::class, 'show'])->name('show');
//         Route::get('/{document}/edit',     [LeadDocumentController::class, 'edit'])->name('edit');
//         Route::put('/{document}',          [LeadDocumentController::class, 'update'])->name('update');
//         Route::delete('/{document}',       [LeadDocumentController::class, 'destroy'])->name('destroy');
//         Route::get('/{document}/download', [LeadDocumentController::class, 'download'])->name('download');
//         Route::get('/{document}/preview',  [LeadDocumentController::class, 'preview'])->name('preview');
//     });

//     // ── MODULE: pipeline ──────────────────────────────────────────────────────
//     Route::middleware('module:pipeline')->group(function () {
//         Route::resource('pipelines', PipelineController::class);
//     });

//     // ── MODULE: opportunities ─────────────────────────────────────────────────
//     Route::middleware('module:opportunities')->group(function () {
//         Route::resource('opportunities', OpportunityController::class);
//     });

//     // ── MODULE: clients ───────────────────────────────────────────────────────
//     Route::middleware('module:clients')->group(function () {
//         Route::resource('clients', ClientController::class);
//         Route::get('leads/{lead}/convert-to-client',             [ClientController::class, 'convertFromLead'])->name('clients.convert-from-lead');
//         Route::get('opportunities/{opportunity}/convert-to-client', [ClientController::class, 'convertFromOpportunity'])->name('clients.convert-from-opportunity');
//     });

//     // ── MODULE: contacts (free-eligible) ──────────────────────────────────────
//     Route::middleware('module:contacts')->group(function () {
//         Route::resource('contacts', ContactController::class);
//         Route::post('contacts/{contact}/regenerate-email', [ContactController::class, 'regenerateEmail'])->name('contacts.regenerate-email');
//     });

//     // ── MODULE: projects ──────────────────────────────────────────────────────
//     Route::middleware('module:projects')->group(function () {
//         Route::resource('projects', ProjectController::class);
//         Route::post('projects/{project}/advance-phase',  [ProjectController::class, 'advancePhase'])->name('projects.advance-phase');
//         Route::post('projects/{project}/complete',       [ProjectController::class, 'complete'])->name('projects.complete');
//         Route::post('projects/{project}/team',           [ProjectController::class, 'addTeamMember'])->name('projects.team.add');
//         Route::delete('projects/{project}/team/{user}',  [ProjectController::class, 'removeTeamMember'])->name('projects.team.remove');
//         Route::get('projects/{project}/export',          [ProjectController::class, 'export'])->name('projects.export');

//         Route::post('projects/{project}/risks',          [ProjectRiskController::class, 'store'])->name('projects.risks.store');
//         Route::put('projects/{project}/risks/{risk}',    [ProjectRiskController::class, 'update'])->name('projects.risks.update');
//         Route::delete('projects/{project}/risks/{risk}', [ProjectRiskController::class, 'destroy'])->name('projects.risks.destroy');

//         Route::post('projects/{project}/issues',             [ProjectIssueController::class, 'store'])->name('projects.issues.store');
//         Route::put('projects/{project}/issues/{issue}',      [ProjectIssueController::class, 'update'])->name('projects.issues.update');
//         Route::delete('projects/{project}/issues/{issue}',   [ProjectIssueController::class, 'destroy'])->name('projects.issues.destroy');

//         Route::post('projects/{project}/changes',            [ProjectChangeController::class, 'store'])->name('projects.changes.store');
//         Route::put('projects/{project}/changes/{change}',    [ProjectChangeController::class, 'update'])->name('projects.changes.update');
//         Route::delete('projects/{project}/changes/{change}', [ProjectChangeController::class, 'destroy'])->name('projects.changes.destroy');

//         Route::post('projects/{project}/stakeholders',                 [ProjectStakeholderController::class, 'store'])->name('projects.stakeholders.store');
//         Route::put('projects/{project}/stakeholders/{stakeholder}',    [ProjectStakeholderController::class, 'update'])->name('projects.stakeholders.update');
//         Route::delete('projects/{project}/stakeholders/{stakeholder}', [ProjectStakeholderController::class, 'destroy'])->name('projects.stakeholders.destroy');

//         Route::post('projects/{project}/lessons',           [ProjectLessonController::class, 'store'])->name('projects.lessons.store');
//         Route::put('projects/{project}/lessons/{lesson}',   [ProjectLessonController::class, 'update'])->name('projects.lessons.update');
//         Route::delete('projects/{project}/lessons/{lesson}',[ProjectLessonController::class, 'destroy'])->name('projects.lessons.destroy');

//         Route::resource('tenders', TenderController::class);
//     });

//     // ── MODULE: accounting ────────────────────────────────────────────────────
//     Route::middleware('module:accounting')->group(function () {
//         Route::get('accounting', [AccountingController::class, 'index'])->name('accounting.index');

//         Route::resource('invoices', InvoiceController::class);
//         Route::post('invoices/{invoice}/send',    [InvoiceController::class, 'send'])->name('invoices.send');
//         Route::post('invoices/{invoice}/payment', [InvoiceController::class, 'recordPayment'])->name('invoices.payment');
//         Route::post('invoices/{invoice}/cancel',  [InvoiceController::class, 'cancel'])->name('invoices.cancel');

//         Route::resource('payments', PaymentController::class);
//         Route::resource('expenses', ExpenseController::class);

//         Route::get('follow-ups',              [ClientFollowUpController::class, 'index'])->name('follow-ups.index');
//         Route::post('follow-ups',             [ClientFollowUpController::class, 'store'])->name('follow-ups.store');
//         Route::put('follow-ups/{followUp}',   [ClientFollowUpController::class, 'update'])->name('follow-ups.update');
//         Route::post('follow-ups/{followUp}/complete', [ClientFollowUpController::class, 'complete'])->name('follow-ups.complete');
//         Route::delete('follow-ups/{followUp}',[ClientFollowUpController::class, 'destroy'])->name('follow-ups.destroy');

//         Route::get('client-reports',               [ClientReportController::class, 'index'])->name('client-reports.index');
//         Route::get('client-reports/create',        [ClientReportController::class, 'create'])->name('client-reports.create');
//         Route::post('client-reports',              [ClientReportController::class, 'store'])->name('client-reports.store');
//         Route::get('client-reports/{clientReport}',[ClientReportController::class, 'show'])->name('client-reports.show');
//         Route::post('client-reports/{clientReport}/send',   [ClientReportController::class, 'send'])->name('client-reports.send');
//         Route::delete('client-reports/{clientReport}',      [ClientReportController::class, 'destroy'])->name('client-reports.destroy');
//     });

//     // ── MODULE: supply_chain ──────────────────────────────────────────────────
//     Route::middleware('module:supply_chain')->group(function () {
//         Route::get('vendors', fn () => redirect()->route('web.suppliers.index'))->name('vendors.index');
//         Route::resource('suppliers', SupplierController::class);
//         Route::resource('products',  ProductController::class);

//         Route::resource('purchase-orders', PurchaseOrderController::class);
//         Route::post('purchase-orders/{purchaseOrder}/send',       [PurchaseOrderController::class, 'send'])->name('purchase-orders.send');
//         Route::post('purchase-orders/{purchaseOrder}/confirm',    [PurchaseOrderController::class, 'confirm'])->name('purchase-orders.confirm');
//         Route::post('purchase-orders/{purchaseOrder}/cancel',     [PurchaseOrderController::class, 'cancel'])->name('purchase-orders.cancel');
//         Route::post('purchase-orders/{purchaseOrder}/deliveries', [PurchaseOrderController::class, 'createDelivery'])->name('purchase-orders.create-delivery');
//         Route::post('purchase-orders/{purchaseOrder}/documents',  [PurchaseOrderController::class, 'uploadDocument'])->name('purchase-orders.upload-document');

//         Route::get('deliveries',             [DeliveryController::class, 'index'])->name('deliveries.index');
//         Route::get('deliveries/{delivery}',  [DeliveryController::class, 'show'])->name('deliveries.show');
//         Route::post('deliveries/{delivery}/dispatch', [DeliveryController::class, 'dispatch'])->name('deliveries.dispatch');
//         Route::post('deliveries/{delivery}/deliver',  [DeliveryController::class, 'deliver'])->name('deliveries.deliver');
//         Route::post('deliveries/{delivery}/reject',   [DeliveryController::class, 'reject'])->name('deliveries.reject');
//         Route::post('deliveries/{delivery}/documents',[DeliveryController::class, 'uploadDocument'])->name('deliveries.upload-document');
//         Route::post('delivery-documents/{document}/approve', [DeliveryController::class, 'approveDocument'])->name('delivery-documents.approve');
//     });

//     // ── MODULE: hr ────────────────────────────────────────────────────────────
//     Route::middleware('module:hr')->prefix('hr')->name('hr.')->group(function () {
//         Route::get('/',            [HRController::class, 'index'])->name('index');
//         Route::get('/staff',       [HRController::class, 'staff'])->name('staff');
//         Route::get('/staff/create',[HRController::class, 'create'])->name('staff.create');
//         Route::post('/staff',      [HRController::class, 'store'])->name('staff.store');
//         Route::get('/staff/{id}',  [HRController::class, 'show'])->name('staff.show');
//         Route::get('/staff/{id}/edit', [HRController::class, 'edit'])->name('staff.edit');
//         Route::put('/staff/{id}',  [HRController::class, 'update'])->name('staff.update');
//         Route::get('/leave',       [HRController::class, 'leave'])->name('leave');
//         Route::post('/leave/{leave}/approve', [HRController::class, 'approveLeave'])->name('leave.approve');
//         Route::post('/leave/{leave}/reject',  [HRController::class, 'rejectLeave'])->name('leave.reject');
//     });

//     Route::resource('time-logs', TimeLogController::class);

//     // ── MODULE: analytics ─────────────────────────────────────────────────────
//     Route::middleware('module:analytics')->group(function () {
//         Route::get('reports',               [ReportsController::class, 'index'])->name('reports.index');
//         Route::get('analytics/leads',       [LeadAnalyticsController::class, 'getLeadAnalytics'])->name('analytics.leads');
//         Route::get('analytics/performance', [LeadAnalyticsController::class, 'getPerformanceMetrics'])->name('analytics.performance');
//     });

//     // ── Always accessible (not behind module gates) ───────────────────────────
//     Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
//     Route::resource('activities',    ActivityController::class);
//     Route::resource('conversations', ConversationController::class);
//     Route::resource('emails', EmailController::class)->except(['edit', 'update']);
//     Route::get('emails/compose', [EmailController::class, 'compose'])->name('emails.compose');
// });