
<?php
// Schema endpoint handler

function handleSchemaEndpoint() {
    global $config;
    
    // Handle schema management
    $method = $_SERVER['REQUEST_METHOD'];
    $schemaFile = $config['storage_path'] . '/schema.json';
    
    // Get schema
    if ($method === 'GET') {
        $schema = loadJsonFile($schemaFile, ['fields' => [], 'mappings' => []]);
        echo json_encode(['schema' => $schema]);
        logApiRequest('schema', 'success', 'Retrieved schema');
    } 
    // Update schema
    else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid schema data']);
            logApiRequest('schema', 'error', 'Invalid schema data');
            return;
        }
        
        // Save schema
        saveJsonFile($schemaFile, $data);
        
        logApiRequest('schema', 'success', 'Updated schema');
        echo json_encode(['success' => true]);
    }
}
