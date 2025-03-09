
import JSZip from 'jszip';
import FileSaver from 'file-saver';

/**
 * Helper function to fetch library files
 */
const fetchLibrary = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch library from ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching library:", error);
    throw error;
  }
};

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
    <title>CSV Consolidator Portal</title>
    <link rel="stylesheet" href="./assets/style.css">
    <link rel="icon" type="image/png" href="./assets/favicon.png">
  </head>
  <body>
    <div id="root"></div>
    <script src="./assets/react.production.min.js"></script>
    <script src="./assets/react-dom.production.min.js"></script>
    <script src="./assets/app.js"></script>
  </body>
</html>`);

    // Create assets folder
    const assetsFolder = zip.folder("assets");
    
    // Add favicon
    assetsFolder.file("favicon.png", new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 16, 
      0, 0, 0, 16, 8, 6, 0, 0, 0, 31, 243, 255, 97, 0, 0, 0, 1, 115, 82, 71, 66, 
      0, 174, 206, 28, 233, 0, 0, 0, 4, 103, 65, 77, 65, 0, 0, 177, 143, 11, 252, 
      97, 5, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0, 14, 195, 0, 0, 14, 195, 1, 199, 
      111, 168, 100, 0, 0, 0, 24, 116, 69, 88, 116, 83, 111, 102, 116, 119, 97, 
      114, 101, 0, 112, 97, 105, 110, 116, 46, 110, 101, 116, 32, 52, 46, 48, 46, 
      54, 251, 120, 81, 147, 0, 0, 1, 36, 73, 68, 65, 84, 56, 79, 141, 145, 177, 
      74, 195, 80, 20, 134, 115, 147, 105, 12, 56, 184, 56, 20, 193, 69, 112, 113, 
      112, 114, 115, 114, 114, 115, 118, 113, 114, 81, 8, 84, 136, 150, 34, 186, 
      136, 144, 210, 53, 88, 233, 208, 66, 193, 193, 69, 112, 232, 226, 224, 83, 
      248, 8, 62, 130, 15, 226, 79, 207, 77, 110, 219, 104, 10, 30, 248, 232, 157, 
      255, 156, 123, 114, 238, 137, 71, 158, 231, 142, 214, 218, 53, 254, 6, 3, 
      175, 191, 115, 99, 252, 34, 73, 146, 57, 0, 211, 159, 128, 136, 102, 62, 84, 
      190, 18, 255, 202, 128, 143, 32, 8, 26, 144, 242, 4, 54, 142, 227, 169, 252, 
      178, 219, 229, 247, 89, 43, 191, 8, 60, 198, 198, 203, 246, 100, 76, 57, 196, 
      95, 102, 19, 218, 136, 126, 41, 54, 153, 117, 164, 146, 166, 233, 196, 22, 
      123, 163, 253, 110, 138, 189, 124, 195, 3, 24, 5, 129, 240, 83, 241, 111, 138, 
      47, 48, 255, 166, 200, 35, 11, 33, 100, 182, 235, 201, 238, 159, 155, 157, 78, 
      98, 6, 221, 206, 89, 247, 170, 179, 150, 51, 229, 139, 138, 251, 243, 227, 
      163, 241, 152, 252, 175, 107, 207, 134, 10, 249, 14, 124, 9, 203, 150, 143, 
      242, 179, 10, 228, 203, 21, 136, 245, 0, 252, 118, 81, 131, 118, 81, 25, 136, 
      54, 196, 102, 172, 178, 48, 12, 195, 13, 119, 151, 165, 161, 35, 87, 223, 199, 
      227, 93, 85, 0, 183, 139, 109, 47, 26, 235, 12, 127, 15, 76, 251, 61, 249, 52, 
      106, 21, 154, 160, 69, 178, 234, 3, 245, 90, 152, 111, 251, 117, 249, 106, 215, 
      249, 218, 248, 0, 217, 92, 228, 44, 127, 167, 193, 170, 0, 0, 0, 0, 73, 69, 78, 
      68, 174, 66, 96, 130
    ]));
    
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
  --background: 210 20% 98%;
  --foreground: 212 45% 15%;
  --card: 0 0% 100%;
  --card-foreground: 214 45% 18%;
  --popover: 0 0% 100%;
  --popover-foreground: 214 45% 18%;
  --primary: 215 70% 55%;
  --primary-foreground: 210 40% 98%;
  --secondary: 215 25% 92%;
  --secondary-foreground: 214 45% 18%;
  --muted: 214 15% 91%;
  --muted-foreground: 214 20% 45%;
  --accent: 214 15% 91%;
  --accent-foreground: 214 45% 18%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 20% 90%;
  --input: 214 20% 90%;
  --ring: 215 70% 55%;
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
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  min-height: 100vh;
}

.min-h-screen {
  min-height: 100vh;
}

.bg-gradient-to-b {
  background: linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background) / 0.95));
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.max-w-7xl {
  max-width: 80rem;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.overflow-hidden {
  overflow: hidden;
}

.pointer-events-none {
  pointer-events: none;
}

.py-10 {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}

.space-y-8 > * + * {
  margin-top: 2rem;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 0.5rem;
}

.animate-slide-up {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Card styles */
.card {
  background: white;
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Buttons */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition-property: color, background-color, border-color;
  transition-duration: 0.15s;
  cursor: pointer;
}

.button-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.button-primary:hover {
  background-color: hsl(var(--primary) / 0.9);
}

.button-outline {
  background-color: transparent;
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
}

.button-outline:hover {
  background-color: hsl(var(--secondary));
}

.hover-lift {
  transition: transform 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
}

/* Form elements */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

input, select, textarea {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--border));
  background-color: hsl(var(--background));
}

/* Tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid hsl(var(--border));
  margin-bottom: 1rem;
}

.tab {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: hsl(var(--primary));
  border-bottom-color: hsl(var(--primary));
}

/* Sections */
section {
  margin-bottom: 2rem;
}

h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Grid */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 768px) {
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid hsl(var(--border));
}

th {
  font-weight: 500;
  color: hsl(var(--muted-foreground));
}

/* Decorative elements */
.bg-primary\\/5 {
  background-color: hsl(var(--primary) / 0.05);
}

.rounded-full {
  border-radius: 9999px;
}

.blur-3xl {
  filter: blur(4rem);
}

.-top-40 {
  top: -10rem;
}

.-right-40 {
  right: -10rem;
}

.top-\\[20\\%\\] {
  top: 20%;
}

.-left-40 {
  left: -10rem;
}

.-bottom-40 {
  bottom: -10rem;
}

.right-\\[20\\%\\] {
  right: 20%;
}

.w-96 {
  width: 24rem;
}

.h-96 {
  height: 24rem;
}

/* Login form */
.p-4 {
  padding: 1rem;
}

.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.text-center {
  text-align: center;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-muted-foreground {
  color: hsl(var(--muted-foreground));
}

.mt-1 {
  margin-top: 0.25rem;
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
  background-color: rgba(34, 197, 94, 0.1);
  color: rgb(22, 163, 74);
}

.status-error {
  background-color: rgba(239, 68, 68, 0.1);
  color: rgb(220, 38, 38);
}

/* Separator */
.separator {
  height: 1px;
  background-color: hsl(var(--border));
  margin: 1.5rem 0;
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

// API Service
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
  },
  
  getSchema: function() {
    return storage.get('schema', {
      fields: [],
      mappings: {}
    });
  },
  
  saveSchema: function(schema) {
    storage.set('schema', schema);
    return true;
  }
};

// Icon components
const Icons = {
  LogOut: ({ className = "h-4 w-4" }) => {
    return React.createElement("svg", { 
      xmlns: "http://www.w3.org/2000/svg", 
      className,
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "2"
    }, 
      React.createElement("path", { 
        strokeLinecap: "round", 
        strokeLinejoin: "round", 
        d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
      })
    );
  },
  Server: ({ className = "h-4 w-4" }) => {
    return React.createElement("svg", { 
      xmlns: "http://www.w3.org/2000/svg", 
      className,
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "2"
    }, 
      React.createElement("path", { 
        strokeLinecap: "round", 
        strokeLinejoin: "round", 
        d: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" 
      })
    );
  }
};

// React Components
const e = React.createElement;

// Separator Component
const Separator = () => {
  return e('div', { className: 'separator' });
};

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
    e('h1', { className: 'text-center mb-6' }, 'CSV Consolidator Portal'),
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
  return e('div', { className: 'flex justify-between items-center' },
    e('h1', { style: { fontSize: '1.5rem', fontWeight: '600' } }, 'CSV Consolidator Portal'),
    ApiService.isUserAuthenticated() && 
      e('button', { 
        className: 'button button-outline hover-lift',
        onClick: () => {
          ApiService.logout();
          window.location.reload();
        }
      }, [
        e(Icons.LogOut, { className: 'h-4 w-4 mr-2' }),
        'Logout'
      ])
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
    e('h3', { style: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' } }, 'API Configuration'),
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

// DropboxLinkForm Component
const DropboxLinkForm = () => {
  const [dropboxUrl, setDropboxUrl] = React.useState(storage.get('dropboxUrl', ''));
  const [saved, setSaved] = React.useState(false);

  const saveDropboxUrl = () => {
    storage.set('dropboxUrl', dropboxUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return e('div', { className: 'card' },
    e('h3', { style: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' } }, 'Dropbox Integration'),
    e('div', { className: 'form-group' },
      e('label', { htmlFor: 'dropbox-url' }, 'Dropbox Folder URL'),
      e('input', {
        id: 'dropbox-url',
        type: 'text',
        value: dropboxUrl,
        onChange: (e) => setDropboxUrl(e.target.value),
        placeholder: 'https://www.dropbox.com/...'
      })
    ),
    e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      e('button', {
        className: 'button button-primary',
        onClick: saveDropboxUrl
      }, 'Save Dropbox URL'),
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
    e('h3', { style: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' } }, 'Data Sources'),
    e('form', { onSubmit: addSource, className: 'space-y-4' },
      e('div', { className: 'grid grid-cols-1 md\\:grid-cols-2 gap-2' },
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
    e('h3', { style: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' } }, 'API Usage Statistics'),
    e('div', { className: 'grid grid-cols-1 md\\:grid-cols-2', style: { marginTop: '1rem' } },
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

// SchemaEditor Component (Simple version)
const SchemaEditor = () => {
  const [schema, setSchema] = React.useState(ApiService.getSchema());
  const [newField, setNewField] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  const addField = () => {
    if (!newField) return;
    
    const updatedSchema = {...schema};
    updatedSchema.fields = [...schema.fields, newField];
    setSchema(updatedSchema);
    setNewField('');
  };

  const removeField = (index) => {
    const updatedSchema = {...schema};
    updatedSchema.fields = schema.fields.filter((_, i) => i !== index);
    setSchema(updatedSchema);
  };

  const saveSchema = () => {
    ApiService.saveSchema(schema);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return e('div', { className: 'card' },
    e('h3', { style: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' } }, 'Data Schema Configuration'),
    e('div', { className: 'form-group' },
      e('label', null, 'Add Field'),
      e('div', { style: { display: 'flex', gap: '0.5rem' } },
        e('input', {
          type: 'text',
          value: newField,
          onChange: (e) => setNewField(e.target.value),
          placeholder: 'e.g., customer_id'
        }),
        e('button', {
          className: 'button button-primary',
          onClick: addField
        }, 'Add')
      )
    ),
    e('div', { style: { marginTop: '1rem' } },
      e('h4', { style: { fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' } }, 'Schema Fields'),
      schema.fields.length === 0
        ? e('p', null, 'No fields added yet.')
        : e('ul', { style: { listStyle: 'none', padding: 0 } },
            schema.fields.map((field, index) => 
              e('li', { 
                key: index,
                style: { 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'var(--secondary)',
                  borderRadius: '0.25rem'
                }
              },
                e('span', null, field),
                e('button', {
                  className: 'button button-outline',
                  style: { padding: '0.25rem 0.5rem' },
                  onClick: () => removeField(index)
                }, 'Remove')
              )
            )
          )
    ),
    e('div', { style: { marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      e('button', {
        className: 'button button-primary',
        onClick: saveSchema
      }, 'Save Schema'),
      saved && e('span', { className: 'status status-success' }, 'Saved!')
    )
  );
};

// DeploymentGuide Component (Simple version)
const DeploymentGuide = () => {
  return e('div', { className: 'card' },
    e('h3', { style: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' } }, 'Deployment Guide'),
    e('div', { className: 'space-y-4' },
      e('p', null, 'To deploy this application to your server:'),
      e('ol', { style: { paddingLeft: '1.5rem' } },
        e('li', null, 'Download the frontend and API packages from the deployment page'),
        e('li', null, 'Upload the frontend files to your web server root directory'),
        e('li', null, 'Create an "api" folder in your root directory'),
        e('li', null, 'Upload the API files to the "api" folder'),
        e('li', null, 'Configure your API key in config.php'),
        e('li', null, 'Test the installation by visiting your domain')
      ),
      e('p', { style: { marginTop: '1rem' } }, 'For more detailed instructions, please visit the full deployment guide page.')
    )
  );
};

// DataTable Component (Simple version)
const DataTable = () => {
  const [data, setData] = React.useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' }
  ]);

  return e('div', { className: 'card' },
    e('h3', { style: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' } }, 'Sample Data'),
    e('div', { style: { overflowX: 'auto' } },
      e('table', null,
        e('thead', null,
          e('tr', null,
            e('th', null, 'ID'),
            e('th', null, 'Name'),
            e('th', null, 'Email'),
            e('th', null, 'Status')
          )
        ),
        e('tbody', null,
          data.map(row => 
            e('tr', { key: row.id },
              e('td', null, row.id),
              e('td', null, row.name),
              e('td', null, row.email),
              e('td', null, row.status)
            )
          )
        )
      )
    )
  );
};

// Tabs Component
const Tabs = ({ children, defaultTab }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  
  // Filter children to get only tab triggers
  const triggers = React.Children.toArray(children).filter(
    child => child.type === TabTrigger
  );
  
  // Filter children to get only tab content
  const contents = React.Children.toArray(children).filter(
    child => child.type === TabContent
  );
  
  return e('div', { className: 'tabs-container' },
    e('div', { className: 'tabs' },
      triggers.map(trigger => 
        React.cloneElement(trigger, {
          key: trigger.props.value,
          isActive: activeTab === trigger.props.value,
          onClick: () => setActiveTab(trigger.props.value)
        })
      )
    ),
    contents.map(content => 
      React.cloneElement(content, {
        key: content.props.value,
        isActive: activeTab === content.props.value
      })
    )
  );
};

// TabTrigger Component
const TabTrigger = ({ children, value, isActive, onClick }) => {
  return e('div', {
    className: \`tab \${isActive ? 'active' : ''}\`,
    onClick: onClick
  }, children);
};

// TabContent Component
const TabContent = ({ children, value, isActive }) => {
  if (!isActive) return null;
  return e('div', { className: 'tab-content' }, children);
};

// Main App Component
const App = () => {
  const isAuthenticated = ApiService.isUserAuthenticated();

  if (!isAuthenticated) {
    return e('div', { 
      className: 'min-h-screen bg-gradient-to-b', 
      style: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1rem' 
      } 
    },
    // Background decorations
    e('div', { className: 'absolute inset-0 overflow-hidden pointer-events-none' },
      e('div', { className: 'absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl' }),
      e('div', { className: 'absolute top-[20%] -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl' }),
      e('div', { className: 'absolute -bottom-40 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl' })
    ),
    e(LoginForm));
  }

  return e('div', { className: 'min-h-screen bg-gradient-to-b' },
    // Background decorations
    e('div', { className: 'absolute inset-0 overflow-hidden pointer-events-none' },
      e('div', { className: 'absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl' }),
      e('div', { className: 'absolute top-[20%] -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl' }),
      e('div', { className: 'absolute -bottom-40 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl' })
    ),
    e('div', { className: 'container max-w-7xl relative' },
      e('div', { className: 'py-10 space-y-8 animate-slide-up' },
        // Header with Logout Button
        e(Header),
        
        e(Separator),
        
        // API Usage Stats
        e('section', null,
          e(ApiUsageStats)
        ),
        
        // Sources Management
        e('section', null,
          e(SourcesManager)
        ),
        
        // Configuration
        e('section', null,
          e('h2', null, 'Configuration'),
          e(Tabs, { defaultTab: 'basic' },
            e(TabTrigger, { value: 'basic' }, 'Basic Setup'),
            e(TabTrigger, { value: 'schema' }, 'Data Schema'),
            e(TabTrigger, { value: 'deployment' }, 'Deployment'),
            
            e(TabContent, { value: 'basic' },
              e('div', { className: 'grid grid-cols-1 md\\:grid-cols-2 gap-2', style: { marginTop: '1rem' } },
                e(ApiKeyForm),
                e(DropboxLinkForm)
              )
            ),
            
            e(TabContent, { value: 'schema' },
              e(SchemaEditor)
            ),
            
            e(TabContent, { value: 'deployment' },
              e(DeploymentGuide)
            )
          )
        ),
        
        // Control and Data View
        e('section', { className: 'space-y-6' },
          e('h2', null, 'Sample Data'),
          e(DataTable)
        )
      )
    )
  );
};

// Render the app
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  ReactDOM.render(e(App), root);
});`);

    // Add README
    zip.file("README.md", `# CSV Consolidator Portal - Frontend

This package contains the frontend for the CSV Consolidator Portal that matches the UI you see in the preview.

## Features

- Modern, responsive UI using custom CSS
- Data source management
- API key configuration
- Schema editor
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
2. Configure CORS on your API to allow requests from your frontend origin
3. Set your API key in the configuration section after logging in

## Customization

You can modify the CSS in assets/style.css to match your branding and preferences.
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
