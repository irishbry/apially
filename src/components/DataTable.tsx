
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Download, 
  Filter, 
  Search, 
  Trash2, 
  RefreshCw, 
  Trash 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ApiService, DataEntry, Source } from "@/services/ApiService";
import { downloadCSV } from "@/utils/csvUtils";

const DataTable: React.FC = () => {
  const [data, setData] = useState<DataEntry[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [visibleData, setVisibleData] = useState<DataEntry[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      setIsLoading(true);
      
      const unsubscribeData = ApiService.subscribe(newData => {
        console.log('DataTable: Received new data:', newData.length, 'entries');
        setData([...newData]);
        setIsLoading(false);
      });
      
      const unsubscribeSources = ApiService.subscribeToSources(newSources => {
        console.log('DataTable: Received new sources:', newSources.length, 'sources');
        setSources([...newSources]);
      });
      
      return () => {
        unsubscribeData();
        unsubscribeSources();
      };
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error loading data. Please ensure you are logged in.');
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    let filtered = data;
    
    if (selectedSource !== 'all') {
      filtered = filtered.filter(entry => entry.sourceId === selectedSource || entry.source_id === selectedSource);
    }
    
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

  // Helper function to get value from entry
  const getValue = (entry: DataEntry, column: string): any => {
    return entry[column];
  };

  // Helper function to get display name for columns
  const getDisplayName = (column: string): string => {
    const displayNames: Record<string, string> = {
      'sourceId': 'Source',
      'source_id': 'Source',
      'sensorId': 'Sensor ID',
      'sensor_id': 'Sensor ID',
      'fileName': 'File Name',
      'file_name': 'File Name'
    };
    return displayNames[column] || column;
  };

  const handleExportCSV = () => {
    try {
      setIsDownloading(true);
      setTimeout(() => {
        // Use the new CSV export format that matches the Data Explorer
        downloadCSV(
          visibleData, 
          columns, 
          sources, 
          getDisplayName, 
          getValue, 
          formatCellValue
        );
        setIsDownloading(false);
      }, 500);
    } catch (err) {
      setError('Error exporting data. Please ensure you are logged in.');
      setIsDownloading(false);
    }
  };

  const handleClearData = async () => {
    try {
      await ApiService.clearData();
    } catch (err) {
      setError('Error clearing data. Please ensure you are logged in.');
    }
  };

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Refresh both data and sources to ensure proper mapping
      console.log('DataTable: Refreshing data and sources...');
      await ApiService.refreshData();
      
      // Force refresh sources as well to ensure we have the latest source names
      const freshSources = await ApiService.getSources();
      setSources([...freshSources]);
      
      setIsRefreshing(false);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error refreshing data. Please ensure you are logged in.');
      setIsRefreshing(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      setIsDeleting(id);
      const success = await ApiService.deleteDataEntry(id);
      setIsDeleting(null);
      
      if (success) {
        toast({
          title: "Entry Deleted",
          description: "The data entry has been successfully deleted.",
        });
      } else {
        toast({
          title: "Deletion Failed",
          description: "Failed to delete the data entry. Please try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      setIsDeleting(null);
      toast({
        title: "Deletion Failed",
        description: "An error occurred while deleting the entry: " + err.message,
        variant: "destructive"
      });
    }
  };

  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    
    // Find the source by ID
    const source = sources.find(s => s.id === sourceId);
    if (source) {
      console.log('DataTable: Found source name for ID', sourceId, ':', source.name);
      return source.name;
    }
    
    console.log('DataTable: No source found for ID:', sourceId, 'Available sources:', sources.length);
    // Return the ID itself if no source name is found (helps with debugging)
    return `Unknown (${sourceId.substring(0, 8)}...)`;
  };

  const getColumns = () => {
    if (data.length === 0) return ['No Data'];
    
    const priorityKeys = ['timestamp', 'id', 'sourceId', 'source_id', 'sensorId', 'sensor_id', 'fileName', 'file_name'];
    const allKeys = new Set<string>();
    
    priorityKeys.forEach(key => allKeys.add(key));
    
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
    if (key === 'sourceId' || key === 'source_id') return getSourceName(value);
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
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    {columns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {column === 'sourceId' || column === 'source_id' ? 'Source' : 
                         column === 'sensorId' || column === 'sensor_id' ? 'Sensor ID' :
                         column === 'fileName' || column === 'file_name' ? 'File Name' :
                         column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleData.length > 0 ? (
                    visibleData.map((entry, index) => (
                      <TableRow key={entry.id || index} className="animate-fade-in">
                        <TableCell className="w-10">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDeleteEntry(entry.id!)}
                                  disabled={isDeleting === entry.id}
                                >
                                  {isDeleting === entry.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete entry</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {columns.map(column => (
                          <TableCell key={`${entry.id || index}-${column}`} className="whitespace-nowrap">
                            {formatCellValue(column, entry[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                        {error ? 'Authentication required to view data' : 'No data available'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
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
