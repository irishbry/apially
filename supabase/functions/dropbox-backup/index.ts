import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { toZonedTime, fromZonedTime, format } from "https://esm.sh/date-fns-tz@3.0.0";
import {
  addCsvColumns,
  dropboxPath as buildDropboxPath,
  DropboxUploadSession,
  orderCsvColumns,
  serializeCsvHeader,
  serializeCsvRows,
} from './csv-stream.ts';
import { createStageLogger } from './stage-metrics.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DataEntry {
  id: string;
  metadata: any;
  created_at: string;
  user_id: string;
  source_id?: string;
  timestamp?: string;
  sensor_id?: string;
  file_name?: string;
  file_path?: string;
  backed_up_dropbox?: boolean;
  last_dropbox_backup?: string;
  [key: string]: any;
}

interface Source {
  id: string;
  name: string;
  user_id: string;
  active?: boolean;
  is_partner?: boolean;
  schema?: {
    fieldTypes?: Record<string, unknown>;
    requiredFields?: string[];
  } | null;
}

interface DropboxConfig {
  id: string;
  user_id: string;
  dropbox_path: string;
  dropbox_token: string;
  app_key: string;
  app_secret: string;
  refresh_token: string;
  access_token_expires_at: string;
  is_active: boolean;
  daily_backup_enabled: boolean;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function to chunk array into smaller arrays
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Helper function to update records in chunks
async function updateRecordsInChunks(entryIds: string[], userId: string): Promise<{ success: boolean; updatedCount: number }> {
  const chunks = chunkArray(entryIds, 1000);
  let totalUpdated = 0;

  console.log(`Processing ${chunks.length} chunks of records for user ${userId}`);

  const PST_TIMEZONE = 'America/Los_Angeles';
  const nowPST = toZonedTime(new Date(), PST_TIMEZONE);
  const pstDateString = format(nowPST, 'yyyy-MM-dd');

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const { error: updateError } = await supabase
        .from('data_entries')
        .update({
          backed_up_dropbox: true,
          last_dropbox_backup: pstDateString,
        })
        .in('id', chunk);

      if (updateError) {
        console.error(`Error updating chunk ${i + 1}:`, updateError);
      } else {
        totalUpdated += chunk.length;
      }
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
    }
  }

  console.log(`Total records updated across all chunks: ${totalUpdated} out of ${entryIds.length}`);
  return { success: totalUpdated > 0, updatedCount: totalUpdated };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting Dropbox backup process...');

  try {
    const { userId, format: exportFormat = 'csv', dropboxPath, dropboxToken, action = 'backup', sourceId, pstDate, limit } = await req.json();

    // Handle different actions
    if (action === 'test_connection') {
      return await testDropboxConnection(dropboxPath, dropboxToken);
    }

    // Rebuild missing Dropbox share links / Storage copies for completed backups
    if (action === 'repair_links') {
      if (!userId) {
        return new Response(JSON.stringify({ success: false, error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log(`[repair_links] starting for user ${userId} with limit ${Number(limit) > 0 ? Number(limit) : 10}`);
      return await repairBackupLinks(userId, Number(limit) > 0 ? Number(limit) : 10);
    }


    if (action === 'scheduled_backup') {
      return await processScheduledBackups();
    }

    // Scheduled source jobs use the same bounded single-source path as manual
    // retries, rather than keeping one function alive for every source.
    if (action === 'recreate_backup' || action === 'scheduled_source_backup') {
      if (!userId || !sourceId || !pstDate) {
        return new Response(JSON.stringify({ error: 'userId, sourceId, and pstDate are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return await processRecreateBackup(userId, sourceId, pstDate, exportFormat);
    }

    // Individual backup - userId is optional now
    if (userId) {
      return await processIndividualBackup(userId, exportFormat, dropboxPath, dropboxToken);
    } else {
      return new Response(JSON.stringify({ error: 'User ID is required for individual backups' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in dropbox-backup function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function ensureValidAccessToken(config: DropboxConfig): Promise<DropboxConfig | null> {
  try {
    // Check if access token is expired or will expire soon (within 2 hours for safety)
    const now = new Date();
    const expiresAt = new Date(config.access_token_expires_at);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (expiresAt > twoHoursFromNow) {
      // Token is still valid
      console.log(`Access token is still valid until ${expiresAt.toISOString()}`);
      return config;
    }

    console.log(`Access token expired or expiring soon (expires: ${expiresAt.toISOString()}), refreshing...`);

    // Refresh the access token
    const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
    const credentials = btoa(`${config.app_key}:${config.app_secret}`);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: config.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', response.status, errorText);
      return null;
    }

    const tokenData = await response.json();
    console.log('Token refresh successful');

    // Calculate new expiration time
    const newExpiresAt = new Date(now.getTime() + (tokenData.expires_in * 1000));

    // Update the config in database
    const { data: updatedConfig, error } = await supabase
      .from('dropbox_configs')
      .update({
        dropbox_token: tokenData.access_token,
        access_token_expires_at: newExpiresAt.toISOString()
      })
      .eq('id', config.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating refreshed token:', error);
      return null;
    }

    console.log('Access token refreshed successfully');
    return updatedConfig;
  } catch (error) {
    console.error('Error ensuring valid access token:', error);
    
    // Log token refresh failure using PST date
    try {
      const PST_TIMEZONE = 'America/Los_Angeles';
      const nowPST = toZonedTime(new Date(), PST_TIMEZONE);
      const pstDateString = format(nowPST, 'yyyy-MM-dd');
      
      await supabase
        .from('backup_attempts')
        .insert({
          user_id: config.user_id,
          attempt_date: pstDateString,
          status: 'token_expired',
          error_message: `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    } catch (logError) {
      console.error('Failed to log token refresh failure:', logError);
    }
    
    return null;
  }
}

async function processIndividualBackup(
  userId: string, 
  exportFormat: string, 
  dropboxPath?: string, 
  dropboxToken?: string
): Promise<Response> {
  console.log(`Processing individual backup for user: ${userId}`);

  // Get user's Dropbox config from database if not provided
  let finalDropboxPath = dropboxPath;
  let finalDropboxToken = dropboxToken;

  if (!finalDropboxPath || !finalDropboxToken) {
    const { data: config, error: configError } = await supabase
      .from('dropbox_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'No active Dropbox configuration found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure we have a valid access token
    const validConfig = await ensureValidAccessToken(config);
    if (!validConfig) {
      return new Response(JSON.stringify({ error: 'Failed to obtain valid access token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    finalDropboxPath = validConfig.dropbox_path;
    finalDropboxToken = validConfig.dropbox_token;
  }

  const result = await createBackupForUser(userId, exportFormat, finalDropboxPath, finalDropboxToken, 'manual');
  
  if (result.success) {
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Backup uploaded to Dropbox and Supabase Storage successfully',
        fileName: result.fileName,
        path: result.path,
        backedUpCount: result.backedUpCount,
        backupLogId: result.backupLogId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } else {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: result.error || 'Failed to upload backup'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function processRecreateBackup(
  userId: string,
  sourceId: string,
  pstDate: string,
  exportFormat: string
): Promise<Response> {
  try {
    console.log(`Recreating backup for user ${userId}, source ${sourceId}, PST date ${pstDate}`);

    const PST_TIMEZONE = 'America/Los_Angeles';
    const [y, m, d] = pstDate.split('-').map(Number);
    const startOfDayPST = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endOfDayPST = new Date(y, m - 1, d, 23, 59, 59, 999);
    const startUTC = fromZonedTime(startOfDayPST, PST_TIMEZONE);
    const endUTC = fromZonedTime(endOfDayPST, PST_TIMEZONE);

    // Fetch source metadata + full user sources list (needed by CSV generator)
    const { data: sourcesData } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', userId);
    const sources = sourcesData || [];
    const source = sources.find(s => s.id === sourceId);
    if (!source) {
      return new Response(JSON.stringify({ error: 'Source not found for this user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: config } = await supabase
      .from('dropbox_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!config) {
      return new Response(JSON.stringify({ success: false, error: 'No active Dropbox configuration found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const validConfig = await ensureValidAccessToken(config as DropboxConfig);
    if (!validConfig) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to obtain valid Dropbox access token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const options: SourceBackupOptions = {
      userId,
      source,
      sources: sources as Source[],
      startUtc: startUTC.toISOString(),
      endUtc: endUTC.toISOString(),
      dateString: pstDate,
      backupType: 'scheduled',
      dropboxPath: validConfig.dropbox_path,
      dropboxToken: validConfig.dropbox_token,
    };
    options.backupLogId = await createSourceBackupPlaceholder(options, exportFormat);
    const result = exportFormat === 'csv'
      ? await streamCsvBackupForSource(options)
      : await createBufferedBackupForSource({ ...options, exportFormat });

    if (result.skipped) {
      return new Response(JSON.stringify({ success: false, error: 'No data found for this source on this date' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        fileName: result.fileName,
        recordCount: result.recordCount,
        backupLogId: result.backupLogId,
        error: result.error,
      }),
      { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('processRecreateBackup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function processScheduledBackups(): Promise<Response> {
  try {
    console.log('Processing scheduled backups for all users...');
    
    // Get all users with valid Dropbox configurations and daily backup enabled
    const { data: configs, error } = await supabase
      .from('dropbox_configs')
      .select('*')
      .eq('is_active', true)
      .eq('daily_backup_enabled', true);

    if (error) {
      console.error('Error fetching backup configs:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch backup configurations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!configs || configs.length === 0) {
      console.log('No users with daily backup enabled found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users with daily backup enabled found',
          processedCount: 0,
          successCount: 0,
          errorCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    console.log(`Found ${configs.length} users with daily backup enabled`);

    // Process each user's backup
    for (const config of configs) {
      try {
        console.log(`Processing backup for user: ${config.user_id}`);
        
        // Ensure we have a valid access token
        const validConfig = await ensureValidAccessToken(config);
        if (!validConfig) {
          console.error(`Failed to obtain valid access token for user ${config.user_id}`);
          errorCount++;
          results.push({
            userId: config.user_id,
            success: false,
            error: 'Failed to obtain valid access token'
          });
          continue;
        }

        // Test Dropbox connection first
        const connectionValid = await testDropboxConnectionInternal(validConfig.dropbox_path, validConfig.dropbox_token);
        if (!connectionValid) {
          console.error(`Dropbox connection failed for user ${config.user_id}`);
          errorCount++;
          results.push({
            userId: config.user_id,
            success: false,
            error: 'Dropbox connection failed'
          });
          continue;
        }

        // Create backup for user
        const result = await createBackupForUser(config.user_id, 'csv', validConfig.dropbox_path, validConfig.dropbox_token, 'scheduled');

        if (result.success) {
          successCount++;
          console.log(`Backup successful for user: ${config.user_id}, backed up ${result.backedUpCount} entries`);
          results.push({
            userId: config.user_id,
            success: true,
            fileName: result.fileName,
            path: result.path,
            backedUpCount: result.backedUpCount,
            backupLogId: result.backupLogId
          });
        } else {
          errorCount++;
          console.error(`Backup failed for user: ${config.user_id} - ${result.error}`);
          results.push({
            userId: config.user_id,
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error(`Error processing backup for user ${config.user_id}:`, error);
        errorCount++;
        results.push({
          userId: config.user_id,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${configs.length} backups. ${successCount} successful, ${errorCount} failed.`,
        processedCount: configs.length,
        successCount,
        errorCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing scheduled backups:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process scheduled backups' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function createBackupForUser(
  userId: string, 
  exportFormat: string, 
  dropboxPath: string, 
  dropboxToken: string,
  backupType: string = 'manual'
): Promise<{ success: boolean; fileName?: string; path?: string; error?: string; backedUpCount?: number; backupLogId?: string }> {
  try {
    console.log(`Starting backup for user: ${userId}, type: ${backupType}`);
    console.log(`Dropbox config - Path: ${dropboxPath}, Token present: ${!!dropboxToken}`);
    
    // Log backup attempt first using PST date
    let attemptId: string | null = null;
    try {
      const PST_TIMEZONE = 'America/Los_Angeles';
      const nowPST = toZonedTime(new Date(), PST_TIMEZONE);
      const pstDateString = format(nowPST, 'yyyy-MM-dd');
      
      const { data: attemptData } = await supabase
        .from('backup_attempts')
        .insert({
          user_id: userId,
          attempt_date: pstDateString,
          status: 'attempting'
        })
        .select('id')
        .single();
      
      attemptId = attemptData?.id || null;
    } catch (logError) {
      console.warn('Failed to log backup attempt:', logError);
    }
    
    // Calculate PST date range for data filtering
    const PST_TIMEZONE = 'America/Los_Angeles';
    const now = new Date();
    const nowPST = toZonedTime(now, PST_TIMEZONE);
    
    // Get the previous day in PST
    const previousDayPST = new Date(nowPST);
    previousDayPST.setDate(previousDayPST.getDate() - 1);
    
    // Create start and end of the previous day in PST
    const startOfDayPST = new Date(previousDayPST);
    startOfDayPST.setHours(0, 0, 0, 0);
    
    const endOfDayPST = new Date(previousDayPST);
    endOfDayPST.setHours(23, 59, 59, 999);
    
    // Convert PST times back to UTC for database query
    const startOfDayUTC = fromZonedTime(startOfDayPST, PST_TIMEZONE);
    const endOfDayUTC = fromZonedTime(endOfDayPST, PST_TIMEZONE);
    
    console.log(`Filtering data for PST date range: ${format(previousDayPST, 'yyyy-MM-dd')} PST`);
    console.log(`UTC range: ${startOfDayUTC.toISOString()} to ${endOfDayUTC.toISOString()}`);
    
    // Get user's sources
    const { data: sourcesData } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', userId);

    const sources = sourcesData || [];

    // Step 1: Determine which sources to back up.
    // Use the already-fetched sources list (all user sources) instead of a
    // capped select on data_entries — that select hit the default 1000-row
    // limit on high-volume days and silently dropped some source_ids.
    // Helper to finalize the attempt row on early returns
    const finalizeAttempt = async (status: string, errorMsg: string | null = null) => {
      if (!attemptId) return;
      try {
        await supabase
          .from('backup_attempts')
          .update({ status, error_message: errorMsg })
          .eq('id', attemptId);
      } catch (e) {
        console.warn('Failed to finalize backup attempt:', e);
      }
    };

    const uniqueSourceIds = sources.map(s => s.id);
    console.log(`Considering ${uniqueSourceIds.length} sources for user ${userId}`);

    if (uniqueSourceIds.length === 0) {
      console.log(`No sources found for user ${userId}`);
      await finalizeAttempt('success', 'No sources configured');
      return { success: true, fileName: '', path: '', backedUpCount: 0 };
    }

    // Test Dropbox once before opening per-source upload sessions.
    console.log('Testing Dropbox connection before upload...');
    const connectionValid = await testDropboxConnectionInternal(dropboxPath, dropboxToken);
    if (!connectionValid) {
      console.error('Dropbox connection test failed before upload');
      await finalizeAttempt('failed', 'Dropbox connection failed');
      return { success: false, error: 'Dropbox connection failed' };
    }

    let totalBackedUpCount = 0;
    const successfulSourceIds: string[] = [];
    const backupResults: Array<{
      sourceId: string;
      success: boolean;
      fileName?: string;
      backupLogId?: string;
      error?: string;
    }> = [];

    const dateString = format(previousDayPST, 'yyyy-MM-dd');
    const eligibleSources = sources.filter(source => !source.is_partner);
    const placeholderRows = eligibleSources.map(source => ({
      user_id: userId,
      source_id: source.id,
      file_name: null,
      file_path: null,
      record_count: 0,
      backup_type: backupType,
      backup_date: dateString,
      format: exportFormat === 'csv' ? 'csv' : 'json',
      status: 'processing',
      file_size: 0,
      error_message: source.active === false
        ? 'Source is paused, so its data is excluded from backups.'
        : 'Waiting for this source to begin.',
    }));
    const { data: placeholders, error: placeholderError } = await supabase
      .from('backup_logs')
      .insert(placeholderRows)
      .select('id, source_id');
    if (placeholderError) throw new Error(`Unable to initialize source backup logs: ${placeholderError.message}`);
    const placeholderBySource = new Map((placeholders ?? []).map(row => [row.source_id, row.id]));

    for (const source of eligibleSources) {
      const backupLogId = placeholderBySource.get(source.id) ?? null;
      try {
        const result = exportFormat === 'csv'
          ? await streamCsvBackupForSource({
              userId,
              source,
              sources,
              startUtc: startOfDayUTC.toISOString(),
              endUtc: endOfDayUTC.toISOString(),
              dateString,
              backupType,
              dropboxPath,
              dropboxToken,
              backupLogId,
            })
          : await createBufferedBackupForSource({
              userId,
              source,
              sources,
              startUtc: startOfDayUTC.toISOString(),
              endUtc: endOfDayUTC.toISOString(),
              dateString,
              backupType,
              exportFormat,
              dropboxPath,
              dropboxToken,
              backupLogId,
            });

        if (result.skipped) {
          await updateBackupLog(backupLogId, {
            status: 'failed',
            error_message: source.active === false
              ? 'Source is paused, so its data is excluded from backups.'
              : `No eligible data was received for ${dateString}.`,
          });
          backupResults.push({
            sourceId: source.id,
            success: false,
            backupLogId: backupLogId ?? undefined,
            error: source.active === false ? 'Source is paused' : 'No eligible data for this date',
          });
          continue;
        }
        backupResults.push({ sourceId: source.id, ...result });
        if (result.success) {
          totalBackedUpCount += result.recordCount ?? 0;
          successfulSourceIds.push(source.id);
        }
      } catch (sourceError) {
        console.error(`Error processing backup for source ${source.id}:`, sourceError);
        const errorMessage = sourceError instanceof Error ? sourceError.message : 'Unknown error occurred';
        await updateBackupLog(backupLogId, { status: 'failed', error_message: errorMessage });
        backupResults.push({
          sourceId: source.id,
          success: false,
          backupLogId: backupLogId ?? undefined,
          error: errorMessage,
        });
      }
    }

    if (backupResults.length === 0) {
      await finalizeAttempt('success', 'No data to back up for this day');
      return { success: true, fileName: '', path: '', backedUpCount: 0 };
    }

    // Log overall attempt result - UPDATE the existing attempt record
    const successfulBackups = backupResults.filter(r => r.success).length;
    const failedBackups = backupResults.filter(r => !r.success).length;

    try {
      const finalStatus = successfulBackups > 0 ? 'success' : 'failed';
      const errorMsg = failedBackups > 0 ? `${failedBackups} source backups failed` : null;
      
      if (attemptId) {
        await supabase
          .from('backup_attempts')
          .update({
            status: finalStatus,
            error_message: errorMsg
          })
          .eq('id', attemptId);
      } else {
        // Fallback: insert if we don't have the attempt ID
        const PST_TIMEZONE = 'America/Los_Angeles';
        const nowPST = toZonedTime(new Date(), PST_TIMEZONE);
        const pstDateString = format(nowPST, 'yyyy-MM-dd');
        
        await supabase
          .from('backup_attempts')
          .insert({
            user_id: userId,
            attempt_date: pstDateString,
            status: finalStatus,
            error_message: errorMsg
          });
      }
    } catch (logError) {
      console.warn('Failed to log backup attempt result:', logError);
    }

    // Mark records only after the attempt is finalized. IDs are fetched and
    // updated one bounded page at a time so high-volume days stay memory-safe.
    for (const sourceId of successfulSourceIds) {
      try {
        await markSourceEntriesBackedUp(userId, sourceId, startOfDayUTC.toISOString(), endOfDayUTC.toISOString());
      } catch (markErr) {
        console.error(`Post-finalize record marking failed for source ${sourceId}:`, markErr);
      }
    }


    // Return consolidated results
    if (successfulBackups > 0) {
      console.log(`Backup completed: ${successfulBackups} sources successful, ${failedBackups} failed, ${totalBackedUpCount} total entries backed up`);
      return { 
        success: true, 
        fileName: `${successfulBackups} source backup files created`,
        path: dropboxPath,
        backedUpCount: totalBackedUpCount,
        backupLogId: backupResults.find(r => r.success)?.backupLogId
      };
    } else {
      console.error('All source backups failed');
      return { 
        success: false, 
        error: `All ${failedBackups} source backups failed`
      };
    }
  } catch (error) {
    console.error(`Error creating backup for user ${userId}:`, error);
    
    // Log failed attempt - UPDATE existing or insert new
    try {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      if (attemptId) {
        await supabase
          .from('backup_attempts')
          .update({ status: 'failed', error_message: errorMsg })
          .eq('id', attemptId);
      } else {
        const PST_TIMEZONE = 'America/Los_Angeles';
        const nowPST = toZonedTime(new Date(), PST_TIMEZONE);
        const pstDateString = format(nowPST, 'yyyy-MM-dd');
        
        await supabase
          .from('backup_attempts')
          .insert({
            user_id: userId,
            attempt_date: pstDateString,
            status: 'failed',
            error_message: errorMsg
          });
      }
    } catch (logError) {
      console.warn('Failed to log backup failure:', logError);
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

interface SourceBackupOptions {
  userId: string;
  source: Source & { is_partner?: boolean };
  sources: Source[];
  startUtc: string;
  endUtc: string;
  dateString: string;
  backupType: string;
  dropboxPath: string;
  dropboxToken: string;
  backupLogId?: string | null;
}

interface SourceBackupResult {
  success: boolean;
  skipped?: boolean;
  fileName?: string;
  backupLogId?: string;
  recordCount?: number;
  error?: string;
}

const BACKUP_PAGE_SIZE = 1000;

async function createSourceBackupPlaceholder(
  options: SourceBackupOptions,
  exportFormat: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('backup_logs')
    .insert({
      user_id: options.userId,
      source_id: options.source.id,
      file_name: null,
      file_path: null,
      record_count: 0,
      backup_type: options.backupType,
      backup_date: options.dateString,
      format: exportFormat === 'csv' ? 'csv' : 'json',
      status: 'processing',
      file_size: 0,
      error_message: 'Waiting for this source to begin.',
    })
    .select('id')
    .single();
  if (error) console.error(`Unable to create backup placeholder for ${options.source.id}:`, error);
  return data?.id ?? null;
}

function sourceFileName(sourceName: string, dateString: string, backupType: string, extension: string): string {
  const safeName = sourceName.replace(/[^a-zA-Z0-9]/g, '_');
  const typePrefix = backupType === 'scheduled' ? 'backup' : 'manual_backup';
  return `${typePrefix}_${dateString}_${safeName}.${extension}`;
}

function sourceEntriesQuery(options: SourceBackupOptions, select: string, offset: number) {
  return supabase
    .from('data_entries')
    .select(select)
    .eq('user_id', options.userId)
    .eq('source_id', options.source.id)
    .gte('created_at', options.startUtc)
    .lte('created_at', options.endUtc)
    .or('metadata->>paused.is.null,metadata->>paused.neq.true')
    .order('created_at', { ascending: false })
    .range(offset, offset + BACKUP_PAGE_SIZE - 1);
}

async function createBackupLog(
  options: SourceBackupOptions,
  fileName: string,
  recordCount: number,
): Promise<string | null> {
  const normalizedPath = options.dropboxPath.endsWith('/')
    ? options.dropboxPath.slice(0, -1)
    : options.dropboxPath;
  if (options.backupLogId) {
    const { error } = await supabase.from('backup_logs').update({
      file_name: fileName,
      file_path: `${normalizedPath}/${fileName}`,
      record_count: recordCount,
      backup_date: options.dateString,
      format: fileName.endsWith('.csv') ? 'csv' : 'json',
      status: 'processing',
      error_message: null,
    }).eq('id', options.backupLogId);
    if (error) console.error(`Unable to initialize backup log for ${options.source.id}:`, error);
    return options.backupLogId;
  }
  const { data, error } = await supabase
    .from('backup_logs')
    .insert({
      user_id: options.userId,
      source_id: options.source.id,
      file_name: fileName,
      file_path: `${normalizedPath}/${fileName}`,
      record_count: recordCount,
      backup_type: options.backupType,
      backup_date: options.dateString,
      format: fileName.endsWith('.csv') ? 'csv' : 'json',
      status: 'processing',
      file_size: 0,
    })
    .select('id')
    .single();
  if (error) console.error(`Unable to create backup log for ${options.source.id}:`, error);
  return data?.id ?? null;
}

async function updateBackupLog(
  backupLogId: string | null,
  values: Record<string, unknown>,
): Promise<void> {
  if (!backupLogId) return;
  const { error } = await supabase.from('backup_logs').update(values).eq('id', backupLogId);
  if (error) console.error(`Unable to update backup log ${backupLogId}:`, error);
}

async function getDropboxSharedLink(token: string, path: string): Promise<string | null> {
  const response = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, settings: { requested_visibility: 'public' } }),
  });
  if (response.ok) return (await response.json()).url ?? null;
  console.error(`Dropbox create_shared_link failed for ${path} (${response.status}):`, await response.text());

  // An overwritten file can already have a shared link; retrieve it rather than failing.
  const existing = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, direct_only: true }),
  });
  if (!existing.ok) {
    console.error(`Dropbox list_shared_links failed for ${path} (${existing.status}):`, await existing.text());
    return null;
  }
  const result = await existing.json();
  return result.links?.[0]?.url ?? null;
}


async function copyDropboxFileToStorage(
  token: string,
  dropboxFilePath: string,
  userId: string,
  fileName: string,
): Promise<{ success: boolean; path?: string }> {
  try {
    const temporaryLinkResponse = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dropboxFilePath }),
    });
    if (!temporaryLinkResponse.ok) throw new Error(await temporaryLinkResponse.text());
    const { link } = await temporaryLinkResponse.json();
    const downloadResponse = await fetch(link);
    if (!downloadResponse.ok || !downloadResponse.body) throw new Error(`Dropbox download failed (${downloadResponse.status})`);

    const storagePath = `${userId}/${fileName}`;
    const storageResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/backup-files/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`,
          apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          'Content-Type': 'text/csv',
          'x-upsert': 'true',
        },
        body: downloadResponse.body,
      },
    );
    if (!storageResponse.ok) throw new Error(await storageResponse.text());
    return { success: true, path: storagePath };
  } catch (error) {
    console.error(`Streaming copy to Supabase Storage failed for ${fileName}:`, error);
    return { success: false };
  }
}

/**
 * Backfill download links for completed backups whose Dropbox share link or
 * Storage copy failed during finalize. The CSV already lives in Dropbox, so we
 * only re-create the share link and copy the file into Supabase Storage.
 */
async function repairBackupLinks(userId: string, batchSize = 10): Promise<Response> {
  const { data: config } = await supabase
    .from('dropbox_configs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!config) {
    return new Response(JSON.stringify({ success: false, error: 'No active Dropbox configuration found' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const validConfig = await ensureValidAccessToken(config as DropboxConfig);
  if (!validConfig) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to obtain a valid Dropbox access token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: logs, error } = await supabase
    .from('backup_logs')
    .select('id, file_name, storage_path, dropbox_url')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('file_name', 'is', null)
    .or('storage_path.is.null,dropbox_url.is.null')
    .order('created_at', { ascending: false })
    .limit(batchSize);

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let repaired = 0;
  let failed = 0;
  const failures: string[] = [];
  const repairedFiles: string[] = [];

  console.log(`[repairBackupLinks] found ${logs?.length ?? 0} logs needing link repair`);

  for (const log of logs ?? []) {
    const fullPath = buildDropboxPath(validConfig.dropbox_path, log.file_name as string);
    console.log(`[repairBackupLinks] repairing ${log.file_name} at ${fullPath}`);
    try {
      const [dropboxUrl, storageResult] = await Promise.all([
        log.dropbox_url ? Promise.resolve(log.dropbox_url as string) : getDropboxSharedLink(validConfig.dropbox_token, fullPath),
        log.storage_path
          ? Promise.resolve({ success: true, path: log.storage_path as string })
          : copyDropboxFileToStorage(validConfig.dropbox_token, fullPath, userId, log.file_name as string),
      ]);

      if (!dropboxUrl && !storageResult.path) {
        console.warn(`[repairBackupLinks] no link or storage path produced for ${log.file_name}`);
        failed += 1;
        failures.push(log.file_name as string);
        continue;
      }

      await updateBackupLog(log.id as string, {
        dropbox_url: dropboxUrl,
        storage_path: storageResult.path ?? null,
      });
      console.log(`[repairBackupLinks] success for ${log.file_name}: dropbox_url=${!!dropboxUrl}, storage_path=${!!storageResult.path}`);
      repaired += 1;
      repairedFiles.push(log.file_name as string);
    } catch (repairError) {
      console.error(`Link repair failed for ${log.file_name}:`, repairError);
      failed += 1;
      failures.push(log.file_name as string);
    }
  }

  console.log(`[repairBackupLinks] batch complete: checked=${logs?.length ?? 0}, repaired=${repaired}, failed=${failed}`);

  return new Response(
    JSON.stringify({ success: true, checked: logs?.length ?? 0, repaired, failed, failures: failures.slice(0, 10), repairedFiles: repairedFiles.slice(0, 10) }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}



async function streamCsvBackupForSource(options: SourceBackupOptions): Promise<SourceBackupResult> {
  const columns = new Set<string>();
  let recordCount = 0;
  let pages = 0;
  const log = createStageLogger({
    runId: crypto.randomUUID(),
    userId: options.userId,
    sourceId: options.source.id,
    sourceName: options.source.name,
    dateString: options.dateString,
  });
  const declaredFields = new Set([
    ...Object.keys(options.source.schema?.fieldTypes ?? {}),
    ...(options.source.schema?.requiredFields ?? []),
  ]);
  declaredFields.forEach((field) => {
    if (field !== 'clientIp' && field !== 'receivedAt' && field !== 'paused') columns.add(field);
  });

  log.event('source', { schemaDeclaredFields: declaredFields.size, format: 'csv' });

  // Schema-defined sources already declare their CSV columns, avoiding a full
  // duplicate scan before upload. Legacy sources without a schema retain the
  // discovery pass so their historical CSV shape is unchanged.
  if (declaredFields.size === 0) {
    await log.time('scan', async () => {
      for (let offset = 0; ; offset += BACKUP_PAGE_SIZE) {
        const { data, error } = await sourceEntriesQuery(options, 'id, metadata', offset);
        if (error) throw new Error(`CSV schema fetch failed: ${error.message}`);
        const page = (data ?? []) as DataEntry[];
        if (page.length === 0) break;
        addCsvColumns(columns, page);
        recordCount += page.length;
        if (page.length < BACKUP_PAGE_SIZE) break;
      }
    }, () => ({ rows: recordCount, columns: columns.size }));
  } else {
    columns.add('source');
    columns.add('created_at');
  }

  const firstPageResult = declaredFields.size > 0
    ? await log.time('fetch', () => sourceEntriesQuery(options, '*', 0), () => ({ offset: 0 }))
    : null;
  if (firstPageResult?.error) throw new Error(`CSV data fetch failed: ${firstPageResult.error.message}`);
  const firstPage = (firstPageResult?.data ?? []) as DataEntry[];
  if (declaredFields.size > 0 && firstPage.length === 0 || declaredFields.size === 0 && recordCount === 0) {
    log.event('source', { skipped: true, reason: 'no eligible records' });
    await updateBackupLog(options.backupLogId ?? null, {
      status: 'failed',
      error_message: options.source.active === false
        ? 'Source is paused, so its data is excluded from backups.'
        : `No eligible data was received for ${options.dateString}.`,
    });
    return { success: true, skipped: true, backupLogId: options.backupLogId ?? undefined, recordCount: 0 };
  }

  const fileName = sourceFileName(options.source.name, options.dateString, options.backupType, 'csv');
  const backupLogId = await createBackupLog(options, fileName, recordCount);
  const sourceNames = new Map(options.sources.map((source) => [source.id, source.name]));
  const orderedColumns = orderCsvColumns(columns);
  const upload = new DropboxUploadSession(options.dropboxToken, options.dropboxPath, fileName);

  try {
    await log.time('upload', () => upload.start(), () => ({ phaseName: 'session_start', fileName }));
    await upload.append(serializeCsvHeader(orderedColumns));
    for (let offset = 0; ; offset += BACKUP_PAGE_SIZE) {
      const result = offset === 0 && firstPageResult
        ? firstPageResult
        : await log.time('fetch', () => sourceEntriesQuery(options, '*', offset), () => ({ offset }));
      const { data, error } = result;
      if (error) throw new Error(`CSV data fetch failed: ${error.message}`);
      const page = (data ?? []) as DataEntry[];
      if (page.length === 0) break;
      if (declaredFields.size > 0) recordCount += page.length;
      pages += 1;

      const csvStart = Date.now();
      const chunk = `\n${serializeCsvRows(page, orderedColumns, sourceNames)}`;
      const csvMs = Date.now() - csvStart;
      log.event('csv', { offset, rows: page.length, bytes: chunk.length, durationMs: csvMs });

      await log.time('upload', () => upload.append(chunk), () => ({
        phaseName: 'session_append',
        offset,
        rows: page.length,
        bytes: upload.byteCount,
      }));
      log.event('upload', {
        phaseName: 'progress',
        rows: recordCount,
        pages,
        bytes: upload.byteCount,
      });
      // Heartbeat the log row so the UI can show live progress and can tell a
      // still-running job apart from one that died mid-run (stale updated_at).
      await updateBackupLog(backupLogId, { file_size: upload.byteCount });
      if (page.length < BACKUP_PAGE_SIZE) break;

    }
    await log.time('upload', () => upload.finish(), () => ({
      phaseName: 'session_finish',
      rows: recordCount,
      bytes: upload.byteCount,
    }));

    const [dropboxUrl, storageResult] = await log.time('finalize', () => Promise.all([
      getDropboxSharedLink(options.dropboxToken, upload.fullPath),
      copyDropboxFileToStorage(options.dropboxToken, upload.fullPath, options.userId, fileName),
    ]), () => ({ fileName, bytes: upload.byteCount }));
    await updateBackupLog(backupLogId, {
      status: 'completed',
      record_count: recordCount,
      file_size: upload.byteCount,
      storage_path: storageResult.path ?? null,
      dropbox_url: dropboxUrl,
      error_message: !dropboxUrl && !storageResult.path
        ? 'File uploaded to Dropbox, but the download link could not be created (check Dropbox sharing permissions). Use "Restore download links" to retry.'
        : null,
    });
    log.event('source', {
      result: 'completed',
      rows: recordCount,
      pages,
      bytes: upload.byteCount,
      totalMs: log.elapsedMs(),
      stageMs: log.totals(),
    });
    return { success: true, fileName, backupLogId: backupLogId ?? undefined, recordCount };
  } catch (error) {
    log.fail('source', error, {
      result: 'failed',
      rows: recordCount,
      pages,
      bytes: upload.byteCount,
      totalMs: log.elapsedMs(),
      stageMs: log.totals(),
    });
    await updateBackupLog(backupLogId, {
      status: 'failed',
      file_size: upload.byteCount,
      error_message: error instanceof Error ? error.message : 'The CSV backup failed unexpectedly.',
    });
    throw error;
  }
}

async function createBufferedBackupForSource(
  options: SourceBackupOptions & { exportFormat: string },
): Promise<SourceBackupResult> {
  const entries: DataEntry[] = [];
  const log = createStageLogger({
    runId: crypto.randomUUID(),
    userId: options.userId,
    sourceId: options.source.id,
    sourceName: options.source.name,
    dateString: options.dateString,
  });
  log.event('source', { format: options.exportFormat });

  await log.time('scan', async () => {
    for (let offset = 0; ; offset += BACKUP_PAGE_SIZE) {
      const { data, error } = await sourceEntriesQuery(options, '*', offset);
      if (error) throw new Error(`JSON data fetch failed: ${error.message}`);
      const page = (data ?? []) as DataEntry[];
      if (page.length === 0) break;
      entries.push(...page);
      if (page.length < BACKUP_PAGE_SIZE) break;
    }
  }, () => ({ rows: entries.length }));

  if (entries.length === 0) {
    log.event('source', { skipped: true, reason: 'no eligible records' });
    await updateBackupLog(options.backupLogId ?? null, {
      status: 'failed',
      error_message: options.source.active === false
        ? 'Source is paused, so its data is excluded from backups.'
        : `No eligible data was received for ${options.dateString}.`,
    });
    return { success: true, skipped: true, backupLogId: options.backupLogId ?? undefined, recordCount: 0 };
  }

  const fileName = sourceFileName(options.source.name, options.dateString, options.backupType, options.exportFormat);
  const content = await log.time('csv', async () => generateDataExplorerJSON(entries, options.sources),
    () => ({ rows: entries.length }));
  const backupLogId = await createBackupLog(options, fileName, entries.length);
  const [storageResult, dropboxResult] = await log.time('upload', () => Promise.all([
    uploadToSupabaseStorage(fileName, content, options.userId),
    uploadToDropbox(options.dropboxToken, options.dropboxPath, fileName, content),
  ]), () => ({ fileName, bytes: content.length }));
  const success = storageResult.success || dropboxResult.success;
  await updateBackupLog(backupLogId, {
    status: success ? 'completed' : 'failed',
    error_message: success ? null : 'Neither Dropbox nor Supabase Storage accepted the backup file.',
    file_size: new TextEncoder().encode(content).byteLength,
    storage_path: storageResult.path ?? null,
    dropbox_url: dropboxResult.dropboxUrl ?? null,
  });
  log.event('source', {
    result: success ? 'completed' : 'failed',
    rows: entries.length,
    bytes: content.length,
    totalMs: log.elapsedMs(),
    stageMs: log.totals(),
  });
  return { success, fileName, backupLogId: backupLogId ?? undefined, recordCount: entries.length };
}

async function markSourceEntriesBackedUp(
  userId: string,
  sourceId: string,
  startUtc: string,
  endUtc: string,
): Promise<void> {
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('data_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('source_id', sourceId)
      .gte('created_at', startUtc)
      .lte('created_at', endUtc)
      .or('metadata->>paused.is.null,metadata->>paused.neq.true')
      .order('created_at', { ascending: false })
      .range(offset, offset + BACKUP_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((entry) => entry.id);
    if (ids.length === 0) break;
    await updateRecordsInChunks(ids, userId);
    if (ids.length < BACKUP_PAGE_SIZE) break;
    offset += BACKUP_PAGE_SIZE;
  }
}

async function uploadToSupabaseStorage(fileName: string, content: string, userId: string): Promise<{ success: boolean; path?: string }> {
  try {
    console.log(`Uploading ${fileName} to Supabase Storage...`);
    
    // Create a unique path for the file
    const filePath = `${userId}/${fileName}`;
    
    // Convert string content to Uint8Array
    const fileData = new TextEncoder().encode(content);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('backup-files')
      .upload(filePath, fileData, {
        contentType: fileName.endsWith('.csv') ? 'text/csv' : 'application/json',
        upsert: true
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return { success: false };
    }

    console.log('Supabase Storage upload successful:', data);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error);
    return { success: false };
  }
}

async function testDropboxConnection(dropboxPath: string, dropboxToken: string): Promise<Response> {
  try {
    console.log('Testing Dropbox connection...');
    
    const isValid = await testDropboxConnectionInternal(dropboxPath, dropboxToken);
    
    if (isValid) {
      return new Response(
        JSON.stringify({ success: true, message: 'Dropbox connection successful' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Dropbox connection failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error testing Dropbox connection:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Connection test failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function testDropboxConnectionInternal(dropboxPath: string, dropboxToken: string): Promise<boolean> {
  try {
    console.log(`Testing Dropbox connection with path: ${dropboxPath}`);
    
    // Test by creating a small test file
    const testContent = 'Connection test';
    const testFileName = 'connection_test.txt';
    
    // Fix path construction to avoid double slashes
    const normalizedPath = dropboxPath.endsWith('/') ? dropboxPath.slice(0, -1) : dropboxPath;
    const fullTestPath = normalizedPath === '' ? `/${testFileName}` : `${normalizedPath}/${testFileName}`;
    
    console.log(`Attempting to upload test file to: ${fullTestPath}`);
    
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: fullTestPath,
          mode: 'overwrite'
        })
      },
      body: testContent
    });

    if (response.ok) {
      console.log('Test file upload successful, cleaning up...');
      // Clean up test file
      const deleteResponse = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: fullTestPath
        })
      });
      
      if (deleteResponse.ok) {
        console.log('Test file cleanup successful');
      } else {
        console.warn('Test file cleanup failed, but connection test passed');
      }

      return true;
    } else {
      const errorText = await response.text();
      console.error('Dropbox connection test failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('Error in Dropbox connection test:', error);
    return false;
  }
}

async function uploadToDropbox(token: string, folderPath: string, fileName: string, content: string): Promise<{ success: boolean; dropboxUrl?: string }> {
  try {
    console.log(`Starting Dropbox upload - File: ${fileName}, Folder: ${folderPath}`);
    console.log(`Content size: ${content.length} characters`);
    
    // Construct the full path - ensure no duplicate folder names
    // Remove any leading slash from folderPath if it exists, then add one
    let cleanFolderPath = folderPath.startsWith('/') ? folderPath : `/${folderPath}`;
    
    // Ensure no trailing slash
    if (cleanFolderPath.endsWith('/')) {
      cleanFolderPath = cleanFolderPath.slice(0, -1);
    }
    
    const fullPath = `${cleanFolderPath}/${fileName}`;
    
    console.log(`Full upload path: ${fullPath}`);
    
    const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: fullPath,
          mode: 'overwrite'
        })
      },
      body: content
    });

    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('File uploaded successfully to Dropbox:', result);
      
      // Get shareable link for the file
      try {
        console.log('Creating shareable link...');
        const linkResponse = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: fullPath,
            settings: {
              requested_visibility: 'public'
            }
          })
        });

        if (linkResponse.ok) {
          const linkResult = await linkResponse.json();
          console.log('Shareable link created:', linkResult.url);
          return { success: true, dropboxUrl: linkResult.url };
        } else {
          const linkError = await linkResponse.text();
          console.warn('Failed to create shareable link:', linkResponse.status, linkError);
          // Even if link creation fails, the upload was successful
          return { success: true };
        }
      } catch (linkError) {
        console.warn('Error creating shareable link:', linkError);
        return { success: true };
      }
    } else {
      const errorText = await uploadResponse.text();
      console.error('Dropbox upload failed:', uploadResponse.status, errorText);
      return { success: false };
    }
  } catch (error) {
    console.error('Error uploading to Dropbox:', error);
    return { success: false };
  }
}

function generateDataExplorerCSV(data: DataEntry[], sources: Source[]): string {
  if (data.length === 0) return 'No data available';

  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : `Unknown (${sourceId.substring(0, 8)}...)`;
  };

  // Preferred column order
  const preferredOrder = [
    'source', 'created_at', 'fname', 'phone', 'lname', 'address', 'city', 'state', 'zip', 'email', 'ip', 'jornaya', 'trusted_form_url'
  ];

  const getColumns = () => {
    if (data.length === 0) return ['No Data'];
    
    const allKeys = new Set<string>();
    allKeys.add('source');
    allKeys.add('created_at');
    
    data.forEach(entry => {
      if (entry && entry.metadata && typeof entry.metadata === 'object') {
        Object.keys(entry.metadata).forEach(key => {
          if (key !== 'clientIp' && key !== 'receivedAt') {
            allKeys.add(key);
          }
        });
      }
    });
    
    // Sort: preferred columns first in order, then remaining alphabetically
    const allKeysArray = Array.from(allKeys);
    const ordered: string[] = [];
    for (const col of preferredOrder) {
      if (allKeysArray.includes(col)) ordered.push(col);
    }
    for (const col of allKeysArray) {
      if (!ordered.includes(col)) ordered.push(col);
    }
    return ordered;
  };

  const columns = getColumns();

  // Helper function to get display name for columns (matches Data Explorer)
  const getDisplayName = (column: string): string => {
    const displayNames: Record<string, string> = {
      'source': 'Source',
      'created_at': 'Date'
    };
    return displayNames[column] || column;
  };

  // Helper function to get value from entry (matches Data Explorer logic)
  const getValue = (entry: DataEntry, column: string): any => {
    if (column === 'source') {
      return entry.source_id || entry.sourceId;
    }
    if (column === 'created_at') {
      return entry.created_at || entry.timestamp;
    }
    // Check if the column is a metadata field
    if (entry.metadata && typeof entry.metadata === 'object') {
      return entry.metadata[column];
    }
    return entry[column];
  };

  // Helper function to format cell value (matches Data Explorer logic)
  const formatCellValue = (key: string, value: any): string => {
    if (value === undefined || value === null) return '-';
    if (key === 'source') return getSourceName(value);
    if (key === 'created_at') {
      try {
        const d = new Date(value);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
      } catch (e) {
        return value;
      }
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Create CSV headers with display names
  const headers = columns.map(column => getDisplayName(column));
  const csvRows = [headers.join(',')];

  // Create data rows using the same logic as the Data Explorer
  data.forEach(entry => {
    const row = columns.map(column => {
      const value = getValue(entry, column);
      const formattedValue = formatCellValue(column, value);
      
      // Handle CSV escaping - ensure exact match with table display
      if (formattedValue === undefined || formattedValue === null || formattedValue === '-') {
        return '';
      }
      
      const stringValue = String(formattedValue);
      // Escape quotes and wrap in quotes if contains commas, quotes, or newlines
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

function generateDataExplorerJSON(data: DataEntry[], sources: Source[]): string {
  if (data.length === 0) return JSON.stringify([]);

  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : `Unknown (${sourceId.substring(0, 8)}...)`;
  };

  // Transform data using the same logic as Data Explorer
  const transformedData = data.map(entry => {
    const transformedEntry: any = {};

    // Always include source and created_at first (matches Data Explorer)
    const sourceId = entry.source_id || entry.sourceId;
    transformedEntry['Source'] = getSourceName(sourceId);
    transformedEntry['Date/Time'] = entry.created_at || entry.timestamp;

    // Flatten metadata properties, excluding clientIp and receivedAt
    if (entry.metadata && typeof entry.metadata === 'object') {
      Object.keys(entry.metadata).forEach(metaKey => {
        if (metaKey !== 'clientIp' && metaKey !== 'receivedAt') {
          transformedEntry[metaKey] = entry.metadata[metaKey];
        }
      });
    }

    return transformedEntry;
  });

  return JSON.stringify(transformedData, null, 2);
}

serve(handler);
