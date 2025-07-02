
-- Add storage_path column to backup_logs table
ALTER TABLE public.backup_logs 
ADD COLUMN storage_path TEXT;
