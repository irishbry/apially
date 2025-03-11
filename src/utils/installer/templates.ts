/**
 * Utility functions for generating installation package templates
 */

/**
 * Creates the install.php file content
 */
export const createInstallerPHP = (): string => {
  return `<?php
// Installation script for Data Consolidation Tool
// IMPORTANT: No whitespace or output before this PHP opening tag
ob_start(); // Start output buffering to prevent "headers already sent" errors

// Show all errors for easier debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo '<!DOCTYPE html>
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
    </style>
</head>
<body>
    <h1>Data Consolidation Tool - Installation</h1>';

echo '<div class="test">';
echo '<h2>PHP Version</h2>';
echo '<p>PHP Version: ' . phpversion() . '</p>';

// Check if PHP version is compatible
if (version_compare(phpversion(), '7.0.0', '>=')) {
    echo "<p class='success'>PHP version " . phpversion() . " is supported</p>";
} else {
    echo "<p class='error'>PHP version " . phpversion() . " is too old. PHP 7.0+ is recommended.</p>";
}

echo '</div>';

echo '<div class="test">';
echo '<h2>Server Information</h2>';
echo '<p>Server Software: ' . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . '</p>';
echo '</div>';

echo '<div class="test">';
echo '<h2>File System</h2>';

// Check if API directory exists
if (file_exists('./api')) {
    echo "<p class='success'>API directory exists</p>";
    
    // Check for index.php
    if (file_exists('./api/index.php')) {
        echo "<p class='success'>API index.php exists</p>";
    } else {
        echo "<p class='error'>API index.php missing</p>";
    }
    
    // Check for .htaccess (might be hidden)
    if (file_exists('./api/.htaccess')) {
        echo "<p class='success'>.htaccess exists</p>";
    } else {
        echo "<p class='error'>.htaccess file missing (this is critical!)</p>";
        echo "<p>Note: .htaccess is a hidden file. Make sure 'Show hidden files' is enabled when uploading.</p>";
    }
    
    // Check data directory
    if (file_exists('./api/data')) {
        echo "<p class='success'>Data directory exists</p>";
        
        // Check if data directory is writable
        if (is_writable('./api/data')) {
            echo "<p class='success'>Data directory is writable</p>";
        } else {
            echo "<p class='error'>Data directory is not writable</p>";
            echo "<p>Fix with: chmod 755 ./api/data</p>";
        }
    } else {
        echo "<p class='error'>Data directory missing</p>";
        echo "<p>Fix with: mkdir ./api/data</p>";
    }
} else {
    echo "<p class='error'>API directory missing</p>";
}

echo '</div>';

// Also check frontend files
echo '<div class="test">';
echo '<h2>Frontend Files</h2>';

// Check for index.html
if (file_exists('./index.html')) {
    echo "<p class='success'>index.html exists</p>";
} else {
    echo "<p class='error'>index.html missing</p>";
}

// Check for assets directory
if (file_exists('./assets')) {
    echo "<p class='success'>assets directory exists</p>";
} else {
    echo "<p class='warning'>assets directory missing - may be built differently</p>";
}

echo '</div>';

echo '<div class="test">';
echo '<h2>PHP Configuration</h2>';

// Check common PHP settings
echo "<p>output_buffering: " . (ini_get('output_buffering') ? "<span class='success'>Enabled</span>" : "<span class='warning'>Disabled</span>") . "</p>";
echo "<p>allow_url_fopen: " . (ini_get('allow_url_fopen') ? "<span class='success'>Enabled</span>" : "<span class='warning'>Disabled</span>") . "</p>";
echo "<p>memory_limit: " . ini_get('memory_limit') . "</p>";
echo "<p>max_execution_time: " . ini_get('max_execution_time') . " seconds</p>";

// Check for json extension
if (function_exists('json_encode')) {
    echo "<p class='success'>JSON extension is available</p>";
} else {
    echo "<p class='error'>JSON extension is missing! This is required.</p>";
}

echo '</div>';

echo '<div class="test">';
echo '<h2>API Test</h2>';

// Simple API test that doesn't interfere with headers
echo "<p>Testing API status endpoint:</p>";

// Use a reliable test method
$testUrl = './api/status';
echo "<p>Requesting: $testUrl</p>";

// Attempt direct file access first (most reliable)
if (file_exists('./api/index.php')) {
    echo "<p class='success'>API index.php exists, basic functions should work</p>";
    
    // Update this to avoid header issues - use alternative approach for testing API
    echo "<p>If the API is working, you should see JSON output below:</p>";
    echo "<pre>";
    // Use file_get_contents instead of including the file
    // This avoids header conflicts when testing
    $apiUrl = 'http' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . 
              '://' . $_SERVER['HTTP_HOST'] . 
              dirname($_SERVER['REQUEST_URI']) . '/api/status';
              
    // Use curl if available (better for testing APIs)
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result = curl_exec($ch);
        if ($result === false) {
            echo "cURL Error: " . curl_error($ch);
        } else {
            echo htmlspecialchars($result);
        }
        curl_close($ch);
    } else {
        // Fallback to file_get_contents
        $context = stream_context_create([
            'http' => [
                'ignore_errors' => true,
                'method' => 'GET'
            ]
        ]);
        $result = @file_get_contents($apiUrl, false, $context);
        if ($result === false) {
            echo "Error: Unable to access API. Check file permissions and server configuration.";
        } else {
            echo htmlspecialchars($result);
        }
    }
    echo "</pre>";
    
    echo "<p>Alternative direct test (if above fails):</p>";
    echo "<p>Visit <a href='./api/status' target='_blank'>./api/status</a> directly in a new tab.</p>";
}

echo '</div>';

echo '<div class="test">';
echo '<h2>Next Steps</h2>';
echo '<ol>';
echo '<li>Make sure all files are uploaded correctly, especially the hidden .htaccess file</li>';
echo '<li>Set proper permissions (755 for directories, 644 for files)</li>';
echo '<li>Access the application at: <a href="./index.html">./index.html</a></li>';
echo '</ol>';
echo '</div>';

// Add helpful frontend troubleshooting section
echo '<div class="test">';
echo '<h2>Troubleshooting Blank Pages</h2>';
echo '<p>If you see a blank page at index.html:</p>';
echo '<ol>';
echo '<li>Check your browser console for JavaScript errors (Press F12 in most browsers)</li>';
echo '<li>Ensure all assets are correctly uploaded (JS and CSS files)</li>';
echo '<li>Try clearing your browser cache or using incognito/private mode</li>';
echo '<li>Check server logs for any 404 errors which might indicate missing files</li>';
echo '<li>Try visiting the /installer URL directly if the main page won\'t load</li>';
echo '<li>If you get "Loading Application..." message, it means JavaScript is running but the app isn\'t finishing initialization</li>';
echo '</ol>';
echo '</div>';

echo '</body></html>';
ob_end_flush(); // Flush the output buffer and turn off output buffering
`;
};

/**
 * Creates the README.md file content
 */
export const createReadme = (): string => {
  return `# Data Consolidation Tool - Installation Package

## What is this?

This is an all-in-one installation package for the Data Consolidation Tool. It includes both the frontend interface and the backend API in a single package.

## Installation Instructions

1. Upload ALL files to your web server, maintaining the directory structure
2. Navigate to install.php in your web browser (e.g., https://yourdomain.com/install.php)
3. Follow the on-screen instructions to complete the installation
4. If there are any issues, check the troubleshooting section in install.php

## Directory Structure

\`\`\`
/                     # Root directory
├── install.php       # Installation script
├── index.html        # Frontend entry point
├── assets/           # Frontend assets (CSS, JS)
├── api/              # Backend API
│   ├── index.php     # API entry point
│   ├── config.php    # API configuration
│   ├── test.php      # API test script
│   ├── .htaccess     # Apache configuration (important!)
│   └── data/         # Data storage directory
└── README.md         # This file
\`\`\`

## Requirements

- PHP 7.0 or higher
- Apache web server with mod_rewrite enabled
- PHP extensions: curl, json
- Write permissions on the installation directory

## Important Note About Hidden Files

The .htaccess file in the api/ directory is CRITICAL for the API to work correctly. This file may be hidden in your file browser.

If you're not seeing the .htaccess file:
- In cPanel File Manager: Click on "Settings" and check "Show Hidden Files (dotfiles)"
- In FTP clients: Enable "Show hidden files" option
- In Windows Explorer: Enable "Show hidden files" in folder options
- In macOS Finder: Press Cmd+Shift+. (period) to toggle hidden files

## After Installation

1. Access your application at your domain (e.g., https://yourdomain.com/)
2. Configure your API key in api/config.php
3. Start adding your data sources through the web interface

## Troubleshooting

If you encounter any issues during installation:

1. Check the installation page for specific errors
2. Run the API test script at ./api/test.php for detailed diagnostics
3. Make sure mod_rewrite is enabled in Apache
4. Verify that all files were uploaded, especially the .htaccess file
5. Check file permissions (755 for directories, 644 for files)

For more help, please contact support.`;
};

/**
 * Creates the index.php file content for the API
 */
export const createIndexPHP = (): string => {
  return `<?php
// IMPORTANT: No whitespace or output before this PHP opening tag
ob_start(); // Use output buffering to prevent "headers already sent" errors

// Simplified index.php that works with modern PHP versions
// Enable error reporting for debugging in development (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Main API entry point
header('Content-Type: application/json');

// Check for actual path - using basic PHP functionality
$requestPath = $_SERVER['REQUEST_URI'];
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$endpoint = str_replace($basePath, '', $requestPath);
$endpoint = trim($endpoint, '/');

// Simple routing
switch ($endpoint) {
    case 'status':
        echo json_encode([
            'status' => 'ok',
            'version' => '1.0.0',
            'timestamp' => date('c'),
            'php_version' => phpversion() // Include PHP version in status response
        ]);
        break;
        
    case 'test':
    case 'test.php':
        // End output buffering before including test.php which has its own output
        ob_end_flush();
        include 'test.php';
        exit; // Stop execution after test.php
        
    case '':
        echo json_encode([
            'name' => 'Data Consolidation API',
            'version' => '1.0.0',
            'endpoints' => ['/status', '/test'],
            'php_version' => phpversion()
        ]);
        break;
        
    default:
        header('HTTP/1.1 404 Not Found');
        echo json_encode(['error' => 'Endpoint not found']);
}

// End output buffering
ob_end_flush();`;
};

/**
 * Creates the .htaccess file content
 */
export const createHtaccess = (): string => {
  return `# Simple .htaccess file with minimal configuration
# Enable rewrite engine
RewriteEngine On

# Base directory path - update this to match your installation path
RewriteBase /api/

# If requesting a real file or directory, don't rewrite
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Route everything else to index.php
RewriteRule ^(.*)$ index.php [QSA,L]

# Set correct MIME types for modern browsers
<IfModule mod_mime.c>
    AddType text/javascript .js
    AddType application/javascript .mjs
    AddType text/css .css
</IfModule>

# Basic CORS headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, X-API-Key"
</IfModule>

# Handle PHP settings that improve compatibility
<IfModule mod_php.c>
    php_flag output_buffering on
    php_value display_errors 0
    php_value error_reporting 0
</IfModule>

# Protect data directory
<IfModule mod_rewrite.c>
    RewriteRule ^data/ - [F,L]
</IfModule>`;
};

/**
 * Creates the test.php file content
 */
export const createTestPHP = (): string => {
  return `<?php
// IMPORTANT: No whitespace or output before this PHP opening tag
// Very basic test script that should work on most PHP installations
// Enable error reporting for troubleshooting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simple HTML output - no complex PHP functions
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
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <?php
        if (version_compare(phpversion(), '7.0.0', '>=')) {
            echo "<p class='success'>Your PHP version is compatible (PHP 7.0+)</p>";
        } else {
            echo "<p class='error'>Your PHP version is too old. PHP 7.0+ is recommended.</p>";
        }
        ?>
    </div>

    <div class="test">
        <h3>Server Information</h3>
        <p>Server Software: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></p>
    </div>
    
    <div class="test">
        <h3>PHP Extensions</h3>
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
        <h3>PHP Configuration</h3>
        <p>output_buffering: <?php echo ini_get('output_buffering') ? "<span class='success'>Enabled</span>" : "<span class='warning'>Disabled</span>"; ?></p>
        <p>memory_limit: <?php echo ini_get('memory_limit'); ?></p>
        <p>max_execution_time: <?php echo ini_get('max_execution_time'); ?> seconds</p>
    </div>
    
    <div class="test">
        <h3>API Configuration</h3>
        <?php
        // Check if .htaccess exists
        if (file_exists('.htaccess')) {
            echo "<p><span class='success'>✓</span> .htaccess file exists</p>";
        } else {
            echo "<p><span class='error'>✗</span> .htaccess file does not exist</p>";
        }
        
        // Check if data directory exists and is writable
        if (file_exists('data') && is_dir('data')) {
            echo "<p><span class='success'>✓</span> data directory exists</p>";
            
            if (is_writable('data')) {
                echo "<p><span class='success'>✓</span> data directory is writable</p>";
            } else {
                echo "<p><span class='error'>✗</span> data directory is not writable</p>";
            }
        } else {
            echo "<p><span class='error'>✗</span> data directory does not exist</p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>Common Issues & Solutions</h3>
        <ul>
            <li><strong>HTTP 500 Errors:</strong> Check your server's error logs. Common causes:
                <ul>
                    <li>PHP syntax errors</li>
                    <li>Missing required PHP extensions</li>
                    <li>File permission issues</li>
                    <li><strong>"Headers already sent" errors</strong> - Make sure there's no output before header() calls</li>
                </ul>
            </li>
            <li><strong>HTTP 404 Errors:</strong> Routing issues:
                <ul>
                    <li>Missing .htaccess file</li>
                    <li>mod_rewrite not enabled</li>
                    <li>Wrong RewriteBase in .htaccess</li>
                </ul>
            </li>
            <li><strong>PHP Version Compatibility:</strong>
                <ul>
                    <li>This application works best with PHP 7.0+</li>
                    <li>Some features may not work with PHP 5.x</li>
                </ul>
            </li>
        </ul>
    </div>
</body>
</html>`;
};

/**
 * Creates the config.php file content
 */
export const createConfigPHP = (): string => {
  return `<?php
// IMPORTANT: No whitespace or output before this PHP opening tag
// Simple configuration file compatible with modern PHP
error_reporting(0); // Disable error reporting in production

// Simple configuration
$config = [
    // API key (change this in production)
    'api_key' => 'your-secure-api-key-here',
    
    // Path to data storage directory
    'storage_path' => __DIR__ . '/data',
    
    // PHP version requirements
    'min_php_version' => '7.0.0',
    'recommended_php_version' => '7.4.0'
];

// Check PHP version
if (version_compare(phpversion(), $config['min_php_version'], '<')) {
    // Log warning about PHP version
    error_log('Warning: PHP version ' . phpversion() . ' is below the minimum recommended version ' . $config['min_php_version']);
}

// Create storage directory if it doesn't exist
if (!file_exists($config['storage_path'])) {
    @mkdir($config['storage_path'], 0755, true);
}
`;
};

/**
 * Creates the readme for .htaccess
 */
export const createHtaccessReadme = (): string => {
  return `# IMPORTANT: .htaccess File
    
The .htaccess file is CRITICAL for the API to work correctly but may be hidden in your file browser.

## What to do if you don't see the .htaccess file:

1. In File Manager: Click on "Settings" and check "Show Hidden Files (dotfiles)"
2. In FTP clients: Enable "Show hidden files" option
3. In Windows Explorer: Go to View > Options > Change folder and search options > View tab > Select "Show hidden files, folders, and drives"
4. In macOS Finder: Press Cmd+Shift+. (period) to toggle hidden files

## Manual creation:
If you still don't see the .htaccess file, create it manually with this content:

\`\`\`
# Enable rewrite engine
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
</IfModule>
\`\`\`

The .htaccess file is essential for the API to function properly - without it, you'll get 404 errors.
`;
};

/**
 * Creates the React index.html file
 */
export const createReactIndexHTML = (): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <title>Data Consolidation Portal</title>
    <link rel="stylesheet" href="/assets/styles.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="/assets/app.js"></script>
  </body>
</html>`;
};

/**
 * Creates a minimal React app.js file that connects to the API
 */
export const createReactAppJS = (): string => {
  return `// Simple React application that connects to the Data Consolidation API
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  // Create app container
  const app = document.createElement('div');
  app.className = 'app-container';
  
  // Create header
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = '<h1>Data Consolidation Portal</h1>';
  
  // Create main content area
  const main = document.createElement('main');
  main.className = 'app-main';
  
  // Create API test section
  const apiTest = document.createElement('div');
  apiTest.className = 'api-test';
  apiTest.innerHTML = \`
    <h2>API Connection Test</h2>
    <p>Testing connection to the API...</p>
    <div id="api-status">Checking...</div>
    <button id="test-api">Test API Connection</button>
  \`;
  
  // Append elements
  app.appendChild(header);
  app.appendChild(main);
  main.appendChild(apiTest);
  root.appendChild(app);
  
  // Add API test functionality
  document.getElementById('test-api').addEventListener('click', function() {
    const statusEl = document.getElementById('api-status');
    statusEl.textContent = 'Connecting...';
    statusEl.className = 'connecting';
    
    fetch('/api/status')
      .then(response => response.json())
      .then(data => {
        statusEl.textContent = 'Connected! API Status: ' + data.status;
        statusEl.className = 'connected';
      })
      .catch(error => {
        statusEl.textContent = 'Connection failed! Error: ' + error.message;
        statusEl.className = 'error';
      });
  });
});`;
};

/**
 * Creates basic CSS styles for the React app
 */
export const createReactStyles = (): string => {
  return `/* Basic styles for the Data Consolidation Portal */
:root {
  --primary-color: #3b82f6;
  --text-color: #1f2937;
  --bg-color: #f9fafb;
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--bg-color);
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.app-header h1 {
  color: var(--primary-color);
}

.app-main {
  display: grid;
  gap: 2rem;
}

.api-test {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.api-test h2 {
  margin-bottom: 1rem;
}

.api-test button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
}

.api-test button:hover {
  opacity: 0.9;
}

#api-status {
  margin: 1rem 0;
  padding: 0.75rem;
  border-radius: 0.25rem;
  background-color: #f3f4f6;
}

#api-status.connecting {
  background-color: #fef3c7;
  color: #92400e;
}

#api-status.connected {
  background-color: #d1fae5;
  color: #065f46;
}

#api-status.error {
  background-color: #fee2e2;
  color: #b91c1c;
}`;
};

/**
 * Creates .htaccess file for the frontend SPA
 */
export const createFrontendHtaccess = (): string => {
  return `# Frontend .htaccess for single-page React application
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Set proper MIME types
<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType text/css .css
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Set caching headers
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresDefault "access plus 1 week"
</IfModule>`;
};
