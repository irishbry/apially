
import { supabase } from '@/integrations/supabase/client';
import { ApiService } from './ApiService';

export const DropboxBackupService = {
  async createDailyBackup(userId: string, format: 'csv' | 'json' = 'csv'): Promise<boolean> {
    try {
      console.log('Creating daily backup for user:', userId);
      
      // Get Dropbox configuration from Supabase
      const dropboxConfig = await ApiService.getDropboxConfig();
      
      if (!dropboxConfig || !dropboxConfig.is_active) {
        console.log('No active Dropbox configuration found, skipping backup');
        return false;
      }

      console.log('Dropbox configuration found, proceeding with backup');

      // Ensure we have a valid access token
      const validConfig = await this.ensureValidAccessToken(dropboxConfig);
      if (!validConfig) {
        console.error('Failed to obtain valid access token');
        return false;
      }

      // Call our Dropbox backup edge function
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          userId,
          format,
          dropboxPath: validConfig.dropbox_path,
          dropboxToken: validConfig.dropbox_token
        }
      });

      if (error) {
        console.error('Error calling dropbox-backup function:', error);
        return false;
      }

      console.log('Backup function response:', data);
      return data?.success || false;
    } catch (error) {
      console.error('Error in createDailyBackup:', error);
      return false;
    }
  },

  async setupAutomaticBackups(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      // Get Dropbox configuration from Supabase
      const dropboxConfig = await ApiService.getDropboxConfig();
      
      if (!dropboxConfig || !dropboxConfig.is_active || !dropboxConfig.refresh_token) {
        console.log('No active Dropbox configuration with refresh token found');
        return false;
      }

      // Update the config to enable daily backups
      await ApiService.saveDropboxConfig(
        dropboxConfig.dropbox_path,
        dropboxConfig.app_key,
        dropboxConfig.app_secret,
        dropboxConfig.refresh_token,
        dropboxConfig.dropbox_token,
        dropboxConfig.access_token_expires_at,
        true
      );

      console.log('Automatic daily backups enabled for user:', user.id);
      console.log('Backups will run automatically every day at 2:00 AM UTC');
      return true;
    } catch (error) {
      console.error('Error setting up automatic backups:', error);
      return false;
    }
  },

  async ensureValidAccessToken(config: any): Promise<any> {
    try {
      // Check if access token is expired or will expire soon (within 1 hour)
      const now = new Date();
      const expiresAt = new Date(config.access_token_expires_at);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      if (expiresAt > oneHourFromNow) {
        // Token is still valid
        return config;
      }

      console.log('Access token expired or expiring soon, refreshing...');

      // Refresh the access token
      const refreshedTokens = await ApiService.refreshDropboxToken(
        config.refresh_token,
        config.app_key,
        config.app_secret
      );

      // Calculate new expiration time
      const newExpiresAt = new Date(now.getTime() + (refreshedTokens.expires_in * 1000));

      // Save the new tokens
      const updatedConfig = await ApiService.saveDropboxConfig(
        config.dropbox_path,
        config.app_key,
        config.app_secret,
        config.refresh_token,
        refreshedTokens.access_token,
        newExpiresAt.toISOString(),
        config.daily_backup_enabled
      );

      console.log('Access token refreshed successfully');
      return updatedConfig;
    } catch (error) {
      console.error('Error ensuring valid access token:', error);
      return null;
    }
  },

  async testDropboxConnection(dropboxPath: string, dropboxToken: string): Promise<boolean> {
    try {
      console.log('Testing Dropbox connection...');
      
      // Basic validation
      if (!dropboxPath || !dropboxToken) {
        console.log('Missing path or token');
        return false;
      }

      // Validate path format (should start with /)
      if (!dropboxPath.startsWith('/')) {
        console.log('Invalid path format');
        return false;
      }

      // Test the connection via edge function
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          action: 'test_connection',
          dropboxPath,
          dropboxToken
        }
      });

      if (error) {
        console.error('Error testing Dropbox connection:', error);
        return false;
      }

      console.log('Dropbox connection test result:', data);
      return data?.success || false;
    } catch (error) {
      console.error('Error testing Dropbox connection:', error);
      return false;
    }
  },

  generateDropboxAuthUrl(appKey: string): string {
    const baseUrl = 'https://www.dropbox.com/oauth2/authorize';
    const params = new URLSearchParams({
      client_id: appKey,
      token_access_type: 'offline',
      response_type: 'code'
    });
    
    return `${baseUrl}?${params.toString()}`;
  }
};
