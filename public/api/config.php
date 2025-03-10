
<?php
// Production configuration settings
error_reporting(0);  // Disable error reporting in production
ini_set('display_errors', 0);  // Don't display errors to users

// Database configuration would go here if needed
$config = [
    // Allowed origins for CORS - update this with your production domain
    'allowed_origins' => ['https://yourdomain.com'], 
    
    // Path to data storage directory
    'storage_path' => __DIR__ . '/data',
    
    // API key for production (change this to a secure value)
    'api_key' => 'your-secure-api-key-here',
    
    // Production credentials (change these)
    'demo_user' => 'admin',
    'demo_password' => 'password'
];

// Create storage directory if it doesn't exist
if (!file_exists($config['storage_path'])) {
    mkdir($config['storage_path'], 0755, true);
}

// Helper function to log API requests
function logApiRequest($endpoint, $status, $message = '') {
    global $config;
    $logFile = $config['storage_path'] . '/api_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $endpoint - Status: $status" . ($message ? " - $message" : "") . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Set CORS headers for production
function setCorsHeaders() {
    global $config;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Only allow specified origins
    if (in_array($origin, $config['allowed_origins'])) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
        header('Access-Control-Max-Age: 86400'); // 24 hours cache
    }
    
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

