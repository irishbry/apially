-- Create function to count distinct sources for the current user efficiently
CREATE OR REPLACE FUNCTION public.count_distinct_sources_for_user()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT source_id)
  FROM public.data_entries
  WHERE source_id IS NOT NULL
    AND user_id = auth.uid();
$$;

-- Helpful index for DISTINCT queries by user
CREATE INDEX IF NOT EXISTS idx_data_entries_user_source ON public.data_entries(user_id, source_id);
