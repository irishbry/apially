
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Server, FileDown, ChevronDown, ChevronUp, FolderDown, Code } from "lucide-react";
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
4. Test the installation by visiting https://your-domain.com/path/to/api/status

## API Endpoints

- **/data** - POST endpoint for receiving data
- **/export** - GET endpoint for exporting data to CSV
- **/status** - GET endpoint for checking API status

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
                <p>Visit <code>https://your-domain.com/api/data-consolidation-api/status</code> to verify the API is working.</p>
                <p>You should see a JSON response with status: "ok"</p>
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
