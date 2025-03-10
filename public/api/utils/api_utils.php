
<?php
// General API utility functions

/**
 * Safely gets a value from a JSON request body
 */
function getJsonRequestValue($data, $key, $default = null) {
    return isset($data[$key]) ? $data[$key] : $default;
}

/**
 * Sends a JSON response
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Sends an error response
 */
function sendErrorResponse($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
    exit;
}

/**
 * Loads a JSON file or returns a default value if not found
 */
function loadJsonFile($filePath, $default = []) {
    if (file_exists($filePath)) {
        $data = json_decode(file_get_contents($filePath), true);
        return ($data !== null) ? $data : $default;
    }
    return $default;
}

/**
 * Saves data to a JSON file
 */
function saveJsonFile($filePath, $data) {
    return file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
}
