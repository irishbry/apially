
// Main JavaScript for CSV Consolidator Portal

// Global state
const state = {
  isAuthenticated: false,
  apiKey: '',
  dropboxLink: '',
  schema: {
    requiredFields: [],
    fieldTypes: {}
  },
  sources: [],
  data: [],
  visibleData: [],
  domainName: window.location.origin || 'https://your-domain.com',
  selectedSource: '',
  selectedSourceFilter: 'all',
  searchTerm: '',
  activeConfigTab: 'basic',
  activeApiExampleTab: 'curl',
  isSendingTestData: false,
  isDownloadingCSV: false
};

// DOM Elements
let elements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  initializeEventListeners();
  checkAuthentication();
});

// Initialize element references
function initializeElements() {
  // Login elements
  elements.loginContainer = document.getElementById('login-container');
  elements.loginForm = document.getElementById('login-form');
  elements.username = document.getElementById('username');
  elements.password = document.getElementById('password');
  
  // Dashboard elements
  elements.dashboardContainer = document.getElementById('dashboard-container');
  elements.logoutButton = document.getElementById('logout-button');
  
  // API Key elements
  elements.apiKeyInput = document.getElementById('api-key-input');
  elements.generateApiKeyBtn = document.getElementById('generate-api-key-btn');
  elements.saveApiKeyBtn = document.getElementById('save-api-key-btn');
  elements.copyApiKeyBtn = document.getElementById('copy-api-key-btn');
  
  // Dropbox elements
  elements.dropboxLinkInput = document.getElementById('dropbox-link-input');
  elements.saveDropboxLinkBtn = document.getElementById('save-dropbox-link-btn');
  
  // Schema elements
  elements.newFieldName = document.getElementById('new-field-name');
  elements.newFieldType = document.getElementById('new-field-type');
  elements.newFieldRequired = document.getElementById('new-field-required');
  elements.addFieldBtn = document.getElementById('add-field-btn');
  elements.fieldsList = document.getElementById('fields-list');
  elements.schemaStats = document.getElementById('schema-stats');
  elements.saveSchemaBtn = document.getElementById('save-schema-btn');
  
  // Sources elements
  elements.sourcesTableBody = document.getElementById('sources-table-body');
  elements.addSourceBtn = document.getElementById('add-source-btn');
  elements.sourcesError = document.getElementById('sources-error');
  elements.sourcesErrorMessage = document.getElementById('sources-error-message');
  
  // Source modals
  elements.addSourceModal = document.getElementById('add-source-modal');
  elements.newSourceName = document.getElementById('new-source-name');
  elements.cancelAddSource = document.getElementById('cancel-add-source');
  elements.confirmAddSource = document.getElementById('confirm-add-source');
  
  elements.editSourceModal = document.getElementById('edit-source-modal');
  elements.editSourceName = document.getElementById('edit-source-name');
  elements.editSourceId = document.getElementById('edit-source-id');
  elements.cancelEditSource = document.getElementById('cancel-edit-source');
  elements.confirmEditSource = document.getElementById('confirm-edit-source');
  
  // Test data elements
  elements.sourceSelect = document.getElementById('source-select');
  elements.sendTestDataBtn = document.getElementById('send-test-data-btn');
  elements.testResult = document.getElementById('test-result');
  elements.triggerExportBtn = document.getElementById('trigger-export-btn');
  elements.clearDataBtn = document.getElementById('clear-data-btn');
  
  // Data table elements
  elements.dataSearch = document.getElementById('data-search');
  elements.dataSourceFilter = document.getElementById('data-source-filter');
  elements.dataTableHeader = document.getElementById('data-table-header');
  elements.dataTableBody = document.getElementById('data-table-body');
  elements.dataTableStats = document.getElementById('data-table-stats');
  elements.clearTableBtn = document.getElementById('clear-table-btn');
  elements.exportCsvBtn = document.getElementById('export-csv-btn');
  elements.dataError = document.getElementById('data-error');
  elements.dataErrorMessage = document.getElementById('data-error-message');
  
  // API documentation elements
  elements.apiEndpoint = document.getElementById('api-endpoint');
  elements.copyEndpointBtn = document.getElementById('copy-endpoint-btn');
  elements.curlCode = document.getElementById('curl-code');
  elements.jsCode = document.getElementById('js-code');
  elements.pythonCode = document.getElementById('python-code');
  
  // Stats elements
  elements.totalDataPoints = document.getElementById('total-data-points');
  elements.activeSources = document.getElementById('active-sources');
  elements.uniqueSources = document.getElementById('unique-sources');
  elements.lastReceived = document.getElementById('last-received');
  elements.dataTypesCount = document.getElementById('data-types-count');
  
  // Tab elements
  elements.configTabs = document.getElementById('config-tabs').querySelectorAll('[data-tab]');
  elements.apiExampleTabs = document.getElementById('api-example-tabs').querySelectorAll('[data-tab]');
  
  // Tab panes
  elements.basicTab = document.getElementById('basic-tab');
  elements.schemaTab = document.getElementById('schema-tab');
  elements.deploymentTab = document.getElementById('deployment-tab');
  
  elements.curlExample = document.getElementById('curl-example');
  elements.jsExample = document.getElementById('js-example');
  elements.pythonExample = document.getElementById('python-example');
  
  // Toast container
  elements.toastContainer = document.getElementById('toast-container');
  
  // Deployment guide
  elements.deploymentGuideContainer = document.getElementById('deployment-guide-container');
}

// Initialize event listeners
function initializeEventListeners() {
  // Login form
  elements.loginForm.addEventListener('submit', handleLogin);
  
  // Logout button
  elements.logoutButton.addEventListener('click', handleLogout);
  
  // API Key
  elements.generateApiKeyBtn.addEventListener('click', generateApiKey);
  elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
  elements.copyApiKeyBtn.addEventListener('click', () => copyToClipboard(elements.apiKeyInput.value, 'API key copied!'));
  
  // Dropbox
  elements.saveDropboxLinkBtn.addEventListener('click', saveDropboxLink);
  
  // Schema
  elements.addFieldBtn.addEventListener('click', addField);
  elements.saveSchemaBtn.addEventListener('click', saveSchema);
  
  // Sources
  elements.addSourceBtn.addEventListener('click', () => showModal(elements.addSourceModal));
  elements.cancelAddSource.addEventListener('click', () => hideModal(elements.addSourceModal));
  elements.confirmAddSource.addEventListener('click', addSource);
  
  elements.cancelEditSource.addEventListener('click', () => hideModal(elements.editSourceModal));
  elements.confirmEditSource.addEventListener('click', updateSource);
  
  // Test data
  elements.sourceSelect.addEventListener('change', updateTestDataButton);
  elements.sendTestDataBtn.addEventListener('click', sendTestData);
  elements.triggerExportBtn.addEventListener('click', triggerExport);
  elements.clearDataBtn.addEventListener('click', clearAllData);
  
  // Data table
  elements.dataSearch.addEventListener('input', filterData);
  elements.dataSourceFilter.addEventListener('change', filterData);
  elements.clearTableBtn.addEventListener('click', clearAllData);
  elements.exportCsvBtn.addEventListener('click', exportCsv);
  
  // API documentation
  elements.copyEndpointBtn.addEventListener('click', () => copyToClipboard(elements.apiEndpoint.textContent, 'API endpoint copied!'));
  document.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-copy-target');
      copyToClipboard(document.getElementById(targetId).textContent, 'Code example copied!');
    });
  });
  
  // Tabs
  elements.configTabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      switchConfigTab(this.getAttribute('data-tab'));
    });
  });
  
  elements.apiExampleTabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      switchApiExampleTab(this.getAttribute('data-tab'));
    });
  });
  
  // Load deployment guide
  loadDeploymentGuide();
}

// Authentication functions
function checkAuthentication() {
  const auth = localStorage.getItem('csv-api-auth');
  state.isAuthenticated = auth === 'true';
  
  if (state.isAuthenticated) {
    showDashboard();
    loadInitialData();
  } else {
    showLoginForm();
  }
}

function handleLogin(e) {
  e.preventDefault();
  
  const username = elements.username.value;
  const password = elements.password.value;
  
  if (!username || !password) {
    showToast('Please enter both username and password.', 'error');
    return;
  }
  
  // Disable form
  toggleLoginForm(true);
  
  // Make API request
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
  .then(response => response.json())
  .then(data => {
    console.log("Login response:", data);
    
    if (data.success) {
      // Set auth in local storage
      localStorage.setItem('csv-api-auth', 'true');
      
      showToast('Login successful!', 'success');
      
      // Show dashboard and load data
      showDashboard();
      loadInitialData();
    } else {
      showToast(data.message || 'Invalid username or password. Please try again.', 'error');
      toggleLoginForm(false);
    }
  })
  .catch(err => {
    console.error('Login error:', err);
    showToast('Could not connect to the authentication server. Please try again later.', 'error');
    toggleLoginForm(false);
  });
}

function handleLogout() {
  // Clear auth from local storage
  localStorage.removeItem('csv-api-auth');
  state.isAuthenticated = false;
  
  // Reset state
  resetState();
  
  // Show login form
  showLoginForm();
  
  showToast('You have been logged out successfully.', 'success');
}

function toggleLoginForm(isLoading) {
  const submitBtn = elements.loginForm.querySelector('button[type="submit"]');
  
  if (isLoading) {
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
  } else {
    submitBtn.textContent = 'Login';
    submitBtn.disabled = false;
  }
}

function showLoginForm() {
  elements.dashboardContainer.classList.add('hidden');
  elements.loginContainer.classList.remove('hidden');
}

function showDashboard() {
  elements.loginContainer.classList.add('hidden');
  elements.dashboardContainer.classList.remove('hidden');
}

// Initial data loading
function loadInitialData() {
  loadApiKey();
  loadDropboxLink();
  loadSchema();
  loadSources();
  loadData();
  updateApiDocumentation();
  updateStats();
}

// API Key functions
function loadApiKey() {
  const apiKey = localStorage.getItem('api-key');
  if (apiKey) {
    state.apiKey = apiKey;
    elements.apiKeyInput.value = apiKey;
  }
}

function generateApiKey() {
  // Generate a random string for the API key
  const key = Array.from(Array(32), () => Math.floor(Math.random() * 36).toString(36)).join('');
  elements.apiKeyInput.value = key;
}

function saveApiKey() {
  const apiKey = elements.apiKeyInput.value;
  
  if (!apiKey.trim()) {
    showToast('Please enter a valid API key.', 'error');
    return;
  }
  
  state.apiKey = apiKey;
  localStorage.setItem('api-key', apiKey);
  updateApiDocumentation();
  
  showToast('API key saved successfully!', 'success');
}

// Dropbox functions
function loadDropboxLink() {
  const dropboxLink = localStorage.getItem('dropbox-link');
  if (dropboxLink) {
    state.dropboxLink = dropboxLink;
    elements.dropboxLinkInput.value = dropboxLink;
  }
}

function saveDropboxLink() {
  const dropboxLink = elements.dropboxLinkInput.value;
  state.dropboxLink = dropboxLink;
  localStorage.setItem('dropbox-link', dropboxLink);
  
  showToast('Dropbox link saved successfully!', 'success');
}

// Schema functions
function loadSchema() {
  const schema = localStorage.getItem('schema');
  if (schema) {
    try {
      state.schema = JSON.parse(schema);
      updateSchemaUI();
    } catch (e) {
      console.error('Error parsing schema:', e);
    }
  }
}

function updateSchemaUI() {
  // Update fields list
  const fields = state.schema.fieldTypes;
  const requiredFields = state.schema.requiredFields;
  
  if (Object.keys(fields).length > 0) {
    elements.fieldsList.innerHTML = '';
    
    Object.entries(fields).forEach(([field, type]) => {
      const isRequired = requiredFields.includes(field);
      
      const fieldItem = document.createElement('div');
      fieldItem.className = 'flex items-center justify-between bg-secondary/50 p-2 rounded-md';
      fieldItem.innerHTML = `
        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            ${isRequired ? 'checked' : ''}
            data-field="${field}"
            class="field-required-checkbox rounded"
          />
          <span class="text-sm font-medium">${field}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">${type}</span>
          <button 
            data-field="${field}"
            class="remove-field-btn h-8 w-8 p-0 text-gray-500 hover:text-red-500"
          >
            <i class="fa fa-minus"></i>
          </button>
        </div>
      `;
      
      elements.fieldsList.appendChild(fieldItem);
    });
    
    // Add event listeners to checkboxes and remove buttons
    document.querySelectorAll('.field-required-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const field = this.getAttribute('data-field');
        toggleRequired(field);
      });
    });
    
    document.querySelectorAll('.remove-field-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const field = this.getAttribute('data-field');
        removeField(field);
      });
    });
  } else {
    elements.fieldsList.innerHTML = '<p class="text-sm text-muted-foreground">No fields defined yet. Add your first field above.</p>';
  }
  
  // Update schema stats
  elements.schemaStats.textContent = `${Object.keys(fields).length} fields defined, ${requiredFields.length} required`;
  
  // Update data types count in stats
  elements.dataTypesCount.textContent = Object.keys(fields).length;
}

function addField() {
  const name = elements.newFieldName.value.trim();
  const type = elements.newFieldType.value;
  const isRequired = elements.newFieldRequired.checked;
  
  if (!name) {
    showToast('Please enter a field name.', 'error');
    return;
  }
  
  if (state.schema.fieldTypes[name]) {
    showToast('This field already exists.', 'error');
    return;
  }
  
  // Add to field types
  state.schema.fieldTypes[name] = type;
  
  // Add to required fields if checked
  if (isRequired) {
    state.schema.requiredFields.push(name);
  }
  
  // Update UI and reset form
  updateSchemaUI();
  elements.newFieldName.value = '';
  elements.newFieldType.value = 'string';
  elements.newFieldRequired.checked = false;
  
  // Show success message
  showToast(`Field "${name}" added successfully!`, 'success');
}

function removeField(field) {
  // Remove from field types
  delete state.schema.fieldTypes[field];
  
  // Remove from required fields if present
  state.schema.requiredFields = state.schema.requiredFields.filter(f => f !== field);
  
  // Update UI
  updateSchemaUI();
  
  // Show success message
  showToast(`Field "${field}" removed successfully!`, 'success');
}

function toggleRequired(field) {
  if (state.schema.requiredFields.includes(field)) {
    state.schema.requiredFields = state.schema.requiredFields.filter(f => f !== field);
  } else {
    state.schema.requiredFields.push(field);
  }
  
  // Update schema stats
  elements.schemaStats.textContent = `${Object.keys(state.schema.fieldTypes).length} fields defined, ${state.schema.requiredFields.length} required`;
}

function saveSchema() {
  localStorage.setItem('schema', JSON.stringify(state.schema));
  showToast('Schema saved successfully!', 'success');
}

// Sources functions
function loadSources() {
  try {
    const sources = localStorage.getItem('sources');
    if (sources) {
      state.sources = JSON.parse(sources);
    } else {
      // Initialize with empty array if not found
      state.sources = [];
      localStorage.setItem('sources', JSON.stringify(state.sources));
    }
    
    updateSourcesUI();
    updateSourcesInSelects();
    elements.sourcesError.classList.add('hidden');
  } catch (err) {
    console.error('Error loading sources:', err);
    elements.sourcesErrorMessage.textContent = 'Error loading sources data.';
    elements.sourcesError.classList.remove('hidden');
  }
}

function updateSourcesUI() {
  if (state.sources.length > 0) {
    elements.sourcesTableBody.innerHTML = '';
    
    state.sources.forEach(source => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="p-3 font-medium">${source.name}</td>
        <td class="p-3">
          <div class="flex items-center">
            <code class="bg-muted px-1 py-0.5 rounded text-xs">
              ${source.apiKey.substring(0, 8)}...
            </code>
            <button
              class="copy-api-key-btn ml-1 text-gray-500 hover:text-primary"
              data-api-key="${source.apiKey}"
              title="Copy API key"
            >
              <i class="fa fa-copy"></i>
            </button>
          </div>
        </td>
        <td class="p-3">
          <span class="px-2 py-1 rounded text-xs ${source.active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}">
            ${source.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="p-3">
          <span class="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">
            ${source.dataCount || 0}
          </span>
        </td>
        <td class="p-3">
          ${source.lastActive ? formatDate(source.lastActive) : 'Never'}
        </td>
        <td class="p-3">
          ${formatDate(source.createdAt)}
        </td>
        <td class="p-3 text-right">
          <div class="flex items-center justify-end gap-1">
            <button
              class="toggle-source-btn p-1 text-gray-500 hover:text-primary"
              data-source-id="${source.id}"
              data-active="${source.active}"
              title="${source.active ? 'Deactivate source' : 'Activate source'}"
            >
              <i class="fa fa-power-off ${source.active ? 'text-green-500' : 'text-gray-400'}"></i>
            </button>
            <button
              class="edit-source-btn p-1 text-gray-500 hover:text-primary"
              data-source-id="${source.id}"
              data-name="${source.name}"
              title="Edit source"
            >
              <i class="fa fa-edit"></i>
            </button>
            <button
              class="regenerate-api-key-btn p-1 text-gray-500 hover:text-primary"
              data-source-id="${source.id}"
              title="Regenerate API key"
            >
              <i class="fa fa-key"></i>
            </button>
            <button
              class="delete-source-btn p-1 text-gray-500 hover:text-red-500"
              data-source-id="${source.id}"
              data-name="${source.name}"
              title="Delete source"
            >
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      
      elements.sourcesTableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.copy-api-key-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const apiKey = this.getAttribute('data-api-key');
        copyToClipboard(apiKey, 'API key copied!');
      });
    });
    
    document.querySelectorAll('.toggle-source-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-source-id');
        const active = this.getAttribute('data-active') === 'true';
        toggleSourceActive(id, !active);
      });
    });
    
    document.querySelectorAll('.edit-source-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-source-id');
        const name = this.getAttribute('data-name');
        showEditSourceModal(id, name);
      });
    });
    
    document.querySelectorAll('.regenerate-api-key-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-source-id');
        regenerateApiKey(id);
      });
    });
    
    document.querySelectorAll('.delete-source-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-source-id');
        const name = this.getAttribute('data-name');
        deleteSource(id, name);
      });
    });
  } else {
    elements.sourcesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="h-24 text-center">
          No sources available
        </td>
      </tr>
    `;
  }
  
  // Update stats
  updateStats();
}

function updateSourcesInSelects() {
  // Update source select in test data form
  elements.sourceSelect.innerHTML = '<option value="" disabled selected>Select a source</option>';
  
  state.sources.forEach(source => {
    if (source.active) {
      const option = document.createElement('option');
      option.value = source.id;
      option.textContent = source.name;
      elements.sourceSelect.appendChild(option);
    }
  });
  
  // Enable/disable send test data button
  updateTestDataButton();
  
  // Update source filter in data table
  elements.dataSourceFilter.innerHTML = '<option value="all">All Sources</option>';
  
  state.sources.forEach(source => {
    const option = document.createElement('option');
    option.value = source.id;
    option.textContent = source.name;
    elements.dataSourceFilter.appendChild(option);
  });
}

function addSource() {
  const name = elements.newSourceName.value.trim();
  
  if (!name) {
    showToast('Please enter a valid source name.', 'error');
    return;
  }
  
  const id = generateId();
  const apiKey = generateId() + generateId(); // Longer API key
  
  const newSource = {
    id,
    name,
    apiKey,
    active: true,
    dataCount: 0,
    createdAt: new Date().toISOString(),
    lastActive: null
  };
  
  state.sources.push(newSource);
  localStorage.setItem('sources', JSON.stringify(state.sources));
  
  hideModal(elements.addSourceModal);
  elements.newSourceName.value = '';
  
  updateSourcesUI();
  updateSourcesInSelects();
  
  showToast(`Source "${name}" has been added successfully.`, 'success');
}

function showEditSourceModal(id, name) {
  elements.editSourceId.value = id;
  elements.editSourceName.value = name;
  showModal(elements.editSourceModal);
}

function updateSource() {
  const id = elements.editSourceId.value;
  const name = elements.editSourceName.value.trim();
  
  if (!name) {
    showToast('Please enter a valid source name.', 'error');
    return;
  }
  
  const sourceIndex = state.sources.findIndex(s => s.id === id);
  if (sourceIndex >= 0) {
    state.sources[sourceIndex].name = name;
    localStorage.setItem('sources', JSON.stringify(state.sources));
    
    hideModal(elements.editSourceModal);
    
    updateSourcesUI();
    updateSourcesInSelects();
    
    showToast('Source name has been updated successfully.', 'success');
  }
}

function toggleSourceActive(id, active) {
  const sourceIndex = state.sources.findIndex(s => s.id === id);
  if (sourceIndex >= 0) {
    const source = state.sources[sourceIndex];
    source.active = active;
    
    localStorage.setItem('sources', JSON.stringify(state.sources));
    
    updateSourcesUI();
    updateSourcesInSelects();
    
    showToast(`Source "${source.name}" has been ${active ? 'activated' : 'deactivated'} successfully.`, 'success');
  }
}

function regenerateApiKey(id) {
  const sourceIndex = state.sources.findIndex(s => s.id === id);
  if (sourceIndex >= 0) {
    const newKey = generateId() + generateId(); // Longer API key
    state.sources[sourceIndex].apiKey = newKey;
    
    localStorage.setItem('sources', JSON.stringify(state.sources));
    
    updateSourcesUI();
    
    showToast(`A new API key has been generated for source "${state.sources[sourceIndex].name}".`, 'success');
  }
}

function deleteSource(id, name) {
  if (confirm(`Are you sure you want to delete source "${name}"? All associated data will also be deleted.`)) {
    // Remove associated data
    state.data = state.data.filter(item => item.sourceId !== id);
    localStorage.setItem('data', JSON.stringify(state.data));
    
    // Remove source
    state.sources = state.sources.filter(s => s.id !== id);
    localStorage.setItem('sources', JSON.stringify(state.sources));
    
    updateSourcesUI();
    updateSourcesInSelects();
    updateDataTable();
    
    showToast(`Source "${name}" has been deleted successfully.`, 'success');
  }
}

// Test data functions
function updateTestDataButton() {
  const hasActiveSources = state.sources.some(s => s.active);
  const selectedSource = elements.sourceSelect.value;
  
  elements.sendTestDataBtn.disabled = !hasActiveSources || !selectedSource;
}

function sendTestData() {
  const selectedSource = elements.sourceSelect.value;
  const source = state.sources.find(s => s.id === selectedSource);
  
  if (!source) {
    showToast('No source selected. Please select a source first.', 'error');
    return;
  }
  
  elements.sendTestDataBtn.disabled = true;
  elements.sendTestDataBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>Sending...';
  elements.testResult.classList.add('hidden');
  
  // Create test data
  const testData = {
    timestamp: new Date().toISOString(),
    sensorId: `test-sensor-${Math.floor(Math.random() * 5) + 1}`,
    temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
    humidity: Math.round(Math.random() * 100),
    pressure: Math.round((Math.random() * 50 + 970) * 10) / 10,
    sourceId: source.id
  };
  
  // Generate ID for the data
  testData.id = generateId();
  
  // Add to data
  state.data.push(testData);
  
  // Update source stats
  source.dataCount = (source.dataCount || 0) + 1;
  source.lastActive = new Date().toISOString();
  
  // Save to local storage
  localStorage.setItem('data', JSON.stringify(state.data));
  localStorage.setItem('sources', JSON.stringify(state.sources));
  
  // Simulate API call delay
  setTimeout(() => {
    elements.sendTestDataBtn.disabled = false;
    elements.sendTestDataBtn.innerHTML = '<i class="fa fa-paper-plane mr-2"></i>Send Test Data';
    
    // Show test result
    elements.testResult.classList.remove('hidden');
    elements.testResult.innerHTML = `
      <i class="fa fa-check-circle mr-1 text-green-600"></i>
      Test data sent successfully! Data point added for source "${source.name}".
    `;
    elements.testResult.className = 'mt-2 text-sm text-green-600 flex items-center';
    
    // Update UI
    updateDataTable();
    updateSourcesUI();
    updateStats();
    
    showToast('Test data sent successfully!', 'success');
  }, 1000);
}

function triggerExport() {
  if (state.data.length === 0) {
    showToast('No data to export.', 'error');
    return;
  }
  
  // Simulate export
  showToast('CSV export triggered. Files will be uploaded to your Dropbox location.', 'success');
}

function clearAllData() {
  if (state.data.length === 0) {
    showToast('No data to clear.', 'info');
    return;
  }
  
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    // Reset data counts on sources
    state.sources.forEach(source => {
      source.dataCount = 0;
    });
    
    // Clear data
    state.data = [];
    
    // Save to local storage
    localStorage.setItem('data', JSON.stringify(state.data));
    localStorage.setItem('sources', JSON.stringify(state.sources));
    
    // Update UI
    updateDataTable();
    updateSourcesUI();
    updateStats();
    
    showToast('All data has been cleared successfully.', 'success');
  }
}

// Data functions
function loadData() {
  try {
    const data = localStorage.getItem('data');
    if (data) {
      state.data = JSON.parse(data);
    } else {
      // Initialize with empty array if not found
      state.data = [];
      localStorage.setItem('data', JSON.stringify(state.data));
    }
    
    filterData();
    elements.dataError.classList.add('hidden');
  } catch (err) {
    console.error('Error loading data:', err);
    elements.dataErrorMessage.textContent = 'Error loading data.';
    elements.dataError.classList.remove('hidden');
  }
}

function filterData() {
  state.searchTerm = elements.dataSearch.value.toLowerCase();
  state.selectedSourceFilter = elements.dataSourceFilter.value;
  
  // Filter data
  let filtered = state.data;
  
  // Filter by source
  if (state.selectedSourceFilter !== 'all') {
    filtered = filtered.filter(entry => entry.sourceId === state.selectedSourceFilter);
  }
  
  // Filter by search term
  if (state.searchTerm.trim()) {
    filtered = filtered.filter(entry => {
      return Object.values(entry).some(value => 
        value !== null && 
        value !== undefined && 
        String(value).toLowerCase().includes(state.searchTerm)
      );
    });
  }
  
  state.visibleData = filtered;
  updateDataTable();
}

function updateDataTable() {
  // Get all columns dynamically from data
  const columns = getDataColumns();
  
  // Update header
  if (columns.length > 0 && columns[0] !== 'No Data') {
    elements.dataTableHeader.innerHTML = '';
    const headerRow = document.createElement('tr');
    
    columns.forEach(column => {
      const th = document.createElement('th');
      th.className = 'p-3 text-left whitespace-nowrap';
      th.textContent = column === 'sourceId' ? 'Source' : column;
      headerRow.appendChild(th);
    });
    
    elements.dataTableHeader.appendChild(headerRow);
  }
  
  // Update body
  if (state.visibleData.length > 0) {
    elements.dataTableBody.innerHTML = '';
    
    state.visibleData.forEach((entry, index) => {
      const row = document.createElement('tr');
      row.className = 'animate-fade-in';
      
      columns.forEach(column => {
        const cell = document.createElement('td');
        cell.className = 'p-3 whitespace-nowrap';
        cell.textContent = formatCellValue(column, entry[column]);
        row.appendChild(cell);
      });
      
      elements.dataTableBody.appendChild(row);
    });
    
    // Enable export button
    elements.exportCsvBtn.disabled = false;
  } else {
    elements.dataTableBody.innerHTML = `
      <tr>
        <td colspan="${columns.length || 1}" class="h-24 text-center">
          No data available
        </td>
      </tr>
    `;
    
    // Disable export button
    elements.exportCsvBtn.disabled = true;
  }
  
  // Update stats
  elements.dataTableStats.textContent = `Showing ${state.visibleData.length} of ${state.data.length} entries${
    state.selectedSourceFilter !== 'all' 
      ? ` for ${getSourceName(state.selectedSourceFilter)}` 
      : ''
  }`;
}

function getDataColumns() {
  if (state.data.length === 0) return ['No Data'];
  
  // Get all unique keys, prioritizing common ones
  const priorityKeys = ['timestamp', 'id', 'sourceId', 'sensorId'];
  const allKeys = new Set();
  
  // Add priority keys first
  priorityKeys.forEach(key => allKeys.add(key));
  
  // Add all other keys
  state.data.forEach(entry => {
    Object.keys(entry).forEach(key => {
      if (!priorityKeys.includes(key)) {
        allKeys.add(key);
      }
    });
  });
  
  return Array.from(allKeys);
}

function getSourceName(sourceId) {
  if (!sourceId) return 'Unknown';
  const source = state.sources.find(s => s.id === sourceId);
  return source ? source.name : sourceId;
}

function formatCellValue(key, value) {
  if (value === undefined || value === null) return '-';
  if (key === 'sourceId') return getSourceName(value);
  if (key === 'timestamp') return formatDate(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// CSV Export
function exportCsv() {
  if (state.visibleData.length === 0) {
    showToast('No data to export.', 'error');
    return;
  }
  
  elements.exportCsvBtn.innerHTML = 'Downloading...';
  elements.exportCsvBtn.disabled = true;
  
  setTimeout(() => {
    try {
      // Get columns
      const columns = getDataColumns();
      
      // Create CSV content
      let csv = columns.join(',') + '\n';
      
      // Add data rows
      state.visibleData.forEach(item => {
        const row = columns.map(column => {
          const value = item[column];
          
          // Handle undefined or null
          if (value === undefined || value === null) {
            return '';
          }
          
          // Handle strings that might contain commas or quotes
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          
          // Handle objects
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          
          return value;
        });
        
        csv += row.join(',') + '\n';
      });
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `data-export-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('CSV exported successfully!', 'success');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      showToast('Error exporting CSV.', 'error');
    } finally {
      elements.exportCsvBtn.innerHTML = '<i class="fa fa-download mr-1"></i>Export CSV';
      elements.exportCsvBtn.disabled = false;
    }
  }, 500);
}

// API Documentation functions
function updateApiDocumentation() {
  const apiEndpoint = `${state.domainName}/api/data`;
  elements.apiEndpoint.textContent = apiEndpoint;
  
  // Update examples
  const apiKey = state.apiKey || 'YOUR_API_KEY';
  
  // cURL example
  elements.curlCode.textContent = `curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "sensorId": "sensor-1",
    "temperature": 25.4,
    "humidity": 68,
    "pressure": 1013.2
  }'`;
  
  // JavaScript example
  elements.jsCode.textContent = `// Using fetch API
const url = '${apiEndpoint}';
const apiKey = '${apiKey}';

const data = {
  sensorId: 'sensor-1',
  temperature: 25.4,
  humidity: 68,
  pressure: 1013.2
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify(data)
})
.then(response => response.json())
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));`;
  
  // Python example
  elements.pythonCode.textContent = `import requests
import json

url = "${apiEndpoint}"
api_key = "${apiKey}"

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': api_key
}

data = {
    "sensorId": "sensor-1",
    "temperature": 25.4,
    "humidity": 68,
    "pressure": 1013.2
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print(response.json())`;
}

// Stats functions
function updateStats() {
  // Calculate stats
  const totalDataPoints = state.data.length;
  const uniqueSourceIds = new Set(state.data.map(d => d.sourceId));
  
  const activeSources = state.sources.filter(s => s.active).length;
  const totalSources = state.sources.length;
  
  let lastReceived = 'No data';
  if (state.data.length > 0) {
    // Find the most recent timestamp
    const timestamps = state.data
      .map(d => d.timestamp)
      .filter(ts => ts) // Filter out undefined/null
      .map(ts => new Date(ts).getTime());
    
    if (timestamps.length > 0) {
      const maxTimestamp = Math.max(...timestamps);
      lastReceived = new Date(maxTimestamp).toLocaleTimeString();
    }
  }
  
  // Update UI
  elements.totalDataPoints.textContent = totalDataPoints;
  elements.activeSources.textContent = `${activeSources}/${totalSources}`;
  elements.uniqueSources.textContent = uniqueSourceIds.size;
  elements.lastReceived.textContent = lastReceived;
}

// Tab functions
function switchConfigTab(tabId) {
  // Update tab styling
  elements.configTabs.forEach(tab => {
    const isActive = tab.getAttribute('data-tab') === tabId;
    if (isActive) {
      tab.classList.add('border-primary', 'text-primary');
      tab.classList.remove('border-transparent', 'hover:border-gray-300');
    } else {
      tab.classList.remove('border-primary', 'text-primary');
      tab.classList.add('border-transparent', 'hover:border-gray-300');
    }
  });
  
  // Show/hide tab content
  document.getElementById('basic-tab').classList.toggle('active', tabId === 'basic');
  document.getElementById('schema-tab').classList.toggle('active', tabId === 'schema');
  document.getElementById('deployment-tab').classList.toggle('active', tabId === 'deployment');
  
  // Hide all tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
    pane.classList.add('hidden');
  });
  
  // Show selected tab pane
  const activePane = document.getElementById(`${tabId}-tab`);
  if (activePane) {
    activePane.classList.add('active');
    activePane.classList.remove('hidden');
  }
  
  state.activeConfigTab = tabId;
}

function switchApiExampleTab(tabId) {
  // Update tab styling
  elements.apiExampleTabs.forEach(tab => {
    const isActive = tab.getAttribute('data-tab') === tabId;
    if (isActive) {
      tab.classList.add('border-primary', 'text-primary');
      tab.classList.remove('border-transparent', 'hover:border-gray-300');
    } else {
      tab.classList.remove('border-primary', 'text-primary');
      tab.classList.add('border-transparent', 'hover:border-gray-300');
    }
  });
  
  // Hide all example panes
  document.querySelectorAll('.example-tab-pane').forEach(pane => {
    pane.classList.add('hidden');
    pane.classList.remove('active');
  });
  
  // Show selected example pane
  const activePane = document.getElementById(`${tabId}-example`);
  if (activePane) {
    activePane.classList.remove('hidden');
    activePane.classList.add('active');
  }
  
  state.activeApiExampleTab = tabId;
}

// Deployment guide
function loadDeploymentGuide() {
  // For demo purposes, we'll just add some static content
  elements.deploymentGuideContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <h3 class="text-xl font-medium">Deployment Instructions</h3>
      
      <div class="space-y-4">
        <p>Follow these steps to deploy your CSV Consolidator API to SiteGround or any other PHP-compatible hosting:</p>
        
        <ol class="list-decimal list-inside space-y-3 ml-4">
          <li class="text-sm">
            <span class="font-medium">Upload Files</span>: 
            Transfer all files in the <code>/public/api/</code> directory to your hosting server.
          </li>
          <li class="text-sm">
            <span class="font-medium">Set Permissions</span>: 
            Ensure the <code>/api/data/</code> directory has write permissions (chmod 755 or 775).
          </li>
          <li class="text-sm">
            <span class="font-medium">Configure Domain</span>: 
            Update your domain settings in the configuration to match your actual domain name.
          </li>
          <li class="text-sm">
            <span class="font-medium">Secure API Key</span>: 
            Change the default API key in <code>config.php</code> to enhance security.
          </li>
          <li class="text-sm">
            <span class="font-medium">Test Deployment</span>: 
            Send a test request to verify your API is working correctly.
          </li>
        </ol>
        
        <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p class="text-sm text-yellow-800">
            <strong>Note:</strong> For production use, we recommend setting up proper authentication and 
            implementing additional security measures like rate limiting and validation.
          </p>
        </div>
        
        <p class="text-sm">
          If you need assistance with deployment, please refer to your hosting provider's documentation
          for PHP application deployment instructions.
        </p>
      </div>
    </div>
  `;
}

// Utility functions
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type} animate-fade-in`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  
  toast.innerHTML = `
    <div class="flex items-center">
      <i class="fa fa-${icon} mr-2"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close ml-auto text-gray-400 hover:text-gray-600">
      <i class="fa fa-times"></i>
    </button>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('animate-fade-in');
    toast.classList.add('animate-fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  });
  
  // Auto close after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('animate-fade-in');
      toast.classList.add('animate-fade-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function copyToClipboard(text, successMessage) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMessage, 'success');
  }).catch(err => {
    console.error('Error copying to clipboard:', err);
    showToast('Failed to copy to clipboard.', 'error');
  });
}

function showModal(modal) {
  modal.classList.remove('hidden');
}

function hideModal(modal) {
  modal.classList.add('hidden');
}

function resetState() {
  state.apiKey = '';
  state.dropboxLink = '';
  state.schema = {
    requiredFields: [],
    fieldTypes: {}
  };
  state.sources = [];
  state.data = [];
  state.visibleData = [];
  state.selectedSource = '';
  state.selectedSourceFilter = 'all';
  state.searchTerm = '';
}

// Add custom styles for tab panes
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    .tab-pane {
      display: none;
    }
    .tab-pane.active {
      display: block;
    }
    .example-tab-pane {
      display: none;
    }
    .example-tab-pane.active {
      display: block;
    }
    .hover-lift {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .hover-lift:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03);
    }
  `;
  document.head.appendChild(style);
});
