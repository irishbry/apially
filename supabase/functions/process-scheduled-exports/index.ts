import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledExport {
  id: string;
  user_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'json';
  delivery: 'email' | 'download';
  email?: string;
  active: boolean;
  last_export?: string;
  next_export?: string;
}

interface DataEntry {
  id: string;
  metadata: any;
  created_at: string;
  user_id: string;
  source_id?: string;
  backed_up_email?: boolean;
  last_email_backup?: string;
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

  console.log('Processing scheduled exports...');

  try {
    // Get all active scheduled exports that are due
    const now = new Date();
    const { data: dueExports, error: exportsError } = await supabase
      .from('scheduled_exports')
      .select('*')
      .eq('active', true)
      .lte('next_export', now.toISOString());

    if (exportsError) {
      console.error('Error fetching scheduled exports:', exportsError);
      return new Response(JSON.stringify({ error: exportsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${dueExports?.length || 0} due exports`);

    if (!dueExports || dueExports.length === 0) {
      return new Response(JSON.stringify({ message: 'No exports due' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const processedExports = [];
    const emailTasks = [];

    for (const exportConfig of dueExports) {
      try {
        console.log(`Processing export: ${exportConfig.name} for user: ${exportConfig.user_id}`);
        
        // Get user's data that hasn't been backed up via email yet
        const { data: userData, error: dataError } = await supabase
          .from('data_entries')
          .select('*')
          .eq('user_id', exportConfig.user_id)
          .or('backed_up_email.is.null,backed_up_email.eq.false');

        if (dataError) {
          console.error(`Error fetching data for user ${exportConfig.user_id}:`, dataError);
          continue;
        }

        console.log(`Found ${userData?.length || 0} unbacked up entries for user ${exportConfig.user_id}`);

        // Skip if no new data to backup
        if (!userData || userData.length === 0) {
          console.log(`No new data to backup for export: ${exportConfig.name}`);
          
          // Still update the next export time
          const nextExport = calculateNextExport(exportConfig.frequency, now);
          await supabase
            .from('scheduled_exports')
            .update({
              last_export: now.toISOString(),
              next_export: nextExport.toISOString(),
            })
            .eq('id', exportConfig.id);
          
          processedExports.push(`${exportConfig.name} (no new data)`);
          continue;
        }

        // Get user's sources for reference
        const { data: sourcesData, error: sourcesError } = await supabase
          .from('sources')
          .select('*')
          .eq('user_id', exportConfig.user_id);

        if (sourcesError) {
          console.error(`Error fetching sources for user ${exportConfig.user_id}:`, sourcesError);
        }

        const sources = sourcesData || [];

        // Generate export content
        let exportContent = '';

        if (exportConfig.format === 'csv') {
          exportContent = generateCSV(userData || [], sources);
          console.log('Generated CSV content:', exportContent.substring(0, 200) + '...');
        } else {
          exportContent = generateJSON(userData || [], sources);
          console.log('Generated JSON content:', exportContent.substring(0, 200) + '...');
        }

        // Handle email delivery by calling the separate email function
        if (exportConfig.delivery === 'email' && exportConfig.email) {
          console.log(`Scheduling email for export: ${exportConfig.name}`);
          
          // Call the email service asynchronously
          const emailPromise = supabase.functions.invoke('send-export-email', {
            body: {
              exportConfig: {
                id: exportConfig.id,
                name: exportConfig.name,
                email: exportConfig.email,
                format: exportConfig.format,
                frequency: exportConfig.frequency,
              },
              exportContent: exportContent,
              recordCount: userData.length,
            }
          }).then(async (response) => {
            if (response.error) {
              console.error(`Error calling email service for export ${exportConfig.name}:`, response.error);
            } else {
              console.log(`Email service called successfully for export: ${exportConfig.name}`);
              
              // Mark entries as backed up via email
              const entryIds = userData.map(entry => entry.id);
              const today = new Date().toISOString().split('T')[0];
              
              const { error: updateError } = await supabase
                .from('data_entries')
                .update({
                  backed_up_email: true,
                  last_email_backup: today
                })
                .in('id', entryIds);

              if (updateError) {
                console.error(`Error updating backup status for entries:`, updateError);
              } else {
                console.log(`Marked ${entryIds.length} entries as backed up via email`);
              }
            }
          });
          
          emailTasks.push(emailPromise);
        }

        // Calculate next export time
        const nextExport = calculateNextExport(exportConfig.frequency, now);

        // Update the export record
        const { error: updateError } = await supabase
          .from('scheduled_exports')
          .update({
            last_export: now.toISOString(),
            next_export: nextExport.toISOString(),
          })
          .eq('id', exportConfig.id);

        if (updateError) {
          console.error(`Error updating export ${exportConfig.id}:`, updateError);
        } else {
          processedExports.push(exportConfig.name);
          console.log(`Successfully processed export: ${exportConfig.name}`);
        }
      } catch (error) {
        console.error(`Error processing export ${exportConfig.name}:`, error);
      }
    }

    // Wait for all email tasks to complete in the background
    if (emailTasks.length > 0) {
      console.log(`Waiting for ${emailTasks.length} email tasks to complete...`);
      Promise.all(emailTasks).catch(error => {
        console.error('Error in email tasks:', error);
      });
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${processedExports.length} exports`,
        processed: processedExports 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-scheduled-exports:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

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
        // Properly escape CSV values
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

  // Transform data to match CSV format structure
  const transformedData = data.map(entry => {
    const transformedEntry: any = {
      'Source': getSourceName(entry.source_id),
      'Created At': new Date(entry.created_at).toLocaleString()
    };

    // Add metadata fields (excluding clientIp and receivedAt)
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

function calculateNextExport(frequency: string, from: Date): Date {
  const next = new Date(from);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  
  // Set to 8 AM
  next.setHours(8, 0, 0, 0);
  return next;
}

serve(handler);
