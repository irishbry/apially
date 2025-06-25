
-- Add OAuth fields to dropbox_configs table
ALTER TABLE public.dropbox_configs 
ADD COLUMN IF NOT EXISTS app_key TEXT,
ADD COLUMN IF NOT EXISTS app_secret TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Update the existing dropbox_token column to be nullable since we'll use the new fields
ALTER TABLE public.dropbox_configs 
ALTER COLUMN dropbox_token DROP NOT NULL;

-- Add a comment to clarify the new structure
COMMENT ON COLUMN public.dropbox_configs.dropbox_token IS 'Legacy field - use refresh_token and access_token instead';
COMMENT ON COLUMN public.dropbox_configs.app_key IS 'Dropbox App Key from developer console';
COMMENT ON COLUMN public.dropbox_configs.app_secret IS 'Dropbox App Secret from developer console';
COMMENT ON COLUMN public.dropbox_configs.refresh_token IS 'Long-lived refresh token for OAuth';
COMMENT ON COLUMN public.dropbox_configs.access_token IS 'Short-lived access token (4 hours)';
COMMENT ON COLUMN public.dropbox_configs.token_expires_at IS 'When the current access token expires';
