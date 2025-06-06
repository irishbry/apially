
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
  const [componentKey, setComponentKey] = useState(0);
  const [domainName, setDomainName] = useState(window.location.origin || 'https://your-domain.com');
  const { toast } = useToast();

  console.log('🔥 =========================== APIINSTRUCTIONS COMPONENT RENDERED ===========================');
  console.log('🔥 Component render count (componentKey):', componentKey);
  console.log('🔥 Current apiKey state:', apiKey);
  console.log('🔥 Current currentSourceApiKey state:', currentSourceApiKey);
  console.log('🔥 Domain name:', domainName);
  console.log('🔥 ===================================================================================');

  useEffect(() => {
    console.log('🚀 EFFECT 1: Initial API key fetch effect STARTING...');
    const savedKey = ApiService.getApiKey();
    console.log('🚀 EFFECT 1: Saved API key from ApiService:', savedKey);
    if (savedKey) {
      console.log('🚀 EFFECT 1: Setting initial apiKey to:', savedKey);
      setApiKey(savedKey);
    } else {
      console.log('🚀 EFFECT 1: No saved API key found, keeping empty');
    }
    console.log('🚀 EFFECT 1: Initial API key fetch effect COMPLETED');
  }, []);

  useEffect(() => {
    console.log('📡 EFFECT 2: Realtime subscription effect STARTING...');
    console.log('📡 EFFECT 2: Dependencies - currentSourceApiKey:', currentSourceApiKey, 'componentKey:', componentKey);
    
    const fetchSources = async () => {
      try {
        console.log('📊 FETCH_SOURCES: Starting to fetch sources...');
        const { data: sources, error } = await supabase
          .from('sources')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ FETCH_SOURCES: Error fetching sources:', error);
          return;
        }
        
        console.log('📊 FETCH_SOURCES: Raw sources data:', sources);
        console.log('📊 FETCH_SOURCES: Number of active sources found:', sources?.length || 0);
        
        if (sources && sources.length > 0) {
          const latestSource = sources[0];
          console.log('🎯 FETCH_SOURCES: Latest source found:', latestSource);
          console.log('🎯 FETCH_SOURCES: Latest source API key:', latestSource.api_key);
          const newApiKey = latestSource.api_key || '';
          
          console.log('🔍 FETCH_SOURCES: Comparing API keys:');
          console.log('🔍 FETCH_SOURCES: - Current in state:', currentSourceApiKey);
          console.log('🔍 FETCH_SOURCES: - New from DB:', newApiKey);
          console.log('🔍 FETCH_SOURCES: - Are they different?', newApiKey !== currentSourceApiKey);
          
          if (newApiKey !== currentSourceApiKey) {
            console.log('🔄 FETCH_SOURCES: API key CHANGED! Updating state...');
            console.log('🔄 FETCH_SOURCES: Setting currentSourceApiKey from', currentSourceApiKey, 'to', newApiKey);
            setCurrentSourceApiKey(newApiKey);
            
            const newComponentKey = componentKey + 1;
            console.log('🔄 FETCH_SOURCES: Incrementing componentKey from', componentKey, 'to', newComponentKey);
            setComponentKey(newComponentKey);
            
            console.log('✅ FETCH_SOURCES: State updates completed!');
          } else {
            console.log('⏸️ FETCH_SOURCES: API key UNCHANGED, skipping update');
          }
        } else {
          console.log('⚠️ FETCH_SOURCES: No active sources found');
          if (currentSourceApiKey !== '') {
            console.log('🔄 FETCH_SOURCES: Clearing current source API key');
            setCurrentSourceApiKey('');
            setComponentKey(prev => {
              const newKey = prev + 1;
              console.log('🔄 FETCH_SOURCES: Component key updated to (clearing):', newKey);
              return newKey;
            });
          }
        }
      } catch (err) {
        console.error('💥 FETCH_SOURCES: Error in fetchSources:', err);
      }
    };

    console.log('🎬 EFFECT 2: Running initial fetchSources...');
    fetchSources();

    console.log('📡 EFFECT 2: Setting up realtime subscription...');
    const channel = supabase
      .channel('sources_changes_api_instructions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sources' }, 
        (payload) => {
          console.log('🔔 REALTIME: Sources table changed! Full payload:', payload);
          console.log('🔔 REALTIME: Event type:', payload.eventType);
          console.log('🔔 REALTIME: New record:', payload.new);
          console.log('🔔 REALTIME: Old record:', payload.old);
          
          console.log('⏰ REALTIME: Setting 200ms timeout to refetch sources...');
          setTimeout(() => {
            console.log('⏰ REALTIME: Timeout triggered, calling fetchSources...');
            fetchSources();
          }, 200);
        }
      )
      .subscribe();
    
    console.log('📡 EFFECT 2: Realtime subscription created:', channel);
    
    return () => {
      console.log('🧹 EFFECT 2: Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [currentSourceApiKey, componentKey]);

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

  const apiEndpoint = `${domainName}/api/data`;
  const displayApiKey = currentSourceApiKey || apiKey || 'YOUR_API_KEY';
  
  console.log('🎯 RENDER: Final values being used for display:');
  console.log('🎯 RENDER: - apiEndpoint:', apiEndpoint);
  console.log('🎯 RENDER: - displayApiKey:', displayApiKey);
  console.log('🎯 RENDER: - currentSourceApiKey:', currentSourceApiKey);
  console.log('🎯 RENDER: - fallback apiKey:', apiKey);
  console.log('🎯 RENDER: - componentKey:', componentKey);

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

  console.log('🎯 RENDER: Code examples generated with displayApiKey:', displayApiKey);

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
