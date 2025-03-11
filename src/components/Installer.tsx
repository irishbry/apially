
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
import { createInstallerPHP } from "@/utils/installerTemplates";

const Installer: React.FC = () => {
  const [isOpenFTP, setIsOpenFTP] = useState(false);
  const [isOpenCPanel, setIsOpenCPanel] = useState(false);
  const [isOpenConfig, setIsOpenConfig] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const createIndexPHP = () => {
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
  
  const createHtaccess = () => {
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
  
  const createTestPHP = () => {
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
  
  const createConfigPHP = () => {
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
  
  const createReadme = () => {
    return `# Data Consolidation API

A simple PHP API for collecting and consolidating data from various sources.

## Installation

1. Upload all files to your web server
2. Set appropriate permissions (755 for directories, 644 for files)
3. Configure your settings in config.php
4. Test the installation by visiting install.php

## IMPORTANT: Hidden .htaccess File

The .htaccess file is CRITICAL but may be hidden in your file browser. See htaccess_readme.md for details.

## API Endpoints

- **/status** - GET endpoint for checking API status
- **/test.php** - Test script to verify your installation 

## Configuration

Edit the config.php file to set:
- Storage path for data
- API key for authentication

## Troubleshooting

If you experience 500 errors:
- Check your server's PHP error log
- Ensure PHP 7.0+ is installed
- Make sure all required extensions are available (json, curl)
- Set correct file permissions
`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Create root directory structure and files for the simplified package
      zip.file("install.php", createInstallerPHP());
      
      // Create API directory
      const apiDir = zip.folder("api");
      apiDir.file("index.php", createIndexPHP());
      apiDir.file(".htaccess", createHtaccess());
      apiDir.file("test.php", createTestPHP());
      apiDir.file("config.php", createConfigPHP());
      
      // Add a special readme about the .htaccess file
      apiDir.file("htaccess_readme.md", createHtaccessReadme());
      
      // Create directories
      const dataDir = apiDir.folder("data");
      
      // Add README
      zip.file("README.md", createReadme());
      
      // Create sample data file to ensure directory is created
      dataDir.file(".gitkeep", "");
      
      // Generate the ZIP file
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      // Save the ZIP file using FileSaver
      FileSaver.saveAs(zipContent, "data-consolidation-api.zip");
      
      // Show success toast with .htaccess warning
      toast({
        title: "Download started",
        description: "Your installation package is downloading. IMPORTANT: The .htaccess file may be hidden - see htaccess_readme.md in the package.",
        duration: 5000,
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
              <li><strong>api/config.php</strong> - Basic configuration file</li>
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
