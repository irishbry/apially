
<?php
// Sources endpoint handler

function handleSourcesEndpoint() {
    global $config;
    
    // Handle sources data
    $method = $_SERVER['REQUEST_METHOD'];
    $sourcesFile = $config['storage_path'] . '/sources.json';
    
    // Get sources
    if ($method === 'GET') {
        $sources = loadJsonFile($sourcesFile, []);
        echo json_encode(['sources' => $sources]);
        logApiRequest('sources', 'success', 'Retrieved sources list');
    } 
    // Add or update source
    else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['name']) || !isset($data['url'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request data']);
            logApiRequest('sources', 'error', 'Invalid source data');
            return;
        }
        
        // Get existing sources
        $sources = loadJsonFile($sourcesFile, []);
        
        // Add the new source with unique ID
        $sources[] = [
            'id' => uniqid(),
            'name' => $data['name'],
            'url' => $data['url'],
            'type' => $data['type'] ?? 'csv',
            'dateAdded' => date('c')
        ];
        
        // Save updated sources
        saveJsonFile($sourcesFile, $sources);
        
        logApiRequest('sources', 'success', 'Added new source: ' . $data['name']);
        echo json_encode(['success' => true]);
    }
}
