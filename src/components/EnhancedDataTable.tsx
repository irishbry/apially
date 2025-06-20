import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Download, Filter, Search, SortAsc, SortDesc, Trash2, FileDown, ListFilter, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiService, DataEntry, Source } from "@/services/ApiService";
import { downloadCSV } from "@/utils/csvUtils";
import NotificationService from "@/services/NotificationService";

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

type ColumnFilter = {
  key: string;
  value: string;
  enabled: boolean;
};

interface EnhancedDataTableProps {
  data?: DataEntry[];
  sources?: Source[];
  onDataChange?: (data: DataEntry[]) => void;
  setIsChanged?: (changed: boolean) => void;
  isChanged?: boolean;
}

const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({ 
  data: propData, 
  sources: propSources,
  onDataChange,
  setIsChanged,
  isChanged
}) => {
  const [internalData, setInternalData] = useState<DataEntry[]>([]);
  const [internalSources, setInternalSources] = useState<Source[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [activeFilters, setActiveFilters] = useState<ColumnFilter[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use prop data if provided, otherwise use internal data from subscriptions
  const data = propData || internalData;
  const sources = propSources || internalSources;

  // Helper function to get source name
  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : sourceId;
  };

  // Helper function to safely get value from entry
  const getValue = (entry: DataEntry, column: string): any => {
    if (!entry) return '';
    
    try {
      if (column === 'source') {
        return entry.sourceId || entry.source_id || '';
      }
      
      if (column === 'created_at') {
        return entry.created_at || entry.timestamp || '';
      }
      
      // Check if the column is a metadata field
      if (entry.metadata && typeof entry.metadata === 'object' && entry.metadata[column] !== undefined) {
        return entry.metadata[column];
      }
      
      // Fallback to entry property
      return entry[column] || '';
    } catch (error) {
      console.error('Error getting value for column:', column, error);
      return '';
    }
  };

  // Helper function to safely convert value to searchable string, with special handling for source
  const getSearchableValue = (entry: DataEntry, column: string): string => {
    try {
      let value;
      
      // Special handling for source column - search by source name, not ID
      if (column === 'source') {
        const sourceId = entry.sourceId || entry.source_id;
        value = getSourceName(sourceId);
      } else {
        value = getValue(entry, column);
      }
      
      if (value === null || value === undefined || value === '') return '';
      
      if (typeof value === 'object') {
        return JSON.stringify(value).toLowerCase();
      }
      return String(value).toLowerCase();
    } catch (error) {
      console.error('Error converting value to searchable string for column:', column, error);
      return '';
    }
  };

  useEffect(() => {
    // Only set up subscriptions if no prop data is provided
    if (!propData || !propSources) {
      try {
        setIsLoading(true);
        
        const unsubscribeData = ApiService.subscribe(newData => {
          console.log('Data is fetched from the api')
          console.log(newData)
          setInternalData([...newData]);
          setIsLoading(false);
        });
        
        const unsubscribeSources = ApiService.subscribeToSources(newSources => {
          console.log(newSources)
          setInternalSources([...newSources]);
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
    }
  }, [propData, propSources]);

  useEffect(() => {
    if (data && data.length >= 0) {
      const cols = getColumns();
      setAllColumns(cols);
      setVisibleColumns(cols);
    }
  }, [data]);
  
  const visibleData = useMemo(() => {
    // Early return if no data to prevent crashes
    if (!data || data.length === 0) {
      return [];
    }

    try {
      let filtered = [...data];
      
      // Source filtering with safety checks
      if (selectedSource && selectedSource !== 'all') {
        filtered = filtered.filter(entry => {
          if (!entry) return false;
          const entrySourceId = entry.sourceId || entry.source_id;
          return entrySourceId === selectedSource;
        });
      }
      
      // Column filters with safety checks
      if (activeFilters && activeFilters.length > 0) {
        activeFilters.forEach(filter => {
          if (filter && filter.enabled && filter.value && filter.value.trim()) {
            filtered = filtered.filter(entry => {
              if (!entry) return false;
              try {
                const searchableValue = getSearchableValue(entry, filter.key);
                return searchableValue.includes(filter.value.toLowerCase().trim());
              } catch (error) {
                console.error('Error filtering entry:', error);
                return false;
              }
            });
          }
        });
      }
      
      // Search term filtering with improved safety checks and proper source name searching
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(entry => {
          if (!entry) return false;
          
          try {
            // Search across all visible columns
            return visibleColumns && visibleColumns.length > 0 && visibleColumns.some(column => {
              try {
                const searchableValue = getSearchableValue(entry, column);
                return searchableValue.includes(term);
              } catch (error) {
                console.error('Error searching column:', column, error);
                return false;
              }
            });
          } catch (error) {
            console.error('Error during search filtering:', error);
            return false;
          }
        });
      }
      
      // Sorting with safety checks
      if (sortConfig && sortConfig.key) {
        filtered.sort((a, b) => {
          if (!a || !b) return 0;
          try {
            let aVal, bVal;
            
            // Special handling for source column sorting
            if (sortConfig.key === 'source') {
              aVal = getSourceName(a.sourceId || a.source_id);
              bVal = getSourceName(b.sourceId || b.source_id);
            } else {
              aVal = getValue(a, sortConfig.key);
              bVal = getValue(b, sortConfig.key);
            }
            
            if (aVal === undefined && bVal === undefined) return 0;
            if (aVal === undefined) return 1;
            if (bVal === undefined) return -1;
            
            let comparison = 0;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              comparison = aVal - bVal;
            } else {
              comparison = String(aVal).localeCompare(String(bVal));
            }
            
            return sortConfig.direction === 'asc' ? comparison : -comparison;
          } catch (error) {
            console.error('Error during sorting:', error);
            return 0;
          }
        });
      }
      
      return filtered;
    } catch (error) {
      console.error('Error in visibleData calculation:', error);
      return [];
    }
  }, [data, searchTerm, selectedSource, sortConfig, activeFilters, visibleColumns, sources]);

  const getColumns = (): string[] => {
    if (!data || data.length === 0) return [];
    
    const columns = new Set<string>();
    
    // Always include source and created_at columns first
    columns.add('source');
    columns.add('created_at');
    
    // Extract metadata fields from all entries, excluding clientIp and receivedAt
    data.forEach(entry => {
      if (entry && entry.metadata && typeof entry.metadata === 'object') {
        Object.keys(entry.metadata).forEach(key => {
          // Exclude clientIp and receivedAt from columns
          if (key !== 'clientIp' && key !== 'receivedAt') {
            columns.add(key);
          }
        });
      }
    });
    
    return Array.from(columns);
  };

  const formatCellValue = (key: string, value: any) => {
    if (value === undefined || value === null) return '-';
    if (key === 'source') return getSourceName(value);
    if (key === 'created_at') {
      try {
        return new Date(value).toLocaleString();
      } catch (e) {
        return value;
      }
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getDisplayName = (column: string): string => {
    const displayNames: Record<string, string> = {
      'source': 'Source',
      'created_at': 'Date/Time'
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
          visibleColumns, 
          sources, 
          getDisplayName, 
          getValue, 
          formatCellValue
        );
        setIsDownloading(false);
        NotificationService.addNotification(
          'CSV Export Complete', 
          `Successfully exported ${visibleData.length} records to CSV with ${visibleColumns.length} columns.`,
          'success'
        );
      }, 500);
    } catch (err) {
      setError('Error exporting data. Please ensure you are logged in.');
      setIsDownloading(false);
      NotificationService.addNotification(
        'Export Failed', 
        'Failed to export data to CSV.',
        'error'
      );
    }
  };

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      await ApiService.clearData();
      if (setIsChanged) {
        setIsChanged(true);
      }
      
      NotificationService.addNotification(
        'Data Cleared', 
        'All data has been cleared successfully.',
        'info'
      );
    } catch (err) {
      setError('Error clearing data. Please ensure you are logged in.');
      NotificationService.addNotification(
        'Operation Failed', 
        'Failed to clear data.',
        'error'
      );
    } finally {
      setIsClearing(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      setError(null);
      const apiData = await ApiService.refreshData();
      
      // Update both internal state and notify parent
      if (!propData) {
        setInternalData([...apiData]);
      }
      if (onDataChange) {
        onDataChange([...apiData]);
      }
      if (setIsChanged) {
        setIsChanged(true);
      }
     
      setIsRefreshing(false);
      NotificationService.addNotification(
        'Data Refreshed', 
        'Successfully refreshed data from storage.',
        'success'
      );
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error refreshing data. Please ensure you are logged in.');
      setIsRefreshing(false);
      NotificationService.addNotification(
        'Refresh Failed', 
        'Failed to refresh data from storage.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ key, direction: 'desc' });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' 
      ? <SortAsc className="h-4 w-4 text-primary ml-1" />
      : <SortDesc className="h-4 w-4 text-primary ml-1" />;
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => {
      const existingFilterIndex = prev.findIndex(f => f.key === key);
      
      if (existingFilterIndex >= 0) {
        const newFilters = [...prev];
        newFilters[existingFilterIndex] = {
          ...newFilters[existingFilterIndex],
          value,
          enabled: !!value.trim()
        };
        return newFilters;
      } else {
        return [...prev, { key, value, enabled: !!value.trim() }];
      }
    });
  };

  const toggleColumnVisibility = (column: string, visible: boolean) => {
    if (visible) {
      setVisibleColumns(prev => [...prev, column].sort((a, b) => 
        allColumns.indexOf(a) - allColumns.indexOf(b)
      ));
    } else {
      setVisibleColumns(prev => prev.filter(col => col !== column));
    }
  };

  const isColumnVisible = (column: string) => {
    return visibleColumns.includes(column);
  };

  const getFilterValue = (key: string) => {
    const filter = activeFilters.find(f => f.key === key);
    return filter?.value || '';
  };

  const activeFilterCount = activeFilters.filter(f => f.enabled).length;

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-medium">Data Explorer</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={()=>setIsChanged && setIsChanged(true)}
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
              disabled={isClearing}
              className="hover-lift"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </>
              )}
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
          Explore and analyze your data with advanced filtering and sorting
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
              placeholder="Search across all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-full sm:w-48">
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ListFilter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Data</h4>
                  
                  <div>
                    <Label htmlFor="filter-column">Select Column</Label>
                    <Select 
                      value={activeFilterColumn || ''} 
                      onValueChange={(value) => setActiveFilterColumn(value || null)}
                    >
                      <SelectTrigger id="filter-column">
                        <SelectValue placeholder="Select column to filter" />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleColumns.map(column => (
                          <SelectItem key={column} value={column}>
                            {getDisplayName(column)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {activeFilterColumn && (
                    <div>
                      <Label htmlFor="filter-value">Filter Value</Label>
                      <Input
                        id="filter-value"
                        placeholder={`Enter value to filter by...`}
                        value={getFilterValue(activeFilterColumn)}
                        onChange={(e) => handleFilterChange(activeFilterColumn, e.target.value)}
                      />
                    </div>
                  )}
                  
                  {activeFilters.filter(f => f.enabled).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Active Filters</h5>
                      <div className="space-y-2">
                        {activeFilters.filter(f => f.enabled).map(filter => (
                          <div key={filter.key} className="flex items-center justify-between text-sm">
                            <span>
                              <span className="font-medium">
                                {getDisplayName(filter.key)}
                              </span>
                              : {filter.value}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleFilterChange(filter.key, '')}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => setActiveFilters([])}
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h5 className="text-sm font-medium mb-2">Show/Hide Columns</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allColumns.map(column => (
                        <div key={column} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`column-${column}`} 
                            checked={isColumnVisible(column)}
                            onCheckedChange={(checked) => toggleColumnVisibility(column, !!checked)}
                          />
                          <Label htmlFor={`column-${column}`}>{getDisplayName(column)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <div className="relative overflow-auto max-h-[400px]">
            {(isLoading && !isClearing) || isChanged ? (
              <div className="flex justify-center items-center p-8">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                  <TableRow>
                    {visibleColumns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleSort(column)}
                            className="font-medium flex items-center cursor-pointer hover:text-primary"
                          >
                            {getDisplayName(column)}
                            {getSortIcon(column)}
                          </button>
                          {activeFilters.some(f => f.key === column && f.enabled) && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                  <Filter className="h-3 w-3 text-primary" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-60 p-2" align="start">
                                <div className="space-y-2">
                                  <Label htmlFor={`quick-filter-${column}`}>Filter {getDisplayName(column)}</Label>
                                  <Input
                                    id={`quick-filter-${column}`}
                                    value={getFilterValue(column)}
                                    onChange={(e) => handleFilterChange(column, e.target.value)}
                                    placeholder="Filter value..."
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => handleFilterChange(column, '')}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleData.length > 0 ? (
                    visibleData.map((entry, index) => (
                      <TableRow key={entry.id || index} className="animate-fade-in">
                        {visibleColumns.map(column => (
                          <TableCell key={`${entry.id || index}-${column}`} className="whitespace-nowrap">
                            {formatCellValue(column, getValue(entry, column))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                        {isClearing ? (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Clearing data...
                          </div>
                        ) : error ? (
                          'Authentication required to view data'
                        ) : (
                          'No data available'
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="py-3 text-sm text-muted-foreground justify-between">
        <div>
          Showing {visibleData.length} of {data.length} entries
          {selectedSource !== 'all' && ` for ${getSourceName(selectedSource)}`}
        </div>
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-muted-foreground" />
          <span>Drag column headers to reorder</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedDataTable;
