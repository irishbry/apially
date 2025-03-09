
<?php
// Main API entry point
header('Content-Type: application/json');

// Check for actual path
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$endpoint = str_replace($basePath, '', $requestPath);
$endpoint = trim($endpoint, '/');

// Simple routing
switch ($endpoint) {
    case 'status':
        echo json_encode([
            'status' => 'ok',
            'version' => '1.0.0',
            'timestamp' => date('c')
        ]);
        break;
        
    case 'test':
        include 'test.php';
        break;
        
    case '':
        echo json_encode([
            'name' => 'Data Consolidation API',
            'version' => '1.0.0',
            'endpoints' => ['/status', '/test']
        ]);
        break;
        
    default:
        header('HTTP/1.1 404 Not Found');
        echo json_encode(['error' => 'Endpoint not found']);
}
