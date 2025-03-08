
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Server, FileDown, ChevronDown, ChevronUp, FolderDown, Code, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const Installer: React.FC = () => {
  const [isOpenFTP, setIsOpenFTP] = useState(false);
  const [isOpenCPanel, setIsOpenCPanel] = useState(false);
  const [isOpenConfig, setIsOpenConfig] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Create root directory structure
      const apiDir = zip.folder("data-consolidation-api");
      const dataDir = apiDir.folder("data");
      
      // Add index.php - Main entry point
      apiDir.file("index.php", `<?php
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
}
`);

      // Add config.php - Configuration file
      apiDir.file("config.php", `<?php
/**
 * Configuration file for Data Consolidation API
 * Edit this file to configure your API settings
 */

$config = [
    // Allowed origins for CORS
    'allowed_origins' => ['*'], // Replace with your frontend domain in production
    
    // Path to data storage directory (absolute path)
    'storage_path' => __DIR__ . '/data',
    
    // Dropbox integration settings
    'dropbox_token' => 'YOUR_DROPBOX_TOKEN',
    
    // Authentication credentials for admin access
    'admin_username' => 'admin',
    'admin_password' => 'change_this_password'
];

// Validate storage directory
if (!file_exists($config['storage_path'])) {
    mkdir($config['storage_path'], 0755, true);
}
`);

      // Add test.php - Installation test file
      apiDir.file("test.php", `<?php
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
$modRewriteEnabled = in_array('mod_rewrite', apache_get_modules());
$tests[] = [
    'name' => 'Apache Mod Rewrite',
    'status' => $modRewriteEnabled ? 'pass' : 'warn',
    'message' => $modRewriteEnabled ? 'Mod rewrite is enabled.' : 'Mod rewrite may not be enabled.',
    'expected' => 'Enabled',
    'fix' => $modRewriteEnabled ? '' : 'Enable mod_rewrite in your Apache configuration or contact your hosting provider. For SiteGround, this is typically enabled by default.'
];
if (!$modRewriteEnabled) $hasWarnings = true;

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
    'fix' => $hasValidStatus ? '' : 'Check your Apache configuration and .htaccess file. Ensure mod_rewrite is working correctly and the API routes are properly set up.'
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
}
`);

      // Add .htaccess file
      apiDir.file(".htaccess", `# Enable rewrite engine
RewriteEngine On
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
</IfModule>
`);

      // Create endpoints directory
      const endpointsDir = apiDir.folder("endpoints");
      
      // Add status.php endpoint
      endpointsDir.file("status.php", `<?php
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
]);
`);

      // Add data.php endpoint
      endpointsDir.file("data.php", `<?php
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
]);
`);

      // Add export.php endpoint
      endpointsDir.file("export.php", `<?php
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
echo $csvContent;
`);

      // Add README.md
      apiDir.file("README.md", `# Data Consolidation API

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

For any issues or questions, please contact support.
`);

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
            
            <ol className="list-decimal list-inside space-y-3 text-sm">
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
                      <li>Right-click on the ZIP file and select "Extract"</li>
                    </ul>
                    
                    <p className="mt-2">Option 2: Using FTP</p>
                    <ul className="list-disc list-inside ml-3">
                      <li>Connect to your server using an FTP client (like FileZilla)</li>
                      <li>Navigate to your website's document root</li>
                      <li>Create a new folder named "api" (or use your preferred name)</li>
                      <li>Extract the ZIP file on your computer</li>
                      <li>Upload the extracted "data-consolidation-api" folder to your server</li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </li>
              
              <li>
                <Collapsible open={isOpenConfig} onOpenChange={setIsOpenConfig} className="space-y-2">
                  <CollapsibleTrigger className="font-medium flex items-center">
                    Configure the application
                    {isOpenConfig ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
                    <p>In the "data-consolidation-api" folder, locate the config.php file and edit it:</p>
                    <div className="bg-secondary p-3 rounded-md mt-2 mb-2">
                      <pre className="text-xs overflow-x-auto">
{`// config.php
$config = [
    'allowed_origins' => ['https://your-front-end-domain.com'],
    'storage_path' => '/absolute/path/to/data/storage',
    'dropbox_token' => 'your_dropbox_token',
    'admin_username' => 'admin',
    'admin_password' => 'change_this_password'
];`}
                      </pre>
                    </div>
                    <p>Update these settings as needed for your environment.</p>
                  </CollapsibleContent>
                </Collapsible>
              </li>
              
              <li className="font-medium">Set the correct permissions</li>
              <div className="pl-5 text-muted-foreground">
                <p>Make sure the directories and files have the correct permissions:</p>
                <div className="bg-secondary p-2 rounded-md mt-1 mb-2">
                  <code className="text-xs">chmod 755 data-consolidation-api</code><br />
                  <code className="text-xs">chmod 755 data-consolidation-api/data</code><br />
                  <code className="text-xs">chmod 644 data-consolidation-api/*.php</code>
                </div>
              </div>
              
              <li className="font-medium">Test the installation</li>
              <div className="pl-5 text-muted-foreground">
                <p>Visit <code>https://your-domain.com/api/data-consolidation-api/test.php</code> to run the installation test script.</p>
                <p>The test script will check your server configuration and help troubleshoot any issues.</p>
                <div className="flex items-center gap-2 mt-2 text-green-600">
                  <CheckSquare className="h-4 w-4" />
                  <span>All tests should pass before using the API in production</span>
                </div>
              </div>
            </ol>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-3">Advanced Configuration</h3>
            
            <Tabs defaultValue="htaccess" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="htaccess">.htaccess Setup</TabsTrigger>
                <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
              </TabsList>
              
              <TabsContent value="htaccess" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The .htaccess file is already included in the package, but you may need to modify it:
                </p>
                <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                  <pre className="text-xs">
{`# Enable rewrite engine
RewriteEngine On
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
</IfModule>`}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="endpoints" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The installer provides these API endpoints:
                </p>
                <div className="space-y-2">
                  <div className="p-2 bg-secondary/50 rounded-md">
                    <code className="text-xs">POST /api/data-consolidation-api/data</code>
                    <p className="text-xs mt-1">Main endpoint for receiving data from sources. Send JSON data with X-API-Key header.</p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded-md">
                    <code className="text-xs">GET /api/data-consolidation-api/export</code>
                    <p className="text-xs mt-1">Export data to CSV format. Requires X-API-Key header.</p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded-md">
                    <code className="text-xs">GET /api/data-consolidation-api/status</code>
                    <p className="text-xs mt-1">Check if the API is running correctly. Requires X-API-Key header.</p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded-md">
                    <code className="text-xs">GET /api/data-consolidation-api/test.php</code>
                    <p className="text-xs mt-1">Installation test script that checks your server setup and configuration.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="p-3 bg-primary/5 rounded-md w-full">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Code className="h-4 w-4" />
            Server Requirements
          </h3>
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
            <li>PHP 7.4 or higher</li>
            <li>JSON extension enabled</li>
            <li>cURL extension enabled</li>
            <li>mod_rewrite enabled (for clean URLs)</li>
            <li>Write permissions on data directory</li>
          </ul>
        </div>
        
        <Button variant="outline" className="gap-2 w-full" onClick={() => window.open('https://www.siteground.com/tutorials/php/', '_blank')}>
          <FolderDown className="h-4 w-4" />
          SiteGround PHP Documentation
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Installer;
