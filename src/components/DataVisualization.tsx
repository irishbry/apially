
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import ApiService, { DataEntry } from "@/services/ApiService";
import { Button } from './ui/button';
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { formatTimeForDisplay } from '@/utils/csvUtils';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DataVisualization: React.FC = () => {
  const [data, setData] = useState<DataEntry[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('day');
  const [statsBySource, setStatsBySource] = useState<any[]>([]);
  const [dataByTime, setDataByTime] = useState<any[]>([]);

  useEffect(() => {
    // Get initial data
    const initialData = ApiService.getData();
    setData(initialData);
    
    // Subscribe to data changes
    const unsubscribeData = ApiService.subscribe(newData => {
      setData([...newData]);
    });
    
    return () => {
      unsubscribeData();
    };
  }, []);

  useEffect(() => {
    // Process data by sources
    const sources = new Map<string, {
      name: string;
      count: number;
    }>();
    
    // Group data by source
    data.forEach(entry => {
      const sourceId = entry.sourceId || 'unknown';
      const sourceName = entry.sourceId ? ApiService.getSourceName(entry.sourceId) : 'Unknown';
      
      if (!sources.has(sourceId)) {
        sources.set(sourceId, {
          name: sourceName,
          count: 0
        });
      }
      
      const source = sources.get(sourceId)!;
      source.count += 1;
    });
    
    // Convert to array for chart
    const statsArray = Array.from(sources.entries()).map(([id, source]) => ({
      id,
      name: source.name,
      count: source.count
    }));
    
    setStatsBySource(statsArray);

    // Process data by time periods
    processDataByTime(data, timeFrame);
  }, [data, timeFrame]);
  
  // Process data based on selected time frame
  const processDataByTime = (data: DataEntry[], timeFrame: 'day' | 'week' | 'month') => {
    // Maps to track data counts by time period and source
    const timeMap = new Map<string, Map<string, number>>();
    const sourceNames = new Map<string, string>();
    
    // Get current date
    const now = new Date();
    
    // Determine time periods based on selected frame
    const periods: string[] = [];
    
    if (timeFrame === 'day') {
      // Last 24 hours in 2-hour increments
      for (let i = 0; i < 12; i++) {
        const time = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000));
        const hour = time.getHours();
        const period = `${hour}:00`;
        periods.unshift(period);
      }
    } else if (timeFrame === 'week') {
      // Last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const day = date.toLocaleDateString(undefined, { weekday: 'short' });
        periods.unshift(day);
      }
    } else if (timeFrame === 'month') {
      // Last 4 weeks
      for (let i = 0; i < 4; i++) {
        const date = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
        const week = `Week ${4-i}`;
        periods.unshift(week);
      }
    }
    
    // Initialize time map with periods
    periods.forEach(period => {
      timeMap.set(period, new Map<string, number>());
    });
    
    // Categorize data entries by time period and source
    data.forEach(entry => {
      if (!entry.timestamp) return;
      
      const timestamp = new Date(entry.timestamp);
      const sourceId = entry.sourceId || 'unknown';
      const sourceName = entry.sourceId ? ApiService.getSourceName(entry.sourceId) : 'Unknown';
      
      // Save source name mapping
      sourceNames.set(sourceId, sourceName);
      
      // Determine which period this entry belongs to
      let period = '';
      
      if (timeFrame === 'day') {
        // Group by 2-hour blocks
        const hour = timestamp.getHours();
        const roundedHour = Math.floor(hour / 2) * 2;
        period = `${roundedHour}:00`;
      } else if (timeFrame === 'week') {
        // Group by day
        period = timestamp.toLocaleDateString(undefined, { weekday: 'short' });
      } else if (timeFrame === 'month') {
        // Group by week
        const daysPassed = Math.floor((now.getTime() - timestamp.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.min(Math.floor(daysPassed / 7) + 1, 4);
        period = `Week ${weekNumber}`;
      }
      
      // If period exists in our map, increment the count for this source
      if (timeMap.has(period)) {
        const sourceMap = timeMap.get(period)!;
        sourceMap.set(sourceId, (sourceMap.get(sourceId) || 0) + 1);
      }
    });
    
    // Convert to format suitable for charts
    const formattedData: any[] = [];
    
    // Get all unique source IDs
    const sourceIds = Array.from(sourceNames.keys());
    
    // Create data entries for each time period
    periods.forEach(period => {
      const entry: any = { name: period };
      const sourceMap = timeMap.get(period)!;
      
      // Add count for each source
      sourceIds.forEach(sourceId => {
        entry[sourceId] = sourceMap.get(sourceId) || 0;
        entry[`${sourceNames.get(sourceId)}`] = sourceMap.get(sourceId) || 0;
      });
      
      // Add total for this period
      entry.total = Array.from(sourceMap.values()).reduce((sum, count) => sum + count, 0);
      
      formattedData.push(entry);
    });
    
    setDataByTime(formattedData);
  };

  // Format chart value for tooltip
  const formatChartValue = (value: number) => {
    return `${value} entries`;
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl font-medium">
          <span>Data Volume Visualization</span>
          <div className="flex items-center gap-2">
            <Button 
              variant={chartType === 'bar' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setChartType('bar')}
              className="p-2"
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Button 
              variant={chartType === 'line' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setChartType('line')}
              className="p-2"
            >
              <LineChartIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant={chartType === 'pie' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setChartType('pie')}
              className="p-2"
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Visualize data volume by source and time period
        </CardDescription>
        <div className="mt-2">
          <Select value={timeFrame} onValueChange={(value: 'day' | 'week' | 'month') => setTimeFrame(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select time frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily (Last 24 hours)</SelectItem>
              <SelectItem value="week">Weekly (Last 7 days)</SelectItem>
              <SelectItem value="month">Monthly (Last 4 weeks)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
            <p>No data available to visualize. Send some test data first.</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' && (
                <BarChart data={dataByTime} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => `${value}`} label={{ value: 'Data Entries', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => formatChartValue(value as number)} />
                  <Legend />
                  {statsBySource.map((source, index) => (
                    <Bar key={source.id} dataKey={source.name} name={source.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </BarChart>
              )}
              {chartType === 'line' && (
                <LineChart data={dataByTime} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => `${value}`} label={{ value: 'Data Entries', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => formatChartValue(value as number)} />
                  <Legend />
                  {statsBySource.map((source, index) => (
                    <Line 
                      key={source.id} 
                      type="monotone" 
                      dataKey={source.name} 
                      name={source.name} 
                      stroke={COLORS[index % COLORS.length]} 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                    />
                  ))}
                </LineChart>
              )}
              {chartType === 'pie' && (
                <PieChart>
                  <Pie
                    data={statsBySource.map(source => ({
                      name: source.name,
                      value: source.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, value}) => `${name}: ${value}`}
                  >
                    {statsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatChartValue(value as number)} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-sm font-medium mb-2">Data Volume Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-md bg-background/50">
              <div className="text-sm text-muted-foreground">Total Data Points</div>
              <div className="text-2xl font-bold">{data.length}</div>
            </div>
            <div className="p-4 border rounded-md bg-background/50">
              <div className="text-sm text-muted-foreground">Active Sources</div>
              <div className="text-2xl font-bold">{statsBySource.length}</div>
            </div>
            <div className="p-4 border rounded-md bg-background/50">
              <div className="text-sm text-muted-foreground">Last Received</div>
              <div className="text-xl font-medium">
                {data[0]?.timestamp ? formatTimeForDisplay(data[0].timestamp) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataVisualization;
