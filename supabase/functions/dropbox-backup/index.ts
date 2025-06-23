
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
}

interface Source {
  id: string;
  name: string;
  user_id: string;
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

    if (action === 'setup_daily') {
      return await setupDailyBackup(userId, dropboxPath, dropboxToken);
    }

    // Default backup action
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!dropboxPath || !dropboxToken) {
      return new Response(JSON.stringify({ error: 'Dropbox configuration is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing backup for user: ${userId}`);

    // Get user's data
    const { data: userData, error: userError } = await supabase
      .from('data_entries')
      .select('*')
      .eq('user_id', userId);

    if (userError) {
      console.error('Error fetching user data:', userError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's sources
    const { data: sourcesData, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', userId);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
    }

    const sources = sourcesData || [];

    // Generate backup content
    let backupContent = '';
    let fileName = '';

    if (format === 'csv') {
      backupContent = generateCSV(userData || [], sources);
      fileName = `backup_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      backupContent = generateJSON(userData || [], sources);
      fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
    }

    console.log(`Generated backup content (${backupContent.length} characters) for file: ${fileName}`);

    // Upload to Dropbox
    const uploadSuccess = await uploadToDropbox(dropboxToken, dropboxPath, fileName, backupContent);

    if (uploadSuccess) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Backup uploaded to Dropbox successfully',
          fileName,
          path: `${dropboxPath}/${fileName}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to upload backup to Dropbox'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

async function testDropboxConnection(dropboxPath: string, dropboxToken: string): Promise<Response> {
  try {
    console.log('Testing Dropbox connection...');
    
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

      return new Response(
        JSON.stringify({ success: true, message: 'Dropbox connection successful' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error('Dropbox connection test failed:', errorText);
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

async function setupDailyBackup(userId: string, dropboxPath: string, dropboxToken: string): Promise<Response> {
  try {
    console.log('Setting up daily backup for user:', userId);
    
    // Create a cron job that runs daily at 2 AM
    const { data, error } = await supabase.rpc('schedule_daily_backup', {
      user_id: userId,
      dropbox_path: dropboxPath,
      dropbox_token: dropboxToken
    });

    if (error) {
      console.error('Error setting up daily backup:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to setup daily backup' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Daily backup scheduled successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error setting up daily backup:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to setup daily backup' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function uploadToDropbox(token: string, folderPath: string, fileName: string, content: string): Promise<boolean> {
  try {
    console.log(`Uploading ${fileName} to Dropbox folder: ${folderPath}`);
    
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

function generateCSV(data: DataEntry[], sources: Source[]): string {
  if (data.length === 0) return 'No data available';

  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : sourceId;
  };

  // Get all unique metadata keys
  const metadataKeys = new Set<string>();
  data.forEach(entry => {
    if (entry.metadata && typeof entry.metadata === 'object') {
      Object.keys(entry.metadata).forEach(key => {
        if (key !== 'clientIp' && key !== 'receivedAt') {
          metadataKeys.add(key);
        }
      });
    }
  });

  const headers = ['Source', 'Created At', ...Array.from(metadataKeys)];
  const csvRows = [headers.join(',')];

  data.forEach(entry => {
    const row = [
      `"${getSourceName(entry.source_id)}"`,
      `"${new Date(entry.created_at).toLocaleString()}"`,
      ...Array.from(metadataKeys).map(key => {
        const value = entry.metadata?.[key];
        if (value === undefined || value === null) return '""';
        const stringValue = String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

function generateJSON(data: DataEntry[], sources: Source[]): string {
  if (data.length === 0) return JSON.stringify([]);

  const getSourceName = (sourceId: string | undefined): string => {
    if (!sourceId) return 'Unknown';
    const source = sources.find(s => s.id === sourceId);
    return source ? source.name : sourceId;
  };

  const transformedData = data.map(entry => {
    const transformedEntry: any = {
      'Source': getSourceName(entry.source_id),
      'Created At': new Date(entry.created_at).toLocaleString()
    };

    if (entry.metadata && typeof entry.metadata === 'object') {
      Object.keys(entry.metadata).forEach(key => {
        if (key !== 'clientIp' && key !== 'receivedAt') {
          transformedEntry[key] = entry.metadata[key];
        }
      });
    }

    return transformedEntry;
  });

  return JSON.stringify(transformedData, null, 2);
}

serve(handler);
