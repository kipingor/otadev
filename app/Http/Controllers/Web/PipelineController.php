<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PipelineStage;
use App\Models\Lead;

class PipelineController extends Controller
{
    public function index(Request $request)
    {
        $stages = PipelineStage::orderBy('order')->get();


        $leads = Lead::with('owner')->whereIn('pipeline_stage_id', $stages->pluck('id'))->get();


        $leadsByStage = [];
        foreach ($stages as $s) {
            $leadsByStage[$s->key] = $leads->where('pipeline_stage_id', $s->id)->values();
        }


        return Inertia::render('pipelines/index', [
            'stages' => $stages,
            'leadsByStage' => $leadsByStage,
        ]);
    }
}
