
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Filter, Search, Trash2 } from "lucide-react";
import ApiService, { DataEntry } from "@/services/ApiService";
import { downloadCSV } from "@/utils/csvUtils";

const DataTable: React.FC = () => {
  const [data, setData] = useState<DataEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleData, setVisibleData] = useState<DataEntry[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Get initial data
    setData(ApiService.getData());
    
    // Subscribe to data changes
    const unsubscribe = ApiService.subscribe(newData => {
      setData([...newData]);
    });
    
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    // Filter data based on search term
    if (!searchTerm.trim()) {
      setVisibleData(data);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = data.filter(entry => {
        return Object.values(entry).some(value => 
          value !== null && 
          value !== undefined && 
          String(value).toLowerCase().includes(term)
        );
      });
      setVisibleData(filtered);
    }
  }, [data, searchTerm]);

  const handleExportCSV = () => {
    setIsDownloading(true);
    setTimeout(() => {
      downloadCSV(data);
      setIsDownloading(false);
    }, 500);
  };

  const handleClearData = () => {
    ApiService.clearData();
  };

  // Get all columns dynamically from data
  const getColumns = () => {
    if (data.length === 0) return ['No Data'];
    
    // Get all unique keys, prioritizing common ones
    const priorityKeys = ['timestamp', 'id', 'sensorId'];
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

  const formatCellValue = (value: any) => {
    if (value === undefined || value === null) return '-';
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
              onClick={handleClearData}
              className="hover-lift"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button 
              size="sm"
              onClick={handleExportCSV}
              disabled={isDownloading || data.length === 0}
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
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
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
                      {column}
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
                          {formatCellValue(entry[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No data available
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
      </CardFooter>
    </Card>
  );
};

export default DataTable;
