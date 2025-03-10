
// Settings page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page JavaScript loaded');
    
    // Pre-fill api key form with saved value
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput && app.state.apiKey) {
        apiKeyInput.value = app.state.apiKey;
    }
});
