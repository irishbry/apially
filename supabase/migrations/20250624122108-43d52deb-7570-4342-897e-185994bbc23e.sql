
-- Add backup tracking columns to data_entries table
ALTER TABLE public.data_entries 
ADD COLUMN backed_up_email BOOLEAN DEFAULT FALSE,
ADD COLUMN backed_up_dropbox BOOLEAN DEFAULT FALSE,
ADD COLUMN last_email_backup DATE,
ADD COLUMN last_dropbox_backup DATE;

-- Create indexes for better performance when querying backup status
CREATE INDEX idx_data_entries_email_backup ON public.data_entries(backed_up_email, last_email_backup);
CREATE INDEX idx_data_entries_dropbox_backup ON public.data_entries(backed_up_dropbox, last_dropbox_backup);
