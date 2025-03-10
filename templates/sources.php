
<div class="container mx-auto">
    <h1 class="text-2xl font-bold mb-6">Data Sources</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Your Data Sources</h2>
                    <p class="card-description">Manage your CSV and data source connections</p>
                </div>
                <div class="card-content">
                    <div id="sources-list" class="space-y-4">
                        <!-- Sources will be loaded here via JavaScript -->
                        <div class="text-center p-4 text-gray">Loading sources...</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div>
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Add New Source</h2>
                </div>
                <div class="card-content">
                    <form id="source-form">
                        <div class="form-group">
                            <label for="source-name" class="form-label">Source Name</label>
                            <input type="text" id="source-name" name="name" required placeholder="e.g., Sales Data">
                        </div>
                        
                        <div class="form-group">
                            <label for="source-url" class="form-label">Source URL</label>
                            <input type="text" id="source-url" name="url" required placeholder="https://example.com/data.csv">
                        </div>
                        
                        <div class="form-group">
                            <label for="source-type" class="form-label">Source Type</label>
                            <select id="source-type" name="type">
                                <option value="csv">CSV File</option>
                                <option value="json">JSON API</option>
                                <option value="xml">XML Feed</option>
                                <option value="excel">Excel File</option>
                            </select>
                        </div>
                        
                        <div class="mt-4">
                            <button type="submit" class="button button-primary">Add Source</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card mt-6">
                <div class="card-header">
                    <h2 class="card-title">Need Help?</h2>
                </div>
                <div class="card-content">
                    <p class="mb-4">Learn how to connect to different data sources:</p>
                    <ul class="list-disc list-inside space-y-2">
                        <li>Google Sheets</li>
                        <li>Dropbox files</li>
                        <li>FTP servers</li>
                        <li>REST APIs</li>
                    </ul>
                    <div class="mt-4">
                        <button class="button button-outline">View Documentation</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
