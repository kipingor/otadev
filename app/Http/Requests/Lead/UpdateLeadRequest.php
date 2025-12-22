<?php

namespace App\Http\Requests\Lead;

use App\Models\Lead;
use App\Enums\LeadStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $lead = $this->route('lead');
        return $this->user()->can('update', $lead);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'type' => [
                'sometimes',
                'required',
                'in:document,conversation',
            ],
            'owner_id' => [
                'sometimes',
                'required',
                'exists:users,id',
            ],
            'pipeline_stage_id' => [
                'sometimes',
                'required',
                'exists:pipeline_stages,id',
            ],
            'status' => [
                'sometimes',
                Rule::enum(LeadStatus::class),
            ],
            'metadata' => [
                'nullable',
                'array',
            ],
            'metadata.source' => [
                'nullable',
                'string',
                'max:255',
            ],
            'metadata.priority' => [
                'nullable',
                'in:low,medium,high,urgent',
            ],
            'metadata.tags' => [
                'nullable',
                'array',
            ],
            'metadata.tags.*' => [
                'string',
                'max:50',
            ],
            'ai_reviewed' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    public function message(): array
    {
        return [
            'title.required' => 'A lead title is required.',
            'title.max' => 'The lead title must not exceed 255 characters.',
            'type.required' => 'Please specify the lead type.',
            'type.in' => 'The lead type must be either document or conversation.',
            'owner_id.required' => 'Please assign the lead to an owner.',
            'owner_id.exists' => 'The selected owner is invalid.',
            'pipeline_stage_id.required' => 'Please select a pipeline stage.',
            'pipeline_stage_id.exists' => 'The selected pipeline stage is invalid.',
        ];
    }

    public function attributes(): array
    {
        return[
            'owner_id' => 'lead owner',
            'pipeline_stage_id' => 'pipeline stage',
            'ai_reviewed' => 'AI reviewed status',
        ];
    }
}
