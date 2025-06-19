
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  console.log('Testing SMTP configuration...');

  try {
    const { testEmail } = await req.json();
    
    if (!testEmail) {
      return new Response(
        JSON.stringify({ error: 'Please provide testEmail in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Sending test email to: ${testEmail}`);
    console.log('SMTP Config:', {
      host: Deno.env.get('SMTP_HOST'),
      port: Deno.env.get('SMTP_PORT'),
      user: Deno.env.get('SMTP_USER'),
      // Don't log password for security
    });

    await smtpClient.send({
      from: Deno.env.get('SMTP_USER') ?? 'test@example.com',
      to: testEmail,
      subject: 'SMTP Test - ApiAlly',
      content: "auto",
      html: `
        <h2>SMTP Test Email</h2>
        <p>Hello!</p>
        <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>SMTP Host: ${Deno.env.get('SMTP_HOST')}</li>
          <li>SMTP Port: ${Deno.env.get('SMTP_PORT')}</li>
          <li>From Email: ${Deno.env.get('SMTP_USER')}</li>
          <li>Sent At: ${new Date().toLocaleString()}</li>
        </ul>
        <p>If you received this email, your SMTP configuration is working properly!</p>
        <p>Best regards,<br>ApiAlly Team</p>
      `,
    });

    console.log('Test email sent successfully!');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test email sent successfully!',
        sentTo: testEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending test email:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send test email',
        details: error.message,
        config: {
          host: Deno.env.get('SMTP_HOST'),
          port: Deno.env.get('SMTP_PORT'),
          user: Deno.env.get('SMTP_USER'),
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
