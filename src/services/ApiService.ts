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
  metadata?: Record<string, any>;
  [key: string]: any;
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

// Helper functions for backward compatibility
const usingPhpBackend = (): boolean => {
  // Check if we're using the PHP backend
  return window.location.pathname.includes('/api/');
};

const receivePhpApiData = async (data: DataEntry, apiKey?: string): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/endpoints/data_endpoint.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey || '',
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

// This method needs to be updated to properly send the API key as an authorization header
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
    
    // Add API key as Authorization header if provided
    if (apiKey) {
      headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
      headers['x-api-key'] = apiKey; // Adding both for compatibility
    }
    
    const response = await fetch(`${window.location.origin}/api/v1/data-receiver`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP error ${response.status}` 
      }));
      
      console.error('API error:', errorData);
      return {
        success: false,
        message: errorData.error || errorData.message || 'Failed to submit data',
      };
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

// Create the ApiService object with all methods
const ApiService = {
  // Existing method
  receiveData,
  
  // Add other methods that are used across components
  getData: (): DataEntry[] => {
    // Mock implementation or actual implementation
    return [];
  },
  
  getSources: (): Source[] => {
    // Mock implementation or actual implementation
    return [];
  },
  
  subscribe: (callback: (data: DataEntry[]) => void) => {
    // Mock implementation or actual implementation
    return () => {}; // Return unsubscribe function
  },
  
  subscribeToSources: (callback: (sources: Source[]) => void) => {
    // Mock implementation or actual implementation
    return () => {}; // Return unsubscribe function
  },
  
  clearData: async () => {
    // Implementation
  },
  
  refreshData: async () => {
    // Implementation
  },
  
  deleteDataEntry: async (id: string): Promise<boolean> => {
    // Implementation
    return true;
  },
  
  getApiUsageStats: () => {
    return {
      totalRequests: 0,
      uniqueSources: 0,
      lastReceived: 'No data'
    };
  },
  
  getSourcesStats: () => {
    return {
      totalSources: 0,
      activeSources: 0,
      totalDataPoints: 0
    };
  },
  
  getSchema: () => {
    return {
      fieldTypes: {},
      requiredFields: []
    };
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

// Export as a named export
export { ApiService };
