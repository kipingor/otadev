<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Lead;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->getConversationBaseQuery();

        // Apply filters based on request parameters
        if ($request->has('lead_id')) {
            $query = $this->applyLeadFilter($query, $request->input('lead_id'));
        }
        if ($request->has('message')) {
            $query = $this->applyMessageFilter($query, $request->input('message'));
        }

        // Paginate results
        $conversations = $this->paginateResults($query, $request->input('per_page', 20));

        // Return view or JSON response
        if ($request->wantsJson()) {
            return $this->jsonResponse($conversations);
        } else {
            return Inertia::render('conversations/index', ['conversations' => $conversations]);
        }
    }

    public function show(Request $request, $id)
    {
        $conversation = $this->findConversationById($id);

        if ($request->wantsJson()) {
            return $this->jsonResponse($conversation);
        } else {
            return Inertia::render('conversations/show', ['conversation' => $conversation]);
        }
    }

    public function create(Request $request)
    {
        $leads = $this->getAllLeads();
        return view('conversations.create', ['leads' => $leads]);
    }

    public function store(Request $request)
    {
        $data = $request->only(['lead_id', 'message']);
        $data['sender_id'] = $this->getAuthenticatedUserId();
        $data['created_at'] = $this->getCurrentTimestamp();

        $conversation = $this->createConversation($data);

        if ($request->wantsJson()) {
            return $this->jsonResponse($conversation, 201);
        } else {
            return Redirect::route('conversations.show', ['id' => $conversation->id])
                ->with('success', 'Conversation created successfully.');
        }
    }

    public function edit(Request $request, $id)
    {
        $conversation = $this->findConversationById($id);
        $leads = $this->getAllLeads();

        return view('conversations.edit', [
            'conversation' => $conversation,
            'leads' => $leads,
        ]);
    }

    public function update(Request $request, $id)
    {
        $conversation = $this->findConversationById($id);

        $data = $request->only(['lead_id', 'message']);
        $data['updated_at'] = $this->getCurrentTimestamp();

        $updatedConversation = $this->updateConversation($conversation, $data);

        if ($request->wantsJson()) {
            return $this->jsonResponse($updatedConversation);
        } else {
            return Redirect::route('conversations.show', ['id' => $updatedConversation->id])
                ->with('success', 'Conversation updated successfully.');
        }
    }

    public function destroy(Request $request, $id)
    {
        $conversation = $this->findConversationById($id);
        $this->deleteConversation($conversation);

        if ($request->wantsJson()) {
            return $this->jsonResponse(['message' => 'Conversation deleted successfully.']);
        } else {
            return Redirect::route('conversations.index')
                ->with('success', 'Conversation deleted successfully.');
        }
    }

    public function export(Request $request, $id)
    {
        $conversation = $this->findConversationById($id);
        return $this->exportConversationContent($conversation);
    }

    public function dashboard(Request $request)
    {
        $metrics = $this->getDashboardMetrics();

        if ($request->wantsJson()) {
            return $this->jsonResponse($metrics);
        } else {
            return view('conversations.dashboard', ['metrics' => $metrics]);
        }
    }

    public function search(Request $request)
    {
        $queryStr = $request->input('query', '');
        $conversations = $this->searchConversations($queryStr);

        if ($request->wantsJson()) {
            return $this->jsonResponse($conversations);
        } else {
            return view('conversations.search', [
                'conversations' => $conversations,
                'query' => $queryStr,
            ]);
        }
    }

    public function filterByLead(Request $request, $leadId)
    {
        $conversations = $this->filterConversationsByLead($leadId);

        if ($request->wantsJson()) {
            return $this->jsonResponse($conversations);
        } else {
            return view('conversations.by_lead', [
                'conversations' => $conversations,
                'leadId' => $leadId,
            ]);
        }
    }

    public function exportConversation(Request $request, $id)
    {
        $conversation = $this->findConversationById($id);
        return $this->exportConversationContent($conversation);
    }

    public function statistics(Request $request)
    {
        $statistics = $this->getConversationStatistics();

        if ($request->wantsJson()) {
            return $this->jsonResponse($statistics);
        } else {
            return view('conversations.statistics', ['statistics' => $statistics]);
        }
    }

    public function latest(Request $request)
    {
        $conversations = $this->getLatestConversations(10);

        if ($request->wantsJson()) {
            return $this->jsonResponse($conversations);
        } else {
            return view('conversations.latest', ['conversations' => $conversations]);
        }
    }

    private function jsonResponse($data, $status = 200)
    {
        return response()->json($data, $status);
    }

    private function getConversationBaseQuery()
    {
        return Conversation::with('lead', 'sender');
    }

    private function applyLeadFilter($query, $leadId)
    {
        return $query->where('lead_id', $leadId);
    }

    private function applyMessageFilter($query, $message)
    {
        return $query->where('message', 'like', '%' . $message . '%');
    }

    private function paginateResults($query, $perPage = 20)
    {
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    private function buildExportContent(Conversation $conversation)
    {
        $content = "Lead: " . $conversation->lead->title . "\n";
        $content .= "Message: " . $conversation->message . "\n";
        $content .= "Sender: " . $conversation->sender_type . " (ID: " . $conversation->sender_id . ")\n";
        $content .= "Date: " . $conversation->created_at->toDateTimeString() . "\n";

        return $content;
    }

    private function generateFilename(Conversation $conversation)
    {
        return 'conversation_' . $conversation->id . '.txt';
    }

    private function getDashboardMetrics()
    {
        $recentConversations = Conversation::with('lead', 'sender')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $totalConversations = Conversation::count();

        return [
            'recent_conversations' => $recentConversations,
            'total_conversations' => $totalConversations,
        ];
    }

    private function createConversation(array $data)
    {
        return Conversation::create($data);
    }

    private function updateConversation(Conversation $conversation, array $data)
    {
        $conversation->update($data);
        return $conversation;
    }

    private function deleteConversation(Conversation $conversation)
    {
        $conversation->delete();
    }

    private function findConversationById($id)
    {
        return Conversation::findOrFail($id);
    }

    private function getAllLeads()
    {
        return Lead::all();
    }

    private function getAuthenticatedUserId()
    {
        return Auth::id();
    }

    private function getCurrentTimestamp()
    {
        return Carbon::now();
    }

    private function getConversationStatistics()
    {
        $totalConversations = Conversation::count();
        $conversationsPerLead = Conversation::select('lead_id', DB::raw('count(*) as total'))
            ->groupBy('lead_id')
            ->get();

        return [
            'total_conversations' => $totalConversations,
            'conversations_per_lead' => $conversationsPerLead,
        ];
    }

    private function getLatestConversations($limit = 10)
    {
        return Conversation::with('lead', 'sender')
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();
    }

    private function searchConversations($queryStr)
    {
        return Conversation::where('message', 'like', '%' . $queryStr . '%')
            ->orWhereHas('lead', function ($q) use ($queryStr) {
                $q->where('title', 'like', '%' . $queryStr . '%');
            })
            ->with('lead', 'sender')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }

    private function filterConversationsByLead($leadId)
    {
        return Conversation::where('lead_id', $leadId)
            ->with('lead', 'sender')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }

    private function exportConversationContent(Conversation $conversation)
    {
        $filename = $this->generateFilename($conversation);
        $content = $this->buildExportContent($conversation);

        return Response::make($content, 200, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
