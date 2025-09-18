-- Update the cron job to run at 2:00 AM PST (9:00 AM UTC during PDT, 10:00 AM UTC during PST)
-- First, unschedule the existing job if it exists
SELECT cron.unschedule('daily-backup-trigger');

-- Schedule new job at 2:00 AM PST
-- During PDT (March-November): 2:00 AM PDT = 9:00 AM UTC  
-- During PST (November-March): 2:00 AM PST = 10:00 AM UTC
-- Using 9:00 AM UTC to handle current PDT period
SELECT cron.schedule(
  'daily-backup-trigger',
  '0 9 * * *', -- 9:00 AM UTC = 2:00 AM PDT
  'SELECT public.trigger_daily_backups();'
);