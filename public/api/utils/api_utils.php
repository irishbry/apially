
<?php
// General API utility functions

/**
 * Safely gets a value from a JSON request body
 */
function getJsonRequestValue($data, $key, $default = null) {
    return isset($data[$key]) ? $data[$key] : $default;
}

/**
 * Sends a JSON response
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Sends an error response
 */
function sendErrorResponse($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
    exit;
}

/**
 * Loads a JSON file or returns a default value if not found
 */
function loadJsonFile($filePath, $default = []) {
    if (file_exists($filePath)) {
        $data = json_decode(file_get_contents($filePath), true);
        return ($data !== null) ? $data : $default;
    }
    return $default;
}

/**
 * Saves data to a JSON file
 */
function saveJsonFile($filePath, $data) {
    return file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
}

/**
 * Set CORS headers for API responses
 * Uses modern PHP syntax compatible with PHP 7.0+
 */
function setCorsHeaders() {
    // Allow all origins during installation/testing
    header("Access-Control-Allow-Origin: *");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    header('Access-Control-Max-Age: 86400'); // 24 hours cache
    
    // Handle preflight requests using modern PHP 7+ syntax
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

/**
 * Log API request with PHP 7+ compatible error handling
 */
function logApiRequest($endpoint, $status, $message = '') {
    global $config;
    try {
        $logFile = $config['storage_path'] . '/api_log.txt';
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] $endpoint - Status: $status" . ($message ? " - $message" : "") . PHP_EOL;
        @file_put_contents($logFile, $logEntry, FILE_APPEND);
    } catch (Exception $e) {
        // Silently fail if logging fails - don't disrupt API operation
        error_log("Failed to log API request: " . $e->getMessage());
    }
}
