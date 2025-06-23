
-- Create a function to trigger daily backups for all active users
CREATE OR REPLACE FUNCTION trigger_daily_backups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Schedule the cron job to run daily at 2 AM UTC
SELECT cron.schedule(
  'daily-dropbox-backup',
  '0 2 * * *', -- Every day at 2:00 AM UTC
  $$SELECT trigger_daily_backups();$$
);
