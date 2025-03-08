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
        <h3>Server Information</h3>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Server Software: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></p>
        <p>Document Root: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'; ?></p>
    </div>
    
    <div class="test">
        <h3>API Connectivity</h3>
        <?php
        // Test API connection to status endpoint
        $statusUrl = '../status';
        $ch = curl_init($statusUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $success = false;
        
        if ($httpCode === 200) {
            // Extract JSON response body
            list($header, $body) = explode("\\r\\n\\r\\n", $response, 2);
            $data = json_decode($body, true);
            
            if ($data && isset($data['status']) && $data['status'] === 'ok') {
                echo '<p><span class="success">Success!</span> API endpoints are working correctly.</p>';
                $success = true;
            } else {
                echo '<p><span class="error">Fail</span> API returned HTTP 200 but unexpected response format.</p>';
            }
        } else {
            echo '<p><span class="error">Fail</span></p>';
            echo '<p>Result: API endpoints may not be working correctly. HTTP code: ' . $httpCode . '</p>';
            echo '<p>Expected: HTTP 200 with status: ok</p>';
            echo '<p>How to fix: Check your Apache configuration and .htaccess file. Ensure mod_rewrite is working correctly and the API routes are properly set up. If using subdirectories, ensure your rewrite rules account for them. Try adding this to your .htaccess file:</p>';
            echo '<code>RewriteBase /api/</code></p>';
        }
        curl_close($ch);
        ?>
    </div>
    
    <div class="test">
        <h3>File Permissions</h3>
        <?php
        // Check if data directory exists
        $dataDir = '../data';
        if (file_exists($dataDir)) {
            if (is_writable($dataDir)) {
                echo '<p><span class="success">Success!</span> Data directory exists and is writable.</p>';
            } else {
                echo '<p><span class="warning">Warning</span> Data directory exists but is not writable.</p>';
                echo '<p>How to fix: Run <code>chmod 755 data</code> to set correct permissions.</p>';
            }
        } else {
            echo '<p><span class="warning">Warning</span> Data directory does not exist.</p>';
            echo '<p>How to fix: Create the data directory with <code>mkdir data</code> and set permissions with <code>chmod 755 data</code>.</p>';
        }
        
        // Check if .htaccess file exists
        if (file_exists('../.htaccess')) {
            echo '<p><span class="success">Success!</span> .htaccess file exists.</p>';
        } else {
            echo '<p><span class="error">Error</span> .htaccess file does not exist.</p>';
            echo '<p>How to fix: Make sure you have uploaded the .htaccess file to your server.</p>';
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
</html>`;
  };
  
  const createInstallPHP = () => {
    return `<!DOCTYPE html>
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
            <li>Extract all files to your web directory (make sure .htaccess is included)</li>
            <li>Create a 'data' directory with write permissions (chmod 755)</li>
            <li>Ensure mod_rewrite is enabled in Apache</li>
            <li>Ensure the RewriteBase in .htaccess matches your installation path</li>
            <li>Run the test script to verify installation</li>
        </ol>
        
        <p><a href="test.php" class="button">Run Test Script</a></p>
    </div>
    
    <div class="step">
        <h2>Step 3: Common Issues</h2>
        <ul>
            <li><strong>404 Errors:</strong> Make sure mod_rewrite is enabled and .htaccess is working</li>
            <li><strong>500 Errors:</strong> Check PHP error logs for details</li>
            <li><strong>Permission Issues:</strong> Set proper permissions on the 'data' directory</li>
        </ul>
    </div>
    
    <div class="step">
        <h2>Step 4: Next Steps</h2>
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
`);

      // Create directories
      const dataDir = zip.folder("data");
      
      // Add README
      zip.file("README.md", `# Data Consolidation API

A simple PHP API for collecting and consolidating data from various sources.

## Installation

1. Upload all files to your web server
2. Set appropriate permissions (755 for directories, 644 for files)
3. Configure your settings in config.php
4. Test the installation by visiting https://your-domain.com/path/to/api/test.php

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
            
            <p className="text-sm font-medium mb-2 text-primary">What's Included in the Package:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>install.php</strong> - All-in-one installer script</li>
              <li><strong>index.php</strong> - Main API entry point</li>
              <li><strong>.htaccess</strong> - Apache configuration with RewriteBase</li>
              <li><strong>test.php</strong> - Verify your installation and troubleshoot issues</li>
              <li><strong>data/</strong> - Directory for storing data</li>
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
                    <li>Create a new folder named "api" (or use your preferred name)</li>
                    <li>Upload the downloaded ZIP file to this folder</li>
                    <li>Extract the ZIP file in the "api" folder</li>
                    <li><strong>Important:</strong> Make sure all files are directly in the "api" folder, not in a subfolder</li>
                    <li><strong>Very Important:</strong> Ensure the .htaccess file was properly extracted - it's often hidden</li>
                  </ul>
                  
                  <p className="mt-2">Option 2: Using FTP</p>
                  <ul className="list-disc list-inside ml-3">
                    <li>Connect to your server using an FTP client (like FileZilla)</li>
                    <li>Navigate to your website's document root</li>
                    <li>Create a new folder named "api"</li>
                    <li>Upload all extracted files to this folder</li>
                    <li>Make sure to include the .htaccess file (enable "Show hidden files" in your FTP client)</li>
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
                    <li>Create a data directory if it doesn't exist: <code>mkdir data</code></li>
                    <li>Set permissions: <code>chmod 755 data</code></li>
                    <li>Verify that the .htaccess file has the correct RewriteBase setting (should be "/api/" by default)</li>
                    <li>If your installation is in a different path, edit the RewriteBase in .htaccess</li>
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
