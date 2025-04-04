
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { ApiService, ApiUsageByDay, ApiUsageBySource } from "@/services/ApiService";
import { format, parseISO, subDays } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

const ApiAnalytics: React.FC = () => {
  const [usageByDay, setUsageByDay] = useState<ApiUsageByDay[]>([]);
  const [usageBySource, setUsageBySource] = useState<ApiUsageBySource[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const byDayData = await ApiService.getApiUsageByDay(days);
        setUsageByDay(byDayData);
        
        const bySourceData = await ApiService.getApiUsageBySource();
        setUsageBySource(bySourceData);
      } catch (error) {
        console.error("Error fetching API analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up subscription to data changes
    const unsubscribe = ApiService.subscribe(() => {
      fetchData();
    });
    
    return () => {
      unsubscribe();
    };
  }, [timeRange]);

  // Fill in missing dates in the time range
  const getCompleteTimeRangeData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const result: ApiUsageByDay[] = [];
    const today = new Date();
    const existingDataMap = new Map(usageByDay.map(item => [item.date, item.count]));
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      result.push({
        date: dateStr,
        count: existingDataMap.get(dateStr) || 0
      });
    }
    
    return result;
  };

  const formatXAxis = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      return timeRange === '7d' 
        ? format(date, 'EEE') 
        : timeRange === '30d' 
          ? format(date, 'MMM d') 
          : format(date, 'MMM');
    } catch (e) {
      return tickItem;
    }
  };

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      try {
        const date = parseISO(label);
        return (
          <div className="bg-background/95 shadow-md p-3 rounded-lg border border-border">
            <p className="font-medium">{format(date, 'MMMM d, yyyy')}</p>
            <p className="text-primary">{`Requests: ${payload[0].value}`}</p>
          </div>
        );
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const renderSourceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 shadow-md p-3 rounded-lg border border-border">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-primary">{`Requests: ${payload[0].value}`}</p>
          <p className="text-muted-foreground">{`${payload[0].payload.percentage}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const completedData = getCompleteTimeRangeData();

  if (isLoading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">API Usage Analytics</h2>
          <p className="text-muted-foreground">Monitor your API endpoint usage</p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-full md:w-auto">
          <TabsList className="grid w-full md:w-[200px] grid-cols-3">
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">API Requests Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={completedData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxis} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="API Requests"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    activeDot={{ r: 8 }}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Requests by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {usageBySource.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageBySource}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="source"
                      label={({ source, percentage }) => `${source}: ${percentage}%`}
                      labelLine={false}
                    >
                      {usageBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={renderSourceTooltip} />
                    <Legend content={<CustomLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No source data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">API Request Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageBySource} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="source" 
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip content={renderSourceTooltip} />
                <Bar dataKey="count" name="Requests" fill="#8884d8" radius={[0, 4, 4, 0]}>
                  {usageBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiAnalytics;
