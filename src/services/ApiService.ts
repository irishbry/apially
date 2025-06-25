import { DataService } from './DataService';
import { SourcesService } from './SourcesService';
import { AnalyticsService } from './AnalyticsService';
import { ApiRequestService } from './ApiRequestService';
import { ConfigService } from './ConfigService';
import { supabase } from '@/integrations/supabase/client';
import { DataEntry, ApiResponse } from '@/types/api.types';

// Re-export types from their new location
export * from '@/types/api.types';

// Create a unified API service that composes functionality from the other services
export const ApiService = {
  // Data Service functions
  getData: DataService.getData,
  refreshData: DataService.refreshData,
  deleteDataEntry: DataService.deleteDataEntry,
  clearData: DataService.clearData,
  subscribe: DataService.subscribe,
  
  // Sources Service functions
  getSources: SourcesService.getSources,
  getSourcesStats: SourcesService.getSourcesStats,
  getApiUsageBySource: SourcesService.getApiUsageBySource,
  subscribeToSources: SourcesService.subscribeToSources,
  
  // Analytics Service functions
  getApiUsageByDay: AnalyticsService.getApiUsageByDay,
  getLogs: AnalyticsService.getLogs,
  
  // API Request Service functions
  receiveData: ApiRequestService.receiveData,
  testApiConnection: ApiRequestService.testApiConnection,
  fetchLogs: ApiRequestService.fetchLogs,
  
  // Config Service functions
  getSchema: ConfigService.getSchema,
  setSchema: ConfigService.setSchema,
  validateDataAgainstSchema: ConfigService.validateDataAgainstSchema,
  getApiKey: ConfigService.getApiKey,
  setApiKey: ConfigService.setApiKey,
  getDropboxLink: ConfigService.getDropboxLink,
  setDropboxLink: ConfigService.setDropboxLink,
  exportToCsv: ConfigService.exportToCsv,
  
  // Dropbox OAuth configuration functions using Supabase
  getDropboxConfig: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('dropbox_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching dropbox config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getDropboxConfig:', error);
      return null;
    }
  },
  
  saveDropboxConfig: async (dropboxPath: string, appKey: string, appSecret: string, refreshToken: string, accessToken: string, expiresAt: string, dailyBackupEnabled: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dropbox_configs')
        .upsert({
          user_id: user.id,
          dropbox_path: dropboxPath,
          app_key: appKey,
          app_secret: appSecret,
          refresh_token: refreshToken,
          dropbox_token: accessToken,
          access_token_expires_at: expiresAt,
          daily_backup_enabled: dailyBackupEnabled,
          is_active: true
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving dropbox config:', error);
      throw error;
    }
  },
  
  // Exchange authorization code for tokens
  exchangeDropboxCode: async (code: string, appKey: string, appSecret: string) => {
    try {
      console.log('Exchanging Dropbox authorization code for tokens...');
      
      const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
      const credentials = btoa(`${appKey}:${appSecret}`);
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();
      console.log('Token exchange successful');
      
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      };
    } catch (error) {
      console.error('Error exchanging Dropbox code:', error);
      throw error;
    }
  },
  
  // Refresh access token using refresh token
  refreshDropboxToken: async (refreshToken: string, appKey: string, appSecret: string) => {
    try {
      console.log('Refreshing Dropbox access token...');
      
      const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
      const credentials = btoa(`${appKey}:${appSecret}`);
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', errorText);
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();
      console.log('Token refresh successful');
      
      return {
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
      };
    } catch (error) {
      console.error('Error refreshing Dropbox token:', error);
      throw error;
    }
  },
  
  // Get correct Supabase endpoint
  getDefaultEndpoint: () => 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/data-receiver'
};
