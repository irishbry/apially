
-- Fix LD_America backup log status (file was uploaded successfully before timeout)
UPDATE public.backup_logs SET status = 'completed' WHERE file_name = 'backup_2026-03-10_LD_America.csv' AND status = 'processing';

-- Clean up the attempting records from this run
UPDATE public.backup_attempts SET status = 'timed_out', error_message = 'Edge function wall-clock timeout at 150s' WHERE status = 'attempting' AND created_at > NOW() - INTERVAL '20 minutes';
