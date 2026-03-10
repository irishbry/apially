
-- Table to track when alerts were last sent per source (avoid spam)
CREATE TABLE public.source_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  alert_type text NOT NULL DEFAULT 'stale_source',
  last_alerted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_id, alert_type)
);

ALTER TABLE public.source_alerts ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view source alerts" ON public.source_alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service can manage source alerts" ON public.source_alerts
  FOR ALL TO public USING (true) WITH CHECK (true);
