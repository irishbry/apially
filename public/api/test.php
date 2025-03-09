
<?php
// Enable error reporting for troubleshooting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Simple test script that avoids complex PHP functions that might cause errors
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Installation Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .test { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>API Installation Test</h1>
    
    <div class="test">
        <h3>PHP Version and Info</h3>
        <?php
        // Basic info about PHP that doesn't require functions that might be disabled
        echo '<p>PHP Version: ' . phpversion() . '</p>';
        if (function_exists('phpinfo')) {
            echo '<p><a href="phpinfo.php" target="_blank">View Full PHP Info</a></p>';
        }
        ?>
    </div>

    <div class="test">
        <h3>Server Information</h3>
        <?php
        echo '<p>Server Software: ' . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . '</p>';
        echo '<p>Document Root: ' . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . '</p>';
        echo '<p>Script Path: ' . ($_SERVER['SCRIPT_FILENAME'] ?? 'Unknown') . '</p>';
        ?>
    </div>
    
    <div class="test">
        <h3>PHP Extensions</h3>
        <?php
        $required_extensions = ['json', 'curl'];
        foreach ($required_extensions as $ext) {
            if (extension_loaded($ext)) {
                echo "<p><span class='success'>✓</span> $ext extension is loaded</p>";
            } else {
                echo "<p><span class='error'>✗</span> $ext extension is NOT loaded</p>";
            }
        }
        ?>
    </div>
    
    <div class="test">
        <h3>API Configuration</h3>
        <?php
        // Check if .htaccess exists
        if (file_exists('.htaccess')) {
            echo "<p><span class='success'>✓</span> .htaccess file exists</p>";
        } else {
            echo "<p><span class='error'>✗</span> .htaccess file does not exist</p>";
            echo "<p>This file is critical for API routing to work!</p>";
        }
        
        // Check if data directory exists and is writable
        if (file_exists('data') && is_dir('data')) {
            echo "<p><span class='success'>✓</span> data directory exists</p>";
            
            if (is_writable('data')) {
                echo "<p><span class='success'>✓</span> data directory is writable</p>";
            } else {
                echo "<p><span class='error'>✗</span> data directory is not writable</p>";
                echo "<p>Fix with: <code>chmod 755 data</code></p>";
            }
        } else {
            echo "<p><span class='error'>✗</span> data directory does not exist</p>";
            echo "<p>Fix with: <code>mkdir data</code> and <code>chmod 755 data</code></p>";
        }
        ?>
    </div>
    
    <div class="test">
        <h3>Testing API Endpoints</h3>
        <?php
        // First, try a simpler test that doesn't use curl
        $status_url = 'status';
        echo "<p>Testing API endpoint: $status_url</p>";
        echo "<p>Direct test without curl: ";
        
        // Test using file_get_contents first which might work when curl doesn't
        if (function_exists('file_get_contents') && ini_get('allow_url_fopen')) {
            try {
                $context = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => "Accept: application/json\r\n"
                    ]
                ]);
                
                $response = @file_get_contents($status_url, false, $context);
                if ($response !== false) {
                    echo "<span class='success'>Success!</span> API responded.</p>";
                    echo "<p>Response: " . htmlspecialchars($response) . "</p>";
                } else {
                    echo "<span class='error'>Failed.</span> Could not get a response.</p>";
                }
            } catch (Exception $e) {
                echo "<span class='error'>Error: " . htmlspecialchars($e->getMessage()) . "</span></p>";
            }
        } else {
            echo "<span class='warning'>Skipped.</span> file_get_contents not available or allow_url_fopen disabled.</p>";
        }
        ?>
    </div>
</body>
</html>
