-- Add indexes to data_entries table to improve query performance
-- This will prevent statement timeout errors

-- Index for user_id lookups (used in RLS policies and queries)
CREATE INDEX IF NOT EXISTS idx_data_entries_user_id ON public.data_entries(user_id);

-- Index for source_id filtering
CREATE INDEX IF NOT EXISTS idx_data_entries_source_id ON public.data_entries(source_id);

-- Index for timestamp ordering
CREATE INDEX IF NOT EXISTS idx_data_entries_created_at ON public.data_entries(created_at DESC);

-- Composite index for user-specific time-based queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_data_entries_user_created ON public.data_entries(user_id, created_at DESC);

-- Index for backup status queries
CREATE INDEX IF NOT EXISTS idx_data_entries_backed_up_dropbox ON public.data_entries(backed_up_dropbox) WHERE backed_up_dropbox = false;

-- Add indexes to sources table as well for better join performance
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON public.sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_api_key ON public.sources(api_key);