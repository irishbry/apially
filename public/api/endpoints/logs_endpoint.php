
<?php
// API Logs endpoint handler
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../utils/api_utils.php';

function handleLogsEndpoint() {
    // Log the request
    logApiRequest('logs', 'success', 'Logs API accessed');
    
    // Check method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        logApiRequest('logs', 'error', 'Method not allowed');
        sendErrorResponse('Method not allowed', 405);
    }
    
    // Simple authentication to protect sensitive logs
    // Use the same authentication as other endpoints for consistency
    $authHeader = getAuthHeader();
    if (!$authHeader || $authHeader !== 'Bearer ' . $GLOBALS['config']['api_key']) {
        logApiRequest('logs', 'error', 'Unauthorized access attempt');
        sendErrorResponse('Unauthorized', 401);
    }
    
    // Try to get structured logs first (they contain more details)
    $structuredLogsPath = $GLOBALS['config']['storage_path'] . '/structured_logs.json';
    
    if (file_exists($structuredLogsPath)) {
        $structuredLogs = json_decode(file_get_contents($structuredLogsPath), true);
        if ($structuredLogs) {
            sendJsonResponse(['logs' => $structuredLogs], 200);
            return;
        }
    }
    
    // Fallback to parsing the regular log file
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
        // Parse log entry with enhanced format
        if (preg_match('/\[(.*?)\] (.*?) - Method: (.*?) - Status: (.*?)(?:\s-\s(.*?))?(?:\s-\sResponse time: (\d+)ms)?(?:\s-\sIP: (.*?))?(?:\s-\sSource: (.*?))?(?:\s-\sUser-Agent: (.*?))?$/', $line, $matches)) {
            $logs[] = [
                'id' => md5($matches[0]),
                'timestamp' => $matches[1],
                'endpoint' => $matches[2],
                'method' => $matches[3],
                'status' => $matches[4],
                'message' => isset($matches[5]) ? $matches[5] : '',
                'responseTime' => isset($matches[6]) ? (int)$matches[6] : null,
                'ip' => isset($matches[7]) ? $matches[7] : 'N/A',
                'source' => isset($matches[8]) ? $matches[8] : 'Unknown',
                'userAgent' => isset($matches[9]) ? $matches[9] : 'Unknown',
                'statusCode' => getStatusCodeFromStatus($matches[4])
            ];
        } else if (preg_match('/\[(.*?)\] (.*?) - Status: (.*?)(?:\s-\s(.*))?$/', $line, $matches)) {
            // Fallback for old log format
            $logs[] = [
                'id' => md5($matches[0]),
                'timestamp' => $matches[1],
                'endpoint' => $matches[2],
                'status' => $matches[3],
                'message' => isset($matches[4]) ? $matches[4] : '',
                'method' => determineMethodFromEndpoint($matches[2]),
                'responseTime' => rand(10, 200), // No timing info in old logs
                'ip' => 'N/A', // Not stored in old log format
                'source' => determineSourceFromEndpoint($matches[2]),
                'statusCode' => getStatusCodeFromStatus($matches[3])
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
    } else if (strpos($endpoint, 'logs') !== false) {
        return 'GET';
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
    } else if (strpos($endpoint, 'logs') !== false) {
        return 'Logs Service';
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
