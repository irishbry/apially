
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    // Create a Supabase client with the admin key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      }
    });

    // Enable REPLICA IDENTITY FULL for data_entries table
    const { error: error1 } = await supabase.rpc('enable_replica_identity_for_table', { 
      table_name: 'data_entries'
    });
    
    if (error1) {
      return new Response(JSON.stringify({ error: error1.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Enable REPLICA IDENTITY FULL for sources table
    const { error: error2 } = await supabase.rpc('enable_replica_identity_for_table', { 
      table_name: 'sources'
    });
    
    if (error2) {
      return new Response(JSON.stringify({ error: error2.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Add tables to realtime publication
    const { error: error3 } = await supabase.rpc('add_tables_to_publication', { 
      tables: ['data_entries', 'sources']
    });
    
    if (error3) {
      return new Response(JSON.stringify({ error: error3.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Realtime publication setup completed successfully' 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
