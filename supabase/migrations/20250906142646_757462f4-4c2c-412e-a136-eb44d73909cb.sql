-- Add better logging and error handling for backup failures
-- Create a table to track backup attempts and failures
CREATE TABLE IF NOT EXISTS public.backup_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attempt_date DATE NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'token_expired', 'config_missing'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own backup attempts" 
ON public.backup_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert backup attempts" 
ON public.backup_attempts 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_backup_attempts_user_date ON public.backup_attempts(user_id, attempt_date DESC);