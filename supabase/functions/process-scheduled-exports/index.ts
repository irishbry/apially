
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

// Initialize SMTP client
const smtpClient = new SMTPClient({
  connection: {
    hostname: Deno.env.get('SMTP_HOST') ?? '',
    port: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
    tls: true,
    auth: {
      username: Deno.env.get('SMTP_USER') ?? '',
      password: Deno.env.get('SMTP_PASSWORD') ?? '',
    },
  },
});

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

    for (const exportConfig of dueExports) {
      try {
        console.log(`Processing export: ${exportConfig.name} for user: ${exportConfig.user_id}`);
        
        // Get user's data
        const { data: userData, error: dataError } = await supabase
          .from('data_entries')
          .select('*')
          .eq('user_id', exportConfig.user_id);

        if (dataError) {
          console.error(`Error fetching data for user ${exportConfig.user_id}:`, dataError);
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
        let contentType = '';
        let fileExtension = '';

        if (exportConfig.format === 'csv') {
          exportContent = generateCSV(userData || [], sources);
          contentType = 'text/csv';
          fileExtension = 'csv';
          console.log('Generated CSV content:', exportContent.substring(0, 200) + '...');
        } else {
          exportContent = JSON.stringify(userData || [], null, 2);
          contentType = 'application/json';
          fileExtension = 'json';
        }

        // Send email if delivery method is email
        if (exportConfig.delivery === 'email' && exportConfig.email) {
          const fileName = `${exportConfig.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
          
          try {
            // Convert string to base64 properly
            const base64Content = btoa(exportContent);
            
            await smtpClient.send({
              from: Deno.env.get('SMTP_USER') ?? 'noreply@apially.com',
              to: exportConfig.email,
              subject: `Scheduled Export: ${exportConfig.name}`,
              content: "auto",
              html: `
                <h2>Your Scheduled Export is Ready</h2>
                <p>Hello,</p>
                <p>Your scheduled export "<strong>${exportConfig.name}</strong>" has been generated successfully.</p>
                <p><strong>Export Details:</strong></p>
                <ul>
                  <li>Format: ${exportConfig.format.toUpperCase()}</li>
                  <li>Frequency: ${exportConfig.frequency}</li>
                  <li>Records: ${userData?.length || 0}</li>
                  <li>Generated: ${new Date().toLocaleString()}</li>
                </ul>
                <p>Please find your data export attached to this email.</p>
                <p>Best regards,<br>ApiAlly Team</p>
              `,
              attachments: [
                {
                  filename: fileName,
                  content: base64Content,
                  encoding: "base64",
                  contentType: contentType,
                },
              ],
            });

            console.log(`Email sent successfully for export: ${exportConfig.name}`);
          } catch (emailError) {
            console.error(`Error sending email for export ${exportConfig.name}:`, emailError);
            // Continue processing even if email fails
          }
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
