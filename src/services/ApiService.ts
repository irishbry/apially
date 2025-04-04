
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
    // Format the API key with Bearer prefix if it doesn't already have it
    const formattedApiKey = apiKey && !apiKey.startsWith('Bearer ') ? `Bearer ${apiKey}` : apiKey || '';
    
    const response = await fetch('/api/endpoints/data_endpoint.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': formattedApiKey,
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
    
    // Format the API key with Bearer prefix if it doesn't already have it
    if (apiKey) {
      headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
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
    console.log(`Using authorization header: ${apiKey}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey, // Already formatted with Bearer prefix in component
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
  
  // Mock implementations or actual implementations for other methods
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
