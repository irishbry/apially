
<?php
// Data endpoint handler

function handleDataEndpoint() {
    global $config;
    
    // Handle data submission
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (empty($apiKey)) {
        http_response_code(401);
        echo json_encode(['error' => 'API key is required']);
        logApiRequest('data', 'error', 'Missing API key');
        return;
    }
    
    // For demo, we'll accept any data with a valid structure
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON format']);
        logApiRequest('data', 'error', 'Invalid JSON: ' . json_last_error_msg());
        return;
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
}
