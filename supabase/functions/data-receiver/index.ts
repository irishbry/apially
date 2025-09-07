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

// Initialize rate limiter
const rateLimits = new Map<string, number[]>();
const RATE_LIMIT = 5; // 5 requests
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

// Helper function to check rate limit
function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Get existing timestamps for this identifier
  let timestamps = rateLimits.get(identifier) || [];
  
  // Filter out timestamps outside the current window
  timestamps = timestamps.filter(timestamp => timestamp > windowStart);
  
  // Add current request timestamp
  timestamps.push(now);
  
  // Update rate limit store
  rateLimits.set(identifier, timestamps);
  
  // Check if rate limit is exceeded
  if (timestamps.length > RATE_LIMIT) {
    // Calculate retry after time in seconds
    const oldestTimestampInWindow = timestamps[0];
    const retryAfter = Math.ceil((oldestTimestampInWindow + RATE_LIMIT_WINDOW - now) / 1000);
    
    return { allowed: false, retryAfter };
  }
  
  return { allowed: true };
}

// Clean up rate limiter occasionally (basic implementation)
setInterval(() => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // For each entry in the map
  for (const [identifier, timestamps] of rateLimits.entries()) {
    // Filter out old timestamps
    const newTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    if (newTimestamps.length === 0) {
      // If no timestamps remain, remove the entry
      rateLimits.delete(identifier);
    } else {
      // Otherwise, update with filtered timestamps
      rateLimits.set(identifier, newTimestamps);
    }
  }
}, 60000); // Run cleanup every minute

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
    // Extract client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Rate limit exceeded. Try again after ${rateLimitResult.retryAfter} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + (rateLimitResult.retryAfter || 60)).toString()
          }, 
          status: 429 
        }
      );
    }
    
    // Extract API Key from headers - check multiple possible header locations
    // First check X-API-Key header (preferred)
    let apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key');
    
    // If not found, fallback to authorization header (for backward compatibility)
    if (!apiKey) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      if (authHeader) {
        // Extract the raw API key, removing "Bearer " prefix if present
        apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
      }
    }
    
    console.log('Headers received:', Object.fromEntries([...req.headers.entries()]));
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'API key is required',
          code: 'AUTH_FAILED',
          details: 'Missing API key header'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('API Key received (first 4 chars):', apiKey.substring(0, 4) + '...');

    // Create a Supabase client with the admin key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      }
    });

    // Validate the API key against sources table and get the source information
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('id, name, user_id')
      .eq('api_key', apiKey)
      .eq('active', true)
      .single();

    if (sourceError || !source) {
      console.error('Source validation error:', sourceError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid or inactive API key',
          code: 'AUTH_FAILED',
          details: sourceError ? sourceError.message : 'No active source found with this API key' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Parse the request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid JSON format',
          code: 'VALIDATION_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check for duplicate email within the last 24 hours
    if (body.email) {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { data: existingEntries, error: duplicateCheckError } = await supabase
        .from('data_entries')
        .select('id, timestamp, metadata')
        .eq('user_id', source.user_id)
        .gte('timestamp', twentyFourHoursAgo.toISOString());
      
      if (duplicateCheckError) {
        console.error('Duplicate check error:', duplicateCheckError);
      } else if (existingEntries && existingEntries.length > 0) {
        // Check if any existing entry has the same email in metadata
        for (const entry of existingEntries) {
          if (entry.metadata && entry.metadata.email === body.email) {
            return new Response(
              JSON.stringify({ 
                success: false,
                message: 'Duplicate email detected. This email was already submitted within the last 24 hours.',
                code: 'DUPLICATE_EMAIL',
                details: {
                  email: body.email,
                  previousSubmission: entry.timestamp
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
            );
          }
        }
      }
    }

    // Generate a unique ID if not provided
    const entryId = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    // Add metadata to the data
    const enhancedData = {
      ...body,
      id: entryId,
      sourceId: source.id,
      source_id: source.id,
      userId: source.user_id,
      user_id: source.user_id,
      receivedAt: now,
      timestamp: body.timestamp || now,
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
        sensor_id: enhancedData.sensorId || enhancedData.sensor_id || null,
        metadata: metadata
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Failed to store data in database',
          details: dbError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update source statistics - increment data_count by 1
    const { error: updateError } = await supabase
      .from('sources')
      .update({
        last_active: new Date().toISOString()
      })
      .eq('id', source.id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Return success response with only essential fields
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data received and processed successfully',
        data: {
          id: entryId,
          timestamp: now,
          sourceId: source.id,
          ...body
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'An internal server error occurred',
        code: 'SERVER_ERROR',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
