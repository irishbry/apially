
import { DataEntry, ApiResponse } from '@/types/api.types';

const usingPhpBackend = (): boolean => {
  return window.location.pathname.includes('/api/');
};

const receivePhpApiData = async (data: DataEntry, apiKey?: string): Promise<ApiResponse> => {
  try {
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

export const ApiRequestService = {
  receiveData: async (data: DataEntry, apiKey?: string): Promise<ApiResponse> => {
    try {
      if (usingPhpBackend()) {
        return receivePhpApiData(data, apiKey);
      }
      
      console.log('Sending data to Supabase Edge Function...');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      
      const response = await fetch(`${window.location.origin}/api/v1/data-receiver`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      
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
  },

  testApiConnection: async (apiKey: string, endpoint?: string): Promise<ApiResponse> => {
    try {
      const testData: DataEntry = {
        sensorId: 'test-sensor',
        timestamp: new Date().toISOString(),
        temperature: 22.5,
        humidity: 45,
      };
      
      const apiUrl = endpoint || 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/data-receiver';
      
      console.log(`Testing API connection to ${apiUrl}...`);
      console.log(`Using API key: ${apiKey}`);
      
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
};
