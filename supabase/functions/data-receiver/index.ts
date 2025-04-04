
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
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required', code: 401, message: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Clean the API key if it's in the Authorization header format "Bearer <token>"
    const cleanApiKey = apiKey.startsWith('Bearer ') ? apiKey.substring(7).trim() : apiKey;

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
      .eq('api_key', cleanApiKey)
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
    if (!body.sensorId && !body.sensor_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: sensorId or sensor_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate a unique ID if not provided
    const entryId = body.id || crypto.randomUUID();

    // Add metadata to the data
    const enhancedData = {
      ...body,
      id: entryId,
      sourceId: source.id,
      source_id: source.id,
      userId: source.user_id,
      user_id: source.user_id,
      receivedAt: new Date().toISOString(),
      timestamp: body.timestamp || new Date().toISOString(),
      clientIp: req.headers.get('x-forwarded-for') || 'unknown'
    };

    // Generate a filename with timestamp and ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${entryId}.json`;
    const filePath = `${source.id}/${filename}`;
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
      .upload(filePath, JSON.stringify(enhancedData, null, 2), {
        contentType: 'application/json',
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      // Continue with database insert even if storage fails
    }

    // Extract metadata for database
    const { 
      sourceId, source_id, id, 
      sensorId, sensor_id, 
      timestamp: dataTimestamp, userId, user_id,
      ...metadata 
    } = enhancedData;

    // Insert into the data_entries table
    const { data: dbEntry, error: dbError } = await supabase
      .from('data_entries')
      .insert({
        id: entryId,
        source_id: source.id,
        user_id: source.user_id,
        file_name: filename,
        file_path: filePath,
        timestamp: enhancedData.timestamp,
        sensor_id: enhancedData.sensorId || enhancedData.sensor_id,
        metadata: metadata
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store data in database' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update source statistics
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
          id: entryId,
          timestamp: enhancedData.timestamp,
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
