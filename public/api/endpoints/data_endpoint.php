<?php
// Data endpoint handler - Production-ready implementation

function handleDataEndpoint() {
    global $config;
    
    // 1. Validate request method (only accept POST)
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405); // Method Not Allowed
        echo json_encode(['error' => 'Only POST method is allowed for data submission']);
        logApiRequest('data', 'error', 'Invalid request method: ' . $_SERVER['REQUEST_METHOD']);
        return;
    }
    
    // 2. Authenticate request using API key
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (empty($apiKey)) {
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'API key is required']);
        logApiRequest('data', 'error', 'Missing API key');
        return;
    }
    
    // 3. Validate API key against registered sources
    $sourceId = validateApiKey($apiKey);
    if (!$sourceId) {
        http_response_code(403); // Forbidden
        echo json_encode(['error' => 'Invalid or inactive API key']);
        logApiRequest('data', 'error', 'Invalid API key: ' . substr($apiKey, 0, 8) . '...');
        return;
    }
    
    // 4. Parse and validate input data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400); // Bad Request
        echo json_encode([
            'error' => 'Invalid JSON format', 
            'details' => json_last_error_msg()
        ]);
        logApiRequest('data', 'error', 'Invalid JSON: ' . json_last_error_msg());
        return;
    }
    
    // 5. Validate data against schema for this API key
    $validationResult = validateDataAgainstSchemaForApiKey($data, $apiKey);
    if (!$validationResult['valid']) {
        http_response_code(400); // Bad Request
        echo json_encode([
            'error' => 'Data validation failed',
            'details' => $validationResult['errors']
        ]);
        logApiRequest('data', 'error', 'Schema validation failed: ' . implode(', ', $validationResult['errors']));
        return;
    }
    
    // 6. Sanitize data (prevent injection, XSS)
    $sanitizedData = sanitizeData($data);
    
    // 7. Add metadata
    $processedData = addMetadata($sanitizedData, $sourceId);
    
    // 8. Store the data
    try {
        // Create directory structure if it doesn't exist
        $storageDir = $config['storage_path'] . '/' . date('Y/m/d');
        if (!file_exists($storageDir)) {
            mkdir($storageDir, 0755, true);
        }
        
        // Generate unique filename with timestamp and UUID
        $timestamp = date('Ymd_His');
        $uniqueId = uniqid('', true);
        $dataFile = $storageDir . '/data_' . $timestamp . '_' . $uniqueId . '.json';
        
        // Write data to file with JSON pretty print (human-readable)
        if (!file_put_contents($dataFile, json_encode($processedData, JSON_PRETTY_PRINT))) {
            throw new Exception("Failed to write data to file");
        }
        
        // 9. Update source statistics (data count, last activity)
        updateSourceStats($sourceId);
        
        // 10. Log successful submission
        logApiRequest('data', 'success', 'Data stored in ' . basename($dataFile));
        
        // 11. Return success response with receipt ID
        echo json_encode([
            'success' => true,
            'message' => 'Data received and processed successfully',
            'receipt' => [
                'id' => $processedData['id'],
                'timestamp' => $processedData['processedAt'],
                'source' => $sourceId
            ]
        ]);
        
    } catch (Exception $e) {
        // Handle storage errors
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Failed to process data submission']);
        logApiRequest('data', 'error', 'Storage error: ' . $e->getMessage());
    }
}

// Helper function to validate API key against sources
function validateApiKey($apiKey) {
    // In a production system, this would check against a secure database
    $sourcesDir = dirname(__DIR__) . '/data/sources';
    if (!file_exists($sourcesDir)) {
        return false;
    }
    
    // Production implementation should use prepared statements if using SQL
    // For file-based storage, we implement proper validation and security
    $files = glob($sourcesDir . '/*.json');
    foreach ($files as $file) {
        $source = json_decode(file_get_contents($file), true);
        if (isset($source['apiKey']) && $source['apiKey'] === $apiKey && $source['active'] === true) {
            return $source['id'];
        }
    }
    
    return false;
}

// Helper function to validate data against schema for a specific API key
function validateDataAgainstSchemaForApiKey($data, $apiKey) {
    // Get schema for this API key
    $schema = getSchemaForApiKey($apiKey);
    
    // Validate data against the schema
    return validateDataAgainstSchema($data, $schema);
}

// Helper function to determine data type
function getDataType($value) {
    if (is_numeric($value)) {
        return 'number';
    } else if (is_bool($value)) {
        return 'boolean';
    } else if (is_string($value)) {
        return 'string';
    } else if (is_array($value)) {
        return 'array';
    } else if (is_object($value)) {
        return 'object';
    } else {
        return 'unknown';
    }
}

// Helper function to sanitize data (prevent injection, XSS)
function sanitizeData($data) {
    $sanitized = [];
    
    foreach ($data as $key => $value) {
        if (is_string($value)) {
            // Sanitize strings to prevent XSS
            $sanitized[$key] = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        } else if (is_array($value)) {
            // Recursively sanitize nested arrays
            $sanitized[$key] = sanitizeData($value);
        } else {
            // Keep other types as is
            $sanitized[$key] = $value;
        }
    }
    
    return $sanitized;
}

// Helper function to add metadata to data
function addMetadata($data, $sourceId) {
    $data['id'] = generateUniqueId();
    $data['sourceId'] = $sourceId;
    $data['receivedAt'] = date('Y-m-d\TH:i:s.v\Z');
    $data['processedAt'] = date('Y-m-d\TH:i:s.v\Z');
    $data['clientIp'] = anonymizeIp($_SERVER['REMOTE_ADDR']);
    $data['userAgent'] = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    // Add additional business metadata
    $data['processingVersion'] = '1.0.0';
    $data['dataHash'] = hash('sha256', json_encode($data));
    
    // Add location data if available
    if (isset($_SERVER['GEOIP_COUNTRY_CODE'])) {
        $data['geoCountry'] = $_SERVER['GEOIP_COUNTRY_CODE'];
    }
    
    return $data;
}

// Generate a unique ID (UUID v4)
function generateUniqueId() {
    // Generate 16 bytes of random data
    $data = random_bytes(16);
    
    // Set version to 0100
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    // Set bits 6-7 to 10
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    
    // Output the 36 character UUID
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// Anonymize IP address (keep only first two octets for IPv4)
function anonymizeIp($ip) {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $parts = explode('.', $ip);
        return $parts[0] . '.' . $parts[1] . '.0.0';
    } else if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        $parts = explode(':', $ip);
        return $parts[0] . ':' . $parts[1] . ':' . $parts[2] . ':0:0:0:0:0';
    }
    return 'unknown';
}

// Update source statistics
function updateSourceStats($sourceId) {
    $sourcesDir = dirname(__DIR__) . '/data/sources';
    $sourceFile = $sourcesDir . '/' . $sourceId . '.json';
    
    if (file_exists($sourceFile)) {
        $source = json_decode(file_get_contents($sourceFile), true);
        $source['dataCount'] = ($source['dataCount'] ?? 0) + 1;
        $source['lastActive'] = date('Y-m-d\TH:i:s\Z');
        
        // Calculate and update data rate (submissions per hour)
        $now = time();
        $lastHour = $now - 3600;
        
        if (!isset($source['recentSubmissions'])) {
            $source['recentSubmissions'] = [];
        }
        
        // Add this submission timestamp
        $source['recentSubmissions'][] = $now;
        
        // Keep only submissions from the last hour
        $source['recentSubmissions'] = array_filter($source['recentSubmissions'], 
            function($timestamp) use ($lastHour) {
                return $timestamp >= $lastHour;
            }
        );
        
        // Calculate rate (submissions per hour)
        $source['submissionRate'] = count($source['recentSubmissions']);
        
        // Save updated source
        file_put_contents($sourceFile, json_encode($source, JSON_PRETTY_PRINT));
    }
}
