
import { supabase } from '@/integrations/supabase/client';
import { ApiUsageByDay, ApiLog } from '@/types/api.types';
import { ApiRequestService } from './ApiRequestService';

export const AnalyticsService = {
  getApiUsageByDay: async (days: number = 30): Promise<ApiUsageByDay[]> => {
    try {
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
      
      data.forEach(entry => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        usageByDay[date] = (usageByDay[date] || 0) + 1;
      });
      
      const result: ApiUsageByDay[] = Object.keys(usageByDay).map(date => ({
        date,
        count: usageByDay[date]
      }));
      
      result.sort((a, b) => a.date.localeCompare(b.date));
      
      return result;
    } catch (error) {
      console.error('Error in getApiUsageByDay:', error);
      return [];
    }
  },
  
  getLogs: async (): Promise<ApiLog[]> => {
    try {
      // Check if we have access to the API logs endpoint
      const apiKey = localStorage.getItem('api_key') || 'demo-api-key-for-testing';
      
      // First try to fetch logs from the API
      const apiLogs = await ApiRequestService.fetchLogs(apiKey);
      if (apiLogs.length > 0) {
        return apiLogs;
      }
      
      // Fallback to demo logs if the API endpoint doesn't return any data
      return generateDemoLogs();
    } catch (error) {
      console.error('Error fetching logs:', error);
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
