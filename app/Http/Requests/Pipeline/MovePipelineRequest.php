<?php

namespace App\Http\Requests\Pipeline;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\PipelineStage;

class MovePipelineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stage' => ['required', 'string'],
        ];
    }

    public function stage(): PipelineStage
    {
        return PipelineStage::from($this->input('stage'));
    }
}
