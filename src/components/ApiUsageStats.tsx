import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Database, Clock, Activity, Users, Layers } from "lucide-react";
import { ApiService } from "@/services/ApiService";
import { useIsMobile } from "@/hooks/use-mobile";

const ApiUsageStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    uniqueSources: 0,
    lastReceived: 'No data'
  });
  
  const [sourceStats, setSourceStats] = useState({
    totalSources: 0,
    activeSources: 0,
    totalDataPoints: 0
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    // Get initial stats
    updateStats();
    
    // Subscribe to data changes
    const unsubscribeData = ApiService.subscribe(() => {
      updateStats();
    });
    
    // Subscribe to source changes
    const unsubscribeSources = ApiService.subscribeToSources(() => {
      updateStats();
    });
    
    return () => {
      unsubscribeData();
      unsubscribeSources();
    };
  }, []);

  const updateStats = () => {
    setStats(ApiService.getApiUsageStats());
    setSourceStats(ApiService.getSourcesStats());
  };

  // Format timestamp - modified to only show hours and minutes
  const formatTimestamp = (timestamp: string): string => {
    if (timestamp === 'No data received') return 'No data';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4'}`}>
      <Card className="glass shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Total Data Points</span>
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mt-1`}>{sourceStats.totalDataPoints}</span>
            </div>
            <div className={`bg-primary/10 ${isMobile ? 'p-2' : 'p-3'} rounded-full`}>
              <Activity className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Active Sources</span>
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mt-1`}>{sourceStats.activeSources}/{sourceStats.totalSources}</span>
            </div>
            <div className={`bg-primary/10 ${isMobile ? 'p-2' : 'p-3'} rounded-full`}>
              <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Unique Sources</span>
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mt-1`}>{stats.uniqueSources}</span>
            </div>
            <div className={`bg-primary/10 ${isMobile ? 'p-2' : 'p-3'} rounded-full`}>
              <Database className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Last Received</span>
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mt-1`}>{formatTimestamp(stats.lastReceived)}</span>
            </div>
            <div className={`bg-primary/10 ${isMobile ? 'p-2' : 'p-3'} rounded-full`}>
              <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {(!isMobile || (isMobile && sourceStats.totalDataPoints > 0)) && (
        <Card className="glass shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>Data Types</span>
                <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mt-1`}>{Object.keys(ApiService.getSchema().fieldTypes).length}</span>
              </div>
              <div className={`bg-primary/10 ${isMobile ? 'p-2' : 'p-3'} rounded-full`}>
                <Layers className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApiUsageStats;
