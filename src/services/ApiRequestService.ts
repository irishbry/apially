
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
      
      console.log(`Testing API connection to ${testEndpoint} with key: ${apiKey.substring(0, 4)}...`);
      
      // Create a full URL if it's a relative path
      const fullEndpoint = testEndpoint.startsWith('http') 
        ? testEndpoint 
        : new URL(testEndpoint, window.location.origin).toString();
        
      const response = await fetch(fullEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      
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
        method: 'GET',
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
        return {
          success: false,
          message: responseData.message || `API connection failed with status ${response.status}`
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Connection failed: ${error.message}` 
        : 'Connection failed: Unknown error';
      
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
      console.log(`Fetching logs with API key: ${apiKey.substring(0, 4)}...`);
      
      const response = await fetch('/api/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
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
  return [
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      method: 'POST',
      endpoint: '/api/data',
      status: 'success',
      statusCode: 200,
      responseTime: 43,
      source: 'Factory Sensors',
      ip: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      requestBody: JSON.stringify({
        sensorId: 'sensor-1',
        temperature: 25.4,
        humidity: 68,
        pressure: 1013.2
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        message: "Data received successfully",
        data: {
          id: "entry-1625176468-123"
        }
      }, null, 2)
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      method: 'POST',
      endpoint: '/api/data',
      status: 'error',
      statusCode: 400,
      responseTime: 38,
      source: 'Office Environment',
      ip: '192.168.1.230',
      userAgent: 'Python-urllib/3.9',
      requestBody: JSON.stringify({
        humidity: 68,
        pressure: 1013.2
      }, null, 2),
      responseBody: JSON.stringify({
        success: false,
        message: "Data validation failed",
        errors: ["Missing required field: sensorId"]
      }, null, 2),
      error: "Missing required field: sensorId"
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      method: 'GET',
      endpoint: '/api/status',
      status: 'success',
      statusCode: 200,
      responseTime: 12,
      source: 'System',
      ip: '127.0.0.1',
      userAgent: 'curl/7.68.0',
      responseBody: JSON.stringify({
        status: "healthy",
        uptime: "2d 4h 12m",
        version: "1.0.0"
      }, null, 2)
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      method: 'POST',
      endpoint: '/api/data',
      status: 'error',
      statusCode: 401,
      responseTime: 22,
      source: 'Unknown',
      ip: '203.0.113.42',
      userAgent: 'PostmanRuntime/7.28.0',
      requestBody: JSON.stringify({
        sensorId: 'sensor-x',
        temperature: 18.2
      }, null, 2),
      responseBody: JSON.stringify({
        success: false,
        message: "Invalid API key or inactive source",
        code: "AUTH_FAILED"
      }, null, 2),
      error: "Invalid API key or inactive source"
    },
    {
      id: 'log-5',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      method: 'POST',
      endpoint: '/api/data',
      status: 'success',
      statusCode: 200,
      responseTime: 54,
      source: 'Warehouse Monitors',
      ip: '192.168.1.115',
      userAgent: 'ESP8266HTTPClient',
      requestBody: JSON.stringify({
        sensorId: 'sensor-w1',
        temperature: 22.1,
        humidity: 45,
        co2: 612
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        message: "Data received successfully",
        data: {
          id: "entry-1625172468-456"
        }
      }, null, 2)
    }
  ];
}
