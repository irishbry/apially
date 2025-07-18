
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Clock, Activity, Users, Layers } from "lucide-react";
import { ApiService, DataEntry, Source } from "@/services/ApiService";
import { useIsMobile } from "@/hooks/use-mobile";

interface ApiUsageStatsProps {
  data?: DataEntry[];
  sources?: Source[];
  tableStats?: {
    totalCount: number;
    sources: Source[];
    lastReceived: string;
    uniqueSources: number;
  } | null;
}

const ApiUsageStats: React.FC<ApiUsageStatsProps> = ({ data: propData, sources: propSources, tableStats }) => {
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

  const [schemaFieldCount, setSchemaFieldCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSchemaLoading, setIsSchemaLoading] = useState(true);
  const isMobile = useIsMobile();

  // Use prop data if provided, otherwise fetch real stats from API
  const data = propData || [];
  const sources = propSources || [];

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        if (tableStats) {
          // Use stats provided by the table component (no API calls needed!)
          setStats({
            totalRequests: tableStats.totalCount,
            uniqueSources: tableStats.uniqueSources,
            lastReceived: tableStats.lastReceived
          });
          
          setSourceStats({
            totalSources: tableStats.sources.length,
            activeSources: tableStats.sources.filter(s => s.active).length,
            totalDataPoints: tableStats.totalCount
          });
          setIsLoading(false);
        } else if (propData) {
          // If prop data is provided, calculate from it (for components that pass filtered data)
          const statsData = {
            totalRequests: data.length,
            uniqueSources: new Set(data.map(item => item.sourceId || item.source_id)).size,
            lastReceived: data.length > 0 ? data[0].timestamp : 'No data'
          };
          setStats(statsData);
          
          const srcStats = {
            totalSources: sources.length,
            activeSources: sources.filter(s => s.active).length,
            totalDataPoints: data.length
          };
          setSourceStats(srcStats);
          setIsLoading(false);
        } else {
          // If no prop data or table stats, get real statistics from server
          const realStats = await ApiService.getDataStats();
          const sourcesData = await ApiService.getSources();
          
          setStats({
            totalRequests: realStats.totalCount,
            uniqueSources: realStats.uniqueSources,
            lastReceived: realStats.lastReceived
          });
          
          setSourceStats({
            totalSources: sourcesData.length,
            activeSources: sourcesData.filter(s => s.active).length,
            totalDataPoints: realStats.totalCount
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [data, sources, propData, propSources, tableStats]);

  useEffect(() => {
    // Get schema field count
    const fetchSchemaFieldCount = async () => {
      setIsSchemaLoading(true);
      try {
        const schema = await ApiService.getSchema();
        setSchemaFieldCount(Object.keys(schema.fieldTypes || {}).length);
      } catch (error) {
        console.error("Error fetching schema:", error);
      } finally {
        setIsSchemaLoading(false);
      }
    };
    
    fetchSchemaFieldCount();
  }, []);

  // Format timestamp - modified to only show hours and minutes
  const formatTimestamp = (timestamp: string): string => {
    if (timestamp === 'No data received' || timestamp === 'No data') return 'No data';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timestamp;
    }
  };

  // Skeleton component for loading state
  const StatCardSkeleton = () => (
    <Card className="glass shadow-sm">
      <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-2">
            <Skeleton className={`${isMobile ? 'h-3 w-16' : 'h-4 w-20'}`} />
            <Skeleton className={`${isMobile ? 'h-6 w-12' : 'h-8 w-16'}`} />
          </div>
          <Skeleton className={`${isMobile ? 'h-8 w-8' : 'h-11 w-11'} rounded-full`} />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4'}`}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        {(!isMobile || (isMobile && true)) && <StatCardSkeleton />}
      </div>
    );
  }

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
                {isSchemaLoading ? (
                  <Skeleton className={`${isMobile ? 'h-6 w-8' : 'h-8 w-12'} mt-1`} />
                ) : (
                  <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mt-1`}>{schemaFieldCount}</span>
                )}
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
