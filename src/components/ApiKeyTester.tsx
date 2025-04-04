
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { testApiConnection } from "@/services/ApiService";

interface ApiKeyTesterProps {
  apiKey: string;
  endpoint?: string;
}

const ApiKeyTester: React.FC<ApiKeyTesterProps> = ({ apiKey, endpoint }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const { toast } = useToast();

  const runTest = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testApiConnection(apiKey, endpoint);
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Your API key is working correctly!",
          variant: "default",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Failed to connect to the API.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTestResult({
        success: false,
        message: errorMessage
      });
      
      toast({
        title: "Test Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">API Connection Tester</CardTitle>
      </CardHeader>
      <CardContent>
        {testResult && (
          <div className={`p-3 rounded-md mb-3 flex items-start gap-2 ${
            testResult.success ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {testResult.success ? 
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" /> : 
              <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            }
            <div>
              <p className="font-medium">{testResult.success ? 'Connection Successful' : 'Connection Failed'}</p>
              <p className="text-sm">{testResult.message}</p>
            </div>
          </div>
        )}
        
        <div className="text-sm space-y-2">
          <p>
            <AlertTriangle className="inline h-4 w-4 mr-1 text-amber-500" />
            This will send a test request to verify your API key is working correctly.
          </p>
          <p className="text-xs text-muted-foreground">
            The test will send a small data packet to the API endpoint using your API key.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runTest} 
          disabled={isTesting || !apiKey} 
          className="w-full"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyTester;
