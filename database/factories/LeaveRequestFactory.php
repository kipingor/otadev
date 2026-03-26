<?php

namespace Database\Factories;

use App\Models\LeaveRequest;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeaveRequestFactory extends Factory
{
    protected $model = LeaveRequest::class;

    public function definition()
    {
        return [
            'staff_profile_id' => StaffProfile::factory(),
            'from_date' => $this->faker->date(),
            'to_date' => $this->faker->date(),
            'type' => $this->faker->randomElement(['annual', 'sick', 'unpaid']),
            'reason' => $this->faker->sentence(),
            'status' => 'pending',
            'approved_by' => null,
            'admin_notes' => null,
        ];
    }
}
