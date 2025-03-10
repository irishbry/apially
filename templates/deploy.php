
<div class="container mx-auto">
    <h1 class="text-2xl font-bold mb-6">Deployment Instructions</h1>
    
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Complete Deployment Instructions</h2>
            <p class="card-description">Step-by-step guide for non-technical users to deploy this application</p>
        </div>
        <div class="card-content">
            <div class="space-y-6">
                <div class="alert alert-info mb-4">
                    <h3 class="font-semibold mb-1">This is a Two-Part Application</h3>
                    <p>
                        This application consists of two parts that need to be deployed separately:
                    </p>
                    <ol class="list-decimal list-inside mt-2 ml-2 space-y-1">
                        <li><strong>Frontend (HTML/PHP):</strong> The user interface you see in the browser</li>
                        <li><strong>Backend (PHP API):</strong> The server code that processes and stores data</li>
                    </ol>
                </div>

                <div class="bg-gray-50 p-4 rounded-md">
                    <h4 class="font-semibold mb-2">Step 1: Download Required Files</h4>
                    <p class="mb-2 text-sm">First, you need to download these two packages:</p>
                    <div class="flex flex-col sm:flex-row gap-3 mt-3">
                        <button id="download-frontend-btn" class="button button-outline">Download Frontend Files</button>
                        <button id="download-api-btn" class="button button-outline">Download API Files</button>
                    </div>
                </div>

                <div class="bg-gray-50 p-4 rounded-md">
                    <h4 class="font-semibold mb-2">Step 2: Upload Files to Your Web Server</h4>
                    <p class="mb-2 text-sm">Log into your web hosting control panel (like cPanel or Plesk):</p>
                    <ol class="list-decimal list-inside text-sm space-y-2">
                        <li>Navigate to the file manager</li>
                        <li>Upload the <strong>Frontend files</strong> to your <strong>root directory</strong> (often called public_html, www, or htdocs)</li>
                        <li>Create a folder called <strong>api</strong> in the root directory</li>
                        <li>Upload the <strong>API files</strong> to the <strong>api</strong> folder</li>
                        <li>
                            <strong class="text-amber-800">Make sure hidden files are also uploaded!</strong>
                            <ul class="list-disc list-inside ml-5 text-gray mt-1">
                                <li>In cPanel File Manager: Click "Settings" and check "Show Hidden Files (dotfiles)"</li>
                                <li>In FileZilla (FTP): Go to Server &gt; Force showing hidden files</li>
                            </ul>
                        </li>
                    </ol>
                </div>

                <div class="bg-gray-50 p-4 rounded-md">
                    <h4 class="font-semibold mb-2">Step 3: Check File Structure</h4>
                    <p class="mb-2 text-sm">Your files should be organized like this:</p>
                    <div class="bg-gray-100 p-3 rounded font-mono text-xs whitespace-pre overflow-x-auto">
public_html/ (or www/)
├── index.php       <-- Frontend files
├── js/             <-- Frontend files
│   └── app.js
├── templates/      <-- Frontend files
│   └── ...more files
└── api/             <-- API folder
    ├── index.php    <-- API files
    ├── .htaccess    <-- IMPORTANT! (Hidden file)
    ├── config.php   <-- API files
    └── ...more files</div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-md">
                    <h4 class="font-semibold mb-2">Step 4: Configure the API</h4>
                    <p class="mb-2 text-sm">Edit the <code>config.php</code> file in the api folder:</p>
                    <ol class="list-decimal list-inside text-sm space-y-2">
                        <li>Find the <code>config.php</code> file in the api folder</li>
                        <li>Open it for editing</li>
                        <li>Change <code>'your-secure-api-key-here'</code> to a strong password you create</li>
                        <li>If needed, change the <code>'*'</code> in <code>allowed_origins</code> to your domain (e.g., <code>'https://yourdomain.com'</code>)</li>
                        <li>Save the file</li>
                    </ol>
                </div>

                <div class="bg-gray-50 p-4 rounded-md">
                    <h4 class="font-semibold mb-2">Step 5: Test Your Installation</h4>
                    <p class="mb-2 text-sm">Check if everything is working:</p>
                    <ol class="list-decimal list-inside text-sm space-y-2">
                        <li>Open your browser and go to <code>https://yourdomain.com/</code> to see the frontend</li>
                        <li>Go to <code>https://yourdomain.com/api/test.php</code> to test the API</li>
                        <li>If the test shows all green checks, your API is working correctly!</li>
                    </ol>
                </div>
                
                <div class="mt-6">
                    <h3 class="text-lg font-semibold mb-3">After Deployment: First Steps</h3>
                    <ol class="list-decimal list-inside space-y-2 text-sm">
                        <li>Visit your domain (e.g., <code>https://yourdomain.com</code>) to access the application</li>
                        <li>Log in using the default credentials (username: <code>admin</code>, password: <code>password</code>)</li>
                        <li><strong>Immediately change the password</strong> in the Settings tab</li>
                        <li>Configure your API key to match the one you set in <code>config.php</code></li>
                        <li>Start adding your data sources and configuring your schema</li>
                    </ol>
                </div>
                
                <div class="alert alert-success">
                    <h3 class="font-semibold mb-1">Need More Help?</h3>
                    <p class="text-sm">
                        If you encounter any issues during deployment, please check the Troubleshooting section in the Deployment Guide tab of the application.
                        For direct support, contact us at support@csvscrub.com.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Deploy page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const downloadFrontendBtn = document.getElementById('download-frontend-btn');
    const downloadApiBtn = document.getElementById('download-api-btn');
    
    // Download frontend files button
    if (downloadFrontendBtn) {
        downloadFrontendBtn.addEventListener('click', () => {
            app.showToast('Preparing frontend package...', 'info');
            
            // Simulate download preparation
            setTimeout(() => {
                app.showToast('Frontend package downloaded', 'success');
            }, 1500);
        });
    }
    
    // Download API files button
    if (downloadApiBtn) {
        downloadApiBtn.addEventListener('click', () => {
            app.showToast('Preparing API package...', 'info');
            
            // Simulate download preparation
            setTimeout(() => {
                app.showToast('API package downloaded', 'success');
            }, 1500);
        });
    }
});
</script>
