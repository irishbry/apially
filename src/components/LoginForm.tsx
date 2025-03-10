
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    setError('');
    
    try {
      console.log("Attempting login with:", { username });
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      console.log("Login response:", data);
      
      if (response.ok && data.success) {
        // Set auth in local storage
        localStorage.setItem('csv-api-auth', 'true');
        
        // Dispatch auth change event
        window.dispatchEvent(new Event('auth-change'));
        
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        });
        
        console.log("Login successful, navigating to home...");
        
        // Force a small delay to ensure state updates before navigation
        setTimeout(() => {
          navigate('/');
          // Reload the page to ensure the app fully refreshes with new auth state
          window.location.reload();
        }, 1000); // Further increased delay to ensure everything updates
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
        toast({
          title: "Login Failed",
          description: data.message || "Invalid username or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error connecting to the server. Please try again later.');
      toast({
        title: "Connection Error",
        description: "Could not connect to the authentication server. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg relative z-20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <User className="h-5 w-5" />
            </span>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <Lock className="h-5 w-5" />
            </span>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pb-6">
        <Button 
          className="w-full relative z-20 h-12 text-lg" 
          onClick={handleLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </Button>
        <div className="w-full p-4 bg-muted/30 rounded-md">
          <p className="text-xs text-center text-muted-foreground">
            For demo purposes, use: <br />
            <span className="font-mono">Username: admin</span> <br />
            <span className="font-mono">Password: password</span>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
