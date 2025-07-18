import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { AlertTriangle, Download, Filter, Search, SortAsc, SortDesc, Trash2, FileDown, ListFilter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
  onStatsChange?: (stats: {
    totalCount: number;
    sources: Source[];
    lastReceived: string;
    uniqueSources: number;
  }) => void;
}

const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({ 
  data: propData, 
  sources: propSources,
  onDataChange,
  setIsChanged,
  isChanged,
  onStatsChange
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

  // Fetch paginated data
  const fetchPaginatedData = async (page: number, itemsPerPage: number) => {
    if (propData) return; // Skip if prop data is provided
    
    try {
      setIsLoading(true);
      setError(null);
      
      const offset = (page - 1) * itemsPerPage;
      const data = await ApiService.getData({ 
        limit: itemsPerPage, 
        offset: offset,
        includeCount: page === 1 // Only get count on first page load
      });
      
      setInternalData(data);
      
      // Get total count for pagination
      if (page === 1) {
        const count = await ApiService.getDataCount();
        setTotalCount(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
      
    } catch (err) {
      console.error('Error loading paginated data:', err);
      setError('Error loading data. Please ensure you are logged in.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if no prop data is provided
    if (!propData && !propSources) {
      fetchPaginatedData(currentPage, itemsPerPage);
      
      // Load sources
      const loadSources = async () => {
        try {
          const sourcesData = await ApiService.getSources();
          setInternalSources(sourcesData);
        } catch (err) {
          console.error('Error loading sources:', err);
        }
      };
      
      loadSources();
    }
  }, [propData, propSources, currentPage, itemsPerPage]);

  // Pass stats data to parent component
  useEffect(() => {
    if (onStatsChange && sources.length > 0) {
      const uniqueSources = new Set(data.map(item => item.sourceId || item.source_id)).size;
      const lastReceived = data.length > 0 ? (data[0]?.created_at || data[0]?.timestamp || 'No data') : 'No data';
      
      onStatsChange({
        totalCount: propData ? data.length : totalCount,
        sources: sources,
        lastReceived: lastReceived,
        uniqueSources: uniqueSources
      });
    }
  }, [data, sources, totalCount, propData, onStatsChange]);

  useEffect(() => {
    if (data && data.length >= 0) {
      const cols = getColumns();
      setAllColumns(cols);
      setVisibleColumns(cols);
    }
  }, [data]);
  
  const filteredData = useMemo(() => {
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
      console.error('Error in filteredData calculation:', error);
      return [];
    }
  }, [data, searchTerm, selectedSource, sortConfig, activeFilters, visibleColumns, sources]);

  // For server-side pagination, don't slice the data - it's already paginated
  const paginatedData = useMemo(() => {
    if (propData) {
      // If using prop data, apply client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredData.slice(startIndex, endIndex);
    } else {
      // If using server-side data, return filtered data as-is (already paginated)
      return filteredData;
    }
  }, [filteredData, currentPage, itemsPerPage, propData]);

  // Update total pages based on data source
  useEffect(() => {
    if (propData) {
      // Client-side pagination
      const calculatedTotalPages = Math.ceil(filteredData.length / itemsPerPage);
      setTotalPages(calculatedTotalPages);
    } else {
      // Server-side pagination - use totalCount from server
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
    }
  }, [filteredData.length, itemsPerPage, propData, totalCount]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSource, activeFilters]);

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
        // Export all filtered data, not just current page
        downloadCSV(
          filteredData, 
          visibleColumns, 
          sources, 
          getDisplayName, 
          getValue, 
          formatCellValue
        );
        setIsDownloading(false);
        NotificationService.addNotification(
          'CSV Export Complete', 
          `Successfully exported ${filteredData.length} records to CSV with ${visibleColumns.length} columns.`,
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

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

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
              disabled={isDownloading || filteredData.length === 0}
              className="hover-lift"
            >
              {isDownloading ? (
                <>Downloading...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV ({filteredData.length})
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
                  {paginatedData.length > 0 ? (
                    paginatedData.map((entry, index) => (
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
      <CardFooter className="py-3 flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {propData ? (
              // Client-side pagination - show filtered results
              <>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries</>
            ) : (
              // Server-side pagination - show real total
              <>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries</>
            )}
            {selectedSource !== 'all' && ` for ${getSourceName(selectedSource)}`}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="items-per-page" className="text-sm">Rows per page:</Label>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger id="items-per-page" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-1 pl-2.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </PaginationItem>
                
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(1)}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}
                
                {getPageNumbers().map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-1 pr-2.5"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedDataTable;
