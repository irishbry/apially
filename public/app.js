// Main JavaScript file for the API Ally application

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Login functionality
  const loginForm = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginPage = document.getElementById('login-page');
  const mainApp = document.getElementById('main-app');
  
  // Check if user is logged in
  checkAuthStatus();
  
  // Login button click
  if (loginForm) {
    loginForm.addEventListener('click', function() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      if (!username || !password) {
        showToast('Error', 'Please enter both username and password.', 'error');
        return;
      }
      
      // Show loading state
      loginForm.textContent = 'Logging in...';
      loginForm.disabled = true;
      
      // Send login request to PHP backend
      fetch('api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('csv-api-auth', 'true');
          showToast('Success', 'You have been logged in successfully.', 'success');
          checkAuthStatus();
        } else {
          showToast('Error', data.message || 'Invalid username or password.', 'error');
          loginForm.textContent = 'Login';
          loginForm.disabled = false;
        }
      })
      .catch(error => {
        console.error('Login error:', error);
        showToast('Error', 'Unable to login. Please try again.', 'error');
        loginForm.textContent = 'Login';
        loginForm.disabled = false;
      });
    });
  }
  
  // Logout button click
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('csv-api-auth');
      checkAuthStatus();
      showToast('Success', 'You have been logged out successfully.', 'success');
    });
  }
  
  // Check authentication status
  function checkAuthStatus() {
    const isAuthenticated = localStorage.getItem('csv-api-auth') === 'true';
    
    if (isAuthenticated) {
      if (loginPage) loginPage.classList.add('hidden');
      if (mainApp) mainApp.classList.remove('hidden');
    } else {
      if (loginPage) loginPage.classList.remove('hidden');
      if (mainApp) mainApp.classList.add('hidden');
    }
  }
  
  // Toast notification system
  function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type} animate-fade-in flex items-center p-4 mb-3 max-w-md rounded shadow-lg`;
    
    let bgColor, iconColor;
    let icon = '';
    
    switch (type) {
      case 'success':
        bgColor = 'bg-green-50 border-l-4 border-green-500';
        iconColor = 'text-green-500';
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        break;
      case 'error':
        bgColor = 'bg-red-50 border-l-4 border-red-500';
        iconColor = 'text-red-500';
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        break;
      default:
        bgColor = 'bg-blue-50 border-l-4 border-blue-500';
        iconColor = 'text-blue-500';
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    toast.className += ` ${bgColor}`;
    
    toast.innerHTML = `
      <div class="${iconColor}">${icon}</div>
      <div>
        <div class="font-bold">${title}</div>
        <div class="text-sm">${message}</div>
      </div>
      <button class="ml-auto text-gray-400 hover:text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add click listener to close button
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toast.classList.add('animate-fade-out');
        setTimeout(() => {
          if (toastContainer.contains(toast)) {
            toastContainer.removeChild(toast);
          }
        }, 300);
      }
    }, 5000);
  }
  
  // API key management
  const apiKeyInput = document.getElementById('api-key-input');
  const generateApiKeyBtn = document.getElementById('generate-api-key');
  const saveApiKeyBtn = document.getElementById('save-api-key');
  const copyApiKeyBtn = document.getElementById('copy-api-key');
  
  // Load saved API key
  let apiKey = localStorage.getItem('csv-api-key') || '';
  if (apiKeyInput) {
    apiKeyInput.value = apiKey;
  }
  
  // Generate API key
  if (generateApiKeyBtn) {
    generateApiKeyBtn.addEventListener('click', function() {
      apiKey = generateApiKey();
      if (apiKeyInput) {
        apiKeyInput.value = apiKey;
      }
    });
  }
  
  // Save API key
  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', function() {
      apiKey = apiKeyInput ? apiKeyInput.value : '';
      localStorage.setItem('csv-api-key', apiKey);
      showToast('Success', 'API key saved successfully.', 'success');
    });
  }
  
  // Copy API key
  if (copyApiKeyBtn) {
    copyApiKeyBtn.addEventListener('click', function() {
      apiKey = apiKeyInput ? apiKeyInput.value : '';
      navigator.clipboard.writeText(apiKey)
        .then(() => showToast('Success', 'API key copied to clipboard.', 'success'))
        .catch(err => showToast('Error', 'Failed to copy API key.', 'error'));
    });
  }
  
  // Dropbox link management
  const dropboxLinkInput = document.getElementById('dropbox-link-input');
  const saveDropboxLinkBtn = document.getElementById('save-dropbox-link');
  
  // Load saved Dropbox link
  let dropboxLink = localStorage.getItem('csv-dropbox-link') || '';
  if (dropboxLinkInput) {
    dropboxLinkInput.value = dropboxLink;
  }
  
  // Save Dropbox link
  if (saveDropboxLinkBtn) {
    saveDropboxLinkBtn.addEventListener('click', function() {
      dropboxLink = dropboxLinkInput ? dropboxLinkInput.value : '';
      localStorage.setItem('csv-dropbox-link', dropboxLink);
      showToast('Success', 'Dropbox link saved successfully.', 'success');
    });
  }
  
  // Data table refresh
  const refreshDataBtn = document.getElementById('refresh-data-btn');
  if (refreshDataBtn) {
    refreshDataBtn.addEventListener('click', function() {
      showToast('Info', 'Data table refreshed.', 'info');
    });
  }
  
  // Test API functionality
  const testEndpointSelect = document.getElementById('test-endpoint');
  const testDataContainer = document.getElementById('test-data-container');
  const testDataTextarea = document.getElementById('test-data');
  const testApiBtn = document.getElementById('test-api-btn');
  const testResultDiv = document.getElementById('test-result');
  const testResultContent = document.getElementById('test-result-content');
  
  // Toggle test data input
  if (testEndpointSelect) {
    testEndpointSelect.addEventListener('change', function() {
      if (this.value === 'data') {
        if (testDataContainer) testDataContainer.classList.remove('hidden');
      } else {
        if (testDataContainer) testDataContainer.classList.add('hidden');
      }
    });
  }
  
  // Test API button click
  if (testApiBtn) {
    testApiBtn.addEventListener('click', function() {
      const endpoint = testEndpointSelect ? testEndpointSelect.value : 'status';
      let testData = {};
      
      if (endpoint === 'data') {
        try {
          testData = testDataTextarea ? JSON.parse(testDataTextarea.value) : {};
        } catch (e) {
          showToast('Error', 'Invalid JSON format.', 'error');
          return;
        }
      }
      
      fetch(`api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(testData)
      })
      .then(response => response.json())
      .then(data => {
        if (testResultDiv) testResultDiv.classList.remove('hidden');
        if (testResultContent) testResultContent.textContent = JSON.stringify(data, null, 2);
      })
      .catch(error => {
        showToast('Error', 'API test failed.', 'error');
        if (testResultDiv) testResultDiv.classList.remove('hidden');
        if (testResultContent) testResultContent.textContent = error;
      });
    });
  }
  
  // Schema editor functionality
  const newFieldInput = document.getElementById('new-field-input');
  const addFieldBtn = document.getElementById('add-field-btn');
  const fieldsList = document.getElementById('fields-list');
  const saveSchemaBtn = document.getElementById('save-schema-btn');
  
  let schemaFields = [];
  
  // Add field to schema
  if (addFieldBtn) {
    addFieldBtn.addEventListener('click', function() {
      const fieldName = newFieldInput ? newFieldInput.value : '';
      if (fieldName) {
        schemaFields.push(fieldName);
        renderSchemaFields();
        if (newFieldInput) newFieldInput.value = '';
      }
    });
  }
  
  // Render schema fields
  function renderSchemaFields() {
    if (!fieldsList) return;
    
    fieldsList.innerHTML = '';
    if (schemaFields.length === 0) {
      fieldsList.innerHTML = '<p class="text-gray-500 text-center py-4">No fields added yet. Add your first field above.</p>';
      return;
    }
    
    schemaFields.forEach(field => {
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md mb-2';
      fieldDiv.innerHTML = `
        <span class="text-gray-700">${field}</span>
        <button class="text-red-500 hover:text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      
      const deleteBtn = fieldDiv.querySelector('button');
      deleteBtn.addEventListener('click', () => {
        schemaFields = schemaFields.filter(f => f !== field);
        renderSchemaFields();
      });
      
      fieldsList.appendChild(fieldDiv);
    });
  }
  
  // Save schema
  if (saveSchemaBtn) {
    saveSchemaBtn.addEventListener('click', function() {
      localStorage.setItem('csv-data-schema', JSON.stringify(schemaFields));
      showToast('Success', 'Schema saved successfully.', 'success');
    });
  }
  
  // Helper function to generate API key
  function generateApiKey() {
    return Array.from(Array(32), () => Math.floor(Math.random() * 36).toString(36)).join('');
  }
  
  // Tabs functionality
  const basicTab = document.getElementById('basic-tab');
  const schemaTab = document.getElementById('schema-tab');
  const deploymentTab = document.getElementById('deployment-tab');
  
  const basicTabContent = document.getElementById('basic-tab-content');
  const schemaTabContent = document.getElementById('schema-tab-content');
  const deploymentTabContent = document.getElementById('deployment-tab-content');
  
  function showTab(tabId) {
    // Hide all tab contents
    basicTabContent.classList.add('hidden');
    schemaTabContent.classList.add('hidden');
    deploymentTabContent.classList.add('hidden');
    
    // Deactivate all tabs
    basicTab.classList.remove('active', 'border-blue-600', 'text-blue-600');
    schemaTab.classList.remove('active', 'border-blue-600', 'text-blue-600');
    deploymentTab.classList.remove('active', 'border-blue-600', 'text-blue-600');
    
    // Show the selected tab content
    document.getElementById(tabId + '-tab-content').classList.remove('hidden');
    
    // Activate the selected tab
    document.getElementById(tabId + '-tab').classList.add('active', 'border-blue-600', 'text-blue-600');
  }
  
  // Add click listeners to tabs
  basicTab.addEventListener('click', () => showTab('basic'));
  schemaTab.addEventListener('click', () => showTab('schema'));
  deploymentTab.addEventListener('click', () => showTab('deployment'));
});
