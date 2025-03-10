
<?php
// Production error handler
function productionErrorHandler($errno, $errstr, $errfile, $errline) {
    // Log error details to file
    $errorLog = dirname(__DIR__) . '/logs/error.log';
    $timestamp = date('Y-m-d H:i:s');
    $errorMessage = "[$timestamp] Error ($errno): $errstr in $errfile on line $errline\n";
    error_log($errorMessage, 3, $errorLog);
    
    // Return a generic error message to the user
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'An internal server error occurred']);
    exit;
}

// Set the error handler
set_error_handler('productionErrorHandler');

// Handle uncaught exceptions
set_exception_handler(function($exception) {
    productionErrorHandler(
        E_ERROR,
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine()
    );
});

// Ensure all errors are caught
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', dirname(__DIR__) . '/logs/error.log');

