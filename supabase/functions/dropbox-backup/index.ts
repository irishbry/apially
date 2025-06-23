
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
  is_active: boolean;
  daily_backup_enabled: boolean;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

    finalDropboxPath = config.dropbox_path;
    finalDropboxToken = config.dropbox_token;
  }

  const result = await createBackupForUser(userId, format, finalDropboxPath, finalDropboxToken);
  
  if (result.success) {
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Backup uploaded to Dropbox successfully',
        fileName: result.fileName,
        path: result.path
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } else {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: result.error || 'Failed to upload backup to Dropbox'
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
        
        // Validate Dropbox configuration
        if (!config.dropbox_path || !config.dropbox_token) {
          console.error(`Invalid Dropbox configuration for user ${config.user_id}`);
          errorCount++;
          results.push({
            userId: config.user_id,
            success: false,
            error: 'Invalid Dropbox configuration'
          });
          continue;
        }

        // Test Dropbox connection first
        const connectionValid = await testDropboxConnectionInternal(config.dropbox_path, config.dropbox_token);
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
        const result = await createBackupForUser(config.user_id, 'csv', config.dropbox_path, config.dropbox_token);

        if (result.success) {
          successCount++;
          console.log(`Backup successful for user: ${config.user_id}`);
          results.push({
            userId: config.user_id,
            success: true,
            fileName: result.fileName,
            path: result.path
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
  dropboxToken: string
): Promise<{ success: boolean; fileName?: string; path?: string; error?: string }> {
  try {
    // Get user's data
    const { data: userData, error: userError } = await supabase
      .from('data_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (userError) {
      console.error(`Error fetching data for user ${userId}:`, userError);
      return { success: false, error: 'Failed to fetch user data' };
    }

    // Get user's sources
    const { data: sourcesData } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', userId);

    const sources = sourcesData || [];

    // Generate backup content using Data Explorer format
    let backupContent = '';
    let fileName = '';

    if (format === 'csv') {
      backupContent = generateDataExplorerCSV(userData || [], sources);
      fileName = `backup_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      backupContent = generateDataExplorerJSON(userData || [], sources);
      fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
    }

    console.log(`Generated backup content (${backupContent.length} characters) for user ${userId}, file: ${fileName}`);

    // Upload to Dropbox - save directly in the specified path
    const uploadSuccess = await uploadToDropbox(dropboxToken, dropboxPath, fileName, backupContent);

    if (uploadSuccess) {
      return { 
        success: true, 
        fileName, 
        path: `${dropboxPath}/${fileName}` 
      };
    } else {
      return { 
        success: false, 
        error: 'Failed to upload to Dropbox' 
      };
    }
  } catch (error) {
    console.error(`Error creating backup for user ${userId}:`, error);
    return { 
      success: false, 
      error: error.message 
    };
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
    // Test by creating a small test file
    const testContent = 'Connection test';
    const testFileName = 'connection_test.txt';
    
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dropboxToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: `${dropboxPath}/${testFileName}`,
          mode: 'overwrite'
        })
      },
      body: testContent
    });

    if (response.ok) {
      // Clean up test file
      await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dropboxToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: `${dropboxPath}/${testFileName}`
        })
      });

      return true;
    } else {
      const errorText = await response.text();
      console.error('Dropbox connection test failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error in Dropbox connection test:', error);
    return false;
  }
}

async function uploadToDropbox(token: string, folderPath: string, fileName: string, content: string): Promise<boolean> {
  try {
    console.log(`Uploading ${fileName} directly to Dropbox path: ${folderPath}`);
    
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: `${folderPath}/${fileName}`,
          mode: 'overwrite'
        })
      },
      body: content
    });

    if (response.ok) {
      const result = await response.json();
      console.log('File uploaded successfully:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error('Dropbox upload failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error uploading to Dropbox:', error);
    return false;
  }
}

function generateDataExplorerCSV(data: DataEntry[], sources: Source[]): string {
  if (data.length === 0) return 'No data available';

  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : `Unknown (${sourceId.substring(0, 8)}...)`;
  };

  // Get all columns that would appear in the Data Explorer
  const getColumns = () => {
    if (data.length === 0) return ['No Data'];
    
    const priorityKeys = ['timestamp', 'id', 'sourceId', 'source_id', 'sensorId', 'sensor_id', 'fileName', 'file_name'];
    const allKeys = new Set<string>();
    
    priorityKeys.forEach(key => allKeys.add(key));
    
    data.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (!priorityKeys.includes(key)) {
          allKeys.add(key);
        }
      });
      
      // Add metadata keys
      if (entry.metadata && typeof entry.metadata === 'object') {
        Object.keys(entry.metadata).forEach(key => {
          if (key !== 'clientIp' && key !== 'receivedAt') {
            allKeys.add(`metadata.${key}`);
          }
        });
      }
    });
    
    return Array.from(allKeys);
  };

  const columns = getColumns();

  // Helper function to get display name for columns
  const getDisplayName = (column: string): string => {
    const displayNames: Record<string, string> = {
      'sourceId': 'Source',
      'source_id': 'Source',
      'sensorId': 'Sensor ID',
      'sensor_id': 'Sensor ID',
      'fileName': 'File Name',
      'file_name': 'File Name'
    };
    return displayNames[column] || column;
  };

  // Helper function to get value from entry (matching Data Explorer logic)
  const getValue = (entry: DataEntry, column: string): any => {
    if (column.startsWith('metadata.')) {
      const metadataKey = column.replace('metadata.', '');
      return entry.metadata?.[metadataKey];
    }
    return entry[column];
  };

  // Helper function to format cell value (matching Data Explorer logic)
  const formatCellValue = (key: string, value: any): string => {
    if (value === undefined || value === null) return '-';
    if (key === 'sourceId' || key === 'source_id') return getSourceName(value);
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
      
      // Handle CSV escaping
      if (formattedValue === undefined || formattedValue === null || formattedValue === '-') {
        return '""';
      }
      
      const stringValue = String(formattedValue);
      // Escape quotes and wrap in quotes if contains commas, quotes, or newlines
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return `"${stringValue}"`;
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

    // Process all entry properties
    Object.keys(entry).forEach(key => {
      if (key === 'sourceId' || key === 'source_id') {
        transformedEntry['Source'] = getSourceName(entry[key]);
      } else if (key === 'sensorId' || key === 'sensor_id') {
        transformedEntry['Sensor ID'] = entry[key];
      } else if (key === 'fileName' || key === 'file_name') {
        transformedEntry['File Name'] = entry[key];
      } else if (key === 'metadata') {
        // Flatten metadata properties
        if (entry.metadata && typeof entry.metadata === 'object') {
          Object.keys(entry.metadata).forEach(metaKey => {
            if (metaKey !== 'clientIp' && metaKey !== 'receivedAt') {
              transformedEntry[metaKey] = entry.metadata[metaKey];
            }
          });
        }
      } else {
        transformedEntry[key] = entry[key];
      }
    });

    return transformedEntry;
  });

  return JSON.stringify(transformedData, null, 2);
}

serve(handler);
