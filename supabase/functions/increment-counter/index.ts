
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers for allowing cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get the source ID from request body or query parameters
    let sourceId;
    
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      sourceId = body.sourceId;
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      sourceId = url.searchParams.get('sourceId');
    }

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'Source ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });

    // Update the source statistics
    const { data, error } = await supabase
      .from('sources')
      .update({
        data_count: supabase.rpc('increment_counter', {}),
        last_active: new Date().toISOString()
      })
      .eq('id', sourceId)
      .select('data_count');

    if (error) {
      console.error('Error updating source stats:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update source statistics' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Counter incremented successfully',
        data: data ? data[0] : null
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
