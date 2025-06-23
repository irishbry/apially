
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

      // Call our Dropbox backup edge function
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          userId,
          format,
          dropboxPath: dropboxConfig.dropbox_path,
          dropboxToken: dropboxConfig.dropbox_token
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
      await ApiService.saveDropboxConfig(
        dropboxConfig.dropbox_path,
        dropboxConfig.dropbox_token,
        true
      );

      // Create a cron job for daily backups
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          userId: user.id,
          action: 'setup_daily',
          dropboxPath: dropboxConfig.dropbox_path,
          dropboxToken: dropboxConfig.dropbox_token
        }
      });

      if (error) {
        console.error('Error setting up automatic backups:', error);
        return false;
      }

      console.log('Automatic backups set up successfully for user:', user.id);
      return data?.success || false;
    } catch (error) {
      console.error('Error setting up automatic backups:', error);
      return false;
    }
  },

  async testDropboxConnection(dropboxPath: string, dropboxToken: string): Promise<boolean> {
    try {
      console.log('Testing Dropbox connection...', { dropboxPath: dropboxPath.substring(0, 10) + '...' });
      
      // Basic validation
      if (!dropboxPath || !dropboxToken) {
        console.log('Missing path or token');
        return false;
      }

      // Validate token format (Dropbox tokens typically start with 'sl.' or 'aal')
      if (!dropboxToken.startsWith('sl.') && !dropboxToken.startsWith('aal')) {
        console.log('Invalid token format');
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
  }
};
