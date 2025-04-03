import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SimpleLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      console.log("Attempting login with:", { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Login response:", data);
      
      if (data?.session) {
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
          duration: 3000,
        });
        
        // Dispatch auth change event
        window.dispatchEvent(new Event('auth-change'));
        
        // Force navigation to dashboard with a small delay to ensure state is updated
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      } 
    } catch (err: any) {
      console.error('Login error:', err);
      toast({
        title: "Login Failed",
        description: err.message || "Invalid email or password. Please try again.",
        variant: "destructive",
        duration: 3000,
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
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            For demo purposes, sign up with your email and password.
          </p>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SimpleLoginForm;
