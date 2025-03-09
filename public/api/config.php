
<?php
// Enable error reporting for troubleshooting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simple configuration file for Data Consolidation API

$config = [
    // Allowed origins for CORS
    'allowed_origins' => ['*'], // Replace with your frontend domain in production
    
    // Path to data storage directory
    'storage_path' => __DIR__ . '/data',
    
    // API key (change this in production)
    'api_key' => 'your-secure-api-key-here'
];

// Create storage directory if it doesn't exist
if (!file_exists($config['storage_path'])) {
    mkdir($config['storage_path'], 0755, true);
}
