
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard, Copy, KeyRound, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ApiService from "@/services/ApiService";

const ApiKeyForm: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = ApiService.getApiKey();
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const generateApiKey = () => {
    setIsGenerating(true);
    // Generate a random string for the API key
    setTimeout(() => {
      const key = Array.from(Array(32), () => Math.floor(Math.random() * 36).toString(36)).join('');
      setApiKey(key);
      ApiService.setApiKey(key);
      setIsGenerating(false);
    }, 600);
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }
    
    ApiService.setApiKey(apiKey);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      toast({
        title: "Copied!",
        description: "API key copied to clipboard.",
      });
    });
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <KeyRound className="h-5 w-5 text-primary" />
          API Authentication
        </CardTitle>
        <CardDescription>
          Create and manage the API key for secure data transmission
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button 
                onClick={copyToClipboard}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                disabled={!apiKey}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={generateApiKey}
          disabled={isGenerating}
          className="hover-lift"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate New Key</>
          )}
        </Button>
        <Button onClick={saveApiKey} className="hover-lift">Save Key</Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyForm;
