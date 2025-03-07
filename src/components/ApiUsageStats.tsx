
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Database, Clock, Activity } from "lucide-react";
import ApiService from "@/services/ApiService";

const ApiUsageStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    uniqueSources: 0,
    lastReceived: 'No data'
  });

  useEffect(() => {
    // Get initial stats
    updateStats();
    
    // Subscribe to data changes
    const unsubscribe = ApiService.subscribe(() => {
      updateStats();
    });
    
    return () => unsubscribe();
  }, []);

  const updateStats = () => {
    setStats(ApiService.getApiUsageStats());
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    if (timestamp === 'No data received') return 'No data';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="glass shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Total Requests</span>
              <span className="text-2xl font-bold mt-1">{stats.totalRequests}</span>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Unique Sources</span>
              <span className="text-2xl font-bold mt-1">{stats.uniqueSources}</span>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Database className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Last Received</span>
              <span className="text-2xl font-bold mt-1">{formatTimestamp(stats.lastReceived)}</span>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiUsageStats;
