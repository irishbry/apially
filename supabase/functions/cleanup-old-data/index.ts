import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const RETENTION_DAYS = 90;
const BATCH_SIZE = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    console.log(`Cleaning up data older than ${cutoffISO} (${RETENTION_DAYS} days)`);

    const results = {
      dataEntries: { deleted: 0, storageFilesRemoved: 0, errors: [] as string[] },
      backupLogs: { deleted: 0, storageFilesRemoved: 0, errors: [] as string[] },
    };

    // --- Clean up old data_entries and source-data storage ---
    let hasMore = true;
    while (hasMore) {
      const { data: oldEntries, error: fetchError } = await supabase
        .from('data_entries')
        .select('id, file_path')
        .lt('created_at', cutoffISO)
        .limit(BATCH_SIZE);

      if (fetchError) {
        console.error('Error fetching old data entries:', fetchError);
        results.dataEntries.errors.push(fetchError.message);
        break;
      }

      if (!oldEntries || oldEntries.length === 0) {
        hasMore = false;
        break;
      }

      // Delete storage files
      const filePaths = oldEntries.map(e => e.file_path).filter(Boolean);
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('source-data')
          .remove(filePaths);

        if (storageError) {
          console.error('Error removing source-data files:', storageError);
          results.dataEntries.errors.push(storageError.message);
        } else {
          results.dataEntries.storageFilesRemoved += filePaths.length;
        }
      }

      // Delete DB records
      const ids = oldEntries.map(e => e.id);
      const { error: deleteError } = await supabase
        .from('data_entries')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error('Error deleting data entries:', deleteError);
        results.dataEntries.errors.push(deleteError.message);
        break;
      }

      results.dataEntries.deleted += oldEntries.length;

      if (oldEntries.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    // --- Clean up old backup_logs and backup-files storage ---
    hasMore = true;
    while (hasMore) {
      const { data: oldLogs, error: fetchError } = await supabase
        .from('backup_logs')
        .select('id, storage_path')
        .lt('created_at', cutoffISO)
        .limit(BATCH_SIZE);

      if (fetchError) {
        console.error('Error fetching old backup logs:', fetchError);
        results.backupLogs.errors.push(fetchError.message);
        break;
      }

      if (!oldLogs || oldLogs.length === 0) {
        hasMore = false;
        break;
      }

      // Delete storage files
      const storagePaths = oldLogs.map(l => l.storage_path).filter(Boolean);
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('backup-files')
          .remove(storagePaths);

        if (storageError) {
          console.error('Error removing backup files:', storageError);
          results.backupLogs.errors.push(storageError.message);
        } else {
          results.backupLogs.storageFilesRemoved += storagePaths.length;
        }
      }

      // Delete DB records
      const ids = oldLogs.map(l => l.id);
      const { error: deleteError } = await supabase
        .from('backup_logs')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error('Error deleting backup logs:', deleteError);
        results.backupLogs.errors.push(deleteError.message);
        break;
      }

      results.backupLogs.deleted += oldLogs.length;

      if (oldLogs.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    // --- Clean up old backup_attempts ---
    const { error: attemptsError, count } = await supabase
      .from('backup_attempts')
      .delete()
      .lt('created_at', cutoffISO)
      .select('id', { count: 'exact', head: true });

    const summary = {
      success: true,
      message: `Cleanup complete. Removed ${results.dataEntries.deleted} data entries, ${results.backupLogs.deleted} backup logs.`,
      details: results,
      cutoffDate: cutoffISO,
      retentionDays: RETENTION_DAYS,
    };

    console.log('Cleanup summary:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
