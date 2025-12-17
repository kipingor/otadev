<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_returns_successful_response()
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
