
<?php
// Schema endpoint handler

// Include the schema validator utility
require_once dirname(__DIR__) . '/utils/schema_validator.php';

function handleSchemaEndpoint() {
    global $config;
    
    // Handle schema management
    $method = $_SERVER['REQUEST_METHOD'];
    $schemaFile = $config['storage_path'] . '/schema.json';
    
    // Get schema
    if ($method === 'GET') {
        $schema = loadSchema($schemaFile);
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
        
        // Validate schema structure
        if (!validateSchemaStructure($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid schema structure']);
            logApiRequest('schema', 'error', 'Invalid schema structure');
            return;
        }
        
        // Save schema
        if (saveSchema($schemaFile, $data)) {
            logApiRequest('schema', 'success', 'Updated schema');
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save schema']);
            logApiRequest('schema', 'error', 'Failed to save schema');
        }
    }
    // Validate data against schema
    else if ($method === 'PUT') {
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        if (!$requestData || !isset($requestData['data'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request data']);
            logApiRequest('schema', 'error', 'Invalid validation request');
            return;
        }
        
        $schema = loadSchema($schemaFile);
        $validationResult = validateDataAgainstSchema($requestData['data'], $schema);
        
        echo json_encode([
            'valid' => $validationResult['valid'],
            'errors' => $validationResult['errors']
        ]);
        
        logApiRequest('schema', $validationResult['valid'] ? 'success' : 'error', 
            $validationResult['valid'] ? 'Data validation succeeded' : 'Data validation failed');
    }
    else {
        http_response_code(405); // Method Not Allowed
        echo json_encode(['error' => 'Method not allowed']);
        logApiRequest('schema', 'error', 'Invalid method: ' . $method);
    }
}

/**
 * Validates the schema structure
 * 
 * @param array $schema The schema to validate
 * @return bool True if the schema has a valid structure, false otherwise
 */
function validateSchemaStructure($schema) {
    // Check if the schema has the required keys
    if (!isset($schema['fieldTypes']) || !is_array($schema['fieldTypes'])) {
        return false;
    }
    
    if (!isset($schema['requiredFields']) || !is_array($schema['requiredFields'])) {
        return false;
    }
    
    // Check if all required fields exist in fieldTypes
    foreach ($schema['requiredFields'] as $field) {
        if (!isset($schema['fieldTypes'][$field])) {
            return false;
        }
    }
    
    // Validate field types
    $validTypes = ['string', 'number', 'boolean', 'object', 'array'];
    foreach ($schema['fieldTypes'] as $field => $type) {
        if (!in_array($type, $validTypes)) {
            return false;
        }
    }
    
    return true;
}
