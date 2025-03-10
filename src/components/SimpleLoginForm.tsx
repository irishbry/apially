
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { User, Lock } from "lucide-react";

const SimpleLoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      // Make a direct fetch call to the login endpoint
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
        
        // Display success message
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        });
        
        // Wait a brief moment then reload the page to refresh with new auth
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid username or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Login error:', err);
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
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-2xl border-2 border-primary">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Login</h2>
        <p className="mt-2 text-gray-600">Enter your credentials to access the dashboard</p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="username"
              name="username"
              type="text"
              required
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
        
        <Button
          type="submit"
          className="w-full h-12 text-lg font-bold"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </Button>
        
        <div className="p-4 mt-4 bg-muted/30 rounded-md">
          <p className="text-xs text-center text-muted-foreground">
            For demo purposes, use: <br />
            <span className="font-mono">Username: admin</span> <br />
            <span className="font-mono">Password: password</span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SimpleLoginForm;
