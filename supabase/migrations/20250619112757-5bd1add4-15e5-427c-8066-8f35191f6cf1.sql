
-- Enable the pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a table to store scheduled export configurations
CREATE TABLE IF NOT EXISTS public.scheduled_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'json')),
  delivery TEXT NOT NULL CHECK (delivery IN ('email', 'download')),
  email TEXT,
  active BOOLEAN DEFAULT true,
  last_export TIMESTAMPTZ,
  next_export TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on scheduled_exports table
ALTER TABLE public.scheduled_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled_exports
CREATE POLICY "Users can view their own scheduled exports" 
  ON public.scheduled_exports 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled exports" 
  ON public.scheduled_exports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled exports" 
  ON public.scheduled_exports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled exports" 
  ON public.scheduled_exports 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a function to process scheduled exports
CREATE OR REPLACE FUNCTION process_scheduled_exports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Schedule the cron job to run every hour
SELECT cron.schedule(
  'process-scheduled-exports',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT process_scheduled_exports();$$
);
