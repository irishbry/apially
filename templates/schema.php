
<div class="container mx-auto">
    <h1 class="text-2xl font-bold mb-6">Schema Mapping</h1>
    
    <div class="card mb-6">
        <div class="card-header">
            <h2 class="card-title">Field Mappings</h2>
            <p class="card-description">Define how fields from different sources map to your unified schema</p>
        </div>
        <div class="card-content">
            <div class="alert alert-info mb-4">
                <p>Schema mapping allows you to normalize data from different sources. Define your target fields and map source fields to them.</p>
            </div>
            
            <div id="schema-editor">
                <div class="mb-4">
                    <h3 class="font-semibold mb-2">Target Fields</h3>
                    <div id="target-fields">
                        <div class="flex items-center mb-2">
                            <input type="text" placeholder="Add a target field" id="new-field-input" class="flex-1">
                            <button id="add-field-btn" class="button button-primary ml-2">Add Field</button>
                        </div>
                        <div id="fields-list" class="mt-4">
                            <!-- Field chips will be generated here -->
                            <div class="text-center p-4 text-gray">No fields defined yet. Add your first field above.</div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6">
                    <h3 class="font-semibold mb-2">Source Mappings</h3>
                    <p class="text-sm text-gray mb-4">For each data source, map their fields to your target schema fields.</p>
                    
                    <div id="source-mappings">
                        <!-- Mapping UI will be generated here -->
                        <div class="text-center p-4 text-gray">Add target fields and data sources first to create mappings.</div>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end">
                    <button id="save-schema-btn" class="button button-primary">Save Schema</button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Schema page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const addFieldBtn = document.getElementById('add-field-btn');
    const newFieldInput = document.getElementById('new-field-input');
    const fieldsList = document.getElementById('fields-list');
    const saveSchemaBtn = document.getElementById('save-schema-btn');
    
    // Sample fields for demonstration
    const sampleFields = ['customer_id', 'first_name', 'last_name', 'email', 'purchase_date', 'amount'];
    
    // Display sample fields
    if (fieldsList) {
        fieldsList.innerHTML = '';
        sampleFields.forEach(field => {
            const fieldChip = document.createElement('div');
            fieldChip.className = 'inline-block bg-primary text-white rounded-full px-3 py-1 text-sm mr-2 mb-2';
            fieldChip.innerHTML = `
                ${field}
                <button class="ml-2 text-white" data-field="${field}">&times;</button>
            `;
            fieldsList.appendChild(fieldChip);
        });
    }
    
    // Add new field
    if (addFieldBtn && newFieldInput) {
        addFieldBtn.addEventListener('click', () => {
            const fieldName = newFieldInput.value.trim();
            if (fieldName) {
                const fieldChip = document.createElement('div');
                fieldChip.className = 'inline-block bg-primary text-white rounded-full px-3 py-1 text-sm mr-2 mb-2';
                fieldChip.innerHTML = `
                    ${fieldName}
                    <button class="ml-2 text-white" data-field="${fieldName}">&times;</button>
                `;
                fieldsList.appendChild(fieldChip);
                newFieldInput.value = '';
                
                // Show success message
                app.showToast(`Field "${fieldName}" added`, 'success');
            }
        });
    }
    
    // Simulate save schema
    if (saveSchemaBtn) {
        saveSchemaBtn.addEventListener('click', () => {
            app.showToast('Schema saved successfully', 'success');
        });
    }
    
    // Remove field when clicking the x button
    document.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-field')) {
            const fieldName = e.target.getAttribute('data-field');
            e.target.parentElement.remove();
            app.showToast(`Field "${fieldName}" removed`, 'info');
        }
    });
});
</script>
