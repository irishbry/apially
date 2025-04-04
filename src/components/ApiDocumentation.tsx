
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy, FileJson, Globe, BookOpen, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ApiDocumentation: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [functionUrl, setFunctionUrl] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchApiKey = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('sources')
          .select('api_key')
          .eq('user_id', user.id)
          .eq('active', true)
          .limit(1)
          .single();
        
        if (data && !error) {
          setApiKey(data.api_key);
        }
      } catch (err) {
        console.error('Error fetching API key:', err);
      }
    };

    fetchApiKey();
    
    // Set the function URL based on the Supabase project
    const projectRef = supabase.supabaseUrl.split('https://')[1].split('.')[0];
    setFunctionUrl(`https://${projectRef}.supabase.co/functions/v1/data-receiver`);
  }, [user]);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: message,
      });
    });
  };

  const curlExample = `curl -X POST ${functionUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{
    "sensorId": "sensor-1",
    "temperature": 25.4,
    "humidity": 68,
    "pressure": 1013.2
  }'`;

  const jsExample = `// Using fetch API
const url = '${functionUrl}';
const apiKey = '${apiKey || 'YOUR_API_KEY'}';

const data = {
  sensorId: 'sensor-1',
  temperature: 25.4,
  humidity: 68,
  pressure: 1013.2
};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey
  },
  body: JSON.stringify(data)
})
.then(response => response.json())
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));`;

  const pythonExample = `import requests
import json

url = "${functionUrl}"
api_key = "${apiKey || 'YOUR_API_KEY'}"

headers = {
    'Content-Type': 'application/json',
    'x-api-key': api_key
}

data = {
    "sensorId": "sensor-1",
    "temperature": 25.4,
    "humidity": 68,
    "pressure": 1013.2
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print(response.json())`;

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <BookOpen className="h-5 w-5 text-primary" />
          Complete API Documentation
        </CardTitle>
        <CardDescription>
          Comprehensive guide for integrating with your data API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="errors">Error Handling</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">API Endpoint</h3>
              <div className="flex items-center justify-between bg-secondary p-3 rounded-md">
                <code className="text-xs sm:text-sm break-all">{functionUrl}</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(functionUrl, 'API endpoint copied!')}
                  className="h-8 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Authentication</h3>
              <p className="text-sm text-muted-foreground mb-2">
                All requests must include your API key in the <code>x-api-key</code> header.
              </p>
              <div className="flex items-center justify-between bg-secondary p-3 rounded-md">
                <code className="text-xs sm:text-sm">x-api-key: {apiKey || 'YOUR_API_KEY'}</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(`x-api-key: ${apiKey || 'YOUR_API_KEY'}`, 'Header copied!')}
                  className="h-8 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Data Schema</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your API accepts the following data structure:
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="schema">
                  <AccordionTrigger className="text-sm">View Schema</AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                      <pre className="text-xs sm:text-sm">
{`{
  "sensorId": "string",     // Required - Unique identifier for the sensor
  "timestamp": "string",    // Optional - ISO date string (auto-generated if not provided)
  "temperature": number,    // Optional - Temperature reading in celsius
  "humidity": number,       // Optional - Humidity percentage
  "pressure": number,       // Optional - Atmospheric pressure
  // Add any additional fields as needed
}`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Rate Limits</h3>
              <p className="text-sm text-muted-foreground">
                The API has a rate limit of <span className="font-medium">1000 requests per hour</span> per API key. 
                If you exceed this limit, you'll receive a 429 Too Many Requests response.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="examples" className="space-y-4">
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curl" className="relative">
                <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                  <pre className="text-xs sm:text-sm whitespace-pre-wrap">{curlExample}</pre>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => copyToClipboard(curlExample, 'cURL example copied!')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TabsContent>
              
              <TabsContent value="js" className="relative">
                <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                  <pre className="text-xs sm:text-sm whitespace-pre-wrap">{jsExample}</pre>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => copyToClipboard(jsExample, 'JavaScript example copied!')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TabsContent>
              
              <TabsContent value="python" className="relative">
                <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                  <pre className="text-xs sm:text-sm whitespace-pre-wrap">{pythonExample}</pre>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => copyToClipboard(pythonExample, 'Python example copied!')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TabsContent>
            </Tabs>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Batch Upload Example</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Send multiple data points in a single request:
              </p>
              <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// POST to ${apiEndpoint}/batch
{
  "data": [
    {
      "sensorId": "sensor-1",
      "temperature": 25.4,
      "humidity": 68
    },
    {
      "sensorId": "sensor-2",
      "temperature": 22.1,
      "pressure": 1015.3
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="responses" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Success Response</h3>
              <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// 200 OK
{
  "success": true,
  "message": "Data received successfully",
  "data": {
    "id": "entry-1625176468-123",
    "timestamp": "2023-07-01T15:01:08.468Z",
    "sourceId": "source-123",
    "sensorId": "sensor-1",
    "temperature": 25.4,
    "humidity": 68,
    "pressure": 1013.2
  }
}`}
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Batch Success Response</h3>
              <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// 200 OK
{
  "success": true,
  "message": "Batch data received successfully",
  "data": {
    "receivedCount": 2,
    "failedCount": 0,
    "entries": [
      { "id": "entry-1625176468-123", "sensorId": "sensor-1" },
      { "id": "entry-1625176468-124", "sensorId": "sensor-2" }
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="errors" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="auth-error">
                <AccordionTrigger className="text-sm">Authentication Errors</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// 401 Unauthorized
{
  "success": false,
  "message": "Invalid API key or inactive source",
  "code": "AUTH_FAILED"
}`}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="validation-error">
                <AccordionTrigger className="text-sm">Validation Errors</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// 400 Bad Request
{
  "success": false,
  "message": "Data validation failed",
  "errors": [
    "Missing required field: sensorId",
    "Field temperature should be type number, got string"
  ],
  "code": "VALIDATION_FAILED"
}`}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="rate-limit">
                <AccordionTrigger className="text-sm">Rate Limit Errors</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// 429 Too Many Requests
{
  "success": false,
  "message": "Rate limit exceeded. Try again in 37 seconds",
  "code": "RATE_LIMIT",
  "retryAfter": 37
}`}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="server-error">
                <AccordionTrigger className="text-sm">Server Errors</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// 500 Internal Server Error
{
  "success": false,
  "message": "An internal server error occurred",
  "code": "SERVER_ERROR"
}`}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApiDocumentation;
