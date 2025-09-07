import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy, FileJson, Globe, BookOpen, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ConfigService } from "@/services/ConfigService";
import { DataSchema } from "@/types/api.types";

interface ApiDocumentationProps {
  selectedApiKey?: string;
}

const ApiDocumentation: React.FC<ApiDocumentationProps> = ({ selectedApiKey }) => {
  const [apiKey, setApiKey] = useState('');
  const [functionUrl, setFunctionUrl] = useState('');
  const [schema, setSchema] = useState<DataSchema>({ fieldTypes: {}, requiredFields: [] });
  const [schemaLoaded, setSchemaLoaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Update the API key whenever selectedApiKey changes
  useEffect(() => {
    console.log('ApiDocumentation: selectedApiKey prop changed:', selectedApiKey);
    
    if (selectedApiKey) {
      console.log('Using selected API key for documentation:', selectedApiKey);
      setApiKey(selectedApiKey);
      fetchSchema(selectedApiKey);
    } else {
      console.log('No selectedApiKey provided, fetching from database');
      fetchApiKey();
    }
    
    const projectRef = "api.apially.com";
    setFunctionUrl(`https://${projectRef}/functions/v1/data-receiver`);
  }, [selectedApiKey, user]);

  // Listen for schema updates from other components
  useEffect(() => {
    const handleSchemaUpdate = async (event?: CustomEvent) => {
      console.log('📡 ApiDocumentation: Schema update event received:', event?.detail);
      
      // Get the current API key to use for comparison
      const currentApiKey = selectedApiKey || apiKey;
      
      // If event has detail with apiKey, check if it matches current API key
      if (event?.detail?.apiKey && event.detail.apiKey !== currentApiKey) {
        console.log('📡 ApiDocumentation: Schema update for different API key, ignoring');
        return;
      }
      
      if (currentApiKey) {
        console.log('📡 ApiDocumentation: Refreshing schema for API key:', currentApiKey);
        try {
          const updatedSchema = await ConfigService.getSchema(currentApiKey);
          console.log('📡 ApiDocumentation: Updated schema loaded:', updatedSchema);
          setSchema(updatedSchema);
          setSchemaLoaded(true);
          
          // Force a re-render by updating the state
          setTimeout(() => {
            console.log('📡 ApiDocumentation: Schema state updated, component should re-render');
          }, 100);
        } catch (error) {
          console.error('📡 ApiDocumentation: Error loading updated schema:', error);
        }
      }
    };

    // Listen for multiple types of schema update events
    const handleSchemaUpdated = (e: Event) => handleSchemaUpdate(e as CustomEvent);
    const handleApiSchemaChanged = (e: Event) => handleSchemaUpdate(e as CustomEvent);
    
    window.addEventListener('schemaUpdated', handleSchemaUpdated);
    window.addEventListener('apiSchemaChanged', handleApiSchemaChanged);
    
    return () => {
      window.removeEventListener('schemaUpdated', handleSchemaUpdated);
      window.removeEventListener('apiSchemaChanged', handleApiSchemaChanged);
    };
  }, [selectedApiKey, apiKey]);

  const fetchApiKey = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        console.log('Fetched API key from database:', data.api_key);
        setApiKey(data.api_key);
        fetchSchema(data.api_key);
      }
    } catch (err) {
      console.error('Error fetching API key:', err);
    }
  };

  const fetchSchema = async (apiKey: string) => {
    try {
      console.log("Fetching schema for API key:", apiKey);
      const schemaData = await ConfigService.getSchema(apiKey);
      if (schemaData) {
        console.log("Schema fetched successfully:", schemaData);
        setSchema(schemaData);
        setSchemaLoaded(true);
      } else {
        console.log("No schema found for API key");
      }
    } catch (err) {
      console.error('Error fetching schema for documentation:', err);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: message,
      });
    });
  };

  const getSchemaJsonDisplay = () => {
    const schemaObj: Record<string, string> = {
     
    };
    
    if (schemaLoaded && schema && schema.fieldTypes) {
      for (const [field, type] of Object.entries(schema.fieldTypes)) {
        schemaObj[field] = type;
      }
    }
    
    return JSON.stringify(schemaObj, null, 2);
  };

  const getRequiredFieldsText = () => {
    if (!schemaLoaded || !schema.requiredFields || schema.requiredFields.length === 0) {
      return "// No fields are marked as required";
    }
    
    return "// Required fields: " + schema.requiredFields.join(", ");
  };

  const getSchemaDescription = () => {
    const fieldDescriptions: string[] = [];
    
    // fieldDescriptions.push('"sensorId": "string"     // Unique identifier for the sensor');
    // fieldDescriptions.push('"timestamp": "string"    // ISO date string (auto-generated if not provided)');
    
    if (schemaLoaded && schema && schema.fieldTypes) {
      for (const [field, type] of Object.entries(schema.fieldTypes)) {
        if (field !== "sensorId" && field !== "timestamp") {
          const isRequired = schema.requiredFields.includes(field) ? " (Required)" : "";
          fieldDescriptions.push(`"${field}": "${type}"${isRequired}    // Custom field`);
        }
      }
    }
    
    return fieldDescriptions.join('\n');
  };

  const getExampleDataObject = () => {
    const exampleData: Record<string, any> = {
    
    };
    
    if (schemaLoaded && schema && schema.fieldTypes) {
      for (const [field, type] of Object.entries(schema.fieldTypes)) {
        if (field !== "sensorId" && field !== "timestamp") {
          if (type === "number") {
            if (field === "temperature") exampleData[field] = 25.4;
            else if (field === "humidity") exampleData[field] = 68;
            else if (field === "pressure") exampleData[field] = 1013.2;
            else exampleData[field] = 42.5;
          } else if (type === "boolean") {
            exampleData[field] = true;
          } else if (type === "string") {
            exampleData[field] = `example-${field}`;
          } else if (type === "array") {
            exampleData[field] = [1, 2, 3];
          } else if (type === "object") {
            exampleData[field] = { "key": "value" };
          }
        }
      }
    } else {
      // exampleData["temperature"] = 25.4;
      // exampleData["humidity"] = 68;
      // exampleData["pressure"] = 1013.2;
    }
    
    return exampleData;
  };

  const getExampleDataJson = () => {
    const exampleData = getExampleDataObject();
    return JSON.stringify(exampleData, null, 2);
  };

  const getDynamicSuccessResponse = () => {
    const exampleData = getExampleDataObject();
    const responseData = {
      success: true,
      message: "Data received successfully",
      data: {
        id: "entry-" + Date.now().toString().substring(0, 10) + "-123",
  
        sourceId: "source-123",

        ...exampleData
      }
    };
    
    return JSON.stringify(responseData, null, 2);
  };

  const getDynamicBatchExample = () => {
    const exampleData = getExampleDataObject();
    const exampleData2: Record<string, any> = { ...exampleData };
    
    // Create variation for second entry
    if (schemaLoaded && schema && schema.fieldTypes) {
      Object.entries(schema.fieldTypes).forEach(([field, type]) => {
        if (type === "number") {
          if (field === "temperature") exampleData2[field] = 22.1;
          else if (field === "humidity") exampleData2[field] = 65;
          else if (field === "pressure") exampleData2[field] = 1015.3;
          else exampleData2[field] = exampleData[field] + 5;
        } else if (type === "string") {
          exampleData2[field] = `modified-${field}`;
        } else if (type === "boolean") {
          exampleData2[field] = !exampleData[field];
        }
      });
    }
    
    const batchData = {
      data: [exampleData, exampleData2]
    };
    
    return JSON.stringify(batchData, null, 2);
  };

  const getDynamicBatchSuccessResponse = () => {
    const exampleData = getExampleDataObject();
    const exampleData2: Record<string, any> = { ...exampleData };
    
    if ("temperature" in exampleData2) {
      exampleData2.temperature = 22.1;
    }
    
    const responseData = {
      success: true,
      message: "Batch data received successfully",
      data: {
        receivedCount: 2,
        failedCount: 0,
        entries: [
          { 
            id: "entry-" + Date.now().toString().substring(0, 10) + "-123", 
           sourceId: "source-123"
          },
          { 
            id: "entry-" + Date.now().toString().substring(0, 10) + "-124", 
            sourceId: "source-123"
          }
        ]
      }
    };
    
    return JSON.stringify(responseData, null, 2);
  };

  const getDynamicValidationErrorResponse = () => {
    const requiredFields = schemaLoaded && schema.requiredFields ? schema.requiredFields : ["temperature"];
    
    const responseData = {
      success: false,
      message: "Data validation failed",
      code: "VALIDATION_ERROR",
      errors: [
        requiredFields.length > 0 
          ? `Missing required field: ${requiredFields[0]}`
          : "Invalid data format"
      ]
    };
    
    return JSON.stringify(responseData, null, 2);
  };

  // Always use selectedApiKey if provided, otherwise fall back to apiKey state
  const displayApiKey = selectedApiKey || apiKey || 'YOUR_API_KEY';
  
  console.log('ApiDocumentation rendering with displayApiKey:', displayApiKey);

  const curlExample = `curl -X POST ${functionUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${displayApiKey}" \\
  -d '${getExampleDataJson()}'`;

  const jsExample = `// Using fetch API
const url = '${functionUrl}';
const apiKey = '${displayApiKey}';

const data = ${getExampleDataJson()};

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify(data)
})
.then(response => response.json())
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));`;

  const pythonExample = `import requests
import json

url = "${functionUrl}"
api_key = "${displayApiKey}"

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': api_key
}

data = ${getExampleDataJson().replace(/^/gm, '    ')}

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
          {displayApiKey && displayApiKey !== 'YOUR_API_KEY' && (
            <span className="block mt-1 text-green-600 font-medium">
              Using API key: {displayApiKey.substring(0, 8)}...
            </span>
          )}
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
                All requests must include your API key in the <code>X-API-Key</code> header.
              </p>
              <div className="flex items-center justify-between bg-secondary p-3 rounded-md">
                <code className="text-xs sm:text-sm">X-API-Key: {displayApiKey}</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(`X-API-Key: ${displayApiKey}`, 'Header copied!')}
                  className="h-8 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Important:</span> Send your API key as-is, without any "Bearer" prefix.
              </p>
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
{`// JSON Schema
${getSchemaJsonDisplay()}

// Field details
${getSchemaDescription()}

${getRequiredFieldsText()}`}
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
              <h3 className="text-lg font-medium mb-2">Postman Instructions</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When using Postman or similar API tools:
              </p>
              <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                <ol className="text-xs sm:text-sm list-decimal list-inside space-y-1">
                  <li>Set request method to <strong>POST</strong></li>
                  <li>Enter URL: <code>{functionUrl}</code></li>
                  <li>In Headers tab, add:
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><code>Content-Type: application/json</code></li>
                      <li><code>X-API-Key: {displayApiKey}</code> (plain text, no Bearer prefix)</li>
                    </ul>
                  </li>
                  <li>In Body tab, select "raw" and "JSON", then enter your data payload</li>
                </ol>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Batch Upload Example</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Send multiple data points in a single request:
              </p>
              <div className="bg-secondary p-3 rounded-md overflow-x-auto relative">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// POST to ${functionUrl}/batch
${getDynamicBatchExample()}`}
                </pre>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => copyToClipboard(`// POST to ${functionUrl}/batch\n${getDynamicBatchExample()}`, 'Batch example copied!')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="responses" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Success Response</h3>
              <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// 200 OK
${getDynamicSuccessResponse()}`}
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Batch Success Response</h3>
              <div className="bg-secondary p-3 rounded-md overflow-x-auto">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap">
{`// 200 OK
${getDynamicBatchSuccessResponse()}`}
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
{`// 403 Forbidden
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
${getDynamicValidationErrorResponse()}`}
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
