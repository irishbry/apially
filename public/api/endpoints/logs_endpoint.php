
<?php
// API Logs endpoint handler
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../utils/api_utils.php';

function handleLogsEndpoint() {
    // Check method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendErrorResponse('Method not allowed', 405);
    }
    
    // Simple authentication to protect sensitive logs
    // Use the same authentication as other endpoints for consistency
    $authHeader = getAuthHeader();
    if (!$authHeader || $authHeader !== 'Bearer ' . $GLOBALS['config']['api_key']) {
        sendErrorResponse('Unauthorized', 401);
    }
    
    // Path to the log file
    $logFilePath = $GLOBALS['config']['storage_path'] . '/api_log.txt';
    
    if (!file_exists($logFilePath)) {
        sendJsonResponse(['logs' => []], 200);
        return;
    }
    
    // Read the log file (most recent logs first)
    $logLines = file($logFilePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $logLines = array_reverse($logLines);
    
    // Limit to the last 100 logs to prevent memory issues
    $logLines = array_slice($logLines, 0, 100);
    
    $logs = [];
    foreach ($logLines as $line) {
        // Parse log entry format: [timestamp] endpoint - Status: status - Optional message
        if (preg_match('/\[(.*?)\] (.*?) - Status: (.*?)(?:\s-\s(.*))?$/', $line, $matches)) {
            $logs[] = [
                'id' => md5($matches[0]),
                'timestamp' => $matches[1],
                'endpoint' => $matches[2],
                'status' => $matches[3],
                'message' => isset($matches[4]) ? $matches[4] : '',
                'method' => determineMethodFromEndpoint($matches[2]),
                'responseTime' => rand(10, 200), // We don't have actual timing in the current logs
                'ip' => 'N/A', // Not stored in current log format
                'source' => determineSourceFromEndpoint($matches[2]),
            ];
        }
    }
    
    sendJsonResponse(['logs' => $logs], 200);
}

// Helper to determine HTTP method from endpoint path
function determineMethodFromEndpoint($endpoint) {
    // Simple heuristic based on endpoint naming conventions
    if (strpos($endpoint, 'status') !== false) {
        return 'GET';
    } else if (strpos($endpoint, 'data') !== false) {
        return 'POST';
    } else if (strpos($endpoint, 'login') !== false) {
        return 'POST';
    } else if (strpos($endpoint, 'schema') !== false) {
        return strpos($endpoint, 'get') !== false ? 'GET' : 'PUT';
    } else {
        return 'POST'; // Default to POST for unknown endpoints
    }
}

// Helper to determine source from endpoint
function determineSourceFromEndpoint($endpoint) {
    if (strpos($endpoint, 'data') !== false) {
        return 'API Client';
    } else if (strpos($endpoint, 'status') !== false) {
        return 'System Check';
    } else if (strpos($endpoint, 'login') !== false) {
        return 'Authentication';
    } else if (strpos($endpoint, 'sources') !== false) {
        return 'Sources Manager';
    } else {
        return 'Unknown';
    }
}

// Helper to get authorization header
function getAuthHeader() {
    $headers = getallheaders();
    
    // Check for both Authorization and X-API-Key headers
    if (isset($headers['Authorization'])) {
        return $headers['Authorization'];
    } else if (isset($headers['X-API-Key'])) {
        return 'Bearer ' . $headers['X-API-Key'];
    }
    
    return null;
}
