
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Clock, ArrowUpRight } from "lucide-react";
import { format } from 'date-fns';
import { ApiService, DataEntry } from "@/services/ApiService";

const MobileDataSummary: React.FC = () => {
  const [data, setData] = useState<DataEntry[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{day: string, count: number}[]>([]);
  const [lastReceived, setLastReceived] = useState<string | null>(null);
  
  useEffect(() => {
    // Load initial data
    const fetchData = async () => {
      const initialData = await ApiService.getData();
      setData(initialData);
    };
    
    fetchData();
    
    // Subscribe to data changes
    const unsubscribe = ApiService.subscribe(newData => {
      setData([...newData]);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (data.length === 0) return;
    
    // Count today's data points
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayData = data.filter(entry => {
      if (!entry.timestamp) return false;
      const entryDate = new Date(entry.timestamp);
      return entryDate >= today;
    });
    
    setTodayCount(todayData.length);
    
    // Find the last received timestamp
    const timestamps = data
      .filter(entry => entry.timestamp)
      .map(entry => entry.timestamp as string);
    
    if (timestamps.length > 0) {
      const sortedTimestamps = [...timestamps].sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
      });
      setLastReceived(sortedTimestamps[0]);
    }
    
    // Calculate weekly data
    const weeklyStats = calculateWeeklyData(data);
    setWeeklyData(weeklyStats);
  }, [data]);
  
  const calculateWeeklyData = (data: DataEntry[]) => {
    const result: {day: string, count: number}[] = [];
    const now = new Date();
    
    // Get dates for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      // Filter data for this day
      const dayData = data.filter(entry => {
        if (!entry.timestamp) return false;
        const entryTime = new Date(entry.timestamp).getTime();
        return entryTime >= date.getTime() && entryTime < nextDate.getTime();
      });
      
      result.push({
        day: format(date, 'EEE'),
        count: dayData.length
      });
    }
    
    return result;
  };
  
  // Format the time
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'No data';
    
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Calculate percentage change (avoiding division by zero)
  const calculatePercentChange = (current: number, previous: number): string => {
    if (previous === 0) {
      return current > 0 ? '+100%' : '0%';
    }
    
    const percentChange = Math.round(((current - previous) / previous) * 100);
    return `${percentChange > 0 ? '+' : ''}${percentChange}%`;
  };
  
  // Use a safe previous day count (defaulting to 0 if unavailable)
  const previousDayCount = weeklyData.length > 1 ? (weeklyData[weeklyData.length - 2]?.count || 0) : 0;
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-medium">Today's Data</h3>
          <div className="text-xs text-muted-foreground">
            Last updated: {formatTime(lastReceived)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{todayCount}</span>
              {todayCount !== previousDayCount && (
                <span className={`text-xs ${todayCount > previousDayCount ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {calculatePercentChange(todayCount, previousDayCount)}
                  <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Data points received</span>
          </div>
          
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value) => [value, 'Data points']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileDataSummary;
