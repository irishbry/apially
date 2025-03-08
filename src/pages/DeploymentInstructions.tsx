import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, Server, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const DeploymentInstructions = () => {
  const { toast } = useToast();
  const [isDownloadingFrontend, setIsDownloadingFrontend] = React.useState(false);
  const [isDownloadingAPI, setIsDownloadingAPI] = React.useState(false);

  const downloadFrontendFiles = async () => {
    setIsDownloadingFrontend(true);
    
    try {
      const zip = new JSZip();
      
      zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Consolidation Frontend</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <div id="app"></div>
  <script src="assets/js/main.js"></script>
</body>
</html>`);
      
      const cssFolder = zip.folder("assets/css");
      cssFolder.file("style.css", `/* Main Stylesheet */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  margin: 0;
  padding: 0;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}`);
      
      const jsFolder = zip.folder("assets/js");
      jsFolder.file("main.js", `// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  const app = document.getElementById('app');
  
  app.innerHTML = \`
    <div class="container">
      <header>
        <h1>Data Consolidation App</h1>
        <p>Connect to your API at /api</p>
      </header>
      <main>
        <section id="status">
          <h2>API Status</h2>
          <div id="status-output">Checking API status...</div>
        </section>
      </main>
    </div>
  \`;
  
  fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      document.getElementById('status-output').innerHTML = 
        '<div style="color: green">✓ API connected successfully!</div>' +
        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    })
    .catch(error => {
      document.getElementById('status-output').innerHTML = 
        '<div style="color: red">✗ Error connecting to API. Make sure API is installed properly.</div>' +
        '<pre>' + error + '</pre>';
    });
});`);
      
      zip.file("README.md", `# Frontend Files

These are the basic frontend files for your Data Consolidation application.

## File Structure

- index.html - Main HTML file
- assets/css/style.css - Stylesheet
- assets/js/main.js - JavaScript functionality

## Installation

1. Upload all files to your web server's root directory
2. Make sure your API is installed in the /api directory
3. Open your website in a browser

## Customization

You can modify these files or replace them with your own custom frontend.
`);
      
      const zipContent = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(zipContent, "frontend-files.zip");
      
      toast({
        title: "Frontend files downloaded",
        description: "Your frontend files package is ready. Extract and upload to your server.",
      });
    } catch (error) {
      console.error("Error creating frontend package:", error);
      toast({
        title: "Download failed",
        description: "There was an error creating the frontend package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingFrontend(false);
    }
  };

  const downloadAPIFiles = async () => {
    setIsDownloadingAPI(true);
    
    try {
      const zip = new JSZip();
      
      zip.file("index.php", `<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$endpoint = str_replace($basePath, '', $requestPath);
$endpoint = trim($endpoint, '/');

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
}`);
      
      zip.file(".htaccess", `# Enable rewrite engine
RewriteEngine On

RewriteBase /api/

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

RewriteRule ^(.*)$ index.php [QSA,L]

<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, X-API-Key"
</IfModule>

<IfModule mod_rewrite.c>
    RewriteRule ^data/ - [F,L]
</IfModule>`);
      
      zip.file("test.php", `<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
        <h3>API Configuration</h3>
        <?php
        if (file_exists('.htaccess')) {
            echo "<p><span class='success'>✓</span> .htaccess file exists</p>";
        } else {
            echo "<p><span class='error'>✗</span> .htaccess file does not exist</p>";
            echo "<p>This file is critical for API routing to work!</p>";
        }
        
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
</body>
</html>`);
      
      zip.file("config.php", `<?php
$config = [
    'api_key' => 'your-secure-api-key-here',
    'allowed_origins' => ['*'],
    'data_dir' => __DIR__ . '/data'
];

if (!file_exists($config['data_dir'])) {
    mkdir($config['data_dir'], 0755, true);
}

return $config;`);
      
      zip.file("phpinfo.php", `<?php
phpinfo();
`);
      
      const dataDir = zip.folder("data");
      dataDir.file(".gitkeep", "");
      
      zip.file("README.md", `# API Files

These are the core API files for your Data Consolidation application.

## Installation

1. Upload all files to a directory named 'api' in your web server's root
2. Make sure the .htaccess file is included (it might be hidden in your file browser)
3. Ensure the 'data' directory is writable by the web server
4. Test your installation by visiting https://yourdomain.com/api/test.php

## Configuration

Edit config.php to set:
- Your API key (change from the default value)
- Allowed origins for CORS headers (set to your domain in production)

## Troubleshooting

If you encounter issues:
1. Check the test.php page for diagnostics
2. Make sure .htaccess file is uploaded (it may be hidden)
3. Verify mod_rewrite is enabled in Apache
4. Ensure AllowOverride is set to All in your Apache configuration
`);
      
      const zipContent = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(zipContent, "api-files.zip");
      
      toast({
        title: "API files downloaded",
        description: "Your API files package is ready. Extract and upload to an 'api' directory on your server.",
      });
    } catch (error) {
      console.error("Error creating API package:", error);
      toast({
        title: "Download failed",
        description: "There was an error creating the API package.",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingAPI(false);
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <FileText className="h-5 w-5 text-primary" />
          Complete Deployment Instructions
        </CardTitle>
        <CardDescription>
          Step-by-step guide for non-technical users to deploy this application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <Server className="h-4 w-4" />
            <AlertTitle>This is a Two-Part Application</AlertTitle>
            <AlertDescription>
              This application consists of two parts that need to be deployed separately:
              <ol className="list-decimal list-inside mt-2 ml-2 space-y-1">
                <li><strong>Frontend (React):</strong> The user interface you see in the preview window</li>
                <li><strong>Backend (PHP API):</strong> The server code that processes and stores data</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="shared" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="shared">Shared Hosting</TabsTrigger>
              <TabsTrigger value="cpanel">cPanel</TabsTrigger>
              <TabsTrigger value="ftp">FTP</TabsTrigger>
              <TabsTrigger value="cli">Command Line</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shared" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Deploying to Shared Hosting (Non-Technical Guide)</h3>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Step 1: Download Required Files
                  </h4>
                  <p className="mb-2 text-sm">First, you need to download these two packages:</p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2" 
                      onClick={downloadFrontendFiles}
                      disabled={isDownloadingFrontend}
                    >
                      {isDownloadingFrontend ? (
                        <>
                          <div className="h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                          Creating Package...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download Frontend Files
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2" 
                      onClick={downloadAPIFiles}
                      disabled={isDownloadingAPI}
                    >
                      {isDownloadingAPI ? (
                        <>
                          <div className="h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                          Creating Package...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download API Files
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Step 2: Upload Files to Your Web Server
                  </h4>
                  <p className="mb-2 text-sm">Log into your web hosting control panel (like cPanel or Plesk):</p>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Navigate to the file manager</li>
                    <li>Upload the <strong>Frontend files</strong> to your <strong>root directory</strong> (often called public_html, www, or htdocs)</li>
                    <li>Create a folder called <strong>api</strong> in the root directory</li>
                    <li>Upload the <strong>API files</strong> to the <strong>api</strong> folder</li>
                    <li>
                      <strong className="text-amber-800">Make sure hidden files are also uploaded!</strong>
                      <ul className="list-disc list-inside ml-5 text-muted-foreground mt-1">
                        <li>In cPanel File Manager: Click "Settings" and check "Show Hidden Files (dotfiles)"</li>
                        <li>In FileZilla (FTP): Go to Server {'>'} Force showing hidden files</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Step 3: Check File Structure
                  </h4>
                  <p className="mb-2 text-sm">Your files should be organized like this:</p>
                  <div className="bg-secondary/30 p-3 rounded text-xs font-mono whitespace-pre overflow-x-auto">
{`public_html/ (or www/)
├── index.html       <-- Frontend files
├── assets/          <-- Frontend files
│   └── ...more files
└── api/             <-- API folder
    ├── index.php    <-- API files
    ├── .htaccess    <-- IMPORTANT! (Hidden file)
    ├── config.php   <-- API files
    └── ...more files`}
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Step 4: Configure the API
                  </h4>
                  <p className="mb-2 text-sm">Edit the <code>config.php</code> file in the api folder:</p>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Find the <code>config.php</code> file in the api folder</li>
                    <li>Open it for editing</li>
                    <li>Change <code>'your-secure-api-key-here'</code> to a strong password you create</li>
                    <li>If needed, change the <code>'*'</code> in <code>allowed_origins</code> to your domain (e.g., <code>'https://yourdomain.com'</code>)</li>
                    <li>Save the file</li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Step 5: Check the .htaccess File
                  </h4>
                  <p className="mb-2 text-sm">Make sure the <code>.htaccess</code> file in the api folder has the correct <code>RewriteBase</code>:</p>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Find the <code>.htaccess</code> file in the api folder (it might be hidden)</li>
                    <li>Open it for editing</li>
                    <li>Find the line <code>RewriteBase /</code></li>
                    <li>Change it to <code>RewriteBase /api/</code> (if your API is in the api folder)</li>
                    <li>Save the file</li>
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Step 6: Test Your Installation
                  </h4>
                  <p className="mb-2 text-sm">Check if everything is working:</p>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Open your browser and go to <code>https://yourdomain.com/</code> to see the frontend</li>
                    <li>Go to <code>https://yourdomain.com/api/test.php</code> to test the API</li>
                    <li>If the test shows all green checks, your API is working correctly!</li>
                  </ol>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cpanel" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">cPanel Deployment Steps</h3>
                <ol className="list-decimal list-inside space-y-4 text-sm">
                  <li>
                    <strong>Log into cPanel</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Access your hosting control panel using the address provided by your hosting company</p>
                  </li>
                  <li>
                    <strong>Open File Manager</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Click on the File Manager icon in the Files section</p>
                  </li>
                  <li>
                    <strong>Show Hidden Files</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Click "Settings" in the top right and check "Show Hidden Files (dotfiles)"</p>
                  </li>
                  <li>
                    <strong>Navigate to public_html</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">This is your website's root directory</p>
                  </li>
                  <li>
                    <strong>Upload Frontend Files</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Click "Upload" and select all files from the Frontend zip you downloaded</p>
                  </li>
                  <li>
                    <strong>Create api Directory</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Click "New Folder" and name it "api"</p>
                  </li>
                  <li>
                    <strong>Upload API Files</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Navigate to the api folder, click "Upload" and select all files from the API zip</p>
                  </li>
                  <li>
                    <strong>Edit config.php</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Right-click on config.php in the api folder and select "Edit"</p>
                    <p className="ml-7 mt-1 text-muted-foreground">Change 'your-secure-api-key-here' to a strong password</p>
                  </li>
                  <li>
                    <strong>Check .htaccess</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Edit the .htaccess file in the api folder</p>
                    <p className="ml-7 mt-1 text-muted-foreground">Ensure the RewriteBase is set to /api/</p>
                  </li>
                  <li>
                    <strong>Test Your Installation</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Visit yourdomain.com to see the frontend</p>
                    <p className="ml-7 mt-1 text-muted-foreground">Visit yourdomain.com/api/test.php to test the API</p>
                  </li>
                </ol>
              </div>
            </TabsContent>
            
            <TabsContent value="ftp" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">FTP Deployment Steps</h3>
                <ol className="list-decimal list-inside space-y-4 text-sm">
                  <li>
                    <strong>Download an FTP Client</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">We recommend FileZilla (free): <a href="https://filezilla-project.org/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Download FileZilla</a></p>
                  </li>
                  <li>
                    <strong>Connect to Your Server</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Enter your FTP host, username, and password (provided by your hosting company)</p>
                  </li>
                  <li>
                    <strong>Show Hidden Files</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">In FileZilla, go to Server {'>'} Force showing hidden files</p>
                  </li>
                  <li>
                    <strong>Navigate to Root Directory</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Usually called public_html, www, or htdocs</p>
                  </li>
                  <li>
                    <strong>Upload Frontend Files</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Extract the Frontend zip locally, then drag all files to the root directory</p>
                  </li>
                  <li>
                    <strong>Create api Directory</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Right-click in the remote panel and select "Create directory", name it "api"</p>
                  </li>
                  <li>
                    <strong>Upload API Files</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Extract the API zip locally, select all files and drag them to the api directory</p>
                  </li>
                  <li>
                    <strong>Edit config.php</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Right-click on config.php in the api folder and select "View/Edit"</p>
                    <p className="ml-7 mt-1 text-muted-foreground">Change 'your-secure-api-key-here' to a strong password, save and upload</p>
                  </li>
                  <li>
                    <strong>Check .htaccess</strong>
                    <p className="ml-7 mt-1 text-muted-foreground">Edit the .htaccess file in the api folder</p>
                    <p className="ml-7 mt-1 text-muted-foreground">Ensure the RewriteBase is set to /api/</p>
                  </li>
                </ol>
              </div>
            </TabsContent>
            
            <TabsContent value="cli" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Command Line Deployment (Advanced)</h3>
                <p className="text-sm text-muted-foreground mb-4">This method is for users comfortable with command line tools.</p>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Building the Frontend Locally</h4>
                  <pre className="bg-secondary p-2 rounded-md text-xs mt-1 overflow-x-auto">
{`# Clone the repository
git clone https://github.com/your-username/your-repo.git

# Navigate to the project directory
cd your-repo

# Install dependencies
npm install

# Build the project
npm run build

# The build files will be in the 'dist' directory`}
                  </pre>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Deploying to Server with SCP</h4>
                  <pre className="bg-secondary p-2 rounded-md text-xs mt-1 overflow-x-auto">
{`# Upload frontend files to server root
scp -r dist/* user@yourserver.com:/var/www/html/

# Create api directory
ssh user@yourserver.com "mkdir -p /var/www/html/api"

# Upload API files
scp -r api/* user@yourserver.com:/var/www/html/api/

# Set proper permissions
ssh user@yourserver.com "chmod -R 755 /var/www/html/ && chmod -R 644 /var/www/html/api/*.php"`}
                  </pre>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">Configuring the API</h4>
                  <pre className="bg-secondary p-2 rounded-md text-xs mt-1 overflow-x-auto">
{`# Edit config.php to set API key and allowed origins
ssh user@yourserver.com "nano /var/www/html/api/config.php"

# Check .htaccess configuration
ssh user@yourserver.com "nano /var/www/html/api/.htaccess"

# Test the API
curl https://yourdomain.com/api/test.php`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Separator className="my-6" />
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">After Deployment: First Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Visit your domain (e.g., <code>https://yourdomain.com</code>) to access the application</li>
              <li>Log in using the default credentials (username: <code>admin</code>, password: <code>admin</code>)</li>
              <li><strong>Immediately change the password</strong> in the Settings tab</li>
              <li>Configure your API key to match the one you set in <code>config.php</code></li>
              <li>Start adding your data sources and configuring your schema</li>
            </ol>
          </div>
          
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Need More Help?</AlertTitle>
            <AlertDescription className="text-sm">
              If you encounter any issues during deployment, please check the Troubleshooting section in the Deployment Guide tab of the application.
              For direct support, contact us at support@csvscrub.com.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeploymentInstructions;
