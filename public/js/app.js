
/**
 * Main application JavaScript file
 */

// Utility functions
const app = {
  // State management
  state: {
    user: null,
    sources: [],
    schema: { fields: [], mappings: {} },
    apiKey: localStorage.getItem('apiKey') || '',
    toasts: [],
  },

  // Initialize the application
  init: function() {
    // Check authentication status
    this.checkAuth();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize toast container
    this.initToasts();

    console.info('App initialized');
  },

  // Authentication check
  checkAuth: function() {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        this.state.user = JSON.parse(user);
        console.info('Checking auth status:', !!this.state.user);
        
        // Load user-specific data if authenticated
        if (this.state.user) {
          this.loadSources();
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
      }
    }
  },

  // Login function
  login: function(username, password) {
    // Make API request to authenticate
    return fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.state.user = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        console.info('Auth status check:', !!this.state.user);
        return true;
      } else {
        return false;
      }
    })
    .catch(error => {
      console.error('Login error:', error);
      return false;
    });
  },

  // Logout function
  logout: function() {
    this.state.user = null;
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = 'index.php?page=login';
  },

  // Load data sources
  loadSources: function() {
    console.info('Loading sources for authenticated user');
    fetch('/api/sources', {
      headers: {
        'X-API-Key': this.state.apiKey
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.sources) {
        this.state.sources = data.sources;
        console.info('Loaded saved sources:', this.state.sources.length);
        
        // Update UI if on sources page
        const sourcesList = document.getElementById('sources-list');
        if (sourcesList) {
          this.renderSources(sourcesList);
        }
      }
    })
    .catch(error => {
      console.error('Error loading sources:', error);
    });
  },

  // Add a new data source
  addSource: function(source) {
    return fetch('/api/sources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.state.apiKey
      },
      body: JSON.stringify(source),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Reload sources
        this.loadSources();
        return true;
      }
      return false;
    })
    .catch(error => {
      console.error('Error adding source:', error);
      return false;
    });
  },

  // Render sources list
  renderSources: function(container) {
    if (!container) return;
    
    if (this.state.sources.length === 0) {
      container.innerHTML = '<div class="text-center text-gray p-4">No data sources added yet.</div>';
      return;
    }
    
    container.innerHTML = '';
    this.state.sources.forEach(source => {
      const sourceElement = document.createElement('div');
      sourceElement.className = 'card mb-4';
      sourceElement.innerHTML = `
        <div class="card-header">
          <div class="card-title">${source.name}</div>
          <div class="card-description">${source.type.toUpperCase()} Source</div>
        </div>
        <div class="card-content">
          <p class="mb-2"><strong>URL:</strong> ${source.url}</p>
          <p><strong>Added:</strong> ${new Date(source.dateAdded).toLocaleDateString()}</p>
        </div>
        <div class="card-footer">
          <button class="button button-outline" data-source-id="${source.id}">Edit</button>
          <button class="button button-danger" data-delete-id="${source.id}">Delete</button>
        </div>
      `;
      container.appendChild(sourceElement);
    });
    
    // Add event listeners to the buttons
    document.querySelectorAll('[data-source-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const sourceId = e.target.getAttribute('data-source-id');
        // Handle edit source
        const source = this.state.sources.find(s => s.id === sourceId);
        if (source) {
          // Open edit modal or form
          this.showToast('Edit functionality coming soon', 'info');
        }
      });
    });
    
    document.querySelectorAll('[data-delete-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const sourceId = e.target.getAttribute('data-delete-id');
        // Handle delete source
        if (confirm('Are you sure you want to delete this source?')) {
          this.showToast('Delete functionality coming soon', 'info');
          // In a real app, you would make an API call to delete the source
        }
      });
    });
  },

  // Save API key
  saveApiKey: function(apiKey) {
    this.state.apiKey = apiKey;
    localStorage.setItem('apiKey', apiKey);
    
    return fetch('/api/api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey }),
    })
    .then(response => response.json())
    .then(data => {
      return data.success;
    })
    .catch(error => {
      console.error('Error saving API key:', error);
      return false;
    });
  },

  // Toast notifications
  initToasts: function() {
    this.toastContainer = document.getElementById('toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.className = 'fixed top-4 right-4 z-50';
      document.body.appendChild(this.toastContainer);
    }
  },

  showToast: function(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="toast-close">&times;</button>
    `;
    
    this.toastContainer.appendChild(toast);
    
    // Add click event to close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.removeToast(toast);
    });
    
    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
    
    return toast;
  },

  removeToast: function(toast) {
    toast.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => {
      if (toast.parentNode === this.toastContainer) {
        this.toastContainer.removeChild(toast);
      }
    }, 300);
  },

  // Event listeners setup
  setupEventListeners: function() {
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        this.login(username, password)
          .then(success => {
            if (success) {
              window.location.href = 'index.php?page=sources';
            } else {
              this.showToast('Invalid username or password', 'error');
            }
          });
      });
    }
    
    // Handle API key form submission
    const apiKeyForm = document.getElementById('api-key-form');
    if (apiKeyForm) {
      // Pre-fill the form with saved API key
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput && this.state.apiKey) {
        apiKeyInput.value = this.state.apiKey;
      }
      
      apiKeyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiKey = apiKeyInput.value;
        
        this.saveApiKey(apiKey)
          .then(success => {
            if (success) {
              this.showToast('API key saved successfully', 'success');
            } else {
              this.showToast('Failed to save API key', 'error');
            }
          });
      });
    }
    
    // Handle source form submission
    const sourceForm = document.getElementById('source-form');
    if (sourceForm) {
      sourceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('source-name').value;
        const url = document.getElementById('source-url').value;
        const type = document.getElementById('source-type').value;
        
        if (!name || !url) {
          this.showToast('Please fill in all required fields', 'warning');
          return;
        }
        
        this.addSource({ name, url, type })
          .then(success => {
            if (success) {
              this.showToast('Source added successfully', 'success');
              sourceForm.reset();
            } else {
              this.showToast('Failed to add source', 'error');
            }
          });
      });
    }
    
    // Handle logout button
    document.addEventListener('click', (e) => {
      if (e.target.matches('#logout-button')) {
        e.preventDefault();
        this.logout();
      }
    });
  }
};

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  app.init();
});
