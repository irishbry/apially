
import { DataEntry, ApiResponse, ApiLog } from '@/types/api.types';

export const ApiRequestService = {
  receiveData: async (data: DataEntry, apiKey?: string): Promise<ApiResponse> => {
    try {
      const startTime = Date.now();
      // Implementation for receiving data...
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Create log entry for successful data reception
      const logEntry: Partial<ApiLog> = {
        method: 'POST',
        endpoint: '/api/data',
        status: 'success',
        statusCode: 200,
        responseTime,
        source: data.sourceId || data.source_id || 'Unknown',
        message: 'Data received successfully',
        requestBody: JSON.stringify(data),
        responseBody: JSON.stringify({ success: true, message: 'Data received successfully' })
      };
      
      // Log the API request (in a real implementation, you'd save this to a database)
      console.log('API Log:', logEntry);
      
      return {
        success: true,
        message: 'Data received successfully'
      };
    } catch (error) {
      // Create log entry for failed data reception
      const logEntry: Partial<ApiLog> = {
        method: 'POST',
        endpoint: '/api/data',
        status: 'error',
        statusCode: 500,
        source: data.sourceId || data.source_id || 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        requestBody: JSON.stringify(data),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      console.error('API Log:', logEntry);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },
  
  testApiConnection: async (apiKey: string, endpoint?: string): Promise<{success: boolean; message: string}> => {
    try {
      const startTime = Date.now();
      // Implement API connection test
      const testEndpoint = endpoint || '/api/status';
      
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      
      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Create log entry for API connection test
      const logEntry: Partial<ApiLog> = {
        method: 'GET',
        endpoint: testEndpoint,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        source: 'API Test',
        message: data.message || (response.ok ? 'API connection successful' : 'API connection failed'),
        responseBody: JSON.stringify(data)
      };
      
      console.log('API Log:', logEntry);
      
      if (response.ok) {
        return {
          success: true,
          message: data.message || 'API connection successful'
        };
      } else {
        return {
          success: false,
          message: data.message || 'API connection failed'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? `Connection failed: ${error.message}` : 'Connection failed: Unknown error';
      
      // Create log entry for failed API connection test
      const logEntry: Partial<ApiLog> = {
        method: 'GET',
        endpoint: endpoint || '/api/status',
        status: 'error',
        statusCode: 0,
        source: 'API Test',
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      console.error('API Log:', logEntry);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  },
  
  fetchLogs: async (apiKey: string): Promise<ApiLog[]> => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Create log entry for logs fetching
      const logEntry: Partial<ApiLog> = {
        method: 'GET',
        endpoint: '/api/logs',
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        source: 'System',
        message: response.ok ? 'Logs fetched successfully' : 'Failed to fetch logs'
      };
      
      console.log('API Log:', logEntry);
      
      if (response.ok && data.logs) {
        return data.logs;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }
};
