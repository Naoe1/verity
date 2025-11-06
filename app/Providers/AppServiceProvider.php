<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Filesystem;
use AzureOss\FlysystemAzureBlobStorage\AzureBlobStorageAdapter;
use AzureOss\Storage\Blob\BlobServiceClient;
use Illuminate\Support\Facades\Log;
use Illuminate\Filesystem\FilesystemAdapter as LaravelFilesystemAdapter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(30)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                    ], 429, $headers);
                });
        });

        try {
            Storage::extend('azure', function ($app, $config) {
                $containerClient = BlobServiceClient::fromConnectionString($config['connection_string'])
                    ->getContainerClient($config['container']);

                $adapter = new AzureBlobStorageAdapter(
                    $containerClient,
                    $config['prefix'] ?? ''
                );

                $filesystem = new Filesystem($adapter);

                return new LaravelFilesystemAdapter($filesystem, $adapter, $config);
            });
        } catch (\Exception $e) {
            Log::error('Failed to extend Azure storage: ' . $e->getMessage());
        }
    }
}
