
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  exportConfig: {
    id: string;
    name: string;
    email: string;
    format: 'csv' | 'json';
    frequency: string;
  };
  exportContent: string;
  recordCount: number;
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

  console.log('Processing export email request...');

  try {
    const { exportConfig, exportContent, recordCount }: EmailRequest = await req.json();

    if (!exportConfig.email) {
      throw new Error('No email address provided');
    }

    const fileName = `${exportConfig.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
    const contentType = exportConfig.format === 'csv' ? 'text/csv' : 'application/json';
    
    console.log(`Sending email for export: ${exportConfig.name} to ${exportConfig.email}`);
    
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
          <li>New Records: ${recordCount}</li>
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

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Email sent successfully to ${exportConfig.email}` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending export email:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
