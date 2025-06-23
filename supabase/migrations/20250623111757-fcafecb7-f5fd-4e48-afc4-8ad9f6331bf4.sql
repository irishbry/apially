
-- Create a table to store Dropbox backup configurations
CREATE TABLE public.dropbox_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dropbox_path TEXT NOT NULL,
  dropbox_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  daily_backup_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.dropbox_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own dropbox config" 
  ON public.dropbox_configs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dropbox config" 
  ON public.dropbox_configs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dropbox config" 
  ON public.dropbox_configs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dropbox config" 
  ON public.dropbox_configs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dropbox_configs_updated_at 
  BEFORE UPDATE ON public.dropbox_configs 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
