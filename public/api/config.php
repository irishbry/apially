
<?php
// Simplified configuration settings for installation and testing
// Enable error reporting for easier debugging during installation
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration would go here if needed
$config = [
    // Allow all origins for CORS during setup
    'allowed_origins' => ['*'], 
    
    // Path to data storage directory
    'storage_path' => __DIR__ . '/data',
    
    // API key for testing (change this to a secure value later)
    'api_key' => 'demo-api-key-for-testing',
    
    // Demo credentials (change these after installation)
    'demo_user' => 'admin',
    'demo_password' => 'password'
];

// Create storage directory if it doesn't exist
if (!file_exists($config['storage_path'])) {
    @mkdir($config['storage_path'], 0755, true);
}

// Helper function to log API requests
function logApiRequest($endpoint, $status, $message = '') {
    global $config;
    $logFile = $config['storage_path'] . '/api_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $endpoint - Status: $status" . ($message ? " - $message" : "") . PHP_EOL;
    @file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Set CORS headers for development/testing
function setCorsHeaders() {
    // Allow all origins during installation/testing
    header("Access-Control-Allow-Origin: *");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    header('Access-Control-Max-Age: 86400'); // 24 hours cache
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

// Secure way to extract JSON request values
function getJsonRequestValue($data, $key, $default = null) {
    return isset($data[$key]) ? $data[$key] : $default;
}
