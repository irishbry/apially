
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import ApiService, { DataEntry } from "@/services/ApiService";
import { Button } from './ui/button';
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { formatTimeForDisplay } from '@/utils/csvUtils';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DataVisualization: React.FC = () => {
  const [data, setData] = useState<DataEntry[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [dataType, setDataType] = useState<'temperature' | 'humidity' | 'pressure'>('temperature');
  const [statsBySource, setStatsBySource] = useState<any[]>([]);

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
      totalTemperature: number;
      totalHumidity: number;
      totalPressure: number;
      avgTemperature: number;
      avgHumidity: number;
      avgPressure: number;
    }>();
    
    // Group data by source
    data.forEach(entry => {
      const sourceId = entry.sourceId || 'unknown';
      const sourceName = entry.sourceId ? ApiService.getSourceName(entry.sourceId) : 'Unknown';
      
      if (!sources.has(sourceId)) {
        sources.set(sourceId, {
          name: sourceName,
          count: 0,
          totalTemperature: 0,
          totalHumidity: 0,
          totalPressure: 0,
          avgTemperature: 0,
          avgHumidity: 0,
          avgPressure: 0
        });
      }
      
      const source = sources.get(sourceId)!;
      source.count += 1;
      
      if (typeof entry.temperature === 'number') {
        source.totalTemperature += entry.temperature;
      }
      
      if (typeof entry.humidity === 'number') {
        source.totalHumidity += entry.humidity;
      }
      
      if (typeof entry.pressure === 'number') {
        source.totalPressure += entry.pressure;
      }
    });
    
    // Calculate averages
    const statsArray = Array.from(sources.entries()).map(([id, source]) => {
      return {
        id,
        name: source.name,
        count: source.count,
        avgTemperature: source.count ? Math.round((source.totalTemperature / source.count) * 10) / 10 : 0,
        avgHumidity: source.count ? Math.round(source.totalHumidity / source.count) : 0,
        avgPressure: source.count ? Math.round((source.totalPressure / source.count) * 10) / 10 : 0,
      };
    });
    
    setStatsBySource(statsArray);
  }, [data]);

  // Get chart data based on selected data type
  const getChartData = () => {
    return statsBySource.map(source => ({
      name: source.name,
      value: source[`avg${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`],
    }));
  };

  // Get latest readings for each sensor across all sources
  const getLatestReadings = () => {
    const sensorMap = new Map<string, DataEntry>();
    
    // Find the latest entry for each sensor
    data.forEach(entry => {
      const sensorId = entry.sensorId;
      if (sensorId) {
        const existing = sensorMap.get(sensorId);
        if (!existing || (entry.timestamp && existing.timestamp && entry.timestamp > existing.timestamp)) {
          sensorMap.set(sensorId, entry);
        }
      }
    });
    
    return Array.from(sensorMap.values());
  };

  // Get time series data for selected data type
  const getTimeSeriesData = () => {
    // Only take the last 10 entries for clarity
    return data.slice(0, 10).reverse().map(entry => ({
      name: entry.timestamp ? formatTimeForDisplay(entry.timestamp).split(', ')[1] : 'Unknown',
      value: typeof entry[dataType] === 'number' ? entry[dataType] : 0,
      sensor: entry.sensorId || 'Unknown'
    }));
  };

  // Get unit for selected data type
  const getUnit = () => {
    switch (dataType) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'pressure': return 'hPa';
      default: return '';
    }
  };

  // Format chart value with appropriate unit
  const formatChartValue = (value: number) => {
    return `${value}${getUnit()}`;
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl font-medium">
          <span>Data Visualization</span>
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
          Visualize your data by source and metric
        </CardDescription>
        <div className="mt-2">
          <Select value={dataType} onValueChange={(value: 'temperature' | 'humidity' | 'pressure') => setDataType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="temperature">Temperature (°C)</SelectItem>
              <SelectItem value="humidity">Humidity (%)</SelectItem>
              <SelectItem value="pressure">Pressure (hPa)</SelectItem>
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
                <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => `${value}${getUnit()}`} />
                  <Tooltip formatter={(value) => formatChartValue(value as number)} />
                  <Bar dataKey="value" name={dataType.charAt(0).toUpperCase() + dataType.slice(1)} fill="#8884d8" />
                </BarChart>
              )}
              {chartType === 'line' && (
                <LineChart data={getTimeSeriesData()} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => `${value}${getUnit()}`} />
                  <Tooltip formatter={(value) => formatChartValue(value as number)} labelFormatter={(label) => `Time: ${label}`} />
                  <Line type="monotone" dataKey="value" name={dataType.charAt(0).toUpperCase() + dataType.slice(1)} stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              )}
              {chartType === 'pie' && (
                <PieChart>
                  <Pie
                    data={getChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}${getUnit()}`}
                  >
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatChartValue(value as number)} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {getLatestReadings().length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium mb-2">Latest Readings by Sensor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {getLatestReadings().map((entry) => (
                <div key={entry.sensorId} className="p-3 border rounded-md">
                  <div className="font-medium">{entry.sensorId}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.timestamp ? formatTimeForDisplay(entry.timestamp) : 'Unknown time'}
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <div className="text-xs">Temp: <span className="font-medium">{entry.temperature}°C</span></div>
                    <div className="text-xs">Humidity: <span className="font-medium">{entry.humidity}%</span></div>
                    <div className="text-xs">Pressure: <span className="font-medium">{entry.pressure}hPa</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataVisualization;
