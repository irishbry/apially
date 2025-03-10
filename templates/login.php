
<div class="flex justify-center items-center" style="min-height: 70vh">
    <div class="card" style="width: 100%; max-width: 400px;">
        <div class="card-header">
            <h2 class="card-title">Login</h2>
            <p class="card-description">Enter your credentials to access the portal</p>
        </div>
        
        <div class="card-content">
            <form id="login-form">
                <div class="form-group">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" name="username" required class="form-control" placeholder="Enter your username">
                </div>
                
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" required class="form-control" placeholder="Enter your password">
                </div>
                
                <div class="mt-4">
                    <button type="submit" class="button button-primary" style="width: 100%">Login</button>
                </div>
            </form>
        </div>
        
        <div class="card-footer text-center" style="justify-content: center;">
            <div class="text-sm">
                <p><strong>Demo credentials:</strong> admin / password</p>
            </div>
        </div>
    </div>
</div>
