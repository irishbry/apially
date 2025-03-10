
<div class="container mx-auto">
    <h1 class="text-2xl font-bold mb-6">Settings</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2">
            <div class="card mb-6">
                <div class="card-header">
                    <h2 class="card-title">API Configuration</h2>
                    <p class="card-description">Set up your API keys and integration settings</p>
                </div>
                <div class="card-content">
                    <form id="api-key-form">
                        <div class="form-group">
                            <label for="api-key" class="form-label">API Key</label>
                            <input type="text" id="api-key" name="apiKey" placeholder="Enter your API key">
                            <p class="form-hint">This key is used to authenticate API requests to the backend</p>
                        </div>
                        
                        <div class="mt-4">
                            <button type="submit" class="button button-primary">Save API Key</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">User Profile</h2>
                </div>
                <div class="card-content">
                    <form id="user-profile-form">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-group">
                                <label for="username" class="form-label">Username</label>
                                <input type="text" id="username" name="username" value="admin" disabled>
                            </div>
                            
                            <div class="form-group">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" id="email" name="email" value="admin@example.com">
                            </div>
                        </div>
                        
                        <div class="form-group mt-4">
                            <label for="new-password" class="form-label">New Password</label>
                            <input type="password" id="new-password" name="newPassword" placeholder="Enter new password">
                        </div>
                        
                        <div class="form-group">
                            <label for="confirm-password" class="form-label">Confirm Password</label>
                            <input type="password" id="confirm-password" name="confirmPassword" placeholder="Confirm new password">
                        </div>
                        
                        <div class="mt-4">
                            <button type="submit" class="button button-primary">Update Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <div>
            <div class="card mb-6">
                <div class="card-header">
                    <h2 class="card-title">System Information</h2>
                </div>
                <div class="card-content">
                    <div class="space-y-3">
                        <div>
                            <strong class="block text-sm">Version</strong>
                            <span>1.0.0</span>
                        </div>
                        <div>
                            <strong class="block text-sm">PHP Version</strong>
                            <span><?php echo phpversion(); ?></span>
                        </div>
                        <div>
                            <strong class="block text-sm">Server</strong>
                            <span><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></span>
                        </div>
                        <div>
                            <strong class="block text-sm">Last Update</strong>
                            <span><?php echo date('F j, Y'); ?></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Actions</h2>
                </div>
                <div class="card-content">
                    <div class="space-y-3">
                        <button id="clear-cache-btn" class="button button-outline w-full text-left">Clear Cache</button>
                        <button id="backup-btn" class="button button-outline w-full text-left">Backup Configuration</button>
                        <button id="test-connection-btn" class="button button-outline w-full text-left">Test API Connection</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Settings page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const userProfileForm = document.getElementById('user-profile-form');
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    const backupBtn = document.getElementById('backup-btn');
    const testConnectionBtn = document.getElementById('test-connection-btn');
    
    // User profile form
    if (userProfileForm) {
        userProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword && newPassword !== confirmPassword) {
                app.showToast('Passwords do not match', 'error');
                return;
            }
            
            // Simulate profile update
            app.showToast('Profile updated successfully', 'success');
            
            // Clear password fields
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        });
    }
    
    // Action buttons
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            app.showToast('Cache cleared successfully', 'success');
        });
    }
    
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            app.showToast('Backup created successfully', 'success');
        });
    }
    
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', () => {
            app.showToast('Testing API connection...', 'info');
            
            // Simulate API test
            setTimeout(() => {
                fetch('/api/status')
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.status === 'ok') {
                            app.showToast('API connection successful', 'success');
                        } else {
                            app.showToast('API connection failed', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('API test error:', error);
                        app.showToast('API connection failed', 'error');
                    });
            }, 1000);
        });
    }
});
</script>
