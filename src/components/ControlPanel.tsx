
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Database, Send, X } from "lucide-react";
import ApiService, { DataEntry } from "@/services/ApiService";
import { useToast } from "@/components/ui/use-toast";

const ControlPanel: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{success: boolean, message: string} | null>(null);
  const { toast } = useToast();

  const sendTestData = () => {
    setIsSending(true);
    setLastResult(null);
    
    // Create test data
    const testData: DataEntry = {
      timestamp: new Date().toISOString(),
      sensorId: `test-sensor-${Math.floor(Math.random() * 5) + 1}`,
      temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
      humidity: Math.round(Math.random() * 100),
      pressure: Math.round((Math.random() * 50 + 970) * 10) / 10,
    };
    
    // Simulate API call delay
    setTimeout(() => {
      const apiKey = ApiService.getApiKey();
      
      if (!apiKey) {
        setLastResult({
          success: false,
          message: "No API key set. Please set an API key first.",
        });
        toast({
          title: "Error",
          description: "No API key set. Please set an API key first.",
          variant: "destructive",
        });
      } else {
        const result = ApiService.receiveData(testData, apiKey);
        
        setLastResult({
          success: result.success,
          message: result.message,
        });
        
        toast({
          title: result.success ? "Success" : "Error",
          description: result.message,
          variant: result.success ? "default" : "destructive",
        });
      }
      
      setIsSending(false);
    }, 800);
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
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Test Data Submission</h3>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={sendTestData} 
                disabled={isSending}
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
