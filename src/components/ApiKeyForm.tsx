import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard, Copy, KeyRound, RefreshCw, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ApiService } from "@/services/ApiService";
import ApiKeyTester from './ApiKeyTester';
import SchemaEditor from './SchemaEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ApiKeyForm: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('key');
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
    
    toast({
      title: "Success",
      description: "API key has been saved successfully.",
    });
  };

  const copyToClipboard = () => {
    // Just copy the raw API key without the Bearer prefix
    navigator.clipboard.writeText(apiKey).then(() => {
      toast({
        title: "Copied!",
        description: "API key copied to clipboard.",
      });
    });
  };

  return (
    <div className="space-y-4">
      <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-medium">
            <KeyRound className="h-5 w-5 text-primary" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Manage your API key and set validation schema for data transmission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="key">API Key</TabsTrigger>
              <TabsTrigger value="schema">Schema Validation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="key" className="space-y-4">
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
                <div className="text-xs text-muted-foreground">
                  <p>
                    Your API key should be sent in the "X-API-Key" header of your requests.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
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
              </div>
              
              {apiKey && <ApiKeyTester apiKey={apiKey} />}
            </TabsContent>
            
            <TabsContent value="schema">
              {apiKey ? (
                <SchemaEditor apiKey={apiKey} />
              ) : (
                <div className="text-center py-8">
                  <Settings className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Please generate or enter an API key first to configure the schema.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyForm;
