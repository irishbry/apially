document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Event listeners for deploy tab switching
    document.querySelectorAll('[data-deploy-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-deploy-tab');
            switchDeployTab(tabName);
        });
    });

    // Event listener for form submission
    const apiKeyForm = document.getElementById('api-key-form');
    if (apiKeyForm) {
        apiKeyForm.addEventListener('submit', handleApiKeySubmit);
    }

    // Event listener for Dropbox link submission
    const dropboxLinkForm = document.getElementById('dropbox-link-form');
    if (dropboxLinkForm) {
        dropboxLinkForm.addEventListener('submit', handleDropboxLinkSubmit);
    }

    // Event listener for schema submission
    const schemaForm = document.getElementById('schema-form');
    if (schemaForm) {
        schemaForm.addEventListener('submit', handleSchemaSubmit);
    }

    // Event listener for data clearing
    const clearDataButton = document.getElementById('clear-data-button');
    if (clearDataButton) {
        clearDataButton.addEventListener('click', handleClearData);
    }

    // Event listener for CSV export
    const exportCsvButton = document.getElementById('export-csv-button');
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', handleExportCsv);
    }

    // Event listener for adding a new source
    const addSourceForm = document.getElementById('add-source-form');
    if (addSourceForm) {
        addSourceForm.addEventListener('submit', handleAddSourceSubmit);
    }

    // Event listener for toggling source active state
    document.getElementById('sources-list')?.addEventListener('click', function(event) {
        if (event.target.classList.contains('toggle-source-active')) {
            const sourceId = event.target.dataset.sourceId;
            toggleSourceActive(sourceId);
        }
    });

    // Event listener for regenerating API key
    document.getElementById('sources-list')?.addEventListener('click', function(event) {
        if (event.target.classList.contains('regenerate-api-key')) {
            const sourceId = event.target.dataset.sourceId;
            regenerateApiKey(sourceId);
        }
    });

    // Event listener for deleting a source
    document.getElementById('sources-list')?.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-source')) {
            const sourceId = event.target.dataset.sourceId;
            deleteSource(sourceId);
        }
    });

    // Initial tab setup
    switchTab('basic');
    switchDeployTab('instructions');

    // Load initial data
    loadData();
    loadSources();
    loadSchema();

    // Function to switch tabs
    function switchTab(tabName) {
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.remove('active');
        });

        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        const selectedPane = document.getElementById(`${tabName}-tab`);

        if (selectedTab) selectedTab.classList.add('active');
        if (selectedPane) selectedPane.classList.add('active');
    }

    // Function to switch deploy tabs
    function switchDeployTab(tabName) {
        document.querySelectorAll('.deploy-tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.querySelectorAll('[data-deploy-tab]').forEach(tab => {
            tab.classList.remove('active');
        });

        const selectedTab = document.querySelector(`[data-deploy-tab="${tabName}"]`);
        const selectedPane = document.getElementById(`${tabName}-deploy-tab`);

        if (selectedTab) selectedTab.classList.add('active');
        if (selectedPane) selectedPane.classList.add('active');
    }

    // Function to handle API key submission
    function handleApiKeySubmit(event) {
        event.preventDefault();
        const apiKey = document.getElementById('api-key').value;
        setApiKey(apiKey);
    }

    // Function to handle Dropbox link submission
    function handleDropboxLinkSubmit(event) {
        event.preventDefault();
        const dropboxLink = document.getElementById('dropbox-link').value;
        setDropboxLink(dropboxLink);
    }

    // Function to handle schema submission
    function handleSchemaSubmit(event) {
        event.preventDefault();
        const schemaFields = Array.from(document.querySelectorAll('#fields-list > div')).map(field => {
            const fieldName = field.querySelector('.field-name').value;
            const fieldType = field.querySelector('.field-type').value;
            const isRequired = field.querySelector('.field-required').checked;
            return { name: fieldName, type: fieldType, required: isRequired };
        });

        const requiredFields = schemaFields.filter(field => field.required).map(field => field.name);
        const fieldTypes = schemaFields.reduce((obj, field) => {
            obj[field.name] = field.type;
            return obj;
        }, {});

        const schema = { requiredFields: requiredFields, fieldTypes: fieldTypes };
        setSchema(schema);
    }

    // Function to handle clearing data
    function handleClearData() {
        clearData();
    }

    // Function to handle CSV export
    function handleExportCsv() {
        exportCsv();
    }

    // Function to handle adding a new source
    function handleAddSourceSubmit(event) {
        event.preventDefault();
        const sourceName = document.getElementById('source-name').value;
        addSource(sourceName);
    }

    // Function to toggle source active state
    function toggleSourceActive(sourceId) {
        const apiUrl = `/api/toggleSourceActive?id=${sourceId}`;

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'Source active state updated successfully.', 'success');
                loadSources(); // Reload sources to reflect changes
            } else {
                showToast('Error', 'Failed to update source active state.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error updating source active state.', 'error');
        });
    }

    // Function to regenerate API key
    function regenerateApiKey(sourceId) {
        const apiUrl = `/api/regenerateApiKey?id=${sourceId}`;

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'API key regenerated successfully.', 'success');
                loadSources(); // Reload sources to reflect changes
            } else {
                showToast('Error', 'Failed to regenerate API key.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error regenerating API key.', 'error');
        });
    }

    // Function to delete a source
    function deleteSource(sourceId) {
        const apiUrl = `/api/deleteSource?id=${sourceId}`;

        fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'Source deleted successfully.', 'success');
                loadSources(); // Reload sources to reflect changes
                loadData(); // Reload data to reflect changes
            } else {
                showToast('Error', 'Failed to delete source.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error deleting source.', 'error');
        });
    }

    // Function to load data from the API
    function loadData() {
        const apiUrl = '/api/data';

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    displayData(data);
                } else {
                    console.error('Data is not an array:', data);
                    showToast('Error', 'Failed to load data.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Error', 'Error loading data.', 'error');
            });
    }

    // Function to load sources from the API
    function loadSources() {
        const apiUrl = '/api/sources';

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data && Array.isArray(data.sources)) {
                    displaySources(data.sources);
                } else {
                    console.error('Sources data is invalid:', data);
                    showToast('Error', 'Failed to load sources.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Error', 'Error loading sources.', 'error');
            });
    }

    // Function to load schema from the API
    function loadSchema() {
        const apiUrl = '/api/schema';

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data && data.schema) {
                    displaySchema(data.schema);
                } else {
                    console.error('Schema data is invalid:', data);
                    showToast('Error', 'Failed to load schema.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Error', 'Error loading schema.', 'error');
            });
    }

    // Function to set API key
    function setApiKey(apiKey) {
        const apiUrl = '/api/api-key';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey: apiKey })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'API key updated successfully.', 'success');
            } else {
                showToast('Error', 'Failed to update API key.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error updating API key.', 'error');
        });
    }

    // Function to set Dropbox link
    function setDropboxLink(dropboxLink) {
        const apiUrl = '/api/dropbox-link';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dropboxLink: dropboxLink })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'Dropbox link updated successfully.', 'success');
            } else {
                showToast('Error', 'Failed to update Dropbox link.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error updating Dropbox link.', 'error');
        });
    }

    // Function to set schema
    function setSchema(schema) {
        const apiUrl = '/api/schema';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(schema)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'Schema updated successfully.', 'success');
            } else {
                showToast('Error', 'Failed to update schema.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error updating schema.', 'error');
        });
    }

    // Function to clear data
    function clearData() {
        const apiUrl = '/api/clear-data';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'Data cleared successfully.', 'success');
                loadData(); // Reload data to reflect changes
            } else {
                showToast('Error', 'Failed to clear data.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error clearing data.', 'error');
        });
    }

    // Function to export CSV
    function exportCsv() {
        const apiUrl = '/api/export-csv';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'CSV export initiated successfully.', 'success');
            } else {
                showToast('Error', 'Failed to initiate CSV export.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error initiating CSV export.', 'error');
        });
    }

    // Function to add a new source
    function addSource(sourceName) {
        const apiUrl = '/api/sources';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: sourceName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', 'Source added successfully.', 'success');
                loadSources(); // Reload sources to reflect changes
            } else {
                showToast('Error', 'Failed to add source.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Error adding source.', 'error');
        });
    }

    // Function to display data in the table
    function displayData(data) {
        const dataTableBody = document.getElementById('data-table-body');
        if (!dataTableBody) return;

        dataTableBody.innerHTML = ''; // Clear existing data

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id || ''}</td>
                <td>${item.timestamp || ''}</td>
                <td>${item.sourceId || ''}</td>
                <td>${JSON.stringify(item)}</td>
            `;
            dataTableBody.appendChild(row);
        });
    }

    // Function to display sources in the sources list
    function displaySources(sources) {
        const sourcesList = document.getElementById('sources-list');
        if (!sourcesList) return;

        sourcesList.innerHTML = ''; // Clear existing sources

        sources.forEach(source => {
            const sourceDiv = document.createElement('div');
            sourceDiv.className = 'source-item p-4 border rounded mb-2 flex items-center justify-between';
            sourceDiv.innerHTML = `
                <div>
                    <h3 class="font-bold">${source.name}</h3>
                    <p class="text-sm text-gray-500">API Key: ${source.apiKey}</p>
                    <p class="text-sm text-gray-500">Created At: ${source.createdAt}</p>
                    <p class="text-sm text-gray-500">Data Count: ${source.dataCount}</p>
                    <p class="text-sm text-gray-500">Active: ${source.active ? 'Yes' : 'No'}</p>
                    ${source.lastActive ? `<p class="text-sm text-gray-500">Last Active: ${source.lastActive}</p>` : ''}
                </div>
                <div class="flex gap-2">
                    <button class="toggle-source-active bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" data-source-id="${source.id}">
                        Toggle Active
                    </button>
                    <button class="regenerate-api-key bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" data-source-id="${source.id}">
                        Regenerate API Key
                    </button>
                    <button class="delete-source bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" data-source-id="${source.id}">
                        Delete
                    </button>
                </div>
            `;
            sourcesList.appendChild(sourceDiv);
        });
    }

    // Function to display schema in the schema editor
    function displaySchema(schema) {
        const fieldsList = document.getElementById('fields-list');
        if (!fieldsList) return;

        fieldsList.innerHTML = ''; // Clear existing fields

        // Combine requiredFields and fieldTypes to get all unique field names
        const allFields = new Set([...schema.requiredFields, ...Object.keys(schema.fieldTypes)]);

        allFields.forEach(fieldName => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'p-4 border rounded mb-2 flex items-center';
            fieldDiv.innerHTML = `
                <input type="text" class="field-name border rounded p-2 mr-2" value="${fieldName}" placeholder="Field Name">
                <select class="field-type border rounded p-2 mr-2">
                    <option value="string" ${schema.fieldTypes[fieldName] === 'string' ? 'selected' : ''}>String</option>
                    <option value="number" ${schema.fieldTypes[fieldName] === 'number' ? 'selected' : ''}>Number</option>
                    <option value="boolean" ${schema.fieldTypes[fieldName] === 'boolean' ? 'selected' : ''}>Boolean</option>
                </select>
                <label class="inline-flex items-center">
                    <input type="checkbox" class="field-required mr-2" ${schema.requiredFields.includes(fieldName) ? 'checked' : ''}>
                    <span class="ml-2">Required</span>
                </label>
            `;
            fieldsList.appendChild(fieldDiv);
        });
    }

    // Function to show toast messages
    function showToast(title, message, type = 'info') {
        const toastContainer = document.createElement('div');
        toastContainer.className = `toast ${type} animate-fade-in`;
        toastContainer.innerHTML = `
            <div class="toast-content">
                <h3 class="toast-title">${title}</h3>
                <p class="toast-message">${message}</p>
            </div>
        `;
        document.body.appendChild(toastContainer);

        // Remove the toast after a delay
        setTimeout(() => {
            toastContainer.classList.remove('animate-fade-in');
            toastContainer.classList.add('animate-fade-out');
            setTimeout(() => {
                document.body.removeChild(toastContainer);
            }, 300);
        }, 3000);
    }

    // Login functionality
    function handleLoginSubmit(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginButton = document.querySelector('.login-form button');
        
        if (!username || !password) {
            showToast('Error', 'Please enter both username and password.', 'error');
            return;
        }
        
        // Show loading state
        loginButton.textContent = 'Logging in...';
        loginButton.disabled = true;
        
        // Make the login request to the PHP backend
        fetch('api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Server response was not OK');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showToast('Login Successful', 'You have been logged in successfully.', 'success');
                localStorage.setItem('csv-api-auth', 'true');
                
                // Delay before page refresh to show the toast
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            } else {
                showToast('Login Failed', 'Invalid username or password. Please try again.', 'error');
                loginButton.textContent = 'Login';
                loginButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            showToast('Error', 'Error connecting to the server', 'error');
            loginButton.textContent = 'Login';
            loginButton.disabled = false;
        });
    }

    // Add event listener to the login form
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
});
