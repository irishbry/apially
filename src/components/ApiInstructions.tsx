import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy, FileJson, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiService } from "@/services/ApiService";
import { SourcesService } from "@/services/SourcesService";

const ApiInstructions: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [currentSourceApiKey, setCurrentSourceApiKey] = useState('');
  const [domainName, setDomainName] = useState(window.location.origin || 'https://your-domain.com');
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = ApiService.getApiKey();
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Listen for changes in sources to get the latest API key
  useEffect(() => {
    const unsubscribe = SourcesService.subscribeToSources((sources) => {
      if (sources.length > 0) {
        // Get the most recently created source's API key
        const latestSource = sources.sort((a, b) => {
          // Use created_at if available, otherwise fall back to id comparison
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        })[0];
        setCurrentSourceApiKey(latestSource.api_key || '');
      }
    });

    return unsubscribe;
  }, []);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: message,
      });
    });
  };

  const apiEndpoint = `${domainName}/api/data`;
  
  // Use the current source API key if available, otherwise fall back to the stored API key
  const displayApiKey = currentSourceApiKey || apiKey || 'YOUR_API_KEY';

  const curlExample = `curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${displayApiKey}" \\
  -d '{
    "sensorId": "sensor-1",
    "temperature": 25.4,
    "humidity": 68,
    "pressure": 1013.2
  }'`;

  const jsExample = `// Using fetch API
const url = '${apiEndpoint}';
const apiKey = '${displayApiKey}';

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
          <FileJson className="h-5 w-5 text-primary" />
          API Integration Guide
        </CardTitle>
        <CardDescription>
          Instructions for integrating with your data consolidation API
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
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium flex items-center gap-1"><Globe className="h-3 w-3" /> Note:</span> This endpoint will automatically use your domain name. After deployment to SiteGround, this will reflect your actual server address.
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
