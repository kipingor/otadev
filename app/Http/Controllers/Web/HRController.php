<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;
use Illuminate\Support\Facades\Log;

class HRController extends Controller
{
    public function index(Request $request)
    {
        $employees = User::role('employee')->get();
        return Inertia::render('hr/index', ['employees' => $employees]);
    }

    public function show(Request $request, $id)
    {
        // Example method to show employee details
        try {
            $employee = DB::table('employees')->where('id', $id)->first();

            if (!$employee) {
                return redirect()->back()->withErrors('Employee not found.');
            }

            return Inertia::render('hr/show', compact('employee'));
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function create(Request $request)
    {
        // Example method to show create employee form
        return Inertia::render('hr/create');
    }

    public function edit(Request $request, $id)
    {
        // Example method to show edit employee form
        try {
            $employee = DB::table('employees')->where('id', $id)->first();

            if (!$employee) {
                return redirect()->back()->withErrors('Employee not found.');
            }

            return Inertia::render('hr/edit', compact('employee'));
        } catch (Exception $e) {
            return $this->handleException($e);
        }
    }

    public function settings(Request $request)
    {
        // Example method to show HR settings
        return Inertia::render('hr/settings');
    }

    public function dashboard(Request $request)
    {
        // Example method to show HR dashboard
        return Inertia::render('hr/dashboard');
    }

    private function handleException(Exception $e)
    {
        Log::error('HRController Error: ' . $e->getMessage(), ['exception' => $e]);
        return redirect()->back()->withErrors('An unexpected error occurred. Please try again later.');
    }
}

