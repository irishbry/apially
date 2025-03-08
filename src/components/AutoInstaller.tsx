import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Server, FileCode, CheckSquare, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createInstallerPHP, createReadme } from '@/utils/installerTemplates';

const AutoInstaller: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      
      const apiDir = zip.folder("api");
      const dataDir = apiDir.folder("data");
      const assetsDir = zip.folder("assets");
      
      zip.file("install.php", createInstallerPHP());
      
      zip.file("README.md", createReadme());
      
      zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Data Consolidation Tool</title>
    <link rel="stylesheet" href="./assets/style.css">
    <script src="./assets/app.js" defer></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`);

      assetsDir.file("style.css", `/* Base styles */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  color: #333;
  background-color: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1, h2, h3 {
  margin-top: 0;
  color: #2c3e50;
}

/* Form elements */
input, select, button {
  font-family: inherit;
  font-size: 100%;
  padding: 8px 12px;
  margin: 8px 0;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background-color: #4361ee;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3a56d4;
}

/* Layout */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  padding: 20px;
}

.status-success {
  color: #198754;
  font-weight: bold;
}

.status-error {
  color: #dc3545;
  font-weight: bold;
}

/* Sources list */
#sources-list {
  list-style-type: none;
  padding: 0;
}

#sources-list li {
  padding: 10px;
  margin: 5px 0;
  background-color: #f1f3f5;
  border-radius: 4px;
}

/* Header */
.header {
  background-color: #4361ee;
  color: white;
  padding: 1rem;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: white;
}

/* Footer */
.footer {
  text-align: center;
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  color: #6c757d;
}
`);

      assetsDir.file("app.js", `// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  // Create app structure
  root.innerHTML = \`
    <div class="header">
      <div class="container">
        <h1>Data Consolidation Tool</h1>
      </div>
    </div>
    <div class="container">
      <div class="card">
        <h2>API Status</h2>
        <p>Connection: <span id="api-status">Checking...</span></p>
      </div>
      
      <div class="card">
        <h2>API Configuration</h2>
        <div class="form-group">
          <label for="api-key">API Key</label>
          <input type="text" id="api-key" placeholder="Enter your API key" />
          <button id="save-key">Save API Key</button>
        </div>
      </div>
      
      <div class="card">
        <h2>Add Data Source</h2>
        <form id="source-form">
          <div class="form-group">
            <label for="source-name">Source Name</label>
            <input type="text" id="source-name" placeholder="e.g., Sales Data" required />
          </div>
          <div class="form-group">
            <label for="source-url">Source URL</label>
            <input type="text" id="source-url" placeholder="https://example.com/data.csv" required />
          </div>
          <div class="form-group">
            <label for="source-type">Source Type</label>
            <select id="source-type">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="api">API Endpoint</option>
            </select>
          </div>
          <button type="submit">Add Source</button>
        </form>
      </div>
      
      <div class="card">
        <h2>Data Sources</h2>
        <ul id="sources-list"></ul>
      </div>
    </div>
    <div class="footer">
      <p>Data Consolidation Tool - v1.0</p>
    </div>
  \`;
  
  // Check API status
  checkApiStatus();
  
  // Add event listeners
  document.getElementById('save-key').addEventListener('click', saveApiKey);
  document.getElementById('source-form').addEventListener('submit', addDataSource);
  
  // Load saved sources
  loadSavedSources();
});

// Check API connection
function checkApiStatus() {
  const statusElement = document.getElementById('api-status');
  
  fetch('./api/status')
    .then(response => response.json())
    .then(data => {
      if (data && data.status === 'ok') {
        statusElement.textContent = 'Connected';
        statusElement.className = 'status-success';
      } else {
        statusElement.textContent = 'Error';
        statusElement.className = 'status-error';
      }
    })
    .catch(error => {
      console.error('API connection error:', error);
      statusElement.textContent = 'Connection Error';
      statusElement.className = 'status-error';
    });
}

// Save API key to localStorage
function saveApiKey() {
  const apiKey = document.getElementById('api-key').value.trim();
  
  if (apiKey) {
    localStorage.setItem('apiKey', apiKey);
    alert('API Key saved successfully');
  } else {
    alert('Please enter a valid API key');
  }
}

// Add a data source
function addDataSource(event) {
  event.preventDefault();
  
  const name = document.getElementById('source-name').value.trim();
  const url = document.getElementById('source-url').value.trim();
  const type = document.getElementById('source-type').value;
  
  if (!name || !url) {
    alert('Please fill in all required fields');
    return;
  }
  
  // Get existing sources or initialize empty array
  const sources = JSON.parse(localStorage.getItem('sources') || '[]');
  
  // Add new source
  sources.push({
    id: Date.now(), // Simple unique ID
    name,
    url,
    type,
    dateAdded: new Date().toISOString()
  });
  
  // Save updated sources
  localStorage.setItem('sources', JSON.stringify(sources));
  
  // Update UI
  addSourceToList(name, url, type);
  
  // Clear form
  document.getElementById('source-form').reset();
}

// Add source to the UI list
function addSourceToList(name, url, type) {
  const sourcesList = document.getElementById('sources-list');
  const li = document.createElement('li');
  li.innerHTML = \`
    <strong>${name}</strong> (${type})
    <br>
    ${url}
  \`;
  sourcesList.appendChild(li);
}

// Load saved sources from localStorage
function loadSavedSources() {
  const sources = JSON.parse(localStorage.getItem('sources') || '[]');
  
  sources.forEach(source => {
    addSourceToList(source.name, source.url, source.type);
  });
}
`);

      apiDir.file("index.php", `<?php
// Main API entry point
header("Content-Type: application/json");

// Check for actual path
$requestPath = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$basePath = dirname($_SERVER["SCRIPT_NAME"]);
$endpoint = str_replace($basePath, "", $requestPath);
$endpoint = trim($endpoint, "/");

// Include configuration
require_once "config.php";

// Simple routing
switch ($endpoint) {
    case "status":
        echo json_encode([
            "status" => "ok",
            "version" => "1.0.0",
            "timestamp" => date("c")
        ]);
        break;
        
    case "test":
        include "test.php";
        break;
        
    case "sources":
        // GET: List all sources, POST: Add a new source
        handleSources();
        break;
        
    case "":
        echo json_encode([
            "name" => "Data Consolidation API",
            "version" => "1.0.0",
            "endpoints" => ["/status", "/test", "/sources"]
        ]);
        break;
        
    default:
        header("HTTP/1.1 404 Not Found");
        echo json_encode(["error" => "Endpoint not found"]);
}

// Handle sources endpoint
function handleSources() {
    global $config;
    
    // Check request method
    $method = $_SERVER["REQUEST_METHOD"];
    
    if ($method === "GET") {
        // List all sources
        $sourcesFile = $config["storage_path"] . "/sources.json";
        
        if (file_exists($sourcesFile)) {
            $sources = json_decode(file_get_contents($sourcesFile), true) ?: [];
            echo json_encode(["sources" => $sources]);
        } else {
            echo json_encode(["sources" => []]);
        }
    } 
    else if ($method === "POST") {
        // Add a new source
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!$data || !isset($data["name"]) || !isset($data["url"])) {
            header("HTTP/1.1 400 Bad Request");
            echo json_encode(["error" => "Invalid request data"]);
            return;
        }
        
        // Get existing sources
        $sourcesFile = $config["storage_path"] . "/sources.json";
        $sources = [];
        
        if (file_exists($sourcesFile)) {
            $sources = json_decode(file_get_contents($sourcesFile), true) ?: [];
        }
        
        // Add the new source
        $sources[] = [
            "id" => uniqid(),
            "name" => $data["name"],
            "url" => $data["url"],
            "type" => $data["type"] ?? "unknown",
            "dateAdded" => date("c")
        ];
        
        // Save updated sources
        file_put_contents($sourcesFile, json_encode($sources, JSON_PRETTY_PRINT));
        
        echo json_encode(["success" => true]);
    }
    else {
        header("HTTP/1.1 405 Method Not Allowed");
        echo json_encode(["error" => "Method not allowed"]);
    }
}
`);

      apiDir.file(".htaccess", `# Enable rewrite engine
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
</IfModule>`);

      apiDir.file("config.php", `<?php
// Configuration file for Data Consolidation API

$config = [
    // Allowed origins for CORS
    "allowed_origins" => ["*"], // Replace with your frontend domain in production
    
    // Path to data storage directory
    "storage_path" => __DIR__ . "/data",
    
    // API key (change this in production)
    "api_key" => "your-secure-api-key-here"
];

// Create storage directory if it doesn't exist
if (!file_exists($config["storage_path"])) {
    mkdir($config["storage_path"], 0755, true);
}
`);

      apiDir.file("test.php", `<?php
// Simple test script to verify API installation
header("Content-Type: text/html; charset=utf-8");
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
        <p>Server Software: <?php echo $_SERVER["SERVER_SOFTWARE"] ?? "Unknown"; ?></p>
        <p>Document Root: <?php echo $_SERVER["DOCUMENT_ROOT"] ?? "Unknown"; ?></p>
    </div>
    
    <div class="test">
        <h3>API Connectivity</h3>
        <?php
        // Test API connection to status endpoint
        $statusUrl = "./status";
        $ch = curl_init($statusUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, false);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $success = false;
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            
            if ($data && isset($data["status"]) && $data["status"] === "ok") {
                echo "<p><span class=\"success\">Success!</span> API endpoints are working correctly.</p>";
                $success = true;
            } else {
                echo "<p><span class=\"error\">Fail</span> API returned HTTP 200 but unexpected response format.</p>";
            }
        } else {
            echo "<p><span class=\"error\">Fail</span></p>";
            echo "<p>Result: API endpoints may not be working correctly. HTTP code: " . $httpCode . "</p>";
            echo "<p>Expected: HTTP 200 with status: ok</p>";
            echo "<p>How to fix: Check your Apache configuration and .htaccess file. Ensure mod_rewrite is working correctly and the API routes are properly set up.</p>";
        }
        curl_close($ch);
        ?>
    </div>
    
    <div class="test">
        <h3>File Permissions</h3>
        <?php
        // Check if data directory exists
        $dataDir = "../data";
        if (file_exists($dataDir)) {
            if (is_writable($dataDir)) {
                echo "<p><span class=\"success\">Success!</span> Data directory exists and is writable.</p>";
            } else {
                echo "<p><span class=\"warning\">Warning</span> Data directory exists but is not writable.</p>";
                echo "<p>How to fix: Run <code>chmod 755 data</code> to set correct permissions.</p>";
            }
        } else {
            echo "<p><span class=\"warning\">Warning</span> Data directory does not exist.</p>";
            echo "<p>How to fix: Create the data directory with <code>mkdir data</code> and set permissions with <code>chmod 755 data</code>.</p>";
        }
        
        // Check if .htaccess file exists
        if (file_exists("../.htaccess")) {
            echo "<p><span class=\"success\">Success!</span> .htaccess file exists.</p>";
        } else {
            echo "<p><span class=\"error\">Error</span> .htaccess file does not exist.</p>";
            echo "<p>How to fix: Make sure you have uploaded the .htaccess file to your server.</p>";
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
            <li>Use the frontend interface at <a href="../index.html">../index.html</a></li>
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
</html>`);

      dataDir.file(".gitkeep", "");
      
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      FileSaver.saveAs(zipContent, "all-in-one-installer.zip");
      
      toast({
        title: "Installation package created!",
        description: "Upload the entire ZIP package to your server and run install.php to complete the installation.",
      });
    } catch (error) {
      console.error("Error creating installation package:", error);
      toast({
        title: "Package creation failed",
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
          All-in-One Installation Package
        </CardTitle>
        <CardDescription>
          Creates a complete, self-installing package with both frontend and backend components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <FileCode className="h-4 w-4" />
            <AlertTitle>Automatic Installation</AlertTitle>
            <AlertDescription>
              <p className="mb-2">This tool creates a single installation package that will automatically set up both the frontend interface and the backend API on your server.</p>
              <p>Just download, upload to your server, and run the installer!</p>
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-primary/5 rounded-md">
            <h3 className="text-sm font-medium mb-2">How It Works</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Download</strong> the installation package below</li>
              <li><strong>Upload</strong> all files in the ZIP to your web server (via FTP or cPanel)</li>
              <li><strong>Maintain the directory structure</strong> exactly as it is in the ZIP file</li>
              <li><strong>Run</strong> install.php by visiting it in your browser (e.g., yourdomain.com/install.php)</li>
              <li>Follow the on-screen instructions to complete the installation</li>
            </ol>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="gap-2 px-8 py-6 text-lg" 
              onClick={handleDownload} 
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Creating Installation Package...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download All-in-One Installer
                </>
              )}
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-100 rounded-md">
              <h3 className="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
                <CheckSquare className="h-4 w-4" />
                What's Included
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                <li><strong>install.php</strong> - Main installer script</li>
                <li><strong>index.html</strong> - Frontend interface</li>
                <li><strong>assets/</strong> - CSS and JavaScript files</li>
                <li><strong>api/</strong> - Backend PHP API</li>
                <li><strong>api/data/</strong> - Data storage directory</li>
                <li><strong>README.md</strong> - Installation instructions</li>
              </ul>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
              <h3 className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Server Requirements
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                <li>PHP 7.0 or higher</li>
                <li>Apache with mod_rewrite enabled</li>
                <li>PHP extensions: curl, json</li>
                <li>Write permissions (chmod 755) for the installation directory</li>
                <li>AllowOverride All in Apache configuration</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-slate-50 p-4 rounded-b-lg">
        <div className="text-sm text-muted-foreground">
          <span>Need more detailed instructions?</span>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.location.href = "/deploy"}>
          View Detailed Guide
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AutoInstaller;
