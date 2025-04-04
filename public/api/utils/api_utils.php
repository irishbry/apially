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
 * Enhanced API request logging with dynamic endpoint information
 */
function logApiRequest($endpoint, $status, $message = '') {
    global $config;
    try {
        $logFile = $config['storage_path'] . '/api_log.txt';
        $timestamp = date('Y-m-d H:i:s');
        
        // Get request method
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Calculate response time if we have a start time
        $responseTime = '';
        if (isset($_SERVER['REQUEST_START_TIME'])) {
            $endTime = microtime(true);
            $responseTime = round(($endTime - $_SERVER['REQUEST_START_TIME']) * 1000);
            $responseTime = " - Response time: {$responseTime}ms";
        }
        
        // Get client IP address
        $ip = getClientIp();
        
        // Get user agent
        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Unknown';
        
        // Determine source based on headers or endpoint
        $source = determineSourceFromRequest($endpoint);
        
        // Create structured log entry
        $logEntry = [
            'timestamp' => $timestamp,
            'id' => uniqid('log-'),
            'method' => $method,
            'endpoint' => $endpoint,
            'status' => $status,
            'statusCode' => getStatusCodeFromStatus($status),
            'message' => $message,
            'ip' => anonymizeIpAddress($ip),
            'userAgent' => $userAgent,
            'source' => $source,
            'responseTime' => $responseTime ? (int)trim(str_replace(['Response time:', 'ms'], '', $responseTime)) : null
        ];
        
        // For simplicity, we'll append a line to the log file
        // In a production environment, consider using a database
        $logLine = "[$timestamp] $endpoint - Method: $method - Status: $status" . 
                  ($message ? " - $message" : "") . 
                  $responseTime . 
                  " - IP: $ip" . 
                  " - Source: $source" . 
                  " - User-Agent: " . substr($userAgent, 0, 100) . 
                  PHP_EOL;
                   
        @file_put_contents($logFile, $logLine, FILE_APPEND);
        
        // Also store structured log for API consumption
        storeStructuredLog($logEntry);
        
    } catch (Exception $e) {
        // Silently fail if logging fails - don't disrupt API operation
        error_log("Failed to log API request: " . $e->getMessage());
    }
}

/**
 * Store structured log data for API consumption
 */
function storeStructuredLog($logEntry) {
    global $config;
    try {
        $logsFile = $config['storage_path'] . '/structured_logs.json';
        
        // Read existing logs
        $logs = [];
        if (file_exists($logsFile)) {
            $logsContent = file_get_contents($logsFile);
            if ($logsContent) {
                $logs = json_decode($logsContent, true) ?: [];
            }
        }
        
        // Add new log at the beginning
        array_unshift($logs, $logEntry);
        
        // Limit to 100 logs to prevent the file from growing too large
        $logs = array_slice($logs, 0, 100);
        
        // Save updated logs
        file_put_contents($logsFile, json_encode($logs, JSON_PRETTY_PRINT));
    } catch (Exception $e) {
        error_log("Failed to store structured log: " . $e->getMessage());
    }
}

/**
 * Get status code from status string
 */
function getStatusCodeFromStatus($status) {
    switch (strtolower($status)) {
        case 'success':
            return 200;
        case 'created':
            return 201;
        case 'accepted':
            return 202;
        case 'no content':
            return 204;
        case 'bad request':
            return 400;
        case 'unauthorized':
            return 401;
        case 'forbidden':
            return 403;
        case 'not found':
            return 404;
        case 'error':
        case 'server error':
            return 500;
        default:
            // Try to parse the status as a number
            if (is_numeric($status)) {
                return (int)$status;
            }
            return 0;
    }
}

/**
 * Get client IP address
 */
function getClientIp() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    }
    return $ip;
}

/**
 * Anonymize IP addresses for GDPR compliance
 */
function anonymizeIpAddress($ip) {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        // For IPv4, keep only the first two octets
        $parts = explode('.', $ip);
        return $parts[0] . '.' . $parts[1] . '.0.0';
    } else if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        // For IPv6, keep only the first three segments
        $parts = explode(':', $ip);
        return $parts[0] . ':' . $parts[1] . ':' . $parts[2] . ':0:0:0:0:0';
    }
    return 'unknown';
}

/**
 * Determine the source of the request based on headers and endpoint
 */
function determineSourceFromRequest($endpoint) {
    // First check if we have a source from API key
    $source = determineSourceFromHeaders();
    
    // If we couldn't determine the source from headers, try to infer it from the endpoint
    if ($source === 'Unknown') {
        if (strpos($endpoint, 'data') !== false) {
            return 'API Client';
        } else if (strpos($endpoint, 'status') !== false) {
            return 'System Check';
        } else if (strpos($endpoint, 'login') !== false) {
            return 'Authentication';
        } else if (strpos($endpoint, 'sources') !== false) {
            return 'Sources Manager';
        } else if (strpos($endpoint, 'logs') !== false) {
            return 'Logs Service';
        }
    }
    
    return $source;
}

/**
 * Determine the source of the request from headers
 */
function determineSourceFromHeaders() {
    $apiKey = '';
    
    // Check for X-API-Key header
    if (isset($_SERVER['HTTP_X_API_KEY'])) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'];
    }
    
    // Check for Authorization header with Bearer token
    if (!$apiKey && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $apiKey = $matches[1];
        }
    }
    
    // In a real implementation, you would look up the API key in your database
    // For now, we'll return a placeholder name based on the first few characters of the API key
    if ($apiKey) {
        // In a real system, you'd query your database to get the actual source name
        $keyStart = substr($apiKey, 0, 8);
        return "Source $keyStart";
    }
    
    return 'Unknown';
}
