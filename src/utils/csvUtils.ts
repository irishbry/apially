
import { DataEntry } from "@/services/ApiService";

// Convert an array of objects to CSV string
export function convertToCSV(data: DataEntry[]): string {
  if (data.length === 0) return '';
  
  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(entry => {
    Object.keys(entry).forEach(key => allKeys.add(key));
  });
  
  // Sort keys to ensure timestamp and id come first
  const headers = Array.from(allKeys).sort((a, b) => {
    if (a === 'timestamp') return -1;
    if (b === 'timestamp') return 1;
    if (a === 'id') return -1;
    if (b === 'id') return 1;
    return a.localeCompare(b);
  });
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = data.map(entry => {
    return headers.map(header => {
      const value = entry[header];
      // Handle different types of values
      if (value === undefined || value === null) return '';
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains commas or quotes
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      return String(value);
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

// Download CSV as a file
export function downloadCSV(data: DataEntry[], filename?: string): void {
  const csvContent = convertToCSV(data);
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
