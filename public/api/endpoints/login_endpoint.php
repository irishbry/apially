
<?php
// Login endpoint handler

function handleLoginEndpoint() {
    global $config;
    
    // Handle login request
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Log the received data for debugging
    logApiRequest('login', 'attempt', "Login attempt: " . json_encode($data));
    
    $username = getJsonRequestValue($data, 'username', '');
    $password = getJsonRequestValue($data, 'password', '');
    
    if ($username === $config['demo_user'] && $password === $config['demo_password']) {
        logApiRequest('login', 'success', "User: $username");
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'username' => $username,
                'role' => 'admin'
            ]
        ]);
    } else {
        logApiRequest('login', 'failed', "Invalid credentials attempt: $username / $password");
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
    }
}
