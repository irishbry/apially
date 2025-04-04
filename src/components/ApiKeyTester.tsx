
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ApiService } from "@/services/ApiService";
import { Input } from "@/components/ui/input";

interface ApiKeyTesterProps {
  apiKey: string;
  endpoint?: string;
}

const ApiKeyTester: React.FC<ApiKeyTesterProps> = ({ apiKey, endpoint }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [customEndpoint, setCustomEndpoint] = useState(endpoint || ApiService.getDefaultEndpoint());
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
      // Strip the Bearer prefix if it exists - we'll use X-API-Key header instead
      const rawApiKey = apiKey.replace(/^Bearer\s+/i, '').trim();
      
      // Use either the prop endpoint, custom endpoint, or default Supabase function
      const endpointToTest = customEndpoint || endpoint || ApiService.getDefaultEndpoint();
      
      console.log(`Testing connection to endpoint: ${endpointToTest}`);
      
      // Create a small test payload
      const testData = {
        sensorId: 'test-sensor',
        timestamp: new Date().toISOString(),
        temperature: 22.5,
        test: true
      };
      
      // Test the connection with a direct fetch first to validate
      try {
        const response = await fetch(endpointToTest, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': rawApiKey  // Use X-API-Key header instead of Authorization
          },
          body: JSON.stringify(testData)
        });
        
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        if (!isJson) {
          setTestResult({
            success: false,
            message: `Endpoint returned non-JSON response (${contentType || 'unknown'}). Ensure the API endpoint is configured correctly.`
          });
          
          toast({
            title: "Connection Failed",
            description: "Endpoint is not returning JSON. Check the API configuration.",
            variant: "destructive",
          });
          setIsTesting(false);
          return;
        }
        
        const responseData = await response.json();
        
        if (response.ok) {
          setTestResult({
            success: true,
            message: responseData.message || 'API connection successful'
          });
          
          toast({
            title: "Connection Successful",
            description: "Your API key is working correctly with the Supabase endpoint!",
            variant: "default",
          });
        } else {
          // Handle schema validation errors specifically
          if (response.status === 400 && responseData.error === 'Data validation failed') {
            setTestResult({
              success: false,
              message: `Schema validation failed: ${responseData.details ? responseData.details.join(', ') : 'Unknown validation error'}`
            });
            
            toast({
              title: "Schema Validation Failed",
              description: "The test data does not match your schema requirements.",
              variant: "destructive",
            });
          } else {
            setTestResult({
              success: false,
              message: responseData.error || responseData.message || `API connection failed with status ${response.status}`
            });
            
            toast({
              title: "Connection Failed",
              description: responseData.error || responseData.message || "Failed to connect to the API.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        // If direct fetch fails, try the service method as fallback
        console.log("Direct fetch failed, trying service method", error);
        
        const result = await ApiService.testApiConnection(rawApiKey, customEndpoint || endpoint);
        setTestResult(result);
        
        if (result.success) {
          toast({
            title: "Connection Successful",
            description: "Your API key is working correctly!",
            variant: "default",
          });
        } else {
          if (result.message.includes("Schema validation failed")) {
            toast({
              title: "Schema Validation Failed",
              description: "The test data does not match your schema requirements.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Connection Failed",
              description: result.message || "Failed to connect to the API.",
              variant: "destructive",
            });
          }
        }
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
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="custom-endpoint" className="text-sm font-medium">
              API Endpoint
            </label>
            <Input
              id="custom-endpoint"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder="Enter API endpoint URL"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Default: Supabase data-receiver function endpoint
            </p>
          </div>
          
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
              This will send a test request to verify your API key with the Supabase endpoint.
            </p>
            <p className="text-xs text-muted-foreground">
              The test will send a small data packet to check if your API key is authorized and if the data matches your schema.
            </p>
          </div>
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
