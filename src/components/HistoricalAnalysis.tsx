
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Filter, LineChart as LineChartIcon, BarChart as BarChartIcon, Info, Loader2 } from "lucide-react";
import { ApiService, DataEntry, Source } from "@/services/ApiService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format, subDays, subHours, subWeeks, subMonths, parseISO } from 'date-fns';

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';
type ChartType = 'line' | 'area' | 'bar';
type AggregationType = 'none' | 'hourly' | 'daily' | 'weekly' | 'monthly';
type MetricKey = string;

const HistoricalAnalysis: React.FC = () => {
  const [data, setData] = useState<DataEntry[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [aggregation, setAggregation] = useState<AggregationType>('hourly');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('temperature');
  const [metricOptions, setMetricOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data and update state when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiData = await ApiService.getData();
        setData(apiData);
        
        const sourcesData = await ApiService.getSources();
        setSources(sourcesData);
        setError(null);
        
        if (apiData.length > 0) {
          const allKeys = new Set<string>();
          apiData.forEach(entry => {
            Object.keys(entry).forEach(key => {
              if (typeof entry[key] === 'number' && 
                  !['id', 'sourceId'].includes(key)) {
                allKeys.add(key);
              }
            });
          });
          const metrics = Array.from(allKeys);
          setMetricOptions(metrics);
          if (metrics.length > 0 && !metrics.includes(selectedMetric)) {
            setSelectedMetric(metrics[0]);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error loading data. Please ensure you are logged in.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    const unsubscribeData = ApiService.subscribe(newData => {
      setData(newData);
      fetchData(); // Re-fetch to ensure metrics are updated
    });
    
    const unsubscribeSources = ApiService.subscribeToSources(newSources => {
      setSources(newSources);
    });
    
    return () => {
      unsubscribeData();
      unsubscribeSources();
    };
  }, []);

  // Recalculate filtered data whenever dependencies change
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    if (selectedSource !== 'all') {
      filtered = filtered.filter(entry => entry.sourceId === selectedSource);
    }
    
    if (timeRange !== 'all' && filtered.length > 0) {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (timeRange) {
        case '24h':
          cutoffDate = subHours(now, 24);
          break;
        case '7d':
          cutoffDate = subDays(now, 7);
          break;
        case '30d':
          cutoffDate = subDays(now, 30);
          break;
        case '90d':
          cutoffDate = subDays(now, 90);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(entry => {
        try {
          const entryDate = parseISO(entry.timestamp || '');
          return entryDate >= cutoffDate;
        } catch (e) {
          return false;
        }
      });
    }
    
    return filtered;
  }, [data, selectedSource, timeRange]);

  // Recalculate chart data whenever filtered data or chart settings change
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];
    
    const hasValidMetric = filteredData.some(entry => 
      entry[selectedMetric] !== undefined && 
      typeof entry[selectedMetric] === 'number'
    );
    
    if (!hasValidMetric) return [];
    
    const sorted = [...filteredData].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateA - dateB;
    });
    
    if (aggregation === 'none') {
      return sorted.map(entry => ({
        name: entry.timestamp ? format(new Date(entry.timestamp), 'MM/dd HH:mm') : 'Unknown',
        [selectedMetric]: entry[selectedMetric] || 0,
        original: entry
      }));
    }
    
    const aggregated: Record<string, any> = {};
    
    sorted.forEach(entry => {
      if (!entry.timestamp) return;
      
      let timeKey: string;
      const date = new Date(entry.timestamp);
      
      switch (aggregation) {
        case 'hourly':
          timeKey = format(date, 'yyyy-MM-dd-HH');
          break;
        case 'daily':
          timeKey = format(date, 'yyyy-MM-dd');
          break;
        case 'weekly':
          timeKey = format(date, 'yyyy-ww');
          break;
        case 'monthly':
          timeKey = format(date, 'yyyy-MM');
          break;
        default:
          timeKey = entry.timestamp;
      }
      
      if (!aggregated[timeKey]) {
        aggregated[timeKey] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          displayName: '',
        };
        
        switch (aggregation) {
          case 'hourly':
            aggregated[timeKey].displayName = format(date, 'MM/dd HH:00');
            break;
          case 'daily':
            aggregated[timeKey].displayName = format(date, 'MM/dd');
            break;
          case 'weekly':
            aggregated[timeKey].displayName = `Week ${format(date, 'ww')}`;
            break;
          case 'monthly':
            aggregated[timeKey].displayName = format(date, 'MMM yyyy');
            break;
        }
      }
      
      const value = entry[selectedMetric];
      if (typeof value === 'number') {
        aggregated[timeKey].count++;
        aggregated[timeKey].sum += value;
        aggregated[timeKey].min = Math.min(aggregated[timeKey].min, value);
        aggregated[timeKey].max = Math.max(aggregated[timeKey].max, value);
      }
    });
    
    return Object.keys(aggregated).map(key => {
      const item = aggregated[key];
      return {
        name: item.displayName,
        [selectedMetric]: item.count > 0 ? item.sum / item.count : 0,
        [`min${selectedMetric}`]: item.min !== Infinity ? item.min : 0,
        [`max${selectedMetric}`]: item.max !== -Infinity ? item.max : 0,
        count: item.count
      };
    });
  }, [filteredData, selectedMetric, aggregation]);

  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : sourceId;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert className="mt-2">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Info className="h-8 w-8 mb-2" />
          <p>No data available for the selected criteria</p>
        </div>
      );
    }
    
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              height={40}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              activeDot={{ r: 8 }}
            />
            {aggregation !== 'none' && (
              <Area
                type="monotone"
                dataKey={`max${selectedMetric}`}
                stroke="transparent"
                fill="#8884d8"
                fillOpacity={0.1}
                name="Max Range"
              />
            )}
            {aggregation !== 'none' && (
              <Area
                type="monotone"
                dataKey={`min${selectedMetric}`}
                stroke="transparent"
                fill="#8884d8"
                fillOpacity={0.1}
                name="Min Range"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              height={40}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            {aggregation !== 'none' && (
              <Area
                type="monotone"
                dataKey={`max${selectedMetric}`}
                stroke="transparent"
                fill="#8884d8"
                fillOpacity={0.1}
                name="Max Range"
              />
            )}
            {aggregation !== 'none' && (
              <Area
                type="monotone"
                dataKey={`min${selectedMetric}`}
                stroke="transparent"
                fill="#8884d8"
                fillOpacity={0.1}
                name="Min Range"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              height={40}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={selectedMetric}
              name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              fill="#8884d8"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-medium flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            Historical Data Analysis
          </span>
          <div className="flex gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map(metric => (
                  <SelectItem key={metric} value={metric}>
                    {metric}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
        <CardDescription>
          Analyze historical trends and patterns in your data
        </CardDescription>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger className="w-28">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Options
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Chart Type</h4>
                    <RadioGroup 
                      defaultValue={chartType} 
                      value={chartType}
                      onValueChange={(value) => setChartType(value as ChartType)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="line" id="r1" />
                        <Label htmlFor="r1">Line</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="area" id="r2" />
                        <Label htmlFor="r2">Area</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bar" id="r3" />
                        <Label htmlFor="r3">Bar</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Aggregation</h4>
                    <RadioGroup 
                      defaultValue={aggregation} 
                      value={aggregation}
                      onValueChange={(value) => setAggregation(value as AggregationType)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="a1" />
                        <Label htmlFor="a1">None</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hourly" id="a2" />
                        <Label htmlFor="a2">Hourly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="a3" />
                        <Label htmlFor="a3">Daily</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="a4" />
                        <Label htmlFor="a4">Weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="a5" />
                        <Label htmlFor="a5">Monthly</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>
              Showing {chartData.length} data points
              {selectedSource !== 'all' && ` for ${getSourceName(selectedSource)}`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border p-4">
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-[400px] grid-cols-2 mb-4 max-w-full">
              <TabsTrigger value="chart" className="flex items-center">
                <LineChartIcon className="mr-2 h-4 w-4" />
                Chart View
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="flex items-center">
                <BarChartIcon className="mr-2 h-4 w-4" />
                Metric Breakdown
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="min-h-[350px]">
              {renderChart()}
            </TabsContent>
            
            <TabsContent value="breakdown" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Info className="h-8 w-8 mb-2" />
                  <p>No data available for the selected criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg">Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-center">
                        {filteredData.length === 0 ? 'N/A' : (
                          Math.round(filteredData.reduce((sum, entry) => 
                            sum + (typeof entry[selectedMetric] === 'number' ? entry[selectedMetric] : 0), 0
                          ) / filteredData.filter(e => typeof e[selectedMetric] === 'number').length * 100) / 100
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg">Minimum</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-center text-blue-500">
                        {filteredData.length === 0 ? 'N/A' : (
                          Math.min(...filteredData
                            .filter(e => typeof e[selectedMetric] === 'number')
                            .map(e => e[selectedMetric]))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg">Maximum</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-center text-red-500">
                        {filteredData.length === 0 ? 'N/A' : (
                          Math.max(...filteredData
                            .filter(e => typeof e[selectedMetric] === 'number')
                            .map(e => e[selectedMetric]))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricalAnalysis;
