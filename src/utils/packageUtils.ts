
import JSZip from 'jszip';
import FileSaver from 'file-saver';

/**
 * Creates and downloads a ZIP file containing the frontend application files
 */
export const packageFrontendFiles = async (): Promise<void> => {
  try {
    const zip = new JSZip();
    
    // Add HTML file with proper React setup
    zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Data Consolidation Tool</title>
    <link rel="stylesheet" href="./assets/style.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="./assets/react.production.min.js"></script>
    <script src="./assets/react-dom.production.min.js"></script>
    <script src="./assets/app.js" defer></script>
  </body>
</html>`);

    // Create assets folder
    const assetsFolder = zip.folder("assets");
    
    // Add React libraries
    assetsFolder.file("react.production.min.js", 
      await fetchLibrary("https://unpkg.com/react@18.2.0/umd/react.production.min.js")
    );
    
    assetsFolder.file("react-dom.production.min.js", 
      await fetchLibrary("https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js")
    );
    
    // Add CSS that matches our application styling
    assetsFolder.file("style.css", `
/* Base styles matching the application */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

:root {
  --background: rgb(241, 245, 249);
  --foreground: rgb(15, 23, 42);
  --primary: rgb(59, 130, 246);
  --primary-foreground: rgb(255, 255, 255);
  --secondary: rgb(226, 232, 240);
  --secondary-foreground: rgb(15, 23, 42);
  --muted: rgb(241, 245, 249);
  --muted-foreground: rgb(100, 116, 139);
  --border: rgb(226, 232, 240);
  --input: rgb(226, 232, 240);
  --radius: 0.75rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: var(--foreground);
  background: linear-gradient(to bottom, var(--background), rgb(236, 241, 247));
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem;
}

/* Card styles */
.card {
  background: white;
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--foreground);
}

/* Form elements */
input, select, textarea {
  width: 100%;
  padding: 0.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: white;
  color: var(--foreground);
  font-family: inherit;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

/* Button styles */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1;
  padding: 0.75rem 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary {
  background: var(--primary);
  color: var(--primary-foreground);
}

.button-primary:hover {
  background: rgb(37, 99, 235);
}

.button-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--foreground);
}

.button-outline:hover {
  background: var(--muted);
}

/* Tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
}

.tab {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-weight: 500;
}

.tab.active {
  border-bottom-color: var(--primary);
  color: var(--primary);
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

th {
  font-weight: 500;
  color: var(--muted-foreground);
}

/* Helper classes */
.space-y-4 > * + * {
  margin-top: 1rem;
}

.grid {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Status indicators */
.status {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-success {
  background: rgba(34, 197, 94, 0.1);
  color: rgb(22, 163, 74);
}

.status-warning {
  background: rgba(234, 179, 8, 0.1);
  color: rgb(202, 138, 4);
}

.status-error {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(220, 38, 38);
}

/* Animations */
.animate-slide-up {
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Glass effect */
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
`);
    
    // Add the JavaScript with a React component structure matching our app
    assetsFolder.file("app.js", `// Utility function for localStorage
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error("Error getting from storage:", e);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Error setting to storage:", e);
      return false;
    }
  }
};

// API Service simulating our actual service
const ApiService = {
  isAuthenticated: false,
  apiKey: storage.get('apiKey', ''),
  
  login: function(username, password) {
    // Simple mock login
    if (username && password) {
      this.isAuthenticated = true;
      storage.set('isAuthenticated', true);
      return true;
    }
    return false;
  },
  
  logout: function() {
    this.isAuthenticated = false;
    storage.set('isAuthenticated', false);
  },
  
  isUserAuthenticated: function() {
    return this.isAuthenticated || storage.get('isAuthenticated', false);
  },
  
  setApiKey: function(key) {
    this.apiKey = key;
    storage.set('apiKey', key);
  },
  
  getApiUsage: function() {
    // Mock data
    return {
      totalRequests: 1250,
      successRate: 98.5,
      averageResponseTime: 0.34,
      lastUpdated: new Date().toISOString()
    };
  },
  
  getSources: function() {
    return storage.get('sources', []);
  },
  
  addSource: function(source) {
    const sources = this.getSources();
    sources.push({
      id: Date.now().toString(),
      ...source,
      dateAdded: new Date().toISOString()
    });
    storage.set('sources', sources);
    return true;
  },
  
  removeSource: function(id) {
    const sources = this.getSources();
    const newSources = sources.filter(s => s.id !== id);
    storage.set('sources', newSources);
    return true;
  }
};

// React Components
const e = React.createElement;

// LoginForm Component
const LoginForm = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    const success = ApiService.login(username, password);
    if (success) {
      window.location.reload();
    } else {
      setError('Invalid credentials');
    }
  };

  return e('div', { className: 'card glass animate-slide-up', style: { maxWidth: '400px', width: '100%' } },
    e('h1', { className: 'text-center mb-6' }, 'Login'),
    e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
      e('div', { className: 'form-group' },
        e('label', { htmlFor: 'username' }, 'Username'),
        e('input', { 
          id: 'username', 
          type: 'text', 
          value: username, 
          onChange: (e) => setUsername(e.target.value),
          placeholder: 'Enter your username'
        })
      ),
      e('div', { className: 'form-group' },
        e('label', { htmlFor: 'password' }, 'Password'),
        e('input', { 
          id: 'password', 
          type: 'password', 
          value: password, 
          onChange: (e) => setPassword(e.target.value),
          placeholder: 'Enter your password'
        })
      ),
      error && e('div', { className: 'status status-error' }, error),
      e('button', { 
        type: 'submit', 
        className: 'button button-primary',
        style: { width: '100%' }
      }, 'Login')
    ),
    e('p', { style: { fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '1rem', textAlign: 'center' } },
      'Demo credentials: any username and password will work'
    )
  );
};

// Header Component
const Header = () => {
  return e('div', { className: 'header' },
    e('h1', null, 'Data Consolidation Tool'),
    ApiService.isUserAuthenticated() && 
      e('button', { 
        className: 'button button-outline',
        onClick: () => {
          ApiService.logout();
          window.location.reload();
        }
      }, 'Logout')
  );
};

// ApiKeyForm Component
const ApiKeyForm = () => {
  const [apiKey, setApiKey] = React.useState(ApiService.apiKey || '');
  const [saved, setSaved] = React.useState(false);

  const saveApiKey = () => {
    ApiService.setApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return e('div', { className: 'card' },
    e('h3', null, 'API Configuration'),
    e('div', { className: 'form-group' },
      e('label', { htmlFor: 'api-key' }, 'API Key'),
      e('input', {
        id: 'api-key',
        type: 'text',
        value: apiKey,
        onChange: (e) => setApiKey(e.target.value),
        placeholder: 'Enter your API key'
      })
    ),
    e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      e('button', {
        className: 'button button-primary',
        onClick: saveApiKey
      }, 'Save API Key'),
      saved && e('span', { className: 'status status-success' }, 'Saved!')
    )
  );
};

// SourcesManager Component
const SourcesManager = () => {
  const [sources, setSources] = React.useState(ApiService.getSources());
  const [newSource, setNewSource] = React.useState({ name: '', url: '', type: 'csv' });
  const [error, setError] = React.useState('');

  const addSource = (e) => {
    e.preventDefault();
    if (!newSource.name || !newSource.url) {
      setError('Please fill in all fields');
      return;
    }
    
    ApiService.addSource(newSource);
    setSources(ApiService.getSources());
    setNewSource({ name: '', url: '', type: 'csv' });
    setError('');
  };

  const removeSource = (id) => {
    ApiService.removeSource(id);
    setSources(ApiService.getSources());
  };

  return e('div', { className: 'card' },
    e('h3', null, 'Data Sources'),
    e('form', { onSubmit: addSource, className: 'space-y-4' },
      e('div', { className: 'grid grid-cols-2' },
        e('div', { className: 'form-group' },
          e('label', { htmlFor: 'source-name' }, 'Source Name'),
          e('input', {
            id: 'source-name',
            type: 'text',
            value: newSource.name,
            onChange: (e) => setNewSource({...newSource, name: e.target.value}),
            placeholder: 'e.g., Sales Data'
          })
        ),
        e('div', { className: 'form-group' },
          e('label', { htmlFor: 'source-type' }, 'Source Type'),
          e('select', {
            id: 'source-type',
            value: newSource.type,
            onChange: (e) => setNewSource({...newSource, type: e.target.value})
          },
            e('option', { value: 'csv' }, 'CSV'),
            e('option', { value: 'json' }, 'JSON'),
            e('option', { value: 'api' }, 'API Endpoint')
          )
        )
      ),
      e('div', { className: 'form-group' },
        e('label', { htmlFor: 'source-url' }, 'Source URL'),
        e('input', {
          id: 'source-url',
          type: 'text',
          value: newSource.url,
          onChange: (e) => setNewSource({...newSource, url: e.target.value}),
          placeholder: 'https://example.com/data.csv'
        })
      ),
      error && e('div', { className: 'status status-error' }, error),
      e('button', { type: 'submit', className: 'button button-primary' }, 'Add Source')
    ),
    e('div', { style: { marginTop: '1.5rem' } },
      sources.length === 0
        ? e('p', null, 'No data sources added yet.')
        : e('table', null,
            e('thead', null,
              e('tr', null,
                e('th', null, 'Name'),
                e('th', null, 'Type'),
                e('th', null, 'URL'),
                e('th', null, 'Actions')
              )
            ),
            e('tbody', null,
              sources.map(source => 
                e('tr', { key: source.id },
                  e('td', null, source.name),
                  e('td', null, source.type.toUpperCase()),
                  e('td', null, source.url),
                  e('td', null,
                    e('button', {
                      className: 'button button-outline',
                      style: { padding: '0.25rem 0.5rem' },
                      onClick: () => removeSource(source.id)
                    }, 'Remove')
                  )
                )
              )
            )
          )
    )
  );
};

// ApiUsageStats Component
const ApiUsageStats = () => {
  const usage = ApiService.getApiUsage();
  
  return e('div', { className: 'card' },
    e('h3', null, 'API Usage Statistics'),
    e('div', { className: 'grid grid-cols-2', style: { marginTop: '1rem' } },
      e('div', null,
        e('p', { style: { fontSize: '0.875rem', color: 'var(--muted-foreground)' } }, 'Total Requests'),
        e('p', { style: { fontSize: '1.5rem', fontWeight: '600' } }, usage.totalRequests)
      ),
      e('div', null,
        e('p', { style: { fontSize: '0.875rem', color: 'var(--muted-foreground)' } }, 'Success Rate'),
        e('p', { style: { fontSize: '1.5rem', fontWeight: '600' } }, \`\${usage.successRate}%\`)
      ),
      e('div', null,
        e('p', { style: { fontSize: '0.875rem', color: 'var(--muted-foreground)' } }, 'Avg. Response Time'),
        e('p', { style: { fontSize: '1.5rem', fontWeight: '600' } }, \`\${usage.averageResponseTime}s\`)
      ),
      e('div', null,
        e('p', { style: { fontSize: '0.875rem', color: 'var(--muted-foreground)' } }, 'Last Updated'),
        e('p', { style: { fontSize: '0.875rem' } }, new Date(usage.lastUpdated).toLocaleString())
      )
    )
  );
};

// Main App Component
const App = () => {
  const [activeTab, setActiveTab] = React.useState('sources');
  const isAuthenticated = ApiService.isUserAuthenticated();

  if (!isAuthenticated) {
    return e('div', { 
      className: 'min-h-screen', 
      style: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1rem' 
      } 
    }, e(LoginForm));
  }

  return e('div', { className: 'min-h-screen' },
    e('div', { className: 'container' },
      e(Header),
      e('div', { className: 'animate-slide-up' },
        e(ApiUsageStats),
        e('div', { className: 'tabs' },
          e('div', { 
            className: \`tab \${activeTab === 'sources' ? 'active' : ''}\`, 
            onClick: () => setActiveTab('sources') 
          }, 'Data Sources'),
          e('div', { 
            className: \`tab \${activeTab === 'config' ? 'active' : ''}\`, 
            onClick: () => setActiveTab('config') 
          }, 'Configuration')
        ),
        activeTab === 'sources' && e(SourcesManager),
        activeTab === 'config' && e(ApiKeyForm)
      )
    )
  );
};

// Helper function to fetch library files
async function fetchLibrary(url) {
  const response = await fetch(url);
  return await response.text();
}

// Render the app
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  ReactDOM.render(e(App), root);
});`);

    // Add README
    zip.file("README.md", `# Data Consolidation Tool Frontend

This package contains a standalone frontend for the Data Consolidation Tool that matches the UI you see in the preview.

## Features

- Clean, modern UI using custom CSS
- Responsive design that works on all devices
- Data source management
- API key configuration
- Login/authentication system
- Usage statistics display

## Getting Started

1. Extract all files to your web server
2. Open index.html in your browser
3. Log in with any username and password (demo mode)
4. Start adding data sources and configuring your API

## Integration with Backend

This frontend can work with the API backend. To connect them:

1. Install the API backend on your server
2. Update the API endpoints in app.js to point to your API installation
3. Configure CORS on your API to allow requests from your frontend origin

## Customization

You can modify the CSS in style.css to match your branding and preferences.
`);

    // Generate and download the ZIP file
    const zipContent = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(zipContent, "frontend-files.zip");
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error creating frontend package:", error);
    return Promise.reject(error);
  }
};

/**
 * Creates and downloads a ZIP file containing the API files
 */
export const packageApiFiles = async (): Promise<void> => {
  try {
    const zip = new JSZip();
    
    // Add PHP files
    zip.file("index.php", `<?php
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
}`);

    zip.file("config.php", `<?php
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
}`);

    zip.file("test.php", `<?php
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
        $dataDir = "./data";
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
        if (file_exists("./.htaccess")) {
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

    // Add .htaccess file
    zip.file(".htaccess", `# Enable rewrite engine
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

    // Add phpinfo file for testing
    zip.file("phpinfo.php", `<?php
phpinfo();
?>`);

    // Add README
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

    // Create data directory
    const dataDir = zip.folder("data");
    dataDir.file(".gitkeep", "");

    // Generate and download the ZIP file
    const zipContent = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(zipContent, "api-files.zip");
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error creating API package:", error);
    return Promise.reject(error);
  }
};
