
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
// Installation test script
// Simplified version to avoid 500 errors

// Output simple HTML
echo '<!DOCTYPE html>
<html>
<head>
    <title>API Installation Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; }
        .error { color: red; }
        .test { padding: 10px; border: 1px solid #ddd; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>API Installation Test</h1>
    <p>This page tests your API installation.</p>
    
    <div class="test">
        <h3>PHP Version Test</h3>';
        
// Check PHP version
$phpVersion = phpversion();
$phpVersionCheck = version_compare($phpVersion, '7.0.0', '>=');
echo "<p>PHP Version: {$phpVersion} ";
echo $phpVersionCheck ? '<span class="success">✓</span>' : '<span class="error">✗</span> (Requires 7.0.0+)';
echo '</p>';

// Check if data directory exists and is writable
echo '<h3>Data Directory Test</h3>';
$dataDir = __DIR__ . '/data';
if (!file_exists($dataDir)) {
    echo '<p><span class="error">✗</span> Data directory does not exist.</p>';
    echo '<p>Create it with: <code>mkdir data</code></p>';
} else {
    if (is_writable($dataDir)) {
        echo '<p><span class="success">✓</span> Data directory exists and is writable.</p>';
    } else {
        echo '<p><span class="error">✗</span> Data directory exists but is not writable.</p>';
        echo '<p>Fix with: <code>chmod 755 data</code></p>';
    }
}

echo '<h3>Configuration File Test</h3>';
if (file_exists(__DIR__ . '/config.php')) {
    echo '<p><span class="success">✓</span> Configuration file exists.</p>';
} else {
    echo '<p><span class="error">✗</span> Configuration file does not exist.</p>';
    echo '<p>Make sure config.php is in the same directory as this file.</p>';
}

echo '
    </div>
    
    <h2>Next Steps</h2>
    <p>Once all tests pass:</p>
    <ol>
        <li>Set up your API key in config.php</li>
        <li>Try a test request to the /status endpoint</li>
        <li>Configure your client application to use the API</li>
    </ol>
    
</body>
</html>';`;
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
// Simple installer file - basic version to prevent 500 errors
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Installer</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; 
                 text-decoration: none; border-radius: 4px; }
        .step { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Data Consolidation API - Installation</h1>
    
    <div class="step">
        <h2>Step 1: Verify System Requirements</h2>
        <ul>
            <li>PHP 7.0 or higher</li>
            <li>Apache with mod_rewrite enabled</li>
            <li>Write permissions in the installation directory</li>
        </ul>
    </div>
    
    <div class="step">
        <h2>Step 2: Installation Instructions</h2>
        <ol>
            <li>Extract all files to your web directory</li>
            <li>Create a data directory with write permissions</li>
            <li>Edit config.php with your settings</li>
            <li>Run the test script to verify installation</li>
        </ol>
        
        <p><a href="test.php" class="button">Run Test Script</a></p>
    </div>
    
    <div class="step">
        <h2>Step 3: Next Steps</h2>
        <p>After installation is complete:</p>
        <ul>
            <li>Configure your API key</li>
            <li>Set up CORS allowed origins</li>
            <li>Start using the API endpoints</li>
        </ul>
    </div>
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
                    <li>Create a new folder named "api"</li>
                    <li>Upload all extracted files to this folder</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </li>
            
            <li>
              <Collapsible open={isOpenConfig} onOpenChange={setIsOpenConfig} className="space-y-2">
                <CollapsibleTrigger className="font-medium flex items-center">
                  Configure the API
                  {isOpenConfig ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-5 space-y-2 text-muted-foreground">
                  <p>After uploading, you need to:</p>
                  <ol className="list-decimal list-inside ml-3">
                    <li>Create a data directory: <code>mkdir data</code></li>
                    <li>Set permissions: <code>chmod 755 data</code></li>
                    <li>Edit config.php to set your own API key and allowed origins</li>
                    <li>Run the test script at: <code>https://yourdomain.com/api/test.php</code></li>
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
