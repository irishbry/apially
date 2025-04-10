
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
        responseBody: JSON.stringify({ 
          success: true, 
          message: 'Data received and processed successfully',
          data: {
            id: `entry-${Date.now().toString().substring(0, 10)}-123`,
            timestamp: new Date().toISOString(),
            sourceId: data.sourceId || data.source_id || 'source-123',
            sensorId: data.sensorId || data.sensor_id || 'sensor-1',
            ...data
          }
        })
      };
      
      // Log the API request (in a real implementation, you'd save this to a database)
      console.log('API Log:', logEntry);
      
      return {
        success: true,
        message: 'Data received successfully',
        data: {
          id: `entry-${Date.now().toString().substring(0, 10)}-123`,
          timestamp: new Date().toISOString(),
          sourceId: data.sourceId || data.source_id || 'source-123',
          sensorId: data.sensorId || data.sensor_id || 'sensor-1',
          ...data
        }
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
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'SERVER_ERROR'
      };
    }
  },
  
  testApiConnection: async (apiKey: string, endpoint?: string): Promise<{success: boolean; message: string}> => {
    try {
      const startTime = Date.now();
      // Implement API connection test
      const testEndpoint = endpoint || '/api/status';
      
      console.log(`Testing API connection to ${testEndpoint} with key: ${apiKey.substring(0, 4)}...`);
      
      // Create a full URL if it's a relative path
      const fullEndpoint = testEndpoint.startsWith('http') 
        ? testEndpoint 
        : new URL(testEndpoint, window.location.origin).toString();
        
      // Create a small test payload for schema validation
      const testData = {
        sensorId: 'test-sensor',
        timestamp: new Date().toISOString(),
        temperature: 22.5,
        test: true
      };
      
      const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey // Use X-API-Key header instead of Authorization
        },
        body: JSON.stringify(testData)
      });
      
      // Check if rate limited
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        return {
          success: false,
          message: `Rate limit exceeded. Try again after ${retryAfter} seconds.`
        };
      }
      
      // Check content type to ensure we're receiving JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let responseData;
      let responseText = '';
      
      try {
        responseText = await response.text();
        
        if (!isJson) {
          console.warn('Non-JSON response received:', responseText.substring(0, 150) + '...');
          return {
            success: false,
            message: `Received non-JSON response (${contentType || 'unknown content type'}). Make sure your API endpoint is configured correctly.`
          };
        }
        
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e, 'Raw response:', responseText.substring(0, 150) + '...');
        
        // Check if response is HTML (common error case)
        if (responseText.trim().toLowerCase().startsWith('<!doctype html>') || 
            responseText.trim().toLowerCase().startsWith('<html')) {
          return {
            success: false,
            message: 'Received HTML instead of JSON. This might be because the API is not properly configured or the endpoint is incorrect.'
          };
        }
        
        return {
          success: false,
          message: `Invalid response format: ${e instanceof Error ? e.message : 'Unknown parsing error'}`
        };
      }
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Create log entry for API connection test
      const logEntry: Partial<ApiLog> = {
        method: 'POST', // Changed to POST since we're sending test data
        endpoint: testEndpoint,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        source: 'API Test',
        message: responseData.message || (response.ok ? 'API connection successful' : 'API connection failed'),
        responseBody: responseText
      };
      
      console.log('API Log:', logEntry);
      
      if (response.ok) {
        return {
          success: true,
          message: responseData.message || 'API connection successful'
        };
      } else {
        // Handle schema validation errors specifically
        if (response.status === 400 && responseData.error === 'Data validation failed') {
          return {
            success: false,
            message: `Schema validation failed: ${responseData.details ? responseData.details.join(', ') : 'Unknown validation error'}`
          };
        }
        
        // Handle rate limit errors
        if (response.status === 429) {
          return {
            success: false,
            message: `Rate limit exceeded. ${responseData.message || 'Try again later.'}`
          };
        }
        
        return {
          success: false,
          message: responseData.error || responseData.message || `API connection failed with status ${response.status}`
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Connection failed: ${error.message}` 
        : 'Connection failed: Unknown error';
      
      // Create log entry for failed API connection test
      const logEntry: Partial<ApiLog> = {
        method: 'POST', // Changed to POST since we're sending test data
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
      console.log(`Fetching logs with API key: ${apiKey.substring(0, 4)}...`);
      
      const response = await fetch('/api/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      
      // Check if rate limited
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        console.warn(`Rate limit exceeded. Try again after ${retryAfter} seconds.`);
        throw new Error(`Rate limit exceeded. Try again after ${retryAfter} seconds.`);
      }
      
      let data;
      let responseText = '';
      
      try {
        responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing logs response:', e, 'Raw response:', responseText);
        throw new Error(`Failed to parse logs response: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      
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
        message: response.ok ? 'Logs fetched successfully' : 'Failed to fetch logs',
        responseBody: responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '')
      };
      
      console.log('API Log:', logEntry);
      
      if (response.ok && data.logs) {
        return data.logs;
      }
      
      throw new Error(data.message || 'Failed to fetch logs');
    } catch (error) {
      console.error('Error fetching logs:', error);
      
      // Return demo logs as a fallback
      console.log('Falling back to demo logs');
      return generateDemoLogs();
    }
  }
};

// Helper function to generate demo logs for testing
function generateDemoLogs(): ApiLog[] {
  return [];
}
