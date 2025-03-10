
<?php
// Login endpoint handler

function handleLoginEndpoint() {
    global $config;
    
    // Set content type and CORS headers
    header('Content-Type: application/json');
    
    // Handle login request
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        // Log the received data for debugging
        logApiRequest('login', 'attempt', "Login attempt: " . json_encode($data));
        
        // Check if JSON was valid
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            logApiRequest('login', 'error', "Invalid JSON: " . json_last_error_msg());
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid request format'
            ]);
            return;
        }
        
        $username = isset($data['username']) ? $data['username'] : '';
        $password = isset($data['password']) ? $data['password'] : '';
        
        // Validate credentials
        if ($username === $config['demo_user'] && $password === $config['demo_password']) {
            logApiRequest('login', 'success', "User: $username");
            http_response_code(200); // Ensure 200 status code for successful login
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'username' => $username,
                    'role' => 'admin'
                ]
            ]);
        } else {
            logApiRequest('login', 'failed', "Invalid credentials attempt: $username");
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid username or password'
            ]);
        }
    } catch (Exception $e) {
        logApiRequest('login', 'error', "Exception: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error occurred'
        ]);
    }
}
