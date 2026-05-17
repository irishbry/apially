
SELECT cron.schedule(
  'source-health-check-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/source-health-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliaW9udmVnb2pvcGVidGtkZ3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTg3NjUsImV4cCI6MjA1OTE3NDc2NX0._7kHGtegDvD611bTRueytju8k-t38hQjH7fQuRjFFLE"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);
