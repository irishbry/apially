
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async () => {
  return new Response(
    JSON.stringify({ message: "This is a placeholder. The actual increment_counter is implemented as a PostgreSQL function." }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
