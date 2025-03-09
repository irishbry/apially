
<?php
// Main API entry point
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

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
        
    case 'login':
        // Handle login request - for demo, just return success if credentials match
        $data = json_decode(file_get_contents('php://input'), true);
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        
        if ($username === 'admin' && $password === 'password') {
            echo json_encode([
                'success' => true,
                'message' => 'Login successful'
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid credentials'
            ]);
        }
        break;
        
    case 'data':
        // Handle data submission
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
        if (empty($apiKey)) {
            http_response_code(401);
            echo json_encode(['error' => 'API key is required']);
            break;
        }
        
        // For demo, we'll accept any data with a valid structure
        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON format']);
            break;
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Data received successfully',
            'data' => $data
        ]);
        break;
        
    case '':
        echo json_encode([
            'name' => 'Data Consolidation API',
            'version' => '1.0.0',
            'endpoints' => ['/status', '/test', '/login', '/data']
        ]);
        break;
        
    default:
        header('HTTP/1.1 404 Not Found');
        echo json_encode(['error' => 'Endpoint not found']);
}
