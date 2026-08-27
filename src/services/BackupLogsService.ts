
import { supabase } from '@/integrations/supabase/client';

export interface BackupLog {
  id: string;
  user_id: string;
  file_name: string | null;
  file_path: string | null;
  source_id?: string | null;
  backup_date?: string | null;
  error_message?: string | null;
  dropbox_url?: string;
  storage_path?: string;
  file_size?: number;
  record_count: number;
  backup_type: 'manual' | 'scheduled';
  format: 'csv' | 'json';
  status: 'completed' | 'failed' | 'processing';
  created_at: string;
  updated_at: string;
}

export interface BackupSource {
  id: string;
  name: string;
  active: boolean;
  is_partner: boolean;
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

  async getBackupSources(): Promise<BackupSource[]> {
    const { data, error } = await supabase
      .from('sources')
      .select('id, name, active, is_partner')
      .eq('is_partner', false)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getSourceRecordCounts(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('source_record_counts')
        .select('source_id, record_count');
      if (error) throw error;
      return (data || []).reduce((acc, row) => {
        acc[row.source_id] = Number(row.record_count || 0);
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('Error fetching source record counts:', error);
      return {};
    }
  },

  async deleteBackupLog(id: string): Promise<void> {
    try {
      // First get the log to find the storage path
      const { data: log, error: fetchError } = await supabase
        .from('backup_logs')
        .select('storage_path')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching backup log for deletion:', fetchError);
        throw fetchError;
      }

      // Delete the file from storage if it exists
      if (log?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('backup-files')
          .remove([log.storage_path]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with log deletion even if storage deletion fails
        }
      }

      // Delete the log record
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

  async getDownloadUrl(storagePath: string): Promise<string | null> {
    try {
      // Since backup-files bucket is public, use public URL instead of signed URL
      const { data } = supabase.storage
        .from('backup-files')
        .getPublicUrl(storagePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error in getDownloadUrl:', error);
      return null;
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
