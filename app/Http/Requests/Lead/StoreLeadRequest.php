<?php

namespace App\Http\Requests\Lead;

use App\Models\Lead;
use App\Enums\LeadStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Lead::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', 'in:document,conversation'],
            'owner_id' => ['required', 'exists:users,id'],
            'pipeline_stage_id' => ['required', 'exists:pipeline_stages,id'],
            'status' => ['nullable', Rule::enum(LeadStatus::class)],
            'metadata' => ['nullable', 'array'],
            'metadata.source' => ['nullable', 'string', 'max:255'],
            'metadata.tags' => ['string', 'max:50'],
        ];
    }

    public function messages(): array
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

    public function attributes()
    {
        return [
            'owner_id' => 'lead owner',
            'pipeline_stage_id' => 'pipeline stage',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('owner_id')) {
            $this->merge([
                'owner_id' => $this->user()->id,
            ]);
        }

        if (!$this->has('status')) {
            $this->merge([
                'status' => LeadStatus::NEW->value,
            ]);
        }

        $this->merge([
            'created_by' => $this->user()->id,
        ]);
    }
}
