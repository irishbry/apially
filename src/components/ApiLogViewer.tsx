
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Clock, ArrowDownUp, AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from "lucide-react";
import { format } from 'date-fns';
import { ApiService, ApiLog } from "@/services/ApiService";

const demoLogs: ApiLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    method: 'POST',
    endpoint: '/api/data',
    status: 'success',
    statusCode: 200,
    responseTime: 43,
    source: 'Factory Sensors',
    ip: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestBody: JSON.stringify({
      sensorId: 'sensor-1',
      temperature: 25.4,
      humidity: 68,
      pressure: 1013.2
    }, null, 2),
    responseBody: JSON.stringify({
      success: true,
      message: "Data received successfully",
      data: {
        id: "entry-1625176468-123"
      }
    }, null, 2)
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    method: 'POST',
    endpoint: '/api/data',
    status: 'error',
    statusCode: 400,
    responseTime: 38,
    source: 'Office Environment',
    ip: '192.168.1.230',
    userAgent: 'Python-urllib/3.9',
    requestBody: JSON.stringify({
      humidity: 68,
      pressure: 1013.2
    }, null, 2),
    responseBody: JSON.stringify({
      success: false,
      message: "Data validation failed",
      errors: ["Missing required field: sensorId"]
    }, null, 2),
    error: "Missing required field: sensorId"
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    method: 'GET',
    endpoint: '/api/status',
    status: 'success',
    statusCode: 200,
    responseTime: 12,
    source: 'System',
    ip: '127.0.0.1',
    userAgent: 'curl/7.68.0',
    responseBody: JSON.stringify({
      status: "healthy",
      uptime: "2d 4h 12m",
      version: "1.0.0"
    }, null, 2)
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    method: 'POST',
    endpoint: '/api/data',
    status: 'error',
    statusCode: 401,
    responseTime: 22,
    source: 'Unknown',
    ip: '203.0.113.42',
    userAgent: 'PostmanRuntime/7.28.0',
    requestBody: JSON.stringify({
      sensorId: 'sensor-x',
      temperature: 18.2
    }, null, 2),
    responseBody: JSON.stringify({
      success: false,
      message: "Invalid API key or inactive source",
      code: "AUTH_FAILED"
    }, null, 2),
    error: "Invalid API key or inactive source"
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    method: 'POST',
    endpoint: '/api/data',
    status: 'success',
    statusCode: 200,
    responseTime: 54,
    source: 'Warehouse Monitors',
    ip: '192.168.1.115',
    userAgent: 'ESP8266HTTPClient',
    requestBody: JSON.stringify({
      sensorId: 'sensor-w1',
      temperature: 22.1,
      humidity: 45,
      co2: 612
    }, null, 2),
    responseBody: JSON.stringify({
      success: true,
      message: "Data received successfully",
      data: {
        id: "entry-1625172468-456"
      }
    }, null, 2)
  }
];

const ApiLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ApiLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSuccessful, setFilterSuccessful] = useState(true);
  const [filterErrors, setFilterErrors] = useState(true);
  
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const apiLogs = await ApiService.getLogs();
      if (apiLogs.length > 0) {
        setLogs(apiLogs);
        setFilteredLogs(apiLogs);
      } else {
        setLogs(demoLogs);
        setFilteredLogs(demoLogs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs(demoLogs);
      setFilteredLogs(demoLogs);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLogs();
    
    const interval = setInterval(fetchLogs, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    let filtered = [...logs];
    
    if (statusFilter !== 'all') {
      const statusCode = parseInt(statusFilter, 10);
      filtered = filtered.filter(log => {
        if (!log.statusCode) return false;
        const firstDigit = Math.floor(log.statusCode / 100);
        return firstDigit === Math.floor(statusCode / 100);
      });
    }
    
    if (methodFilter !== 'all') {
      filtered = filtered.filter(log => log.method === methodFilter);
    }
    
    if (!filterSuccessful) {
      filtered = filtered.filter(log => 
        (log.statusCode && log.statusCode >= 400) || 
        log.status === 'error' || 
        log.error
      );
    }
    
    if (!filterErrors) {
      filtered = filtered.filter(log => 
        (log.statusCode && log.statusCode < 400) || 
        (log.status !== 'error' && !log.error)
      );
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (log.endpoint && log.endpoint.toLowerCase().includes(term)) ||
        (log.source && log.source.toLowerCase().includes(term)) ||
        (log.ip && log.ip.toLowerCase().includes(term)) ||
        (log.message && log.message.toLowerCase().includes(term)) ||
        (log.requestBody && log.requestBody.toLowerCase().includes(term)) ||
        (log.responseBody && log.responseBody.toLowerCase().includes(term)) ||
        (log.error && log.error.toLowerCase().includes(term))
      );
    }
    
    setFilteredLogs(filtered);
  }, [logs, statusFilter, methodFilter, searchTerm, filterSuccessful, filterErrors]);
  
  const getStatusBadge = (log: ApiLog) => {
    let variant: 'default' | 'destructive' | 'outline' | 'secondary' | null = null;
    let label = log.statusCode?.toString() || log.status;
    
    if (log.statusCode) {
      if (log.statusCode >= 200 && log.statusCode < 300) {
        variant = 'default';
      } else if (log.statusCode >= 400 && log.statusCode < 500) {
        variant = 'secondary';
      } else if (log.statusCode >= 500) {
        variant = 'destructive';
      } else {
        variant = 'outline';
      }
    } else {
      if (log.status === 'success') {
        variant = 'default';
        label = 'OK';
      } else if (log.status === 'error') {
        variant = 'destructive';
        label = 'Error';
      } else if (log.status === 'warning') {
        variant = 'secondary';
        label = 'Warn';
      } else {
        variant = 'outline';
      }
    }
    
    return (
      <Badge variant={variant} className="font-mono">
        {label}
      </Badge>
    );
  };
  
  const getMethodBadge = (method: string) => {
    let variant: 'default' | 'destructive' | 'outline' | 'secondary' | null = null;
    
    switch (method) {
      case 'GET':
        variant = 'outline';
        break;
      case 'POST':
        variant = 'default';
        break;
      case 'PUT':
        variant = 'secondary';
        break;
      case 'DELETE':
        variant = 'destructive';
        break;
      default:
        variant = 'outline';
    }
    
    return (
      <Badge variant={variant} className="font-mono w-16 justify-center">
        {method}
      </Badge>
    );
  };
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch (e) {
      return timestamp;
    }
  };
  
  const getResponseTimeBadge = (time: number) => {
    let className = 'text-green-600';
    
    if (time > 100) {
      className = 'text-yellow-600';
    } else if (time > 300) {
      className = 'text-red-600';
    }
    
    return <span className={className}>{time}ms</span>;
  };
  
  const handleRefresh = () => {
    fetchLogs();
  };
  
  const handleRowClick = (log: ApiLog) => {
    setSelectedLog(log);
  };
  
  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-medium">API Request Logs</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Detailed logs of all API requests and responses
        </CardDescription>
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Tabs defaultValue="all" onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="200">2xx</TabsTrigger>
                <TabsTrigger value="400">4xx</TabsTrigger>
                <TabsTrigger value="500">5xx</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="all" onValueChange={setMethodFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="GET">GET</TabsTrigger>
                <TabsTrigger value="POST">POST</TabsTrigger>
                <TabsTrigger value="PUT">PUT</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-success" 
              checked={filterSuccessful}
              onCheckedChange={(checked) => setFilterSuccessful(!!checked)}
            />
            <label htmlFor="show-success" className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Successful
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-errors" 
              checked={filterErrors}
              onCheckedChange={(checked) => setFilterErrors(!!checked)}
            />
            <label htmlFor="show-errors" className="text-sm font-medium flex items-center">
              <XCircle className="h-4 w-4 text-red-500 mr-1" />
              Errors
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[500px]">
          <div className="lg:col-span-2 border-r">
            <ScrollArea className="h-[500px]">
              <div className="w-full">
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
                      <span>Loading logs...</span>
                    </div>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Info className="h-8 w-8 mb-2" />
                      <span>No logs matching your filters</span>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-secondary">
                      <TableRow>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[100px]">Method</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow 
                          key={log.id} 
                          className={`cursor-pointer hover:bg-muted ${selectedLog?.id === log.id ? 'bg-muted' : ''}`}
                          onClick={() => handleRowClick(log)}
                        >
                          <TableCell>{getStatusBadge(log)}</TableCell>
                          <TableCell>{getMethodBadge(log.method)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.endpoint}
                            {log.error && (
                              <div className="text-xs text-red-500 mt-1 truncate" style={{ maxWidth: '200px' }}>
                                {log.error}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            <div className="flex flex-col items-end">
                              <span className="text-muted-foreground whitespace-nowrap">
                                {format(new Date(log.timestamp), 'HH:mm:ss')}
                              </span>
                              {log.responseTime && (
                                <span>{getResponseTimeBadge(log.responseTime)}</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="lg:col-span-3 p-4">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Request Details</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatTimestamp(selectedLog.timestamp)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium">Method & Endpoint</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getMethodBadge(selectedLog.method)}
                      <span className="font-mono text-sm">{selectedLog.endpoint}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Source</span>
                    <div className="mt-1 font-medium">{selectedLog.source}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Client Info</span>
                    <div className="mt-1 text-sm">{selectedLog.ip}</div>
                    {selectedLog.userAgent && (
                      <div className="mt-1 text-xs text-muted-foreground truncate" style={{ maxWidth: '100%' }}>
                        {selectedLog.userAgent}
                      </div>
                    )}
                  </div>
                </div>
                
                <Tabs defaultValue="details" className="w-full">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="request">Request</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-2">
                    <div className="bg-muted p-4 rounded-md">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Status:</span>
                          <span>{getStatusBadge(selectedLog)}</span>
                        </div>
                        {selectedLog.responseTime && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Response Time:</span>
                            <span>{getResponseTimeBadge(selectedLog.responseTime)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Timestamp:</span>
                          <span className="text-sm">{formatTimestamp(selectedLog.timestamp)}</span>
                        </div>
                        {selectedLog.message && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">Message:</span>
                            <div className={`mt-1 text-sm p-2 rounded ${selectedLog.error ? 'bg-red-50 text-red-800' : 'bg-gray-50'}`}>
                              {selectedLog.message}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="request" className="mt-2">
                    {selectedLog.requestBody ? (
                      <div className="bg-slate-950 rounded-md p-4 overflow-auto max-h-64">
                        <pre className="text-slate-50 text-xs font-mono">
                          {selectedLog.requestBody}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-muted py-8 rounded-md flex items-center justify-center">
                        <span className="text-muted-foreground">No request body available</span>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="response" className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedLog)}
                        {selectedLog.responseTime && (
                          <span>Response time: {getResponseTimeBadge(selectedLog.responseTime)}</span>
                        )}
                      </div>
                      
                      {selectedLog.error && (
                        <Badge variant="outline" className="bg-red-50 text-red-500 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </div>
                    {selectedLog.responseBody ? (
                      <div className="bg-slate-950 rounded-md p-4 overflow-auto max-h-64">
                        <pre className="text-slate-50 text-xs font-mono">
                          {selectedLog.responseBody}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-muted py-8 rounded-md flex items-center justify-center">
                        <span className="text-muted-foreground">No response body available</span>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Info className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Select a log entry to view details</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiLogViewer;
