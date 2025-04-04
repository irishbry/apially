
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Download, Filter, Search, Trash2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ApiService, { DataEntry, Source } from "@/services/ApiService";
import { downloadCSV } from "@/utils/csvUtils";

const DataTable: React.FC = () => {
  const [data, setData] = useState<DataEntry[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [visibleData, setVisibleData] = useState<DataEntry[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Get initial data
      setData(ApiService.getData());
      setSources(ApiService.getSources());
      setError(null);
      
      // Subscribe to data changes
      const unsubscribeData = ApiService.subscribe(newData => {
        setData([...newData]);
      });
      
      // Subscribe to source changes
      const unsubscribeSources = ApiService.subscribeToSources(newSources => {
        setSources([...newSources]);
      });
      
      return () => {
        unsubscribeData();
        unsubscribeSources();
      };
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error loading data. Please ensure you are logged in.');
    }
  }, []);
  
  useEffect(() => {
    // Filter data based on search term and selected source
    let filtered = data;
    
    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(entry => entry.sourceId === selectedSource);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        return Object.values(entry).some(value => 
          value !== null && 
          value !== undefined && 
          String(value).toLowerCase().includes(term)
        );
      });
    }
    
    setVisibleData(filtered);
  }, [data, searchTerm, selectedSource]);

  const handleExportCSV = () => {
    try {
      setIsDownloading(true);
      setTimeout(() => {
        // Export only filtered data
        downloadCSV(visibleData);
        setIsDownloading(false);
      }, 500);
    } catch (err) {
      setError('Error exporting data. Please ensure you are logged in.');
      setIsDownloading(false);
    }
  };

  const handleClearData = () => {
    try {
      ApiService.clearData();
    } catch (err) {
      setError('Error clearing data. Please ensure you are logged in.');
    }
  };

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await ApiService.refreshData();
      setIsRefreshing(false);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error refreshing data. Please ensure you are logged in.');
      setIsRefreshing(false);
    }
  };

  // Get source name from ID
  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : sourceId;
  };

  // Get all columns dynamically from data
  const getColumns = () => {
    if (data.length === 0) return ['No Data'];
    
    // Get all unique keys, prioritizing common ones
    const priorityKeys = ['timestamp', 'id', 'sourceId', 'sensorId'];
    const allKeys = new Set<string>();
    
    // Add priority keys first
    priorityKeys.forEach(key => allKeys.add(key));
    
    // Add all other keys
    data.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (!priorityKeys.includes(key)) {
          allKeys.add(key);
        }
      });
    });
    
    return Array.from(allKeys);
  };

  const columns = getColumns();

  const formatCellValue = (key: string, value: any) => {
    if (value === undefined || value === null) return '-';
    if (key === 'sourceId') return getSourceName(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-medium">Received Data</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="hover-lift"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearData}
              className="hover-lift"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button 
              size="sm"
              onClick={handleExportCSV}
              disabled={isDownloading || visibleData.length === 0}
              className="hover-lift"
            >
              {isDownloading ? (
                <>Downloading...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          View and manage data received from your API
        </CardDescription>
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2 sm:flex-row mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <div className="relative overflow-auto max-h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="whitespace-nowrap">
                      {column === 'sourceId' ? 'Source' : column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleData.length > 0 ? (
                  visibleData.map((entry, index) => (
                    <TableRow key={entry.id || index} className="animate-fade-in">
                      {columns.map(column => (
                        <TableCell key={`${entry.id || index}-${column}`} className="whitespace-nowrap">
                          {formatCellValue(column, entry[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {error ? 'Authentication required to view data' : 'No data available'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="py-3 text-sm text-muted-foreground">
        Showing {visibleData.length} of {data.length} entries
        {selectedSource !== 'all' && ` for ${getSourceName(selectedSource)}`}
      </CardFooter>
    </Card>
  );
};

export default DataTable;
