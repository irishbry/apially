import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
  const chunks = chunkArray(entryIds, 100);
  let totalUpdated = 0;
  
  console.log(`Processing ${chunks.length} chunks of records for user ${userId}`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} records`);
    
    try {
      const { error: updateError, data: updateData } = await supabase
        .from('data_entries')
        .update({
          backed_up_dropbox: true,
          last_dropbox_backup: new Date().toISOString().split('T')[0]
        })
        .in('id', chunk)
        .select('id, backed_up_dropbox, last_dropbox_backup');

      if (updateError) {
        console.error(`Error updating chunk ${i + 1}:`, updateError);
        // Continue with other chunks even if one fails
      } else {
        const chunkUpdated = updateData?.length || 0;
        totalUpdated += chunkUpdated;
        console.log(`Chunk ${i + 1} updated ${chunkUpdated} records successfully`);
      }
      
      // Add a small delay between chunks to avoid overwhelming the database
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      // Continue with other chunks
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
    const { userId, format = 'csv', dropboxPath, dropboxToken, action = 'backup' } = await req.json();

    // Handle different actions
    if (action === 'test_connection') {
      return await testDropboxConnection(dropboxPath, dropboxToken);
    }

    if (action === 'scheduled_backup') {
      return await processScheduledBackups();
    }

    // Individual backup - userId is optional now
    if (userId) {
      return await processIndividualBackup(userId, format, dropboxPath, dropboxToken);
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
    // Check if access token is expired or will expire soon (within 1 hour)
    const now = new Date();
    const expiresAt = new Date(config.access_token_expires_at);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (expiresAt > oneHourFromNow) {
      // Token is still valid
      console.log('Access token is still valid');
      return config;
    }

    console.log('Access token expired or expiring soon, refreshing...');

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
    return null;
  }
}

async function processIndividualBackup(
  userId: string, 
  format: string, 
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

  const result = await createBackupForUser(userId, format, finalDropboxPath, finalDropboxToken, 'manual');
  
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
  format: string, 
  dropboxPath: string, 
  dropboxToken: string,
  backupType: string = 'manual'
): Promise<{ success: boolean; fileName?: string; path?: string; error?: string; backedUpCount?: number; backupLogId?: string }> {
  let backupLogId: string | null = null;
  
  try {
    console.log(`Starting backup for user: ${userId}, type: ${backupType}`);
    console.log(`Dropbox config - Path: ${dropboxPath}, Token present: ${!!dropboxToken}`);
    
    // For scheduled backups, get previous day's data
    // For manual backups, get data that hasn't been backed up yet
    let userData, userError;
    
    if (backupType === 'scheduled') {
      // Get previous day's data (from 00:00:00 to 23:59:59 of previous day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      
      console.log(`Fetching scheduled backup data from ${startOfYesterday.toISOString()} to ${endOfYesterday.toISOString()}`);
      
      const result = await supabase
        .from('data_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startOfYesterday.toISOString())
        .lte('created_at', endOfYesterday.toISOString())
        .order('created_at', { ascending: false });
      
      userData = result.data;
      userError = result.error;
    } else {
      // Manual backup: get data that hasn't been backed up to Dropbox yet
      const result = await supabase
        .from('data_entries')
        .select('*')
        .eq('user_id', userId)
        .or('backed_up_dropbox.is.null,backed_up_dropbox.eq.false')
        .order('created_at', { ascending: false });
      
      userData = result.data;
      userError = result.error;
    }

    if (userError) {
      console.error(`Error fetching data for user ${userId}:`, userError);
      return { success: false, error: 'Failed to fetch user data' };
    }

    console.log(`Query returned ${userData?.length || 0} entries for user ${userId}`);

    if (!userData || userData.length === 0) {
      console.log(`No new data to backup for user ${userId}`);
      return { success: true, fileName: '', path: '', backedUpCount: 0 };
    }

    console.log(`Found ${userData.length} entries to backup for user ${userId}`);

    // Get user's sources
    const { data: sourcesData } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', userId);

    const sources = sourcesData || [];

    // Generate backup content using Data Explorer format
    let backupContent = '';
    let fileName = '';

    // Generate filename with source names and date range
    const generateFileName = (data: DataEntry[], sources: Source[], backupType: string, format: string): string => {
      if (backupType === 'scheduled') {
        // For scheduled backups, use previous day's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        // Get unique source names from the data
        const sourceIds = [...new Set(data.map(entry => entry.source_id).filter(Boolean))];
        const sourceNames = sourceIds.map(id => {
          const source = sources.find(s => s.id === id);
          return source ? source.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown';
        });
        
        if (sourceNames.length === 0) {
          return `backup_${dateStr}_no_sources.${format}`;
        } else if (sourceNames.length === 1) {
          return `backup_${dateStr}_${sourceNames[0]}.${format}`;
        } else {
          return `backup_${dateStr}_${sourceNames.length}_sources.${format}`;
        }
      } else {
        // For manual backups, use current date
        const currentDate = new Date().toISOString().split('T')[0];
        return `manual_backup_${currentDate}.${format}`;
      }
    };

    fileName = generateFileName(userData || [], sources, backupType, format);

    if (format === 'csv') {
      backupContent = generateDataExplorerCSV(userData || [], sources);
    } else {
      backupContent = generateDataExplorerJSON(userData || [], sources);
    }

    console.log(`Generated backup content (${backupContent.length} characters) for user ${userId}, file: ${fileName}`);

    const fileSize = new Blob([backupContent]).size;

    // Create backup log entry first
    const { data: backupLog, error: logError } = await supabase
      .from('backup_logs')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_path: `${dropboxPath}/${fileName}`,
        record_count: userData.length,
        backup_type: backupType,
        format: format,
        status: 'processing',
        file_size: fileSize
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating backup log:', logError);
    } else {
      backupLogId = backupLog.id;
      console.log(`Created backup log with ID: ${backupLogId}`);
    }

    // Test Dropbox connection first
    console.log('Testing Dropbox connection before upload...');
    const connectionValid = await testDropboxConnectionInternal(dropboxPath, dropboxToken);
    if (!connectionValid) {
      console.error('Dropbox connection test failed before upload');
      if (backupLogId) {
        await supabase
          .from('backup_logs')
          .update({ status: 'failed' })
          .eq('id', backupLogId);
      }
      return { success: false, error: 'Dropbox connection failed' };
    }
    console.log('Dropbox connection test passed');

    // Upload to both Supabase Storage and Dropbox in parallel
    console.log('Starting parallel uploads to Storage and Dropbox...');
    const [storageResult, dropboxResult] = await Promise.allSettled([
      uploadToSupabaseStorage(fileName, backupContent, userId),
      uploadToDropbox(dropboxToken, dropboxPath, fileName, backupContent)
    ]);

    let storagePath: string | null = null;
    let dropboxUrl: string | null = null;
    let hasError = false;
    let errorMessage = '';

    // Check storage upload result
    if (storageResult.status === 'fulfilled' && storageResult.value.success) {
      storagePath = storageResult.value.path;
      console.log(`Supabase Storage upload successful: ${storagePath}`);
    } else {
      const error = storageResult.status === 'rejected' ? storageResult.reason : 'Unknown storage error';
      console.error('Supabase Storage upload failed:', error);
      hasError = true;
      errorMessage += 'Storage upload failed. ';
    }

    // Check Dropbox upload result
    if (dropboxResult.status === 'fulfilled' && dropboxResult.value.success) {
      dropboxUrl = dropboxResult.value.dropboxUrl;
      console.log(`Dropbox upload successful, URL: ${dropboxUrl}`);
    } else {
      const error = dropboxResult.status === 'rejected' ? dropboxResult.reason : 'Unknown Dropbox error';
      console.error('Dropbox upload failed:', error);
      hasError = true;
      errorMessage += 'Dropbox upload failed. ';
    }

    // If at least one upload succeeded, mark as success
    if (storagePath || dropboxUrl) {
      console.log(`At least one upload succeeded. Storage: ${!!storagePath}, Dropbox: ${!!dropboxUrl}`);
      
      // Mark entries as backed up to Dropbox using chunked updates
      const entryIds = userData.map(entry => entry.id);
      console.log(`Marking ${entryIds.length} entries as backed up to Dropbox for user ${userId} using chunked updates`);
      
      const updateResult = await updateRecordsInChunks(entryIds, userId);
      
      if (!updateResult.success) {
        console.error('Failed to update any records in chunks');
        // Still return success since the backup was uploaded, but log the error
      } else {
        console.log(`Successfully updated ${updateResult.updatedCount} out of ${entryIds.length} entries`);
      }

      // Update backup log with success status and URLs
      if (backupLogId) {
        const logUpdateData: any = {
          status: 'completed',
          storage_path: storagePath
        };
        if (dropboxUrl) {
          logUpdateData.dropbox_url = dropboxUrl;
        }
        
        await supabase
          .from('backup_logs')
          .update(logUpdateData)
          .eq('id', backupLogId);
        
        console.log(`Updated backup log ${backupLogId} with completion status`);
      }

      return { 
        success: true, 
        fileName, 
        path: `${dropboxPath}/${fileName}`,
        backedUpCount: userData.length,
        backupLogId
      };
    } else {
      // Both uploads failed
      console.error('Both Storage and Dropbox uploads failed');
      if (backupLogId) {
        await supabase
          .from('backup_logs')
          .update({ status: 'failed' })
          .eq('id', backupLogId);
      }

      return { 
        success: false, 
        error: errorMessage.trim() || 'Both storage and Dropbox uploads failed'
      };
    }
  } catch (error) {
    console.error(`Error creating backup for user ${userId}:`, error);
    
    // Update backup log with failure status
    if (backupLogId) {
      await supabase
        .from('backup_logs')
        .update({ status: 'failed' })
        .eq('id', backupLogId);
    }

    return { 
      success: false, 
      error: error.message 
    };
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
    const fullTestPath = `${dropboxPath}/${testFileName}`;
    
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

  // Get columns that match exactly what's shown in the Data Explorer table
  const getColumns = () => {
    if (data.length === 0) return ['No Data'];
    
    const columns = new Set<string>();
    
    // Always include source and created_at columns first (matches Data Explorer)
    columns.add('source');
    columns.add('created_at');
    
    // Extract metadata fields from all entries, excluding clientIp and receivedAt
    data.forEach(entry => {
      if (entry && entry.metadata && typeof entry.metadata === 'object') {
        Object.keys(entry.metadata).forEach(key => {
          // Exclude clientIp and receivedAt from columns (matches Data Explorer)
          if (key !== 'clientIp' && key !== 'receivedAt') {
            columns.add(key);
          }
        });
      }
    });
    
    return Array.from(columns);
  };

  const columns = getColumns();

  // Helper function to get display name for columns (matches Data Explorer)
  const getDisplayName = (column: string): string => {
    const displayNames: Record<string, string> = {
      'source': 'Source',
      'created_at': 'Date/Time'
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
        return new Date(value).toLocaleString();
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
