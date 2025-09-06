-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.generate_unique_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_key TEXT;
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 32-character string
    new_key := encode(gen_random_bytes(16), 'hex');
    
    -- Check if this key already exists
    SELECT EXISTS(SELECT 1 FROM public.sources WHERE api_key = new_key) INTO key_exists;
    
    -- If it doesn't exist, we can use it
    IF NOT key_exists THEN
      RETURN new_key;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_source_schema(p_api_key text, p_schema jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sources
  SET schema = p_schema
  WHERE api_key = p_api_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_scheduled_exports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the edge function to process exports
  PERFORM net.http_post(
    url := 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/process-scheduled-exports',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliaW9udmVnb2pvcGVidGtkZ3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTg3NjUsImV4cCI6MjA1OTE3NDc2NX0._7kHGtegDvD611bTRueytju8k-t38hQjH7fQuRjFFLE"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_daily_backups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the dropbox-backup edge function with scheduled_backup action
  PERFORM net.http_post(
    url := 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/dropbox-backup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliaW9udmVnb2pvcGVidGtkZ3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTg3NjUsImV4cCI6MjA1OTE3NDc2NX0._7kHGtegDvD611bTRueytju8k-t38hQjH7fQuRjFFLE"}'::jsonb,
    body := '{"action": "scheduled_backup"}'::jsonb
  );
END;
$$;