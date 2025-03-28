
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, TrendingUp } from "lucide-react";
import ApiService, { DataEntry } from "@/services/ApiService";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const TIME_PERIODS = [
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 60 days', value: '60d' }
];

const MobileDataSummary: React.FC = () => {
  const [data, setData] = useState<DataEntry[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [timePeriod, setTimePeriod] = useState('24h');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Get initial data
    setData(ApiService.getData());
    
    // Get sources
    const sourcesData = ApiService.getSources();
    setSources(sourcesData.map(s => ({ id: s.id, name: s.name })));
    
    // Subscribe to data changes
    const unsubscribeData = ApiService.subscribe(newData => {
      setData([...newData]);
    });
    
    // Subscribe to source changes
    const unsubscribeSources = ApiService.subscribeToSources(newSources => {
      setSources(newSources.map(s => ({ id: s.id, name: s.name })));
    });
    
    return () => {
      unsubscribeData();
      unsubscribeSources();
    };
  }, []);

  useEffect(() => {
    prepareChartData();
  }, [data, timePeriod]);

  const prepareChartData = () => {
    if (data.length === 0) {
      setChartData([]);
      return;
    }

    // Filter data based on selected time period
    const now = new Date();
    let periodStartMs = now.getTime();
    
    switch (timePeriod) {
      case '24h':
        periodStartMs -= 24 * 60 * 60 * 1000;
        break;
      case '7d':
        periodStartMs -= 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        periodStartMs -= 30 * 24 * 60 * 60 * 1000;
        break;
      case '60d':
        periodStartMs -= 60 * 24 * 60 * 60 * 1000;
        break;
    }
    
    const periodStart = new Date(periodStartMs);
    
    // Filter data for the selected period
    const filteredData = data.filter(entry => {
      if (!entry.timestamp) return false;
      const entryDate = new Date(entry.timestamp);
      return entryDate >= periodStart && entryDate <= now;
    });
    
    // Group data by source
    const dataBySource = filteredData.reduce((acc, entry) => {
      const sourceId = entry.sourceId || 'unknown';
      if (!acc[sourceId]) {
        acc[sourceId] = 0;
      }
      acc[sourceId]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Format for chart
    const formattedData = Object.entries(dataBySource).map(([sourceId, count]) => {
      const source = sources.find(s => s.id === sourceId);
      return {
        name: source ? source.name : 'Unknown',
        value: count
      };
    });
    
    // Sort by count descending
    formattedData.sort((a, b) => b.value - a.value);
    
    setChartData(formattedData);
  };

  const formatLabel = (timePeriod: string) => {
    const periodMap: Record<string, string> = {
      '24h': 'Last 24 hours',
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '60d': 'Last 60 days'
    };
    return periodMap[timePeriod] || 'Select period';
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Data Summary
          </CardTitle>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value) => [`${value} entries`, 'Count']}
                labelFormatter={(label) => `Source: ${label}`}
              />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center">
            <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
              <Clock className="h-6 w-6 text-muted-foreground/50" />
              <p>No data available for this period</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileDataSummary;
