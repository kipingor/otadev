<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Dashboard composes data via services (not implemented here).
        // Keep controller slim — service will fetch metrics, charts, and quick lists.
        $data = [
            'user' => $request->user(),
        ];

        // The frontend page component is built as `resources/js/pages/dashboard.tsx`.
        // Render the `dashboard` component (not `dashboard/index`) so Vite can find
        // the built entry in the manifest.
        return Inertia::render('dashboard', compact('data'));
    }
}
