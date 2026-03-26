<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\OpportunityController;
use App\Http\Controllers\Web\ProjectController;
use App\Http\Controllers\Web\HRController;
use App\Http\Controllers\Web\MailgunWebhookController;
use App\Http\Controllers\Web\AccountingController;
use App\Http\Controllers\Web\ClientReportController;
use App\Http\Controllers\Web\ClientFollowUpController;
use App\Http\Controllers\Web\InvoiceController;
use App\Http\Controllers\Web\PipelineController;
use App\Http\Controllers\Web\ActivityController;
use App\Http\Controllers\Web\ConversationController;
use App\Http\Controllers\Web\SupplierController;
use App\Http\Controllers\Web\DeliveryController;
use App\Http\Controllers\Web\PurchaseOrderController;
use App\Http\Controllers\Web\ProductController;
use App\Http\Controllers\Web\ClientController;
use App\Http\Controllers\Web\ReportsController;
use App\Http\Controllers\Web\LeadAnalyticsController;
use App\Http\Controllers\Web\ContactController;
use App\Http\Controllers\Web\TenderController;
use App\Http\Controllers\Web\ProjectRiskController;
use App\Http\Controllers\Web\ProjectIssueController;
use App\Http\Controllers\Web\ProjectChangeController;
use App\Http\Controllers\Web\ProjectStakeholderController;
use App\Http\Controllers\Web\ProjectLessonController;
use App\Http\Controllers\Web\LeadController;
use App\Http\Controllers\Web\LeadDocumentController;
use App\Http\Controllers\Web\ExpenseController;
use App\Http\Controllers\Web\PaymentController;
use App\Http\Controllers\Web\AuditLogController;
use App\Http\Controllers\Web\EmailController;
use App\Http\Controllers\Web\TimeLogController;
use App\Http\Controllers\Web\Onboarding\OnboardingController;
use App\Http\Controllers\Web\Onboarding\SubscriptionController;
use App\Http\Controllers\Web\Onboarding\TenantSwitchController;
use App\Http\Controllers\SuperAdmin\TenantController as SuperAdminTenantController;

// ── Mailgun inbound webhook (no auth — Mailgun posts here) ────────────────────
Route::post('/webhooks/mailgun/inbound', [MailgunWebhookController::class, 'inbound'])
    ->name('webhooks.mailgun.inbound')
    ->withoutMiddleware(['web', 'auth', 'verified']);

// ── Public root ───────────────────────────────────────────────────────────────
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('web.dashboard');
    }
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/welcome', function () {
    return redirect()->route('home');
});

// ══════════════════════════════════════════════════════════════════════════════
// CENTRAL ROUTES — auth required, but NO tenant middleware.
// These must be outside the 'tenant' group because they are used to CREATE
// or SELECT a tenant. If they were inside the tenant group, EnsureActiveTenant
// would fire and redirect new users here → infinite loop.
// ══════════════════════════════════════════════════════════════════════════════
Route::middleware(['auth', 'verified'])->group(function () {

    // ── Onboarding (workspace creation + freemium module picker) ─────────────
    Route::prefix('onboarding')->name('onboarding.')->group(function () {
        Route::get('/',              [OnboardingController::class, 'index'])->name('index');
        Route::get('/create',        [OnboardingController::class, 'create'])->name('create');
        Route::post('/create',       [OnboardingController::class, 'store'])->name('store');
        Route::get('/pick-module',   [OnboardingController::class, 'pickModule'])->name('pick-module');
        Route::post('/pick-module',  [OnboardingController::class, 'saveModule'])->name('save-module');
        Route::get('/complete',      [OnboardingController::class, 'complete'])->name('complete');
    });

    Route::get('/subscription/paystack/callback', [SubscriptionController::class, 'paystackCallback'])
        ->name('subscription.paystack.callback');

    // ── Workspace switcher (multi-tenant users switch between workspaces) ─────
    Route::get('/switch-tenant',           [TenantSwitchController::class, 'index'])->name('tenant.switch');
    Route::post('/switch-tenant/{tenant}', [TenantSwitchController::class, 'switch'])->name('tenant.switch.post');
    Route::get('/create-tenant',           [TenantSwitchController::class, 'create'])->name('tenant.create');
});

// ── Subscription status walls (auth + tenant, but NO expired/suspended check) ─
// These must be accessible even when the tenant is suspended or trial-expired,
// so EnsureActiveTenant explicitly allows subscription.* routes through.
Route::middleware(['auth', 'verified', 'tenant'])->prefix('subscription')->name('subscription.')->group(function () {
    Route::get('/plans',    [SubscriptionController::class, 'plans'])->name('plans');
    Route::post('/upgrade', [SubscriptionController::class, 'upgrade'])->name('upgrade');
    Route::post('/cancel',  [SubscriptionController::class, 'cancel'])->name('cancel');
    Route::get('/billing',  [SubscriptionController::class, 'billing'])->name('billing');
    Route::get('/expired',  [SubscriptionController::class, 'expired'])->name('expired');
    Route::get('/suspended',[SubscriptionController::class, 'suspended'])->name('suspended');
});

// ── Super Admin (requires 'super-admin' role, no tenant scoping) ─────────────
Route::middleware(['auth', 'verified', 'can:manage-tenants'])
    ->prefix('super-admin')
    ->name('super-admin.')
    ->group(function () {
        Route::get('/', fn () => redirect()->route('super-admin.tenants.index'));
        Route::get('/tenants',                   [SuperAdminTenantController::class, 'index'])->name('tenants.index');
        Route::get('/tenants/{tenant}',          [SuperAdminTenantController::class, 'show'])->name('tenants.show');
        Route::patch('/tenants/{tenant}/plan',   [SuperAdminTenantController::class, 'updatePlan'])->name('tenants.plan');
        Route::patch('/tenants/{tenant}/status', [SuperAdminTenantController::class, 'updateStatus'])->name('tenants.status');
        Route::post('/tenants/{tenant}/impersonate', [SuperAdminTenantController::class, 'impersonate'])->name('tenants.impersonate');
    });

// ══════════════════════════════════════════════════════════════════════════════
// TENANT ROUTES — auth + verified + tenant middleware
// EnsureActiveTenant resolves the tenant from the user's current_tenant_id.
// If no tenant is found, it redirects to onboarding.create (defined above).
// ══════════════════════════════════════════════════════════════════════════════
Route::middleware(['auth', 'verified', 'tenant'])->name('web.')->group(function () {
    Route::post('/subscription/webhook/stripe', [SubscriptionController::class, 'stripeWebhook'])
        ->name('subscription.webhook.paystack');

    // ── Dashboard ─────────────────────────────────────────────────────────────
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/dashboard/metrics', [DashboardController::class, 'metrics'])->name('dashboard.metrics');
    Route::post('/api/dashboard/clear-cache', [DashboardController::class, 'clearCache'])->name('dashboard.clear-cache');

    // ── Leads ─────────────────────────────────────────────────────────────────
    Route::prefix('leads')->name('leads.')->group(function () {
        Route::get('/',          [LeadController::class, 'index'])->name('index');
        Route::get('/create',    [LeadController::class, 'create'])->name('create');
        Route::post('/',         [LeadController::class, 'store'])->name('store');
        Route::get('/{lead}',    [LeadController::class, 'show'])->name('show');
        Route::get('/{lead}/edit',   [LeadController::class, 'edit'])->name('edit');
        Route::put('/{lead}',        [LeadController::class, 'update'])->name('update');
        Route::delete('/{lead}',     [LeadController::class, 'destroy'])->name('destroy');
        Route::post('/{lead}/restore',    [LeadController::class, 'restore'])->name('restore');
        Route::post('/{lead}/transition', [LeadController::class, 'transition'])->name('transition');

        Route::delete('/bulk-delete',         [LeadController::class, 'bulkDelete'])->name('bulk-delete');
        Route::post('/bulk-export',           [LeadController::class, 'bulkExport'])->name('bulk-export');
        Route::patch('/bulk-update-status',   [LeadController::class, 'bulkUpdateStatus'])->name('bulk-update-status');
        Route::patch('/bulk-assign',          [LeadController::class, 'bulkAssign'])->name('bulk-assign');
        Route::patch('/bulk-update-stage',    [LeadController::class, 'bulkUpdateStage'])->name('bulk-update-stage');

        Route::prefix('{lead}/documents')->name('documents.')->group(function () {
            Route::get('/',       [LeadDocumentController::class, 'index'])->name('index');
            Route::get('/create', [LeadDocumentController::class, 'create'])->name('create');
            Route::post('/',      [LeadDocumentController::class, 'store'])->name('store');
        });
    });

    Route::prefix('lead-documents')->name('lead-documents.')->group(function () {
        Route::get('/{document}',          [LeadDocumentController::class, 'show'])->name('show');
        Route::get('/{document}/edit',     [LeadDocumentController::class, 'edit'])->name('edit');
        Route::put('/{document}',          [LeadDocumentController::class, 'update'])->name('update');
        Route::delete('/{document}',       [LeadDocumentController::class, 'destroy'])->name('destroy');
        Route::get('/{document}/download', [LeadDocumentController::class, 'download'])->name('download');
        Route::get('/{document}/preview',  [LeadDocumentController::class, 'preview'])->name('preview');
    });

    // ── Pipeline ──────────────────────────────────────────────────────────────
    Route::resource('pipelines', PipelineController::class);

    // ── Opportunities ─────────────────────────────────────────────────────────
    Route::resource('opportunities', OpportunityController::class);

    // ── Client CRM ────────────────────────────────────────────────────────────
    Route::resource('clients', ClientController::class);
    Route::get('leads/{lead}/convert-to-client',
        [ClientController::class, 'convertFromLead'])->name('leads.convert-to-client');
    Route::get('opportunities/{opportunity}/convert-to-client',
        [ClientController::class, 'convertFromOpportunity'])->name('opportunities.convert-to-client');

    // ── Contacts ──────────────────────────────────────────────────────────────
    Route::resource('contacts', ContactController::class);
    Route::post('contacts/{contact}/regenerate-email',  [ContactController::class, 'regenerateEmail'])->name('contacts.regenerate-email');
    Route::post('contacts/{contact}/mark-initial-sent', [ContactController::class, 'markInitialSent'])->name('contacts.mark-initial-sent');
    Route::post('contacts/{contact}/convert-to-lead',   [ContactController::class, 'convertToLead'])->name('contacts.convert-to-lead');
    Route::post('contacts/{contact}/follow-ups/{followUp}/send', [ContactController::class, 'sendFollowUp'])->name('contacts.follow-ups.send');
    Route::patch('contacts/{contact}/follow-ups/{followUp}',     [ContactController::class, 'updateFollowUp'])->name('contacts.follow-ups.update');

    // ── Tenders & RFPs ────────────────────────────────────────────────────────
    Route::resource('tenders', TenderController::class);
    Route::post('tenders/{tender}/reanalyze',          [TenderController::class, 'reanalyze'])->name('tenders.reanalyze');
    Route::post('tenders/{tender}/generate-document',  [TenderController::class, 'generateDocument'])->name('tenders.generate-document');
    Route::post('tenders/{tender}/chat',               [TenderController::class, 'chat'])->name('tenders.chat');
    Route::post('tenders/{tender}/answer-gap',         [TenderController::class, 'answerGap'])->name('tenders.answer-gap');
    Route::post('tenders/{tender}/toggle-checklist',   [TenderController::class, 'toggleChecklist'])->name('tenders.toggle-checklist');
    Route::post('tenders/{tender}/submit',             [TenderController::class, 'submit'])->name('tenders.submit');
    Route::post('tenders/{tender}/won',                [TenderController::class, 'markWon'])->name('tenders.won');
    Route::post('tenders/{tender}/lost',               [TenderController::class, 'markLost'])->name('tenders.lost');
    Route::post('tenders/{tender}/convert-to-project', [TenderController::class, 'convertToProject'])->name('tenders.convert-to-project');
    Route::post('tenders/{tender}/create-lead',        [TenderController::class, 'createLeadAndOpportunity'])->name('tenders.create-lead');

    // ── Projects ──────────────────────────────────────────────────────────────
    Route::resource('projects', ProjectController::class);
    Route::post('projects/{project}/status',        [ProjectController::class, 'updateStatus'])->name('projects.status');
    Route::post('projects/{project}/advance-phase', [ProjectController::class, 'advancePhase'])->name('projects.advance-phase');
    Route::post('projects/{project}/clone',         [ProjectController::class, 'clone'])->name('projects.clone');
    Route::get('projects/at-risk',                  [ProjectController::class, 'atRisk'])->name('projects.at-risk');
    Route::get('projects/{project}/export',         [ProjectController::class, 'export'])->name('projects.export');
    Route::post('projects/{project}/members',       [ProjectController::class, 'addMember'])->name('projects.members.add');
    Route::delete('projects/{project}/members/{user}', [ProjectController::class, 'removeMember'])->name('projects.members.remove');

    Route::post('projects/{project}/risks',                [ProjectRiskController::class, 'store'])->name('projects.risks.store');
    Route::put('projects/{project}/risks/{risk}',          [ProjectRiskController::class, 'update'])->name('projects.risks.update');
    Route::delete('projects/{project}/risks/{risk}',       [ProjectRiskController::class, 'destroy'])->name('projects.risks.destroy');
    Route::post('projects/{project}/risks/{risk}/realize', [ProjectRiskController::class, 'realize'])->name('projects.risks.realize');

    Route::post('projects/{project}/issues',           [ProjectIssueController::class, 'store'])->name('projects.issues.store');
    Route::put('projects/{project}/issues/{issue}',    [ProjectIssueController::class, 'update'])->name('projects.issues.update');
    Route::delete('projects/{project}/issues/{issue}', [ProjectIssueController::class, 'destroy'])->name('projects.issues.destroy');

    Route::post('projects/{project}/changes',                    [ProjectChangeController::class, 'store'])->name('projects.changes.store');
    Route::post('projects/{project}/changes/{change}/approve',   [ProjectChangeController::class, 'approve'])->name('projects.changes.approve');
    Route::post('projects/{project}/changes/{change}/reject',    [ProjectChangeController::class, 'reject'])->name('projects.changes.reject');
    Route::post('projects/{project}/changes/{change}/implement', [ProjectChangeController::class, 'implement'])->name('projects.changes.implement');
    Route::delete('projects/{project}/changes/{change}',         [ProjectChangeController::class, 'destroy'])->name('projects.changes.destroy');

    Route::post('projects/{project}/stakeholders',                 [ProjectStakeholderController::class, 'store'])->name('projects.stakeholders.store');
    Route::put('projects/{project}/stakeholders/{stakeholder}',    [ProjectStakeholderController::class, 'update'])->name('projects.stakeholders.update');
    Route::delete('projects/{project}/stakeholders/{stakeholder}', [ProjectStakeholderController::class, 'destroy'])->name('projects.stakeholders.destroy');

    Route::post('projects/{project}/lessons',           [ProjectLessonController::class, 'store'])->name('projects.lessons.store');
    Route::put('projects/{project}/lessons/{lesson}',   [ProjectLessonController::class, 'update'])->name('projects.lessons.update');
    Route::delete('projects/{project}/lessons/{lesson}',[ProjectLessonController::class, 'destroy'])->name('projects.lessons.destroy');

    // ── Finance ───────────────────────────────────────────────────────────────
    Route::get('accounting', [AccountingController::class, 'index'])->name('accounting.index');

    Route::resource('invoices', InvoiceController::class);
    Route::post('invoices/{invoice}/send',    [InvoiceController::class, 'send'])->name('invoices.send');
    Route::post('invoices/{invoice}/payment', [InvoiceController::class, 'recordPayment'])->name('invoices.payment');
    Route::post('invoices/{invoice}/cancel',  [InvoiceController::class, 'cancel'])->name('invoices.cancel');

    Route::resource('payments', PaymentController::class);
    Route::resource('expenses', ExpenseController::class);

    Route::get('follow-ups',               [ClientFollowUpController::class, 'index'])->name('follow-ups.index');
    Route::post('follow-ups',              [ClientFollowUpController::class, 'store'])->name('follow-ups.store');
    Route::put('follow-ups/{followUp}',    [ClientFollowUpController::class, 'update'])->name('follow-ups.update');
    Route::post('follow-ups/{followUp}/complete', [ClientFollowUpController::class, 'complete'])->name('follow-ups.complete');
    Route::delete('follow-ups/{followUp}',[ClientFollowUpController::class, 'destroy'])->name('follow-ups.destroy');

    Route::get('client-reports',               [ClientReportController::class, 'index'])->name('client-reports.index');
    Route::get('client-reports/create',        [ClientReportController::class, 'create'])->name('client-reports.create');
    Route::post('client-reports',              [ClientReportController::class, 'store'])->name('client-reports.store');
    Route::get('client-reports/{clientReport}',[ClientReportController::class, 'show'])->name('client-reports.show');
    Route::post('client-reports/{clientReport}/send',   [ClientReportController::class, 'send'])->name('client-reports.send');
    Route::delete('client-reports/{clientReport}',      [ClientReportController::class, 'destroy'])->name('client-reports.destroy');

    // ── Supply Chain ──────────────────────────────────────────────────────────
    Route::get('vendors', fn () => redirect()->route('web.suppliers.index'))->name('vendors.index');
    Route::resource('suppliers', SupplierController::class);
    Route::resource('products',  ProductController::class);

    Route::resource('purchase-orders', PurchaseOrderController::class);
    Route::post('purchase-orders/{purchaseOrder}/send',       [PurchaseOrderController::class, 'send'])->name('purchase-orders.send');
    Route::post('purchase-orders/{purchaseOrder}/confirm',    [PurchaseOrderController::class, 'confirm'])->name('purchase-orders.confirm');
    Route::post('purchase-orders/{purchaseOrder}/cancel',     [PurchaseOrderController::class, 'cancel'])->name('purchase-orders.cancel');
    Route::post('purchase-orders/{purchaseOrder}/deliveries', [PurchaseOrderController::class, 'createDelivery'])->name('purchase-orders.create-delivery');
    Route::post('purchase-orders/{purchaseOrder}/documents',  [PurchaseOrderController::class, 'uploadDocument'])->name('purchase-orders.upload-document');

    Route::get('deliveries',             [DeliveryController::class, 'index'])->name('deliveries.index');
    Route::get('deliveries/{delivery}',  [DeliveryController::class, 'show'])->name('deliveries.show');
    Route::post('deliveries/{delivery}/dispatch', [DeliveryController::class, 'dispatch'])->name('deliveries.dispatch');
    Route::post('deliveries/{delivery}/deliver',  [DeliveryController::class, 'deliver'])->name('deliveries.deliver');
    Route::post('deliveries/{delivery}/reject',   [DeliveryController::class, 'reject'])->name('deliveries.reject');
    Route::post('deliveries/{delivery}/documents',[DeliveryController::class, 'uploadDocument'])->name('deliveries.upload-document');
    Route::post('delivery-documents/{document}/approve', [DeliveryController::class, 'approveDocument'])->name('delivery-documents.approve');

    // ── HR ────────────────────────────────────────────────────────────────────
    Route::get('hr',                   [HRController::class, 'index'])->name('hr.index');
    Route::get('hr/staff',             [HRController::class, 'staff'])->name('hr.staff');
    Route::get('hr/staff/create',      [HRController::class, 'create'])->name('hr.staff.create');
    Route::post('hr/staff',            [HRController::class, 'store'])->name('hr.staff.store');
    Route::get('hr/staff/{id}',        [HRController::class, 'show'])->name('hr.staff.show');
    Route::get('hr/staff/{id}/edit',   [HRController::class, 'edit'])->name('hr.staff.edit');
    Route::put('hr/staff/{id}',        [HRController::class, 'update'])->name('hr.staff.update');
    Route::get('hr/leave',             [HRController::class, 'leave'])->name('hr.leave');
    Route::post('hr/leave/{leave}/approve', [HRController::class, 'approveLeave'])->name('hr.leave.approve');
    Route::post('hr/leave/{leave}/reject',  [HRController::class, 'rejectLeave'])->name('hr.leave.reject');

    Route::resource('time-logs', TimeLogController::class);

    // ── Reports & Analytics ───────────────────────────────────────────────────
    Route::get('reports',               [ReportsController::class, 'index'])->name('reports.index');
    Route::get('analytics/leads',       [LeadAnalyticsController::class, 'getLeadAnalytics'])->name('analytics.leads');
    Route::get('analytics/performance', [LeadAnalyticsController::class, 'getPerformanceMetrics'])->name('analytics.performance');

    // ── Admin / System ────────────────────────────────────────────────────────
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::resource('activities',    ActivityController::class);
    Route::resource('conversations', ConversationController::class);
    Route::resource('emails', EmailController::class)->except(['edit', 'update']);
    Route::get('emails/compose', [EmailController::class, 'compose'])->name('emails.compose');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/channels.php';