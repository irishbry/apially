import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy, FileJson, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiService } from "@/services/ApiService";
import { supabase } from "@/integrations/supabase/client";

interface Source {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  active: boolean;
  last_active?: string;
  user_id: string;
  url?: string;
  data_count: number;
  schema?: any;
}

const ApiInstructions: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [currentSourceApiKey, setCurrentSourceApiKey] = useState('');
  const [componentKey, setComponentKey] = useState(0); // Force complete re-render
  const [domainName, setDomainName] = useState(window.location.origin || 'https://your-domain.com');
  const { toast } = useToast();

  console.log('🔄 ApiInstructions component rendered with componentKey:', componentKey);
  console.log('📋 Current state - apiKey:', apiKey, 'currentSourceApiKey:', currentSourceApiKey);

  useEffect(() => {
    console.log('🚀 Initial API key fetch effect running...');
    const savedKey = ApiService.getApiKey();
    console.log('💾 Saved API key from ApiService:', savedKey);
    if (savedKey) {
      setApiKey(savedKey);
      console.log('✅ Set initial apiKey to:', savedKey);
    } else {
      console.log('❌ No saved API key found');
    }
  }, []);

  // Listen for changes in sources to get the latest API key
  useEffect(() => {
    console.log('🔔 Setting up realtime subscription effect...');
    
    const fetchSources = async () => {
      try {
        console.log('📡 Fetching sources for API instructions...');
        const { data: sources, error } = await supabase
          .from('sources')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Error fetching sources:', error);
          return;
        }
        
        console.log('📊 Sources fetched:', sources);
        console.log('📊 Number of active sources found:', sources?.length || 0);
        
        if (sources && sources.length > 0) {
          // Get the most recently created active source's API key
          const latestSource = sources[0];
          console.log('🎯 Latest source:', latestSource);
          console.log('🔑 Latest source API key:', latestSource.api_key);
          const newApiKey = latestSource.api_key || '';
          
          console.log('🔍 Comparing API keys - current:', currentSourceApiKey, 'new:', newApiKey);
          
          // Only update if the API key actually changed
          if (newApiKey !== currentSourceApiKey) {
            console.log('🔄 API key changed! Updating state...');
            setCurrentSourceApiKey(newApiKey);
            // Force complete component re-render
            const newComponentKey = componentKey + 1;
            setComponentKey(newComponentKey);
            console.log('🔄 Component key updated to:', newComponentKey);
          } else {
            console.log('⏸️ API key unchanged, skipping update');
          }
        } else {
          console.log('⚠️ No active sources found');
          if (currentSourceApiKey !== '') {
            console.log('🔄 Clearing current source API key');
            setCurrentSourceApiKey('');
            setComponentKey(prev => {
              const newKey = prev + 1;
              console.log('🔄 Component key updated to (clearing):', newKey);
              return newKey;
            });
          }
        }
      } catch (err) {
        console.error('💥 Error in fetchSources:', err);
      }
    };

    // Initial fetch
    console.log('🎬 Running initial fetchSources...');
    fetchSources();

    // Subscribe to realtime changes
    console.log('📡 Setting up realtime subscription...');
    const channel = supabase
      .channel('sources_changes_api_instructions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sources' }, 
        (payload) => {
          console.log('🔔 Sources table changed! Payload:', payload);
          console.log('🔔 Event type:', payload.eventType);
          console.log('🔔 New record:', payload.new);
          console.log('🔔 Old record:', payload.old);
          
          // Fetch sources immediately with a small delay to ensure data consistency
          console.log('⏰ Setting timeout to refetch sources...');
          setTimeout(() => {
            console.log('⏰ Timeout triggered, fetching sources...');
            fetchSources();
          }, 200);
        }
      )
      .subscribe();
    
    console.log('📡 Realtime subscription created:', channel);
    
    return () => {
      console.log('🧹 Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [currentSourceApiKey, componentKey]);

  const copyToClipboard = (text: string, message: string) => {
    console.log('📋 Copying to clipboard:', message);
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
  
  console.log('🎯 Final display API key:', displayApiKey);
  console.log('🎯 API key sources - currentSourceApiKey:', currentSourceApiKey, 'fallback apiKey:', apiKey);

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
    <Card key={componentKey} className="w-full shadow-sm hover:shadow-md transition-all duration-300">
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
            {currentSourceApiKey && (
              <div className="flex items-center justify-between bg-green-50 p-3 rounded-md border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-800">Current API Key:</span>
                  <code className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">
                    {currentSourceApiKey.substring(0, 8)}...
                  </code>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(currentSourceApiKey, 'API key copied!')}
                  className="h-8 px-2 text-green-600 hover:text-green-800"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
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
