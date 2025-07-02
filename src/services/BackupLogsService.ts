
import { supabase } from '@/integrations/supabase/client';

export interface BackupLog {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  dropbox_url?: string;
  file_size?: number;
  record_count: number;
  backup_type: 'manual' | 'scheduled';
  format: 'csv' | 'json';
  status: 'completed' | 'failed' | 'processing';
  created_at: string;
  updated_at: string;
}

export const BackupLogsService = {
  async getBackupLogs(): Promise<BackupLog[]> {
    try {
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching backup logs:', error);
        throw error;
      }

      // Cast the data to match our interface types
      return (data || []).map(log => ({
        ...log,
        backup_type: log.backup_type as 'manual' | 'scheduled',
        format: log.format as 'csv' | 'json',
        status: log.status as 'completed' | 'failed' | 'processing'
      }));
    } catch (error) {
      console.error('Error in getBackupLogs:', error);
      throw error;
    }
  },

  async deleteBackupLog(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('backup_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting backup log:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteBackupLog:', error);
      throw error;
    }
  },

  subscribeToBackupLogs(callback: (logs: BackupLog[]) => void) {
    const channel = supabase
      .channel('backup-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'backup_logs'
        },
        async () => {
          try {
            const logs = await this.getBackupLogs();
            callback(logs);
          } catch (error) {
            console.error('Error fetching updated backup logs:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
