-- Update the cron job to trigger at 2:00 AM PST (10:00 AM UTC)
-- First, unschedule the existing job
SELECT cron.unschedule('daily-dropbox-backup');

-- Schedule the new job to run at 2:00 AM PST (10:00 AM UTC)
SELECT cron.schedule(
  'daily-dropbox-backup',
  '0 10 * * *', -- 10:00 AM UTC = 2:00 AM PST
  'SELECT trigger_daily_backups();'
);