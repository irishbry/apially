-- Fix generate_unique_api_key to use the correct schema for gen_random_bytes on Supabase
-- Also ensure pgcrypto is enabled (no-op if already present)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.generate_unique_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, pg_temp'
AS $function$
DECLARE
  new_key TEXT;
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Use the extensions schema where gen_random_bytes is exposed in Supabase
    new_key := encode(extensions.gen_random_bytes(16), 'hex');

    -- Ensure uniqueness against existing sources
    SELECT EXISTS(SELECT 1 FROM public.sources WHERE api_key = new_key) INTO key_exists;

    IF NOT key_exists THEN
      RETURN new_key;
    END IF;
  END LOOP;
END;
$function$;