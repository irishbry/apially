
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, Database, Send, X } from "lucide-react";
import { ApiService, DataEntry, Source } from "@/services/ApiService";
import { useToast } from "@/components/ui/use-toast";

const ControlPanel: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{success: boolean, message: string} | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Load sources
    const fetchSources = async () => {
      const fetchedSources = await ApiService.getSources();
      setSources(fetchedSources);
      
      // Select first source by default if available
      if (fetchedSources.length > 0) {
        setSelectedSource(fetchedSources[0].id);
      }
    };
    
    fetchSources();
    
    // Subscribe to source changes
    const unsubscribe = ApiService.subscribeToSources(newSources => {
      setSources([...newSources]);
      
      // If current selected source is removed, select the first available one
      if (newSources.length > 0 && !newSources.find(s => s.id === selectedSource)) {
        setSelectedSource(newSources[0].id);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const sendTestData = async () => {
    setIsSending(true);
    setLastResult(null);
    
    // Get selected source
    const source = sources.find(s => s.id === selectedSource);
    
    if (!source) {
      setLastResult({
        success: false,
        message: "No source selected. Please select a source first.",
      });
      toast({
        title: "Error",
        description: "No source selected. Please select a source first.",
        variant: "destructive",
      });
      setIsSending(false);
      return;
    }
    
    // Create test data
    const testData: DataEntry = {
      timestamp: new Date().toISOString(),
      sensorId: `test-sensor-${Math.floor(Math.random() * 5) + 1}`,
      temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
      humidity: Math.round(Math.random() * 100),
      pressure: Math.round((Math.random() * 50 + 970) * 10) / 10,
    };
    
    try {
      // Log the API key being used
      console.log("Using API key for source:", source.name, "Key:", source.api_key ? source.api_key.substring(0, 5) + "..." : "missing");
      
      // Await the result of the API call
      const result = await ApiService.receiveData(testData, source.api_key);
      
      setLastResult({
        success: result.success,
        message: result.message,
      });
      
      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error sending test data:", error);
      setLastResult({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred while sending test data.",
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while sending test data.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const triggerExport = () => {
    ApiService.exportToCsv();
  };

  const clearAllData = () => {
    ApiService.clearData();
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-medium">Control Panel</CardTitle>
        <CardDescription>
          Test API functionality and trigger operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Test Data Submission</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="source-select" className="text-sm text-muted-foreground">
                  Select Source for Test Data
                </label>
                <Select 
                  value={selectedSource} 
                  onValueChange={setSelectedSource}
                  disabled={sources.length === 0}
                >
                  <SelectTrigger id="source-select">
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                    {sources.length === 0 && (
                      <SelectItem value="none" disabled>
                        No sources available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={sendTestData} 
                disabled={isSending || sources.length === 0 || !selectedSource}
                className="hover-lift"
              >
                {isSending ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Data
                  </>
                )}
              </Button>
              
              {lastResult && (
                <div className={`mt-2 text-sm flex items-center ${
                  lastResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {lastResult.success ? (
                    <CheckCircle className="mr-1 h-4 w-4" />
                  ) : (
                    <X className="mr-1 h-4 w-4" />
                  )}
                  {lastResult.message}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Manual Operations</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={triggerExport}
                className="hover-lift"
              >
                <Clock className="mr-2 h-4 w-4" />
                Trigger CSV Export Now
              </Button>
              
              <Button
                variant="outline"
                onClick={clearAllData}
                className="hover-lift"
              >
                <Database className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
