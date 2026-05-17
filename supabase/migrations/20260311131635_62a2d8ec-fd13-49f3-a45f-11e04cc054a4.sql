UPDATE public.backup_logs 
SET storage_path = '3bf7ad5a-48b0-4db6-9eea-20cc005792f9/backup_2026-03-10_LD_America.csv'
WHERE file_name = 'backup_2026-03-10_LD_America.csv' AND storage_path IS NULL;

UPDATE public.backup_logs 
SET storage_path = '3bf7ad5a-48b0-4db6-9eea-20cc005792f9/backup_2026-03-10_Elite_Mortgage.csv'
WHERE file_name = 'backup_2026-03-10_Elite_Mortgage.csv' AND storage_path IS NULL;