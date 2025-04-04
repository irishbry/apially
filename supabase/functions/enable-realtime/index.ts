
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const table = searchParams.get('table');

    if (!table) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: table' 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create a Supabase client with the admin key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      }
    });

    // First run the SQL to enable REPLICA IDENTITY FULL for the table
    const { data: replicaData, error: replicaError } = await supabase.rpc('enable_replica_identity_for_table', { 
      table_name: table 
    });

    if (replicaError) {
      return new Response(JSON.stringify({ 
        error: `Failed to enable REPLICA IDENTITY FULL for table ${table}: ${replicaError.message}` 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Then add the table to the publication
    const { data: pubData, error: pubError } = await supabase.rpc('add_table_to_publication', { 
      table_name: table 
    });

    if (pubError) {
      return new Response(JSON.stringify({ 
        error: `Failed to add table ${table} to publication: ${pubError.message}` 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Table ${table} configured for realtime changes successfully`
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: `Server error: ${error.message}` 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
