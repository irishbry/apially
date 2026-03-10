CREATE TABLE public.export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id uuid REFERENCES public.scheduled_exports(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  record_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export logs"
  ON public.export_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert export logs"
  ON public.export_logs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE INDEX idx_export_logs_export_id ON public.export_logs(export_id);
CREATE INDEX idx_export_logs_created_at ON public.export_logs(created_at DESC);