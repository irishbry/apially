
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy, FileJson, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataSchema } from '@/types/api.types';

interface ApiInstructionsProps {
  currentApiKey?: string;
  schema?: DataSchema;
}

const ApiInstructions: React.FC<ApiInstructionsProps> = ({ currentApiKey, schema }) => {
  const [domainName] = React.useState(window.location.origin || 'https://your-domain.com');
  const { toast } = useToast();

  console.log('🔥 ApiInstructions rendered with currentApiKey:', currentApiKey);
  console.log('🔥 ApiInstructions rendered with schema:', schema);

  const copyToClipboard = (text: string, message: string) => {
    console.log('📋 COPY: Copying to clipboard:', message, 'Text:', text);
    navigator.clipboard.writeText(text).then(() => {
      console.log('📋 COPY: Successfully copied to clipboard');
      toast({
        title: "Copied!",
        description: message,
      });
    }).catch(err => {
      console.error('📋 COPY: Failed to copy to clipboard:', err);
    });
  };

  const apiEndpoint = `https://ybionvegojopebtkdgyt.supabase.co/functions/v1/data-receiver`;
  // Always use currentApiKey if provided, otherwise fall back to placeholder
  const displayApiKey = currentApiKey || 'YOUR_API_KEY';
  
  console.log('🎯 RENDER: Using currentApiKey for displayApiKey:', displayApiKey);
  
  // Generate example data based on schema or use minimal default
  const generateExampleData = () => {
    if (schema && Object.keys(schema.fieldTypes).length > 0) {
      const exampleData: Record<string, any> = {};
      
      Object.entries(schema.fieldTypes).forEach(([field, type]) => {
        switch (type) {
          case 'string':
            exampleData[field] = field.toLowerCase().includes('id') ? `${field}-1` : `example_${field}`;
            break;
          case 'number':
            exampleData[field] = field.toLowerCase().includes('temp') ? 25.4 : 
                                 field.toLowerCase().includes('humidity') ? 68 : 
                                 field.toLowerCase().includes('pressure') ? 1013.2 : 100;
            break;
          case 'boolean':
            exampleData[field] = true;
            break;
          case 'array':
            exampleData[field] = [`item1`, `item2`];
            break;
          case 'object':
            exampleData[field] = { key: 'value' };
            break;
          default:
            exampleData[field] = `example_${field}`;
        }
      });
      
      return exampleData;
    }
    
    // Minimal default example data - only basic structure
    return {
      sensorId: "sensor-001",
      timestamp: new Date().toISOString()
    };
  };

  const exampleData = generateExampleData();
  const exampleDataJson = JSON.stringify(exampleData, null, 4);
  
  console.log('🎯 RENDER: Final values being used for display:');
  console.log('🎯 RENDER: - apiEndpoint:', apiEndpoint);
  console.log('🎯 RENDER: - displayApiKey:', displayApiKey);
  console.log('🎯 RENDER: - exampleData:', exampleData);

  const curlExample = `curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${displayApiKey}" \\
  -d '${exampleDataJson}'`;

  const jsExample = `// Using fetch API
const url = '${apiEndpoint}';
const apiKey = '${displayApiKey}';

const data = ${exampleDataJson};

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

url = "${apiEndpoint}"
api_key = "${displayApiKey}"

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': api_key
}

data = ${exampleDataJson}

response = requests.post(url, headers=headers, data=json.dumps(data))
print(response.json())`;

  console.log('🎯 RENDER: Code examples generated with displayApiKey:', displayApiKey);

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <FileJson className="h-5 w-5 text-primary" />
          API Integration Guide
        </CardTitle>
        <CardDescription>
          Instructions for integrating with your data consolidation API
          {schema && Object.keys(schema.fieldTypes).length > 0 && (
            <span className="block mt-1 text-green-600 font-medium">
              Examples updated based on your schema configuration
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Endpoint and Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Send your data to the following endpoint using your API key for authentication:
            </p>
            <div className="flex items-center justify-between bg-secondary p-3 rounded-md">
              <code className="text-xs sm:text-sm break-all">{apiEndpoint}</code>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(apiEndpoint, 'API endpoint copied!')}
                className="h-8 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {currentApiKey && (
              <div className="flex items-center justify-between bg-green-50 p-3 rounded-md border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-800">Current API Key:</span>
                  <code className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">
                    {currentApiKey.substring(0, 8)}...
                  </code>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(currentApiKey, 'API key copied!')}
                  className="h-8 px-2 text-green-600 hover:text-green-800"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium flex items-center gap-1"><Globe className="h-3 w-3" /> Note:</span> This is the Supabase edge function endpoint for receiving data. The endpoint is hosted on Supabase's infrastructure.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Request Format</h3>
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
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">CSV Export Schedule</h3>
            <p className="text-sm text-muted-foreground">
              All data received throughout the day will be automatically consolidated into a CSV file and exported 
              to your configured Dropbox location at midnight UTC. You can also trigger manual exports from the Control Panel.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiInstructions;
