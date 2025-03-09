
// Main Application JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Storage utility
  const storage = {
    get: (key, defaultValue = null) => {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (e) {
        console.error('Error getting from storage:', e);
        return defaultValue;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Error setting to storage:', e);
        return false;
      }
    }
  };

  // Toast notification system
  const toast = {
    container: document.getElementById('toast-container'),
    
    show: function(message, type = 'info', duration = 3000) {
      // Create toast element
      const toastEl = document.createElement('div');
      toastEl.className = `toast toast-${type}`;
      toastEl.innerHTML = `
        <div>${message}</div>
        <button class="toast-close">×</button>
      `;
      
      // Add to container
      this.container.appendChild(toastEl);
      
      // Add event listener to close button
      const closeBtn = toastEl.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => {
        this.container.removeChild(toastEl);
      });
      
      // Auto remove after duration
      setTimeout(() => {
        if (toastEl.parentNode === this.container) {
          this.container.removeChild(toastEl);
        }
      }, duration);
    },
    
    success: function(message, duration = 3000) {
      this.show(message, 'success', duration);
    },
    
    error: function(message, duration = 3000) {
      this.show(message, 'error', duration);
    },
    
    info: function(message, duration = 3000) {
      this.show(message, 'info', duration);
    }
  };

  // API Service for backend communication
  const ApiService = {
    baseUrl: './api',
    apiKey: storage.get('apiKey', ''),
    
    getHeaders: function() {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }
      
      return headers;
    },
    
    login: async function(username, password) {
      try {
        const response = await fetch(`${this.baseUrl}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          storage.set('isAuthenticated', true);
          storage.set('user', data.user);
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    
    logout: function() {
      storage.set('isAuthenticated', false);
      storage.set('user', null);
    },
    
    isAuthenticated: function() {
      return storage.get('isAuthenticated', false);
    },
    
    getUser: function() {
      return storage.get('user', null);
    },
    
    setApiKey: function(key) {
      this.apiKey = key;
      storage.set('apiKey', key);
    },
    
    getApiKey: function() {
      return this.apiKey;
    },
    
    getSources: async function() {
      try {
        const response = await fetch(`${this.baseUrl}/sources`, {
          method: 'GET',
          headers: this.getHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.sources || [];
        } else {
          throw new Error('Failed to fetch sources');
        }
      } catch (error) {
        console.error('Error fetching sources:', error);
        return [];
      }
    },
    
    addSource: async function(source) {
      try {
        const response = await fetch(`${this.baseUrl}/sources`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(source)
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.success;
        } else {
          throw new Error('Failed to add source');
        }
      } catch (error) {
        console.error('Error adding source:', error);
        return false;
      }
    }
  };

  // Page navigation
  function showPage(pageId) {
    // Hide all pages
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.add('hidden');
    
    // Show the requested page
    document.getElementById(pageId).classList.remove('hidden');
  }

  // Check if user is authenticated
  function checkAuth() {
    if (ApiService.isAuthenticated()) {
      showPage('main-app');
      loadDashboardData();
    } else {
      showPage('login-page');
    }
  }

  // Load dashboard data
  async function loadDashboardData() {
    // Get API key from storage
    const apiKey = ApiService.getApiKey();
    if (apiKey) {
      document.getElementById('api-key-input').value = apiKey;
    }
    
    // Get Dropbox link from storage
    const dropboxLink = storage.get('dropboxLink', '');
    if (dropboxLink) {
      document.getElementById('dropbox-link-input').value = dropboxLink;
    }
    
    // Populate sources
    try {
      const sources = await ApiService.getSources();
      populateSourcesList(sources);
    } catch (error) {
      console.error('Error loading sources:', error);
      toast.error('Failed to load data sources.');
    }
    
    // Setup API usage stats (demo data)
    populateApiUsageStats({
      totalRequests: 1250,
      successRate: 98.5,
      averageResponseTime: 0.34,
      lastUpdated: new Date().toISOString()
    });
  }

  // API usage stats
  function populateApiUsageStats(stats) {
    const container = document.getElementById('api-usage-stats');
    
    container.innerHTML = `
      <h2 class="text-xl font-medium mb-4">API Usage Statistics</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Total Requests -->
        <div class="shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-sm">Total Requests</p>
          <p class="text-2xl font-medium mt-1">${stats.totalRequests}</p>
        </div>
        
        <!-- Success Rate -->
        <div class="shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-sm">Success Rate</p>
          <p class="text-2xl font-medium mt-1">${stats.successRate}%</p>
        </div>
        
        <!-- Response Time -->
        <div class="shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-sm">Avg. Response Time</p>
          <p class="text-2xl font-medium mt-1">${stats.averageResponseTime}s</p>
        </div>
        
        <!-- Last Updated -->
        <div class="shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-sm">Last Updated</p>
          <p class="text-sm mt-1">${new Date(stats.lastUpdated).toLocaleString()}</p>
        </div>
      </div>
    `;
  }

  // Populate sources list
  function populateSourcesList(sources) {
    const container = document.getElementById('sources-manager');
    
    if (!sources || sources.length === 0) {
      container.innerHTML = `
        <h2 class="text-xl font-medium mb-4">Data Sources</h2>
        <div class="shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 rounded-lg p-6">
          <p class="text-center text-gray-500">No data sources added yet.</p>
          <div class="flex justify-center mt-4">
            <button id="add-first-source" class="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 hover-lift">
              Add Your First Source
            </button>
          </div>
        </div>
      `;
      
      document.getElementById('add-first-source').addEventListener('click', function() {
        showSourceForm();
      });
    } else {
      // Create HTML for sources list
      let sourcesHtml = '';
      sources.forEach(source => {
        sourcesHtml += `
          <div class="mb-4 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all animate-fade-in">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-medium">${source.name}</h3>
                <p class="text-sm text-gray-500">${source.url}</p>
                <span class="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  ${source.type.toUpperCase()}
                </span>
              </div>
              <button data-id="${source.id}" class="delete-source py-1 px-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                Remove
              </button>
            </div>
          </div>
        `;
      });
      
      container.innerHTML = `
        <h2 class="text-xl font-medium mb-4">Data Sources</h2>
        <div class="shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium">Manage Sources</h3>
            <button id="add-new-source" class="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 hover-lift">
              Add New Source
            </button>
          </div>
          
          <div id="sources-list">
            ${sourcesHtml}
          </div>
          
          <div id="source-form" class="hidden mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 class="text-lg font-medium mb-3">Add Data Source</h3>
            <div class="space-y-4">
              <div>
                <label for="source-name" class="block text-gray-700 mb-1">Source Name</label>
                <input type="text" id="source-name" class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="e.g., Sales Data">
              </div>
              
              <div>
                <label for="source-url" class="block text-gray-700 mb-1">Source URL</label>
                <input type="text" id="source-url" class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="https://example.com/data.csv">
              </div>
              
              <div>
                <label for="source-type" class="block text-gray-700 mb-1">Source Type</label>
                <select id="source-type" class="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="api">API Endpoint</option>
                </select>
              </div>
              
              <div class="flex justify-end gap-2">
                <button id="cancel-source" class="py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button id="save-source" class="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">Save Source</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners for source management
      document.getElementById('add-new-source').addEventListener('click', showSourceForm);
      document.getElementById('cancel-source').addEventListener('click', hideSourceForm);
      document.getElementById('save-source').addEventListener('click', saveNewSource);
      
      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-source').forEach(button => {
        button.addEventListener('click', deleteSource);
      });
    }
  }

  // Show source form
  function showSourceForm() {
    document.getElementById('source-form').classList.remove('hidden');
  }
  
  // Hide source form
  function hideSourceForm() {
    document.getElementById('source-form').classList.add('hidden');
    document.getElementById('source-name').value = '';
    document.getElementById('source-url').value = '';
    document.getElementById('source-type').value = 'csv';
  }
  
  // Save new source
  async function saveNewSource() {
    const name = document.getElementById('source-name').value.trim();
    const url = document.getElementById('source-url').value.trim();
    const type = document.getElementById('source-type').value;
    
    if (!name || !url) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const success = await ApiService.addSource({ name, url, type });
    
    if (success) {
      toast.success('Data source added successfully');
      hideSourceForm();
      
      // Reload sources
      const sources = await ApiService.getSources();
      populateSourcesList(sources);
    } else {
      toast.error('Failed to add data source');
    }
  }
  
  // Delete source
  async function deleteSource(event) {
    const sourceId = event.currentTarget.getAttribute('data-id');
    // In a real application, you would make an API call to delete the source
    // For this demo, we'll just reload the list
    toast.success('Source removed successfully');
    
    // Reload sources after a brief delay to simulate API call
    setTimeout(async () => {
      const sources = await ApiService.getSources();
      populateSourcesList(sources);
    }, 500);
  }

  // Tab navigation
  function setupTabs() {
    const tabs = document.querySelectorAll('[data-tab]');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => {
          t.classList.remove('border-blue-600', 'text-blue-600');
          t.classList.add('border-transparent', 'text-gray-500');
        });
        
        // Add active class to clicked tab
        this.classList.remove('border-transparent', 'text-gray-500');
        this.classList.add('border-blue-600', 'text-blue-600');
        
        // Hide all tab content
        document.querySelectorAll('.tab-pane').forEach(content => {
          content.classList.add('hidden');
        });
        
        // Show the selected tab content
        const tabName = this.getAttribute('data-tab');
        document.getElementById(`${tabName}-tab-content`).classList.remove('hidden');
      });
    });
  }

  // Setup event listeners
  function setupEventListeners() {
    // Login form
    document.getElementById('login-btn').addEventListener('click', async function() {
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      
      if (!username || !password) {
        toast.error('Please enter both username and password');
        return;
      }
      
      const loginBtn = this;
      loginBtn.innerText = 'Logging in...';
      loginBtn.disabled = true;
      
      // Try to login
      const success = await ApiService.login(username, password);
      
      if (success) {
        toast.success('Login successful!');
        showPage('main-app');
        loadDashboardData();
      } else {
        toast.error('Invalid username or password');
        loginBtn.innerText = 'Login';
        loginBtn.disabled = false;
      }
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
      ApiService.logout();
      toast.info('You have been logged out');
      showPage('login-page');
    });
    
    // API Key management
    document.getElementById('generate-api-key').addEventListener('click', function() {
      // Generate a random API key
      const apiKey = 'ak_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      document.getElementById('api-key-input').value = apiKey;
    });
    
    document.getElementById('save-api-key').addEventListener('click', function() {
      const apiKey = document.getElementById('api-key-input').value.trim();
      
      if (apiKey) {
        ApiService.setApiKey(apiKey);
        toast.success('API key saved successfully');
      } else {
        toast.error('Please enter a valid API key');
      }
    });
    
    document.getElementById('copy-api-key').addEventListener('click', function() {
      const apiKey = document.getElementById('api-key-input').value.trim();
      
      if (apiKey) {
        navigator.clipboard.writeText(apiKey).then(() => {
          toast.success('API key copied to clipboard');
        }).catch(err => {
          toast.error('Failed to copy API key');
          console.error('Copy failed:', err);
        });
      }
    });
    
    // Dropbox link
    document.getElementById('save-dropbox-link').addEventListener('click', function() {
      const dropboxLink = document.getElementById('dropbox-link-input').value.trim();
      
      if (dropboxLink) {
        storage.set('dropboxLink', dropboxLink);
        toast.success('Dropbox link saved successfully');
      } else {
        toast.error('Please enter a valid Dropbox link');
      }
    });
    
    // Setup tab navigation
    setupTabs();
    
    // Allow Enter key to submit login form
    document.getElementById('password').addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        document.getElementById('login-btn').click();
      }
    });
  }

  // Initialize the application
  function init() {
    // Set up event listeners
    setupEventListeners();
    
    // Check authentication status
    checkAuth();
  }

  // Start the application
  init();
});
