<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Validation\ValidationException;

class Handler extends Exception
{
    protected function invalidJson($request, ValidationException $exception) {
        return response()->json([
            'success' => false,
            'message' => $exception->getMessage(),
            'errors' => $exception->errors(),
        ], 422);
    }
}
