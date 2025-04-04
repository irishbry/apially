
<?php
/**
 * Schema Validator Utility
 * 
 * Provides functions for schema management and validation
 */

/**
 * Validates data against the defined schema
 * 
 * @param array $data The data to validate
 * @param array $schema The schema to validate against
 * @return array Validation result with 'valid' boolean and 'errors' array
 */
function validateDataAgainstSchema($data, $schema) {
    $errors = [];
    $valid = true;
    
    // Check required fields
    if (isset($schema['requiredFields']) && is_array($schema['requiredFields'])) {
        foreach ($schema['requiredFields'] as $field) {
            if (!isset($data[$field]) || $data[$field] === null || $data[$field] === '') {
                $errors[] = "Missing required field: {$field}";
                $valid = false;
            }
        }
    }
    
    // Check field types
    if (isset($schema['fieldTypes']) && is_array($schema['fieldTypes'])) {
        foreach ($schema['fieldTypes'] as $field => $expectedType) {
            if (isset($data[$field]) && $data[$field] !== null && $data[$field] !== '') {
                $actualType = getDataType($data[$field]);
                if ($actualType !== $expectedType) {
                    $errors[] = "Field {$field} should be type {$expectedType}, got {$actualType}";
                    $valid = false;
                }
            }
        }
    }
    
    return [
        'valid' => $valid,
        'errors' => $errors
    ];
}

/**
 * Determines the data type of a value
 * 
 * @param mixed $value The value to check
 * @return string The data type ('number', 'boolean', 'string', 'array', 'object', or 'unknown')
 */
function getDataType($value) {
    if (is_numeric($value)) {
        return 'number';
    } else if (is_bool($value)) {
        return 'boolean';
    } else if (is_string($value)) {
        return 'string';
    } else if (is_array($value)) {
        // Check if it's an associative array (object) or indexed array
        return array_keys($value) === range(0, count($value) - 1) ? 'array' : 'object';
    } else if (is_object($value)) {
        return 'object';
    } else {
        return 'unknown';
    }
}

/**
 * Gets the schema for a specific API key
 * 
 * @param string $apiKey The API key to get the schema for
 * @return array The schema data or default schema if not found
 */
function getSchemaForApiKey($apiKey) {
    $sourcesDir = dirname(__DIR__) . '/data/sources';
    if (!file_exists($sourcesDir)) {
        return getDefaultSchema();
    }
    
    // Lookup the source file for this API key
    $files = glob($sourcesDir . '/*.json');
    foreach ($files as $file) {
        $source = json_decode(file_get_contents($file), true);
        if (isset($source['apiKey']) && $source['apiKey'] === $apiKey) {
            if (isset($source['schema']) && is_array($source['schema'])) {
                return $source['schema'];
            }
            
            // If this source doesn't have a schema, break and use the default
            break;
        }
    }
    
    // If no schema found for this API key, load the default schema
    return getDefaultSchema();
}

/**
 * Loads the current schema
 * 
 * @param string $schemaFile Path to the schema file
 * @return array The schema data or default schema if file doesn't exist
 */
function loadSchema($schemaFile) {
    if (file_exists($schemaFile)) {
        $schema = json_decode(file_get_contents($schemaFile), true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $schema;
        }
    }
    
    // Return default schema if file doesn't exist or is invalid
    return getDefaultSchema();
}

/**
 * Returns the default schema
 * 
 * @return array The default schema structure
 */
function getDefaultSchema() {
    return [
        'fieldTypes' => [],
        'requiredFields' => []
    ];
}

/**
 * Saves a schema to file
 * 
 * @param string $schemaFile Path to save the schema file
 * @param array $schema The schema data to save
 * @return bool True if the schema was saved successfully, false otherwise
 */
function saveSchema($schemaFile, $schema) {
    // Ensure the directory exists
    $dir = dirname($schemaFile);
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
    
    // Save the schema with pretty print for readability
    return file_put_contents($schemaFile, json_encode($schema, JSON_PRETTY_PRINT)) !== false;
}

/**
 * Updates a schema for a specific API key
 * 
 * @param string $apiKey The API key to update the schema for
 * @param array $schema The schema data to save
 * @return bool True if the schema was saved successfully, false otherwise
 */
function saveSchemaForApiKey($apiKey, $schema) {
    $sourcesDir = dirname(__DIR__) . '/data/sources';
    if (!file_exists($sourcesDir)) {
        return false;
    }
    
    // Find the source file for this API key
    $files = glob($sourcesDir . '/*.json');
    foreach ($files as $file) {
        $source = json_decode(file_get_contents($file), true);
        if (isset($source['apiKey']) && $source['apiKey'] === $apiKey) {
            // Update schema in the source file
            $source['schema'] = $schema;
            return file_put_contents($file, json_encode($source, JSON_PRETTY_PRINT)) !== false;
        }
    }
    
    return false;
}
