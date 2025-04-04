
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers for allowing cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only POST requests are accepted.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    // Extract API Key from headers
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create a Supabase client with the admin key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      }
    });

    // Validate the API key against sources table
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('id, name, user_id')
      .eq('api_key', apiKey)
      .eq('active', true)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Parse the request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate required fields
    if (!body.sensorId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: sensorId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Add metadata to the data
    const enhancedData = {
      ...body,
      sourceId: source.id,
      userId: source.user_id,
      receivedAt: new Date().toISOString(),
      clientIp: req.headers.get('x-forwarded-for') || 'unknown',
      id: crypto.randomUUID()
    };

    // Generate a filename with timestamp and random ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${source.id}/${timestamp}_${enhancedData.id}.json`;
    const bucketName = 'source-data';

    // Create the bucket if it doesn't exist (will do nothing if it exists)
    const { error: bucketError } = await supabase
      .storage
      .createBucket(bucketName, {
        public: false,
        fileSizeLimit: 1024 * 1024, // 1MB limit per file
      });
    
    if (bucketError && bucketError.message !== 'Bucket already exists') {
      console.error('Bucket creation error:', bucketError);
    }

    // Store the data in Supabase Storage
    const { data: storedFile, error: storageError } = await supabase
      .storage
      .from(bucketName)
      .upload(filename, JSON.stringify(enhancedData, null, 2), {
        contentType: 'application/json',
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return new Response(
        JSON.stringify({ error: 'Failed to store data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update source statistics directly (without using the increment-counter function)
    const { error: updateError } = await supabase
      .from('sources')
      .update({
        data_count: supabase.rpc('increment_counter', {}),
        last_active: new Date().toISOString()
      })
      .eq('id', source.id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data received and processed successfully',
        receipt: {
          id: enhancedData.id,
          timestamp: enhancedData.receivedAt,
          source: source.name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal server error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
