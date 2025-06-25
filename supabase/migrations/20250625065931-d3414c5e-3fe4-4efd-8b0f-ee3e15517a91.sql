
-- Add new columns to dropbox_configs table for OAuth credentials
ALTER TABLE public.dropbox_configs 
ADD COLUMN IF NOT EXISTS app_key TEXT,
ADD COLUMN IF NOT EXISTS app_secret TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Update the table to make dropbox_token nullable since we'll use refresh tokens
ALTER TABLE public.dropbox_configs 
ALTER COLUMN dropbox_token DROP NOT NULL;

-- Add a comment to clarify the new structure
COMMENT ON TABLE public.dropbox_configs IS 'Stores Dropbox OAuth configuration including app credentials and refresh tokens for automatic token refresh';
