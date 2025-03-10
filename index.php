
<?php
// Include configuration
require_once 'public/api/config.php';
require_once 'public/api/utils/api_utils.php';

// Check for authentication
$isAuthenticated = false;
session_start();
if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
    $isAuthenticated = true;
}

// Handle login POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Validate credentials (using same demo credentials as before)
    if ($username === $config['demo_user'] && $password === $config['demo_password']) {
        $_SESSION['authenticated'] = true;
        $_SESSION['username'] = $username;
        $isAuthenticated = true;
        
        // Redirect to prevent form resubmission
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    } else {
        $loginError = "Invalid username or password";
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <title>CSV Consolidator Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
  </head>
  <body>
    <div id="root">
      <?php if (!$isAuthenticated): ?>
        <!-- Login Form -->
        <div class="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center p-4">
          <div class="login-form w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-2xl border-2 border-primary">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-gray-900">Login</h2>
              <p class="mt-2 text-gray-600">Enter your credentials to access the dashboard</p>
            </div>
            
            <form class="mt-8 space-y-6" method="POST" action="">
              <input type="hidden" name="action" value="login">
              <div class="space-y-4">
                <div class="relative">
                  <span class="absolute left-3 top-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    placeholder="Username"
                    class="input pl-10 w-full"
                  />
                </div>
                
                <div class="relative">
                  <span class="absolute left-3 top-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Password"
                    class="input pl-10 w-full"
                  />
                </div>
              </div>
              
              <?php if (isset($loginError)): ?>
                <div class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  <?php echo $loginError; ?>
                </div>
              <?php endif; ?>
              
              <button
                type="submit"
                class="button primary w-full h-12 text-lg font-bold"
              >
                Login
              </button>
              
              <div class="p-4 mt-4 bg-muted/30 rounded-md">
                <p class="text-xs text-center text-muted-foreground">
                  For demo purposes, use: <br />
                  <span class="font-mono">Username: admin</span> <br />
                  <span class="font-mono">Password: password</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      <?php else: ?>
        <!-- Main Dashboard -->
        <div class="min-h-screen bg-gradient-to-b from-background to-background/95">
          <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
            <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div class="absolute top-[20%] -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-40 right-[20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
          
          <div class="container max-w-7xl relative">
            <div class="py-10 space-y-8 animate-slide-up">
              <div class="flex justify-between items-center">
                <!-- Header -->
                <div class="space-y-4 py-4 animate-fade-in">
                  <div class="flex items-center gap-2">
                    <div class="bg-primary/10 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                    </div>
                    <h1 class="text-3xl font-medium tracking-tight">ApiAlly</h1>
                  </div>
                  <p class="text-muted-foreground max-w-3xl">
                    Easily collect real-time data through your API endpoint, automatically consolidate it into CSV files, 
                    and export to your Dropbox at the end of each day.
                  </p>
                  <div class="flex items-center text-sm text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>Configure your API key and Dropbox link below to get started</span>
                  </div>
                </div>
                
                <a href="?logout=1" class="button outline hover-lift">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Logout
                </a>
              </div>
              
              <div class="separator"></div>
              
              <!-- API Usage Stats -->
              <section id="api-usage-stats-section">
                <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <div class="card glass shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="p-6">
                      <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-muted-foreground">Total Data Points</span>
                          <span class="text-2xl font-bold mt-1" id="total-data-points">0</span>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="card glass shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="p-6">
                      <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-muted-foreground">Active Sources</span>
                          <span class="text-2xl font-bold mt-1" id="active-sources">0/0</span>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="card glass shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="p-6">
                      <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-muted-foreground">Unique Sources</span>
                          <span class="text-2xl font-bold mt-1" id="unique-sources">0</span>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="card glass shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="p-6">
                      <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-muted-foreground">Last Received</span>
                          <span class="text-2xl font-bold mt-1" id="last-received">No data</span>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="card glass shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="p-6">
                      <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-muted-foreground">Data Types</span>
                          <span class="text-2xl font-bold mt-1" id="data-types">0</span>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              
              <!-- Sources Manager -->
              <section id="sources-manager-section">
                <div id="sources-manager-container"></div>
              </section>
              
              <!-- Configuration Section -->
              <section>
                <h2 class="text-xl font-medium mb-4">Configuration</h2>
                <div class="tabs" id="configuration-tabs">
                  <div class="tabs-header">
                    <button class="tab-button active" data-tab="basic">Basic Setup</button>
                    <button class="tab-button" data-tab="schema">Data Schema</button>
                    <button class="tab-button" data-tab="deployment">Deployment</button>
                  </div>
                  
                  <div class="tab-content">
                    <div class="tab-pane active" id="basic-tab">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- API Key Form -->
                        <div class="card shadow-sm hover:shadow-md transition-all duration-300">
                          <div class="card-header">
                            <h3 class="flex items-center gap-2 text-xl font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                              API Authentication
                            </h3>
                            <p class="card-description">
                              Create and manage the API key for secure data transmission
                            </p>
                          </div>
                          <div class="card-content">
                            <div class="space-y-4">
                              <div class="space-y-2">
                                <div class="relative">
                                  <input
                                    type="text"
                                    placeholder="Enter API Key"
                                    id="api-key-input"
                                    class="input pr-10"
                                  />
                                  <button 
                                    id="copy-api-key-btn"
                                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                    title="Copy to clipboard"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div class="card-footer flex justify-between">
                            <button
                              id="generate-api-key-btn"
                              class="button outline hover-lift"
                            >
                              Generate New Key
                            </button>
                            <button id="save-api-key-btn" class="button primary hover-lift">Save Key</button>
                          </div>
                        </div>
                        
                        <!-- Dropbox Link Form -->
                        <div class="card shadow-sm hover:shadow-md transition-all duration-300">
                          <div class="card-header">
                            <h3 class="flex items-center gap-2 text-xl font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              Dropbox Configuration
                            </h3>
                            <p class="card-description">
                              Configure where your daily CSV exports will be stored
                            </p>
                          </div>
                          <div class="card-content">
                            <div class="space-y-4">
                              <div class="space-y-2">
                                <input
                                  type="text"
                                  id="dropbox-link-input"
                                  placeholder="https://www.dropbox.com/scl/fo/your-shared-folder"
                                  class="input w-full"
                                />
                              </div>
                            </div>
                          </div>
                          <div class="card-footer flex justify-end">
                            <button id="save-dropbox-link-btn" class="button primary hover-lift">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              Save Link
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="tab-pane" id="schema-tab">
                      <!-- Schema Editor -->
                      <div id="schema-editor-container"></div>
                    </div>
                    
                    <div class="tab-pane" id="deployment-tab">
                      <!-- Deployment Guide -->
                      <div id="deployment-guide-container"></div>
                    </div>
                  </div>
                </div>
              </section>
              
              <!-- Control Panel Section -->
              <section class="space-y-6">
                <h2 class="text-xl font-medium mb-4">Manage & Test</h2>
                <!-- Control Panel -->
                <div id="control-panel-container"></div>
                
                <!-- Data Table -->
                <div id="data-table-container"></div>
              </section>
              
              <!-- API Documentation Section -->
              <section class="space-y-6 pb-10">
                <h2 class="text-xl font-medium mb-4">Documentation</h2>
                <!-- API Instructions -->
                <div id="api-instructions-container"></div>
              </section>
            </div>
          </div>
        </div>
      <?php endif; ?>
    </div>
    
    <!-- Toast container for notifications -->
    <div id="toast-container"></div>
    
    <script src="/public/app.js"></script>
  </body>
</html>
