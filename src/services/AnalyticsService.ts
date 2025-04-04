
import { supabase } from '@/integrations/supabase/client';
import { ApiUsageByDay, ApiLog } from '@/types/api.types';

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
    if (window.location.pathname.includes('/api/')) {
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
    
    return [];
  }
};
