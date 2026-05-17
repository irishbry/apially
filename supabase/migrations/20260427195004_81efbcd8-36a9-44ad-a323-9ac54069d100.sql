UPDATE public.backup_attempts
SET status = 'failed',
    error_message = COALESCE(error_message, 'Stuck attempt — never finalized (cleaned up retroactively)')
WHERE status = 'attempting'
  AND created_at < now() - interval '1 hour';