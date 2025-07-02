
-- Create backup_logs table to store Dropbox backup information
CREATE TABLE public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  dropbox_url TEXT,
  file_size BIGINT,
  record_count INTEGER NOT NULL DEFAULT 0,
  backup_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'scheduled'
  format TEXT NOT NULL DEFAULT 'csv', -- 'csv' or 'json'
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'failed', 'processing'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for backup_logs
CREATE POLICY "Users can view their own backup logs" 
  ON public.backup_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backup logs" 
  ON public.backup_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup logs" 
  ON public.backup_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backup logs" 
  ON public.backup_logs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_backup_logs_updated_at 
  BEFORE UPDATE ON public.backup_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
