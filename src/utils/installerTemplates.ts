
/**
 * Utility functions for generating installation package templates
 */

/**
 * Creates the install.php file content
 */
export const createInstallerPHP = (): string => {
  return `<?php
// Installation script for Data Consolidation Tool
error_reporting(E_ALL);
ini_set('display_errors', 1);

$installDir = __DIR__;

// Function to check system requirements
function checkRequirements() {
    $requirements = array(
        'php_version' => version_compare(PHP_VERSION, '7.0.0', '>='),
        'curl_extension' => extension_loaded('curl'),
        'json_extension' => extension_loaded('json'),
        'write_permission' => is_writable(__DIR__)
    );
    
    return $requirements;
}

// Function to check if the API is accessible
function testApiConnection() {
    $apiUrl = './api/status';
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        return $data && isset($data['status']) && $data['status'] === 'ok';
    }
    
    return false;
}

// Check data directory permissions
function checkDataDirectory() {
    $dataDir = './api/data';
    if (!file_exists($dataDir)) {
        // Try to create it
        if (!mkdir($dataDir, 0755, true)) {
            return false;
        }
    }
    
    return is_writable($dataDir);
}

// Check for .htaccess file
function checkHtaccess() {
    return file_exists('./api/.htaccess');
}

// Start the installation process
$status = array(
    'success' => true,
    'message' => 'Installation completed successfully!',
    'requirements' => checkRequirements(),
    'api_connection' => false,
    'data_directory' => false,
    'htaccess' => false
);

// Check for critical requirements
foreach ($status['requirements'] as $requirement => $met) {
    if (!$met) {
        $status['success'] = false;
        $status['message'] = "Requirement not met: " . $requirement;
        break;
    }
}

// Only proceed with further checks if requirements are met
if ($status['success']) {
    $status['api_connection'] = testApiConnection();
    $status['data_directory'] = checkDataDirectory();
    $status['htaccess'] = checkHtaccess();
    
    if (!$status['api_connection'] || !$status['data_directory'] || !$status['htaccess']) {
        $status['success'] = false;
        $status['message'] = "Installation issues detected. Please check the details below.";
    }
}

// Display installation results
?>
<!DOCTYPE html>
<html>
<head>
    <title>Installation Status</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
        .req-item { margin: 5px 0; padding: 8px; border-radius: 4px; }
        .met { background-color: #f0fff0; }
        .not-met { background-color: #fff0f0; }
        .button { display: inline-block; padding: 10px 15px; background-color: #007bff; color: white; 
                  text-decoration: none; border-radius: 4px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Data Consolidation Tool - Installation</h1>
    
    <div class="section">
        <h2>Installation Status</h2>
        <p><?php echo $status['success'] ? "<span class=\"success\">✓ Success!</span>" : "<span class=\"error\">✗ Issues Found</span>"; ?> <?php echo $status['message']; ?></p>
    </div>
    
    <div class="section">
        <h2>System Requirements</h2>
        <div class="req-item <?php echo $status['requirements']['php_version'] ? "met" : "not-met"; ?>">
            PHP Version: <?php echo $status['requirements']['php_version'] ? "<span class=\"success\">✓ OK</span>" : "<span class=\"error\">✗ Not Met</span>"; ?>
            - Current: <?php echo PHP_VERSION; ?> (Required: 7.0+)
        </div>
        <div class="req-item <?php echo $status['requirements']['curl_extension'] ? "met" : "not-met"; ?>">
            cURL Extension: <?php echo $status['requirements']['curl_extension'] ? "<span class=\"success\">✓ OK</span>" : "<span class=\"error\">✗ Not Available</span>"; ?>
        </div>
        <div class="req-item <?php echo $status['requirements']['json_extension'] ? "met" : "not-met"; ?>">
            JSON Extension: <?php echo $status['requirements']['json_extension'] ? "<span class=\"success\">✓ OK</span>" : "<span class=\"error\">✗ Not Available</span>"; ?>
        </div>
        <div class="req-item <?php echo $status['requirements']['write_permission'] ? "met" : "not-met"; ?>">
            Write Permissions: <?php echo $status['requirements']['write_permission'] ? "<span class=\"success\">✓ OK</span>" : "<span class=\"error\">✗ Not Available</span>"; ?>
        </div>
    </div>
    
    <div class="section">
        <h2>Installation Components</h2>
        <div class="req-item <?php echo $status['api_connection'] ? "met" : "not-met"; ?>">
            API Connection: <?php echo $status['api_connection'] ? "<span class=\"success\">✓ Working</span>" : "<span class=\"error\">✗ Not Working</span>"; ?>
            <?php if (!$status['api_connection']): ?>
                <p>The API is not responding correctly. Common issues:</p>
                <ul>
                    <li>Apache mod_rewrite is not enabled</li>
                    <li>AllowOverride is not set to All in your Apache configuration</li>
                    <li>.htaccess file is missing or not readable</li>
                    <li>RewriteBase in .htaccess needs to be updated for your installation path</li>
                </ul>
                <p>Try running the <a href="./api/test.php">API test script</a> for more detailed diagnostics.</p>
            <?php endif; ?>
        </div>
        <div class="req-item <?php echo $status['data_directory'] ? "met" : "not-met"; ?>">
            Data Directory: <?php echo $status['data_directory'] ? "<span class=\"success\">✓ OK</span>" : "<span class=\"error\">✗ Issue</span>"; ?>
            <?php if (!$status['data_directory']): ?>
                <p>The data directory (./api/data) is not writable. Fix with:</p>
                <code>mkdir -p ./api/data</code> and <code>chmod 755 ./api/data</code>
            <?php endif; ?>
        </div>
        <div class="req-item <?php echo $status['htaccess'] ? "met" : "not-met"; ?>">
            .htaccess File: <?php echo $status['htaccess'] ? "<span class=\"success\">✓ Present</span>" : "<span class=\"error\">✗ Missing</span>"; ?>
            <?php if (!$status['htaccess']): ?>
                <p><strong>Important:</strong> The .htaccess file is missing but is critical for the API to work.</p>
                <p>This file is often hidden in file managers. Make sure "Show hidden files" is enabled when uploading.</p>
                <p>Check the README.md file for instructions on manually creating this file.</p>
            <?php endif; ?>
        </div>
    </div>
    
    <?php if ($status['success']): ?>
    <div class="section">
        <h2>Next Steps</h2>
        <p>Your installation is complete! Here's what to do next:</p>
        <ol>
            <li>Access your application at: <a href="./index.html">./index.html</a></li>
            <li>Configure your API key in: <code>./api/config.php</code></li>
            <li>Start adding your data sources through the web interface</li>
        </ol>
        <a href="./index.html" class="button">Go to Application</a>
    </div>
    <?php else: ?>
    <div class="section">
        <h2>Troubleshooting</h2>
        <p>The installation has some issues that need to be fixed:</p>
        <ol>
            <li>Check all the red items above and fix each issue</li>
            <li>For Apache configuration issues:
                <ul>
                    <li>Enable mod_rewrite: <code>a2enmod rewrite</code> and restart Apache</li>
                    <li>Set AllowOverride All in your virtual host configuration</li>
                </ul>
            </li>
            <li>For permission issues:
                <ul>
                    <li>Set correct permissions: <code>chmod 755 ./api/data</code></li>
                    <li>Make sure the web server user can write to the data directory</li>
                </ul>
            </li>
            <li>Check the <a href="./api/test.php">API test page</a> for more detailed diagnostics</li>
            <li>After fixing the issues, refresh this page to check again</li>
        </ol>
        <a href="./api/test.php" class="button">Run API Test</a>
    </div>
    <?php endif; ?>
    
    <div class="section">
        <h2>Installation Details</h2>
        <p>The following components have been installed:</p>
        <ul>
            <li>Frontend Interface (HTML, CSS, JavaScript)</li>
            <li>Backend API (PHP-based RESTful API)</li>
            <li>Configuration files and required directories</li>
        </ul>
        <p>Configuration file location: <code>./api/config.php</code></p>
        <p>Data storage location: <code>./api/data/</code></p>
    </div>
</body>
</html>`;
};

/**
 * Creates the README.md file content
 */
export const createReadme = (): string => {
  return `# Data Consolidation Tool - Installation Package

## What is this?

This is an all-in-one installation package for the Data Consolidation Tool. It includes both the frontend interface and the backend API in a single package.

## Installation Instructions

1. Upload ALL files to your web server, maintaining the directory structure
2. Navigate to install.php in your web browser (e.g., https://yourdomain.com/install.php)
3. Follow the on-screen instructions to complete the installation
4. If there are any issues, check the troubleshooting section in install.php

## Directory Structure

\`\`\`
/                     # Root directory
├── install.php       # Installation script
├── index.html        # Frontend entry point
├── assets/           # Frontend assets (CSS, JS)
├── api/              # Backend API
│   ├── index.php     # API entry point
│   ├── config.php    # API configuration
│   ├── test.php      # API test script
│   ├── .htaccess     # Apache configuration (important!)
│   └── data/         # Data storage directory
└── README.md         # This file
\`\`\`

## Requirements

- PHP 7.0 or higher
- Apache web server with mod_rewrite enabled
- PHP extensions: curl, json
- Write permissions on the installation directory

## Important Note About Hidden Files

The .htaccess file in the api/ directory is CRITICAL for the API to work correctly. This file may be hidden in your file browser.

If you're not seeing the .htaccess file:
- In cPanel File Manager: Click on "Settings" and check "Show Hidden Files (dotfiles)"
- In FTP clients: Enable "Show hidden files" option
- In Windows Explorer: Enable "Show hidden files" in folder options
- In macOS Finder: Press Cmd+Shift+. (period) to toggle hidden files

## After Installation

1. Access your application at your domain (e.g., https://yourdomain.com/)
2. Configure your API key in api/config.php
3. Start adding your data sources through the web interface

## Troubleshooting

If you encounter any issues during installation:

1. Check the installation page for specific errors
2. Run the API test script at ./api/test.php for detailed diagnostics
3. Make sure mod_rewrite is enabled in Apache
4. Verify that all files were uploaded, especially the .htaccess file
5. Check file permissions (755 for directories, 644 for files)

For more help, please contact support.`;
};
