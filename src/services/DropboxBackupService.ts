
import { supabase } from '@/integrations/supabase/client';
import { ApiService } from './ApiService';
import { DropboxOAuthService } from './DropboxOAuthService';

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

      // Call our Dropbox backup edge function
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          userId,
          format,
          dropboxPath: dropboxConfig.dropbox_path,
          // Don't pass tokens here - let the edge function handle token refresh
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
      
      if (!dropboxConfig || !dropboxConfig.is_active) {
        console.log('No active Dropbox configuration found');
        return false;
      }

      // Update the config to enable daily backups
      await ApiService.updateDropboxConfig({
        ...dropboxConfig,
        daily_backup_enabled: true
      });

      console.log('Automatic daily backups enabled for user:', user.id);
      console.log('Backups will run automatically every day at 2:00 AM UTC');
      return true;
    } catch (error) {
      console.error('Error setting up automatic backups:', error);
      return false;
    }
  },

  async testDropboxConnection(dropboxPath: string): Promise<boolean> {
    try {
      console.log('Testing Dropbox connection...');
      
      // Basic validation
      if (!dropboxPath) {
        console.log('Missing path');
        return false;
      }

      // Validate path format (should start with /)
      if (!dropboxPath.startsWith('/')) {
        console.log('Invalid path format');
        return false;
      }

      // Test the connection via edge function (it will handle token refresh)
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          action: 'test_connection',
          dropboxPath
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

  async initiateOAuthFlow(appKey: string): Promise<string> {
    const redirectUri = `${window.location.origin}/dropbox-oauth-callback`;
    return DropboxOAuthService.generateAuthUrl(appKey, redirectUri);
  },

  async handleOAuthCallback(code: string, appKey: string, appSecret: string): Promise<boolean> {
    try {
      const redirectUri = `${window.location.origin}/dropbox-oauth-callback`;
      const tokens = await DropboxOAuthService.exchangeCodeForTokens(appKey, appSecret, code, redirectUri);
      
      if (!tokens) {
        return false;
      }

      // Save the OAuth credentials
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
      
      await ApiService.saveDropboxOAuthConfig({
        app_key: appKey,
        app_secret: appSecret,
        refresh_token: tokens.refresh_token || '',
        access_token: tokens.access_token,
        token_expires_at: expiresAt.toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return false;
    }
  }
};
