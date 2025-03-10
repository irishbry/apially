
<div class="container mx-auto">
    <h1 class="text-2xl font-bold mb-6">Consolidated Data</h1>
    
    <div class="card mb-6">
        <div class="card-header">
            <h2 class="card-title">Data Preview</h2>
            <p class="card-description">View and export your consolidated data</p>
        </div>
        <div class="card-content">
            <div class="mb-4 flex justify-between items-center">
                <div>
                    <button id="refresh-data-btn" class="button button-outline">Refresh Data</button>
                </div>
                <div>
                    <button id="export-csv-btn" class="button button-primary">Export CSV</button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="table table-hover w-full">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Date</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody id="data-table-body">
                        <!-- Sample data for demonstration -->
                        <tr>
                            <td>1001</td>
                            <td>John</td>
                            <td>Smith</td>
                            <td>john@example.com</td>
                            <td>2023-05-15</td>
                            <td>$125.50</td>
                        </tr>
                        <tr>
                            <td>1002</td>
                            <td>Sarah</td>
                            <td>Johnson</td>
                            <td>sarah@example.com</td>
                            <td>2023-05-16</td>
                            <td>$89.99</td>
                        </tr>
                        <tr>
                            <td>1003</td>
                            <td>Michael</td>
                            <td>Brown</td>
                            <td>michael@example.com</td>
                            <td>2023-05-17</td>
                            <td>$210.75</td>
                        </tr>
                        <!-- More rows would be generated dynamically -->
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4 text-right">
                <span class="text-sm text-gray">Showing 3 of 250 records</span>
            </div>
        </div>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Data Processing</h2>
        </div>
        <div class="card-content">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <h3 class="font-semibold mb-2">Sources</h3>
                    <div class="p-4 bg-gray-50 rounded">
                        <div class="text-xl font-bold">3</div>
                        <div class="text-sm text-gray">Active data sources</div>
                    </div>
                </div>
                
                <div>
                    <h3 class="font-semibold mb-2">Fields</h3>
                    <div class="p-4 bg-gray-50 rounded">
                        <div class="text-xl font-bold">6</div>
                        <div class="text-sm text-gray">Mapped schema fields</div>
                    </div>
                </div>
                
                <div>
                    <h3 class="font-semibold mb-2">Records</h3>
                    <div class="p-4 bg-gray-50 rounded">
                        <div class="text-xl font-bold">250</div>
                        <div class="text-sm text-gray">Total consolidated records</div>
                    </div>
                </div>
            </div>
            
            <div class="mt-6">
                <button id="process-data-btn" class="button button-primary">Process All Data</button>
                <p class="mt-2 text-sm text-gray">Last processed: Today at 2:30 PM</p>
            </div>
        </div>
    </div>
</div>

<script>
// Data page specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const refreshDataBtn = document.getElementById('refresh-data-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const processDataBtn = document.getElementById('process-data-btn');
    
    // Refresh data button
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', () => {
            app.showToast('Refreshing data...', 'info');
            
            // Simulate loading
            setTimeout(() => {
                app.showToast('Data refreshed successfully', 'success');
            }, 1500);
        });
    }
    
    // Export CSV button
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            app.showToast('Preparing CSV export...', 'info');
            
            // Simulate export
            setTimeout(() => {
                app.showToast('CSV exported successfully', 'success');
            }, 1500);
        });
    }
    
    // Process data button
    if (processDataBtn) {
        processDataBtn.addEventListener('click', () => {
            app.showToast('Processing all data sources...', 'info');
            
            // Simulate processing
            setTimeout(() => {
                app.showToast('Data processing complete', 'success');
            }, 2000);
        });
    }
});
</script>
