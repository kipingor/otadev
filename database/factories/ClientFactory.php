<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientFactory extends Factory
{
    protected $model = User::class;

    public function definition()
    {
        return User::factory()->definition();
    }
}
