<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Email;
use App\Models\Lead;
use App\Models\Opportunity;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

/**
 * FIX: pages/emails/ (index, show, compose) existed with no backend route or controller.
 *
 * The Email model supports: lead_id, opportunity_id, direction (inbound/outbound),
 * status (draft/queued/sent/delivered/bounced/opened/clicked/failed),
 * subject, body, from, to, sender_id, mailgun_id, tracking etc.
 */
class EmailController extends Controller
{
    public function index(Request $request): Response
    {
        $emails = Email::with([
                'lead:id,title',
                'opportunity:id,title',
                'sender:id,name,avatar',
            ])
            ->when($request->filled('direction'), fn ($q) => $q->where('direction', $request->direction))
            ->when($request->filled('status'),    fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('lead_id'),   fn ($q) => $q->where('lead_id', $request->lead_id))
            ->when($request->filled('search'),    fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('subject', 'like', "%{$request->search}%")
                  ->orWhere('to', 'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('emails/index', [
            'emails'  => $emails,
            'filters' => $request->only(['direction', 'status', 'lead_id', 'search']),
            'stats'   => [
                'sent'     => Email::where('direction', 'outbound')->where('status', 'sent')->count(),
                'received' => Email::where('direction', 'inbound')->count(),
                'drafts'   => Email::where('status', 'draft')->count(),
            ],
        ]);
    }

    public function show(Email $email): Response
    {
        $email->load(['lead:id,title,status', 'opportunity:id,title', 'sender:id,name,avatar']);

        return Inertia::render('emails/show', compact('email'));
    }

    /**
     * Compose form — pre-fill lead/opportunity context if passed as query params.
     */
    public function compose(Request $request): Response
    {
        $prefill = [];

        if ($leadId = $request->get('lead_id')) {
            $lead = Lead::select(['id', 'title'])->with('owner:id,email')->find($leadId);
            if ($lead) {
                $prefill['lead_id']  = $lead->id;
                $prefill['lead']     = $lead;
                $prefill['to']       = $lead->owner?->email ?? '';
            }
        }

        if ($oppId = $request->get('opportunity_id')) {
            $prefill['opportunity_id'] = $oppId;
        }

        return Inertia::render('emails/compose', [
            'prefill' => $prefill,
            'leads'   => Lead::select(['id', 'title'])->orderBy('title')->limit(200)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'lead_id'        => ['nullable', 'exists:leads,id'],
            'opportunity_id' => ['nullable', 'exists:opportunities,id'],
            'to'             => ['required', 'string'],
            'subject'        => ['required', 'string', 'max:255'],
            'body'           => ['required', 'string'],
            'send_now'       => ['boolean'],
        ]);

        $data['sender_id'] = Auth::id();
        $data['from']      = Auth::user()->email;
        $data['direction'] = 'outbound';
        $data['status']    = $request->boolean('send_now') ? 'queued' : 'draft';

        $email = Email::create($data);

        // TODO: dispatch SendEmailJob if status === 'queued'

        return redirect()->route('web.emails.show', $email->id)
            ->with('success', $email->status === 'queued' ? 'Email queued for sending.' : 'Draft saved.');
    }

    public function destroy(Email $email): RedirectResponse
    {
        $email->delete();
        return redirect()->route('web.emails.index')->with('success', 'Email deleted.');
    }
}