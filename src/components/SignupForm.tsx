
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !username.trim() || !confirmPassword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSigningUp(true);
    setError('');
    
    try {
      console.log("Attempting signup with:", { email, username });
      
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Signup response:", data);
      
      toast({
        title: "Success",
        description: "Your account has been created. Please check your email for verification.",
        duration: 5000,
      });
      
      // Navigate to login page
      navigate('/login');
      
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Error creating your account. Please try again later.');
      toast({
        title: "Signup Failed",
        description: err.message || "Could not create your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-2 border-primary">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Enter your details to register for a new account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <User className="h-5 w-5" />
            </span>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <Mail className="h-5 w-5" />
            </span>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <Lock className="h-5 w-5" />
            </span>
            <Input
              id="password"
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <Lock className="h-5 w-5" />
            </span>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSignup();
                }
              }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pb-6">
        <Button 
          className="w-full h-12 text-lg font-bold"
          onClick={handleSignup}
          disabled={isSigningUp}
          style={{ 
            position: 'relative', 
            zIndex: 9999,
            backgroundColor: 'hsl(var(--primary))',
            color: 'white'
          }}
        >
          {isSigningUp ? 'Creating Account...' : 'Sign Up'}
        </Button>
        <div className="text-center text-sm text-muted-foreground pt-2">
          Already have an account?{" "}
          <Button variant="link" className="p-0" onClick={() => navigate('/')}>
            Log in
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SignupForm;
