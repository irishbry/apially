import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Server, FileDown, ChevronDown, ChevronUp, FolderDown, Code, CheckSquare, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const Installer: React.FC = () => {
  const [isOpenFTP, setIsOpenFTP] = useState(false);
  const [isOpenCPanel, setIsOpenCPanel] = useState(false);
  const [isOpenConfig, setIsOpenConfig] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const createIndexPHP = () => {
    return `<?php
/**
 * Data Consolidation API
 * Main entry point for API requests
 */

// Load configuration
require_once 'config.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', trim($uri, '/'));

// Set headers for API responses
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . implode(', ', $config['allowed_origins']));
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Handle preflight OPTIONS requests
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check for API key in header
$apiKey = isset($_SERVER['HTTP_X_API_KEY']) ? $_SERVER['HTTP_X_API_KEY'] : '';
if (empty($apiKey)) {
    http_response_code(401);
    echo json_encode(['error' => 'API key is required']);
    exit();
}

// Basic routing
if (count($uri) > 0) {
    $endpoint = $uri[count($uri) - 1];
    
    switch ($endpoint) {
        case 'data':
            require_once 'endpoints/data.php';
            break;
        case 'export':
            require_once 'endpoints/export.php';
            break;
        case 'status':
            require_once 'endpoints/status.php';
            break;
        case 'test':
            require_once 'test.php';
            break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}`;
  };
  
  const createHtaccess = () => {
    return `# Enable rewrite engine
RewriteEngine On
RewriteBase /api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Protect config file
<Files "config.php">
    Order Allow,Deny
    Deny from all
</Files>

# Protect data directory
<Files "data/*">
    Order Allow,Deny
    Deny from all
</Files>

# Cross-Origin headers for API
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "POST, GET, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, X-API-Key"
    Header set Access-Control-Max-Age "3600"
</IfModule>`.replace(/%\{([^}]+)\}/g, '${$1}');
  };
  
  const createTestPHP = () => {
    return `<?php
/**
 * Installation Test Script
 * This file helps verify that your installation is working correctly
 */

// Check if directly accessed
$directAccess = !isset($config);
if ($directAccess) {
    // If accessed directly, load config
    require_once 'config.php';
    header('Content-Type: text/html');
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>Data Consolidation API - Installation Test</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            h2 { margin-top: 30px; color: #444; }
            .success { color: green; font-weight: bold; }
            .error { color: red; font-weight: bold; }
            .warning { color: orange; font-weight: bold; }
            .test-item { background: #f8f8f8; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 5px solid #ddd; }
            .test-item.pass { border-left-color: green; }
            .test-item.fail { border-left-color: red; }
            .test-item.warn { border-left-color: orange; }
            code { background: #eee; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
            pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow: auto; }
            .fix-instructions { background: #fffaf0; padding: 10px; border-left: 3px solid #ffc107; margin-top: 10px; }
        </style>
    </head>
    <body>
        <h1>Data Consolidation API - Installation Test</h1>
        <p>This tool checks your installation and helps identify any issues.</p>
        <div id="test-results">';
} else {
    // If accessed through API, return JSON
    // API key already verified in index.php
}

// Initialize tests array
$tests = [];
$hasErrors = false;
$hasWarnings = false;

// Test 1: PHP Version
$phpVersion = phpversion();
$phpVersionCheck = version_compare($phpVersion, '7.4.0', '>=');
$tests[] = [
    'name' => 'PHP Version',
    'status' => $phpVersionCheck ? 'pass' : 'fail',
    'message' => 'PHP version: ' . $phpVersion,
    'expected' => 'PHP 7.4.0 or higher',
    'fix' => $phpVersionCheck ? '' : 'Contact your hosting provider to upgrade PHP to version 7.4.0 or higher.'
];
if (!$phpVersionCheck) $hasErrors = true;

// Test 2: Required PHP Extensions
$requiredExtensions = ['json', 'curl', 'mbstring', 'fileinfo'];
$missingExtensions = [];
foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = $ext;
    }
}
$extensions_check = empty($missingExtensions);
$tests[] = [
    'name' => 'PHP Extensions',
    'status' => $extensions_check ? 'pass' : 'fail',
    'message' => $extensions_check ? 'All required extensions are installed.' : 'Missing extensions: ' . implode(', ', $missingExtensions),
    'expected' => 'json, curl, mbstring, fileinfo',
    'fix' => $extensions_check ? '' : 'Enable missing PHP extensions through your hosting control panel or contact your hosting provider.'
];
if (!$extensions_check) $hasErrors = true;

// Test 3: Data Directory Permissions
$dataPath = $config['storage_path'];
$dirExists = file_exists($dataPath);
$dirWritable = $dirExists && is_writable($dataPath);

$dirStatus = 'fail';
$dirMessage = '';
$dirFix = '';

if (!$dirExists) {
    $dirMessage = 'Data directory does not exist: ' . $dataPath;
    $dirFix = 'Create the data directory and ensure proper permissions: <code>mkdir -p ' . $dataPath . '</code>';
    $hasErrors = true;
} elseif (!$dirWritable) {
    $dirMessage = 'Data directory exists but is not writable: ' . $dataPath;
    $dirFix = 'Set proper permissions: <code>chmod 755 ' . $dataPath . '</code>';
    $hasErrors = true;
} else {
    $dirStatus = 'pass';
    $dirMessage = 'Data directory exists and is writable: ' . $dataPath;
}

$tests[] = [
    'name' => 'Data Directory',
    'status' => $dirStatus,
    'message' => $dirMessage,
    'expected' => 'Directory exists and is writable',
    'fix' => $dirFix
];

// Test 4: Mod Rewrite Enabled
$modRewriteEnabled = function_exists('apache_get_modules') ? in_array('mod_rewrite', apache_get_modules()) : null;
$modRewriteStatus = $modRewriteEnabled === null ? 'warn' : ($modRewriteEnabled ? 'pass' : 'warn');
$modRewriteMessage = $modRewriteEnabled === null ? 
                   'Could not detect Apache modules. Mod rewrite status unknown.' : 
                   ($modRewriteEnabled ? 'Mod rewrite is enabled.' : 'Mod rewrite may not be enabled.');
$tests[] = [
    'name' => 'Apache Mod Rewrite',
    'status' => $modRewriteStatus,
    'message' => $modRewriteMessage,
    'expected' => 'Enabled',
    'fix' => $modRewriteEnabled === false ? 'Enable mod_rewrite in your Apache configuration or contact your hosting provider. For SiteGround, this is typically enabled by default.' : ''
];
if ($modRewriteStatus === 'warn') $hasWarnings = true;

// Test 5: Config File
$configFileInaccessible = false;
$testUrl = str_replace('/test.php', '/config.php', $_SERVER['PHP_SELF']);
$testFullUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://$_SERVER[HTTP_HOST]$testUrl";

$ch = curl_init($testFullUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$configFileInaccessible = ($httpCode == 403 || $httpCode == 404);
$tests[] = [
    'name' => 'Config File Protection',
    'status' => $configFileInaccessible ? 'pass' : 'fail',
    'message' => $configFileInaccessible ? 'Config file is protected from direct access.' : 'Config file may be accessible directly: HTTP code ' . $httpCode,
    'expected' => 'Protected (403 or 404 response)',
    'fix' => $configFileInaccessible ? '' : 'Check .htaccess file permissions and configuration. Ensure the following rule is present and working:<br><pre>
&lt;Files "config.php"&gt;
    Order Allow,Deny
    Deny from all
&lt;/Files&gt;</pre>'
];
if (!$configFileInaccessible) $hasErrors = true;

// Test 6: API Connectivity
$testEndpoint = str_replace('/test.php', '/status', $_SERVER['PHP_SELF']);
$testFullEndpoint = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://$_SERVER[HTTP_HOST]$testEndpoint";

$ch = curl_init($testFullEndpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-API-Key: demo-key-factory']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$responseData = json_decode($response, true);
$hasValidStatus = $httpCode === 200 && isset($responseData['status']) && $responseData['status'] === 'ok';

$tests[] = [
    'name' => 'API Connectivity',
    'status' => $hasValidStatus ? 'pass' : 'fail',
    'message' => $hasValidStatus ? 'API endpoints are accessible.' : 'API endpoints may not be working correctly. HTTP code: ' . $httpCode,
    'expected' => 'HTTP 200 with status: ok',
    'fix' => $hasValidStatus ? '' : 'Check your Apache configuration and .htaccess file. Ensure mod_rewrite is working correctly and the API routes are properly set up. If using subdirectories, ensure your rewrite rules account for them. Try adding this to your .htaccess file:<br><pre>RewriteBase /api/</pre>'
];
if (!$hasValidStatus) $hasErrors = true;

// Output test results
if ($directAccess) {
    // HTML output for direct access
    $overallStatus = $hasErrors ? 'fail' : ($hasWarnings ? 'warn' : 'pass');
    $overallStatusText = $hasErrors ? 'Failed' : ($hasWarnings ? 'Passed with Warnings' : 'Passed');
    $overallStatusClass = $hasErrors ? 'error' : ($hasWarnings ? 'warning' : 'success');
    
    echo '<h2>Overall Status: <span class="' . $overallStatusClass . '">' . $overallStatusText . '</span></h2>';
    
    foreach ($tests as $test) {
        echo '<div class="test-item ' . $test['status'] . '">';
        echo '<strong>' . $test['name'] . ':</strong> ';
        $statusText = $test['status'] === 'pass' ? 'Pass' : ($test['status'] === 'warn' ? 'Warning' : 'Fail');
        $statusClass = $test['status'] === 'pass' ? 'success' : ($test['status'] === 'warn' ? 'warning' : 'error');
        echo '<span class="' . $statusClass . '">' . $statusText . '</span><br>';
        echo 'Result: ' . $test['message'] . '<br>';
        echo 'Expected: ' . $test['expected'];
        
        if (!empty($test['fix'])) {
            echo '<div class="fix-instructions">';
            echo '<strong>How to fix:</strong> ' . $test['fix'];
            echo '</div>';
        }
        
        echo '</div>';
    }
    
    if ($overallStatus === 'pass') {
        echo '<h2>Installation Status: <span class="success">Ready to Use</span></h2>';
        echo '<p>Congratulations! Your Data Consolidation API installation is working correctly.</p>';
    } else {
        echo '<h2>Installation Status: <span class="' . $overallStatusClass . '">Needs Attention</span></h2>';
        echo '<p>Please fix the issues above to ensure proper functionality.</p>';
    }
    
    echo '<h2>Next Steps</h2>';
    echo '<p>Once all tests pass:</p>';
    echo '<ol>';
    echo '<li>Configure your API key in <code>config.php</code></li>';
    echo '<li>Update your allowed origins for proper CORS support</li>';
    echo '<li>Set up the Dropbox token if you plan to use automatic exports</li>';
    echo '</ol>';
    
    echo '<h2>Troubleshooting Common Issues</h2>';
    echo '<details>';
    echo '<summary><strong>API Connectivity Failing (404 Errors)</strong></summary>';
    echo '<div class="fix-instructions">';
    echo '<p>If you\\'re getting 404 errors when testing API connectivity, try these fixes:</p>';
    echo '<ol>';
    echo '<li>Make sure the .htaccess file exists in the same directory as index.php</li>';
    echo '<li>If your API is in a subdirectory (e.g., /api/), add <code>RewriteBase /api/</code> to your .htaccess file</li>';
    echo '<li>Check if mod_rewrite is enabled on your server</li>';
    echo '<li>Verify that all files (index.php, endpoints/*.php, etc.) are in the correct location</li>';
    echo '<li>If using SiteGround, make sure you have activated the Apache mod_rewrite in cPanel → PHP & Site Software → Apache Handlers</li>';
    echo '</ol>';
    echo '</div>';
    echo '</details>';
    
    echo '</div></body></html>';
} else {
    // JSON output for API access
    $result = [
        'status' => $hasErrors ? 'error' : ($hasWarnings ? 'warning' : 'ok'),
        'message' => $hasErrors ? 'Installation has issues that need to be fixed.' : 
                    ($hasWarnings ? 'Installation is working but has warnings.' : 'Installation is working correctly.'),
        'tests' => $tests
    ];
    
    echo json_encode($result);
}`;
  };
  
  const createStatusPHP = () => {
    return `<?php
/**
 * Status endpoint
 * Returns the current status of the API
 */

// Check if method is GET
if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Check write permissions on data directory
$canWrite = is_writable($config['storage_path']);

// Return API status
echo json_encode([
    'status' => 'ok',
    'version' => '1.0.0',
    'timestamp' => date('c'),
    'storage' => [
        'path' => $config['storage_path'],
        'writable' => $canWrite
    ]
]);`;
  };
  
  const createDataPHP = () => {
    return `<?php
/**
 * Data endpoint
 * Receives and stores data from sources
 */

// Check if method is POST
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate data
if (empty($data) || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data format']);
    exit();
}

// Required fields validation
$requiredFields = ['sensorId'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: {$field}"]);
        exit();
    }
}

// Add timestamp if not present
if (!isset($data['timestamp'])) {
    $data['timestamp'] = date('c');
}

// Add unique ID if not present
if (!isset($data['id'])) {
    $data['id'] = uniqid('entry-');
}

// Store the data
$filename = $config['storage_path'] . '/' . date('Y-m-d-H-i-s') . '-' . uniqid() . '.json';
$success = file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));

if ($success === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save data']);
    exit();
}

// Return success response
echo json_encode([
    'success' => true,
    'message' => 'Data received successfully',
    'id' => $data['id']
]);`;
  };
  
  const createExportPHP = () => {
    return `<?php
/**
 * Export endpoint
 * Exports collected data to CSV format
 */

// Check if method is GET
if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get all JSON files from data directory
$files = glob($config['storage_path'] . '/*.json');
if (empty($files)) {
    echo json_encode(['message' => 'No data to export']);
    exit();
}

// Collect all data
$allData = [];
foreach ($files as $file) {
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    if ($data) {
        $allData[] = $data;
    }
}

// Get all possible fields
$allFields = [];
foreach ($allData as $item) {
    foreach (array_keys($item) as $key) {
        if (!in_array($key, $allFields)) {
            $allFields[] = $key;
        }
    }
}

// Generate CSV content
$csvContent = implode(",", $allFields) . "\\n";
foreach ($allData as $item) {
    $line = [];
    foreach ($allFields as $field) {
        $value = isset($item[$field]) ? $item[$field] : '';
        // Escape quotes in CSV
        if (is_string($value)) {
            $value = '"' . str_replace('"', '""', $value) . '"';
        }
        $line[] = $value;
    }
    $csvContent .= implode(",", $line) . "\\n";
}

// Dropbox export option
$dropboxExport = false;
if (!empty($config['dropbox_token'])) {
    $dropboxExport = true;
    // In a real implementation, you would use Dropbox API to upload the CSV
    // This is a placeholder for demonstration
}

// Return CSV directly to the client
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="data-export-' . date('Y-m-d') . '.csv"');
echo $csvContent;`;
  };
  
  const createReadme = () => {
    return `# Data Consolidation API

A simple PHP API for collecting and consolidating data from various sources.

## Installation

1. Upload all files to your web server
2. Set appropriate permissions (755 for directories, 644 for files)
3. Configure your settings in config.php
4. Test the installation by visiting https://your-domain.com/path/to/api/test.php

## API Endpoints

- **/data** - POST endpoint for receiving data
- **/export** - GET endpoint for exporting data to CSV
- **/status** - GET endpoint for checking API status
- **/test.php** - Test script to verify your installation 

## Configuration

Edit the config.php file to set:
- Allowed origins for CORS
- Storage path for data
- Dropbox token for backups
- Admin credentials

## Security

- Always use HTTPS in production
- Change the default admin password
- Consider implementing additional authentication if needed

## Support

For any issues or questions, please contact support.`;
  };

  const createInstallPHP = () => {
    return `<?php
// Simple installer file
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Data Consolidation API - Simple Installer</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { margin-top: 30px; color: #444; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .step { background: #f8f8f8; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 5px solid #ddd; }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            cursor: pointer;
            border: none;
            font-size: 16px;
        }
        .button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <h1>Data Consolidation API - Installation</h1>
    <p>Welcome to the Data Consolidation API installer.</p>
    
    <div class="step">
        <h2>System Check</h2>
        <?php
        // Check PHP version
        $phpVersion = phpversion();
        $phpVersionCheck = version_compare($phpVersion, '7.4.0', '>=');
        echo "<p><strong>PHP Version:</strong> $phpVersion ";
        if ($phpVersionCheck) {
            echo "<span class='success'>✓</span>";
        } else {
            echo "<span class='error'>✗</span> (Required: PHP 7.4.0 or higher)";
        }
        echo "</p>";
        
        // Check required extensions
        $requiredExtensions = ['json', 'curl', 'mbstring'];
        $missingExtensions = [];
        foreach ($requiredExtensions as $ext) {
            if (!extension_loaded($ext)) {
                $missingExtensions[] = $ext;
            }
        }
        echo "<p><strong>PHP Extensions:</strong> ";
        if (empty($missingExtensions)) {
            echo "<span class='success'>All required extensions are installed ✓</span>";
        } else {
            echo "<span class='error'>Missing extensions: " . implode(', ', $missingExtensions) . " ✗</span>";
        }
        echo "</p>";
        
        // Check write permissions
        $currentDir = dirname(__FILE__);
        $canWrite = is_writable($currentDir);
        echo "<p><strong>Write Permission:</strong> ";
        if ($canWrite) {
            echo "<span class='success'>Directory is writable ✓</span>";
        } else {
            echo "<span class='error'>Directory is not writable ✗</span>";
        }
        echo "</p>";
        ?>
    </div>
    
    <div class="step">
        <h2>Installation Instructions</h2>
        <ol>
            <li>Extract all files from the zip package to your web directory</li>
            <li>Create a <strong>data</strong> directory and ensure it's writable</li>
            <li>Create an <strong>endpoints</strong> directory for the API endpoints</li>
            <li>Run the test script at <a href="test.php">test.php</a> to verify your installation</li>
        </ol>
        
        <p><a href="test.php" class="button">Run Test Script</a></p>
    </div>
    
    <div class="step">
        <h2>API Configuration</h2>
        <p>Edit the <strong>config.php</strong> file to set:</p>
        <ul>
            <li>Allowed origins for CORS</li>
            <li>Storage path for data</li>
            <li>Authentication credentials</li>
        </ul>
    </div>
    
    <p>For more detailed instructions, please refer to the included README.md file.</p>
</body>
</html>`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Create root directory structure and files for the simplified package
      zip.file("install.php", createInstallPHP());
      zip.file("index.php", createIndexPHP());
      zip.file(".htaccess", createHtaccess());
      zip.file("test.php", createTestPHP());
      
      // Create config.php (simplified)
      zip.file("config.php", `<?php
/**
 * Configuration file for Data Consolidation API
 */

$config = [
    // Allowed origins for CORS
    'allowed_origins' => ['*'], // Replace with your frontend domain in production
    
    // Path to data storage directory (absolute path)
    'storage_path' => __DIR__ . '/data',
    
    // API key (change this in production)
    'api_key' => 'your-secure-api-key-here'
];

// Validate storage directory
if (!file_exists($config['storage_path'])) {
    mkdir($config['storage_path'], 0755, true);
}
`);

      // Create directories
      const endpointsDir = zip.folder("endpoints");
      const dataDir = zip.folder("data");
      
      // Add endpoint files
      endpointsDir.file("status.php", createStatusPHP());
      endpointsDir.file("data.php", createDataPHP());
      endpointsDir.file("export.php", createExportPHP());
      
      // Add README
      zip.file("README.md", createReadme());
      
      // Create sample data file
      dataDir.file(".gitkeep", "");
      
      // Generate the ZIP file
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      // Save the ZIP file using FileSaver
      FileSaver.saveAs(zipContent, "data-consolidation-api.zip");
      
      // Show success toast
      toast({
        title: "Download started",
        description: "Your installation package is downloading now. Extract the ZIP file to use it.",
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
            <ol className="list-disc list-inside space-y-1 text-sm">
              <li><strong>install.php</strong> - All-in-one installer script</li>
              <li><strong>Complete API Files</strong> - Ready to use on your server</li>
              <li><strong>Test Script</strong> - Verify your installation and troubleshoot issues</li>
              <li><strong>Documentation</strong> - README and usage instructions</li>
            </ol>
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
                    <li>Create a new folder named "api" (or use your preferred name)</li>
                    <li>Upload the downloaded ZIP file to this folder</li>
                    <li>Extract the ZIP file in the "api" folder</li>
                    <li><strong>Important:</strong> Make sure all files are directly in the "api" folder, not in a subfolder</li>
                  </ul>
                  
                  <p className="mt-2">Option 2: Using FTP</p>
                  <ul className="list-disc list-inside ml-3">
                    <li>Connect to your server using an FTP client (like FileZilla)</li>
                    <li>Navigate to your website's document root</li>
                    <li>Create a new folder named "api" (or
