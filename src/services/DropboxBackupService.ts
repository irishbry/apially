
import { supabase } from '@/integrations/supabase/client';
import { ApiService } from './ApiService';

export const DropboxBackupService = {
  async createDailyBackup(userId: string, format: 'csv' | 'json' = 'csv'): Promise<boolean> {
    try {
      console.log('Creating daily backup for user:', userId);
      
      // Check if user has configured Dropbox
      const dropboxLink = ApiService.getDropboxLink();
      const dropboxToken = ApiService.getDropboxToken();
      
      if (!dropboxLink || !dropboxToken) {
        console.log('No Dropbox configuration found, skipping backup');
        return false;
      }

      console.log('Dropbox configuration found, proceeding with backup');

      // Call our Dropbox backup edge function
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          userId,
          format,
          dropboxPath: dropboxLink,
          dropboxToken
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

      // Check if user has Dropbox configured
      const dropboxLink = ApiService.getDropboxLink();
      const dropboxToken = ApiService.getDropboxToken();
      
      if (!dropboxLink || !dropboxToken) {
        console.log('No Dropbox configuration found');
        return false;
      }

      // Create a cron job for daily backups
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          userId: user.id,
          action: 'setup_daily',
          dropboxPath: dropboxLink,
          dropboxToken
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
      // Basic validation
      if (!dropboxPath || !dropboxToken) {
        return false;
      }

      // Validate token format (Dropbox tokens typically start with 'sl.')
      if (!dropboxToken.startsWith('sl.') && !dropboxToken.startsWith('aal')) {
        return false;
      }

      // Validate path format (should start with /)
      if (!dropboxPath.startsWith('/')) {
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

      return data?.success || false;
    } catch (error) {
      console.error('Error testing Dropbox connection:', error);
      return false;
    }
  }
};
