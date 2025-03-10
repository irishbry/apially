
// Main JavaScript file for the application
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if user is authenticated (dashboard is showing)
  if (document.querySelector('#api-usage-stats-section')) {
    initializeApp();
  }
});

// Global state
const appState = {
  apiKey: localStorage.getItem('csv-api-auth-key') || '',
  dropboxLink: localStorage.getItem('csv-api-dropbox-link') || '',
  schema: {
    requiredFields: [],
    fieldTypes: {}
  },
  sources: [],
  data: [],
  selectedSource: 'all'
};

// Main initialization function
function initializeApp() {
  // Initialize all components
  initializeTabs();
  initializeApiKeyForm();
  initializeDropboxLinkForm();
  initializeToasts();
  initializeSourcesManager();
  initializeSchemaEditor();
  initializeControlPanel();
  initializeDataTable();
  initializeApiInstructions();
  
  // Load initial data
  loadData();
  loadSources();
  loadSchema();
  updateApiUsageStats();
}

// Initialize tab functionality
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and panes
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// API Key Form
function initializeApiKeyForm() {
  const apiKeyInput = document.getElementById('api-key-input');
  const generateButton = document.getElementById('generate-api-key-btn');
  const saveButton = document.getElementById('save-api-key-btn');
  const copyButton = document.getElementById('copy-api-key-btn');
  
  // Set initial value
  if (appState.apiKey) {
    apiKeyInput.value = appState.apiKey;
  }
  
  // Generate new API key
  generateButton.addEventListener('click', () => {
    generateButton.innerHTML = '<svg class="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Generating...';
    generateButton.disabled = true;
    
    // Simulate API key generation (random string)
    setTimeout(() => {
      const key = Array.from(Array(32), () => Math.floor(Math.random() * 36).toString(36)).join('');
      apiKeyInput.value = key;
      appState.apiKey = key;
      localStorage.setItem('csv-api-auth-key', key);
      
      generateButton.innerHTML = 'Generate New Key';
      generateButton.disabled = false;
      showToast('API key generated successfully', 'success');
    }, 600);
  });
  
  // Save API key
  saveButton.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showToast('Please enter a valid API key', 'error');
      return;
    }
    
    appState.apiKey = key;
    localStorage.setItem('csv-api-auth-key', key);
    showToast('API key saved successfully', 'success');
    
    // Update API instructions
    updateApiInstructions();
  });
  
  // Copy to clipboard
  copyButton.addEventListener('click', () => {
    if (!apiKeyInput.value) return;
    
    navigator.clipboard.writeText(apiKeyInput.value)
      .then(() => {
        showToast('API key copied to clipboard', 'success');
      })
      .catch(err => {
        console.error('Could not copy API key: ', err);
        showToast('Failed to copy API key', 'error');
      });
  });
}

// Dropbox Link Form
function initializeDropboxLinkForm() {
  const dropboxLinkInput = document.getElementById('dropbox-link-input');
  const saveButton = document.getElementById('save-dropbox-link-btn');
  
  // Set initial value
  if (appState.dropboxLink) {
    dropboxLinkInput.value = appState.dropboxLink;
  }
  
  // Save dropbox link
  saveButton.addEventListener('click', () => {
    const link = dropboxLinkInput.value.trim();
    appState.dropboxLink = link;
    localStorage.setItem('csv-api-dropbox-link', link);
    showToast('Dropbox link saved successfully', 'success');
  });
}

// Toast notification system
function initializeToasts() {
  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-fade-in`;
  
  let icon = '';
  switch(type) {
    case 'success':
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'error':
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      break;
    default:
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }
  
  toast.innerHTML = `
    <div class="flex items-center">
      ${icon}
      <span>${message}</span>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove();">&times;</button>
  `;
  
  const toastContainer = document.getElementById('toast-container');
  toastContainer.appendChild(toast);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('animate-fade-in');
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// Sources Manager
function initializeSourcesManager() {
  const container = document.getElementById('sources-manager-container');
  if (!container) return;

  // Initial render
  renderSourcesManager();
  
  // Fetch sources from API
  fetch('/public/api/sources')
    .then(response => response.json())
    .then(data => {
      if (data.sources) {
        appState.sources = data.sources;
        renderSourcesManager();
        updateSourcesDropdown();
      }
    })
    .catch(error => {
      console.error('Error fetching sources:', error);
    });
}

function renderSourcesManager() {
  const container = document.getElementById('sources-manager-container');
  if (!container) return;
  
  // Create sources manager HTML
  const html = `
    <div class="card shadow-sm hover:shadow-md transition-all duration-300">
      <div class="card-header">
        <h2 class="flex items-center gap-2 text-xl font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h6"></path><path d="M14 3v5h5M18 21v-6M15 18h6"></path></svg>
          Data Sources
        </h2>
        <p class="card-description">
          Add and manage your data sources
        </p>
      </div>
      <div class="card-content">
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap gap-3">
            <input type="text" id="source-name-input" placeholder="Source Name" class="input flex-grow" />
            <input type="text" id="source-url-input" placeholder="URL or Identifier" class="input flex-grow" />
            <select id="source-type-select" class="select">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="api">API</option>
            </select>
            <button id="add-source-btn" class="button primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M12 5v14M5 12h14"></path></svg>
              Add Source
            </button>
          </div>
          
          <div id="sources-list" class="mt-4 space-y-2">
            ${appState.sources.length === 0
              ? '<div class="text-center p-4 text-muted-foreground">No sources added yet</div>'
              : appState.sources.map(source => `
                <div class="bg-secondary/50 p-3 rounded-md flex items-center justify-between">
                  <div>
                    <div class="font-medium">${source.name}</div>
                    <div class="text-sm text-muted-foreground flex items-center gap-2">
                      <span>${source.url}</span>
                      <span class="badge ${source.type === 'csv' ? 'bg-blue-100 text-blue-800' : source.type === 'json' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}">${source.type}</span>
                    </div>
                  </div>
                  <button class="button icon" data-source-id="${source.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Add event listeners
  const addSourceBtn = document.getElementById('add-source-btn');
  if (addSourceBtn) {
    addSourceBtn.addEventListener('click', addSource);
  }
  
  // Add event listeners to delete buttons
  document.querySelectorAll('#sources-list button[data-source-id]').forEach(button => {
    button.addEventListener('click', (e) => {
      const sourceId = e.currentTarget.getAttribute('data-source-id');
      deleteSource(sourceId);
    });
  });
}

function addSource() {
  const nameInput = document.getElementById('source-name-input');
  const urlInput = document.getElementById('source-url-input');
  const typeSelect = document.getElementById('source-type-select');
  
  const name = nameInput.value.trim();
  const url = urlInput.value.trim();
  const type = typeSelect.value;
  
  if (!name || !url) {
    showToast('Please enter both name and URL', 'error');
    return;
  }
  
  // Create new source object
  const newSource = {
    id: 'src_' + Date.now(),
    name,
    url,
    type,
    dateAdded: new Date().toISOString(),
    apiKey: Math.random().toString(36).substring(2, 15) // Generate random API key
  };
  
  // Add to local state
  appState.sources.push(newSource);
  
  // Send to server
  fetch('/public/api/sources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      url,
      type
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showToast('Source added successfully', 'success');
      
      // Clear inputs
      nameInput.value = '';
      urlInput.value = '';
      
      // Re-render sources
      renderSourcesManager();
      updateSourcesDropdown();
      updateApiUsageStats();
    }
  })
  .catch(error => {
    console.error('Error adding source:', error);
    showToast('Failed to add source', 'error');
  });
}

function deleteSource(sourceId) {
  // Remove from local state
  appState.sources = appState.sources.filter(source => source.id !== sourceId);
  
  // Re-render sources
  renderSourcesManager();
  updateSourcesDropdown();
  updateApiUsageStats();
  
  showToast('Source deleted successfully', 'success');
}

function updateSourcesDropdown() {
  // Update sources in control panel dropdown
  const sourceSelect = document.getElementById('source-select');
  if (sourceSelect) {
    const html = `
      <option value="all">All Sources</option>
      ${appState.sources.map(source => `
        <option value="${source.id}">${source.name}</option>
      `).join('')}
    `;
    sourceSelect.innerHTML = html;
  }
}

// Schema Editor
function initializeSchemaEditor() {
  const container = document.getElementById('schema-editor-container');
  if (!container) return;

  // Render initial schema editor
  renderSchemaEditor();
  
  // Fetch schema from API
  fetch('/public/api/schema')
    .then(response => response.json())
    .then(data => {
      if (data.schema) {
        appState.schema = data.schema;
        renderSchemaEditor();
        updateApiUsageStats();
      }
    })
    .catch(error => {
      console.error('Error fetching schema:', error);
    });
}

function renderSchemaEditor() {
  const container = document.getElementById('schema-editor-container');
  if (!container) return;
  
  // Create schema editor HTML
  const html = `
    <div class="card shadow-sm hover:shadow-md transition-all duration-300">
      <div class="card-header">
        <div class="flex items-center gap-2 text-xl font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 12a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1z"></path><path d="M14 12a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1z"></path><path d="M10 17a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1z"></path><path d="M14 17a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1z"></path></svg>
          Data Schema Editor
        </div>
        <p class="card-description">
          Define the expected data structure for incoming API requests
        </p>
      </div>
      <div class="card-content">
        <div class="space-y-6">
          <div class="space-y-3">
            <h3 class="text-sm font-medium">Add New Field</h3>
            <div class="flex flex-wrap gap-2 items-end">
              <div class="grow-[2] min-w-[150px]">
                <label class="text-xs text-muted-foreground">Field Name</label>
                <input
                  type="text"
                  id="new-field-input"
                  placeholder="e.g. temperature"
                  class="input"
                />
              </div>
              <div class="grow min-w-[120px]">
                <label class="text-xs text-muted-foreground">Data Type</label>
                <select id="new-type-select" class="select">
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object</option>
                </select>
              </div>
              <div class="flex items-center gap-2 h-10">
                <label class="text-xs flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="is-required-checkbox"
                    class="rounded"
                  />
                  <span>Required</span>
                </label>
                <button 
                  id="add-field-btn"
                  class="button primary ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
                </button>
              </div>
            </div>
          </div>
          
          <div class="space-y-3">
            <h3 class="text-sm font-medium">Current Schema</h3>
            <div id="fields-list" class="space-y-2">
              ${Object.keys(appState.schema.fieldTypes).length === 0
                ? '<p class="text-sm text-muted-foreground">No fields defined yet. Add your first field above.</p>'
                : Object.entries(appState.schema.fieldTypes).map(([field, type]) => `
                  <div class="flex items-center justify-between bg-secondary/50 p-2 rounded-md">
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        ${appState.schema.requiredFields.includes(field) ? 'checked' : ''}
                        data-field="${field}"
                        class="field-required-checkbox rounded"
                      />
                      <span class="text-sm font-medium">${field}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">${type}</span>
                      <button 
                        class="button icon"
                        data-field="${field}"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path></svg>
                      </button>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer flex justify-between">
        <div class="text-xs text-muted-foreground">
          ${Object.keys(appState.schema.fieldTypes).length} fields defined, ${appState.schema.requiredFields.length} required
        </div>
        <button id="save-schema-btn" class="button primary hover-lift">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          Save Schema
        </button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Add event listeners
  const addFieldBtn = document.getElementById('add-field-btn');
  if (addFieldBtn) {
    addFieldBtn.addEventListener('click', addField);
  }
  
  const saveSchemaBtn = document.getElementById('save-schema-btn');
  if (saveSchemaBtn) {
    saveSchemaBtn.addEventListener('click', saveSchema);
  }
  
  // Add event listeners to remove field buttons
  document.querySelectorAll('#fields-list button[data-field]').forEach(button => {
    button.addEventListener('click', (e) => {
      const field = e.currentTarget.getAttribute('data-field');
      removeField(field);
    });
  });
  
  // Add event listeners to field required checkboxes
  document.querySelectorAll('.field-required-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const field = e.currentTarget.getAttribute('data-field');
      toggleRequired(field);
    });
  });
}

function addField() {
  const fieldInput = document.getElementById('new-field-input');
  const typeSelect = document.getElementById('new-type-select');
  const isRequiredCheckbox = document.getElementById('is-required-checkbox');
  
  const field = fieldInput.value.trim();
  const type = typeSelect.value;
  const isRequired = isRequiredCheckbox.checked;
  
  if (!field) {
    showToast('Please enter a field name', 'error');
    return;
  }
  
  if (appState.schema.fieldTypes[field]) {
    showToast('This field already exists', 'error');
    return;
  }
  
  // Add field to schema
  appState.schema.fieldTypes[field] = type;
  
  if (isRequired) {
    appState.schema.requiredFields.push(field);
  }
  
  // Re-render schema
  renderSchemaEditor();
  
  // Clear inputs
  fieldInput.value = '';
  isRequiredCheckbox.checked = false;
  
  updateApiUsageStats();
}

function removeField(field) {
  // Remove field from schema
  delete appState.schema.fieldTypes[field];
  
  // Remove from required fields if present
  appState.schema.requiredFields = appState.schema.requiredFields.filter(f => f !== field);
  
  // Re-render schema
  renderSchemaEditor();
  
  updateApiUsageStats();
}

function toggleRequired(field) {
  const isRequired = appState.schema.requiredFields.includes(field);
  
  if (isRequired) {
    appState.schema.requiredFields = appState.schema.requiredFields.filter(f => f !== field);
  } else {
    appState.schema.requiredFields.push(field);
  }
}

function saveSchema() {
  // Send schema to server
  fetch('/public/api/schema', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appState.schema)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showToast('Schema saved successfully', 'success');
      updateApiUsageStats();
    }
  })
  .catch(error => {
    console.error('Error saving schema:', error);
    showToast('Failed to save schema', 'error');
  });
}

// Control Panel
function initializeControlPanel() {
  const container = document.getElementById('control-panel-container');
  if (!container) return;
  
  // Render control panel
  renderControlPanel();
}

function renderControlPanel() {
  const container = document.getElementById('control-panel-container');
  if (!container) return;
  
  // Create control panel HTML
  const html = `
    <div class="card shadow-sm hover:shadow-md transition-all duration-300">
      <div class="card-header">
        <h2 class="text-xl font-medium">Control Panel</h2>
        <p class="card-description">
          Test API functionality and trigger operations
        </p>
      </div>
      <div class="card-content">
        <div class="space-y-6">
          <div class="space-y-3">
            <h3 class="text-sm font-medium">Test Data Submission</h3>
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-2">
                <label for="source-select" class="text-sm text-muted-foreground">
                  Select Source for Test Data
                </label>
                <select 
                  id="source-select"
                  class="select"
                >
                  <option value="all">All Sources</option>
                  ${appState.sources.map(source => `
                    <option value="${source.id}">${source.name}</option>
                  `).join('')}
                </select>
              </div>
              
              <button 
                id="send-test-data-btn"
                class="button primary hover-lift"
                ${appState.sources.length === 0 ? 'disabled' : ''}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                Send Test Data
              </button>
              
              <div id="last-result" class="hidden mt-2 text-sm flex items-center"></div>
            </div>
          </div>
          
          <div class="space-y-3">
            <h3 class="text-sm font-medium">Manual Operations</h3>
            <div class="flex flex-wrap gap-2">
              <button
                id="trigger-export-btn"
                class="button outline hover-lift"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Trigger CSV Export Now
              </button>
              
              <button
                id="clear-data-btn"
                class="button outline hover-lift"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Add event listeners
  const sendTestDataBtn = document.getElementById('send-test-data-btn');
  if (sendTestDataBtn) {
    sendTestDataBtn.addEventListener('click', sendTestData);
  }
  
  const triggerExportBtn = document.getElementById('trigger-export-btn');
  if (triggerExportBtn) {
    triggerExportBtn.addEventListener('click', triggerExport);
  }
  
  const clearDataBtn = document.getElementById('clear-data-btn');
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', clearAllData);
  }
}

function sendTestData() {
  const sendButton = document.getElementById('send-test-data-btn');
  const resultDiv = document.getElementById('last-result');
  const sourceSelect = document.getElementById('source-select');
  
  if (!sendButton || !resultDiv || !sourceSelect) return;
  
  const selectedSourceId = sourceSelect.value;
  
  if (selectedSourceId === 'all') {
    showToast('Please select a specific source', 'error');
    return;
  }
  
  const selectedSource = appState.sources.find(s => s.id === selectedSourceId);
  
  if (!selectedSource) {
    showToast('Source not found', 'error');
    return;
  }
  
  // Disable button and show loading state
  sendButton.disabled = true;
  sendButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 animate-pulse"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
    Sending...
  `;
  resultDiv.classList.add('hidden');
  
  // Create test data
  const testData = {
    timestamp: new Date().toISOString(),
    sensorId: `test-sensor-${Math.floor(Math.random() * 5) + 1}`,
    temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
    humidity: Math.round(Math.random() * 100),
    pressure: Math.round((Math.random() * 50 + 970) * 10) / 10,
    sourceId: selectedSource.id
  };
  
  // Simulate API call delay
  setTimeout(() => {
    // Add to local data
    appState.data.unshift(testData);
    
    // Update result
    const success = Math.random() > 0.1; // 90% success rate for demo
    
    resultDiv.className = `mt-2 text-sm flex items-center ${success ? 'text-green-600' : 'text-red-600'}`;
    resultDiv.innerHTML = success
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Data received successfully`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Failed to send data`;
    resultDiv.classList.remove('hidden');
    
    // Reset button
    sendButton.disabled = false;
    sendButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      Send Test Data
    `;
    
    // Show toast
    showToast(success ? 'Test data sent successfully' : 'Failed to send test data', success ? 'success' : 'error');
    
    // Update table and stats
    renderDataTable();
    updateApiUsageStats();
  }, 800);
}

function triggerExport() {
  showToast('CSV export triggered successfully', 'success');
}

function clearAllData() {
  // Clear data
  appState.data = [];
  
  // Update table and stats
  renderDataTable();
  updateApiUsageStats();
  
  showToast('All data cleared successfully', 'success');
}

// Data Table
function initializeDataTable() {
  const container = document.getElementById('data-table-container');
  if (!container) return;
  
  // Render data table
  renderDataTable();
  
  // Add event listener for search input
  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'search-data-input') {
      renderDataTable();
    }
  });
  
  // Add event listener for source filter
  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'filter-source-select') {
      appState.selectedSource = e.target.value;
      renderDataTable();
    }
  });
}

function renderDataTable() {
  const container = document.getElementById('data-table-container');
  if (!container) return;
  
  // Get search term if search input exists
  const searchInput = document.getElementById('search-data-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  
  // Filter data
  let filteredData = [...appState.data];
  
  // Filter by source
  if (appState.selectedSource !== 'all') {
    filteredData = filteredData.filter(entry => entry.sourceId === appState.selectedSource);
  }
  
  // Filter by search term
  if (searchTerm) {
    filteredData = filteredData.filter(entry => {
      return Object.values(entry).some(value => 
        value !== null && 
        value !== undefined && 
        String(value).toLowerCase().includes(searchTerm)
      );
    });
  }
  
  // Get all columns dynamically from data
  const getColumns = () => {
    if (appState.data.length === 0) return ['No Data'];
    
    // Get all unique keys, prioritizing common ones
    const priorityKeys = ['timestamp', 'id', 'sourceId', 'sensorId'];
    const allKeys = new Set();
    
    // Add priority keys first
    priorityKeys.forEach(key => allKeys.add(key));
    
    // Add all other keys
    appState.data.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (!priorityKeys.includes(key)) {
          allKeys.add(key);
        }
      });
    });
    
    return Array.from(allKeys);
  };
  
  const columns = getColumns();
  
  // Create table HTML
  const html = `
    <div class="card shadow-sm hover:shadow-md transition-all duration-300">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <span class="text-xl font-medium">Received Data</span>
          <div class="flex gap-2">
            <button 
              id="clear-table-data-btn"
              class="button outline sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Clear
            </button>
            <button 
              id="export-csv-btn"
              class="button primary sm"
              ${filteredData.length === 0 ? 'disabled' : ''}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
            </button>
          </div>
        </div>
        <p class="card-description">
          View and manage data received from your API
        </p>
        
        <div class="flex flex-col gap-2 sm:flex-row mt-2">
          <div class="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              id="search-data-input"
              placeholder="Search data..."
              class="input pl-8"
              value="${searchTerm}"
            />
          </div>
          <div class="w-full sm:w-48">
            <select 
              id="filter-source-select"
              class="select w-full"
            >
              <option value="all" ${appState.selectedSource === 'all' ? 'selected' : ''}>All Sources</option>
              ${appState.sources.map(source => `
                <option value="${source.id}" ${appState.selectedSource === source.id ? 'selected' : ''}>${source.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="card-content p-0">
        <div class="rounded-md border">
          <div class="relative overflow-auto max-h-[400px]">
            <table class="table w-full">
              <thead class="sticky top-0 bg-secondary">
                <tr>
                  ${columns.map(column => `
                    <th class="whitespace-nowrap">${column === 'sourceId' ? 'Source' : column}</th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${filteredData.length > 0 
                  ? filteredData.map((entry, index) => `
                    <tr class="animate-fade-in">
                      ${columns.map(column => `
                        <td class="whitespace-nowrap">${formatCellValue(column, entry[column])}</td>
                      `).join('')}
                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td colspan="${columns.length}" class="h-24 text-center">
                        No data available
                      </td>
                    </tr>
                  `
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="card-footer py-3 text-sm text-muted-foreground">
        Showing ${filteredData.length} of ${appState.data.length} entries
        ${appState.selectedSource !== 'all' ? ` for ${getSourceName(appState.selectedSource)}` : ''}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Add event listeners
  const clearTableDataBtn = document.getElementById('clear-table-data-btn');
  if (clearTableDataBtn) {
    clearTableDataBtn.addEventListener('click', clearAllData);
  }
  
  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportTableToCSV);
  }
}

function formatCellValue(key, value) {
  if (value === undefined || value === null) return '-';
  if (key === 'sourceId') return getSourceName(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getSourceName(sourceId) {
  if (!sourceId) return 'Unknown';
  const source = appState.sources.find(s => s.id === sourceId);
  return source ? source.name : sourceId;
}

function exportTableToCSV() {
  // Filter data
  let filteredData = [...appState.data];
  
  // Filter by source
  if (appState.selectedSource !== 'all') {
    filteredData = filteredData.filter(entry => entry.sourceId === appState.selectedSource);
  }
  
  // Get search term if search input exists
  const searchInput = document.getElementById('search-data-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  
  // Filter by search term
  if (searchTerm) {
    filteredData = filteredData.filter(entry => {
      return Object.values(entry).some(value => 
        value !== null && 
        value !== undefined && 
        String(value).toLowerCase().includes(searchTerm)
      );
    });
  }
  
  if (filteredData.length === 0) {
    showToast('No data to export', 'error');
    return;
  }
  
  // Get all columns
  const columns = Object.keys(filteredData[0]);
  
  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add headers
  csvContent += columns.join(",") + "\r\n";
  
  // Add rows
  filteredData.forEach(entry => {
    const row = columns.map(column => {
      const value = entry[column];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';').replace(/"/g, '""');
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvContent += row.join(",") + "\r\n";
  });
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `data_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  
  // Download file
  link.click();
  
  // Remove link
  document.body.removeChild(link);
  
  showToast('CSV file exported successfully', 'success');
}

// API Instructions
function initializeApiInstructions() {
  const container = document.getElementById('api-instructions-container');
  if (!container) return;
  
  updateApiInstructions();
}

function updateApiInstructions() {
  const container = document.getElementById('api-instructions-container');
  if (!container) return;
  
  const domainName = window.location.origin || 'https://your-domain.com';
  const apiEndpoint = `${domainName}/public/api/data`;
  const apiKey = appState.apiKey || 'YOUR_API_KEY';
  
  const curlExample = `curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "sensorId": "sensor-1",
    "temperature": 25.4,
    "humidity": 68,
    "pressure": 1013.2
  }'`;

  const jsExample = `// Using fetch API
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

  const pythonExample = `import requests
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
  
  // Create API instructions HTML
  const html = `
    <div class="card shadow-sm hover:shadow-md transition-all duration-300">
      <div class="card-header">
        <div class="flex items-center gap-2 text-xl font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 12a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1z"></path><path d="M14 12a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1z"></path><path d="M10 17a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1z"></path><path d="M14 17a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h1z"></path></svg>
          API Integration Guide
        </div>
        <p class="card-description">
          Instructions for integrating with your data consolidation API
        </p>
      </div>
      <div class="card-content">
        <div class="space-y-6">
          <div class="space-y-2">
            <h3 class="text-sm font-medium">Endpoint and Authentication</h3>
            <p class="text-sm text-muted-foreground">
              Send your data to the following endpoint using your API key for authentication:
            </p>
            <div class="flex items-center justify-between bg-secondary p-3 rounded-md">
              <code class="text-xs sm:text-sm break-all">${apiEndpoint}</code>
              <button 
                class="button ghost sm copy-endpoint-btn"
                data-copy="${apiEndpoint}"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-2">
              <span class="font-medium flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="1"></circle></svg> 
                Note:
              </span> This endpoint will automatically use your domain name. After deployment to SiteGround, this will reflect your actual server address.
            </p>
          </div>
          
          <div class="space-y-3">
            <h3 class="text-sm font-medium">Request Format</h3>
            <div class="tabs" id="api-example-tabs">
              <div class="tabs-header">
                <button class="tab-button active" data-tab="curl">cURL</button>
                <button class="tab-button" data-tab="js">JavaScript</button>
                <button class="tab-button" data-tab="python">Python</button>
              </div>
              
              <div class="tab-content">
                <div class="tab-pane active" id="curl-tab">
                  <div class="relative">
                    <div class="bg-secondary p-3 rounded-md overflow-x-auto">
                      <pre class="text-xs sm:text-sm whitespace-pre-wrap">${curlExample}</pre>
                    </div>
                    <button 
                      class="button ghost sm absolute top-2 right-2 copy-code-btn"
                      data-copy="${curlExample}"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
                
                <div class="tab-pane" id="js-tab">
                  <div class="relative">
                    <div class="bg-secondary p-3 rounded-md overflow-x-auto">
                      <pre class="text-xs sm:text-sm whitespace-pre-wrap">${jsExample}</pre>
                    </div>
                    <button 
                      class="button ghost sm absolute top-2 right-2 copy-code-btn"
                      data-copy="${jsExample}"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
                
                <div class="tab-pane" id="python-tab">
                  <div class="relative">
                    <div class="bg-secondary p-3 rounded-md overflow-x-auto">
                      <pre class="text-xs sm:text-sm whitespace-pre-wrap">${pythonExample}</pre>
                    </div>
                    <button 
                      class="button ghost sm absolute top-2 right-2 copy-code-btn"
                      data-copy="${pythonExample}"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="space-y-2">
            <h3 class="text-sm font-medium">CSV Export Schedule</h3>
            <p class="text-sm text-muted-foreground">
              All data received throughout the day will be automatically consolidated into a CSV file and exported 
              to your configured Dropbox location at midnight UTC. You can also trigger manual exports from the Control Panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Initialize tabs
  const apiTabButtons = document.querySelectorAll('#api-example-tabs .tab-button');
  
  apiTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and panes
      document.querySelectorAll('#api-example-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('#api-example-tabs .tab-pane').forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Add copy button functionality
  document.querySelectorAll('.copy-endpoint-btn, .copy-code-btn').forEach(button => {
    button.addEventListener('click', () => {
      const textToCopy = button.getAttribute('data-copy');
      
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          showToast('Copied to clipboard!', 'success');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          showToast('Failed to copy to clipboard', 'error');
        });
    });
  });
}

// Helper Functions for updating stats
function updateApiUsageStats() {
  updateTotalDataPoints();
  updateActiveSources();
  updateUniqueSources();
  updateLastReceived();
  updateDataTypes();
}

function updateTotalDataPoints() {
  const element = document.getElementById('total-data-points');
  if (element) {
    element.textContent = appState.data.length.toString();
  }
}

function updateActiveSources() {
  const element = document.getElementById('active-sources');
  if (element) {
    const activeSources = appState.sources.filter(source => 
      appState.data.some(data => data.sourceId === source.id)
    ).length;
    
    element.textContent = `${activeSources}/${appState.sources.length}`;
  }
}

function updateUniqueSources() {
  const element = document.getElementById('unique-sources');
  if (element) {
    const uniqueSources = new Set(
      appState.data.map(data => data.sourceId).filter(Boolean)
    ).size;
    
    element.textContent = uniqueSources.toString();
  }
}

function updateLastReceived() {
  const element = document.getElementById('last-received');
  if (element) {
    if (appState.data.length === 0) {
      element.textContent = 'No data';
      return;
    }
    
    // Sort data by timestamp (newest first)
    const sortedData = [...appState.data].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    const latestTimestamp = sortedData[0].timestamp;
    
    try {
      const date = new Date(latestTimestamp);
      element.textContent = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } catch (e) {
      element.textContent = latestTimestamp;
    }
  }
}

function updateDataTypes() {
  const element = document.getElementById('data-types');
  if (element) {
    element.textContent = Object.keys(appState.schema.fieldTypes).length.toString();
  }
}

// Data loading functions
function loadData() {
  // For demo, create some sample data
  appState.data = Array.from({ length: 10 }, (_, i) => ({
    id: `data_${i}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    sensorId: `sensor-${Math.floor(Math.random() * 5) + 1}`,
    temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
    humidity: Math.round(Math.random() * 100),
    pressure: Math.round((Math.random() * 50 + 970) * 10) / 10,
    sourceId: i % 2 === 0 ? 'src_1' : 'src_2'
  }));
  
  renderDataTable();
}

function loadSources() {
  // For demo, create some sample sources
  if (appState.sources.length === 0) {
    appState.sources = [
      {
        id: 'src_1',
        name: 'Weather Station',
        url: 'https://api.example.com/weather',
        type: 'json',
        dateAdded: new Date().toISOString(),
        apiKey: 'demo_key_1'
      },
      {
        id: 'src_2',
        name: 'Smart Factory',
        url: 'https://api.factory.com/sensors',
        type: 'csv',
        dateAdded: new Date().toISOString(),
        apiKey: 'demo_key_2'
      }
    ];
  }
  
  renderSourcesManager();
  updateSourcesDropdown();
}

function loadSchema() {
  // For demo, create sample schema
  if (Object.keys(appState.schema.fieldTypes).length === 0) {
    appState.schema = {
      requiredFields: ['sensorId', 'timestamp'],
      fieldTypes: {
        sensorId: 'string',
        timestamp: 'string',
        temperature: 'number',
        humidity: 'number',
        pressure: 'number'
      }
    };
  }
  
  renderSchemaEditor();
}
