<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;

class HRController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('hr/index');
    }
}

