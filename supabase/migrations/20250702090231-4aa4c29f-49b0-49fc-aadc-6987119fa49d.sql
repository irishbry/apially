
-- Create a storage bucket for backup files
INSERT INTO storage.buckets (id, name, public)
VALUES ('backup-files', 'backup-files', true);

-- Create storage policies for the backup-files bucket
CREATE POLICY "Users can view their own backup files"
ON storage.objects FOR SELECT
USING (bucket_id = 'backup-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own backup files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'backup-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own backup files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'backup-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own backup files"
ON storage.objects FOR DELETE
USING (bucket_id = 'backup-files' AND auth.uid()::text = (storage.foldername(name))[1]);
