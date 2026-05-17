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
  backed_up_email?: boolean;
  last_email_backup?: string;
}

interface Source {
  id: string;
  name: string;
  user_id: string;
}

const PAGE_SIZE = 1000;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Paginated fetch to avoid the 1000-row limit
async function fetchAllEntries(userId: string, sourceId?: string | null): Promise<DataEntry[]> {
  const allEntries: DataEntry[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from('data_entries')
      .select('*')
      .eq('user_id', userId)
      .or('backed_up_email.is.null,backed_up_email.eq.false');

    if (sourceId) {
      query = query.eq('source_id', sourceId);
    }

    const { data: page, error } = await query.range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error(`Error fetching entries at offset ${offset}:`, error);
      break;
    }
    if (!page || page.length === 0) break;
    allEntries.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allEntries;
}

// Update backup status in chunks
async function updateBackupStatusInChunks(entryIds: string[], chunkSize: number = 100) {
  const today = new Date().toISOString().split('T')[0];
  let totalUpdated = 0;
  
  for (let i = 0; i < entryIds.length; i += chunkSize) {
    const chunk = entryIds.slice(i, i + chunkSize);
    try {
      const { error: updateError, count } = await supabase
        .from('data_entries')
        .update({ backed_up_email: true, last_email_backup: today })
        .in('id', chunk);

      if (updateError) {
        console.error(`Error updating backup status for chunk:`, updateError);
      } else {
        totalUpdated += count || chunk.length;
      }
    } catch (error) {
      console.error(`Exception updating backup status for chunk:`, error);
    }
    
    if (i + chunkSize < entryIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`Total entries updated: ${totalUpdated} out of ${entryIds.length}`);
  return totalUpdated;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Processing scheduled exports...');

  try {
    const now = new Date();
    const body = await req.json().catch(() => ({}));
    const manualExportId = body.exportId; // For on-demand "Run Now"

    let dueExports;

    if (manualExportId) {
      // Run a specific export on demand (regardless of next_export time or active status)
      console.log(`Manual run requested for export ID: ${manualExportId}`);
      const { data, error: exportsError } = await supabase
        .from('scheduled_exports')
        .select('*')
        .eq('id', manualExportId);

      if (exportsError) {
        console.error('Error fetching export:', exportsError);
        return new Response(JSON.stringify({ error: exportsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      dueExports = data;
    } else {
      // Normal scheduled run
      const { data, error: exportsError } = await supabase
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
      dueExports = data;
    }

    console.log(`Found ${dueExports?.length || 0} exports to process`);

    if (!dueExports || dueExports.length === 0) {
      return new Response(JSON.stringify({ message: manualExportId ? 'Export not found' : 'No exports due' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const processedExports = [];
    const emailTasks = [];

    for (const exportConfig of dueExports) {
      try {
        console.log(`Processing export: ${exportConfig.name} for user: ${exportConfig.user_id}, source_id: ${exportConfig.source_id || 'all'}`);
        
        // Fetch entries with pagination, optionally filtered by source
        const userData = await fetchAllEntries(exportConfig.user_id, exportConfig.source_id);

        console.log(`Found ${userData.length} unbacked up entries for user ${exportConfig.user_id}`);

        if (userData.length === 0) {
          console.log(`No new data to backup for export: ${exportConfig.name}`);
          const nextExport = calculateNextExport(exportConfig.frequency, now);
          await supabase
            .from('scheduled_exports')
            .update({ last_export: now.toISOString(), next_export: nextExport.toISOString() })
            .eq('id', exportConfig.id);
          
          // Log the run even when no data
          await supabase.from('export_logs').insert({
            export_id: exportConfig.id,
            user_id: exportConfig.user_id,
            status: 'completed',
            record_count: 0,
          });

          processedExports.push(`${exportConfig.name} (no new data)`);
          continue;
        }

        // Get user's sources for reference
        const { data: sourcesData } = await supabase
          .from('sources')
          .select('*')
          .eq('user_id', exportConfig.user_id);

        const sources = sourcesData || [];

        // Generate export content
        const exportContent = exportConfig.format === 'csv'
          ? generateCSV(userData, sources)
          : generateJSON(userData, sources);

        console.log(`Generated ${exportConfig.format} content: ${exportContent.length} chars, ${userData.length} entries`);

        // Handle email delivery
        if (exportConfig.delivery === 'email' && exportConfig.email) {
          console.log(`Scheduling email for export: ${exportConfig.name}`);
          
          const emailPromise = supabase.functions.invoke('send-export-email', {
            body: {
              exportConfig: {
                id: exportConfig.id,
                name: exportConfig.name,
                email: exportConfig.email,
                format: exportConfig.format,
                frequency: exportConfig.frequency,
              },
              exportContent,
              recordCount: userData.length,
            }
          }).then(async (response) => {
            if (response.error) {
              console.error(`Error calling email service for export ${exportConfig.name}:`, response.error);
              // Log failure
              await supabase.from('export_logs').insert({
                export_id: exportConfig.id,
                user_id: exportConfig.user_id,
                status: 'failed',
                record_count: userData.length,
                error_message: response.error.message || 'Email delivery failed',
              });
            } else {
              console.log(`Email service called successfully for export: ${exportConfig.name}`);
              const entryIds = userData.map(entry => entry.id);
              await updateBackupStatusInChunks(entryIds, 100);
              // Log success
              await supabase.from('export_logs').insert({
                export_id: exportConfig.id,
                user_id: exportConfig.user_id,
                status: 'completed',
                record_count: userData.length,
              });
            }
          }).catch(async (error) => {
            console.error(`Exception in email service for export ${exportConfig.name}:`, error);
            await supabase.from('export_logs').insert({
              export_id: exportConfig.id,
              user_id: exportConfig.user_id,
              status: 'failed',
              record_count: userData.length,
              error_message: error.message || 'Unexpected error',
            });
          });
          
          emailTasks.push(emailPromise);
        }

        const nextExport = calculateNextExport(exportConfig.frequency, now);
        const { error: updateError } = await supabase
          .from('scheduled_exports')
          .update({ last_export: now.toISOString(), next_export: nextExport.toISOString() })
          .eq('id', exportConfig.id);

        if (updateError) {
          console.error(`Error updating export ${exportConfig.id}:`, updateError);
        } else {
          processedExports.push(exportConfig.name);
          console.log(`Successfully processed export: ${exportConfig.name}`);
        }
      } catch (error) {
        console.error(`Error processing export ${exportConfig.name}:`, error);
        // Log the error
        await supabase.from('export_logs').insert({
          export_id: exportConfig.id,
          user_id: exportConfig.user_id,
          status: 'failed',
          record_count: 0,
          error_message: error.message || 'Processing error',
        }).catch(() => {});
      }
    }

    if (emailTasks.length > 0) {
      console.log(`Waiting for ${emailTasks.length} email tasks to complete...`);
      await Promise.all(emailTasks).catch(error => {
        console.error('Error in email tasks:', error);
      });
    }

    return new Response(
      JSON.stringify({ message: `Processed ${processedExports.length} exports`, processed: processedExports }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-scheduled-exports:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

  // Preferred column order for metadata keys
  const preferredMetaOrder = ['fname', 'phone', 'lname', 'address', 'city', 'state', 'zip', 'email', 'ip', 'jornaya', 'trusted_form_url'];

  const metadataKeys = new Set<string>();
  data.forEach(entry => {
    if (entry.metadata && typeof entry.metadata === 'object') {
      Object.keys(entry.metadata).forEach(key => {
        if (key !== 'clientIp' && key !== 'receivedAt') metadataKeys.add(key);
      });
    }
  });

  // Sort metadata keys: preferred first, then remaining
  const allMetaKeys = Array.from(metadataKeys);
  const orderedMeta: string[] = [];
  for (const col of preferredMetaOrder) {
    if (allMetaKeys.includes(col)) orderedMeta.push(col);
  }
  for (const col of allMetaKeys) {
    if (!orderedMeta.includes(col)) orderedMeta.push(col);
  }

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch { return dateStr; }
  };

  const headers = ['Source', 'Date', ...orderedMeta];
  const csvRows = [headers.join(',')];

  data.forEach(entry => {
    const row = [
      `"${getSourceName(entry.source_id)}"`,
      `"${formatDate(entry.created_at)}"`,
      ...orderedMeta.map(key => {
        const value = entry.metadata?.[key];
        if (value === undefined || value === null) return '""';
        return `"${String(value).replace(/"/g, '""')}"`;
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
    const transformed: any = {
      'Source': getSourceName(entry.source_id),
      'Created At': new Date(entry.created_at).toLocaleString()
    };
    if (entry.metadata && typeof entry.metadata === 'object') {
      Object.keys(entry.metadata).forEach(key => {
        if (key !== 'clientIp' && key !== 'receivedAt') transformed[key] = entry.metadata[key];
      });
    }
    return transformed;
  });

  return JSON.stringify(transformedData, null, 2);
}

function calculateNextExport(frequency: string, from: Date): Date {
  const next = new Date(from);
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
  }
  next.setHours(8, 0, 0, 0);
  return next;
}

serve(handler);
