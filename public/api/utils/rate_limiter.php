
<?php
/**
 * Rate limiting utility for API endpoints
 * Limits requests to 5 per hour per IP address per endpoint
 */

function checkRateLimit($endpoint) {
    global $config;
    
    // Get client IP address
    $clientIp = getClientIp();
    
    // Create storage path for rate limit data if it doesn't exist
    $rateLimitDir = $config['storage_path'] . '/rate_limits';
    if (!file_exists($rateLimitDir)) {
        mkdir($rateLimitDir, 0755, true);
    }
    
    // Create a unique filename for this IP and endpoint combination
    $ipHash = md5($clientIp); // Hash the IP for privacy
    $filename = $rateLimitDir . '/' . $ipHash . '_' . $endpoint . '.json';
    
    // Current time
    $now = time();
    $windowSize = 3600; // 1 hour window (3600 seconds)
    $maxRequests = 5; // 5 requests per hour
    
    // Default rate limit data structure
    $rateLimitData = [
        'requests' => [],
        'blocked_until' => 0
    ];
    
    // Load existing rate limit data if it exists
    if (file_exists($filename)) {
        $fileContent = file_get_contents($filename);
        if ($fileContent) {
            $rateLimitData = json_decode($fileContent, true) ?: $rateLimitData;
        }
    }
    
    // Check if currently blocked
    if ($rateLimitData['blocked_until'] > $now) {
        // Calculate remaining seconds of block
        $remainingSeconds = $rateLimitData['blocked_until'] - $now;
        
        // Return rate limit response
        header('HTTP/1.1 429 Too Many Requests');
        header('Retry-After: ' . $remainingSeconds);
        header('X-RateLimit-Limit: ' . $maxRequests);
        header('X-RateLimit-Remaining: 0');
        header('X-RateLimit-Reset: ' . $rateLimitData['blocked_until']);
        
        echo json_encode([
            'success' => false,
            'message' => 'Rate limit exceeded. Try again after ' . $remainingSeconds . ' seconds.',
            'code' => 'RATE_LIMIT_EXCEEDED'
        ]);
        
        logApiRequest($endpoint, 'error', 'Rate limit exceeded for IP: ' . substr($clientIp, 0, 7) . '...');
        exit;
    }
    
    // Filter out requests older than the window
    $windowStart = $now - $windowSize;
    $rateLimitData['requests'] = array_filter($rateLimitData['requests'], function($timestamp) use ($windowStart) {
        return $timestamp >= $windowStart;
    });
    
    // Add current request
    $rateLimitData['requests'][] = $now;
    
    // Calculate remaining requests
    $requestCount = count($rateLimitData['requests']);
    $remaining = $maxRequests - $requestCount;
    
    // Add rate limit headers
    header('X-RateLimit-Limit: ' . $maxRequests);
    header('X-RateLimit-Remaining: ' . max(0, $remaining));
    header('X-RateLimit-Reset: ' . ($now + $windowSize));
    
    // Check if rate limit exceeded
    if ($requestCount > $maxRequests) {
        // Block for 1 hour
        $blockDuration = 3600; // 1 hour block
        $rateLimitData['blocked_until'] = $now + $blockDuration;
        
        // Save rate limit data
        file_put_contents($filename, json_encode($rateLimitData));
        
        // Return rate limit response
        header('HTTP/1.1 429 Too Many Requests');
        header('Retry-After: ' . $blockDuration);
        
        echo json_encode([
            'success' => false,
            'message' => 'Rate limit exceeded. Try again after ' . $blockDuration . ' seconds.',
            'code' => 'RATE_LIMIT_EXCEEDED'
        ]);
        
        logApiRequest($endpoint, 'error', 'Rate limit exceeded for IP: ' . substr($clientIp, 0, 7) . '...');
        exit;
    }
    
    // Save updated rate limit data
    file_put_contents($filename, json_encode($rateLimitData));
    
    // Request is allowed
    return;
}

// Clean up old rate limit files - run occasionally to prevent storage bloat
function cleanupRateLimitFiles() {
    global $config;
    
    // Run cleanup with 5% probability to avoid doing it on every request
    if (mt_rand(1, 100) > 5) {
        return;
    }
    
    $rateLimitDir = $config['storage_path'] . '/rate_limits';
    if (!file_exists($rateLimitDir)) {
        return;
    }
    
    $now = time();
    $files = glob($rateLimitDir . '/*.json');
    
    foreach ($files as $file) {
        // If file is older than 2 days, delete it (increased from 1 day to account for hourly rate limiting)
        if (filemtime($file) < ($now - 172800)) {
            @unlink($file);
        }
    }
}
