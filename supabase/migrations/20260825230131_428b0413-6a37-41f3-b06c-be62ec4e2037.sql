CREATE TABLE public.backup_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_key text NOT NULL,
  alert_type text NOT NULL DEFAULT 'backup_failure',
  details text,
  last_alerted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alert_key, alert_type)
);

GRANT SELECT ON public.backup_alerts TO authenticated;
GRANT ALL ON public.backup_alerts TO service_role;

ALTER TABLE public.backup_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view backup alerts"
  ON public.backup_alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service can manage backup alerts"
  ON public.backup_alerts FOR ALL USING (true) WITH CHECK (true);

SELECT cron.schedule(
  'backup-alert-check-hourly',
  '15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/backup-alert-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliaW9udmVnb2pvcGVidGtkZ3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTg3NjUsImV4cCI6MjA1OTE3NDc2NX0._7kHGtegDvD611bTRueytju8k-t38hQjH7fQuRjFFLE"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);