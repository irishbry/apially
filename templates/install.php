
<div class="container mx-auto">
    <h1 class="text-2xl font-bold mb-6">Installation Guide</h1>
    
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">All-in-One Installation Package</h2>
            <p class="card-description">Creates a complete, self-installing package with both frontend and backend components</p>
        </div>
        <div class="card-content">
            <div class="space-y-6">
                <div class="alert alert-info mb-4">
                    <h3 class="font-semibold mb-1">Automatic Installation</h3>
                    <p class="mb-2">This tool creates a single installation package that will automatically set up both the frontend interface and the backend API on your server.</p>
                    <p>Just download, upload to your server, and run the installer!</p>
                </div>

                <div class="p-4 bg-gray-50 rounded-md">
                    <h3 class="text-sm font-semibold mb-2">How It Works</h3>
                    <ol class="list-decimal list-inside space-y-2 text-sm">
                        <li><strong>Download</strong> the installation package below</li>
                        <li><strong>Upload</strong> all files in the ZIP to your web server (via FTP or cPanel)</li>
                        <li><strong>Maintain the directory structure</strong> exactly as it is in the ZIP file</li>
                        <li><strong>Run</strong> install.php by visiting it in your browser (e.g., yourdomain.com/install.php)</li>
                        <li>Follow the on-screen instructions to complete the installation</li>
                    </ol>
                </div>
                
                <div class="flex justify-center">
                    <button id="download-installer-btn" class="button button-primary px-8 py-3 text-lg">
                        Download All-in-One Installer
                    </button>
                </div>
                
                <hr class="my-6 border-gray-200">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-green-50 border border-green-100 rounded-md">
                        <h3 class="text-sm font-semibold text-green-800 mb-2">
                            What's Included
                        </h3>
                        <ul class="list-disc list-inside space-y-1 text-sm text-green-700">
                            <li><strong>install.php</strong> - Main installer script</li>
                            <li><strong>index.html</strong> - Frontend interface</li>
                            <li><strong>assets/</strong> - CSS and JavaScript files</li>
                            <li><strong>api/</strong> - Backend PHP API</li>
                            <li><strong>api/data/</strong> - Data storage directory</li>
                            <li><strong>README.md</strong> - Installation instructions</li>
                        </ul>
                    </div>
                    
                    <div class="p-4 bg-amber-50 border border-amber-100 rounded-md">
                        <h3 class="text-sm font-semibold text-amber-800 mb-2">
                            Server Requirements
                        </h3>
                        <ul class="list-disc list-inside space-y-1 text-sm text-amber-700">
                            <li>PHP 7.0 or higher</li>
                            <li>Apache with mod_rewrite enabled</li>
                            <li>PHP extensions: curl, json</li>
                            <li>Write permissions (chmod 755) for the installation directory</li>
                            <li>AllowOverride All in Apache configuration</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="card-footer bg-gray-50 p-4 flex justify-between items-center">
            <div class="text-sm text-gray">
                <span>Need more detailed instructions?</span>
            </div>
            <a href="index.php?page=deploy" class="button button-outline">View Detailed Guide</a>
        </div>
    </div>
</div>

<script>
// Install page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const downloadInstallerBtn = document.getElementById('download-installer-btn');
    
    // Download installer button
    if (downloadInstallerBtn) {
        downloadInstallerBtn.addEventListener('click', () => {
            app.showToast('Preparing installation package...', 'info');
            
            // Simulate download preparation
            setTimeout(() => {
                app.showToast('Installation package downloaded', 'success');
            }, 2000);
        });
    }
});
</script>
