ALTER TABLE public.backup_logs
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE public.backup_logs
  ALTER COLUMN file_name DROP NOT NULL,
  ALTER COLUMN file_path DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_backup_logs_source_created
  ON public.backup_logs (source_id, created_at DESC);