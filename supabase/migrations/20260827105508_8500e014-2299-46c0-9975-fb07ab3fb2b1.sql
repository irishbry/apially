ALTER TABLE public.backup_logs ADD COLUMN IF NOT EXISTS backup_date date;

UPDATE public.backup_logs
SET backup_date = (substring(file_name from '(\d{4}-\d{2}-\d{2})'))::date
WHERE backup_date IS NULL
  AND file_name ~ '\d{4}-\d{2}-\d{2}';