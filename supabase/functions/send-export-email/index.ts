import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const fileName = `${exportConfig.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
    const contentType = exportConfig.format === 'csv' ? 'text/csv' : 'application/json';
    
    console.log(`Sending email for export: ${exportConfig.name} to ${exportConfig.email}`);
    
    // Convert content to base64
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(exportContent);
    const base64Content = btoa(String.fromCharCode(...contentBytes));

    const emailHtml = `
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
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ApiAlly <noreply@rvnucrm.com>',
        to: [exportConfig.email],
        subject: `Scheduled Export: ${exportConfig.name}`,
        html: emailHtml,
        attachments: [
          {
            filename: fileName,
            content: base64Content,
            content_type: contentType,
          },
        ],
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(`Resend API error: ${resendData.message || JSON.stringify(resendData)}`);
    }

    console.log(`Email sent successfully via Resend for export: ${exportConfig.name}, id: ${resendData.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Email sent successfully to ${exportConfig.email}`,
        resendId: resendData.id,
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
