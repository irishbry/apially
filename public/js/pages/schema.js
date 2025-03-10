
// Schema page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Schema page JavaScript loaded');
    
    // Fetch schema data
    fetch('/api/schema', {
        headers: {
            'X-API-Key': app.state.apiKey
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.schema) {
            app.state.schema = data.schema;
            console.log('Schema loaded:', app.state.schema);
        }
    })
    .catch(error => {
        console.error('Error loading schema:', error);
    });
});
