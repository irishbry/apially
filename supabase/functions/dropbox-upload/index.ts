
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DropboxUploadRequest {
  dropboxLink: string;
  content: string;
  fileName: string;
  contentType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dropboxLink, content, fileName, contentType }: DropboxUploadRequest = await req.json();

    if (!dropboxLink || !content || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Uploading file ${fileName} to Dropbox`);

    // Convert Dropbox share link to upload API endpoint
    const uploadUrl = convertToUploadUrl(dropboxLink);
    
    if (!uploadUrl) {
      return new Response(
        JSON.stringify({ error: 'Invalid Dropbox link format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Upload file to Dropbox
    const formData = new FormData();
    const blob = new Blob([content], { type: contentType });
    formData.append('file', blob, fileName);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      console.error('Dropbox upload failed:', uploadResponse.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to upload to Dropbox' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Successfully uploaded ${fileName} to Dropbox`);

    return new Response(
      JSON.stringify({ success: true, message: 'File uploaded to Dropbox successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in dropbox-upload function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

function convertToUploadUrl(shareLink: string): string | null {
  try {
    // Convert Dropbox share link to upload URL
    // Example: https://www.dropbox.com/scl/fo/abc123/h?rlkey=xyz&dl=0
    // Should become: https://content.dropboxapi.com/2/files/upload
    
    if (!shareLink.includes('dropbox.com')) {
      return null;
    }

    // For now, we'll use the Dropbox content upload URL
    // This is a simplified approach - in production, you'd want to use proper Dropbox API
    const url = new URL(shareLink);
    
    // Convert to file request URL (simplified)
    if (shareLink.includes('/scl/fo/')) {
      // Extract folder ID and construct upload URL
      const parts = shareLink.split('/scl/fo/')[1];
      if (parts) {
        const folderId = parts.split('/')[0];
        // This is a simplified approach - actual Dropbox API integration would require OAuth
        return `https://content.dropboxapi.com/2/files/upload_session/start`;
      }
    }

    // Fallback: try to convert share link to direct upload
    if (shareLink.includes('dl=0')) {
      return shareLink.replace('dl=0', 'dl=1');
    }

    return shareLink;
  } catch (error) {
    console.error('Error converting Dropbox URL:', error);
    return null;
  }
}

serve(handler);
