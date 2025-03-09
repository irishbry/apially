
<?php
// Main API entry point
require_once 'config.php';

// Set content type and CORS headers
header('Content-Type: application/json');
setCorsHeaders();

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
        logApiRequest('status', 'success');
        break;
        
    case 'test':
        include 'test.php';
        break;
        
    case 'login':
        // Handle login request
        $data = json_decode(file_get_contents('php://input'), true);
        $username = isset($data['username']) ? $data['username'] : '';
        $password = isset($data['password']) ? $data['password'] : '';
        
        if ($username === $config['demo_user'] && $password === $config['demo_password']) {
            logApiRequest('login', 'success', "User: $username");
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'username' => $username,
                    'role' => 'admin'
                ]
            ]);
        } else {
            logApiRequest('login', 'failed', "Invalid credentials attempt");
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
            logApiRequest('data', 'error', 'Missing API key');
            break;
        }
        
        // For demo, we'll accept any data with a valid structure
        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON format']);
            logApiRequest('data', 'error', 'Invalid JSON: ' . json_last_error_msg());
            break;
        }
        
        // Store the data (in a real app, you would do more processing here)
        $dataFile = $config['storage_path'] . '/data_' . date('Ymd_His') . '.json';
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
        
        logApiRequest('data', 'success', 'Data stored in ' . basename($dataFile));
        
        echo json_encode([
            'success' => true,
            'message' => 'Data received successfully',
            'data' => $data
        ]);
        break;
        
    case 'sources':
        // Handle sources data
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Get sources
        if ($method === 'GET') {
            $sourcesFile = $config['storage_path'] . '/sources.json';
            
            if (file_exists($sourcesFile)) {
                $sources = json_decode(file_get_contents($sourcesFile), true) ?: [];
                echo json_encode(['sources' => $sources]);
            } else {
                echo json_encode(['sources' => []]);
            }
            logApiRequest('sources', 'success', 'Retrieved sources list');
        } 
        // Add or update source
        else if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['name']) || !isset($data['url'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid request data']);
                logApiRequest('sources', 'error', 'Invalid source data');
                break;
            }
            
            // Get existing sources
            $sourcesFile = $config['storage_path'] . '/sources.json';
            $sources = [];
            
            if (file_exists($sourcesFile)) {
                $sources = json_decode(file_get_contents($sourcesFile), true) ?: [];
            }
            
            // Add the new source with unique ID
            $sources[] = [
                'id' => uniqid(),
                'name' => $data['name'],
                'url' => $data['url'],
                'type' => $data['type'] ?? 'csv',
                'dateAdded' => date('c')
            ];
            
            // Save updated sources
            file_put_contents($sourcesFile, json_encode($sources, JSON_PRETTY_PRINT));
            
            logApiRequest('sources', 'success', 'Added new source: ' . $data['name']);
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'schema':
        // Handle schema management
        $method = $_SERVER['REQUEST_METHOD'];
        
        // Get schema
        if ($method === 'GET') {
            $schemaFile = $config['storage_path'] . '/schema.json';
            
            if (file_exists($schemaFile)) {
                $schema = json_decode(file_get_contents($schemaFile), true) ?: [];
                echo json_encode(['schema' => $schema]);
            } else {
                echo json_encode(['schema' => [
                    'fields' => [],
                    'mappings' => []
                ]]);
            }
            logApiRequest('schema', 'success', 'Retrieved schema');
        } 
        // Update schema
        else if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid schema data']);
                logApiRequest('schema', 'error', 'Invalid schema data');
                break;
            }
            
            // Save schema
            $schemaFile = $config['storage_path'] . '/schema.json';
            file_put_contents($schemaFile, json_encode($data, JSON_PRETTY_PRINT));
            
            logApiRequest('schema', 'success', 'Updated schema');
            echo json_encode(['success' => true]);
        }
        break;
        
    case 'api-key':
        // Update API key (would require authentication in production)
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['apiKey'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid API key data']);
                break;
            }
            
            // In a real app, you would update the API key in a secure way
            // For demo purposes, we'll just return success
            echo json_encode([
                'success' => true,
                'message' => 'API key updated successfully'
            ]);
            logApiRequest('api-key', 'success', 'API key updated');
        }
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
