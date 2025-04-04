import { supabase } from '@/integrations/supabase/client';

// Define the types needed across the application
export interface DataEntry {
  id?: string;
  timestamp?: string;
  sourceId?: string;
  source_id?: string;
  sensorId?: string;
  sensor_id?: string;
  userId?: string;
  user_id?: string;
  fileName?: string;
  file_name?: string;
  filePath?: string;
  file_path?: string;
  receivedAt?: string;
  clientIp?: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  metadata?: Record<string, any> | null;
  [key: string]: any;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: string;
  statusCode?: number;
  responseTime?: number;
  source: string;
  ip: string;
  userAgent?: string;
  message?: string;
  requestBody?: string;
  responseBody?: string;
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface Source {
  id: string;
  name: string;
  apiKey?: string;
  active: boolean;
  lastActive?: string;
  dataCount?: number;
  url?: string;
  userId?: string;
}

export interface DataSchema {
  fieldTypes: Record<string, string>;
  requiredFields: string[];
}

export interface ApiUsageByDay {
  date: string;
  count: number;
  source?: string;
}

export interface ApiUsageBySource {
  source: string;
  count: number;
  percentage: number;
}

// Helper functions for backward compatibility
const usingPhpBackend = (): boolean => {
  // Check if we're using the PHP backend
  return window.location.pathname.includes('/api/');
};

const receivePhpApiData = async (data: DataEntry, apiKey?: string): Promise<ApiResponse> => {
  try {
    // We'll send the raw API key - the endpoint will handle any formatting needed
    const response = await fetch('/api/endpoints/data_endpoint.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? 'Data received successfully' : 'Failed to submit data'),
      data: result.data,
    };
  } catch (error) {
    console.error('Error in receivePhpApiData:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// This method sends data to the API with proper authorization headers
async function receiveData(data: DataEntry, apiKey?: string): Promise<ApiResponse> {
  try {
    // If we're in a test environment with the PHP API backend
    if (usingPhpBackend()) {
      return receivePhpApiData(data, apiKey);
    }
    
    // Otherwise use Supabase Edge Function
    console.log('Sending data to Supabase Edge Function...');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add the API key as a header if provided (backend will handle any Bearer prefix)
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    const response = await fetch(`${window.location.origin}/api/v1/data-receiver`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    // If we got an error, try to parse it properly
    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('API error:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
        
        return {
          success: false,
          message: errorMessage,
          data: errorData
        };
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        return {
          success: false,
          message: errorMessage
        };
      }
    }
    
    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Data received successfully',
      data: result.receipt || result.data,
    };
  } catch (error) {
    console.error('Error in receiveData:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Direct helper to test the API with a given API key and endpoint URL
export async function testApiConnection(apiKey: string, endpoint?: string): Promise<ApiResponse> {
  try {
    const testData: DataEntry = {
      sensorId: 'test-sensor',
      timestamp: new Date().toISOString(),
      temperature: 22.5,
      humidity: 45,
    };
    
    // Determine the endpoint URL
    const apiUrl = endpoint || 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/data-receiver';
    
    console.log(`Testing API connection to ${apiUrl}...`);
    console.log(`Using API key: ${apiKey}`);
    
    // Send the API key in the headers, letting the backend handle formatting
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    console.log('API test response:', result);
    
    return {
      success: response.ok,
      message: result.message || (response.ok ? 'Connection test successful' : 'Connection test failed'),
      data: result
    };
  } catch (error) {
    console.error('API connection test error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during connection test',
    };
  }
}

// Create the ApiService object with all methods
export const ApiService = {
  // Data handling methods
  receiveData,
  testApiConnection,
  
  // Get data from Supabase
  getData: async (): Promise<DataEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('data_entries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching data:', error);
        return [];
      }
      
      // Transform database row to match DataEntry interface
      return data.map(item => {
        let parsedMetadata: Record<string, any> | null = null;
        
        // Safely handle metadata field
        if (item.metadata) {
          if (typeof item.metadata === 'string') {
            try {
              parsedMetadata = JSON.parse(item.metadata);
            } catch (e) {
              parsedMetadata = { raw: item.metadata };
            }
          } else {
            parsedMetadata = item.metadata as Record<string, any>;
          }
        }
        
        return {
          id: item.id,
          timestamp: item.timestamp,
          source_id: item.source_id,
          sourceId: item.source_id,
          user_id: item.user_id,
          userId: item.user_id,
          sensor_id: item.sensor_id,
          sensorId: item.sensor_id,
          file_name: item.file_name,
          fileName: item.file_name,
          file_path: item.file_path,
          filePath: item.file_path,
          metadata: parsedMetadata,
          ...item // Include all other fields
        };
      });
    } catch (error) {
      console.error('Error in getData:', error);
      return [];
    }
  },
  
  // Get sources from Supabase
  getSources: async (): Promise<Source[]> => {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching sources:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSources:', error);
      return [];
    }
  },
  
  // Get API usage by day
  getApiUsageByDay: async (days: number = 30): Promise<ApiUsageByDay[]> => {
    try {
      // Calculate the date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('data_entries')
        .select('created_at, source_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
        
      if (error) {
        console.error('Error fetching API usage by day:', error);
        return [];
      }
      
      const usageByDay: Record<string, number> = {};
      
      // Group by day
      data.forEach(entry => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        usageByDay[date] = (usageByDay[date] || 0) + 1;
      });
      
      // Convert to array for charting
      const result: ApiUsageByDay[] = Object.keys(usageByDay).map(date => ({
        date,
        count: usageByDay[date]
      }));
      
      // Sort by date
      result.sort((a, b) => a.date.localeCompare(b.date));
      
      return result;
    } catch (error) {
      console.error('Error in getApiUsageByDay:', error);
      return [];
    }
  },
  
  // Get API usage by source
  getApiUsageBySource: async (): Promise<ApiUsageBySource[]> => {
    try {
      // Get all data entries with source_id
      const { data: entries, error: entriesError } = await supabase
        .from('data_entries')
        .select('source_id')
        .not('source_id', 'is', null);
        
      if (entriesError) {
        console.error('Error fetching API usage by source:', entriesError);
        return [];
      }
      
      // Get all sources
      const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('id, name');
        
      if (sourcesError) {
        console.error('Error fetching sources for API usage:', sourcesError);
        return [];
      }
      
      // Create a map of source id to name
      const sourceMap: Record<string, string> = {};
      sources.forEach(source => {
        sourceMap[source.id] = source.name;
      });
      
      // Count entries by source
      const countBySource: Record<string, number> = {};
      entries.forEach(entry => {
        if (entry.source_id) {
          countBySource[entry.source_id] = (countBySource[entry.source_id] || 0) + 1;
        }
      });
      
      // Calculate total count
      const totalCount = entries.length;
      
      // Convert to array for charting
      const result: ApiUsageBySource[] = Object.keys(countBySource).map(sourceId => ({
        source: sourceMap[sourceId] || 'Unknown',
        count: countBySource[sourceId],
        percentage: Math.round((countBySource[sourceId] / totalCount) * 100)
      }));
      
      // Sort by count (descending)
      result.sort((a, b) => b.count - a.count);
      
      return result;
    } catch (error) {
      console.error('Error in getApiUsageBySource:', error);
      return [];
    }
  },
  
  subscribe: (callback: (data: DataEntry[]) => void) => {
    // Set up real-time subscription
    const channel = supabase
      .channel('data_entries_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'data_entries' }, 
        async () => {
          // When we get any change, fetch the latest data
          const freshData = await ApiService.getData();
          callback(freshData);
        }
      )
      .subscribe();
    
    // Initial data fetch
    ApiService.getData().then(callback);
    
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  subscribeToSources: (callback: (sources: Source[]) => void) => {
    // Set up real-time subscription
    const channel = supabase
      .channel('sources_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sources' }, 
        async () => {
          // When we get any change, fetch the latest sources
          const freshSources = await ApiService.getSources();
          callback(freshSources);
        }
      )
      .subscribe();
    
    // Initial sources fetch
    ApiService.getSources().then(callback);
    
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  clearData: async () => {
    try {
      const { error } = await supabase
        .from('data_entries')
        .delete()
        .is('id', 'not.null'); // This will delete all records
      
      if (error) {
        console.error('Error clearing data:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in clearData:', error);
      throw error;
    }
  },
  
  refreshData: async () => {
    // Just return the current data from Supabase
    return await ApiService.getData();
  },
  
  deleteDataEntry: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('data_entries')
        .delete()
        .eq('id', id as any);
      
      if (error) {
        console.error('Error deleting entry:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteDataEntry:', error);
      return false;
    }
  },
  
  getLogs: async (): Promise<ApiLog[]> => {
    try {
      // First attempt to fetch logs from PHP backend if we're using it
      if (usingPhpBackend()) {
        const response = await fetch('/api/logs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('api_key') || 'demo-api-key-for-testing'}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.logs.map((log: any) => {
            // Map status to statusCode number if it's not already a number
            let statusCode = log.statusCode;
            if (!statusCode && log.status) {
              if (log.status === 'success') statusCode = 200;
              else if (log.status === 'error') statusCode = 500;
              else if (log.status === 'warning') statusCode = 400;
              else statusCode = 0;
            }
            
            return {
              id: log.id,
              timestamp: log.timestamp,
              method: log.method || 'GET',
              endpoint: log.endpoint,
              status: log.status,
              statusCode: statusCode,
              responseTime: log.responseTime,
              source: log.source,
              ip: log.ip || 'Unknown',
              userAgent: log.userAgent,
              message: log.message,
              requestBody: log.requestBody,
              responseBody: log.responseBody,
              error: log.message && log.status === 'error' ? log.message : undefined
            };
          });
        }
      }
      
      // If we're not using PHP backend or if fetch failed, fall back to demo logs
      return [];
      
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  },
  
  getSourcesStats: async () => {
    try {
      // Get sources stats
      const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('*');
      
      if (sourcesError) {
        console.error('Error getting sources:', sourcesError);
        return {
          totalSources: 0,
          activeSources: 0,
          totalDataPoints: 0
        };
      }
      
      const totalSources = sources.length;
      const activeSources = sources.filter(s => s.active).length;
      const totalDataPoints = sources.reduce((sum, source) => sum + (source.data_count || 0), 0);
      
      return {
        totalSources,
        activeSources,
        totalDataPoints
      };
    } catch (error) {
      console.error('Error in getSourcesStats:', error);
      return {
        totalSources: 0,
        activeSources: 0,
        totalDataPoints: 0
      };
    }
  },
  
  getSchema: () => {
    return {
      fieldTypes: {},
      requiredFields: []
    };
  },
  
  setSchema: (schema: DataSchema) => {
    // Implementation
  },
  
  getApiKey: () => {
    return '';
  },
  
  setApiKey: (key: string) => {
    // Implementation
  },
  
  getDropboxLink: () => {
    return '';
  },
  
  setDropboxLink: (link: string) => {
    // Implementation
  },
  
  exportToCsv: () => {
    // Implementation
  }
};
