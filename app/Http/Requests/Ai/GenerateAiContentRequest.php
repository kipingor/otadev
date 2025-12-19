<?php

namespace App\Http\Requests\Ai;

use Illuminate\Foundation\Http\FormRequest;

class GenerateAiContentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lead_id' => ['required', 'integer', 'exists:leads,id'],
            'mode' => ['required', 'string', 'in:followup,proposal'],
            'context' => ['array'],
            // Add other fields as necessary for the AI content generation
        ];
    }
}
