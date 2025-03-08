
/**
 * Utility functions for generating installation package templates
 */

/**
 * Creates the install.php file content
 */
export const createInstallerPHP = (): string => {
  return `<?php
// This script installs both the frontend and backend components

// Set error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define paths
$api_path = __DIR__ . '/api';
$frontend_path = __DIR__;
$zip_path = __DIR__ . '/installation-package.zip';

// Function to extract ZIP archive
function extractZip($zipFile, $extractTo) {
    $zip = new ZipArchive;
    if ($zip->open($zipFile) === TRUE) {
        $zip->extractTo($extractTo);
        $zip->close();
        return true;
    } else {
        return false;
    }
}

// Function to create directories recursively
function createDir($path) {
    if (!file_exists($path)) {
        mkdir($path, 0755, true);
    }
}

// Function to check system requirements
function checkRequirements() {
    $requirements = array(
        'php_version' => version_compare(PHP_VERSION, '7.0.0', '>='),
        'zip_extension' => extension_loaded('zip'),
        'curl_extension' => extension_loaded('curl'),
        'json_extension' => extension_loaded('json'),
        'write_permission' => is_writable(__DIR__)
    );
    
    return $requirements;
}

// Start installation process
$status = array(
    'step' => 1,
    'message' => 'Starting installation...',
    'success' => true,
    'requirements' => checkRequirements()
);

// Check requirements
foreach ($status['requirements'] as $requirement => $met) {
    if (!$met) {
        $status['success'] = false;
        $status['message'] = "Requirement not met: " . $requirement;
        break;
    }
}

// Continue with installation if requirements are met
if ($status['success']) {
    // Step 2: Extract frontend files
    $status['step'] = 2;
    $status['message'] = 'Setting up frontend...';
    
    // Create necessary directories
    createDir($frontend_path);
    createDir($frontend_path . '/assets');
    
    // Create frontend files
    file_put_contents($frontend_path . '/index.html', '<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Data Consolidation Tool</title>
    <script type="module" crossorigin src="./assets/index.js"></script>
    <link rel="stylesheet" href="./assets/index.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>');

    file_put_contents($frontend_path . '/assets/index.css', '/* Simplified CSS */
body{font-family:Arial,sans-serif;margin:0;padding:0}
.container{max-width:1200px;margin:0 auto;padding:15px}');

    file_put_contents($frontend_path . '/assets/index.js', '// Simplified JS bundle
document.getElementById("root").innerHTML = `
  <div class="container">
    <h1>Data Consolidation Tool</h1>
    <p>API Status: <span id="api-status">Checking...</span></p>
    <div style="margin-top: 20px">
      <h2>API Configuration</h2>
      <div>
        <label>API Key</label>
        <input type="text" id="api-key" placeholder="Enter your API key" />
        <button id="save-key">Save API Key</button>
      </div>
    </div>
    <div style="margin-top: 20px">
      <h2>Add Data Source</h2>
      <form id="source-form">
        <div>
          <label>Source Name</label>
          <input type="text" id="source-name" placeholder="e.g., Sales Data" />
        </div>
        <div>
          <label>Source URL</label>
          <input type="text" id="source-url" placeholder="https://example.com/data.csv" />
        </div>
        <button type="submit">Add Source</button>
      </form>
    </div>
    <div style="margin-top: 20px">
      <h2>Data Sources</h2>
      <ul id="sources-list"></ul>
    </div>
  </div>
`;

// Check API status
fetch("./api/status")
  .then(response => response.json())
  .then(data => {
    document.getElementById("api-status").textContent = 
      data.status === "ok" ? "Connected" : "Error";
  })
  .catch(err => {
    document.getElementById("api-status").textContent = "Connection Error";
  });

// Save API Key
document.getElementById("save-key").addEventListener("click", function() {
  const key = document.getElementById("api-key").value;
  localStorage.setItem("apiKey", key);
  alert("API Key saved");
});

// Add Source
document.getElementById("source-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("source-name").value;
  const url = document.getElementById("source-url").value;
  
  if (!name || !url) {
    alert("Please enter both name and URL");
    return;
  }
  
  // Add to list
  const li = document.createElement("li");
  li.textContent = name + ": " + url;
  document.getElementById("sources-list").appendChild(li);
  
  // Clear form
  document.getElementById("source-name").value = "";
  document.getElementById("source-url").value = "";
});');
    
    // Step 3: Set up API backend
    $status["step"] = 3;
    $status["message"] = "Setting up API backend...";
    
    // Create API directory
    createDir($api_path);
    createDir($api_path . "/data");
    
    // Create API files
    file_put_contents($api_path . "/index.php", '<?php
// Main API entry point
header("Content-Type: application/json");

// Check for actual path
$requestPath = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$basePath = dirname($_SERVER["SCRIPT_NAME"]);
$endpoint = str_replace($basePath, "", $requestPath);
$endpoint = trim($endpoint, "/");

// Simple routing
switch ($endpoint) {
    case "status":
        echo json_encode([
            "status" => "ok",
            "version" => "1.0.0",
            "timestamp" => date("c")
        ]);
        break;
        
    case "test":
        include "test.php";
        break;
        
    case "":
        echo json_encode([
            "name" => "Data Consolidation API",
            "version" => "1.0.0",
            "endpoints" => ["/status", "/test"]
        ]);
        break;
        
    default:
        header("HTTP/1.1 404 Not Found");
        echo json_encode(["error" => "Endpoint not found"]);
}');

    file_put_contents($api_path . "/.htaccess", '# Enable rewrite engine
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
</IfModule>');

    file_put_contents($api_path . "/config.php", '<?php
// Simple configuration file for Data Consolidation API

$config = [
    // Allowed origins for CORS
    "allowed_origins" => ["*"], // Replace with your frontend domain in production
    
    // Path to data storage directory
    "storage_path" => __DIR__ . "/data",
    
    // API key (change this in production)
    "api_key" => "your-secure-api-key-here"
];

// Create storage directory if it doesnt exist
if (!file_exists($config["storage_path"])) {
    mkdir($config["storage_path"], 0755, true);
}');

    file_put_contents($api_path . "/test.php", '<?php
// Simple test script that avoids complex PHP functions that might cause errors
header("Content-Type: text/html; charset=utf-8");
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
        .warning { color: orange; font-weight: bold; }
        .test { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>API Installation Test</h1>
    
    <div class="test">
        <h3>Server Information</h3>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Server Software: <?php echo $_SERVER["SERVER_SOFTWARE"] ?? "Unknown"; ?></p>
        <p>Document Root: <?php echo $_SERVER["DOCUMENT_ROOT"] ?? "Unknown"; ?></p>
    </div>
    
    <div class="test">
        <h3>API Connectivity</h3>
        <?php
        // Test API connection to status endpoint
        $statusUrl = "../status";
        $ch = curl_init($statusUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $success = false;
        
        if ($httpCode === 200) {
            // Extract JSON response body
            list($header, $body) = explode("\r\n\r\n", $response, 2);
            $data = json_decode($body, true);
            
            if ($data && isset($data["status"]) && $data["status"] === "ok") {
                echo "<p><span class=\"success\">Success!</span> API endpoints are working correctly.</p>";
                $success = true;
            } else {
                echo "<p><span class=\"error\">Fail</span> API returned HTTP 200 but unexpected response format.</p>";
            }
        } else {
            echo "<p><span class=\"error\">Fail</span></p>";
            echo "<p>Result: API endpoints may not be working correctly. HTTP code: " . $httpCode . "</p>";
            echo "<p>Expected: HTTP 200 with status: ok</p>";
            echo "<p>How to fix: Check your Apache configuration and .htaccess file. Ensure mod_rewrite is working correctly and the API routes are properly set up. If using subdirectories, ensure your rewrite rules account for them. Try adding this to your .htaccess file:</p>";
            echo "<code>RewriteBase /api/</code></p>";
        }
        curl_close($ch);
        ?>
    </div>
    
    <div class="test">
        <h3>File Permissions</h3>
        <?php
        // Check if data directory exists
        $dataDir = "../data";
        if (file_exists($dataDir)) {
            if (is_writable($dataDir)) {
                echo "<p><span class=\"success\">Success!</span> Data directory exists and is writable.</p>";
            } else {
                echo "<p><span class=\"warning\">Warning</span> Data directory exists but is not writable.</p>";
                echo "<p>How to fix: Run <code>chmod 755 data</code> to set correct permissions.</p>";
            }
        } else {
            echo "<p><span class=\"warning\">Warning</span> Data directory does not exist.</p>";
            echo "<p>How to fix: Create the data directory with <code>mkdir data</code> and set permissions with <code>chmod 755 data</code>.</p>";
        }
        
        // Check if .htaccess file exists
        if (file_exists("../.htaccess")) {
            echo "<p><span class=\"success\">Success!</span> .htaccess file exists.</p>";
        } else {
            echo "<p><span class=\"error\">Error</span> .htaccess file does not exist.</p>";
            echo "<p>How to fix: Make sure you have uploaded the .htaccess file to your server.</p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>Next Steps</h3>
        <?php if ($success): ?>
        <p><span class="success">Your API is installed correctly!</span> You can now:</p>
        <ul>
            <li>Configure your API key in the config.php file</li>
            <li>Start sending requests to your API endpoints</li>
            <li>Check the README.md file for more information</li>
        </ul>
        <?php else: ?>
        <p>Please fix the issues above before using the API.</p>
        <p>Common solutions:</p>
        <ul>
            <li>Make sure mod_rewrite is enabled in Apache</li>
            <li>Check that AllowOverride is set to All in your Apache config</li>
            <li>Verify that all files were uploaded correctly</li>
            <li>If using a subdirectory, make sure RewriteBase is set correctly in .htaccess</li>
        </ul>
        <?php endif; ?>
    </div>
</body>
</html>');

    // Final step
    $status["step"] = 4;
    $status["message"] = "Installation completed successfully!";
}

// Display installation results
?>
<!DOCTYPE html>
<html>
<head>
    <title>Installation Complete</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
        .req-item { margin: 5px 0; padding: 5px; }
        .met { background-color: #f0fff0; }
        .not-met { background-color: #fff0f0; }
    </style>
</head>
<body>
    <h1>Data Consolidation Tool - Installation</h1>
    
    <div class="section">
        <h2>Installation Status</h2>
        <p><?php echo $status["success"] ? "<span class=\"success\">Success!</span>" : "<span class=\"error\">Failed!</span>"; ?> <?php echo $status["message"]; ?></p>
    </div>
    
    <div class="section">
        <h2>System Requirements</h2>
        <div class="req-item <?php echo $status["requirements"]["php_version"] ? "met" : "not-met"; ?>">
            PHP Version: <?php echo $status["requirements"]["php_version"] ? "<span class=\"success\">OK</span>" : "<span class=\"error\">Not Met (PHP 7.0+ required)</span>"; ?>
            - Current: <?php echo PHP_VERSION; ?>
        </div>
        <div class="req-item <?php echo $status["requirements"]["zip_extension"] ? "met" : "not-met"; ?>">
            ZIP Extension: <?php echo $status["requirements"]["zip_extension"] ? "<span class=\"success\">OK</span>" : "<span class=\"error\">Not Available</span>"; ?>
        </div>
        <div class="req-item <?php echo $status["requirements"]["curl_extension"] ? "met" : "not-met"; ?>">
            cURL Extension: <?php echo $status["requirements"]["curl_extension"] ? "<span class=\"success\">OK</span>" : "<span class=\"error\">Not Available</span>"; ?>
        </div>
        <div class="req-item <?php echo $status["requirements"]["json_extension"] ? "met" : "not-met"; ?>">
            JSON Extension: <?php echo $status["requirements"]["json_extension"] ? "<span class=\"success\">OK</span>" : "<span class=\"error\">Not Available</span>"; ?>
        </div>
        <div class="req-item <?php echo $status["requirements"]["write_permission"] ? "met" : "not-met"; ?>">
            Write Permissions: <?php echo $status["requirements"]["write_permission"] ? "<span class=\"success\">OK</span>" : "<span class=\"error\">Not Available</span>"; ?>
        </div>
    </div>
    
    <?php if ($status["success"]): ?>
    <div class="section">
        <h2>Next Steps</h2>
        <p>Your installation is complete! Here's what to do next:</p>
        <ol>
            <li>Access your application at: <a href="./index.html">./index.html</a></li>
            <li>Test the API functionality: <a href="./api/test.php">./api/test.php</a></li>
            <li>Configure your API key in: <code>./api/config.php</code></li>
            <li>Start adding your data sources through the web interface</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Installation Details</h2>
        <p>The following components have been installed:</p>
        <ul>
            <li>Frontend Interface (React-based web application)</li>
            <li>Backend API (PHP-based RESTful API)</li>
            <li>Configuration files and required directories</li>
        </ul>
        <p>Configuration file location: <code>./api/config.php</code></p>
        <p>Data storage location: <code>./api/data/</code></p>
    </div>
    <?php else: ?>
    <div class="section">
        <h2>Troubleshooting</h2>
        <p>The installation encountered some issues. Please try the following:</p>
        <ul>
            <li>Make sure PHP 7.0 or higher is installed</li>
            <li>Ensure all required PHP extensions are enabled (zip, curl, json)</li>
            <li>Check write permissions for the current directory</li>
            <li>If using shared hosting, contact your hosting provider for assistance</li>
        </ul>
    </div>
    <?php endif; ?>
</body>
</html>`;
};

/**
 * Creates the README.md file content
 */
export const createReadme = (): string => {
  return `# All-in-One Installation Package

## What is this?

This is an all-in-one installation package for the Data Consolidation Tool. It includes both the frontend interface and the backend API in a single installation script.

## Installation Instructions

1. Upload all files to your web server
2. Navigate to install.php in your web browser (e.g., https://yourdomain.com/install.php)
3. The installer will automatically set up both the frontend and backend components
4. Follow the on-screen instructions to complete the installation

## Requirements

- PHP 7.0 or higher
- Apache web server with mod_rewrite enabled
- PHP extensions: curl, json, zip
- Write permissions on the installation directory

## Files Included

- install.php - Main installation script that sets up everything
- Frontend files (HTML, CSS, JS)
- Backend API files (PHP)

## After Installation

1. Access your application at your domain (e.g., https://yourdomain.com/)
2. Configure your API key in api/config.php
3. Start adding your data sources through the web interface

## Troubleshooting

If you encounter any issues during installation:

1. Check the installation log for specific errors
2. Verify that your server meets all requirements
3. Check file permissions (755 for directories, 644 for files)
4. Make sure mod_rewrite is enabled in Apache
5. Verify that the .htaccess file is properly uploaded (it may be hidden)

For more help, please refer to the detailed troubleshooting guide in the documentation.`;
};
