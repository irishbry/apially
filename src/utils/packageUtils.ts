
import JSZip from 'jszip';
import FileSaver from 'file-saver';

// Helper function to create a frontend package
export const packageFrontendFiles = async () => {
  try {
    const zip = new JSZip();

    // Create index.html
    zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <title>CSV Consolidator Portal</title>
    <link rel="stylesheet" href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`);

    // Create .htaccess for SPA routing
    zip.file(".htaccess", `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`);

    // Create assets directory with dummy files (in real deployment these would be the built assets)
    const assets = zip.folder("assets");
    assets.file("index.js", "// This would be your compiled JavaScript in production");
    assets.file("index.css", "/* This would be your compiled CSS in production */");

    // Add a README file with instructions
    zip.file("README.md", `# Frontend Deployment Package

This package contains the built frontend files for the CSV Consolidator application.

## Deployment Instructions

1. Upload all files to your web server's root directory.
2. Ensure the .htaccess file is uploaded if you're using Apache.
3. Configure your web server to serve the application.
4. Access the application by visiting your domain in a browser.

For detailed instructions, please refer to the deployment guide in the application.`);

    // Generate and download the ZIP file
    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, "frontend-files.zip");
    
    return true;
  } catch (error) {
    console.error("Error creating frontend package:", error);
    throw error;
  }
};

// Helper function to create an API package
export const packageApiFiles = async () => {
  try {
    const zip = new JSZip();
    
    // Create main API files
    zip.file("index.php", `<?php
// Main API entry point
require_once 'utils/error_handler.php';
require_once 'config.php';
require_once 'utils/api_utils.php';
require_once 'endpoints/status_endpoint.php';
require_once 'endpoints/login_endpoint.php';
require_once 'endpoints/data_endpoint.php';
require_once 'endpoints/sources_endpoint.php';
require_once 'endpoints/schema_endpoint.php';
require_once 'endpoints/api_key_endpoint.php';

// Set content type and CORS headers
header('Content-Type: application/json');
setCorsHeaders();

// Check for actual path
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$endpoint = str_replace($basePath, '', $requestPath);
$endpoint = trim($endpoint, '/');

// Simple routing
try {
    switch ($endpoint) {
        case 'status':
            handleStatusEndpoint();
            break;
            
        case 'test':
            include 'test.php';
            break;
            
        case 'login':
            handleLoginEndpoint();
            break;
            
        case 'data':
            handleDataEndpoint();
            break;
            
        case 'sources':
            handleSourcesEndpoint();
            break;
            
        case 'schema':
            handleSchemaEndpoint();
            break;
            
        case 'api-key':
            handleApiKeyEndpoint();
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
} catch (Exception $e) {
    // Log the error and return a generic message
    logApiRequest($endpoint, 'error', $e->getMessage());
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'An internal server error occurred']);
}`);

    // Create .htaccess for API routing
    zip.file(".htaccess", `# Enable rewrite engine
RewriteEngine On

# Explicitly set the RewriteBase to match your installation directory
RewriteBase /api/

# If the request is for a real file or directory, skip rewrite rules
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite all other URLs to index.php
RewriteRule ^(.*)$ index.php [QSA,L]

# Add CORS headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, X-API-Key"
</IfModule>

# Protect data directory
<IfModule mod_rewrite.c>
    RewriteRule ^data/ - [F,L]
</IfModule>`);

    // Create config.php
    zip.file("config.php", `<?php
// Simple configuration file for Data Consolidation API

$config = [
    // Allowed origins for CORS
    'allowed_origins' => ['*'], // Replace with your frontend domain in production
    
    // Path to data storage directory
    'storage_path' => __DIR__ . '/data',
    
    // API key (change this in production)
    'api_key' => 'your-secure-api-key-here'
];

// Create storage directory if it doesn't exist
if (!file_exists($config['storage_path'])) {
    mkdir($config['storage_path'], 0755, true);
}`);

    // Create test.php
    zip.file("test.php", `<?php
// Test script to verify installation
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Installation Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .test { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <h1>API Installation Test</h1>
    
    <div class="test">
        <h3>PHP Version</h3>
        <?php
        if (version_compare(PHP_VERSION, '7.0.0', '>=')) {
            echo "<p><span class='success'>✓</span> PHP Version: " . PHP_VERSION . "</p>";
        } else {
            echo "<p><span class='error'>✗</span> PHP Version: " . PHP_VERSION . " (Required: 7.0+)</p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>Required Extensions</h3>
        <?php
        $required_extensions = ['json', 'curl'];
        foreach ($required_extensions as $ext) {
            if (extension_loaded($ext)) {
                echo "<p><span class='success'>✓</span> $ext extension is loaded</p>";
            } else {
                echo "<p><span class='error'>✗</span> $ext extension is NOT loaded</p>";
            }
        }
        ?>
    </div>
    
    <div class="test">
        <h3>File Permissions</h3>
        <?php
        $data_dir = __DIR__ . '/data';
        if (file_exists($data_dir) && is_dir($data_dir)) {
            echo "<p><span class='success'>✓</span> Data directory exists</p>";
            
            if (is_writable($data_dir)) {
                echo "<p><span class='success'>✓</span> Data directory is writable</p>";
            } else {
                echo "<p><span class='error'>✗</span> Data directory is not writable</p>";
            }
        } else {
            echo "<p><span class='error'>✗</span> Data directory does not exist</p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>API Configuration</h3>
        <?php
        if (file_exists(__DIR__ . '/config.php')) {
            echo "<p><span class='success'>✓</span> config.php exists</p>";
        } else {
            echo "<p><span class='error'>✗</span> config.php does not exist</p>";
        }
        
        if (file_exists(__DIR__ . '/.htaccess')) {
            echo "<p><span class='success'>✓</span> .htaccess file exists</p>";
        } else {
            echo "<p><span class='error'>✗</span> .htaccess file does not exist</p>";
        }
        ?>
    </div>
</body>
</html>`);

    // Create placeholder directories with readme files
    const dataDir = zip.folder("data");
    dataDir.file(".gitkeep", "");
    
    const utilsDir = zip.folder("utils");
    utilsDir.file("error_handler.php", `<?php
// Simple error handler for the API
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set a custom error handler
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        // This error code is not included in error_reporting
        return;
    }
    
    $error = [
        'type' => $severity,
        'message' => $message,
        'file' => $file,
        'line' => $line
    ];
    
    // Log error to file
    error_log(json_encode($error) . "\n", 3, __DIR__ . '/../data/error.log');
    
    // Return a generic error for production
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'An internal server error occurred']);
    exit(1);
});

// Set exception handler
set_exception_handler(function($exception) {
    $error = [
        'type' => get_class($exception),
        'message' => $exception->getMessage(),
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => $exception->getTraceAsString()
    ];
    
    // Log exception to file
    error_log(json_encode($error) . "\n", 3, __DIR__ . '/../data/error.log');
    
    // Return a generic error for production
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'An internal server error occurred']);
    exit(1);
});`);

    utilsDir.file("api_utils.php", `<?php
// Utility functions for the API

// Set CORS headers
function setCorsHeaders() {
    global $config;
    
    // Get the origin
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // Check if the origin is allowed
    if (in_array('*', $config['allowed_origins']) || in_array($origin, $config['allowed_origins'])) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: " . $config['allowed_origins'][0]);
    }
    
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-API-Key");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Log API requests
function logApiRequest($endpoint, $status, $message = '') {
    $log = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'],
        'endpoint' => $endpoint,
        'method' => $_SERVER['REQUEST_METHOD'],
        'status' => $status,
        'message' => $message
    ];
    
    // Append to log file
    @file_put_contents(
        __DIR__ . '/../data/api.log',
        json_encode($log) . "\n",
        FILE_APPEND
    );
}

// Validate API key
function validateApiKey() {
    global $config;
    
    // Get API key from headers
    $headers = getallheaders();
    $apiKey = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : '';
    
    // Check if the API key is valid
    if ($apiKey !== $config['api_key']) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['error' => 'Invalid API key']);
        exit();
    }
    
    return true;
}`);
    
    // Create endpoints directory
    const endpointsDir = zip.folder("endpoints");
    endpointsDir.file("status_endpoint.php", `<?php
// Status endpoint
function handleStatusEndpoint() {
    // Return basic status information
    echo json_encode([
        'status' => 'ok',
        'version' => '1.0.0',
        'timestamp' => date('c')
    ]);
    
    // Log the request
    logApiRequest('status', 'success');
}`);

    // Add a placeholder for other endpoints
    endpointsDir.file("login_endpoint.php", "<?php\n// Login endpoint\nfunction handleLoginEndpoint() {\n    // Implementation here\n}");
    endpointsDir.file("data_endpoint.php", "<?php\n// Data endpoint\nfunction handleDataEndpoint() {\n    // Implementation here\n}");
    endpointsDir.file("sources_endpoint.php", "<?php\n// Sources endpoint\nfunction handleSourcesEndpoint() {\n    // Implementation here\n}");
    endpointsDir.file("schema_endpoint.php", "<?php\n// Schema endpoint\nfunction handleSchemaEndpoint() {\n    // Implementation here\n}");
    endpointsDir.file("api_key_endpoint.php", "<?php\n// API key endpoint\nfunction handleApiKeyEndpoint() {\n    // Implementation here\n}");

    // Add a README file with instructions
    zip.file("README.md", `# API Deployment Package

This package contains the API files for the CSV Consolidator application.

## Deployment Instructions

1. Create a directory named 'api' in your web server's root directory.
2. Upload all files from this package to the 'api' directory.
3. Make sure the .htaccess file is uploaded (it may be hidden).
4. Set the appropriate file permissions:
   - Directories: 755 (chmod 755 directory-name)
   - Files: 644 (chmod 644 file-name)
   - Data directory: 755 (chmod 755 data)
5. Edit config.php to set your API key and allowed origins.
6. Test the API by visiting yourdomain.com/api/test.php

For detailed instructions, please refer to the deployment guide in the application.`);

    // Generate and download the ZIP file
    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, "api-files.zip");
    
    return true;
  } catch (error) {
    console.error("Error creating API package:", error);
    throw error;
  }
};

// Helper function to create a complete project package
export const packageCompleteProject = async () => {
  try {
    const zip = new JSZip();
    
    // Create frontend directory and add frontend files
    const frontendDir = zip.folder("frontend");
    
    // Add index.html
    frontendDir.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <title>CSV Consolidator Portal</title>
    <link rel="stylesheet" href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`);

    // Add frontend .htaccess
    frontendDir.file(".htaccess", `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`);

    // Add assets directory
    const assetsDir = frontendDir.folder("assets");
    assetsDir.file("index.js", "// This would be your compiled JavaScript in production");
    assetsDir.file("index.css", "/* This would be your compiled CSS in production */");
    
    // Create api directory and add API files
    const apiDir = zip.folder("api");
    
    // Add main API files
    apiDir.file("index.php", `<?php
// Main API entry point
require_once 'utils/error_handler.php';
require_once 'config.php';
require_once 'utils/api_utils.php';
require_once 'endpoints/status_endpoint.php';
require_once 'endpoints/login_endpoint.php';
require_once 'endpoints/data_endpoint.php';
require_once 'endpoints/sources_endpoint.php';
require_once 'endpoints/schema_endpoint.php';
require_once 'endpoints/api_key_endpoint.php';

// Set content type and CORS headers
header('Content-Type: application/json');
setCorsHeaders();

// Check for actual path
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$endpoint = str_replace($basePath, '', $requestPath);
$endpoint = trim($endpoint, '/');

// Simple routing
try {
    switch ($endpoint) {
        case 'status':
            handleStatusEndpoint();
            break;
            
        case 'test':
            include 'test.php';
            break;
            
        case 'login':
            handleLoginEndpoint();
            break;
            
        case 'data':
            handleDataEndpoint();
            break;
            
        case 'sources':
            handleSourcesEndpoint();
            break;
            
        case 'schema':
            handleSchemaEndpoint();
            break;
            
        case 'api-key':
            handleApiKeyEndpoint();
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
} catch (Exception $e) {
    // Log the error and return a generic message
    logApiRequest($endpoint, 'error', $e->getMessage());
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'An internal server error occurred']);
}`);

    // Add API .htaccess
    apiDir.file(".htaccess", `# Enable rewrite engine
RewriteEngine On

# Explicitly set the RewriteBase to match your installation directory
RewriteBase /api/

# If the request is for a real file or directory, skip rewrite rules
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite all other URLs to index.php
RewriteRule ^(.*)$ index.php [QSA,L]

# Add CORS headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, X-API-Key"
</IfModule>

# Protect data directory
<IfModule mod_rewrite.c>
    RewriteRule ^data/ - [F,L]
</IfModule>`);

    // Add config.php
    apiDir.file("config.php", `<?php
// Simple configuration file for Data Consolidation API

$config = [
    // Allowed origins for CORS
    'allowed_origins' => ['*'], // Replace with your frontend domain in production
    
    // Path to data storage directory
    'storage_path' => __DIR__ . '/data',
    
    // API key (change this in production)
    'api_key' => 'your-secure-api-key-here'
];

// Create storage directory if it doesn't exist
if (!file_exists($config['storage_path'])) {
    mkdir($config['storage_path'], 0755, true);
}`);

    // Add test.php
    apiDir.file("test.php", `<?php
// Test script to verify installation
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Installation Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .test { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <h1>API Installation Test</h1>
    
    <div class="test">
        <h3>PHP Version</h3>
        <?php
        if (version_compare(PHP_VERSION, '7.0.0', '>=')) {
            echo "<p><span class='success'>✓</span> PHP Version: " . PHP_VERSION . "</p>";
        } else {
            echo "<p><span class='error'>✗</span> PHP Version: " . PHP_VERSION . " (Required: 7.0+)</p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>Required Extensions</h3>
        <?php
        $required_extensions = ['json', 'curl'];
        foreach ($required_extensions as $ext) {
            if (extension_loaded($ext)) {
                echo "<p><span class='success'>✓</span> $ext extension is loaded</p>";
            } else {
                echo "<p><span class='error'>✗</span> $ext extension is NOT loaded</p>";
            }
        }
        ?>
    </div>
    
    <div class="test">
        <h3>File Permissions</h3>
        <?php
        $data_dir = __DIR__ . '/data';
        if (file_exists($data_dir) && is_dir($data_dir)) {
            echo "<p><span class='success'>✓</span> Data directory exists</p>";
            
            if (is_writable($data_dir)) {
                echo "<p><span class='success'>✓</span> Data directory is writable</p>";
            } else {
                echo "<p><span class='error'>✗</span> Data directory is not writable</p>";
            }
        } else {
            echo "<p><span class='error'>✗</span> Data directory does not exist</p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>API Configuration</h3>
        <?php
        if (file_exists(__DIR__ . '/config.php')) {
            echo "<p><span class='success'>✓</span> config.php exists</p>";
        } else {
            echo "<p><span class='error'>✗</span> config.php does not exist</p>";
        }
        
        if (file_exists(__DIR__ . '/.htaccess')) {
            echo "<p><span class='success'>✓</span> .htaccess file exists</p>";
        } else {
            echo "<p><span class='error'>✗</span> .htaccess file does not exist</p>";
        }
        ?>
    </div>
</body>
</html>`);

    // Create data directory
    const apiDataDir = apiDir.folder("data");
    apiDataDir.file(".gitkeep", "");
    
    // Create API utils directory
    const apiUtilsDir = apiDir.folder("utils");
    apiUtilsDir.file("error_handler.php", `<?php
// Simple error handler for the API
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set a custom error handler
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        // This error code is not included in error_reporting
        return;
    }
    
    $error = [
        'type' => $severity,
        'message' => $message,
        'file' => $file,
        'line' => $line
    ];
    
    // Log error to file
    error_log(json_encode($error) . "\n", 3, __DIR__ . '/../data/error.log');
    
    // Return a generic error for production
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'An internal server error occurred']);
    exit(1);
});

// Set exception handler
set_exception_handler(function($exception) {
    $error = [
        'type' => get_class($exception),
        'message' => $exception->getMessage(),
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => $exception->getTraceAsString()
    ];
    
    // Log exception to file
    error_log(json_encode($error) . "\n", 3, __DIR__ . '/../data/error.log');
    
    // Return a generic error for production
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['error' => 'An internal server error occurred']);
    exit(1);
});`);

    apiUtilsDir.file("api_utils.php", `<?php
// Utility functions for the API

// Set CORS headers
function setCorsHeaders() {
    global $config;
    
    // Get the origin
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // Check if the origin is allowed
    if (in_array('*', $config['allowed_origins']) || in_array($origin, $config['allowed_origins'])) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: " . $config['allowed_origins'][0]);
    }
    
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-API-Key");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Log API requests
function logApiRequest($endpoint, $status, $message = '') {
    $log = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'],
        'endpoint' => $endpoint,
        'method' => $_SERVER['REQUEST_METHOD'],
        'status' => $status,
        'message' => $message
    ];
    
    // Append to log file
    @file_put_contents(
        __DIR__ . '/../data/api.log',
        json_encode($log) . "\n",
        FILE_APPEND
    );
}

// Validate API key
function validateApiKey() {
    global $config;
    
    // Get API key from headers
    $headers = getallheaders();
    $apiKey = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : '';
    
    // Check if the API key is valid
    if ($apiKey !== $config['api_key']) {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['error' => 'Invalid API key']);
        exit();
    }
    
    return true;
}`);
    
    // Create API endpoints directory
    const apiEndpointsDir = apiDir.folder("endpoints");
    apiEndpointsDir.file("status_endpoint.php", `<?php
// Status endpoint
function handleStatusEndpoint() {
    // Return basic status information
    echo json_encode([
        'status' => 'ok',
        'version' => '1.0.0',
        'timestamp' => date('c')
    ]);
    
    // Log the request
    logApiRequest('status', 'success');
}`);

    // Add placeholders for other endpoints
    apiEndpointsDir.file("login_endpoint.php", "<?php\n// Login endpoint\nfunction handleLoginEndpoint() {\n    // Implementation here\n}");
    apiEndpointsDir.file("data_endpoint.php", "<?php\n// Data endpoint\nfunction handleDataEndpoint() {\n    // Implementation here\n}");
    apiEndpointsDir.file("sources_endpoint.php", "<?php\n// Sources endpoint\nfunction handleSourcesEndpoint() {\n    // Implementation here\n}");
    apiEndpointsDir.file("schema_endpoint.php", "<?php\n// Schema endpoint\nfunction handleSchemaEndpoint() {\n    // Implementation here\n}");
    apiEndpointsDir.file("api_key_endpoint.php", "<?php\n// API key endpoint\nfunction handleApiKeyEndpoint() {\n    // Implementation here\n}");

    // Add React source files for development (optional)
    const srcDir = zip.folder("src");
    srcDir.file("README.md", `# Source Code

This directory contains the source code for the CSV Consolidator application.
These files are not required for production deployment, but are provided for reference
and in case you need to make modifications to the application.

To build the application from source:

1. Install Node.js and npm
2. Run \`npm install\` to install dependencies
3. Run \`npm run build\` to build the application
4. Deploy the contents of the \`dist\` directory to your web server

The pre-built files in the \`frontend\` directory are ready for deployment and do not
require any additional build steps.`);
    
    // Add package.json for development environment
    zip.file("package.json", `{
  "name": "csv-consolidator",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "react-hook-form": "^7.45.4",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.6",
    "clsx": "^2.0.0",
    "lucide-react": "^0.274.0"
  },
  "devDependencies": {
    "@types/node": "^20.5.3",
    "@types/react": "^18.2.20",
    "@types/react-dom": "^18.2.7",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.28",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.1.6",
    "vite": "^4.4.9"
  }
}`);

    // Add README.md with deployment instructions
    zip.file("README.md", `# CSV Consolidator - Complete Deployment Package

This package contains everything you need to deploy the CSV Consolidator application in a production environment.

## Package Contents

- \`frontend/\` - Pre-built frontend files ready for deployment
- \`api/\` - PHP API files for the backend
- \`src/\` - Source code for reference and development
- \`package.json\` - Node.js dependencies for development

## Quick Deployment Guide

### Option 1: Deploy Pre-built Files (Recommended for Production)

1. Upload the contents of the \`frontend/\` directory to your web server's root directory
2. Create a directory called \`api\` in your web server's root directory
3. Upload the contents of the \`api/\` directory to the \`api\` directory
4. Configure the API by editing \`api/config.php\`
5. Test your installation by visiting \`https://yourdomain.com/api/test.php\`

### Option 2: Build from Source (For Development or Customization)

1. Install Node.js and npm
2. Run \`npm install\` to install dependencies
3. Run \`npm run build\` to build the frontend
4. Deploy the contents of the \`dist\` directory to your web server's root directory
5. Follow steps 2-5 from Option 1 to deploy the API

## Important Notes

- The .htaccess files are critical but may be hidden in your file browser
- Make sure to set appropriate file permissions
- Always configure a secure API key in production
- Refer to the detailed deployment guide in the application for more information

## Support

For help with deployment, please contact support@apially.com
`);

    // Generate and download the ZIP file
    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, "csv-consolidator-complete.zip");
    
    return true;
  } catch (error) {
    console.error("Error creating complete project package:", error);
    throw error;
  }
};
