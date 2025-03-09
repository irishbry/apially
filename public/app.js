
// Main application script

// Function to show a toast message
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type} p-4 mb-4 rounded shadow-md flex items-center justify-between animate-fade-in`;
  
  // Set the inner HTML of the toast
  toast.innerHTML = `
    <div class="flex items-center">
      ${type === 'success' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : ''}
      ${type === 'error' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' : ''}
      ${type === 'info' ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-blue-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>' : ''}
      <span>${message}</span>
    </div>
    <button class="text-gray-500 hover:text-gray-700 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;
  
  // Add a click event to the close button
  toast.querySelector('button').addEventListener('click', () => {
    toast.classList.remove('animate-fade-in');
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto-remove after 5 seconds
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode === toastContainer) {
      toast.classList.remove('animate-fade-in');
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// Function to check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('auth') === 'true';
}

// Function to set login state
function setLoggedIn(state) {
  localStorage.setItem('auth', state);
  updateUIBasedOnAuth();
}

// Function to update UI based on authentication
function updateUIBasedOnAuth() {
  const loginPage = document.getElementById('login-page');
  const mainApp = document.getElementById('main-app');
  
  if (isLoggedIn()) {
    loginPage.classList.add('hidden');
    mainApp.classList.remove('hidden');
  } else {
    loginPage.classList.remove('hidden');
    mainApp.classList.add('hidden');
  }
}

// Function to handle login
async function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showToast('Please enter both username and password', 'error');
    return;
  }
  
  try {
    const response = await fetch('api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setLoggedIn(true);
      showToast('Login successful!', 'success');
    } else {
      showToast(data.message || 'Invalid credentials', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Error connecting to the server', 'error');
  }
}

// Function to handle logout
function handleLogout() {
  setLoggedIn(false);
  showToast('You have been logged out', 'info');
}

// Tab switching functionality
function setupTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      document.querySelectorAll('[data-tab]').forEach(t => {
        t.classList.remove('border-blue-600', 'text-blue-600');
        t.classList.add('border-transparent', 'text-gray-500');
      });
      
      // Add active class to current tab
      tab.classList.remove('border-transparent', 'text-gray-500');
      tab.classList.add('border-blue-600', 'text-blue-600');
      
      // Hide all tab content
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
        pane.classList.add('hidden');
      });
      
      // Show active tab content
      const targetId = `${tab.dataset.tab}-tab-content`;
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.remove('hidden');
        targetPane.classList.add('active');
      }
    });
  });
}

// Schema Editor functionality
function setupSchemaEditor() {
  const addFieldBtn = document.getElementById('add-field-btn');
  const newFieldInput = document.getElementById('new-field-input');
  const fieldsList = document.getElementById('fields-list');
  const saveSchemaBtn = document.getElementById('save-schema-btn');
  
  // Load existing schema
  let schema = JSON.parse(localStorage.getItem('schema') || '{"fields": [], "requiredFields": []}');
  
  function updateFieldsList() {
    if (!fieldsList) return;
    
    if (schema.fields.length === 0) {
      fieldsList.innerHTML = '<p class="text-gray-500 text-center py-4">No fields added yet. Add your first field above.</p>';
      return;
    }
    
    fieldsList.innerHTML = '';
    schema.fields.forEach(field => {
      const fieldItem = document.createElement('div');
      fieldItem.className = 'flex items-center justify-between bg-gray-50 p-2 rounded-md mb-2';
      
      const isRequired = schema.requiredFields.includes(field.name);
      
      fieldItem.innerHTML = `
        <div class="flex items-center gap-2">
          <input 
            type="checkbox" 
            ${isRequired ? 'checked' : ''}
            class="rounded" 
            data-field="${field.name}"
          />
          <span class="text-sm font-medium">${field.name}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">${field.type}</span>
          <button 
            class="text-gray-400 hover:text-red-500"
            data-remove="${field.name}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      `;
      
      fieldsList.appendChild(fieldItem);
      
      // Add event listeners
      fieldItem.querySelector(`[data-field="${field.name}"]`).addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!schema.requiredFields.includes(field.name)) {
            schema.requiredFields.push(field.name);
          }
        } else {
          schema.requiredFields = schema.requiredFields.filter(f => f !== field.name);
        }
      });
      
      fieldItem.querySelector(`[data-remove="${field.name}"]`).addEventListener('click', () => {
        schema.fields = schema.fields.filter(f => f.name !== field.name);
        schema.requiredFields = schema.requiredFields.filter(f => f !== field.name);
        updateFieldsList();
      });
    });
  }
  
  if (addFieldBtn && newFieldInput) {
    addFieldBtn.addEventListener('click', () => {
      const fieldName = newFieldInput.value.trim();
      if (!fieldName) {
        showToast('Please enter a field name', 'error');
        return;
      }
      
      if (schema.fields.some(f => f.name === fieldName)) {
        showToast('This field already exists', 'error');
        return;
      }
      
      schema.fields.push({
        name: fieldName,
        type: 'string'
      });
      
      newFieldInput.value = '';
      updateFieldsList();
    });
  }
  
  if (saveSchemaBtn) {
    saveSchemaBtn.addEventListener('click', () => {
      localStorage.setItem('schema', JSON.stringify(schema));
      showToast('Schema saved successfully', 'success');
    });
  }
  
  // Initialize fields list
  updateFieldsList();
}

// Deployment Guide Setup
function setupDeploymentGuide() {
  const deploymentGuide = document.getElementById('deployment-guide');
  if (!deploymentGuide) return;
  
  // Update deployment guide tabs
  const deploymentTabs = document.querySelectorAll('[data-deploy-tab]');
  if (deploymentTabs.length === 0) return;
  
  deploymentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      deploymentTabs.forEach(t => {
        t.classList.remove('bg-blue-100', 'text-blue-700');
        t.classList.add('bg-gray-100', 'text-gray-700');
      });
      
      // Add active class to current tab
      tab.classList.remove('bg-gray-100', 'text-gray-700');
      tab.classList.add('bg-blue-100', 'text-blue-700');
      
      // Hide all tab content
      document.querySelectorAll('.deploy-tab-pane').forEach(pane => {
        pane.classList.add('hidden');
      });
      
      // Show active tab content
      const targetId = `${tab.dataset.deployTab}-pane`;
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.remove('hidden');
      }
    });
  });
}

// Test API functionality
function setupTestApi() {
  const testEndpointSelect = document.getElementById('test-endpoint');
  const testDataContainer = document.getElementById('test-data-container');
  const testApiBtn = document.getElementById('test-api-btn');
  const testResult = document.getElementById('test-result');
  const testResultContent = document.getElementById('test-result-content');
  
  if (testEndpointSelect) {
    testEndpointSelect.addEventListener('change', () => {
      if (testEndpointSelect.value === 'data') {
        testDataContainer.classList.remove('hidden');
      } else {
        testDataContainer.classList.add('hidden');
      }
    });
  }
  
  if (testApiBtn) {
    testApiBtn.addEventListener('click', async () => {
      const endpoint = testEndpointSelect.value;
      const apiUrl = `api/${endpoint}`;
      
      try {
        let response;
        
        if (endpoint === 'data') {
          const testData = document.getElementById('test-data').value;
          let jsonData;
          
          try {
            jsonData = JSON.parse(testData);
          } catch (error) {
            showToast('Invalid JSON data', 'error');
            return;
          }
          
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': localStorage.getItem('apiKey') || 'demo-key'
            },
            body: testData
          });
        } else {
          response = await fetch(apiUrl);
        }
        
        const data = await response.json();
        
        testResult.classList.remove('hidden');
        testResultContent.textContent = JSON.stringify(data, null, 2);
        
        if (response.ok) {
          showToast('API test completed successfully', 'success');
        } else {
          showToast('API returned an error', 'error');
        }
      } catch (error) {
        console.error('API test error:', error);
        testResult.classList.remove('hidden');
        testResultContent.textContent = `Error: ${error.message}`;
        showToast('Error connecting to the API', 'error');
      }
    });
  }
}

// Document Ready Function
document.addEventListener('DOMContentLoaded', function() {
  // Update UI based on authentication
  updateUIBasedOnAuth();
  
  // Setup tab switching
  setupTabs();
  
  // Setup Schema Editor
  setupSchemaEditor();
  
  // Setup Deployment Guide
  setupDeploymentGuide();
  
  // Setup Test API
  setupTestApi();
  
  // Login button event
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
  
  // Login form enter key event
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        handleLogin();
      }
    });
  }
  
  // Logout button event
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});
