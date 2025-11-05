<?php

namespace Database\Factories;

use App\Models\ModRequests;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\ModRequests>
 */
class ModRequestsFactory extends Factory
{
    protected $model = ModRequests::class;

    public function definition(): array
    {
        $isImage = $this->faker->boolean(30);

        $contentType = $isImage ? 'image' : 'text';
        $status = $this->faker->boolean(85) ? 'success' : 'fail';

        $content = $isImage
            ? 'users/' . $this->faker->numberBetween(1, 50) . '/uploads-' . $this->faker->date('Ymd-Hi\s') . '.' . $this->faker->randomElement(['jpg', 'png'])
            : $this->faker->paragraphs($this->faker->numberBetween(1, 3), true);

        $categories = ['Hate', 'SelfHarm', 'Sexual', 'Violence'];
        $analysis = array_map(function ($cat) {
            return [
                'category' => $cat,
                'severity' => rand(0, 4),
            ];
        }, $this->faker->randomElements($categories, $this->faker->numberBetween(1, 4)));

        $requestMetadata = [
            'api_version' => '2024-09-01',
            'categories' => $this->faker->randomElements($categories, $this->faker->numberBetween(1, 4)),
            'outputType' => 'FourSeverityLevels',
        ];

        if ($isImage) {
            $requestMetadata['image'] = [
                'type' => 'upload',
                'original_filename' => $this->faker->lexify('image-????') . '.' . $this->faker->randomElement(['jpg', 'png']),
                'path' => $content,
            ];
        }

        return [
            'user_id' => User::factory(),
            'content_type' => $contentType,
            'content' => $content,
            'request_metadata' => $requestMetadata,
            'moderation_result' => [
                'categoriesAnalysis' => $analysis,
            ],
            'status' => $status,
        ];
    }

    public function text(): self
    {
        return $this->state(fn() => [
            'content_type' => 'text',
        ]);
    }

    public function image(): self
    {
        return $this->state(function (array $attrs) {
            $path = 'users/' . ($attrs['user_id'] ?? $this->faker->numberBetween(1, 50)) . '/uploads-' . $this->faker->date('Ymd-Hi\s') . '.' . $this->faker->randomElement(['jpg', 'png']);
            return [
                'content_type' => 'image',
                'content' => $path,
                'request_metadata' => array_merge($attrs['request_metadata'] ?? [], [
                    'image' => [
                        'type' => 'upload',
                        'original_filename' => $this->faker->lexify('image-????') . '.' . $this->faker->randomElement(['jpg', 'png']),
                        'path' => $path,
                    ],
                ]),
            ];
        });
    }

    public function success(): self
    {
        return $this->state(fn() => ['status' => 'success']);
    }

    public function fail(): self
    {
        return $this->state(fn() => ['status' => 'fail']);
    }
}
