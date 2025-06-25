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
  
  // Dropbox configuration functions using Supabase
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
  
  saveDropboxConfig: async (dropboxPath: string, dropboxToken: string, dailyBackupEnabled: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dropbox_configs')
        .upsert({
          user_id: user.id,
          dropbox_path: dropboxPath,
          dropbox_token: dropboxToken, // Keep for backward compatibility
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
  
  saveDropboxOAuthConfig: async (config: {
    app_key: string;
    app_secret: string;
    refresh_token: string;
    access_token: string;
    token_expires_at: string;
    dropbox_path?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dropbox_configs')
        .upsert({
          user_id: user.id,
          app_key: config.app_key,
          app_secret: config.app_secret,
          refresh_token: config.refresh_token,
          access_token: config.access_token,
          token_expires_at: config.token_expires_at,
          dropbox_path: config.dropbox_path || '/DataBackups',
          daily_backup_enabled: true,
          is_active: true
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving dropbox OAuth config:', error);
      throw error;
    }
  },
  
  updateDropboxConfig: async (config: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dropbox_configs')
        .update(config)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating dropbox config:', error);
      throw error;
    }
  },
  
  // Get correct Supabase endpoint
  getDefaultEndpoint: () => 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/data-receiver'
};
