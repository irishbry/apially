
import { supabase } from '@/integrations/supabase/client';
import { ApiService } from './ApiService';

export const DropboxBackupService = {
  async createDailyBackup(userId: string, format: 'csv' | 'json' = 'csv'): Promise<boolean> {
    try {
      console.log('Creating daily backup for user:', userId);
      
      // Check if user has configured Dropbox link
      const dropboxLink = ApiService.getDropboxLink();
      
      if (!dropboxLink) {
        console.log('No Dropbox link configured, skipping backup');
        return false;
      }

      console.log('Dropbox link found, proceeding with backup');

      // Call our new Dropbox backup edge function
      const { data, error } = await supabase.functions.invoke('dropbox-backup', {
        body: {
          userId,
          format,
          dropboxLink
        }
      });

      if (error) {
        console.error('Error calling dropbox-backup function:', error);
        return false;
      }

      console.log('Backup function response:', data);
      return true;
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
      
      if (!dropboxLink) {
        console.log('No Dropbox link configured');
        return false;
      }

      // Here we would set up the automatic backup schedule
      // For now, we'll just return success
      console.log('Automatic backups would be set up for user:', user.id);
      return true;
    } catch (error) {
      console.error('Error setting up automatic backups:', error);
      return false;
    }
  },

  async testDropboxConnection(dropboxLink: string): Promise<boolean> {
    try {
      // Basic validation of Dropbox link format
      if (!dropboxLink.includes('dropbox.com')) {
        return false;
      }

      // For a shared folder link, it should contain certain patterns
      if (dropboxLink.includes('/scl/fo/') || dropboxLink.includes('/sh/')) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error testing Dropbox connection:', error);
      return false;
    }
  }
};
