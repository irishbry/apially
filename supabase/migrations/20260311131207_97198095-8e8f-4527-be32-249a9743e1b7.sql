
-- Delete duplicate backup logs from the second run (13:08+), keeping the first run's records
-- Also fix Elite_Mortgage processing status
DELETE FROM public.backup_logs WHERE file_name LIKE '%2026-03-10%' AND created_at >= '2026-03-11 13:08:00+00' AND file_name != 'backup_2026-03-10_Elite_Mortgage.csv' AND file_name != 'backup_2026-03-10_WCMG.csv';

-- Fix Elite_Mortgage status if still processing
UPDATE public.backup_logs SET status = 'completed' WHERE file_name = 'backup_2026-03-10_Elite_Mortgage.csv' AND status = 'processing';
