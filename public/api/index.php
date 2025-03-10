
<?php
// Main API entry point
require_once 'utils/error_handler.php';
require_once 'config.php';
require_once 'utils/api_utils.php';
require_once 'endpoints/status_endpoint.php';
require_once 'endpoints/login_endpoint.php';
require_once 'endpoints/data_endpoint.php';
require_once 'endpoints/sources_endpoint.php';
require_once 'endpoints/schema_endpoint.php';
require_once 'endpoints/api_key_endpoint.php';

// Set content type and CORS headers
header('Content-Type: application/json');
setCorsHeaders();

// Check for actual path
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$endpoint = str_replace($basePath, '', $requestPath);
$endpoint = trim($endpoint, '/');

// Simple routing
try {
    switch ($endpoint) {
        case 'status':
            handleStatusEndpoint();
            break;
            
        case 'test':
            include 'test.php';
            break;
            
        case 'login':
            handleLoginEndpoint();
            break;
            
        case 'data':
            handleDataEndpoint();
            break;
            
        case 'sources':
            handleSourcesEndpoint();
            break;
            
        case 'schema':
            handleSchemaEndpoint();
            break;
            
        case 'api-key':
            handleApiKeyEndpoint();
            break;
            
        case '':
            echo json_encode([
                'name' => 'Data Consolidation API',
                'version' => '1.0.0',
                'endpoints' => ['/status', '/test', '/login', '/data', '/sources', '/schema', '/api-key']
            ]);
            break;
            
        default:
            header('HTTP/1.1 404 Not Found');
            echo json_encode(['error' => 'Endpoint not found']);
            logApiRequest($endpoint, 'error', 'Endpoint not found');
    }
} catch (Exception $e) {
    // Log the error and return a generic message
    logApiRequest($endpoint, 'error', $e->getMessage());
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'An internal server error occurred']);
}

