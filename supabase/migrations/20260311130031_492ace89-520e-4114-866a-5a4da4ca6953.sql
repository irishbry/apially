
-- Clean up old 'attempting' backup_attempts that never got updated
UPDATE public.backup_attempts 
SET status = 'timed_out', error_message = 'Edge function timed out before completion'
WHERE status = 'attempting' 
AND created_at < NOW() - INTERVAL '1 hour';
