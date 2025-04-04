<?php
// Production error handler with comprehensive logging and security features

// Define log directory and ensure it exists
$logDir = dirname(__DIR__) . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

// Define log file paths
$errorLogFile = $logDir . '/error.log';
$criticalLogFile = $logDir . '/critical.log';
$accessLogFile = $logDir . '/access.log';

// Custom error handler for production environment
function productionErrorHandler($errno, $errstr, $errfile, $errline) {
    global $errorLogFile, $criticalLogFile;
    
    // Create standardized error entry
    $timestamp = date('Y-m-d H:i:s');
    $requestId = isset($_SERVER['HTTP_X_REQUEST_ID']) ? $_SERVER['HTTP_X_REQUEST_ID'] : uniqid();
    $ipAddress = anonymizeIpAddress($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    $requestUri = $_SERVER['REQUEST_URI'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Get error type as string
    $errorType = mapErrorCodeToString($errno);
    
    // Create detailed error message for logging
    $errorMessage = sprintf(
        "[%s] [%s] [%s] [%s] %s: %s in %s on line %d (Request: %s, Agent: %s)\n",
        $timestamp,
        $requestId,
        $ipAddress,
        $errorType,
        $errno,
        $errstr,
        $errfile,
        $errline,
        $requestUri,
        substr($userAgent, 0, 100)
    );
    
    // Log to the appropriate file
    if ($errno == E_ERROR || $errno == E_CORE_ERROR || $errno == E_COMPILE_ERROR || $errno == E_USER_ERROR) {
        // Critical errors get logged to both files
        error_log($errorMessage, 3, $criticalLogFile);
        error_log($errorMessage, 3, $errorLogFile);
        
        // Notify administrators of critical errors if configured
        notifyAdminsOfCriticalError($errorMessage);
    } else {
        // Non-critical errors just go to the main log
        error_log($errorMessage, 3, $errorLogFile);
    }
    
    // For fatal errors, return a standardized JSON error response
    if ($errno == E_ERROR || $errno == E_CORE_ERROR || $errno == E_COMPILE_ERROR || $errno == E_USER_ERROR) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'error' => 'Internal Server Error', 
            'requestId' => $requestId,
            'timestamp' => $timestamp
        ]);
        exit;
    }
    
    // Return true to indicate the error has been handled
    return true;
}

// Exception handler for uncaught exceptions
function productionExceptionHandler($exception) {
    $errno = E_ERROR;
    $errstr = $exception->getMessage();
    $errfile = $exception->getFile();
    $errline = $exception->getLine();
    
    // Handle stack trace for detailed logging
    $trace = $exception->getTraceAsString();
    
    // Log exception with stack trace
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] Uncaught Exception: $errstr in $errfile on line $errline\nStack trace:\n$trace\n";
    error_log($logMessage, 3, dirname(__DIR__) . '/logs/exceptions.log');
    
    // Use the standard error handler to do the rest
    productionErrorHandler($errno, $errstr, $errfile, $errline);
}

// Function to map error constants to readable strings
function mapErrorCodeToString($errno) {
    switch($errno) {
        case E_ERROR: return 'ERROR';
        case E_WARNING: return 'WARNING';
        case E_PARSE: return 'PARSE';
        case E_NOTICE: return 'NOTICE';
        case E_CORE_ERROR: return 'CORE_ERROR';
        case E_CORE_WARNING: return 'CORE_WARNING';
        case E_COMPILE_ERROR: return 'COMPILE_ERROR';
        case E_COMPILE_WARNING: return 'COMPILE_WARNING';
        case E_USER_ERROR: return 'USER_ERROR';
        case E_USER_WARNING: return 'USER_WARNING';
        case E_USER_NOTICE: return 'USER_NOTICE';
        case E_STRICT: return 'STRICT';
        case E_RECOVERABLE_ERROR: return 'RECOVERABLE_ERROR';
        case E_DEPRECATED: return 'DEPRECATED';
        case E_USER_DEPRECATED: return 'USER_DEPRECATED';
        default: return 'UNKNOWN';
    }
}

// Anonymize IP addresses for GDPR compliance
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

// Notify administrators of critical errors (customize for your notification method)
function notifyAdminsOfCriticalError($errorMessage) {
    // This function would be customized based on your notification preferences
    // Options include: email, SMS, Slack webhook, etc.
    
    // For example, to send an email (uncomment and configure in production):
    /*
    $to = 'admin@yourdomain.com';
    $subject = 'CRITICAL ERROR: API System';
    $headers = 'From: api@yourdomain.com' . "\r\n";
    mail($to, $subject, $errorMessage, $headers);
    */
    
    // Or a webhook to Slack/Discord/etc.
    /* 
    $payload = json_encode(["text" => "CRITICAL ERROR: $errorMessage"]);
    $ch = curl_init('https://hooks.slack.com/services/YOUR/WEBHOOK/URL');
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_exec($ch);
    curl_close($ch);
    */
}

// Enhanced Request access logging function - called at the beginning of the request
function logApiAccess() {
    global $accessLogFile;
    
    $timestamp = date('Y-m-d H:i:s');
    $requestId = uniqid();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
    $uri = $_SERVER['REQUEST_URI'] ?? 'unknown';
    $ipAddress = anonymizeIpAddress($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $referer = $_SERVER['HTTP_REFERER'] ?? '-';
    $source = determineSourceFromHeaders();
    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
    
    // Store request ID for error correlation
    $_SERVER['HTTP_X_REQUEST_ID'] = $requestId;
    
    // Start timing the request
    $_SERVER['REQUEST_START_TIME'] = microtime(true);
    
    // Add access log entry
    $logEntry = sprintf(
        '[%s] [%s] [%s] [%s] "%s %s" "%s" "%s" [source: %s] [size: %d]' . PHP_EOL,
        $timestamp,
        $requestId,
        $ipAddress,
        $method,
        $method,
        $uri,
        substr($userAgent, 0, 100),
        $referer,
        $source,
        $contentLength
    );
    
    error_log($logEntry, 3, $accessLogFile);
    
    return $requestId;
}

// Determine the source of the request from headers
function determineSourceFromHeaders() {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    
    if (!$apiKey) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $apiKey = $matches[1];
        }
    }
    
    // In a real implementation, you would look up the API key in your database
    // to determine the actual source. For now, we'll return 'Unknown'
    return 'Unknown';
}

// Enhanced function to log API requests with timing info
function logApiRequest($endpoint, $status, $message = '') {
    global $config;
    try {
        $logFile = $config['storage_path'] . '/api_log.txt';
        $timestamp = date('Y-m-d H:i:s');
        
        // Calculate response time if we have a start time
        $responseTime = '';
        if (isset($_SERVER['REQUEST_START_TIME'])) {
            $endTime = microtime(true);
            $responseTime = round(($endTime - $_SERVER['REQUEST_START_TIME']) * 1000);
            $responseTime = " - Response time: {$responseTime}ms";
        }
        
        // Get client IP and source info
        $ip = anonymizeIpAddress($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
        $source = determineSourceFromHeaders();
        
        // Create log entry
        $logEntry = "[$timestamp] $endpoint - Status: $status" . 
                   ($message ? " - $message" : "") . 
                   $responseTime . 
                   " - IP: $ip" . 
                   " - Source: $source" . 
                   PHP_EOL;
                   
        @file_put_contents($logFile, $logEntry, FILE_APPEND);
    } catch (Exception $e) {
        // Silently fail if logging fails - don't disrupt API operation
        error_log("Failed to log API request: " . $e->getMessage());
    }
}

// Set up error handling
set_error_handler('productionErrorHandler');
set_exception_handler('productionExceptionHandler');

// Configure PHP error settings
error_reporting(E_ALL); // Report all PHP errors
ini_set('display_errors', 0); // Don't display errors to users
ini_set('display_startup_errors', 0); // Don't display startup errors
ini_set('log_errors', 1); // Enable error logging
ini_set('error_log', $errorLogFile); // Set default error log file

// Log beginning of request (for access logging)
$requestId = logApiAccess();

// Send security headers
header('X-Request-ID: ' . $requestId);
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
