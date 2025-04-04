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
}

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
