
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ApiService from "@/services/ApiService";
import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    
    // Simulate a slight delay for better UX
    setTimeout(() => {
      const success = ApiService.login(username, password);
      
      if (success) {
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        });
        // Use React Router for navigation instead of page reload
        navigate('/');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password. Please try again.",
          variant: "destructive",
        });
      }
      
      setIsLoggingIn(false);
    }, 800);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      <CardFooter>
        <Button 
          className="w-full hover-lift" 
          onClick={handleLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </Button>
      </CardFooter>
      <div className="p-4 bg-muted/30 rounded-b-lg">
        <p className="text-xs text-center text-muted-foreground">
          For demo purposes, use: <br />
          <span className="font-mono">Username: admin</span> <br />
          <span className="font-mono">Password: password</span>
        </p>
      </div>
    </Card>
  );
};

export default LoginForm;
