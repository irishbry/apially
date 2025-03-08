import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Server, FileDown, ChevronDown, ChevronUp, FolderDown, Code, CheckSquare, FileText, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Installer: React.FC = () => {
  const [isOpenFTP, setIsOpenFTP] = useState(false);
  const [isOpenCPanel, setIsOpenCPanel] = useState(false);
  const [isOpenConfig, setIsOpenConfig] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const createIndexPHP = () => {
    return `<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Main API entry point
header('Content-Type: application/json');

// Check for actual path
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$endpoint = str_replace($basePath, '', $requestPath);
$endpoint = trim($endpoint, '/');

// Simple routing
switch ($endpoint) {
    case 'status':
        echo json_encode([
            'status' => 'ok',
            'version' => '1.0.0',
            'timestamp' => date('c')
        ]);
        break;
        
    case 'test':
        include 'test.php';
        break;
        
    case '':
        echo json_encode([
            'name' => 'Data Consolidation API',
            'version' => '1.0.0',
            'endpoints' => ['/status', '/test']
        ]);
        break;
        
    default:
        header('HTTP/1.1 404 Not Found');
        echo json_encode(['error' => 'Endpoint not found']);
}`;
  };
  
  const createHtaccess = () => {
    return `# Enable rewrite engine
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
</IfModule>`;
  };
  
  const createTestPHP = () => {
    return `<?php
// Enable error reporting for troubleshooting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simple test script that avoids complex PHP functions that might cause errors
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
        .warning { color: orange; font-weight: bold; }
        .test { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>API Installation Test</h1>
    
    <div class="test">
        <h3>PHP Version and Info</h3>
        <?php
        // Basic info about PHP that doesn't require functions that might be disabled
        echo '<p>PHP Version: ' . phpversion() . '</p>';
        if (function_exists('phpinfo')) {
            echo '<p><a href="phpinfo.php" target="_blank">View Full PHP Info</a></p>';
        }
        ?>
    </div>

    <div class="test">
        <h3>Server Information</h3>
        <?php
        echo '<p>Server Software: ' . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . '</p>';
        echo '<p>Document Root: ' . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . '</p>';
        echo '<p>Script Path: ' . ($_SERVER['SCRIPT_FILENAME'] ?? 'Unknown') . '</p>';
        ?>
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
        <h3>API Configuration</h3>
        <?php
        // Check if .htaccess exists
        if (file_exists('.htaccess')) {
            echo "<p><span class='success'>✓</span> .htaccess file exists</p>";
        } else {
            echo "<p><span class='error'>✗</span> .htaccess file does not exist</p>";
            echo "<p>This file is critical for API routing to work!</p>";
        }
        
        // Check if data directory exists and is writable
        if (file_exists('data') && is_dir('data')) {
            echo "<p><span class='success'>✓</span> data directory exists</p>";
            
            if (is_writable('data')) {
                echo "<p><span class='success'>✓</span> data directory is writable</p>";
            } else {
                echo "<p><span class='error'>✗</span> data directory is not writable</p>";
                echo "<p>Fix with: <code>chmod 755 data</code></p>";
            }
        } else {
            echo "<p><span class='error'>✗</span> data directory does not exist</p>";
            echo "<p>Fix with: <code>mkdir data</code> and <code>chmod 755 data</code></p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>Testing API Endpoints</h3>
        <?php
        // First, try a simpler test that doesn't use curl
        $status_url = 'status';
        echo "<p>Testing API endpoint: $status_url</p>";
        echo "<p>Direct test without curl: ";
        
        // Test using file_get_contents first which might work when curl doesn't
        if (function_exists('file_get_contents') && ini_get('allow_url_fopen')) {
            try {
                $context = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => "Accept: application/json\r\n"
                    ]
                ]);
                
                $response = @file_get_contents($status_url, false, $context);
                if ($response !== false) {
                    echo "<span class='success'>Success!</span> API responded.</p>";
                    echo "<p>Response: " . htmlspecialchars($response) . "</p>";
                } else {
                    echo "<span class='error'>Failed.</span> Could not get a response.</p>";
                }
            } catch (Exception $e) {
                echo "<span class='error'>Error: " . htmlspecialchars($e->getMessage()) . "</span></p>";
            }
        } else {
            echo "<span class='warning'>Skipped.</span> file_get_contents not available or allow_url_fopen disabled.</p>";
        }
        
        // Only attempt curl test if the extension is loaded
        if (extension_loaded('curl')) {
            echo "<p>Testing with curl: ";
            
            try {
                $ch = curl_init($status_url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HEADER, false);
                $response = curl_exec($ch);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curl_error = curl_error($ch);
                curl_close($ch);
                
                if ($response !== false && $http_code == 200) {
                    echo "<span class='success'>Success!</span> API responded with HTTP $http_code</p>";
                    echo "<p>Response: " . htmlspecialchars($response) . "</p>";
                } else {
                    echo "<span class='error'>Failed.</span> HTTP Code: $http_code</p>";
                    if ($curl_error) {
                        echo "<p>Curl Error: " . htmlspecialchars($curl_error) . "</p>";
                    }
                }
            } catch (Exception $e) {
                echo "<span class='error'>Error: " . htmlspecialchars($e->getMessage()) . "</span></p>";
            }
        } else {
            echo "<p><span class='error'>Cannot test API with curl:</span> curl extension is not loaded.</p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>Common Issues & Solutions</h3>
        <ul>
            <li><strong>HTTP 500 Errors:</strong> Check your server's error logs. Common causes:
                <ul>
                    <li>PHP syntax errors - Use error_reporting(E_ALL) to show them</li>
                    <li>Missing extensions - Ensure json and curl extensions are enabled</li>
                    <li>Permissions issues - Ensure files are readable (644) and directories executable (755)</li>
                </ul>
            </li>
            <li><strong>HTTP 404 Errors:</strong> Routing issues:
                <ul>
                    <li>Make sure .htaccess file exists and is readable</li>
                    <li>Check RewriteBase is correct for your installation path (e.g., /api/)</li>
                    <li>Verify mod_rewrite is enabled in Apache</li>
                </ul>
            </li>
            <li><strong>API Not Working:</strong>
                <ul>
                    <li>Check file paths in includes</li>
                    <li>Verify PHP version compatibility</li>
                    <li>Check Apache configuration (AllowOverride All needed for .htaccess)</li>
                </ul>
            </li>
        </ul>
    </div>

    <div class="test">
        <h3>Debug Information</h3>
        <p>If you're experiencing issues, this information might help diagnose them:</p>
        <?php
        echo "<p>PHP Loaded Configuration File: " . (php_ini_loaded_file() ?: 'Unknown') . "</p>";
        
        // Show configured include path
        echo "<p>Include Path: " . get_include_path() . "</p>";
        
        // Show server variables that might be useful for debugging
        echo "<h4>Request Details:</h4>";
        echo "<p>Request URI: " . ($_SERVER['REQUEST_URI'] ?? 'Unknown') . "</p>";
        echo "<p>Script Name: " . ($_SERVER['SCRIPT_NAME'] ?? 'Unknown') . "</p>";
        
        // Check if we can write files
        $test_file = 'data/test_write.txt';
        $write_test = false;
        
        if (is_dir('data')) {
            try {
                $write_test = @file_put_contents($test_file, "Write test at " . date('Y-m-d H:i:s'));
                if ($write_test !== false) {
                    echo "<p><span class='success'>✓</span> Successfully wrote to test file</p>";
                    // Clean up
                    @unlink($test_file);
                } else {
                    echo "<p><span class='error'>✗</span> Could not write to test file</p>";
                }
            } catch (Exception $e) {
                echo "<p><span class='error'>✗</span> Error writing to test file: " . htmlspecialchars($e->getMessage()) . "</p>";
            }
        }
        ?>
    </div>
    
    <div style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
        <p><strong>Need more help?</strong> Check your server's PHP error logs for detailed error messages.</p>
        <p>Typical error log locations:</p>
        <ul>
            <li>Apache: /var/log/apache2/error.log or /var/log/httpd/error_log</li>
            <li>cPanel: /usr/local/cpanel/logs/ or through cPanel's Error Log interface</li>
        </ul>
    </div>
</body>
</html>`;
  };
  
  const createInstallPHP = () => {
    return `<?php
// Enable error reporting for troubleshooting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Basic installation checker for API files
?><!DOCTYPE html>
<html>
<head>
    <title>API Installer</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; 
                 text-decoration: none; border-radius: 4px; }
        .step { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .warning { background-color: #fff3cd; border-color: #ffeeba; color: #856404; padding: 10px; border-radius: 4px; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; padding: 10px; border-radius: 4px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Data Consolidation API - Installation Check</h1>
    
    <div class="warning">
        <h3>⚠️ Important Installation Information</h3>
        <p>This installation script is checking if your server meets the requirements to run the API.</p>
        <p>If you're seeing this page, PHP is working on your server, which is a good first step!</p>
    </div>
    
    <?php if (isset($_GET['debug'])): ?>
    <div class="error">
        <h3>🔍 Debug Information</h3>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Server Software: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'; ?></p>
        <p>Current Script: <?php echo $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown'; ?></p>
        
        <h4>Important Environment Variables:</h4>
        <pre><?php
            $safe_vars = [
                'DOCUMENT_ROOT', 'SERVER_SOFTWARE', 'SERVER_NAME', 'SERVER_PROTOCOL',
                'REQUEST_METHOD', 'REQUEST_URI', 'SCRIPT_NAME', 'SCRIPT_FILENAME',
                'PHP_SELF', 'HTTP_HOST', 'HTTPS', 'REMOTE_ADDR', 'REMOTE_PORT',
                'SERVER_ADDR', 'SERVER_PORT', 'SERVER_ADMIN'
            ];
            
            foreach ($safe_vars as $var) {
                if (isset($_SERVER[$var])) {
                    echo "$var: " . htmlspecialchars($_SERVER[$var]) . "\n";
                }
            }
        ?></pre>
        
        <h4>Loaded PHP Extensions:</h4>
        <pre><?php echo implode(', ', get_loaded_extensions()); ?></pre>
    </div>
    <?php endif; ?>
    
    <div class="step">
        <h2>Step 1: PHP Version Check</h2>
        <?php
        $php_version = phpversion();
        $php_version_ok = version_compare($php_version, '7.0.0', '>=');
        
        if ($php_version_ok) {
            echo '<div class="success">PHP Version: ' . $php_version . ' ✓</div>';
        } else {
            echo '<div class="error">PHP Version: ' . $php_version . ' ✗ (Required: 7.0 or higher)</div>';
        }
        ?>
    </div>
    
    <div class="step">
        <h2>Step 2: Required Extensions</h2>
        <?php
        $required_extensions = ['curl', 'json'];
        $missing_extensions = [];
        
        foreach ($required_extensions as $ext) {
            if (!extension_loaded($ext)) {
                $missing_extensions[] = $ext;
            }
        }
        
        if (empty($missing_extensions)) {
            echo '<div class="success">All required extensions are available ✓</div>';
        } else {
            echo '<div class="error">Missing extensions: ' . implode(', ', $missing_extensions) . ' ✗</div>';
            echo '<p>Contact your hosting provider to enable these PHP extensions.</p>';
        }
        ?>
    </div>
    
    <div class="step">
        <h2>Step 3: Directory Structure</h2>
        <?php
        $api_dir = './api';
        $api_dir_exists = is_dir($api_dir);
        
        if ($api_dir_exists) {
            echo '<div class="success">API directory exists ✓</div>';
            
            // Check for key files
            $key_files = [
                $api_dir . '/index.php' => 'Main API entry point',
                $api_dir . '/.htaccess' => 'Apache rewrite rules',
                $api_dir . '/test.php' => 'API test script'
            ];
            
            $missing_files = [];
            foreach ($key_files as $file => $description) {
                if (!file_exists($file)) {
                    $missing_files[] = "$description ($file)";
                }
            }
            
            if (empty($missing_files)) {
                echo '<div class="success">All required API files exist ✓</div>';
            } else {
                echo '<div class="error">Missing key files: ' . implode(', ', $missing_files) . ' ✗</div>';
                echo '<p>Make sure all files from the installation package were uploaded.</p>';
                echo '<p>Note: The .htaccess file may be hidden in your file manager.</p>';
            }
            
            // Check data directory
            $data_dir = $api_dir . '/data';
            if (is_dir($data_dir)) {
                if (is_writable($data_dir)) {
                    echo '<div class="success">Data directory exists and is writable ✓</div>';
                } else {
                    echo '<div class="error">Data directory exists but is not writable ✗</div>';
                    echo '<p>Fix with: <code>chmod 755 ' . $data_dir . '</code></p>';
                }
            } else {
                echo '<div class="error">Data directory does not exist ✗</div>';
                echo '<p>Create it with: <code>mkdir -p ' . $data_dir . '</code> and set permissions: <code>chmod 755 ' . $data_dir . '</code></p>';
            }
        } else {
            echo '<div class="error">API directory does not exist ✗</div>';
            echo '<p>Create the directory or make sure you uploaded the files to the correct location.</p>';
        }
        ?>
    </div>
    
    <div class="step">
        <h2>Step 4: API Connectivity Test</h2>
        <?php
        if ($api_dir_exists) {
            echo '<p>Testing API connectivity...</p>';
            
            $status_url = './api/status';
            $test_successful = false;
            
            // Try with file_get_contents first
            if (function_exists('file_get_contents') && ini_get('allow_url_fopen')) {
                try {
                    $context = stream_context_create([
                        'http' => [
                            'method' => 'GET',
                            'header' => "Accept: application/json\r\n"
                        ]
                    ]);
                    
                    $response = @file_get_contents($status_url, false, $context);
                    
                    if ($response !== false) {
                        $data = json_decode($response, true);
                        if ($data && isset($data['status']) && $data['status'] === 'ok') {
                            $test_successful = true;
                        }
                    }
                } catch (Exception $e) {
                    // Silently fail and try curl
                }
            }
            
            // Try with curl if file_get_contents didn't work
            if (!$test_successful && function_exists('curl_init')) {
                try {
                    $ch = curl_init($status_url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HEADER, false);
                    $response = curl_exec($ch);
                    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    
                    if ($response !== false && $http_code == 200) {
                        $data = json_decode($response, true);
                        if ($data && isset($data['status']) && $data['status'] === 'ok') {
                            $test_successful = true;
                        }
                    }
                } catch (Exception $e) {
                    // Silently fail and report the overall result
                }
            }
            
            if ($test_successful) {
                echo '<div class="success">API connectivity test passed ✓</div>';
                echo '<p>The API is responding correctly.</p>';
            } else {
                echo '<div class="error">API connectivity test failed ✗</div>';
                echo '<p>Common causes of API connectivity issues:</p>';
                echo '<ul>';
                echo '<li>The .htaccess file is missing or not being processed</li>';
                echo '<li>mod_rewrite is not enabled in Apache</li>';
                echo '<li>AllowOverride is not set to All in your Apache configuration</li>';
                echo '<li>There may be PHP errors in the API scripts</li>';
                echo '</ul>';
                echo '<p>Try accessing the <a href="./api/test.php">test script</a> directly for more detailed diagnostics.</p>';
            }
        } else {
            echo '<div class="error">Cannot test API connectivity because API directory does not exist</div>';
        }
        ?>
    </div>
    
    <div class="step">
        <h2>Next Steps</h2>
        <?php if ($api_dir_exists): ?>
            <p>For more detailed diagnostics, try the following:</p>
            <ul>
                <li><a href="./api/test.php">Run the API test script</a> for detailed diagnostics</li>
                <li><a href="?debug=1">View debug information</a> to see server environment details</li>
                <li>Check your server's error logs for PHP or Apache errors</li>
            </ul>
            
            <?php if (file_exists('./api/index.php') && file_exists('./api/.htaccess')): ?>
                <p>If everything looks good, try accessing:</p>
                <ul>
                    <li><a href="./api/status">API Status Endpoint</a> - Should return a JSON response</li>
                </ul>
            <?php endif; ?>
        <?php else: ?>
            <p>Before proceeding, you need to:</p>
            <ol>
                <li>Create the API directory structure</li>
                <li>Upload all required files from the installation package</li>
                <li>Set appropriate permissions</li>
                <li>Run this installation check again</li>
            </ol>
        <?php endif; ?>
    </div>
    
    <div class="warning">
        <h3>Need Help?</h3>
        <p>If you're experiencing 500 errors:</p>
        <ol>
            <li>Check your server's PHP error logs</li>
            <li>Make sure PHP version 7.0 or higher is installed</li>
            <li>Verify that all required extensions are enabled</li>
            <li>Ensure file permissions are correct (644 for files, 755 for directories)</li>
            <li>Contact your hosting provider if errors persist</li>
        </ol>
    </div>
    
    <p style="margin-top: 20px;">
        <small>Installation Check • <?php echo date('Y-m-d H:i:s'); ?></small>
    </p>
</body>
</html>`;
  };

  const createHtaccessReadme = () => {
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

  const createPhpInfoFile = () => {
    return `<?php
// Simple phpinfo script for diagnostics
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Only show the minimal phpinfo for security reasons
phpinfo(INFO_GENERAL | INFO_CONFIGURATION | INFO_MODULES);
`;
  };

  const createConfigPHP = () => {
    return `<?php
// Enable error reporting for troubleshooting
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
}
`;
  };

  const createReadme = () => {
    return `# Data Consolidation API

A simple PHP API for collecting and consolidating data from various sources.

## Installation

1. Upload all files to your web server
2. Set appropriate permissions (755 for directories, 644 for files)
3. Configure your settings in config.php
4. Test the installation by visiting https://your-domain.com/path/to/api/test.php

## IMPORTANT: Hidden .htaccess File

The .htaccess file is CRITICAL but may be hidden in your file browser. See htaccess_readme.md for details.

## API Endpoints

- **/status** - GET endpoint for checking API status
- **/test.php** - Test script to verify your installation 

## Configuration

Edit the config.php file to set:
- Allowed origins for CORS
- Storage path for data
- API key for authentication

## Troubleshooting

If you experience 404 errors:
- Make sure mod_rewrite is enabled in Apache
- Check that .htaccess file is uploaded and readable
- Verify that RewriteBase in .htaccess matches your installation path
`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Create root directory structure and files for the simplified package
      zip.file("install.php", createInstallPHP());
      
      // Create API directory
      const apiDir = zip.folder("api");
      apiDir.file("index.php", createIndexPHP());
      apiDir.file(".htaccess", createHtaccess());
      apiDir.file("test.php", createTestPHP());
      apiDir.file("config.php", createConfigPHP());
      apiDir.file("phpinfo.php", createPhpInfoFile());
      
      // Add a special readme about the .htaccess file
      apiDir.file("htaccess_readme.md", createHtaccessReadme());
      
      // Create directories
      const dataDir = apiDir.folder("data");
      
      // Add README
      zip.file("README.md", createReadme());
      
      // Create sample data file
      dataDir.file(".gitkeep", "");
      
      // Generate the ZIP file
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      // Save the ZIP file using FileSaver
      FileSaver.saveAs(zipContent, "data-consolidation-api.zip");
      
      // Show success toast with .htaccess warning
      toast({
        title: "Download started",
        description: "Your installation package is downloading. IMPORTANT: The .htaccess file may be hidden - see htaccess_readme.md in the package.",
      });
    } catch (error) {
      console.error("Error creating ZIP package:", error);
      toast({
        title: "Download failed",
        description: "There was an error creating the installation package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Server className="h-5 w-5 text-primary" />
          SiteGround Installation Guide
        </CardTitle>
        <CardDescription>
          How to install this application on your SiteGround hosting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Note About Hidden Files</AlertTitle>
            <AlertDescription>
              <p className="mb-2">The <strong>.htaccess</strong> file is <strong>critical</strong> for the API to work but may be hidden in your file browser.</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>In cPanel File Manager: Click on "Settings" and check "Show Hidden Files (dotfiles)"</li>
                <li>In FTP clients: Enable "Show hidden files" option</li>
                <li>In Windows Explorer: Enable "Show hidden files" in folder options</li>
                <li>In macOS Finder: Press Cmd+Shift+. (period) to toggle hidden files</li>
              </ul>
              <p className="mt-2">Without this file, you will get 404 errors when accessing API endpoints.</p>
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-primary/5 rounded-md">
            <h3 className="text-sm font-medium mb-2">Installation Overview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This guide will help you install the Data Consolidation API on your SiteGround hosting. Follow these steps to get your server up and running.
            </p>
            
            <Button 
              className="gap-2 mb-4" 
              onClick={handleDownload} 
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Creating Package...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Installation Package
                </>
              )}
            </Button>
            
            <p className="text-sm font-medium mb-2 text-primary">What's Included in the Package:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>install.php</strong> - Diagnostic installation script</li>
              <li><strong>api/index.php</strong> - Main API entry point</li>
              <li><strong className="text-amber-700">api/.htaccess</strong> - <span className="text-amber-700">Apache configuration (may be hidden!)</span></li>
              <li><strong>api/htaccess_readme.md</strong> - Instructions if .htaccess is hidden</li>
              <li><strong>api/test.php</strong> - Verify your installation and troubleshoot issues</li>
              <li><strong>api/phpinfo.php</strong> - Detailed PHP configuration information</li>
              <li><strong>api/data/</strong> - Directory for storing data</li>
            </ul>
          </div>
          
          <ol className="list-decimal list-inside space-y-3 text-sm mt-4">
            <li className="font-medium">Log in to your SiteGround account</li>
            
            <li>
              <Collapsible open={isOpenCPanel} onOpenChange={setIsOpenCPanel} className="space-y-2">
                <CollapsibleTrigger className="font-medium flex items-center">
                  Access cPanel
                  {isOpenCPanel ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
                  <p>Go to your SiteGround User Area and select your hosting account.</p>
                  <p>Click on "Websites" then "Site Tools" or "cPanel" depending on your hosting plan.</p>
                </CollapsibleContent>
              </Collapsible>
            </li>
            
            <li>
              <Collapsible open={isOpenFTP} onOpenChange={setIsOpenFTP} className="space-y-2">
                <CollapsibleTrigger className="font-medium flex items-center">
                  Upload files using File Manager or FTP
                  {isOpenFTP ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
                  <p>Option 1: Using File Manager in cPanel</p>
                  <ul className="list-disc list-inside ml-3">
                    <li>Open File Manager</li>
                    <li>Navigate to your website's document root (usually public_html)</li>
                    <li>Upload the downloaded ZIP file to your document root</li>
                    <li>Extract the ZIP file in place</li>
                    <li><strong className="text-amber-700">Very Important:</strong> Ensure the api/.htaccess file was properly extracted - to see hidden files in cPanel File Manager, click "Settings" then check "Show Hidden Files"</li>
                  </ul>
                  
                  <p className="mt-2">Option 2: Using FTP</p>
                  <ul className="list-disc list-inside ml-3">
                    <li>Connect to your server using an FTP client (like FileZilla)</li>
                    <li>Navigate to your website's document root</li>
                    <li>Upload all extracted files to this directory</li>
                    <li>Make sure to include the .htaccess file (enable "Show hidden files" in your FTP client)</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </li>
            
            <li>
              <Collapsible open={isOpenConfig} onOpenChange={setIsOpenConfig} className="space-y-2">
                <CollapsibleTrigger className="font-medium flex items-center">
                  Run the installation check
                  {isOpenConfig ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
                  <p>After uploading and extracting the files:</p>
                  <ol className="list-decimal list-inside ml-3">
                    <li>Go to <code>https://yourdomain.com/install.php</code> in your browser</li>
                    <li>This will run a comprehensive check of your installation</li>
                    <li>If any issues are found, follow the instructions on the page to fix them</li>
                    <li>Most common issues:
                      <ul className="list-disc list-inside ml-5">
                        <li>Missing .htaccess file (hidden file issue)</li>
                        <li>Permissions on the data directory</li>
                        <li>mod_rewrite not enabled in Apache</li>
                        <li>PHP version too old</li>
                      </ul>
                    </li>
                    <li>For detailed diagnostics, access <code>https://yourdomain.com/api/test.php</code></li>
                  </ol>
                </CollapsibleContent>
              </Collapsible>
            </li>
            
            <li className="font-medium">Start using the API with your application</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default Installer;
