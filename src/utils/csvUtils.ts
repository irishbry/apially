
import { DataEntry, Source } from "@/services/ApiService";

// Convert an array of objects to CSV string with Data Explorer format
export function convertToCSV(
  data: DataEntry[], 
  visibleColumns: string[], 
  sources: Source[] = [],
  getDisplayName: (column: string) => string,
  getValue: (entry: DataEntry, column: string) => any,
  formatCellValue: (key: string, value: any) => string
): string {
  if (data.length === 0) return '';
  
  // Use the visible columns as headers with display names
  const headers = visibleColumns.map(column => getDisplayName(column));
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows using the same logic as the table
  const dataRows = data.map(entry => {
    return visibleColumns.map(column => {
      const value = getValue(entry, column);
      const formattedValue = formatCellValue(column, value);
      
      // Handle CSV escaping
      if (formattedValue === undefined || formattedValue === null || formattedValue === '-') {
        return '';
      }
      
      const stringValue = String(formattedValue);
      // Escape quotes and wrap in quotes if contains commas, quotes, or newlines
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

// Format the current date for filenames
export function formatDateForFilename(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

// Download CSV as a file with Data Explorer format
export function downloadCSV(
  data: DataEntry[], 
  visibleColumns: string[], 
  sources: Source[] = [],
  getDisplayName: (column: string) => string,
  getValue: (entry: DataEntry, column: string) => any,
  formatCellValue: (key: string, value: any) => string,
  filename?: string
): void {
  const csvContent = convertToCSV(data, visibleColumns, sources, getDisplayName, getValue, formatCellValue);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `data-export-${formatDateForFilename()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Format time for display
export function formatTimeForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

// Get email-friendly date/time for export name
export function getFormattedDateTime(): string {
  const now = new Date();
  const date = now.toLocaleDateString().replace(/\//g, '-');
  const time = now.toLocaleTimeString().replace(/:/g, '-').replace(/\s/g, '');
  return `${date}_${time}`;
}

// Group data by date
export function groupDataByDate(data: DataEntry[]): Record<string, DataEntry[]> {
  const groupedData: Record<string, DataEntry[]> = {};
  
  data.forEach(entry => {
    if (!entry.timestamp) return;
    
    const date = new Date(entry.timestamp);
    const dateString = date.toLocaleDateString();
    
    if (!groupedData[dateString]) {
      groupedData[dateString] = [];
    }
    
    groupedData[dateString].push(entry);
  });
  
  return groupedData;
}

// Count data entries by source and date range
export function countDataBySource(
  data: DataEntry[], 
  startDate: Date, 
  endDate: Date
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  data.forEach(entry => {
    if (!entry.timestamp) return;
    
    const date = new Date(entry.timestamp);
    if (date >= startDate && date <= endDate) {
      const sourceId = entry.sourceId || 'unknown';
      counts[sourceId] = (counts[sourceId] || 0) + 1;
    }
  });
  
  return counts;
}
